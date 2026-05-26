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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createInitialFinancials(players) {
  return players.reduce((acc, player) => {
    acc[player.id] = {
      cash: 400,
      salary: 0,
      passiveIncome: 0,
      totalIncome: 0,
      totalExpenses: 0,
      payday: 0,
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
    board: BOARD.map((type, index) => ({ id: index, type })),
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

function appendLog(state, message) {
  state.actionLog.push({
    id: `log_${state.actionLog.length + 1}`,
    turnNumber: state.turnNumber,
    message,
    createdAt: new Date().toISOString(),
  });
}

function rollDice(state, action, options) {
  requireCurrentPlayer(state, action);
  if (state.phase !== 'waitingForRoll') throw new Error('Вы уже бросили кубик.');
  const rng = options.rng || Math.random;
  const dice = Math.max(1, Math.min(6, Math.floor(rng() * 6) + 1));
  const player = state.players.find((candidate) => candidate.id === action.playerId);
  player.position = (player.position + dice) % state.board.length;
  state.dice = dice;
  state.phase = 'endTurn';
  state.pendingAction = { type: 'END_TURN', playerId: player.id };
  const cell = state.board[player.position];
  appendLog(state, `${player.name} бросил ${dice} и попал на ${cell.type}.`);
  return state;
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

function applyGameAction(currentState, action, options = {}) {
  const state = clone(currentState);
  if (!action || !action.type) throw new Error('Невозможно выполнить действие.');

  switch (action.type) {
    case 'ROLL_DICE':
      return rollDice(state, action, options);
    case 'END_TURN':
      return endTurn(state, action);
    default:
      throw new Error('Невозможно выполнить действие.');
  }
}

module.exports = {
  BOARD,
  createInitialGameState,
  applyGameAction,
};
