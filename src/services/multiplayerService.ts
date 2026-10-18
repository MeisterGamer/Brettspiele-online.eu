import { GameRoom, RoomParticipant, UserProfile, AvatarConfig } from '../types';
import { initialPublicRooms } from '../data/mockData';

import { apiAuth } from './apiAuth';

const STORAGE_KEY = 'famplay_multiplayer_rooms_v2';
const CHANNEL_NAME = 'famplay_multiplayer_sync_channel';

// Preset bot avatars for filling table seats
export const FAMILY_BOT_PRESETS: { name: string; avatar: AvatarConfig }[] = [
  {
    name: 'Oma Grete (KI)',
    avatar: {
      skinTone: '#FCD34D',
      hairStyle: 'bun',
      hairColor: '#E2E8F0',
      eyes: 'glasses',
      mouth: 'smile',
      outfit: 'royal',
      outfitColor: '#7C3AED',
      accessory: 'none',
      flair: 'wood',
    },
  },
  {
    name: 'Papa Thomas (KI)',
    avatar: {
      skinTone: '#FCD34D',
      hairStyle: 'spiky',
      hairColor: '#451A03',
      eyes: 'cool',
      mouth: 'grin',
      outfit: 'hoodie',
      outfitColor: '#2563EB',
      accessory: 'mustache',
      flair: 'none',
    },
  },
  {
    name: 'Junior Leo (KI)',
    avatar: {
      skinTone: '#FCD34D',
      hairStyle: 'cap',
      hairColor: '#D97706',
      eyes: 'sparkle',
      mouth: 'laugh',
      outfit: 'jersey',
      outfitColor: '#10B981',
      accessory: 'party-hat',
      flair: 'rainbow',
    },
  },
  {
    name: 'Tante Lisa (KI)',
    avatar: {
      skinTone: '#FCD34D',
      hairStyle: 'ponytail',
      hairColor: '#B45309',
      eyes: 'happy',
      mouth: 'smile',
      outfit: 'tshirt',
      outfitColor: '#EC4899',
      accessory: 'star',
      flair: 'none',
    },
  },
];

export type ConnectionStatus = 'websocket' | 'http' | 'connecting' | 'offline';

export type MultiplayerEvent =
  | { type: 'CONNECTION_STATUS'; status: ConnectionStatus }
  | { type: 'ROOM_ERROR'; error: string }
  | { type: 'ROOMS_UPDATED'; rooms: GameRoom[] }
  | { type: 'ROOM_STATE_SYNC'; room: GameRoom }
  | { type: 'GAME_MOVE'; roomCode: string; moveData: any; senderId: string }
  | { type: 'GAME_ACTION'; roomCode: string; gameType: string; action: string; payload: any; senderId: string }
  | { type: 'SYNC_GAME_STATE'; roomCode: string; gameType: string; gameState: any; senderId: string }
  | { type: 'TABLE_EMOTE'; roomCode: string; emoji: string; senderName: string; senderId: string }
  | { type: 'ROOM_CHAT'; roomCode: string; text: string; senderName: string; senderId: string; timestamp: number };

class MultiplayerService {
  private socket: WebSocket | null = null;
  private channel: BroadcastChannel | null = null;
  private listeners: ((event: MultiplayerEvent) => void)[] = [];
  private gameListeners: ((event: { roomCode: string; gameType: string; action: string; payload: any; senderId: string }) => void)[] = [];
  private currentUser: UserProfile | null = null;
  private currentRoomCode: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;
  private isConnected = false;
  private cachedRooms: GameRoom[] = initialPublicRooms;

