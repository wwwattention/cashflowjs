const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createInitialGameState,
  applyGameAction,
} = require('../src/game/engine');

function roomFixture(settings = {}) {
  return {
    id: 'room_1',
    status: 'playing',
    settings,
    players: [
      { id: 'p1', name: 'Roman', color: 'green', isReady: true },
      { id: 'p2', name: 'Alex', color: 'red', isReady: true },
    ],
  };
}

function forceCell(state, positionBeforeRoll, rng = () => 0) {
  state.players[0].position = positionBeforeRoll;
  state.phase = 'waitingForRoll';
  return applyGameAction(state, { id: `roll_${positionBeforeRoll}`, playerId: 'p1', type: 'ROLL_DICE' }, { rng });
}

test('initial game state starts with legacy professions, dream, and first player waiting for roll', () => {
  const state = createInitialGameState(roomFixture());

  assert.equal(state.status, 'playing');
  assert.equal(state.currentPlayerId, 'p1');
  assert.equal(state.phase, 'waitingForRoll');
  assert.equal(state.players[0].position, 0);
  assert.equal(state.players[0].professionId, 'airline-pilot');
  assert.equal(state.financials.p1.profession, 'Airline Pilot');
  assert.equal(state.financials.p1.payday, 2630);
  assert.ok(state.players[0].dream);
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

test('paycheck cell credits profession payday before end turn', () => {
  let state = createInitialGameState(roomFixture());
  state.financials.p1.cash = 400;

  state = forceCell(state, 11);

  assert.equal(state.players[0].position, 0);
  assert.equal(state.financials.p1.cash, 3030);
  assert.equal(state.phase, 'endTurn');
  assert.match(state.actionLog.at(-1).message, /получил зарплату/);
});

test('opportunity cell requires choosing small or big deal then buy or skip', () => {
  let state = createInitialGameState(roomFixture());
  state.financials.p1.cash = 10000;
  state = applyGameAction(state, { id: 'a1', playerId: 'p1', type: 'ROLL_DICE' }, { rng: () => 0 });

  assert.equal(state.phase, 'choosingDealType');
  assert.equal(state.pendingAction.type, 'CHOOSE_DEAL_TYPE');

  state = applyGameAction(state, {
    id: 'a2',
    playerId: 'p1',
    type: 'CHOOSE_DEAL_TYPE',
    payload: { dealType: 'small' },
  }, { rng: () => 0.4 });

  assert.equal(state.phase, 'reviewingDeal');
  assert.equal(state.pendingAction.type, 'BUY_ASSET');
  assert.equal(state.pendingAction.deal.deck, 'small');

  state = applyGameAction(state, { id: 'a3', playerId: 'p1', type: 'BUY_ASSET' });
  assert.equal(state.financials.p1.assets.length, 1);
  assert.equal(state.phase, 'endTurn');
});

test('market cards can sell matching assets', () => {
  let state = createInitialGameState(roomFixture());
  state.financials.p1.assets.push({ id: 'asset_1', type: 'stock', title: 'MYT4U Electronics', symbol: 'MYT4U', shares: 10, costBasis: 50, cashflow: 0 });
  state = forceCell(state, 5); // position 6 OFFER/MARKET

  assert.equal(state.pendingAction.type, 'MARKET_OFFER');
  state.pendingAction.card = { id: 'market-test', title: 'MYT4U at $30', sellSymbols: ['MYT4U'], sellPrice: 30 };

  state = applyGameAction(state, { id: 'sell1', playerId: 'p1', type: 'SELL_ASSET', payload: { assetId: 'asset_1' } });
  assert.equal(state.financials.p1.cash, 700);
  assert.equal(state.financials.p1.assets.length, 0);
  assert.equal(state.phase, 'endTurn');
});

test('doodad cell charges required expense or allows loan first', () => {
  let state = createInitialGameState(roomFixture());
  state.financials.p1.cash = 0;
  state = forceCell(state, 2); // position 3 CHARITY in old board? force pending manually to avoid board coupling
  state.phase = 'resolvingCell';
  state.pendingAction = { type: 'PAY_DOODAD', playerId: 'p1', card: { id: 'test', title: 'Test Doodad', cost: 300 } };

  assert.throws(() => applyGameAction(state, { id: 'pay1', playerId: 'p1', type: 'PAY_DOODAD' }), /Недостаточно средств/);
  state = applyGameAction(state, { id: 'loan1', playerId: 'p1', type: 'TAKE_LOAN', payload: { amount: 300 } });
  state = applyGameAction(state, { id: 'pay2', playerId: 'p1', type: 'PAY_DOODAD' });
  assert.equal(state.financials.p1.cash, 0);
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
  assert.equal(state.financials.p1.monthlyLoanPayment, 50);

  assert.throws(
    () => applyGameAction(state, { id: 'a2', playerId: 'p1', type: 'PAY_DEBT', payload: { amount: 999 } }),
    /Недостаточно средств|Сумма больше долга/
  );

  state = applyGameAction(state, { id: 'a3', playerId: 'p1', type: 'PAY_DEBT', payload: { amount: 200 } });
  assert.equal(state.financials.p1.cash, 700);
  assert.equal(state.financials.p1.loans, 300);
  assert.equal(state.financials.p1.monthlyLoanPayment, 30);
});

test('player reaches fast track when passive income exceeds expenses', () => {
  let state = createInitialGameState(roomFixture());
  state.financials.p1.passiveIncome = state.financials.p1.totalExpenses;
  state = applyGameAction(state, { id: 'win1', playerId: 'p1', type: 'END_TURN' });

  assert.equal(state.players[0].track, 'fastTrack');
  assert.equal(state.players[0].hasEscapedRatRace, true);
  assert.match(state.actionLog.at(-1).message, /вышел из крысиных бегов/);
});
