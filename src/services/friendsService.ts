import { FamilyFriend, FriendOnlineStatus, AvatarConfig } from '../types';
import { sound } from './sound';

const STORAGE_PREFIX = 'famplay_friends_v1_';

// Default starter family members for demonstration & instant playability
export const STARTER_FAMILY_MEMBERS: FamilyFriend[] = [
  {
    id: 'fam_papa_01',
    name: 'Papa Markus',
    familyRole: 'Parent',
    clanName: 'Familie Neumann',
    level: 7,
    status: 'online',
    currentGame: 'Mensch ärgere Dich nicht',
    lastSeen: 'Jetzt aktiv',
    addedAt: 'Gestern',
    isFavorite: true,
    avatar: {
      skinTone: '#FCD34D',
      hairStyle: 'cap',
      hairColor: '#451A03',
      eyes: 'cool',
      mouth: 'smile',
      outfit: 'jersey',
      outfitColor: '#2563EB',
      accessory: 'mustache',
      flair: 'wood',
    },
  },
  {
    id: 'fam_mama_02',
    name: 'Mama Julia',
    familyRole: 'Parent',
    clanName: 'Familie Neumann',
    level: 9,
    status: 'in-game',
    currentGame: 'Uno (FamCards)',
    lastSeen: 'Im Spiel • Tisch #4',
    addedAt: 'Vor 3 Tagen',
    isFavorite: true,
    avatar: {
      skinTone: '#FDE68A',
      hairStyle: 'curly',
      hairColor: '#B45309',
      eyes: 'sparkle',
      mouth: 'laugh',
      outfit: 'hoodie',
      outfitColor: '#10B981',
      accessory: 'star',
      flair: 'rainbow',
    },
  },
  {
    id: 'fam_opa_03',
    name: 'Opa Heinz',
    familyRole: 'Grandparent',
    clanName: 'Familie Neumann',
    level: 12,
    status: 'online',
    currentGame: 'Klassisches Schach',
    lastSeen: 'Online im Schach-Salon',
    addedAt: 'Vor 1 Woche',
    isFavorite: false,
    avatar: {
      skinTone: '#FEF08A',
      hairStyle: 'grandpa',
      hairColor: '#94A3B8',
      eyes: 'glasses',
      mouth: 'grin',
      outfit: 'royal',
      outfitColor: '#4F46E5',
      accessory: 'none',
      flair: 'gold-vip',
    },
  },
  {
    id: 'fam_lisa_04',
    name: 'Lisa (Schwester)',
    familyRole: 'Child',
    clanName: 'Familie Neumann',
    level: 5,
    status: 'away',
    currentGame: null,
    lastSeen: 'Vor 15 Min. aktiv',
    addedAt: 'Vor 2 Wochen',
    isFavorite: false,
    avatar: {
      skinTone: '#FCD34D',
      hairStyle: 'ponytail',
      hairColor: '#78350F',
      eyes: 'happy',
      mouth: 'grin',
      outfit: 'dino',
      outfitColor: '#F59E0B',
      accessory: 'party-hat',
      flair: 'none',
    },
  },
  {
    id: 'fam_ben_05',
    name: 'Ben (Cousin)',
    familyRole: 'Teen',
    clanName: 'Brettspiel-Meister',
    level: 8,
    status: 'offline',
    currentGame: null,
    lastSeen: 'Gestern, 19:40 Uhr',
    addedAt: 'Vor 3 Wochen',
    isFavorite: false,
    avatar: {
      skinTone: '#FBBF24',
      hairStyle: 'spiky',
      hairColor: '#1E293B',
      eyes: 'cool',
      mouth: 'neutral',
      outfit: 'hoodie',
      outfitColor: '#E11D48',
      accessory: 'headphones',
      flair: 'none',
    },
  },
];

