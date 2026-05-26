const LEGACY_PROFESSION_ROWS = Object.freeze([
  ['airline-pilot', 'Airline Pilot', 9500, 400, 2350, 1300, 300, 660, 50, 2210, 143000, 15000, 22000, 1000],
  ['business-manager', 'Business Manager', 4600, 400, 910, 700, 120, 90, 50, 1000, 75000, 6000, 3000, 1000],
  ['doctor-md', 'Doctor (MD)', 13200, 400, 3420, 1900, 380, 270, 50, 2880, 202000, 19000, 9000, 1000],
  ['engineer', 'Engineer', 4900, 400, 1050, 700, 140, 120, 50, 1090, 75000, 7000, 4000, 1000],
  ['janitor', 'Janitor', 1600, 560, 280, 200, 60, 60, 50, 300, 20000, 4000, 2000, 1000],
  ['lawyer', 'Lawyer', 7500, 400, 1830, 1100, 220, 180, 50, 1650, 115000, 11000, 6000, 1000],
  ['mechanic', 'Mechanic', 2000, 670, 360, 300, 60, 60, 50, 450, 31000, 3000, 2000, 1000],
  ['nurse', 'Nurse', 3100, 480, 600, 400, 100, 90, 50, 710, 47000, 5000, 3000, 1000],
  ['police-officer', 'Police Officer', 3000, 520, 580, 400, 100, 60, 50, 690, 46000, 5000, 2000, 1000],
  ['secretary', 'Secretary', 2500, 710, 460, 400, 80, 60, 50, 570, 38000, 4000, 2000, 1000],
  ['teacher-k12', 'Teacher (K-12)', 3300, 400, 630, 500, 100, 90, 50, 760, 50000, 5000, 3000, 1000],
  ['truck-driver', 'Truck Driver', 2500, 750, 460, 400, 80, 60, 50, 570, 38000, 4000, 2000, 1000],
  ['ceo', 'CEO', 24000, 60000, 7200, 1900, 800, 250, 50, 4200, 750000, 30000, 11000, 1000],
]);

const PROFESSIONS = LEGACY_PROFESSION_ROWS.map(([
  id,
  title,
  salary,
  startingSavings,
  taxes,
  mortgagePayment,
  carPayment,
  creditCardPayment,
  retailPayment,
  otherExpenses,
  mortgage,
  carLoan,
  creditDebt,
  retailDebt,
]) => ({
  id,
  title,
  salary,
  startingSavings,
  taxes,
  mortgagePayment,
  carPayment,
  creditCardPayment,
  retailPayment,
  otherExpenses,
  mortgage,
  carLoan,
  creditDebt,
  retailDebt,
}));

const SMALL_DEALS = Object.freeze([
  { id: 'gro4us-10', type: 'stock', title: 'GRO4US Fund', symbol: 'GRO4US', cost: 10, unitPrice: 10, cashflow: 0, description: 'Фонд торгуется у нижней границы. Можно купить паи.', quantityLabel: 'shares' },
  { id: 'myt4u-5', type: 'stock', title: 'MYT4U Electronics', symbol: 'MYT4U', cost: 5, unitPrice: 5, cashflow: 0, description: 'Слабый рынок снизил цену акций.', quantityLabel: 'shares' },
  { id: 'small-condo-2br', type: 'realEstate', title: '2BR/1BA Condo', cost: 5000, downPayment: 5000, debt: 45000, cashflow: 160, description: 'Небольшая квартира с положительным cashflow.' },
  { id: 'small-house-3br', type: 'realEstate', title: '3BR/2BA House', cost: 9000, downPayment: 9000, debt: 61000, cashflow: 300, description: 'Дом после снижения цены. ROI около 40%.' },
  { id: 'automated-laundry', type: 'business', title: 'Automated Laundry', cost: 15000, downPayment: 15000, debt: 0, cashflow: 700, description: 'Малый бизнес с понятным денежным потоком.' },
  { id: 'coin-rare', type: 'personal', title: 'Rare Gold Coin', cost: 3000, downPayment: 3000, debt: 0, cashflow: 0, description: 'Коллекционный актив. Доход появится при продаже на рынке.' },
]);

const BIG_DEALS = Object.freeze([
  { id: 'apartment-8plex', type: 'realEstate', title: '8-Plex Apartment', cost: 40000, downPayment: 40000, debt: 200000, cashflow: 1700, description: 'Крупная недвижимость, высокий cashflow.' },
  { id: 'apartment-24plex', type: 'realEstate', title: '24-Plex Apartment', cost: 75000, downPayment: 75000, debt: 450000, cashflow: 3200, description: 'Большой объект для выхода из крысиных бегов.' },
  { id: 'limited-partnership', type: 'business', title: 'Limited Partnership', cost: 50000, downPayment: 50000, debt: 0, cashflow: 2400, description: 'Доля в партнёрстве с ежемесячными выплатами.' },
  { id: 'car-wash', type: 'business', title: 'Self-Service Car Wash', cost: 35000, downPayment: 35000, debt: 90000, cashflow: 2500, description: 'Автомойка самообслуживания.' },
]);