  constructor() {
    if (typeof window !== 'undefined') {
      // 1. Setup BroadcastChannel for fast tab-to-tab sync
      if ('BroadcastChannel' in window) {
        try {
          this.channel = new BroadcastChannel(CHANNEL_NAME);
          this.channel.onmessage = (msg) => {
            if (msg.data) {
              this.handleIncomingEvent(msg.data, false);
            }
          };
        } catch (e) {
          console.warn('BroadcastChannel not supported', e);
        }
      }

      // 2. Storage fallback
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            this.cachedRooms = parsed;
            this.notifyListeners({ type: 'ROOMS_UPDATED', rooms: parsed });
          } catch (err) {}
        }
      });

      // 3. Connect to real WebSocket server
      this.connectWebSocket();

      // 4. Start HTTP polling fallback for proxies where WebSockets are not forwarded
      this.startPollingFallback();

      window.addEventListener('online', () => {
        this.wsDisabledForSession = false;
        this.reconnectAttempts = 0;
        if (!this.socket || this.socket.readyState === WebSocket.CLOSED) this.connectWebSocket();
      });
      window.addEventListener('offline', () => this.setConnectionStatus('offline'));
      // Initial HTTP fetch of rooms
      this.fetchRoomsFromHttp();
    }
  }

  public identifyUser(user: UserProfile) {
    this.currentUser = user;
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'IDENTIFY',
        token: apiAuth.getToken(),
        user,
      }));
    }
  }

  private wsDisabledForSession = false;
  private wsPathIndex = 0;
  private wsPaths = ['/api/ws', '/ws'];

  public isRealtimeConnected(): boolean {
    return Boolean(this.isConnected && this.socket && this.socket.readyState === WebSocket.OPEN);
  }

  private connectWebSocket() {
    if (typeof window === 'undefined') return;
    if (this.wsDisabledForSession) return;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const path = this.wsPaths[this.wsPathIndex % this.wsPaths.length];
      const wsUrl = `${protocol}//${window.location.host}${path}`;

      const socket = new WebSocket(wsUrl);
      this.socket = socket;

      socket.onopen = () => {
        this.isConnected = true;
        this.setConnectionStatus('websocket');
        this.reconnectAttempts = 0;

        if (this.currentUser) {
          socket.send(JSON.stringify({
            type: 'IDENTIFY',
            token: apiAuth.getToken(),
            user: this.currentUser,
          }));
        }

        if (this.currentRoomCode && this.currentUser) {
          socket.send(JSON.stringify({
            type: 'JOIN_ROOM',
            since: this.lastPolledEventId,
            roomCode: this.currentRoomCode,
            user: this.currentUser,
          }));
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.incomingQueue = this.incomingQueue.then(async () => {
            if (data.type === 'ROOM_EVENTS' && Array.isArray(data.events)) await this.replayEvents(data.events);
            else this.handleIncomingEvent(data, true);
          }).catch(() => {});
        } catch (err) {}
      };

      socket.onclose = () => {
        this.isConnected = false;
        this.setConnectionStatus(navigator.onLine ? 'connecting' : 'offline');
        if (this.reconnectAttempts >= 20) {
          // Pause after prolonged failure; an online event enables another attempt.
          this.wsDisabledForSession = true;
          return;
        }
        this.scheduleReconnect();
      };

      socket.onerror = (err) => {
        try {
          if (socket.readyState === WebSocket.OPEN) {
            socket.close();
          }
        } catch (e) {}
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.wsDisabledForSession) return;
    if (this.reconnectAttempts >= 20) {
      this.wsDisabledForSession = true;
      return;
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts++;
      this.wsPathIndex++;
      this.connectWebSocket();
    }, Math.min(30000, 1500 * 2 ** Math.min(this.reconnectAttempts, 5)));
  }

  private lastPolledEventId = 0;
  private httpQueue: Promise<void> = Promise.resolve();
  private incomingQueue: Promise<void> = Promise.resolve();
  private connectionStatus: ConnectionStatus = 'connecting';

  public getConnectionStatus() { return this.connectionStatus; }
  private setConnectionStatus(status: ConnectionStatus) {
    if (status === this.connectionStatus) return;
    this.connectionStatus = status;
    this.notifyListeners({ type: 'CONNECTION_STATUS', status });
  }
  private async replayEvents(events: any[]) {
    for (const item of events) {
      if (item.data) this.handleIncomingEvent({ ...item.data, eventId: item.id } as any, true);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  private pollInterval: any = null;
  private polling = false;
  private lastRoomsFetch = 0;

  private startPollingFallback() {
    if (this.pollInterval || typeof window === 'undefined') return;
    // Keep both the lobby and active rooms usable behind proxies without WebSocket support.
    this.pollInterval = setInterval(async () => {
      if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
        return;
      }
      if (this.polling || document.hidden || !navigator.onLine) {
        return;
      }
      if (!this.currentRoomCode) {
        if(Date.now()-this.lastRoomsFetch>5000){this.lastRoomsFetch=Date.now();await this.fetchRoomsFromHttp();}
        return;
      }

      this.polling = true;
      try {
        const res = await fetch(
          `/api/multiplayer/events?roomCode=${encodeURIComponent(this.currentRoomCode)}&since=${this.lastPolledEventId}`,
          { headers: { Authorization: `Bearer ${apiAuth.getToken()}` }, signal: AbortSignal.timeout(10000) }
        );
        if (res.ok) {
          const json = await res.json();
          this.setConnectionStatus('http');
          if (Array.isArray(json.events)) await this.replayEvents(json.events);
        }
      } catch (e) {} finally { this.polling = false; }
    }, 1000);
  }

  private async fetchRoomsFromHttp() {
    try {
      const res = await fetch('/api/rooms',{signal:AbortSignal.timeout(10000)});
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.rooms)) {
          if(!this.isRealtimeConnected())this.setConnectionStatus('http');
          this.cachedRooms = data.rooms;
          this.saveRooms(data.rooms, false);
          this.notifyListeners({ type: 'ROOMS_UPDATED', rooms: data.rooms });
        }
      }
    } catch (e) {}
  }

  private handleIncomingEvent(event: MultiplayerEvent, fromServer = false) {
    const id = (event as any).eventId;
    const code = (event as any).roomCode || (event as any).room?.code;
    if (fromServer && Number.isSafeInteger(id) && code === this.currentRoomCode) {
      if (id <= this.lastPolledEventId) return;
      this.lastPolledEventId = id;
    }
    if (event.type === 'ROOMS_UPDATED') {
      this.cachedRooms = event.rooms;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(event.rooms));
      } catch (e) {}
    } else if (event.type === 'ROOM_STATE_SYNC') {
      const idx = this.cachedRooms.findIndex((r) => r.id === event.room.id || r.code === event.room.code);
      if (idx !== -1) {
        this.cachedRooms[idx] = event.room;
      } else {
        this.cachedRooms = [event.room, ...this.cachedRooms];
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cachedRooms));
      } catch (e) {}
    } else if (event.type === 'GAME_ACTION') {
      this.gameListeners.forEach((l) => {
        try {
          l(event);
        } catch (err) {
          console.error('[WS] Game listener error:', err);
        }
      });
    }

    this.notifyListeners(event);

  }

  public subscribe(callback: (event: MultiplayerEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  public subscribeToGameActions(
    callback: (event: { roomCode: string; gameType: string; action: string; payload: any; senderId: string }) => void
  ): () => void {
    this.gameListeners.push(callback);
    return () => {
      this.gameListeners = this.gameListeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners(event: MultiplayerEvent) {
    this.listeners.forEach((l) => {
      try {
        l(event);
      } catch (err) {
        console.error('Error in multiplayer event listener', err);
      }
    });
  }

  private async sendWsOrPost(event: any) {
    let sentViaWs = false;
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(event));
        sentViaWs = true;
      } catch (e) {}
    }

    if (!sentViaWs && !['ROOMS_UPDATED', 'ROOM_STATE_SYNC'].includes(event.type)) {
      this.httpQueue = this.httpQueue.then(async () => {
        const res = await fetch('/api/multiplayer/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiAuth.getToken()}` },
          body: JSON.stringify(event),
          signal: AbortSignal.timeout(10000),
        });
        const data = await res.json();
        if (Array.isArray(data.messages)) for (const message of data.messages) this.handleIncomingEvent(message, true);
        if (!res.ok && !data.messages) throw new Error(data.error || 'Aktion fehlgeschlagen.');
        if (res.ok) this.setConnectionStatus('http');
      }).catch(error => {
        this.setConnectionStatus(navigator.onLine ? 'connecting' : 'offline');
        this.notifyListeners({ type: 'ROOM_ERROR', error: error.message || 'Verbindung unterbrochen.' });
      });
    }

    // Game engines apply their own outgoing moves. Server delivery is authoritative for chat.
    if (!['ROOM_STATE_SYNC', 'ROOMS_UPDATED', 'ROOM_CHAT'].includes(event.type)) this.handleIncomingEvent(event, false);
  }

  public getRooms(): GameRoom[] {
    if (typeof window === 'undefined') return initialPublicRooms;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: GameRoom[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.cachedRooms = parsed;
          return parsed;
        }
      }
    } catch (e) {}
    return this.cachedRooms;
  }

  public saveRooms(rooms: GameRoom[], broadcast = true): void {
    if (typeof window === 'undefined') return;
    this.cachedRooms = rooms;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
      if (broadcast) {
        this.sendWsOrPost({ type: 'ROOMS_UPDATED', rooms });
      }
    } catch (e) {}
  }

  public getRoomByCode(code: string): GameRoom | null {
    const formatted = code.trim().toUpperCase();
    const rooms = this.getRooms();
    return (
      rooms.find(
        (r) =>
          r.code.toUpperCase() === formatted ||
          r.code.replace('-', '').toUpperCase() === formatted.replace('-', '')
      ) || null
    );
  }

  public createRoom(
    host: UserProfile,
    config: {
      name: string;
      gameId: string;
      gameTitle: string;
      maxPlayers: number;
      isPrivate: boolean;
      voiceChatActive: boolean;
    }
  ): GameRoom {
    this.currentUser = host;
    const code = `FAM-${Array.from(crypto.getRandomValues(new Uint8Array(6)), n => n.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
    this.currentRoomCode = code;

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
      isPrivate: config.isPrivate,
      hostName: host.name,
      maxPlayers: config.maxPlayers,
      currentPlayers: 1,
      status: 'lobby',
      voiceChatActive: config.voiceChatActive,
      createdAt: 'Gerade eröffnet',
      participants: [hostParticipant],
    };

    this.sendWsOrPost({
      type: 'CREATE_ROOM',
      roomCode: code,
      host,
      config,
    });

    const updated = [newRoom, ...this.getRooms()];
    this.saveRooms(updated, false);
    return newRoom;
  }

  public joinRoom(roomCode: string, user: UserProfile): GameRoom | null {
    this.currentUser = user;
    if (this.currentRoomCode !== roomCode) this.lastPolledEventId = 0;
    this.currentRoomCode = roomCode;

    this.sendWsOrPost({
      type: 'JOIN_ROOM',
      roomCode,
      user,
    });

    const room = this.getRoomByCode(roomCode);
    if (!room) return null;

    const existingIndex = room.participants.findIndex((p) => p.id === user.id);
    let updatedRoom: GameRoom;

    if (existingIndex !== -1) {
      const updatedParticipants = [...room.participants];
      updatedParticipants[existingIndex] = {
        ...updatedParticipants[existingIndex],
        name: user.name,
        avatar: user.avatar,
        ping: 18,
      };
      updatedRoom = { ...room, participants: updatedParticipants };
    } else {
      if (room.participants.length >= room.maxPlayers) {
        return room;
      }
      const newParticipant: RoomParticipant = {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        isHost: false,
        isReady: true,
        score: 0,
        ping: 20,
        isBot: false,
        seatIndex: room.participants.length,
      };
      updatedRoom = {
        ...room,
        currentPlayers: room.participants.length + 1,
        participants: [...room.participants, newParticipant],
      };
    }

    const updatedRooms = this.getRooms().map((r) => (r.id === updatedRoom.id ? updatedRoom : r));
    this.saveRooms(updatedRooms, false);
    return updatedRoom;
  }

  public leaveRoom(roomCode: string, userId: string): void {
    if (this.currentRoomCode === roomCode) {
      this.currentRoomCode = null;
    }
    this.sendWsOrPost({
      type: 'LEAVE_ROOM',
      roomCode,
      userId,
    });
  }

  public setRoomGame(roomCode: string, gameId: string, gameTitle: string): void {
    this.sendWsOrPost({
      type: 'SET_ROOM_GAME',
      roomCode,
      gameId,
      gameTitle,
    });
  }

  public addHumanSimPlayerToRoom(roomIdOrCode: string): GameRoom | null {
    return this.addBotToRoom(roomIdOrCode);
  }

  public addBotToRoom(roomIdOrCode: string): GameRoom | null {
    const target = this.getRoomByCode(roomIdOrCode) || this.getRooms().find((r) => r.id === roomIdOrCode);
    if (!target) return null;

    if (target.participants.length >= target.maxPlayers) {
      return target;
    }

    const nextSeat = target.participants.length;
    const botPreset = FAMILY_BOT_PRESETS[nextSeat % FAMILY_BOT_PRESETS.length];

    this.sendWsOrPost({
      type: 'ADD_BOT',
      roomCode: target.code,
      botPreset,
    });

    const botParticipant: RoomParticipant = {
      id: `bot_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: botPreset.name,
      avatar: botPreset.avatar,
      isHost: false,
      isReady: true,
      score: 0,
      ping: 8,
      isBot: true,
      seatIndex: nextSeat,
    };

    const updatedRoom: GameRoom = {
      ...target,
      currentPlayers: target.participants.length + 1,
      participants: [...target.participants, botParticipant],
    };

    const updatedRooms = this.getRooms().map((r) => (r.id === updatedRoom.id ? updatedRoom : r));
    this.saveRooms(updatedRooms, false);
    return updatedRoom;
  }

  public removeParticipant(roomIdOrCode: string, participantId: string): GameRoom | null {
    const target = this.getRoomByCode(roomIdOrCode) || this.getRooms().find((r) => r.id === roomIdOrCode);
    if (!target) return null;

    this.sendWsOrPost({
      type: 'REMOVE_PARTICIPANT',
      roomCode: target.code,
      participantId,
    });

    const filtered = target.participants.filter((p) => p.id !== participantId);
    const reindexed = filtered.map((p, idx) => ({ ...p, seatIndex: idx }));

    const updatedRoom: GameRoom = {
      ...target,
      currentPlayers: reindexed.length,
      participants: reindexed,
      hostName: reindexed[0]?.name || target.hostName,
    };

    if (reindexed.length > 0 && !reindexed.some((p) => p.isHost)) {
      reindexed[0].isHost = true;
    }

    const updatedRooms = this.getRooms().map((r) => (r.id === updatedRoom.id ? updatedRoom : r));
    this.saveRooms(updatedRooms, false);
    return updatedRoom;
  }

  public updateRoomState(room: GameRoom): void {
    const rooms = this.getRooms();
    const updated = rooms.map((r) => (r.id === room.id ? room : r));
    this.saveRooms(updated, false);
    this.sendWsOrPost({ type: 'ROOM_STATE_SYNC', room });
  }

  public setReady(roomCode: string, ready: boolean) {
    this.sendWsOrPost({ type: 'SET_READY', roomCode, ready });
  }
  public startRound(roomCode: string) {
    this.sendWsOrPost({ type: 'START_ROUND', roomCode });
  }
  public setDifficulty(roomCode: string, difficulty: 'easy' | 'normal' | 'hard') {
    this.sendWsOrPost({ type: 'SET_DIFFICULTY', roomCode, difficulty });
  }

  public sendGameAction(roomCode: string, gameType: string, action: string, payload: any, senderId: string): void {
    this.sendWsOrPost({
      type: 'GAME_ACTION',
      roomCode,
      gameType,
      action,
      payload,
      senderId,
    });
  }

  public sendGameMove(roomCode: string, moveData: any, senderId: string): void {
    this.sendGameAction(roomCode, 'general', 'MOVE', moveData, senderId);
  }

  public sendTableEmote(roomCode: string, emoji: string, senderName: string, senderId: string): void {
    this.sendWsOrPost({
      type: 'TABLE_EMOTE',
      roomCode,
      emoji,
      senderName,
      senderId,
    });
  }

  public sendChatMessage(roomCode: string, text: string, senderName: string, senderId: string): void {
    this.sendWsOrPost({
      type: 'ROOM_CHAT',
      roomCode,
      text,
      senderName,
      senderId,
      timestamp: Date.now(),
    });
  }
}

export const multiplayerService = new MultiplayerService();
