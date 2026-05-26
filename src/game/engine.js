const {
  SMALL_DEALS,
  BIG_DEALS,
  MARKET_CARDS,
  DOODADS,
  DREAMS,
  professionToFinancials,
  pickCard,
  pickProfession,
} = require('./data');

const BOARD = Object.freeze([
  'PAYCHECK',
  'OPPORTUNITY',
  'LIABILITY',
  'CHARITY',
  'OPPORTUNITY',
  'PAYCHECK',
  'OFFER',
  'CHILD',
  'OPPORTUNITY',
  'DOWNSIZE',
  'PAYCHECK',
  'OPPORTUNITY',
]);

const CELL_LABELS = Object.freeze({
  PAYCHECK: 'Зарплата',
  OPPORTUNITY: 'Возможность',
  LIABILITY: 'Расход',
  CHARITY: 'Благотворительность',
  OFFER: 'Рыночное предложение',
  CHILD: 'Ребёнок',
  DOWNSIZE: 'Увольнение',
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createInitialFinancials(players) {
  return players.reduce((acc, player) => {
    acc[player.id] = professionToFinancials(player.profession);
    return acc;
  }, {});
}

function createInitialGameState(room) {
  const players = room.players.map((player, index) => {
    const profession = pickProfession(index);
    return {
      id: player.id,
      name: player.name,
      color: player.color,
      isHost: Boolean(player.isHost),
      isConnected: player.isConnected !== false,
      isReady: Boolean(player.isReady),
      position: 0,
      track: 'ratRace',
      turnOrder: index,
      skipTurns: 0,
      charityTurns: 0,
      professionId: profession.id,
      professionTitle: profession.title,
      dream: clone(DREAMS[index % DREAMS.length]),
      hasEscapedRatRace: false,
      profession,
    };
  });

  const cleanPlayers = players.map(({ profession, ...player }) => player);

  return {
    roomId: room.id,
    status: 'playing',
    turnNumber: 1,
    currentPlayerId: cleanPlayers[0] ? cleanPlayers[0].id : undefined,
    phase: 'waitingForRoll',
    dice: undefined,
    players: cleanPlayers,
    board: BOARD.map((type, index) => ({ id: index, type, label: CELL_LABELS[type] || type })),
    financials: createInitialFinancials(players),
    actionLog: [
      {
        id: 'log_start',
        turnNumber: 1,
        message: 'Игра началась. Игроки получили профессии, мечты и стартовые финансы.',
        createdAt: new Date().toISOString(),
      },
    ],
    pendingAction: { type: 'ROLL_DICE', playerId: cleanPlayers[0] && cleanPlayers[0].id },
  };
}

function requireCurrentPlayer(state, action) {
  if (state.currentPlayerId !== action.playerId) throw new Error('Сейчас ход другого игрока.');
}

function currentPlayer(state) {
  return state.players.find((candidate) => candidate.id === state.currentPlayerId);
}

function currentFinancials(state, playerId) {
  const financials = state.financials[playerId];
  if (!financials) throw new Error('Финансовый отчёт не найден.');
  return financials;
}

function appendLog(state, message) {
  state.actionLog.push({
    id: `log_${state.actionLog.length + 1}`,
    turnNumber: state.turnNumber,
    message,
    createdAt: new Date().toISOString(),
  });
}

function recalculateFinancials(financials) {
  financials.totalIncome = financials.salary + financials.passiveIncome;
  financials.monthlyLoanPayment = Math.ceil((financials.loans || 0) * 0.1);
  const fixedExpenses = financials.taxes
    + (financials.liabilities || [])
      .filter((item) => item.id !== 'bank_loan')
      .reduce((sum, item) => sum + (item.payment || 0), 0)
    + financials.monthlyLoanPayment;
  const childExpenses = (financials.children || 0) * 480;
  financials.totalExpenses = fixedExpenses + childExpenses;
  financials.payday = financials.totalIncome - financials.totalExpenses;
  return financials;
}

function checkRatRaceEscape(state, player) {
  const financials = currentFinancials(state, player.id);
  recalculateFinancials(financials);
  if (!player.hasEscapedRatRace && financials.passiveIncome >= financials.totalExpenses) {
    player.track = 'fastTrack';
    player.hasEscapedRatRace = true;
    appendLog(state, `${player.name} вышел из крысиных бегов: passive income покрывает расходы.`);
  }
}

function setEndTurn(state, player) {
  checkRatRaceEscape(state, player);
  state.phase = 'endTurn';
  state.pendingAction = { type: 'END_TURN', playerId: player.id };
}

function resolveCell(state, player, options = {}) {
  const cell = state.board[player.position];
  const financials = currentFinancials(state, player.id);

  if (cell.type === 'PAYCHECK') {
    recalculateFinancials(financials);
    financials.cash += financials.payday;
    appendLog(state, `${player.name} получил зарплату $${financials.payday}.`);
    setEndTurn(state, player);
    return state;
  }

  if (cell.type === 'OPPORTUNITY') {
    state.phase = 'choosingDealType';
    state.pendingAction = { type: 'CHOOSE_DEAL_TYPE', playerId: player.id, options: ['small', 'big'] };
    appendLog(state, `${player.name} выбирает малую или крупную сделку.`);
    return state;
  }

  if (cell.type === 'OFFER') {
    const card = pickCard(MARKET_CARDS, options.rng ? options.rng() : Math.random());
    state.phase = 'resolvingCell';
    state.pendingAction = { type: 'MARKET_OFFER', playerId: player.id, card };
    appendLog(state, `${player.name} получил рыночное предложение: ${card.title}.`);
    return state;
  }

  if (cell.type === 'LIABILITY') {
    const card = pickCard(DOODADS, options.rng ? options.rng() : Math.random());
    state.phase = 'resolvingCell';
    state.pendingAction = { type: 'PAY_DOODAD', playerId: player.id, card };
    appendLog(state, `${player.name} получил расход: ${card.title} ($${card.cost}).`);
    return state;
  }

  if (cell.type === 'CHARITY') {
    state.phase = 'resolvingCell';
    state.pendingAction = {
      type: 'ACCEPT_CHARITY',
      playerId: player.id,
      amount: Math.ceil(financials.totalIncome * 0.1),
    };
    appendLog(state, `${player.name} может пожертвовать 10% дохода и получить бонус к кубику.`);
    return state;
  }

  if (cell.type === 'CHILD') {
    financials.children += 1;
    recalculateFinancials(financials);
    appendLog(state, `${player.name}: появился ребёнок. Расходы выросли на $480.`);
    setEndTurn(state, player);
    return state;
  }

  if (cell.type === 'DOWNSIZE') {
    const amount = Math.min(financials.cash, Math.max(0, financials.totalExpenses));
    financials.cash -= amount;
    player.skipTurns = Math.max(player.skipTurns, 1);
    appendLog(state, `${player.name} попал на увольнение и пропускает следующий ход.`);
    setEndTurn(state, player);
    return state;
  }

  state.phase = 'resolvingCell';
  state.pendingAction = { type: 'SKIP_ACTION', playerId: player.id, cell };
  appendLog(state, `${player.name} попал на ${cell.label}. Можно пропустить действие.`);
  return state;
}

function rollDice(state, action, options) {
  requireCurrentPlayer(state, action);
  if (state.phase !== 'waitingForRoll') throw new Error('Вы уже бросили кубик.');
  const rng = options.rng || Math.random;
  const dice = Math.max(1, Math.min(6, Math.floor(rng() * 6) + 1));
  const player = currentPlayer(state);
  player.position = (player.position + dice) % state.board.length;
  state.dice = dice;
  const cell = state.board[player.position];
  appendLog(state, `${player.name} бросил ${dice} и попал на ${cell.label}.`);
  return resolveCell(state, player, options);
}

function endTurn(state, action) {
  requireCurrentPlayer(state, action);
  const player = currentPlayer(state);
  if (state.phase !== 'endTurn') {
    checkRatRaceEscape(state, player);
    if (player.hasEscapedRatRace) return state;
    throw new Error('Сначала завершите текущее действие.');
  }
  checkRatRaceEscape(state, player);
  const currentIndex = state.players.findIndex((candidate) => candidate.id === action.playerId);
  const next = state.players[(currentIndex + 1) % state.players.length];
  state.currentPlayerId = next.id;
  state.turnNumber += 1;
  state.phase = 'waitingForRoll';
  state.dice = undefined;
  state.pendingAction = { type: 'ROLL_DICE', playerId: next.id };
  appendLog(state, `Ход перешёл к ${next.name}.`);
  return state;
}

function chooseDealType(state, action, options = {}) {
  requireCurrentPlayer(state, action);
  if (state.phase !== 'choosingDealType') throw new Error('Сейчас нельзя выбирать сделку.');
  const dealType = action.payload && action.payload.dealType;
  const deck = dealType === 'small' ? SMALL_DEALS : dealType === 'big' ? BIG_DEALS : null;
  if (!deck) throw new Error('Недоступный тип сделки.');
  const deal = pickCard(deck, options.rng ? options.rng() : Math.random());
  deal.deck = dealType;
  state.phase = 'reviewingDeal';
  state.pendingAction = { type: 'BUY_ASSET', playerId: action.playerId, deal };
  appendLog(state, `${currentPlayer(state).name} выбрал ${dealType === 'small' ? 'малую' : 'крупную'} сделку: ${deal.title}.`);
  return state;
}

function buyAsset(state, action) {
  requireCurrentPlayer(state, action);
  if (state.phase !== 'reviewingDeal' || !state.pendingAction || !state.pendingAction.deal) {
    throw new Error('Нет сделки для покупки.');
  }
  const deal = state.pendingAction.deal;
  const financials = currentFinancials(state, action.playerId);
  const cost = deal.downPayment || deal.cost;
  if (financials.cash < cost) throw new Error('Недостаточно средств.');
  financials.cash -= cost;
  financials.passiveIncome += deal.cashflow || 0;
  recalculateFinancials(financials);
  const asset = {
    ...deal,
    assetId: `asset_${state.turnNumber}_${financials.assets.length + 1}`,
    costBasis: cost,
    shares: deal.quantityLabel === 'shares' ? Math.max(1, Math.floor(cost / (deal.unitPrice || cost))) : undefined,
    acquiredAtTurn: state.turnNumber,
  };
  financials.assets.push(asset);
  appendLog(state, `${currentPlayer(state).name} купил актив «${deal.title}» за $${cost}.`);
  setEndTurn(state, currentPlayer(state));
  return state;
}

function acceptCharity(state, action) {
  requireCurrentPlayer(state, action);
  if (!state.pendingAction || state.pendingAction.type !== 'ACCEPT_CHARITY') {
    throw new Error('Благотворительность сейчас недоступна.');
  }
  const amount = state.pendingAction.amount;
  const financials = currentFinancials(state, action.playerId);
  if (financials.cash < amount) throw new Error('Недостаточно средств.');
  financials.cash -= amount;
  currentPlayer(state).charityTurns = 3;
  appendLog(state, `${currentPlayer(state).name} пожертвовал $${amount}.`);
  setEndTurn(state, currentPlayer(state));
  return state;
}

function payDoodad(state, action) {
  requireCurrentPlayer(state, action);
  if (!state.pendingAction || state.pendingAction.type !== 'PAY_DOODAD') throw new Error('Расход сейчас недоступен.');
  const card = state.pendingAction.card;
  const financials = currentFinancials(state, action.playerId);
  if (financials.cash < card.cost) throw new Error('Недостаточно средств.');
  financials.cash -= card.cost;
  appendLog(state, `${currentPlayer(state).name} оплатил расход «${card.title}» на $${card.cost}.`);
  setEndTurn(state, currentPlayer(state));
  return state;
}

function assetMatchesMarket(asset, card) {
  if (card.sellSymbols && asset.symbol && card.sellSymbols.includes(asset.symbol)) return true;
  if (card.sellTypes && asset.type && card.sellTypes.includes(asset.type)) return true;
  return false;
}

function sellAsset(state, action) {
  requireCurrentPlayer(state, action);
  if (!state.pendingAction || state.pendingAction.type !== 'MARKET_OFFER') throw new Error('Рыночное предложение сейчас недоступно.');
  const financials = currentFinancials(state, action.playerId);
  const assetId = action.payload && action.payload.assetId;
  const assetIndex = financials.assets.findIndex((asset) => asset.assetId === assetId || asset.id === assetId);
  if (assetIndex < 0) throw new Error('Актив не найден.');
  const asset = financials.assets[assetIndex];
  const card = state.pendingAction.card;
  if (!assetMatchesMarket(asset, card)) throw new Error('Этот актив не подходит под рыночное предложение.');
  const salePrice = card.sellPrice
    ? card.sellPrice * (asset.shares || 1)
    : Math.round((asset.costBasis || asset.cost || 0) * (card.multiplier || 1));
  financials.cash += salePrice;
  financials.passiveIncome -= asset.cashflow || 0;
  financials.assets.splice(assetIndex, 1);
  recalculateFinancials(financials);
  appendLog(state, `${currentPlayer(state).name} продал «${asset.title}» за $${salePrice}.`);
  setEndTurn(state, currentPlayer(state));
  return state;
}

function skipAction(state, action) {
  requireCurrentPlayer(state, action);
  if (!['resolvingCell', 'choosingDealType', 'reviewingDeal'].includes(state.phase)) {
    throw new Error('Сейчас нечего пропускать.');
  }
  appendLog(state, `${currentPlayer(state).name} пропустил действие.`);
  setEndTurn(state, currentPlayer(state));
  return state;
}

function takeLoan(state, action) {
  requireCurrentPlayer(state, action);
  const amount = Number(action.payload && action.payload.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 50000) throw new Error('Недоступная сумма кредита.');
  const rounded = Math.ceil(amount / 100) * 100;
  const financials = currentFinancials(state, action.playerId);
  financials.cash += rounded;
  financials.loans = (financials.loans || 0) + rounded;
  recalculateFinancials(financials);
  financials.liabilities = financials.liabilities.filter((item) => item.id !== 'bank_loan');
  financials.liabilities.push({ id: 'bank_loan', title: 'Банковский кредит', balance: financials.loans, payment: financials.monthlyLoanPayment });
  appendLog(state, `${currentPlayer(state).name} взял кредит $${rounded}.`);
  return state;
}

function payDebt(state, action) {
  requireCurrentPlayer(state, action);
  const amount = Number(action.payload && action.payload.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Недоступная сумма платежа.');
  const financials = currentFinancials(state, action.playerId);
  if (amount > financials.cash) throw new Error('Недостаточно средств.');
  if (amount > financials.loans) throw new Error('Сумма больше долга.');
  financials.cash -= amount;
  financials.loans -= amount;
  recalculateFinancials(financials);
  financials.liabilities = financials.liabilities.filter((item) => item.id !== 'bank_loan');
  if (financials.loans > 0) {
    financials.liabilities.push({ id: 'bank_loan', title: 'Банковский кредит', balance: financials.loans, payment: financials.monthlyLoanPayment });
  }
  appendLog(state, `${currentPlayer(state).name} погасил долг на $${amount}.`);
  return state;
}

function applyGameAction(currentState, action, options = {}) {
  const state = clone(currentState);
  if (!action || !action.type) throw new Error('Невозможно выполнить действие.');

  switch (action.type) {
    case 'ROLL_DICE':
      return rollDice(state, action, options);
    case 'CHOOSE_DEAL_TYPE':
      return chooseDealType(state, action, options);
    case 'BUY_ASSET':
      return buyAsset(state, action);
    case 'SELL_ASSET':
      return sellAsset(state, action);
    case 'PAY_DOODAD':
      return payDoodad(state, action);
    case 'ACCEPT_CHARITY':
      return acceptCharity(state, action);
    case 'SKIP_ACTION':
      return skipAction(state, action);
    case 'TAKE_LOAN':
      return takeLoan(state, action);
    case 'PAY_DEBT':
      return payDebt(state, action);
    case 'END_TURN':
      return endTurn(state, action);
    default:
      throw new Error('Невозможно выполнить действие.');
  }
}

module.exports = {
  BOARD,
  CELL_LABELS,
  createInitialGameState,
  applyGameAction,
};
