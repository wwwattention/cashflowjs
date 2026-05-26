const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { createRoomStore, createRoom, joinRoom } = require('../src/server/rooms');
const { saveStore, loadStore } = require('../src/server/storage');
const { createInitialGameState } = require('../src/game/engine');

test('JSON storage restores rooms, invite index, players, and game state', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cashflowjs-store-'));
  const file = path.join(dir, 'rooms.json');
  const store = createRoomStore();
  const created = createRoom(store, { hostName: 'Roman', sessionId: 'host_session' });
  const joined = joinRoom(store, created.room.inviteCode, { name: 'Alex', sessionId: 'alex_session' });
  store.gameStates.set(created.room.id, createInitialGameState({ ...created.room, players: joined.players }));

  saveStore(store, file);
  const restored = loadStore(file);

  assert.equal(restored.rooms.size, 1);
  assert.equal(restored.inviteIndex.get(created.room.inviteCode), created.room.id);
  assert.equal(restored.rooms.get(created.room.id).players.length, 2);
  assert.equal(restored.gameStates.get(created.room.id).status, 'playing');
});
