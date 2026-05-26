/*
 * CashFlowJs onboarding and board usability helpers.
 * Presentation-only layer: it does not change game rules, card data, player state, or turn logic.
 */
(function () {
  'use strict';

  var storageKey = 'cashflowjs.onboarding.dismissed.v1';
  var overlay;
  var tooltip;
  var activeStep = 0;
  var flow = [];

  var flows = {
    welcome: [
      {
        title: 'Добро пожаловать в CashFlowJs',
        body: 'Цель игры — выйти из «крысиных бегов»: покупайте активы, следите за расходами и увеличивайте пассивный доход.',
        target: '#home-title'
      },
      {
        title: 'Начните новую сессию',
        body: 'Нажмите на главный экран, затем создайте игру. Все подсказки можно закрыть — игровая логика от этого не меняется.',
        target: '#click-to-start'
      }
    ],
    setup: [
      {
        title: 'Настройте игроков',
        body: 'Выберите количество игроков, профессии, цвета и дополнительные правила. Для быстрого старта можно оставить значения по умолчанию.',
        target: '#player-setup-container'
      },
      {
        title: 'Активы и опции',
        body: 'Эти переключатели определяют, какие типы карточек попадут в игру. Если сомневаетесь — оставьте стандартный набор.',
        target: '#options-container'
      },
      {
        title: 'Создайте сессию',
        body: 'Кнопка «Начать игру» создаёт партию и переводит вас к выбору мечты и игровому полю.',
        target: '#start-game'
      }
    ],
    board: [
      {
        title: 'Игровая доска',
        body: 'На маленьком экране поле прокручивается горизонтально. Наведите курсор или нажмите на клетку, чтобы увидеть её текст крупнее.',
        target: '#board2'
      },
      {
        title: 'Текущее действие',
        body: 'Центральная карточка показывает, что нужно сделать сейчас: выбрать мечту, бросить кубик, купить актив или завершить ход.',
        target: '#turn-info'
      },
      {
        title: 'Панель управления',
        body: 'Внизу доступны игровые кнопки: новая игра, бросок кубика, погашение долга и другие действия по ходу партии.',
        target: '#game-menu'
      }
    ]
  };

  function qs(sel) { return document.querySelector(sel); }
  function visible(sel) {
    var el = qs(sel);
    return !!(el && el.offsetParent !== null && getComputedStyle(el).display !== 'none');
  }

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'cf-onboarding';
    overlay.innerHTML =
      '<div class="cf-onboarding-scrim" data-cf-close="1"></div>' +
      '<section class="cf-onboarding-card" role="dialog" aria-live="polite" aria-label="Подсказка по игре">' +
        '<div class="cf-onboarding-kicker">Быстрый старт</div>' +
        '<h2></h2>' +
        '<p></p>' +
        '<div class="cf-onboarding-actions">' +
          '<button type="button" class="cf-onboarding-skip">Пропустить</button>' +
          '<button type="button" class="cf-onboarding-next">Далее</button>' +
        '</div>' +
      '</section>';
    document.body.appendChild(overlay);
    overlay.querySelector('.cf-onboarding-skip').addEventListener('click', closeOverlay);
    overlay.querySelector('.cf-onboarding-next').addEventListener('click', nextStep);
    overlay.querySelector('.cf-onboarding-scrim').addEventListener('click', closeOverlay);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-visible')) closeOverlay();
    });
    return overlay;
  }

  function clearTarget() {
    document.querySelectorAll('.cf-onboarding-target').forEach(function (el) {
      el.classList.remove('cf-onboarding-target');
    });
  }

  function showFlow(name, force) {
    if (!force && localStorage.getItem(storageKey) === 'yes') return;
    flow = flows[name] || flows.welcome;
    activeStep = 0;
    renderStep();
  }

  function renderStep() {
    ensureOverlay();
    clearTarget();
    var step = flow[activeStep];
    if (!step) return closeOverlay();
    overlay.querySelector('h2').textContent = step.title;
    overlay.querySelector('p').textContent = step.body;
    overlay.querySelector('.cf-onboarding-next').textContent = activeStep === flow.length - 1 ? 'Понятно' : 'Далее';
    var target = qs(step.target);
    if (target) target.classList.add('cf-onboarding-target');
    overlay.classList.add('is-visible');
  }

  function nextStep() {
    activeStep += 1;
    if (activeStep >= flow.length) closeOverlay(); else renderStep();
  }

  function closeOverlay() {
    if (overlay) overlay.classList.remove('is-visible');
    clearTarget();
    localStorage.setItem(storageKey, 'yes');
  }

  function ensureHelpButton() {
    if (qs('#cf-help-button')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'cf-help-button';
    btn.textContent = 'Помощь';
    btn.addEventListener('click', function () {
      if (visible('#board2')) showFlow('board', true);
      else if (visible('#setup-screen')) showFlow('setup', true);
      else showFlow('welcome', true);
    });
    document.body.appendChild(btn);
  }

  function ensureBoardHint() {
    if (qs('#cf-board-hint') || !qs('#game-container')) return;
    var hint = document.createElement('div');
    hint.id = 'cf-board-hint';
    hint.innerHTML = '<strong>Подсказка:</strong> наведите или нажмите на клетку — текст откроется крупно. На телефоне поле можно прокручивать вбок.';
    var game = qs('#game-container');
    game.parentNode.insertBefore(hint, game);
  }

  function ensureTooltip() {
    if (tooltip) return tooltip;
    tooltip = document.createElement('div');
    tooltip.id = 'cf-cell-preview';
    tooltip.setAttribute('role', 'status');
    document.body.appendChild(tooltip);
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.cell, .cell2, .cell2-left, .cell2-right, .cell2-top, .cell2-bottom') && !e.target.closest('#cf-cell-preview')) {
        tooltip.classList.remove('is-visible');
      }
    });
    return tooltip;
  }

  function cleanText(text) {
    return (text || '').replace(/\s+/g, ' ').trim();
  }

  function attachCellPreview() {
    ensureTooltip();
    var cells = document.querySelectorAll('.cell, .cell2, .cell2-left, .cell2-right, .cell2-top, .cell2-bottom');
    cells.forEach(function (cell) {
      if (cell.dataset.cfPreviewReady === '1') return;
      cell.dataset.cfPreviewReady = '1';
      var updateTitle = function () {
        var text = cleanText(cell.innerText || cell.textContent);
        if (text) cell.setAttribute('title', text);
      };
      updateTitle();
      cell.addEventListener('mouseenter', function () { showCellPreview(cell); });
      cell.addEventListener('focus', function () { showCellPreview(cell); });
      cell.addEventListener('click', function () { showCellPreview(cell); });
      cell.addEventListener('mouseleave', function () { tooltip.classList.remove('is-visible'); });
    });
  }

  function showCellPreview(cell) {
    var text = cleanText(cell.innerText || cell.textContent);
    if (!text || text.length < 3) return;
    tooltip.textContent = text;
    var rect = cell.getBoundingClientRect();
    var top = Math.max(12, rect.top + window.scrollY - tooltip.offsetHeight - 14);
    var left = Math.min(window.innerWidth - 340, Math.max(12, rect.left + window.scrollX + rect.width / 2 - 160));
    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
    tooltip.classList.add('is-visible');
  }

  function refreshBoardState() {
    ensureHelpButton();
    if (visible('#board2') || visible('#board')) {
      ensureBoardHint();
      attachCellPreview();
      document.body.classList.add('cf-board-active');
      if (!localStorage.getItem(storageKey + '.board')) {
        localStorage.setItem(storageKey + '.board', 'yes');
        setTimeout(function () { showFlow('board', true); }, 500);
      }
    }
  }

  function hookButtons() {
    var newGame = qs('#new-room-button');
    if (newGame && newGame.dataset.cfHooked !== '1') {
      newGame.dataset.cfHooked = '1';
      newGame.addEventListener('click', function () {
        setTimeout(function () { showFlow('setup', true); }, 250);
      });
    }
    var start = qs('#start-game');
    if (start && start.dataset.cfHooked !== '1') {
      start.dataset.cfHooked = '1';
      start.addEventListener('click', function () {
        setTimeout(refreshBoardState, 700);
      });
    }
  }

  function init() {
    ensureHelpButton();
    hookButtons();
    if (!localStorage.getItem(storageKey)) setTimeout(function () { showFlow('welcome', false); }, 700);
    setInterval(function () {
      hookButtons();
      refreshBoardState();
    }, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
