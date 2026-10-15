import { GameRoom, RoomParticipant, UserProfile, AvatarConfig } from '../types';
import { initialPublicRooms } from '../data/mockData';

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

export type MultiplayerEvent =
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

      // Initial HTTP fetch of rooms
      this.fetchRoomsFromHttp();
    }
  }

  public identifyUser(user: UserProfile) {
    this.currentUser = user;
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'IDENTIFY',
        user,
      }));
    }
  }

  public isRealtimeConnected(): boolean {
    return Boolean(this.isConnected && this.socket && this.socket.readyState === WebSocket.OPEN);
  }

  private connectWebSocket() {
    if (typeof window === 'undefined') return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;

        if (this.currentUser) {
          this.socket?.send(JSON.stringify({
            type: 'IDENTIFY',
            user: this.currentUser,
          }));
        }

        if (this.currentRoomCode && this.currentUser) {
          this.socket?.send(JSON.stringify({
            type: 'JOIN_ROOM',
            roomCode: this.currentRoomCode,
            user: this.currentUser,
          }));
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingEvent(data, true);
        } catch (err) {
          console.error('[WS] Parse error:', err);
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        // Quietly close without filling console with repeated red errors; HTTP fallback handles sync
        try {
          this.socket?.close();
        } catch (e) {}
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    // Gradual exponential backoff (2.5s, 5s, 10s, up to 30s)
    const delay = Math.min(2500 * Math.pow(1.5, this.reconnectAttempts), 30000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts++;
      this.connectWebSocket();
    }, delay);
  }

  private lastPolledEventId = 0;
  private pollInterval: any = null;

  private startPollingFallback() {
    if (this.pollInterval || typeof window === 'undefined') return;
    this.pollInterval = setInterval(async () => {
      // If WebSocket is actively connected, WS takes priority
      if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
        return;
      }
      if (!this.currentRoomCode) {
        return;
      }

      try {
        const res = await fetch(
          `/api/multiplayer/events?roomCode=${encodeURIComponent(this.currentRoomCode)}&since=${this.lastPolledEventId}`
        );
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.events) && json.events.length > 0) {
            for (const item of json.events) {
              if (item.id > this.lastPolledEventId) {
                this.lastPolledEventId = item.id;
              }
              if (item.data) {
                this.handleIncomingEvent(item.data, true);
              }
            }
          }
        }
      } catch (e) {}
    }, 600);
  }

  private async fetchRoomsFromHttp() {
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.rooms) && data.rooms.length > 0) {
          this.cachedRooms = data.rooms;
          this.saveRooms(data.rooms, false);
          this.notifyListeners({ type: 'ROOMS_UPDATED', rooms: data.rooms });
        }
      }
    } catch (e) {}
  }

  private handleIncomingEvent(event: MultiplayerEvent, fromServer = false) {
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

    // Relay to local BroadcastChannel if received from server
    if (fromServer && this.channel) {
      try {
        this.channel.postMessage(event);
      } catch (e) {}
    }
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

    // If WebSocket is not connected or in case of game action, push to HTTP endpoint
    if (!sentViaWs && (event.type === 'GAME_ACTION' || event.type === 'TABLE_EMOTE' || event.type === 'ROOM_STATE_SYNC')) {
      try {
        fetch('/api/multiplayer/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        }).catch(() => {});
      } catch (e) {}
    }

    // Also post locally so caller receives it
    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch (e) {}
    }
    this.handleIncomingEvent(event, false);
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
    const code = `FAM-${Math.floor(100 + Math.random() * 900)}`;
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
      host,
      config,
    });

    const updated = [newRoom, ...this.getRooms()];
    this.saveRooms(updated, false);
    return newRoom;
  }

  public joinRoom(roomCode: string, user: UserProfile): GameRoom | null {
    this.currentUser = user;
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
    this.saveRooms(updated);
    this.sendWsOrPost({ type: 'ROOM_STATE_SYNC', room });
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
