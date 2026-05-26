const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRoomStore,
  createRoom,
  joinRoom,
  rejoinRoom,
  setReady,
  startRoomGame,
  closeRoom,
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

test('existing session can rejoin after game started but new players cannot', () => {
  const store = createRoomStore();
  const { room, players } = createRoom(store, { hostName: 'Host', sessionId: 'host_session', settings: { maxPlayers: 2 } });
  const guest = joinRoom(store, room.inviteCode, { name: 'Guest', sessionId: 'guest_session' }).player;

  setReady(store, room.id, guest.id, true);
  startRoomGame(store, room.id, players[0].id);

  const rejoined = rejoinRoom(store, room.inviteCode, { sessionId: 'guest_session' });
  assert.equal(rejoined.player.id, guest.id);

  assert.throws(
    () => rejoinRoom(store, room.inviteCode, { sessionId: 'missing_session' }),
    /Сессия игрока не найдена/
  );

  assert.throws(
    () => joinRoom(store, room.inviteCode, { name: 'Late', sessionId: 'late_session' }),
    /Игра уже началась/
  );
});


test('host can close room and non-host cannot', () => {
  const store = createRoomStore();
  const { room, players } = createRoom(store, { hostName: 'Host', settings: { maxPlayers: 2 } });
  const guest = joinRoom(store, room.inviteCode, { name: 'Guest' }).player;

  assert.throws(() => closeRoom(store, room.id, guest.id), /Только хост/);
  const closed = closeRoom(store, room.id, players[0].id);

  assert.equal(closed.room.status, 'closed');
  assert.throws(() => joinRoom(store, room.inviteCode, { name: 'Late' }), /Комната закрыта/);
});
