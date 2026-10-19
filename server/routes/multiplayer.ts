import { Router } from 'express';
import { 
  getRoomsList, 
  getRoom, 
  getRoomEventsSince, 
  handleHttpMessage, 
  touchHttpSession 
} from '../multiplayer/wsServer.js';

export const multiplayerRouter = Router();

// GET all rooms
multiplayerRouter.get('/rooms', (_req, res) => {
  res.json({ rooms: getRoomsList() });
});

// GET specific room by code
multiplayerRouter.get('/room/:code', (req, res) => {
  const room = getRoom(req.params.code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({ room });
});

// GET events for room since specific event ID (polling fallback)
multiplayerRouter.get('/events', (req, res) => {
  const roomCode = String(req.query.roomCode || '');
  const since = parseInt(String(req.query.since || '0'), 10);
  if (!roomCode) {
    return res.status(400).json({ error: 'Missing roomCode' });
  }
  const events = getRoomEventsSince(roomCode, isNaN(since) ? 0 : since);
  res.json({ events });
});

// POST message to room via HTTP
multiplayerRouter.post('/message', (req, res) => {
  const result = handleHttpMessage(req.body);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// POST heartbeat/touch user session in room
multiplayerRouter.post('/touch', (req, res) => {
  const { roomCode, userId, userName } = req.body;
  const room = touchHttpSession(roomCode, userId, userName);
  if (!room) {
    return res.status(404).json({ error: 'Room not found or invalid session' });
  }
  res.json({ success: true, room });
});

// POST game action directly
multiplayerRouter.post('/action', (req, res) => {
  const { roomCode, gameType, action, payload, senderId } = req.body;
  const result = handleHttpMessage({
    type: 'GAME_ACTION',
    roomCode,
    gameType: gameType || 'general',
    action,
    payload,
    senderId: senderId || 'anonymous',
  });
  res.json(result);
});

export default multiplayerRouter;
