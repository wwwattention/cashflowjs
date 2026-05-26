const { Server } = require('socket.io');
const { createInitialGameState, applyGameAction } = require('../game/engine');
const {
  createRoom,
  getRoom,
  joinRoom,
  setReady,
  startRoomGame,
  markDisconnected,
} = require('./rooms');

function emitLobby(io, roomSnapshot) {
  io.to(roomSnapshot.room.id).emit('lobbyUpdated', roomSnapshot);
}

function installSockets(httpServer, store) {
  const io = new Server(httpServer, {
    cors: { origin: true },
  });

  io.on('connection', (socket) => {
    socket.on('room:create', (payload = {}, reply = () => {}) => {
      try {
        const snapshot = createRoom(store, payload);
        socket.join(snapshot.room.id);
        socket.data.roomId = snapshot.room.id;
        socket.data.playerId = snapshot.players[0].id;
        reply({ ok: true, ...snapshot, player: snapshot.players[0] });
        emitLobby(io, snapshot);
      } catch (error) {
        reply({ ok: false, error: error.message });
      }
    });

    socket.on('room:join', (payload = {}, reply = () => {}) => {
      try {
        const snapshot = joinRoom(store, payload.inviteCode, payload);
        socket.join(snapshot.room.id);
        socket.data.roomId = snapshot.room.id;
        socket.data.playerId = snapshot.player.id;
        reply({ ok: true, ...snapshot });
        emitLobby(io, snapshot);
      } catch (error) {
        reply({ ok: false, error: error.message });
      }
    });

    socket.on('room:ready', (payload = {}, reply = () => {}) => {
      try {
        const snapshot = setReady(store, payload.roomId, payload.playerId || socket.data.playerId, payload.ready);
        reply({ ok: true, ...snapshot });
        emitLobby(io, snapshot);
      } catch (error) {
        reply({ ok: false, error: error.message });
      }
    });

    socket.on('game:start', (payload = {}, reply = () => {}) => {
      try {
        const snapshot = startRoomGame(store, payload.roomId, payload.playerId || socket.data.playerId);
        const state = createInitialGameState({ ...snapshot.room, players: snapshot.players });
        store.gameStates.set(snapshot.room.id, state);
        reply({ ok: true, gameState: state });
        io.to(snapshot.room.id).emit('gameStarted', state);
      } catch (error) {
        reply({ ok: false, error: error.message });
      }
    });

    socket.on('game:action', (payload = {}, reply = () => {}) => {
      try {
        const current = store.gameStates.get(payload.roomId);
        if (!current) throw new Error('Игра не найдена.');
        const next = applyGameAction(current, {
          id: payload.id,
          roomId: payload.roomId,
          playerId: payload.playerId || socket.data.playerId,
          type: payload.type,
          payload: payload.payload || {},
          clientTime: payload.clientTime,
        });
        store.gameStates.set(payload.roomId, next);
        reply({ ok: true, gameState: next });
        io.to(payload.roomId).emit('gameStateUpdated', next);
      } catch (error) {
        reply({ ok: false, error: error.message });
        socket.emit('invalidAction', { message: error.message });
      }
    });

    socket.on('disconnect', () => {
      if (!socket.data.roomId || !socket.data.playerId) return;
      const snapshot = markDisconnected(store, socket.data.roomId, socket.data.playerId);
      if (snapshot) emitLobby(io, snapshot);
    });
  });

  return io;
}

function restHandlers(store) {
  return {
    createRoom(req, res) {
      try {
        res.json({ ok: true, ...createRoom(store, req.body || {}) });
      } catch (error) {
        res.status(400).json({ ok: false, error: error.message });
      }
    },
    getRoom(req, res) {
      try {
        const snapshot = getRoom(store, req.params.roomId);
        res.json({ ok: true, ...snapshot, gameState: store.gameStates.get(req.params.roomId) || null });
      } catch (error) {
        res.status(404).json({ ok: false, error: error.message });
      }
    },
    joinRoom(req, res) {
      try {
        res.json({ ok: true, ...joinRoom(store, req.params.roomId, req.body || {}) });
      } catch (error) {
        res.status(400).json({ ok: false, error: error.message });
      }
    },
    getState(req, res) {
      const state = store.gameStates.get(req.params.roomId);
      if (!state) return res.status(404).json({ ok: false, error: 'Игра не найдена.' });
      return res.json({ ok: true, gameState: state });
    },
  };
}

module.exports = { installSockets, restHandlers };
