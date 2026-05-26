const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createInitialGameState,
  applyGameAction,
} = require('../src/game/engine');

function roomFixture() {
  return {
    id: 'room_1',
    status: 'playing',
    players: [
      { id: 'p1', name: 'Roman', color: 'green', isReady: true },
      { id: 'p2', name: 'Alex', color: 'red', isReady: true },
    ],
  };
}

test('initial game state starts with first player waiting for roll', () => {
  const state = createInitialGameState(roomFixture());

  assert.equal(state.status, 'playing');
  assert.equal(state.currentPlayerId, 'p1');
  assert.equal(state.phase, 'waitingForRoll');
  assert.equal(state.players[0].position, 0);
  assert.equal(state.actionLog.length, 1);
});

test('only current player can roll dice', () => {
  const state = createInitialGameState(roomFixture());

  assert.throws(
    () => applyGameAction(state, { id: 'a1', playerId: 'p2', type: 'ROLL_DICE' }),
    /Сейчас ход другого игрока/
  );
});

test('roll dice is server-side and end turn moves to next player', () => {
  let state = createInitialGameState(roomFixture());
  state = applyGameAction(
    state,
    { id: 'a1', playerId: 'p1', type: 'ROLL_DICE' },
    { rng: () => 0.49 }
  );

  assert.equal(state.dice, 3);
  assert.equal(state.players[0].position, 3);
  assert.equal(state.phase, 'resolvingCell');

  state = applyGameAction(state, { id: 'a2', playerId: 'p1', type: 'SKIP_ACTION' });
  assert.equal(state.phase, 'endTurn');

  state = applyGameAction(state, { id: 'a3', playerId: 'p1', type: 'END_TURN' });
  assert.equal(state.currentPlayerId, 'p2');
  assert.equal(state.phase, 'waitingForRoll');
});

test('paycheck cell credits payday before end turn', () => {
  let state = createInitialGameState(roomFixture());
  state.financials.p1.payday = 1200;
  state.financials.p1.cash = 400;

  state = applyGameAction(state, { id: 'a1', playerId: 'p1', type: 'ROLL_DICE' }, { rng: () => 0 });

  assert.equal(state.players[0].position, 1);
  assert.equal(state.phase, 'choosingDealType');

  state.players[0].position = 11;
  state.phase = 'waitingForRoll';
  state = applyGameAction(state, { id: 'a2', playerId: 'p1', type: 'ROLL_DICE' }, { rng: () => 0 });

  assert.equal(state.players[0].position, 0);
  assert.equal(state.financials.p1.cash, 1600);
  assert.equal(state.phase, 'endTurn');
  assert.match(state.actionLog.at(-1).message, /получил зарплату/);
});

test('opportunity cell requires choosing small or big deal then buy or skip', () => {
  let state = createInitialGameState(roomFixture());
  state = applyGameAction(state, { id: 'a1', playerId: 'p1', type: 'ROLL_DICE' }, { rng: () => 0 });

  assert.equal(state.phase, 'choosingDealType');
  assert.equal(state.pendingAction.type, 'CHOOSE_DEAL_TYPE');

  state = applyGameAction(state, {
    id: 'a2',
    playerId: 'p1',
    type: 'CHOOSE_DEAL_TYPE',
    payload: { dealType: 'small' },
  });

  assert.equal(state.phase, 'reviewingDeal');
  assert.equal(state.pendingAction.type, 'BUY_ASSET');
  assert.equal(state.pendingAction.deal.type, 'small');

  state = applyGameAction(state, { id: 'a3', playerId: 'p1', type: 'BUY_ASSET' });
  assert.equal(state.financials.p1.assets.length, 1);
  assert.equal(state.phase, 'endTurn');
});

test('charity cell asks player to donate or skip', () => {
  let state = createInitialGameState(roomFixture());
  state.financials.p1.cash = 1000;
  state.financials.p1.totalIncome = 3000;

  state = applyGameAction(state, { id: 'a1', playerId: 'p1', type: 'ROLL_DICE' }, { rng: () => 0.49 });

  assert.equal(state.players[0].position, 3);
  assert.equal(state.phase, 'resolvingCell');
  assert.equal(state.pendingAction.type, 'ACCEPT_CHARITY');

  state = applyGameAction(state, { id: 'a2', playerId: 'p1', type: 'ACCEPT_CHARITY' });
  assert.equal(state.financials.p1.cash, 700);
  assert.equal(state.players[0].charityTurns, 3);
  assert.equal(state.phase, 'endTurn');
});

test('loans and debt payments are validated on the server', () => {
  let state = createInitialGameState(roomFixture());

  state = applyGameAction(state, { id: 'a1', playerId: 'p1', type: 'TAKE_LOAN', payload: { amount: 500 } });
  assert.equal(state.financials.p1.cash, 900);
  assert.equal(state.financials.p1.loans, 500);

  assert.throws(
    () => applyGameAction(state, { id: 'a2', playerId: 'p1', type: 'PAY_DEBT', payload: { amount: 999 } }),
    /Недостаточно средств|Сумма больше долга/
  );

  state = applyGameAction(state, { id: 'a3', playerId: 'p1', type: 'PAY_DEBT', payload: { amount: 200 } });
  assert.equal(state.financials.p1.cash, 700);
  assert.equal(state.financials.p1.loans, 300);
});
