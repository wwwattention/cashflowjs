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
  assert.equal(state.phase, 'endTurn');

  state = applyGameAction(state, { id: 'a2', playerId: 'p1', type: 'END_TURN' });
  assert.equal(state.currentPlayerId, 'p2');
  assert.equal(state.phase, 'waitingForRoll');
});
