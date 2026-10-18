import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import jwt from 'jsonwebtoken';
import { randomInt } from 'node:crypto';
import { initialYatzy, reduceYatzy, type YatzyState } from '../../src/services/yatzyEngine';
import { authenticate, JWT_SECRET } from '../security.js';
import { GameRoom, RoomParticipant, UserProfile } from '../../src/types';
import { initialPublicRooms } from '../../src/data/mockData';
import { gamesCatalog } from '../../src/data/gamesCatalog';
import type { DbUserRecord } from '../db.js';
import { GameSessions, authoritativeEngines } from '../gameSessions';
import { MatchStore } from '../matchStore';

interface ClientConnection {
  ws: WebSocket;
  userId?: string;
  roomCode?: string;
  userProfile?: UserProfile;
  isAlive: boolean;
  token?: string;
}

// In-memory rooms cache on server (source of truth)
const rooms = new Map<string, GameRoom>();

// Initialize default rooms
initialPublicRooms.forEach((r) => {
  rooms.set(r.code, { ...r });
});

const clients = new Set<ClientConnection>();
const httpSessions = new Map<string, { connection: ClientConnection; lastSeen: number }>();
const yatzyStates = new Map<string, YatzyState>();
const gameSessions = new GameSessions(room => {
  broadcastToRoom(room.code,{type:'ROOM_STATE_SYNC',room});
  broadcastToRoom(room.code,{type:'GAME_ACTION',roomCode:room.code,gameType:gamesCatalog.find(g=>g.id===room.gameId)!.engine,action:'STATE_CHANGED',payload:{},senderId:'server'});
  persistMatches();
},getRoom);
const matchStore=process.env.FAMPLAY_PERSISTENCE==='0'?null:new MatchStore();
let matchStoreWritable=true;
if(matchStore){
  try{
    const saved=matchStore.load();
    for(const room of saved.rooms)if(room&&typeof room.code==='string'&&Array.isArray(room.participants))rooms.set(room.code,room);
    gameSessions.restore(saved.sessions);
  }catch(error){matchStoreWritable=false;console.error('[Matches] Spielstände konnten nicht geladen werden; vorhandene Datei bleibt unverändert:',error);}
}
function persistMatches(){
  try{if(matchStoreWritable)matchStore?.save([...rooms.values()],gameSessions.export());}
  catch(error){console.error('[Matches] Speichern fehlgeschlagen:',error);}
}

function publicIdentity(user: DbUserRecord): UserProfile {
  return { id: user.id, name: user.username, avatar: JSON.parse(user.avatar_json) } as UserProfile;
}

/** HTTP and WebSocket use the same room authorization and command implementation. */
export function handleHttpMessage(user: DbUserRecord, message: unknown): unknown[] {
  if (!message || typeof message !== 'object' || Array.isArray(message)) throw new Error('Ungültige Nachricht.');
  const replies: unknown[] = [];
  let session = httpSessions.get(user.id);
  if (!session) {
    const room = Array.from(rooms.values()).find(r => r.participants.some(p => p.id === user.id));
    session = { connection: { ws: {} as WebSocket, userId: user.id, roomCode: room?.code, isAlive: true }, lastSeen: Date.now() };
    httpSessions.set(user.id, session);
  }
  session.lastSeen = Date.now();
  session.connection.userProfile = publicIdentity(user);
  session.connection.ws = { send: (raw: string) => { replies.push(JSON.parse(raw)); } } as unknown as WebSocket;
  handleMessage(session.connection, { ...message });
  if (session.connection.roomCode) {
    const room = getRoom(session.connection.roomCode);
    if (room?.participants.some(p => p.id === user.id)) replies.push({ type: 'ROOM_STATE_SYNC', room });
  }
  return replies;
}

export function touchHttpSession(userId: string) {
  const session = httpSessions.get(userId);
  if (session) session.lastSeen = Date.now();
  else {
    const room = Array.from(rooms.values()).find(r => r.participants.some(p => p.id === userId));
    const participant = room?.participants.find(p => p.id === userId);
    if (room && participant) httpSessions.set(userId, {
      connection: { ws: {} as WebSocket, userId, roomCode:room.code, isAlive:true, userProfile:{ id:userId,name:participant.name,avatar:participant.avatar } as UserProfile },
      lastSeen:Date.now(),
    });
  }
}

