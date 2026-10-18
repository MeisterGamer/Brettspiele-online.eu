import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import express from 'express';
import { WebSocket } from 'ws';
import { requireUser, rateLimit } from './security.js';
import { setupRouter } from './routes/setup.js';
import { getRoomEventsSince, handleExternalGameAction, setupWebSocketServer, getRoomsList } from './multiplayer/wsServer.js';

test('HTTP rejects forged tokens and rate limits repeated requests', async () => {
  const app = express();
  app.get('/private', requireUser, (_req, res) => res.json({ ok: true }));
  app.get('/limited', rateLimit(2), (_req, res) => res.sendStatus(204));
  app.use('/setup', setupRouter);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${(server.address() as any).port}`;
  try {
    assert.equal((await fetch(`${url}/private`)).status, 401);
    assert.equal((await fetch(`${url}/private`, { headers: { Authorization: 'Bearer forged' } })).status, 401);
    assert.equal((await fetch(`${url}/limited`)).status, 204);
    assert.equal((await fetch(`${url}/limited`)).status, 204);
    const limited = await fetch(`${url}/limited`);
    assert.equal(limited.status, 429);
    assert.ok(limited.headers.get('retry-after'));
    assert.equal((await fetch(`${url}/setup/test-db`, { method: 'POST', headers: { 'x-forwarded-for': '203.0.113.1' } })).status, 403);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('fallback records each game action only once', () => {
  const code = 'TEST-EVENTS';
  const event = handleExternalGameAction(code, 'chess', 'move', {}, 'test');
  assert.equal(getRoomEventsSince(code, 0).length, 1);
  assert.equal(getRoomEventsSince(code, 0)[0].id, event.id);
});

test('WebSocket rejects foreign origins and ignores unauthenticated room creation', async () => {
  const server = createServer();
  const wss = setupWebSocketServer(server);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `ws://127.0.0.1:${(server.address() as any).port}/ws`;
  const initialCount = getRoomsList().length;
  try {
    const foreign = new WebSocket(url, { origin: 'https://attacker.invalid' });
    await once(foreign, 'error');
    const ws = new WebSocket(url);
    await once(ws, 'open');
    ws.send(JSON.stringify({ type: 'CREATE_ROOM', host: { id: 'admin' }, config: { name: 'Forged' } }));
    ws.send(JSON.stringify({ type: 'GET_ROOMS' }));
    const [raw] = await once(ws, 'message');
    assert.equal(JSON.parse(raw.toString()).rooms.length, initialCount);
    ws.close();
    await once(ws, 'close');
    assert.equal(getRoomsList().length, initialCount);
  } finally {
    for (const ws of wss.clients) ws.terminate();
    await new Promise<void>(resolve => wss.close(() => resolve()));
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
