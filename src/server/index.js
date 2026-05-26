const path = require('node:path');
const http = require('node:http');
const express = require('express');
const { createRoomStore } = require('./rooms');
const { installSockets, restHandlers } = require('./sockets');

const PORT = Number(process.env.PORT || 12930);
const app = express();
const store = createRoomStore();
const handlers = restHandlers(store);

app.use(express.json({ limit: '64kb' }));
app.use(express.static(path.resolve(__dirname, '../..')));

app.post('/api/rooms', handlers.createRoom);
app.get('/api/rooms/:roomId', handlers.getRoom);
app.post('/api/rooms/:roomId/join', handlers.joinRoom);
app.post('/api/rooms/:roomId/rejoin', handlers.joinRoom);
app.get('/api/rooms/:roomId/state', handlers.getState);

app.get('/healthz', (req, res) => {
  res.json({ ok: true, service: 'cashflowjs-online', rooms: store.rooms.size });
});

const server = http.createServer(app);
installSockets(server, store);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`CashFlowJs online server listening on http://127.0.0.1:${PORT}`);
  });
}

module.exports = { app, server, store };
