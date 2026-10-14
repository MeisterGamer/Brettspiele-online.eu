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
  | { type: 'TABLE_EMOTE'; roomCode: string; emoji: string; senderName: string; senderId: string };

class MultiplayerService {
  private channel: BroadcastChannel | null = null;
  private listeners: ((event: MultiplayerEvent) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (msg) => {
          if (msg.data) {
            this.notifyListeners(msg.data);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported', e);
      }
    }

    // Storage fallback for cross-tab communication
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            this.notifyListeners({ type: 'ROOMS_UPDATED', rooms: parsed });
          } catch (err) {}
        }
      });
    }
  }

  public subscribe(callback: (event: MultiplayerEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
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

  private post(event: MultiplayerEvent) {
    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch (e) {}
    }
    this.notifyListeners(event);
  }

  public getRooms(): GameRoom[] {
    if (typeof window === 'undefined') return initialPublicRooms;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: GameRoom[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    this.saveRooms(initialPublicRooms, false);
    return initialPublicRooms;
  }

  public saveRooms(rooms: GameRoom[], broadcast = true): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
      if (broadcast) {
        this.post({ type: 'ROOMS_UPDATED', rooms });
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
    const rooms = this.getRooms();
    const code = `FAM-${Math.floor(100 + Math.random() * 900)}`;

    const hostParticipant: RoomParticipant = {
      id: host.id,
      name: host.name,
      avatar: host.avatar,
      isHost: true,
      isReady: true,
      score: 0,
      ping: Math.floor(15 + Math.random() * 12),
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

    const updated = [newRoom, ...rooms];
    this.saveRooms(updated);
    this.post({ type: 'ROOM_STATE_SYNC', room: newRoom });
    return newRoom;
  }

  public joinRoom(roomCode: string, user: UserProfile): GameRoom | null {
    const rooms = this.getRooms();
    const room = this.getRoomByCode(roomCode);
    if (!room) return null;

    // Check if user is already seated
    const existingIndex = room.participants.findIndex((p) => p.id === user.id);
    let updatedRoom: GameRoom;

    if (existingIndex !== -1) {
      // Refresh user avatar/name
      const updatedParticipants = [...room.participants];
      updatedParticipants[existingIndex] = {
        ...updatedParticipants[existingIndex],
        name: user.name,
        avatar: user.avatar,
        ping: Math.floor(15 + Math.random() * 15),
      };
      updatedRoom = { ...room, participants: updatedParticipants };
    } else {
      if (room.participants.length >= room.maxPlayers) {
        // Room full
        return room;
      }

      const newParticipant: RoomParticipant = {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        isHost: false,
        isReady: true,
        score: 0,
        ping: Math.floor(18 + Math.random() * 20),
        isBot: false,
        seatIndex: room.participants.length,
      };

      updatedRoom = {
        ...room,
        currentPlayers: room.participants.length + 1,
        participants: [...room.participants, newParticipant],
      };
    }

    const updatedRooms = rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r));
    this.saveRooms(updatedRooms);
    this.post({ type: 'ROOM_STATE_SYNC', room: updatedRoom });
    return updatedRoom;
  }

  public addBotToRoom(roomIdOrCode: string): GameRoom | null {
    const rooms = this.getRooms();
    const target = rooms.find((r) => r.id === roomIdOrCode || r.code === roomIdOrCode);
    if (!target) return null;

    if (target.participants.length >= target.maxPlayers) {
      return target;
    }

    const nextSeat = target.participants.length;
    const botPreset = FAMILY_BOT_PRESETS[nextSeat % FAMILY_BOT_PRESETS.length];
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

    const updatedRooms = rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r));
    this.saveRooms(updatedRooms);
    this.post({ type: 'ROOM_STATE_SYNC', room: updatedRoom });
    return updatedRoom;
  }

  public addHumanSimPlayerToRoom(roomIdOrCode: string, name?: string): GameRoom | null {
    const rooms = this.getRooms();
    const target = rooms.find((r) => r.id === roomIdOrCode || r.code === roomIdOrCode);
    if (!target) return null;

    if (target.participants.length >= target.maxPlayers) {
      return target;
    }

    const nextSeat = target.participants.length;
    const defaultNames = ['Mama Sarah', 'Bruder Felix', 'Schwester Mia', 'Opa Heinz'];
    const playerName = name || defaultNames[nextSeat % defaultNames.length];
    const botPreset = FAMILY_BOT_PRESETS[nextSeat % FAMILY_BOT_PRESETS.length];

    const humanParticipant: RoomParticipant = {
      id: `sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: playerName,
      avatar: botPreset.avatar,
      isHost: false,
      isReady: true,
      score: 0,
      ping: 22,
      isBot: false,
      seatIndex: nextSeat,
    };

    const updatedRoom: GameRoom = {
      ...target,
      currentPlayers: target.participants.length + 1,
      participants: [...target.participants, humanParticipant],
    };

    const updatedRooms = rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r));
    this.saveRooms(updatedRooms);
    this.post({ type: 'ROOM_STATE_SYNC', room: updatedRoom });
    return updatedRoom;
  }

  public removeParticipant(roomIdOrCode: string, participantId: string): GameRoom | null {
    const rooms = this.getRooms();
    const target = rooms.find((r) => r.id === roomIdOrCode || r.code === roomIdOrCode);
    if (!target) return null;

    const filtered = target.participants.filter((p) => p.id !== participantId);
    // Re-index seats
    const reindexed = filtered.map((p, idx) => ({ ...p, seatIndex: idx }));

    const updatedRoom: GameRoom = {
      ...target,
      currentPlayers: reindexed.length,
      participants: reindexed,
      hostName: reindexed[0]?.name || target.hostName,
    };

    // If host was removed, promote next participant to host
    if (reindexed.length > 0 && !reindexed.some((p) => p.isHost)) {
      reindexed[0].isHost = true;
    }

    const updatedRooms = rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r));
    this.saveRooms(updatedRooms);
    this.post({ type: 'ROOM_STATE_SYNC', room: updatedRoom });
    return updatedRoom;
  }

  public updateRoomState(room: GameRoom): void {
    const rooms = this.getRooms();
    const updated = rooms.map((r) => (r.id === room.id ? room : r));
    this.saveRooms(updated);
    this.post({ type: 'ROOM_STATE_SYNC', room });
  }

  public sendGameMove(roomCode: string, moveData: any, senderId: string): void {
    this.post({
      type: 'GAME_MOVE',
      roomCode,
      moveData,
      senderId,
    });
  }

  public sendTableEmote(roomCode: string, emoji: string, senderName: string, senderId: string): void {
    this.post({
      type: 'TABLE_EMOTE',
      roomCode,
      emoji,
      senderName,
      senderId,
    });
  }
}

export const multiplayerService = new MultiplayerService();
