const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRoomStore,
  createRoom,
  joinRoom,
  setReady,
  startRoomGame,
} = require('../src/server/rooms');

test('createRoom creates a lobby room with host and invite code', () => {
  const store = createRoomStore();
  const result = createRoom(store, {
    hostName: 'Roman',
    hostColor: 'green',
    settings: { maxPlayers: 4, quickStart: true },
  });

  assert.equal(result.room.status, 'lobby');
  assert.match(result.room.inviteCode, /^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  assert.equal(result.players.length, 1);
  assert.equal(result.players[0].isHost, true);
  assert.equal(result.players[0].name, 'Roman');
});

test('joinRoom adds players and rejects full rooms', () => {
  const store = createRoomStore();
  const { room } = createRoom(store, { hostName: 'Host', settings: { maxPlayers: 1 } });

  assert.throws(
    () => joinRoom(store, room.inviteCode, { name: 'Alex' }),
    /Комната заполнена/
  );
});

test('ready and start are host-gated', () => {
  const store = createRoomStore();
  const { room, players } = createRoom(store, { hostName: 'Host', settings: { maxPlayers: 2 } });
  const guest = joinRoom(store, room.inviteCode, { name: 'Guest' }).player;

  setReady(store, room.id, players[0].id, true);
  setReady(store, room.id, guest.id, true);

  assert.throws(() => startRoomGame(store, room.id, guest.id), /Только хост/);
  const started = startRoomGame(store, room.id, players[0].id);
  assert.equal(started.room.status, 'playing');
});
