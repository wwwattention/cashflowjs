const crypto = require('node:crypto');

const DEFAULT_SETTINGS = Object.freeze({
  maxPlayers: 8,
  randomJobs: true,
  manualDice: false,
  quickStart: false,
  mode: 'standard',
});

const COLORS = ['green', 'red', 'blue', 'black', 'pink', 'aqua', 'orange', 'gold'];

function createRoomStore() {
  return {
    rooms: new Map(),
    inviteIndex: new Map(),
    gameStates: new Map(),
  };
}

function id(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function inviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}

function sanitizeName(name) {
  const cleaned = String(name || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Игрок';
  return cleaned.slice(0, 32);
}

function normalizeColor(color, used = new Set()) {
  if (color && COLORS.includes(color) && !used.has(color)) return color;
  return COLORS.find((candidate) => !used.has(candidate)) || COLORS[0];
}

function publicRoom(room) {
  return {
    id: room.id,
    inviteCode: room.inviteCode,
    status: room.status,
    hostPlayerId: room.hostPlayerId,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    maxPlayers: room.maxPlayers,
    settings: room.settings,
  };
}

function snapshot(room) {
  return {
    room: publicRoom(room),
    players: room.players.map((player) => ({ ...player })),
  };
}

function createRoom(store, input = {}) {
  const now = new Date().toISOString();
  const settings = { ...DEFAULT_SETTINGS, ...(input.settings || {}) };
  const maxPlayers = Math.max(1, Math.min(8, Number(settings.maxPlayers || DEFAULT_SETTINGS.maxPlayers)));
  settings.maxPlayers = maxPlayers;

  let code = inviteCode();
  while (store.inviteIndex.has(code)) code = inviteCode();

  const host = {
    id: id('player'),
    sessionId: input.sessionId || id('session'),
    name: sanitizeName(input.hostName || input.name || 'Хост'),
    color: normalizeColor(input.hostColor || input.color),
    isHost: true,
    isConnected: true,
    isReady: false,
    position: 0,
    track: 'ratRace',
    skipTurns: 0,
    charityTurns: 0,
    createdAt: now,
  };

  const room = {
    id: id('room'),
    inviteCode: code,
    status: 'lobby',
    hostPlayerId: host.id,
    createdAt: now,
    updatedAt: now,
    maxPlayers,
    settings,
    players: [host],
  };

  store.rooms.set(room.id, room);
  store.inviteIndex.set(room.inviteCode, room.id);
  return snapshot(room);
}

function findRoomByInvite(store, invite) {
  const roomId = store.inviteIndex.get(String(invite || '').toUpperCase());
  return roomId ? store.rooms.get(roomId) : undefined;
}

function getRoom(store, roomId) {
  const room = store.rooms.get(roomId);
  if (!room) throw new Error('Комната не найдена.');
  return snapshot(room);
}

function joinRoom(store, invite, input = {}) {
  const room = findRoomByInvite(store, invite);
  if (!room) throw new Error('Комната не найдена.');
  if (room.status !== 'lobby') throw new Error('Игра уже началась.');
  if (room.players.length >= room.maxPlayers) throw new Error('Комната заполнена.');

  const sessionId = input.sessionId || id('session');
  const existing = room.players.find((player) => player.sessionId === sessionId);
  if (existing) {
    existing.isConnected = true;
    room.updatedAt = new Date().toISOString();
    return { ...snapshot(room), player: { ...existing } };
  }

  const usedColors = new Set(room.players.map((player) => player.color));
  const player = {
    id: id('player'),
    sessionId,
    name: sanitizeName(input.name),
    color: normalizeColor(input.color, usedColors),
    isHost: false,
    isConnected: true,
    isReady: false,
    position: 0,
    track: 'ratRace',
    skipTurns: 0,
    charityTurns: 0,
    createdAt: new Date().toISOString(),
  };

  room.players.push(player);
  room.updatedAt = new Date().toISOString();
  return { ...snapshot(room), player: { ...player } };
}

function setReady(store, roomId, playerId, ready) {
  const room = store.rooms.get(roomId);
  if (!room) throw new Error('Комната не найдена.');
  const player = room.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new Error('Игрок не найден.');
  player.isReady = Boolean(ready);
  room.updatedAt = new Date().toISOString();
  return snapshot(room);
}

function startRoomGame(store, roomId, playerId) {
  const room = store.rooms.get(roomId);
  if (!room) throw new Error('Комната не найдена.');
  if (room.hostPlayerId !== playerId) throw new Error('Только хост может начать игру.');
  if (room.players.length < 1) throw new Error('Нужен хотя бы один игрок.');
  const notReady = room.players.filter((player) => !player.isHost && !player.isReady);
  if (notReady.length > 0) throw new Error('Не все игроки готовы.');
  room.status = 'playing';
  room.updatedAt = new Date().toISOString();
  return snapshot(room);
}

function markDisconnected(store, roomId, playerId) {
  const room = store.rooms.get(roomId);
  if (!room) return undefined;
  const player = room.players.find((candidate) => candidate.id === playerId);
  if (player) player.isConnected = false;
  room.updatedAt = new Date().toISOString();
  return snapshot(room);
}

module.exports = {
  createRoomStore,
  createRoom,
  getRoom,
  joinRoom,
  setReady,
  startRoomGame,
  markDisconnected,
  snapshot,
  COLORS,
};