export function getRoomsList(): GameRoom[] {
  return Array.from(rooms.values());
}

export function getRoom(code: string): GameRoom | undefined {
  const normalized = code.trim().toUpperCase();
  for (const [key, room] of rooms.entries()) {
    if (key.toUpperCase() === normalized || key.replace('-', '').toUpperCase() === normalized.replace('-', '')) {
      return room;
    }
  }
  return undefined;
}

export function saveOrUpdateRoom(room: GameRoom): void {
  rooms.set(room.code, room);
  persistMatches();
}

export function broadcast(msg: any, filter?: (client: ClientConnection) => boolean): void {
  const data = JSON.stringify(msg);
  for (const client of clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      if (!filter || filter(client)) {
        try {
          client.ws.send(data);
        } catch (err) {
          console.error('[WS] Send error:', err);
        }
      }
    }
  }
}

export interface RoomEvent {
  id: number;
  timestamp: number;
  data: any;
}

let globalEventSequence = 1;
const roomEventBuffers = new Map<string, RoomEvent[]>();

export function recordRoomEvent(roomCode: string, data: any): RoomEvent {
  const norm = roomCode.trim().toUpperCase();
  const list = roomEventBuffers.get(norm) || [];
  const event: RoomEvent = {
    id: globalEventSequence++,
    timestamp: Date.now(),
    data: JSON.parse(JSON.stringify(data)),
  };
  list.push(event);
  if (list.length > 500) {
    list.shift();
  }
  roomEventBuffers.set(norm, list);
  return event;
}

export function getRoomEventsSince(roomCode: string, sinceId: number): RoomEvent[] {
  const norm = roomCode.trim().toUpperCase();
  const list = roomEventBuffers.get(norm) || [];
  return list.filter((e) => e.id > sinceId);
}

export function handleExternalGameAction(
  roomCode: string,
  gameType: string,
  action: string,
  payload: any,
  senderId: string
): RoomEvent {
  const msg = {
    type: 'GAME_ACTION',
    roomCode,
    gameType,
    action,
    payload,
    senderId,
  };
  return broadcastToRoom(roomCode, msg);
}

export function broadcastToRoom(roomCode: string, msg: any, excludeUserId?: string): RoomEvent {
  const norm = roomCode.trim().toUpperCase();
  const event = recordRoomEvent(roomCode, msg);
  if(msg.type==='ROOM_STATE_SYNC')persistMatches();

  broadcast({ ...msg, eventId: event.id }, (c) => {
    if (!c.roomCode) return false;
    const clientNorm = c.roomCode.trim().toUpperCase();
    if (clientNorm !== norm && clientNorm.replace('-', '') !== norm.replace('-', '')) {
      return false;
    }
    if (excludeUserId && c.userId === excludeUserId) {
      return false;
    }
    return true;
  });
  return event;
}

