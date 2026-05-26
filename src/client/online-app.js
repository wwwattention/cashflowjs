(function () {
  'use strict';

  const root = document.getElementById('online-root');
  const colors = ['green', 'red', 'blue', 'black', 'pink', 'aqua', 'orange', 'gold'];
  const sessionKey = 'cashflowSessionId';
  let socket = null;
  let state = {
    screen: 'home',
    room: null,
    players: [],
    player: null,
    gameState: null,
    tab: 'action',
    connection: 'offline',
    booting: true,
  };

  function sessionId() {
    let id = localStorage.getItem(sessionKey);
    if (!id) {
      id = `session_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
      localStorage.setItem(sessionKey, id);
    }
    return id;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function roomCodeFromUrl() {
    return new URLSearchParams(location.search).get('room');
  }

  function inviteUrl() {
    if (!state.room) return location.href;
    const url = new URL(location.href);
    url.pathname = '/online.html';
    url.search = `?room=${encodeURIComponent(state.room.inviteCode)}`;
    return url.toString();
  }

  function toast(message) {
    const node = document.createElement('div');
    node.className = 'toast';
    node.textContent = message;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 2800);
  }

  function applyRoomPayload(payload) {
    state.room = payload.room;
    state.players = payload.players || [];
    if (payload.player) state.player = payload.player;
    if (payload.gameState) {
      state.gameState = payload.gameState;
      state.screen = 'game';
    } else if (payload.room) {
      state.screen = payload.room.status === 'playing' && state.gameState ? 'game' : 'lobby';
    }
  }

  function connectSocket() {
    if (socket || typeof io !== 'function') return socket;
    socket = io();
    socket.on('connect', () => { state.connection = 'online'; render(); });
    socket.on('disconnect', () => { state.connection = 'offline'; toast('Соединение потеряно. Переподключаемся...'); render(); });
    socket.on('connect_error', () => { state.connection = 'offline'; render(); });
    socket.on('lobbyUpdated', (payload) => {
      if (state.room && payload.room.id === state.room.id) {
        state.room = payload.room;
        state.players = payload.players;
        if (state.player) state.player = payload.players.find((player) => player.id === state.player.id) || state.player;
        render();
      }
    });
    socket.on('gameStarted', (gameState) => {
      state.gameState = gameState;
      state.screen = 'game';
      state.tab = 'action';
      render();
    });
    socket.on('gameStateUpdated', (gameState) => {
      state.gameState = gameState;
      render();
    });
    socket.on('invalidAction', (error) => toast(error.message || 'Действие недоступно.'));
    socket.on('roomClosed', (payload) => {
      applyRoomPayload(payload);
      state.gameState = null;
      state.screen = 'lobby';
      toast('Комната закрыта хостом.');
      render();
    });
    return socket;
  }

  function emit(event, payload) {
    return new Promise((resolve) => {
      const s = connectSocket();
      if (!s) return resolve({ ok: false, error: 'Realtime-сервер недоступен.' });
      s.emit(event, payload, resolve);
    });
  }

  async function tryRejoinFromUrl() {
    const inviteCode = roomCodeFromUrl();
    if (!inviteCode) return false;
    const result = await emit('room:rejoin', { inviteCode, sessionId: sessionId() });
    if (!result.ok) return false;
    applyRoomPayload(result);
    return true;
  }

  async function createOnlineRoom() {
    const name = prompt('Ваше имя', 'Хост') || 'Хост';
    const result = await emit('room:create', {
      hostName: name,
      sessionId: sessionId(),
      settings: { maxPlayers: 8, randomJobs: true, quickStart: true, mode: 'standard' },
    });
    if (!result.ok) return toast(result.error);
    applyRoomPayload(result);
    history.replaceState(null, '', `/online.html?room=${encodeURIComponent(result.room.inviteCode)}`);
    render();
  }

  async function joinOnlineRoom(formOrEvent) {
    if (formOrEvent && typeof formOrEvent.preventDefault === 'function') formOrEvent.preventDefault();
    const formElement = formOrEvent && formOrEvent.currentTarget ? formOrEvent.currentTarget : formOrEvent;
    const form = new FormData(formElement);
    const result = await emit('room:join', {
      inviteCode: roomCodeFromUrl(),
      sessionId: sessionId(),
      name: form.get('name'),
      color: form.get('color'),
    });
    if (!result.ok) return toast(result.error);
    applyRoomPayload(result);
    render();
  }

  async function toggleReady() {
    const result = await emit('room:ready', {
      roomId: state.room.id,
      playerId: state.player.id,
      ready: !state.player.isReady,
    });
    if (!result.ok) return toast(result.error);
    applyRoomPayload({ ...result, player: result.players.find((player) => player.id === state.player.id) });
    render();
  }

  async function startGame() {
    const result = await emit('game:start', { roomId: state.room.id, playerId: state.player.id });
    if (!result.ok) return toast(result.error);
    state.gameState = result.gameState;
    state.screen = 'game';
    render();
  }

  async function gameAction(type, payload = {}) {
    const result = await emit('game:action', {
      id: `action_${Date.now()}`,
      roomId: state.room.id,
      playerId: state.player.id,
      type,
      payload,
      clientTime: new Date().toISOString(),
    });
    if (!result.ok) return toast(result.error);
    state.gameState = result.gameState;
    render();
  }

  async function closeOnlineRoom() {
    if (!confirm('Закрыть комнату для всех игроков?')) return;
    const result = await emit('room:close', { roomId: state.room.id, playerId: state.player.id });
    if (!result.ok) return toast(result.error);
    applyRoomPayload(result);
    state.gameState = null;
    state.screen = 'lobby';
    render();
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteUrl());
    toast('Ссылка скопирована.');
  }

  async function shareInvite() {
    const url = inviteUrl();
    if (navigator.share) await navigator.share({ title: 'CashFlow Online', text: 'Присоединяйся к игре CashFlow', url });
    else {
      await navigator.clipboard.writeText(url);
      toast('Web Share недоступен — ссылка скопирована.');
    }
  }

  function renderHome() {
    root.innerHTML = `
      <section class="hero">
        <div class="grid">
          <span class="kicker">Online MVP</span>
          <h1>CashFlow без регистрации</h1>
          <p class="lead">Создайте онлайн-комнату, отправьте ссылку друзьям и играйте с телефона. Сервер управляет ходами, клиенты только отправляют действия.</p>
        </div>
        <div class="actions">
          <button data-action="create-online">Создать онлайн-игру</button>
          <button class="secondary" data-action="local-game">Новая локальная игра</button>
        </div>
      </section>`;
  }

  function renderJoin() {
    const code = escapeHtml(roomCodeFromUrl());
    root.innerHTML = `
      <section class="hero">
        <form class="card grid" data-form="join">
          <span class="kicker">Вход в комнату</span>
          <h1>Вы присоединяетесь к игре CashFlow</h1>
          <p class="lead">Комната: <span class="room-code">${code}</span></p>
          <label>Ваше имя <input name="name" maxlength="32" required placeholder="Например, Roman"></label>
          <label>Цвет <select name="color">${colors.map((color) => `<option value="${color}">${color}</option>`).join('')}</select></label>
          <button type="button" data-action="join-room">Присоединиться</button>
          <p class="lead">Если вы уже играли с этого браузера, восстановление места выполнится автоматически.</p>
        </form>
      </section>`;
  }

  function renderLobby() {
    const readyCount = state.players.filter((player) => player.isReady || player.isHost).length;
    const isHost = state.player && state.room.hostPlayerId === state.player.id;
    const settings = state.room.settings || {};
    const isClosed = state.room.status === 'closed';
    root.innerHTML = `
      <div class="topbar">
        <button class="ghost" data-action="home">←</button>
        <span class="room-code">${escapeHtml(state.room.inviteCode)}</span>
        <span class="badge ${state.connection === 'online' ? 'ready' : 'offline'}">${state.connection === 'online' ? 'online' : 'offline'}</span>
      </div>
      <section class="layout-2">
        <div class="card grid">
          <span class="kicker">Лобби</span>
          <h1>CashFlow Online</h1>
          <div class="invite-box">
            <strong>Ссылка комнаты</strong>
            <span>${escapeHtml(inviteUrl())}</span>
            <div class="actions">
              <button data-action="copy">Скопировать ссылку</button>
              <button class="secondary" data-action="share">Поделиться</button>
            </div>
          </div>
          <div class="invite-box">
            <strong>Настройки MVP</strong><br>
            Статус: ${isClosed ? 'закрыта' : state.room.status}<br>
            Игроков: ${state.players.length}/${state.room.maxPlayers}<br>
            Профессии: ${settings.randomJobs ? 'случайно' : 'вручную'}<br>
            Режим: ${settings.quickStart ? 'быстрый старт' : 'стандартный'}
          </div>
          <div class="actions">
            <button ${isClosed ? 'disabled' : ''} data-action="ready">${state.player && state.player.isReady ? 'Я не готов' : 'Я готов'}</button>
            <button ${isHost && !isClosed ? '' : 'disabled'} data-action="start">Начать игру</button>
            <button class="secondary" ${isHost && !isClosed ? '' : 'disabled'} data-action="close-room">Закрыть комнату</button>
          </div>
        </div>
        <aside class="card grid">
          <h2>Игроки ${state.players.length}/${state.room.maxPlayers}</h2>
          <div class="player-list">${state.players.map(renderPlayerRow).join('')}</div>
          <p class="lead">Готовы: ${readyCount}/${state.players.length}. Только хост запускает игру.</p>
        </aside>
      </section>`;
  }

  function renderPlayerRow(player) {
    const badges = [
      player.isHost ? '<span class="badge host">хост</span>' : '',
      player.isReady ? '<span class="badge ready">готов</span>' : '<span class="badge">ждёт</span>',
      player.isConnected ? '' : '<span class="badge offline">offline</span>',
    ].join('');
    const fin = state.gameState && state.gameState.financials[player.id];
    const track = player.hasEscapedRatRace ? ' · Fast Track' : '';
    const progress = fin ? `<small>${escapeHtml(fin.profession || player.professionTitle || '')}${track} · Cash $${fin.cash} · Passive $${fin.passiveIncome}</small>` : '';
    return `<div class="player-row"><span class="dot" style="background:${escapeHtml(player.color)}"></span><strong>${escapeHtml(player.name)}</strong><span>${badges}</span>${progress}</div>`;
  }

  function currentContext(game) {
    const current = game.players.find((player) => player.id === game.currentPlayerId) || game.players[0];
    const meActive = state.player && current && state.player.id === current.id;
    const meFinancials = state.player && game.financials[state.player.id];
    const currentCell = current ? game.board[current.position] : null;
    return { current, meActive, meFinancials, currentCell };
  }

  function renderGame() {
    const game = state.gameState;
    const { current, meFinancials } = currentContext(game);
    root.innerHTML = `
      <div class="topbar">
        <div><strong>Ход: ${escapeHtml(current ? current.name : '—')}</strong><br><span class="lead">Раунд ${game.turnNumber}</span></div>
        <span class="room-code">${escapeHtml(state.room.inviteCode)}</span>
        <span class="badge ${state.connection === 'online' ? 'ready' : 'offline'}">${state.connection === 'online' ? 'online' : 'offline'}</span>
        ${state.player && state.room.hostPlayerId === state.player.id ? '<button class="ghost" data-action="close-room">Закрыть</button>' : ''}
      </div>
      <section class="card grid">
        <div class="stat-grid">
          <div class="stat"><span>Cash</span><strong>$${meFinancials ? meFinancials.cash : 0}</strong></div>
          <div class="stat"><span>Passive</span><strong>$${meFinancials ? meFinancials.passiveIncome : 0}</strong></div>
          <div class="stat"><span>Payday</span><strong>$${meFinancials ? meFinancials.payday : 0}</strong></div>
        </div>
        ${renderActiveTab(game)}
        ${renderPrimaryAction(game)}
      </section>
      <nav class="tabs">
        <button class="secondary" data-tab="action">Действие</button>
        <button class="secondary" data-tab="finance">Финансы</button>
        <button class="secondary" data-tab="players">Игроки</button>
        <button class="secondary" data-tab="board">Доска</button>
        <button class="secondary" data-tab="log">Журнал</button>
      </nav>`;
  }

  function renderActiveTab(game) {
    const { current, currentCell, meFinancials } = currentContext(game);
    if (state.tab === 'players') return `<div class="player-list">${game.players.map(renderPlayerRow).join('')}</div>`;
    if (state.tab === 'log') return `<div class="log">${game.actionLog.slice().reverse().map((entry) => `<p>${escapeHtml(entry.message)}</p>`).join('')}</div>`;
    if (state.tab === 'board') return `<div class="board-list">${game.board.map((cell) => `<span class="board-pill ${current && current.position === cell.id ? 'active' : ''}">${cell.id + 1}. ${escapeHtml(cell.label || cell.type)}</span>`).join('')}</div>`;
    if (state.tab === 'finance') {
      const fin = meFinancials;
      return `<div class="grid">
        <h2>Финансы игрока</h2>
        <p class="lead">${escapeHtml(fin.profession || 'Профессия')} · Cash: $${fin.cash} · Payday: $${fin.payday} · Expenses: $${fin.totalExpenses}</p>
        <div class="invite-box"><strong>Доходы</strong><br>Salary: $${fin.salary}<br>Passive: $${fin.passiveIncome}<br>Total: $${fin.totalIncome}</div>
        <div class="invite-box"><strong>Активы</strong><br>${fin.assets.map((asset) => `${escapeHtml(asset.title)}${asset.shares ? ` · ${asset.shares} шт.` : ''}${asset.cashflow ? ` · +$${asset.cashflow}` : ''}`).join('<br>') || 'Пока нет'}</div>
        <div class="invite-box"><strong>Обязательства</strong><br>${fin.liabilities.map((item) => `${escapeHtml(item.title)}: $${item.balance}${item.payment ? ` / платёж $${item.payment}` : ''}`).join('<br>') || 'Нет'}<br>Children: ${fin.children}</div>
      </div>`;
    }
    const pending = game.pendingAction || {};
    const deal = pending.deal;
    const card = pending.card;
    const currentDream = current && current.dream;
    const cardText = deal
      ? `${escapeHtml(deal.title)} · взнос $${deal.downPayment || deal.cost} · cashflow $${deal.cashflow || 0}. ${escapeHtml(deal.description)}`
      : card
        ? `${escapeHtml(card.title)}${card.cost ? ` · цена $${card.cost}` : ''}${card.sellPrice ? ` · цена продажи $${card.sellPrice}` : ''}. ${escapeHtml(card.description || '')}`
        : currentDream
          ? `Мечта: ${escapeHtml(currentDream.title)} ($${currentDream.cost}). Следуйте основной кнопке действия.`
          : 'Следуйте основной кнопке действия. Остальные игроки видят состояние в режиме наблюдения.';
    return `<div class="event-card"><span class="event-type">${escapeHtml(currentCell ? currentCell.label || currentCell.type : 'START')}</span><h2>${escapeHtml(current ? current.name : 'Игрок')} — ${phaseTitle(game.phase)}</h2><p class="lead">${game.dice ? `Кубик: ${game.dice}. ` : ''}${pending.amount ? `Сумма: $${pending.amount}. ` : ''}${cardText}</p></div>`;
  }

  function phaseTitle(phase) {
    return {
      waitingForRoll: 'ожидает броска',
      resolvingCell: 'решает событие клетки',
      choosingDealType: 'выбирает тип сделки',
      reviewingDeal: 'изучает сделку',
      endTurn: 'завершает ход',
      gameOver: 'игра завершена',
    }[phase] || phase;
  }

  function matchingMarketAssets(game) {
    const pending = game.pendingAction || {};
    const card = pending.card || {};
    const fin = state.player && game.financials[state.player.id];
    if (!fin) return [];
    return fin.assets.filter((asset) => {
      if (card.sellSymbols && asset.symbol && card.sellSymbols.includes(asset.symbol)) return true;
      if (card.sellTypes && asset.type && card.sellTypes.includes(asset.type)) return true;
      return false;
    });
  }

  function renderMarketActions(game) {
    const assets = matchingMarketAssets(game);
    const sellButtons = assets.map((asset) => `<button data-action="sell-asset" data-asset-id="${escapeHtml(asset.assetId || asset.id)}">Продать: ${escapeHtml(asset.title)}</button>`).join('');
    return `<div class="actions">${sellButtons || '<button disabled>Нет подходящих активов</button>'}<button class="secondary" data-action="skip">Пропустить</button></div>`;
  }

  function renderPrimaryAction(game) {
    const { meActive } = currentContext(game);
    if (!meActive) return '<button class="primary-action" disabled>Сейчас ход другого игрока</button>';
    if (game.phase === 'waitingForRoll') return '<button class="primary-action" data-action="roll">Бросить кубик</button>';
    if (game.phase === 'choosingDealType') return '<div class="actions"><button data-action="deal-small">Малая сделка</button><button data-action="deal-big">Крупная сделка</button><button class="secondary" data-action="skip">Пропустить</button></div>';
    if (game.pendingAction && game.pendingAction.type === 'ACCEPT_CHARITY') return '<div class="actions"><button data-action="charity">Пожертвовать</button><button class="secondary" data-action="skip">Пропустить</button></div>';
    if (game.pendingAction && game.pendingAction.type === 'PAY_DOODAD') return '<div class="actions"><button data-action="pay-doodad">Оплатить расход</button><button class="secondary" data-action="loan">Взять кредит</button></div>';
    if (game.pendingAction && game.pendingAction.type === 'MARKET_OFFER') return renderMarketActions(game);
    if (game.phase === 'reviewingDeal') return '<div class="actions"><button data-action="buy">Купить актив</button><button class="secondary" data-action="loan">Взять кредит</button><button class="secondary" data-action="skip">Пропустить</button></div>';
    if (game.phase === 'resolvingCell') return '<button class="primary-action" data-action="skip">Продолжить</button>';
    if (game.phase === 'endTurn') return '<div class="actions"><button class="primary-action" data-action="end-turn">Завершить ход</button><button class="secondary" data-action="loan">Кредит</button><button class="secondary" data-action="paydebt">Погасить долг</button></div>';
    return '<button class="primary-action" disabled>Ожидание действия</button>';
  }

  function render() {
    if (state.booting) {
      root.innerHTML = '<section class="hero"><div class="card grid"><h1>Подключаемся...</h1><p class="lead">Проверяем комнату и session id.</p></div></section>';
      return;
    }
    if (state.screen === 'join') return renderJoin();
    if (state.screen === 'lobby') return renderLobby();
    if (state.screen === 'game') return renderGame();
    return renderHome();
  }

  root.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    const tab = event.target.closest('[data-tab]')?.dataset.tab;
    if (tab) { state.tab = tab; render(); return; }
    if (!action) return;
    if (action === 'create-online') createOnlineRoom();
    if (action === 'join-room') joinOnlineRoom(event.target.closest('form'));
    if (action === 'local-game') location.href = '/index.html';
    if (action === 'home') { state.screen = 'home'; history.replaceState(null, '', '/online.html'); render(); }
    if (action === 'copy') copyInvite();
    if (action === 'share') shareInvite();
    if (action === 'ready') toggleReady();
    if (action === 'start') startGame();
    if (action === 'close-room') closeOnlineRoom();
    if (action === 'roll') gameAction('ROLL_DICE');
    if (action === 'deal-small') gameAction('CHOOSE_DEAL_TYPE', { dealType: 'small' });
    if (action === 'deal-big') gameAction('CHOOSE_DEAL_TYPE', { dealType: 'big' });
    if (action === 'buy') gameAction('BUY_ASSET');
    if (action === 'pay-doodad') gameAction('PAY_DOODAD');
    if (action === 'sell-asset') gameAction('SELL_ASSET', { assetId: event.target.closest('[data-asset-id]').dataset.assetId });
    if (action === 'charity') gameAction('ACCEPT_CHARITY');
    if (action === 'skip') gameAction('SKIP_ACTION');
    if (action === 'loan') {
      const amount = Number(prompt('Сумма кредита', '1000'));
      if (amount > 0) gameAction('TAKE_LOAN', { amount });
    }
    if (action === 'paydebt') {
      const amount = Number(prompt('Сумма погашения', '100'));
      if (amount > 0) gameAction('PAY_DEBT', { amount });
    }
    if (action === 'end-turn') gameAction('END_TURN');
  });

  root.addEventListener('submit', (event) => {
    event.preventDefault();
    if (event.target.matches('[data-form="join"]')) joinOnlineRoom(event);
  });

  async function boot() {
    connectSocket();
    if (roomCodeFromUrl()) {
      const rejoined = await tryRejoinFromUrl();
      if (!rejoined) state.screen = 'join';
    }
    state.booting = false;
    render();
  }

  render();
  boot();
})();