const MARKET_CARDS = Object.freeze([
  { id: 'market-gro4us-40', title: 'GRO4US at $40', description: 'Сильный рынок поднял цену фонда.', sellSymbols: ['GRO4US'], sellPrice: 40 },
  { id: 'market-myt4u-30', title: 'MYT4U at $30', description: 'Акции электроники выросли.', sellSymbols: ['MYT4U'], sellPrice: 30 },
  { id: 'market-real-estate-buyer', title: 'Buyer for Small Real Estate', description: 'Покупатель ищет малую недвижимость.', sellTypes: ['realEstate'], multiplier: 2 },
  { id: 'market-business-boom', title: 'Business Buyer', description: 'Инвестор покупает малый бизнес.', sellTypes: ['business'], multiplier: 1.8 },
]);

const DOODADS = Object.freeze([
  { id: 'new-phone', title: 'Новый телефон', cost: 300, description: 'Срочная покупка гаджета.' },
  { id: 'family-vacation', title: 'Семейный отпуск', cost: 1200, description: 'Отпуск нельзя отложить.' },
  { id: 'car-repair', title: 'Ремонт автомобиля', cost: 700, description: 'Авто требует ремонта.' },
  { id: 'medical-bill', title: 'Медицинский счёт', cost: 600, description: 'Непредвиденные расходы.' },
  { id: 'boat-dream', title: 'Лодка мечты', cost: 3500, description: 'Дорогая игрушка, cashflow не создаёт.' },
]);

const DREAMS = Object.freeze([
  { id: 'business-school', title: 'Business School for Kids', cost: 125000, description: 'Профинансировать школу бизнеса для детей.' },
  { id: 'sail-the-world', title: 'Sail the World', cost: 150000, description: 'Кругосветное путешествие под парусом.' },
  { id: 'save-ocean', title: 'Save the Ocean Mammals', cost: 100000, description: 'Экспедиция по защите морских животных.' },
  { id: 'jet-setter', title: 'Be a Jet Setter', cost: 250000, description: 'Личный самолёт на год.' },
  { id: 'african-safari', title: 'African Photo Safari', cost: 75000, description: 'Фото-сафари с друзьями.' },
  { id: 'buy-a-forest', title: 'Buy a Forest', cost: 200000, description: 'Купить и сохранить лес.' },
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function liability(id, title, balance, payment) {
  return { id, title, balance, payment };
}

function professionToFinancials(profession) {
  const totalIncome = profession.salary;
  const totalExpenses = profession.taxes
    + profession.mortgagePayment
    + profession.carPayment
    + profession.creditCardPayment
    + profession.retailPayment
    + profession.otherExpenses;
  return {
    professionId: profession.id,
    profession: profession.title,
    cash: profession.startingSavings,
    salary: profession.salary,
    passiveIncome: 0,
    totalIncome,
    totalExpenses,
    payday: totalIncome - totalExpenses,
    taxes: profession.taxes,
    assets: [],
    liabilities: [
      liability('mortgage', 'Mortgage', profession.mortgage, profession.mortgagePayment),
      liability('car-loan', 'Car Loan', profession.carLoan, profession.carPayment),
      liability('credit-card', 'Credit Cards', profession.creditDebt, profession.creditCardPayment),
      liability('retail-debt', 'Retail Debt', profession.retailDebt, profession.retailPayment),
      liability('other-expenses', 'Other Expenses', 0, profession.otherExpenses),
    ].filter((item) => item.balance > 0 || item.payment > 0),
    children: 0,
    loans: 0,
    monthlyLoanPayment: 0,
  };
}

function pickCard(deck, randomValue = Math.random()) {
  if (!Array.isArray(deck) || deck.length === 0) throw new Error('Колода пуста.');
  const value = Number.isFinite(randomValue) ? randomValue : 0;
  const index = Math.max(0, Math.min(deck.length - 1, Math.floor(value * deck.length)));
  return clone(deck[index]);
}

function pickProfession(index) {
  return clone(PROFESSIONS[index % PROFESSIONS.length]);
}

module.exports = {
  PROFESSIONS,
  SMALL_DEALS,
  BIG_DEALS,
  MARKET_CARDS,
  DOODADS,
  DREAMS,
  professionToFinancials,
  pickCard,
  pickProfession,
};
