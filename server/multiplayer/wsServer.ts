import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { GameRoom, RoomParticipant, UserProfile } from '../../src/types';
import { initialPublicRooms } from '../../src/data/mockData';
import { GameSessions, authoritativeEngines } from '../gameSessions.js';

interface ClientConnection {
  ws: WebSocket;
  userId?: string;
  roomCode?: string;
  userProfile?: UserProfile;
  isAlive: boolean;
}

// In-memory rooms cache on server (source of truth)
const rooms = new Map<string, GameRoom>();

// Initialize default rooms
initialPublicRooms.forEach((r) => {
  rooms.set(r.code, { ...r });
});

const clients = new Set<ClientConnection>();

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
    data,
  };
  list.push(event);
  if (list.length > 100) {
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
  if (GameSessions) {
    try {
      GameSessions.applyAction(roomCode, { type: action, payload, gameType }, senderId);
    } catch (e) {
      console.warn('[WS] GameSessions error:', e);
    }
  }
  const msg = {
    type: 'GAME_ACTION',
    roomCode,
    gameType,
    action,
    payload,
    senderId,
  };
  broadcastToRoom(roomCode, msg);
  return recordRoomEvent(roomCode, msg);
}

export function broadcastToRoom(roomCode: string, msg: any, excludeUserId?: string): void {
  const norm = roomCode.trim().toUpperCase();
  recordRoomEvent(roomCode, msg);

  broadcast(msg, (c) => {
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
}

export function setupWebSocketServer(httpServer: Server): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    try {
      const host = request.headers.host || 'localhost';
      const url = new URL(request.url || '', `http://${host}`);
      const pathname = url.pathname;

      if (
        pathname === '/ws' ||
        pathname === '/ws/' ||
        pathname.startsWith('/ws') ||
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
    for (const client of clients) {
      if (!client.isAlive) {
        console.log(`[WS] Terminating inactive socket for user: ${client.userId || 'anonymous'}`);
        client.ws.terminate();
        clients.delete(client);
        continue;
      }
      client.isAlive = false;
      client.ws.ping();
    }
  }, 25000);

  wss.on('close', () => {
    clearInterval(pingInterval);
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

    ws.on('message', (raw: string | Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());
        handleMessage(conn, msg);
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
  switch (msg.type) {
    case 'IDENTIFY': {
      client.userId = msg.user?.id;
      client.userProfile = msg.user;
      break;
    }

    case 'GET_ROOMS': {
      client.ws.send(JSON.stringify({
        type: 'ROOMS_UPDATED',
        rooms: getRoomsList(),
      }));
      break;
    }

    case 'CREATE_ROOM': {
      const { host, config } = msg;
      const code = `FAM-${Math.floor(100 + Math.random() * 900)}`;
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
        name: config.name,
        gameId: config.gameId,
        gameTitle: config.gameTitle,
        isPrivate: !!config.isPrivate,
        hostName: host.name,
        maxPlayers: config.maxPlayers || 4,
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
      client.userId = user.id;
      client.userProfile = user;
      client.roomCode = roomCode;

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
        if (room.participants.length >= room.maxPlayers) {
          client.ws.send(JSON.stringify({ type: 'ROOM_ERROR', error: 'Raum ist bereits voll' }));
          return;
        }

        const newParticipant: RoomParticipant = {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          isHost: room.participants.length === 0,
          isReady: true,
          score: 0,
          ping: 20,
          isBot: false,
          seatIndex: room.participants.length,
        };

        room.participants.push(newParticipant);
        room.currentPlayers = room.participants.length;
      }

      saveOrUpdateRoom(room);
      broadcast({ type: 'ROOMS_UPDATED', rooms: getRoomsList() });
      broadcastToRoom(room.code, { type: 'ROOM_STATE_SYNC', room });
      break;
    }

    case 'LEAVE_ROOM': {
      const { roomCode, userId } = msg;
      handlePlayerLeave(roomCode, userId);
      client.roomCode = undefined;
      break;
    }

    case 'SET_ROOM_GAME': {
      const { roomCode, gameId, gameTitle } = msg;
      const room = getRoom(roomCode);
      if (room) {
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
  if (filtered.length === 0) {
    // Keep standard pre-set rooms in catalog or reset
    if (initialPublicRooms.some((r: GameRoom) => r.code === room.code)) {
      room.participants = [];
      room.currentPlayers = 0;
      saveOrUpdateRoom(room);
    } else {
      rooms.delete(room.code);
    }
  } else {
    room.participants = filtered.map((p: RoomParticipant, idx: number) => ({ ...p, seatIndex: idx }));
    room.currentPlayers = room.participants.length;
    if (!room.participants.some((p: RoomParticipant) => p.isHost)) {
      room.participants[0].isHost = true;
      room.hostName = room.participants[0].name;
    }
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
    setTimeout(() => {
      // Check if user reconnected on another socket
      let stillConnected = false;
      for (const c of clients) {
        if (c.userId === userId && c.roomCode === roomCode && c.ws.readyState === WebSocket.OPEN) {
          stillConnected = true;
          break;
        }
      }
      if (!stillConnected) {
        handlePlayerLeave(roomCode, userId);
      }
    }, 4000);
  }
}