export function setupWebSocketServer(httpServer: Server): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 65536 });

  httpServer.on('upgrade', (request, socket, head) => {
    try {
      const host = request.headers.host || 'localhost';
      const url = new URL(request.url || '', `http://${host}`);
      const pathname = url.pathname;

      const origin = request.headers.origin;
      if (origin && new URL(origin).host !== host && origin !== process.env.APP_URL) {
        socket.destroy();
        return;
      }
      if (
        pathname === '/ws' ||
        pathname === '/ws/' ||
        pathname === '/api/ws' ||
        pathname === '/api/ws/'
      ) {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch (e) {
      console.warn('[WS Upgrade Error]', e);
    }
  });

  // Keep-alive heartbeat interval
  const pingInterval = setInterval(() => {
    for (const [userId, session] of httpSessions) {
      if (Date.now() - session.lastSeen > 45_000) {
        httpSessions.delete(userId);
        if (![...clients].some(c => c.userId === userId && c.ws.readyState === WebSocket.OPEN)) handlePlayerLeave(session.connection.roomCode, userId);
      }
    }
    for (const client of clients) {
      if (!client.isAlive) {
        console.log(`[WS] Terminating inactive socket for user: ${client.userId || 'anonymous'}`);
        client.ws.terminate();
        continue;
      }
      client.isAlive = false;
      client.ws.ping();
    }
  }, 25000);

  wss.on('close', () => {
    clearInterval(pingInterval);
    gameSessions.stop();
  });

  wss.on('connection', (ws: WebSocket) => {
    const conn: ClientConnection = {
      ws,
      isAlive: true,
    };
    clients.add(conn);

    ws.on('pong', () => {
      conn.isAlive = true;
    });

    // Send initial rooms list on connect
    ws.send(JSON.stringify({
      type: 'ROOMS_UPDATED',
      rooms: getRoomsList(),
    }));

    let messageQueue = Promise.resolve();
    let windowStart = Date.now();
    let count = 0;
    ws.on('message', (raw: string | Buffer) => {
      if (Date.now() - windowStart > 1000) { count = 0; windowStart = Date.now(); }
      if (++count > 60) { ws.close(1008, 'Rate limit'); return; }
      try {
        const msg = JSON.parse(raw.toString());
        if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return;
        messageQueue = messageQueue.then(async () => {
          if (msg.type === 'IDENTIFY') {
            const user = await authenticate(msg.token);
            if (conn.userId && conn.userId !== user.id) {
              handlePlayerLeave(conn.roomCode, conn.userId);
              conn.roomCode = undefined;
            }
            conn.token = msg.token;
            conn.userId = user.id;
            conn.userProfile = publicIdentity(user);
            return;
          }
          if (msg.type !== 'GET_ROOMS') {
            if (!conn.token) return;
            jwt.verify(conn.token, JWT_SECRET, { algorithms: ['HS256'] });
          }
          handleMessage(conn, msg);
        }).catch(() => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ROOM_ERROR', error: 'Bitte erneut anmelden.' })); });
      } catch (err) {
        console.error('[WS] Failed to parse message:', err);
      }
    });

    ws.on('close', () => {
      handleDisconnect(conn);
      clients.delete(conn);
    });

    ws.on('error', (err) => {
      console.warn('[WS] Socket error:', err.message);
    });
  });

  return wss;
}

function handleMessage(client: ClientConnection, msg: any): void {
  if (typeof msg.roomCode !== 'undefined' && typeof msg.roomCode !== 'string') return;
  if (msg.type !== 'GET_ROOMS') {
    if (!client.userId || !client.userProfile) return;
    msg.user = client.userProfile;
    msg.host = client.userProfile;
    msg.senderId = client.userId;
    msg.senderName = client.userProfile.name;
    if (msg.type !== 'CREATE_ROOM' && msg.type !== 'JOIN_ROOM') {
      const room = typeof msg.roomCode === 'string' ? getRoom(msg.roomCode) : undefined;
      if (!room || client.roomCode !== room.code || !room.participants.some(p => p.id === client.userId)) {
        client.ws.send(JSON.stringify({ type: 'ROOM_ERROR', error: 'Du bist nicht an diesem Tisch.' }));
        return;
      }
      if (['SET_ROOM_GAME', 'ADD_BOT', 'REMOVE_PARTICIPANT', 'SYNC_GAME_STATE', 'SET_DIFFICULTY', 'START_ROUND'].includes(msg.type) && !room.participants.some(p => p.id === client.userId && p.isHost)) {
        client.ws.send(JSON.stringify({ type: 'ROOM_ERROR', error: 'Diese Aktion ist dem Host vorbehalten.' }));
        return;
      }
    }
    if (msg.type === 'LEAVE_ROOM') msg.userId = client.userId;
  }
  switch (msg.type) {
    case 'GET_ROOMS': {
      client.ws.send(JSON.stringify({
        type: 'ROOMS_UPDATED',
        rooms: getRoomsList(),
      }));
      break;
    }

    case 'CREATE_ROOM': {
      const { host, config } = msg;
      if (!config || typeof config.name !== 'string' || typeof config.gameId !== 'string') return;
      const game = gamesCatalog.find(g => g.id === config.gameId);
      if (!game) return;
      const code = msg.roomCode;
      if (typeof code !== 'string' || !/^FAM-[A-F0-9]{12}$/.test(code) || getRoom(code)) return;
      if (client.roomCode) handlePlayerLeave(client.roomCode, client.userId);
      const hostParticipant: RoomParticipant = {
        id: host.id,
        name: host.name,
        avatar: host.avatar,
        isHost: true,
        isReady: true,
        score: 0,
        ping: 15,
        isBot: false,
        seatIndex: 0,
      };

      const newRoom: GameRoom = {
        id: `room_${Date.now()}`,
        code,
        name: config.name.trim().slice(0, 80) || `${host.name}s Tisch`,
        gameId: config.gameId,
        gameTitle: game.title,
        aiDifficulty: 'normal',
        roundNumber: 0,
        isPrivate: !!config.isPrivate,
        hostName: host.name,
        maxPlayers: Math.min(['chess','checkers','connect-four','fam-cards','battleship','memory-match','dots-boxes','tictactoe'].includes(game.engine) ? 2 : 4, Math.max(2, Math.floor(Number(config.maxPlayers)) || 4)),
        currentPlayers: 1,
        status: 'lobby',
        voiceChatActive: !!config.voiceChatActive,
        createdAt: 'Gerade eröffnet',
        participants: [hostParticipant],
      };

      saveOrUpdateRoom(newRoom);
      client.roomCode = code;
      client.userId = host.id;
      client.userProfile = host;

      broadcast({ type: 'ROOMS_UPDATED', rooms: getRoomsList() });
      broadcastToRoom(code, { type: 'ROOM_STATE_SYNC', room: newRoom });
      break;
    }

    case 'JOIN_ROOM': {
      const { roomCode, user } = msg;
      if (typeof roomCode !== 'string') return;
      client.userId = user.id;
      client.userProfile = user;


      const room = getRoom(roomCode);
      if (!room) {
        client.ws.send(JSON.stringify({ type: 'ROOM_ERROR', error: 'Raum nicht gefunden' }));
        return;
      }

      const existingIndex = room.participants.findIndex((p: RoomParticipant) => p.id === user.id);
      if (existingIndex !== -1) {
        room.participants[existingIndex] = {
          ...room.participants[existingIndex],
          name: user.name,
          avatar: user.avatar,
          ping: 18,
        };
      } else {
        if (room.status === 'in-game' && !gameSessions.hasPlayer(room.code,user.id)) {
          client.ws.send(JSON.stringify({ type:'ROOM_ERROR',error:'Die Partie läuft bereits. Bitte warte auf die nächste Partie.' }));
          return;
        }
        if (room.participants.length >= room.maxPlayers) {
          client.ws.send(JSON.stringify({ type: 'ROOM_ERROR', error: 'Raum ist bereits voll' }));
          return;
        }

        const newParticipant: RoomParticipant = {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          isHost: room.participants.length === 0,
          isReady: false,
          score: 0,
          ping: 20,
          isBot: false,
          seatIndex: room.participants.length,
        };

        room.participants.push(newParticipant);
        room.currentPlayers = room.participants.length;
      }

      if (client.roomCode && client.roomCode !== room.code) handlePlayerLeave(client.roomCode, client.userId);
      client.roomCode = room.code;
      saveOrUpdateRoom(room);
      broadcast({ type: 'ROOMS_UPDATED', rooms: getRoomsList() });
      if (Number.isSafeInteger(msg.since) && msg.since >= 0) client.ws.send(JSON.stringify({ type: 'ROOM_EVENTS', events: getRoomEventsSince(room.code, msg.since) }));
      broadcastToRoom(room.code, { type: 'ROOM_STATE_SYNC', room });
      const engine=gamesCatalog.find(g=>g.id===room.gameId)?.engine;
      if(engine&&authoritativeEngines.has(engine))broadcastToRoom(room.code,{type:'GAME_ACTION',roomCode:room.code,gameType:engine,action:'STATE_CHANGED',payload:{},senderId:'server'});
      break;
    }

    case 'LEAVE_ROOM': {
      const { roomCode, userId } = msg;
      handlePlayerLeave(roomCode, userId);
      client.roomCode = undefined;
      break;
    }

    case 'GET_EVENTS': {
      const since = Number.isSafeInteger(msg.since) && msg.since >= 0 ? msg.since : 0;
      client.ws.send(JSON.stringify({ type: 'ROOM_EVENTS', events: getRoomEventsSince(msg.roomCode, since) }));
      break;
    }

    case 'SET_READY': {
      const room = getRoom(msg.roomCode)!;
      const participant = room.participants.find(p => p.id === client.userId)!;
      participant.isReady = Boolean(msg.ready);
      broadcastToRoom(room.code, { type: 'ROOM_STATE_SYNC', room });
      break;
    }

    case 'SET_DIFFICULTY': {
      if (!['easy','normal','hard'].includes(msg.difficulty)) return;
      const room = getRoom(msg.roomCode)!;
      room.aiDifficulty = msg.difficulty;
      broadcastToRoom(room.code, { type: 'ROOM_STATE_SYNC', room });
      break;
    }

    case 'START_ROUND': {
      const room = getRoom(msg.roomCode)!;
      if (room.participants.some(p => !p.isBot && !p.isReady)) {
        client.ws.send(JSON.stringify({ type: 'ROOM_ERROR', error: 'Bitte warten, bis alle Spieler bereit sind.' }));
        return;
      }
      room.roundNumber = (room.roundNumber || 0) + 1;
      room.status = 'in-game';
      roomEventBuffers.delete(room.code.trim().toUpperCase());
      yatzyStates.delete(room.code);
      gameSessions.reset(room.code);
      broadcastToRoom(room.code, { type: 'ROOM_STATE_SYNC', room });
      break;
    }

    case 'SET_ROOM_GAME': {
      const { roomCode, gameId, gameTitle } = msg;
      const room = getRoom(roomCode);
      if (room) {
        if (!gamesCatalog.some(g => g.id === gameId)) return;
        room.gameId = gameId;
        room.gameTitle = gameTitle;
        saveOrUpdateRoom(room);
        broadcast({ type: 'ROOMS_UPDATED', rooms: getRoomsList() });
        broadcastToRoom(room.code, { type: 'ROOM_STATE_SYNC', room });
      }
      break;
    }

    case 'ADD_BOT': {
      const { roomCode, botPreset } = msg;
      if (!botPreset || typeof botPreset.name !== 'string' || !botPreset.avatar) return;
      const room = getRoom(roomCode);
      if (room && room.participants.length < room.maxPlayers) {
        const nextSeat = room.participants.length;
        const botParticipant: RoomParticipant = {
          id: `bot_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          name: botPreset.name,
          avatar: botPreset.avatar,
          isHost: false,
          isReady: true,
          score: 0,
          ping: 5,
          isBot: true,
          seatIndex: nextSeat,
        };
        room.participants.push(botParticipant);
        room.currentPlayers = room.participants.length;
        saveOrUpdateRoom(room);
        broadcast({ type: 'ROOMS_UPDATED', rooms: getRoomsList() });
        broadcastToRoom(room.code, { type: 'ROOM_STATE_SYNC', room });
      }
      break;
    }

    case 'REMOVE_PARTICIPANT': {
      const { roomCode, participantId } = msg;
      handlePlayerLeave(roomCode, participantId);
      break;
    }

    case 'GAME_ACTION': {
      const { roomCode, gameType, action, payload, senderId } = msg;
      if (typeof gameType !== 'string' || typeof action !== 'string' || !payload || typeof payload !== 'object') return;
      const room = getRoom(roomCode)!;
      const engine=gamesCatalog.find(g=>g.id===room.gameId)?.engine;
      if(authoritativeEngines.has(gameType)){
        if(gameType!==engine)return;
        try{
          const snapshot=action==='GET_STATE'?gameSessions.read(room,senderId):action==='COMMAND'?gameSessions.dispatch(room,senderId,payload):null;
          if(snapshot)client.ws.send(JSON.stringify({type:'GAME_ACTION',roomCode:room.code,gameType,action:'STATE',payload:snapshot,senderId:'server'}));
        }catch(error){
          client.ws.send(JSON.stringify({type:'ROOM_ERROR',error:error instanceof Error?error.message:'Ungültiger Spielbefehl.'}));
          client.ws.send(JSON.stringify({type:'GAME_ACTION',roomCode:room.code,gameType,action:'STATE',payload:gameSessions.read(room,senderId),senderId:'server'}));
        }
        return;
      }
      if (gameType === 'yatzy') {
        if (action !== 'YATZY_GET_STATE' && action !== 'YATZY_COMMAND') return;
        const state = yatzyStates.get(room.code) || initialYatzy(room.participants.length);
        if (action === 'YATZY_GET_STATE') {
          yatzyStates.set(room.code, state);
          client.ws.send(JSON.stringify({ type:'GAME_ACTION',roomCode:room.code,gameType:'yatzy',action:'YATZY_STATE',payload:{state},senderId:'server' }));
          return;
        }
        const active = room.participants[state.active];
        const host = room.participants.find(p => p.isHost);
        if (state.cards.length !== room.participants.length || !active || (active.id !== senderId && !(active.isBot && host?.id === senderId))) return;
        const command = payload.type === 'ROLL' ? { type:'ROLL' as const, dice:Array.from({length:5},()=>randomInt(1,7)) } : payload;
        const next = reduceYatzy(state, command);
        if (next === state) return;
        yatzyStates.set(room.code, next);
        broadcastToRoom(room.code, { type:'GAME_ACTION',roomCode:room.code,gameType:'yatzy',action:'YATZY_STATE',payload:{state:next},senderId:'server' });
        return;
      }
      // Broadcast real-time action to all participants in this room
      broadcastToRoom(roomCode, {
        type: 'GAME_ACTION',
        roomCode,
        gameType,
        action,
        payload,
        senderId,
      });
      break;
    }

    case 'SYNC_GAME_STATE': {
      const { roomCode, gameType, gameState, senderId } = msg;
      broadcastToRoom(roomCode, {
        type: 'SYNC_GAME_STATE',
        roomCode,
        gameType,
        gameState,
        senderId,
      });
      break;
    }

    case 'TABLE_EMOTE': {
      const { roomCode, emoji, senderName, senderId } = msg;
      broadcastToRoom(roomCode, {
        type: 'TABLE_EMOTE',
        roomCode,
        emoji,
        senderName,
        senderId,
      });
      break;
    }

    case 'ROOM_CHAT': {
      const { roomCode, text, senderName, senderId } = msg;
      if (typeof text !== 'string' || !text.trim() || text.length > 2000) return;
      broadcastToRoom(roomCode, {
        type: 'ROOM_CHAT',
        roomCode,
        text,
        senderName,
        senderId,
        timestamp: Date.now(),
      });
      break;
    }
  }
}

function handlePlayerLeave(roomCode?: string, userId?: string): void {
  if (!roomCode || !userId) return;
  const room = getRoom(roomCode);
  if (!room) return;

  const filtered = room.participants.filter((p: RoomParticipant) => p.id !== userId);
  if (filtered.length === 0 || filtered.every(p => p.isBot)) {
    // Keep standard pre-set rooms in catalog or reset
    if (initialPublicRooms.some((r: GameRoom) => r.code === room.code)) {
      room.participants = [];
      room.currentPlayers = 0;
      saveOrUpdateRoom(room);
    } else {
      rooms.delete(room.code);
      yatzyStates.delete(room.code);
      gameSessions.reset(room.code);
      roomEventBuffers.delete(room.code);
    }
  } else {
    const host = filtered.find(p => p.isHost && !p.isBot) || filtered.find(p => !p.isBot)!;
    room.participants = [host, ...filtered.filter(p => p.id !== host.id)].map((p: RoomParticipant, idx: number) => ({ ...p, isHost:p.id===host.id, seatIndex:idx }));
    room.currentPlayers = room.participants.length;
    room.hostName = host.name;
    saveOrUpdateRoom(room);
  }

  broadcast({ type: 'ROOMS_UPDATED', rooms: getRoomsList() });
  broadcastToRoom(room.code, { type: 'ROOM_STATE_SYNC', room });
}

function handleDisconnect(client: ClientConnection): void {
  if (client.roomCode && client.userId) {
    // Only disconnect if client doesn't reconnect immediately
    const roomCode = client.roomCode;
    const userId = client.userId;
    const disconnectTimer = setTimeout(() => {
      // Check if user reconnected on another socket
      let stillConnected = false;
      const http = httpSessions.get(userId);
      if (http && http.connection.roomCode === roomCode && Date.now() - http.lastSeen < 45_000) stillConnected = true;
      for (const c of clients) {
        if (c.userId === userId && c.roomCode === roomCode && c.ws.readyState === WebSocket.OPEN) {
          stillConnected = true;
          break;
        }
      }
      if (!stillConnected) {
        // Rules-based sessions retain their seats and snapshots across mobile suspensions.
        if(gameSessions.hasPlayer(roomCode,userId))return;
        handlePlayerLeave(roomCode, userId);
      }
    }, 30_000);
    disconnectTimer.unref();
  }
}