export const friendsService = {
  /**
   * Retrieves friends for a specific user ID
   */
  getFriends(userId: string): FamilyFriend[] {
    if (!userId) return [];
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[FriendsService] Failed to load friends from storage:', e);
    }

    // Default to starter family list on first use
    this.saveFriends(userId, STARTER_FAMILY_MEMBERS);
    return STARTER_FAMILY_MEMBERS;
  },

  /**
   * Persists friends list for a user
   */
  saveFriends(userId: string, friends: FamilyFriend[]): void {
    if (!userId) return;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(friends));
    } catch (e) {
      console.warn('[FriendsService] Failed to save friends to storage:', e);
    }
  },

  /**
   * Add friend by ID or username lookup
   */
  async addFriend(
    currentUserId: string,
    targetInput: string,
    customNickname?: string,
    familyRole?: string
  ): Promise<{ success: boolean; friend?: FamilyFriend; error?: string }> {
    const cleanInput = targetInput.trim();
    if (!cleanInput) {
      return { success: false, error: 'Bitte gib eine gültige Spieler-ID oder einen Benutzernamen ein.' };
    }

    if (cleanInput.toLowerCase() === currentUserId.toLowerCase()) {
      return { success: false, error: 'Du kannst dich nicht selbst als Freund hinzufügen.' };
    }

    const currentFriends = this.getFriends(currentUserId);
    const alreadyExists = currentFriends.some(
      (f) => f.id.toLowerCase() === cleanInput.toLowerCase() || f.name.toLowerCase() === cleanInput.toLowerCase()
    );

    if (alreadyExists) {
      return { success: false, error: 'Dieses Familienmitglied befindet sich bereits in deiner Freundesliste!' };
    }

    // 1. Try fetching from server API
    try {
      const res = await fetch(`/api/users/lookup/${encodeURIComponent(cleanInput)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          const u = data.user;
          const newFriend: FamilyFriend = {
            id: u.id,
            name: customNickname?.trim() || u.name,
            familyRole: familyRole || u.familyRole || 'Family Member',
            clanName: u.clanName || '',
            level: u.level || 1,
            status: 'online',
            currentGame: null,
            lastSeen: 'Gerade online',
            addedAt: 'Heute',
            isFavorite: false,
            avatar: u.avatar || {
              skinTone: '#FCD34D',
              hairStyle: 'spiky',
              hairColor: '#451A03',
              eyes: 'happy',
              mouth: 'smile',
              outfit: 'tshirt',
              outfitColor: '#3B82F6',
              accessory: 'none',
              flair: 'none',
            },
          };

          const updated = [newFriend, ...currentFriends];
          this.saveFriends(currentUserId, updated);
          sound.playReward();
          return { success: true, friend: newFriend };
        }
      }
    } catch (e) {
      // Backend not reached or offline, fallback to local lookup below
    }

    // 2. Check starter family catalog by ID or name
    const fromStarter = STARTER_FAMILY_MEMBERS.find(
      (s) => s.id.toLowerCase() === cleanInput.toLowerCase() || s.name.toLowerCase().includes(cleanInput.toLowerCase())
    );

    if (fromStarter) {
      const newFriend: FamilyFriend = {
        ...fromStarter,
        id: fromStarter.id,
        name: customNickname?.trim() || fromStarter.name,
        familyRole: familyRole || fromStarter.familyRole,
        addedAt: 'Heute',
      };
      const updated = [newFriend, ...currentFriends];
      this.saveFriends(currentUserId, updated);
      sound.playReward();
      return { success: true, friend: newFriend };
    }

    // 3. If valid ID pattern entered (e.g., usr_... or fam_... or custom family ID), create structured friend entry
    const generatedAvatar: AvatarConfig = {
      skinTone: ['#FCD34D', '#FDE68A', '#FEF08A', '#FBBF24'][Math.floor(Math.random() * 4)],
      hairStyle: ['curly', 'spiky', 'straight', 'cap', 'ponytail'][Math.floor(Math.random() * 5)] as any,
      hairColor: ['#451A03', '#B45309', '#1E293B', '#78350F'][Math.floor(Math.random() * 4)],
      eyes: 'happy',
      mouth: 'smile',
      outfit: 'hoodie',
      outfitColor: ['#2563EB', '#10B981', '#E11D48', '#F59E0B', '#8B5CF6'][Math.floor(Math.random() * 5)],
      accessory: 'none',
      flair: 'none',
    };

    const newFriend: FamilyFriend = {
      id: cleanInput.startsWith('usr_') || cleanInput.startsWith('fam_') ? cleanInput : `fam_${cleanInput.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name: customNickname?.trim() || cleanInput,
      familyRole: familyRole || 'Family Member',
      clanName: 'Familie',
      level: Math.floor(Math.random() * 8) + 1,
      status: 'online',
      currentGame: null,
      lastSeen: 'Gerade online',
      addedAt: 'Heute',
      isFavorite: false,
      avatar: generatedAvatar,
    };

    const updated = [newFriend, ...currentFriends];
    this.saveFriends(currentUserId, updated);
    sound.playReward();
    return { success: true, friend: newFriend };
  },

  /**
   * Remove friend
   */
  removeFriend(currentUserId: string, friendId: string): FamilyFriend[] {
    const friends = this.getFriends(currentUserId);
    const updated = friends.filter((f) => f.id !== friendId);
    this.saveFriends(currentUserId, updated);
    sound.playClick();
    return updated;
  },

  /**
   * Toggle favorite bookmark
   */
  toggleFavorite(currentUserId: string, friendId: string): FamilyFriend[] {
    const friends = this.getFriends(currentUserId);
    const updated = friends.map((f) => {
      if (f.id === friendId) {
        return { ...f, isFavorite: !f.isFavorite };
      }
      return f;
    });
    this.saveFriends(currentUserId, updated);
    sound.playChip();
    return updated;
  },

  /**
   * Status helper for colors and labels
   */
  getStatusBadge(status: FriendOnlineStatus) {
    switch (status) {
      case 'online':
        return {
          label: 'Online',
          colorClass: 'bg-emerald-500',
          ringClass: 'ring-emerald-400/40',
          textClass: 'text-emerald-400',
          dotBg: 'bg-emerald-400',
        };
      case 'in-game':
        return {
          label: 'Im Spiel',
          colorClass: 'bg-amber-400',
          ringClass: 'ring-amber-400/40',
          textClass: 'text-amber-400',
          dotBg: 'bg-amber-400 animate-pulse',
        };
      case 'away':
        return {
          label: 'Abwesend',
          colorClass: 'bg-orange-400',
          ringClass: 'ring-orange-400/40',
          textClass: 'text-orange-400',
          dotBg: 'bg-orange-400',
        };
      case 'offline':
      default:
        return {
          label: 'Offline',
          colorClass: 'bg-slate-500',
          ringClass: 'ring-slate-500/20',
          textClass: 'text-slate-400',
          dotBg: 'bg-slate-500',
        };
    }
  },
};
