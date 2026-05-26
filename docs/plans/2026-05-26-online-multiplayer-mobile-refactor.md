# Online Multiplayer Mobile-First Refactor Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** превратить CashFlowJs в простую mobile-first онлайн-игру: хост создаёт комнату, делится ссылкой, игроки заходят без аккаунтов, лобби синхронизируется, игра стартует и состояние ходов контролируется сервером.

**Architecture:** текущую legacy-игру оставить рабочей как локальный режим, а сетевой режим строить рядом как новый слой. Новая игровая логика должна быть DOM-free: `src/game/*` принимает state/action и возвращает новый state. Сервер Socket.IO — источник правды, клиент только рендерит state и отправляет намерения.

**Tech Stack:** Node.js + Express + Socket.IO, сначала in-memory/JSON-хранилище с интерфейсом под SQLite, далее SQLite/Postgres. Frontend: vanilla mobile-first modules, отдельный `online.html`, затем постепенная миграция legacy `index.html`.

---

## Phase 0: Не ломать текущий локальный режим

### Task 0.1: Зафиксировать режимы запуска

**Objective:** оставить `index.html` локальной игрой и добавить новый `online.html` как mobile-first вход.

**Files:**
- Keep: `index.html`
- Create: `online.html`
- Create: `src/client/online-app.js`
- Create: `src/client/online.css`

**Verification:**
- `http://127.0.0.1:12929/index.html` открывает старую локальную игру.
- `http://127.0.0.1:12929/online.html` открывает новый online shell.

---

## Phase 1: Базовая сетевая игра

### Task 1.1: Room domain model

**Objective:** создать DOM-free модуль комнат.

**Files:**
- Create: `src/server/rooms.js`
- Test: `tests/rooms.test.js`

**Behavior:**
- `createRoom(settings)` создаёт комнату со статусом `lobby` и inviteCode.
- `joinRoom(inviteCode, player)` добавляет игрока 1–8.
- `setReady(roomId, playerId, ready)` обновляет готовность.
- `startGame(roomId, hostPlayerId)` разрешён только хосту.

**Verification:**
- `npm test -- tests/rooms.test.js`

### Task 1.2: Game state reducer

**Objective:** создать серверный reducer для базовых фаз.

**Files:**
- Create: `src/game/engine.js`
- Test: `tests/engine.test.js`

**Behavior:**
- `createInitialGameState(room)` создаёт игроков, порядок ходов, позиции, actionLog.
- `applyGameAction(state, action)` проверяет текущего игрока и фазу.
- `ROLL_DICE` бросается на сервере через injectable RNG.
- `END_TURN` переводит ход следующему игроку.

**Verification:**
- тесты проверяют: не текущий игрок не может бросить, кубик 1–6, ход меняется.

### Task 1.3: Express + Socket.IO server

**Objective:** добавить backend с REST и realtime событиями.

**Files:**
- Create: `src/server/index.js`
- Create: `src/server/sockets.js`
- Modify: `package.json`

**REST:**
- `POST /api/rooms`
- `GET /api/rooms/:roomId`
- `POST /api/rooms/:roomId/join`
- `GET /api/rooms/:roomId/state`

**Socket events:**
- `room:create`, `room:join`, `room:ready`, `game:start`, `game:action`, `game:state`, `game:error`, `game:log`.

### Task 1.4: Mobile online client shell

**Objective:** реализовать поток: создать комнату → скопировать ссылку → join → lobby → ready → start.

**Files:**
- Create: `online.html`
- Create: `src/client/online-app.js`
- Create: `src/client/online.css`

**UX:**
- две кнопки: `Новая локальная игра`, `Новая онлайн-игра`.
- route `?room=CODE` показывает join screen.
- лобби показывает invite URL, copy/share, players, ready, start.

---

## Phase 2: Синхронизация ходов

### Task 2.1: Current-action mobile screen

**Objective:** сделать главный мобильный игровой экран карточкой текущего действия, а не огромной доской.

**Files:**
- Modify: `src/client/online-app.js`
- Modify: `src/client/online.css`

**UI:**
- top bar: current player, turn number, cash/passive.
- center: current cell/action card.
- bottom: primary action + secondary actions.
- tabs: Board, Finance, Players, Log.

### Task 2.2: Server-authoritative roll/end turn

**Objective:** сервер принимает `ROLL_DICE`/`END_TURN`, обновляет state и рассылает всем.

**Acceptance:** два браузера в одной комнате видят одинаковый turn/dice/log.

---

## Phase 3: Финансовые действия

### Task 3.1: Extract legacy card data

**Objective:** вынести карточки и профессии в DOM-free data modules.

**Files:**
- Create: `src/game/data/professions.js`
- Create: `src/game/data/cards.js`
- Create: `src/game/financials.js`

### Task 3.2: Buy/sell/loan/pay reducers

**Objective:** реализовать серверные проверки средств, кредитов, покупки/продажи.

---

## Phase 4: Mobile-first UI

### Task 4.1: Bottom sheets

**Objective:** все сложные действия открываются через bottom sheet.

### Task 4.2: Finance accordion

**Objective:** финансовый отчёт разбить на Cash/Income/Expenses/Assets/Liabilities.

### Task 4.3: Board as secondary tab

**Objective:** доска — вкладка с автопрокруткой к текущей позиции, основной экран — карточка текущей клетки.

---

## Phase 5: Persistence and production hardening

### Task 5.1: SQLite storage adapter

**Objective:** сохранять комнату после каждого важного action.

### Task 5.2: Reconnect/session recovery

**Objective:** `localStorage.cashflowSessionId` восстанавливает игрока по ссылке.

### Task 5.3: Errors/rate limit/XSS

**Objective:** короткие понятные ошибки, server-side validation, sanitize player names.

---

## Current Implementation Decision

Начинаем с Phase 1 как отдельного online-среза, не ломая legacy local mode. После того как online room/lobby/state loop заработает, переносим правила из legacy в `src/game/*` маленькими TDD-шагами.
