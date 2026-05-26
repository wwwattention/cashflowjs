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

const DEALS = Object.freeze({
  small: {
    id: 'small_real_estate_starter',
    type: 'small',
    title: 'Малая сделка: парковочное место',
    cost: 200,
    cashflow: 20,
    description: 'Небольшой актив для первого онлайн-MVP. Сервер проверяет покупку и деньги.',
  },
  big: {
    id: 'big_real_estate_starter',
    type: 'big',
    title: 'Крупная сделка: квартира под аренду',
    cost: 5000,
    cashflow: 450,
    description: 'Крупный актив. Если денег не хватает — сначала возьмите кредит.',
  },
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createInitialFinancials(players) {
  return players.reduce((acc, player) => {
    acc[player.id] = {
      cash: 400,
      salary: 3000,
      passiveIncome: 0,
      totalIncome: 3000,
      totalExpenses: 2000,
      payday: 1000,
      assets: [],
      liabilities: [],
      children: 0,
      loans: 0,
    };
    return acc;
  }, {});
}

function createInitialGameState(room) {
  const players = room.players.map((player, index) => ({
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
  }));

  return {
    roomId: room.id,
    status: 'playing',
    turnNumber: 1,
    currentPlayerId: players[0] ? players[0].id : undefined,
    phase: 'waitingForRoll',
    dice: undefined,
    players,
    board: BOARD.map((type, index) => ({ id: index, type, label: CELL_LABELS[type] || type })),
    financials: createInitialFinancials(players),
    actionLog: [
      {
        id: 'log_start',
        turnNumber: 1,
        message: 'Игра началась. Первый игрок бросает кубик.',
        createdAt: new Date().toISOString(),
      },
    ],
    pendingAction: { type: 'ROLL_DICE', playerId: players[0] && players[0].id },
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

function setEndTurn(state, player) {
  state.phase = 'endTurn';
  state.pendingAction = { type: 'END_TURN', playerId: player.id };
}

function resolveCell(state, player) {
  const cell = state.board[player.position];
  const financials = currentFinancials(state, player.id);

  if (cell.type === 'PAYCHECK') {
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
    financials.totalExpenses += 480;
    financials.payday = financials.totalIncome + financials.passiveIncome - financials.totalExpenses;
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
  return resolveCell(state, player);
}

function endTurn(state, action) {
  requireCurrentPlayer(state, action);
  if (state.phase !== 'endTurn') throw new Error('Сначала завершите текущее действие.');
  const currentIndex = state.players.findIndex((player) => player.id === action.playerId);
  const next = state.players[(currentIndex + 1) % state.players.length];
  state.currentPlayerId = next.id;
  state.turnNumber += 1;
  state.phase = 'waitingForRoll';
  state.dice = undefined;
  state.pendingAction = { type: 'ROLL_DICE', playerId: next.id };
  appendLog(state, `Ход перешёл к ${next.name}.`);
  return state;
}

function chooseDealType(state, action) {
  requireCurrentPlayer(state, action);
  if (state.phase !== 'choosingDealType') throw new Error('Сейчас нельзя выбирать сделку.');
  const dealType = action.payload && action.payload.dealType;
  const deal = DEALS[dealType];
  if (!deal) throw new Error('Недоступный тип сделки.');
  state.phase = 'reviewingDeal';
  state.pendingAction = { type: 'BUY_ASSET', playerId: action.playerId, deal: clone(deal) };
  appendLog(state, `${currentPlayer(state).name} выбрал ${dealType === 'small' ? 'малую' : 'крупную'} сделку.`);
  return state;
}

function buyAsset(state, action) {
  requireCurrentPlayer(state, action);
  if (state.phase !== 'reviewingDeal' || !state.pendingAction || !state.pendingAction.deal) {
    throw new Error('Нет сделки для покупки.');
  }
  const deal = state.pendingAction.deal;
  const financials = currentFinancials(state, action.playerId);
  if (financials.cash < deal.cost) throw new Error('Недостаточно средств.');
  financials.cash -= deal.cost;
  financials.passiveIncome += deal.cashflow;
  financials.payday = financials.totalIncome + financials.passiveIncome - financials.totalExpenses;
  financials.assets.push({ ...deal, acquiredAtTurn: state.turnNumber });
  appendLog(state, `${currentPlayer(state).name} купил актив «${deal.title}» за $${deal.cost}.`);
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
  financials.loans += rounded;
  financials.liabilities = financials.liabilities.filter((item) => item.id !== 'bank_loan');
  financials.liabilities.push({ id: 'bank_loan', title: 'Банковский кредит', balance: financials.loans });
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
  financials.liabilities = financials.loans > 0
    ? [{ id: 'bank_loan', title: 'Банковский кредит', balance: financials.loans }]
    : [];
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
      return chooseDealType(state, action);
    case 'BUY_ASSET':
      return buyAsset(state, action);
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
  DEALS,
  createInitialGameState,
  applyGameAction,
};
