const fs = require('node:fs');
const path = require('node:path');
const { createRoomStore } = require('./rooms');

function serializeStore(store) {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    rooms: Array.from(store.rooms.values()),
    gameStates: Array.from(store.gameStates.entries()),
  };
}

function rebuildInviteIndex(store) {
  store.inviteIndex.clear();
  for (const room of store.rooms.values()) {
    store.inviteIndex.set(room.inviteCode, room.id);
  }
  return store;
}

function hydrateStore(payload = {}) {
  const store = createRoomStore();
  for (const room of payload.rooms || []) {
    store.rooms.set(room.id, room);
  }
  for (const [roomId, gameState] of payload.gameStates || []) {
    store.gameStates.set(roomId, gameState);
  }
  return rebuildInviteIndex(store);
}

function saveStore(store, filePath) {
  if (!filePath) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(serializeStore(store), null, 2));
  fs.renameSync(tmpPath, filePath);
}

function loadStore(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return createRoomStore();
  const raw = fs.readFileSync(filePath, 'utf8');
  if (!raw.trim()) return createRoomStore();
  return hydrateStore(JSON.parse(raw));
}

function createPersistedStore(filePath) {
  const store = loadStore(filePath);
  store.persist = () => saveStore(store, filePath);
  return store;
}

module.exports = {
  serializeStore,
  hydrateStore,
  saveStore,
  loadStore,
  createPersistedStore,
};
