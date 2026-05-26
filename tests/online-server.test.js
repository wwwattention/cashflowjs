const assert = require('node:assert/strict');
const test = require('node:test');

const { server } = require('../src/server/index');

function listenOnce() {
  return new Promise((resolve) => {
    const instance = server.listen(0, '127.0.0.1', () => {
      resolve(instance.address().port);
    });
  });
}

async function get(baseUrl, path) {
  const response = await fetch(`${baseUrl}${path}`);
  return {
    status: response.status,
    contentType: response.headers.get('content-type') || '',
    text: await response.text(),
  };
}

test('online server serves online shell and socket.io client from the same origin', async () => {
  const port = await listenOnce();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const online = await get(baseUrl, '/online.html?room=ABCD-1234');
    assert.equal(online.status, 200);
    assert.match(online.text, /\/socket\.io\/socket\.io\.js/);
    assert.match(online.text, /src\/client\/online-app\.js/);

    const socketClient = await get(baseUrl, '/socket.io/socket.io.js');
    assert.equal(socketClient.status, 200);
    assert.match(socketClient.contentType, /javascript/);
    assert.match(socketClient.text, /io/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
