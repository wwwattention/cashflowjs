const assert = require('node:assert/strict');
const test = require('node:test');

const {
  PROFESSIONS,
  SMALL_DEALS,
  BIG_DEALS,
  MARKET_CARDS,
  DOODADS,
  DREAMS,
  professionToFinancials,
  pickCard,
} = require('../src/game/data');

test('profession data preserves legacy salaries and derives payday', () => {
  assert.equal(PROFESSIONS.length, 13);
  const doctor = PROFESSIONS.find((profession) => profession.id === 'doctor-md');
  assert.equal(doctor.salary, 13200);
  const financials = professionToFinancials(doctor);
  assert.equal(financials.cash, 400);
  assert.equal(financials.totalIncome, 13200);
  assert.equal(financials.totalExpenses, 8900);
  assert.equal(financials.payday, 4300);
  assert.equal(financials.liabilities.find((item) => item.id === 'mortgage').balance, 202000);
});

test('decks expose deterministic card picker and expected categories', () => {
  assert.ok(SMALL_DEALS.length >= 6);
  assert.ok(BIG_DEALS.length >= 4);
  assert.ok(MARKET_CARDS.length >= 3);
  assert.ok(DOODADS.length >= 4);
  assert.ok(DREAMS.length >= 6);

  assert.equal(pickCard(SMALL_DEALS, 0).id, SMALL_DEALS[0].id);
  assert.equal(pickCard(SMALL_DEALS, 1.99).id, SMALL_DEALS[SMALL_DEALS.length - 1].id);
});
