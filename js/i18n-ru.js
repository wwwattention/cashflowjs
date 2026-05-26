/* Russian localization layer for CashFlowJs.
 * Keeps original option values for game logic, translates visible text and game data.
 */
(function () {
  'use strict';

  var exact = {
    'CashFlowJs': 'CashFlowJs',
    'Click to start': 'Нажмите, чтобы начать',
    'Create New Game': 'Создать новую игру',
    'Number of Players:': 'Количество игроков:',
    'Player 1': 'Игрок 1', 'Player 2': 'Игрок 2', 'Player 3': 'Игрок 3', 'Player 4': 'Игрок 4',
    'Player 5': 'Игрок 5', 'Player 6': 'Игрок 6', 'Player 7': 'Игрок 7', 'Player 8': 'Игрок 8',
    'Insurance': 'Страховка',
    'Random Job': 'Случайная профессия',
    'Random Color': 'Случайный цвет',
    'Green': 'Зелёный', 'Red': 'Красный', 'Blue': 'Синий', 'Black': 'Чёрный', 'Pink': 'Розовый',
    'Aqua': 'Аква', 'Orange': 'Оранжевый', 'Gold': 'Золотой', 'White': 'Белый',
    'Airline Pilot: $9500': 'Пилот авиалиний: $9500',
    'Business Manager: $4600': 'Бизнес-менеджер: $4600',
    'Doctor (MD): $13200': 'Врач: $13200',
    'Engineer: $4900': 'Инженер: $4900',
    'Janitor: $1600': 'Уборщик: $1600',
    'Lawyer: $7500': 'Юрист: $7500',
    'Mechanic: $2000': 'Механик: $2000',
    'Nurse: $3100': 'Медсестра: $3100',
    'Police Officer $3000': 'Полицейский: $3000',
    'Secretary: $2500': 'Секретарь: $2500',
    'Teacher (K-12): $3300': 'Учитель: $3300',
    'Truck Driver: $2500': 'Водитель грузовика: $2500',
    'CEO: $24000': 'Генеральный директор: $24000',
    'Start Game': 'Начать игру',
    'Continue Game': 'Продолжить игру',
    'Default': 'По умолчанию',
    'Assets': 'Активы',
    'Small Real Estate': 'Малая недвижимость',
    'Big Real Estate': 'Крупная недвижимость',
    'Stocks': 'Акции',
    'Mutuals': 'Паевые фонды',
    'Preferred Stocks': 'Привилегированные акции',
    'Certificates of Deposit': 'Депозитные сертификаты',
    'Coins': 'Монеты',
    'Limited Partnership': 'Ограниченное партнёрство',
    'Companies': 'Компании',
    'Options': 'Опции',
    'Have >3 Kids': 'Иметь больше 3 детей',
    'Doodads with Paychecks': 'Расходы вместе с зарплатой',
    'Early Mortgage Payoff': 'Досрочное погашение ипотеки',
    'Instant Fast Track': 'Сразу на Быструю дорожку',
    'One Cent Away': 'В одном центе от цели',
    'No Starting Loans': 'Без начальных кредитов',
    'Manual Dice': 'Ручной ввод кубиков',
    'Delete Saved Game': 'Удалить сохранённую игру',
    'Starting Savings:': 'Начальные сбережения:',
    'None': 'Нет', 'Normal': 'Обычно', 'Salary': 'Зарплата', '2x Salary': '2× зарплата',
    'Custom': 'Пользовательский', 'Hard': 'Сложный', 'Fast': 'Быстрый',
    'CHOOSE YOUR DREAM': 'ВЫБЕРИТЕ СВОЮ МЕЧТУ',
    'Select': 'Выбрать',
    'You are a': 'Ваша профессия:',
    'Your starting salary is $': 'Ваша начальная зарплата: $',
    'You have $': 'У вас $',
    'in your savings.': 'сбережений.',
    'That means your starting cash is $': 'Это значит, что стартовая наличность: $',
    "'s turn": ': ход игрока',
    'When you are ready, roll the die and take your turn': 'Когда будете готовы, бросьте кубик и сделайте ход',
    'Before you start your turn, review your financial statement. You may also use this time to repay liabilities or borrow money.': 'Перед началом хода проверьте финансовый отчёт. Также можно погасить обязательства или занять деньги.',
    'FINISH YOUR TURN': 'ЗАВЕРШИТЕ ХОД',
    'Before you end your turn, review your financial statement. You may also use this time to repay liabilities or borrow money.': 'Перед окончанием хода проверьте финансовый отчёт. Также можно погасить обязательства или занять деньги.',
    'DEAL OPPORTUNITY': 'ВОЗМОЖНОСТЬ СДЕЛКИ',
    'Which type of deal do you want?': 'Какой тип сделки вы хотите?',
    'Small deals cost $5,000 or less.': 'Малые сделки стоят $5 000 или меньше.',
    'Big deals cost $6,000 or more.': 'Крупные сделки стоят $6 000 или больше.',
    'Small Deal': 'Малая сделка', 'Big Deal': 'Крупная сделка',
    'Buy': 'Купить', 'Pass': 'Пропустить', 'Done': 'Готово', 'Roll': 'Бросить кубик',
    'End Turn': 'Завершить ход', 'Save Game': 'Сохранить игру', 'Menu': 'Меню',
    'Borrow': 'Занять', 'Repay': 'Погасить', 'Pay': 'Заплатить', 'Sell': 'Продать',
    'OFFER': 'ПРЕДЛОЖЕНИЕ', 'OPPORTUNITY': 'ВОЗМОЖНОСТЬ', 'LIABILITY': 'ОБЯЗАТЕЛЬСТВО',
    'CHARITY': 'БЛАГОТВОРИТЕЛЬНОСТЬ', 'PAYCHECK': 'ЗАРПЛАТА', 'DOWNSIZE': 'СОКРАЩЕНИЕ', 'CHILD': 'РЕБЁНОК',
    'Healthcare!': 'Медицина!', 'Lawsuit!': 'Судебный иск!', 'Divorce!': 'Развод!',
    'CASHFLOW DAY': 'ДЕНЬ CASHFLOW', 'cashflow day': 'день Cashflow',
    'Dream': 'Мечта', 'A chance to have your dream come true': 'Шанс осуществить вашу мечту',
    'ASSETS': 'АКТИВЫ', 'LIABILITIES': 'ОБЯЗАТЕЛЬСТВА', 'INCOME': 'ДОХОДЫ', 'EXPENSES': 'РАСХОДЫ',
    'Title': 'Название', 'Cash Flow': 'Денежный поток', 'Cost': 'Стоимость', 'Down Pay': 'Первый взнос',
    'Mortgage': 'Ипотека', 'Price': 'Цена', 'Range': 'Диапазон', 'Shares': 'Акции', 'Symbol': 'Тикер',
    'Description': 'Описание', 'Rule': 'Правило', 'Cash': 'Наличные', 'Salary': 'Зарплата',
    'Interest': 'Проценты', 'Dividends': 'Дивиденды', 'Real Estate': 'Недвижимость', 'Business': 'Бизнес',
    'Bank Loan': 'Банковский кредит', 'Home Mortgage': 'Ипотека дома', 'School Loan': 'Студенческий кредит',
    'Car Loan': 'Автокредит', 'Credit Card': 'Кредитная карта', 'Retail': 'Розничный долг', 'Loans': 'Кредиты', 'Boat': 'Лодка',
    'Mutual Fund': 'Паевой фонд', 'Stock': 'Акция', 'Stock Split': 'Дробление акций', 'Reverse Split': 'Обратное дробление',
    'Preferred Stock': 'Привилегированная акция', 'Certificate of Deposit': 'Депозитный сертификат',
    'Limited Partner': 'Ограниченный партнёр', 'Small Business': 'Малый бизнес',
    'Game Saved!': 'Игра сохранена!'
  };

  var phrases = [
    [/Only you may buy as many units as you want at this price\. Everyone may sell at this price\.?/g, 'Только вы можете купить любое количество паёв по этой цене. Все могут продать по этой цене.'],
    [/Only you may buy as many shares as you want at this price\. Everyone may sell at this price\.?/g, 'Только вы можете купить любое количество акций по этой цене. Все могут продать по этой цене.'],
    [/Everyone may sell at this price\.?/g, 'Все могут продать по этой цене.'],
    [/Everyone who owns (.*?) shares doubles the number of shares they own\.?/g, 'Все владельцы акций $1 удваивают количество своих акций.'],
    [/Everyone who owns (.*?) shares cuts shares owned to 1\/2 previous value\.?/g, 'Все владельцы акций $1 сокращают количество акций до половины прежнего значения.'],
    [/Lower interest rates/g, 'Снижение процентных ставок'], [/High interest rates/g, 'Высокие процентные ставки'],
    [/Low interest rates/g, 'Низкие процентные ставки'], [/Record interest rates/g, 'Рекордные процентные ставки'],
    [/High inflation/g, 'Высокая инфляция'], [/Low inflation/g, 'Низкая инфляция'], [/Inflation worries/g, 'Опасения инфляции'],
    [/Booming market/g, 'Бурный рост рынка'], [/Strong market/g, 'Сильный рынок'], [/Weak market/g, 'Слабый рынок'],
    [/Market strength/g, 'Сила рынка'], [/Market panic/g, 'Паника на рынке'], [/Trade war panic/g, 'Паника из-за торговой войны'],
    [/share price/g, 'цена акции'], [/shares/g, 'акции'], [/stockholders/g, 'акционеры'], [/mutual fund/g, 'паевой фонд'],
    [/home electronics seller/g, 'продавец бытовой электроники'], [/maker of medicines/g, 'производитель лекарств'],
    [/record high/g, 'рекордного максимума'], [/record low/g, 'рекордного минимума'], [/poor/g, 'слабая'], [/strong/g, 'сильная'],
    [/Buy (\d[\d,]*) shares at (.*?)\/share/g, 'Купите $1 акций по $2 за акцию'],
    [/If you roll a 6 on one die/g, 'Если на одном кубике выпадет 6'], [/If you roll a 5 or 6/g, 'Если выпадет 5 или 6'],
    [/roll one die/g, 'бросьте один кубик'], [/Roll one die/g, 'Бросьте один кубик'], [/Roll less than 6/g, 'Если выпадет меньше 6'],
    [/collect \$(\d[\d,]*)/g, 'получите $$$1'], [/get \$(\d[\d,]*)/g, 'получите $$$1'], [/pay \$(\d[\d,]*)/gi, 'заплатите $$$1'],
    [/Pay one half of your cash/g, 'Заплатите половину наличных'], [/Lose half of your cash/g, 'Потеряйте половину наличных'],
    [/Lose lowest cash-flowing asset/g, 'Потеряйте актив с самым низким денежным потоком'],
    [/Pay 10x monthly cash flow of lowest cash flowing asset or lose business\.?/g, 'Заплатите 10× месячного денежного потока самого слабого актива или потеряйте бизнес.'],
    [/Donate 10% of CASHFLOW Day Income and use 1 or 2 dice for next 3 turns/g, 'Пожертвуйте 10% дохода дня Cashflow и используйте 1 или 2 кубика следующие 3 хода'],
    [/Cash-on-Cash return/g, 'доходность на вложенные деньги'], [/Cash Flow/g, 'денежный поток'], [/Cashflow/g, 'денежный поток'], [/Cash Flow/g, 'денежный поток'],
    [/\+([\d,]+)\/mo/g, '+$1/мес'], [/\$(\d[\d,]*) down/g, '$$$1 взнос'], [/down payment/g, 'первый взнос'],
    [/cost/g, 'стоимость'], [/mortgage/g, 'ипотека'], [/loan/g, 'кредит'], [/liability/g, 'обязательство'], [/asset/g, 'актив'],
    [/opportunity/g, 'возможность'], [/deal/g, 'сделка'], [/business/g, 'бизнес'], [/company/g, 'компания'], [/market/g, 'рынок'],
    [/income/g, 'доход'], [/expenses/g, 'расходы'], [/savings/g, 'сбережения'], [/salary/g, 'зарплата'], [/children/g, 'дети'], [/child/g, 'ребёнок'],
    [/You may borrow money from the bank/g, 'Вы можете занять деньги в банке'], [/You may repay liabilities/g, 'Вы можете погасить обязательства'],
    [/Fast Track/g, 'Быстрая дорожка'], [/Rat Race/g, 'Крысиные бега']
  ];

  function translateText(s) {
    if (typeof s !== 'string' || !s.trim()) return s;
    var leading = s.match(/^\s*/)[0];
    var trailing = s.match(/\s*$/)[0];
    var core = s.trim();
    if (exact[core]) return leading + exact[core] + trailing;
    var out = core;
    phrases.forEach(function (p) { out = out.replace(p[0], p[1]); });
    if (exact[out]) out = exact[out];
    return leading + out + trailing;
  }

  function translateNodeText(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var parent = node.parentNode;
        if (!parent || ['SCRIPT', 'STYLE', 'TEXTAREA'].indexOf(parent.nodeName) !== -1) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var translated = translateText(node.nodeValue);
      if (translated !== node.nodeValue) node.nodeValue = translated;
    });
  }

  function translateAttributes(root) {
    var els = (root.querySelectorAll ? root.querySelectorAll('[title], input[value], button, option') : []);
    Array.prototype.forEach.call(els, function (el) {
      if (el.hasAttribute && el.hasAttribute('title')) el.setAttribute('title', translateText(el.getAttribute('title')));
      if (el.tagName === 'INPUT' && (el.type === 'button' || el.type === 'submit') && el.value) el.value = translateText(el.value);
      if (el.tagName === 'OPTION') {
        if (!el.hasAttribute('value')) el.setAttribute('value', el.textContent.trim());
        el.textContent = translateText(el.textContent);
      }
    });
  }

  function translateObject(obj, seen) {
    if (!obj || typeof obj !== 'object') return;
    seen = seen || [];
    if (seen.indexOf(obj) !== -1) return;
    seen.push(obj);
    Object.keys(obj).forEach(function (k) {
      var v = obj[k];
      if (typeof v === 'string') {
        if (['id', 'symbol'].indexOf(k) === -1 && !/^#[\w-]+$/.test(v) && !/^[\w-]+$/.test(v)) obj[k] = translateText(v);
        if (['type', 'name', 'description', 'rule', 'title'].indexOf(k) !== -1) obj[k] = translateText(obj[k]);
      } else if (v && typeof v === 'object') translateObject(v, seen);
    });
  }

  function localize() {
    translateAttributes(document.body);
    translateNodeText(document.body);
    if (window.APP) {
      translateObject(APP.cards);
      translateObject(APP.fastTrack);
      translateObject(APP.dreams);
      translateObject(APP.scenarioChoices);
    }
  }

  window.CASHFLOW_RU = { translateText: translateText, localize: localize };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', localize);
  } else {
    localize();
  }
  new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      Array.prototype.forEach.call(m.addedNodes, function (node) {
        if (node.nodeType === 1) { translateAttributes(node); translateNodeText(node); }
        if (node.nodeType === 3) node.nodeValue = translateText(node.nodeValue);
      });
      if (m.type === 'characterData') {
        var t = translateText(m.target.nodeValue);
        if (t !== m.target.nodeValue) m.target.nodeValue = t;
      }
    });
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
