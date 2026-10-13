import { UserProfile, AdminAuditLog } from '../types';

const STORAGE_KEY_CURRENT_USER = 'famplay_current_user_v1';
const STORAGE_KEY_USERS = 'famplay_all_users_v1';
const STORAGE_KEY_AUDIT_LOGS = 'famplay_audit_logs_v1';

export const INITIAL_DEMO_USERS: UserProfile[] = [
  {
    id: 'usr_admin',
    name: 'Alex Gamer (Admin)',
    email: 'admin@famplay.com',
    role: 'admin',
    familyRole: 'Family Champion',
    clanName: 'The Miller Squad',
    level: 20,
    xp: 8540,
    coins: 12500,
    gems: 350,
    isVip: true,
    streakDays: 14,
    lastDailyClaim: '2026-10-12',
    joinedDate: '15. Januar 2025',
    avatar: {
      skinTone: '#FCD34D',
      hairStyle: 'spiky',
      hairColor: '#451A03',
      eyes: 'sparkle',
      mouth: 'smile',
      outfit: 'royal',
      outfitColor: '#4F46E5',
      accessory: 'crown',
      flair: 'diamond',
    },
    stats: {
      gamesPlayed: 248,
      gamesWon: 176,
      tournamentsWon: 12,
      favoriteGame: 'Mensch ärgere Dich nicht (Ludo)',
    },
    matchHistory: [
      {
        id: 'm1',
        gameId: 'ludo',
        gameTitle: 'Mensch ärgere Dich nicht',
        result: 'won',
        score: 400,
        opponentName: 'Papa Markus, Emma',
        date: 'Heute, 12:45',
        xpEarned: 250,
        coinsEarned: 200,
      },
      {
        id: 'm2',
        gameId: 'chess',
        gameTitle: 'Klassisches Schach',
        result: 'won',
        score: 750,
        opponentName: 'Großmeister AI',
        date: 'Gestern, 18:20',
        xpEarned: 300,
        coinsEarned: 250,
      },
      {
        id: 'm3',
        gameId: 'fam-cards',
        gameTitle: 'FamCards (Uno)',
        result: 'won',
        score: 320,
        opponentName: 'Oma Renate',
        date: '10. Okt, 16:15',
        xpEarned: 180,
        coinsEarned: 150,
      },
      {
        id: 'm4',
        gameId: 'connect-four',
        gameTitle: 'Vier Gewinnt',
        result: 'lost',
        score: 90,
        opponentName: 'Emma',
        date: '08. Okt, 14:00',
        xpEarned: 80,
        coinsEarned: 50,
      },
    ],
  },
  {
    id: 'usr_markus',
    name: 'Papa Markus',
    email: 'markus@famplay.com',
    role: 'moderator',
    familyRole: 'Parent',
    clanName: 'The Miller Squad',
    level: 12,
    xp: 3200,
    coins: 2400,
    gems: 60,
    isVip: true,
    streakDays: 7,
    lastDailyClaim: '2026-10-12',
    joinedDate: '10. Februar 2025',
    avatar: {
      skinTone: '#FBBF24',
      hairStyle: 'straight',
      hairColor: '#1F2937',
      eyes: 'cool',
      mouth: 'grin',
      outfit: 'hoodie',
      outfitColor: '#10B981',
      accessory: 'mustache',
      flair: 'wood',
    },
    stats: {
      gamesPlayed: 110,
      gamesWon: 58,
      tournamentsWon: 2,
      favoriteGame: 'Klassisches Schach',
    },
    matchHistory: [
      {
        id: 'm20',
        gameId: 'chess',
        gameTitle: 'Klassisches Schach',
        result: 'lost',
        score: 420,
        opponentName: 'Alex Gamer',
        date: 'Heute, 10:15',
        xpEarned: 100,
        coinsEarned: 80,
      },
    ],
  },
  {
    id: 'usr_emma',
    name: 'Emma',
    email: 'emma@famplay.com',
    role: 'user',
    familyRole: 'Child',
    clanName: 'The Miller Squad',
    level: 7,
    xp: 1120,
    coins: 980,
    gems: 25,
    isVip: false,
    streakDays: 4,
    lastDailyClaim: '2026-10-12',
    joinedDate: '01. April 2025',
    avatar: {
      skinTone: '#FDE047',
      hairStyle: 'ponytail',
      hairColor: '#B45309',
      eyes: 'sparkle',
      mouth: 'laugh',
      outfit: 'dino',
      outfitColor: '#EC4899',
      accessory: 'party-hat',
      flair: 'rainbow',
    },
    stats: {
      gamesPlayed: 64,
      gamesWon: 34,
      tournamentsWon: 1,
      favoriteGame: 'Memory Match',
    },
    matchHistory: [
      {
        id: 'm31',
        gameId: 'memory-match',
        gameTitle: 'Memory Match',
        result: 'won',
        score: 600,
        opponentName: 'Papa Markus',
        date: 'Heute, 11:30',
        xpEarned: 150,
        coinsEarned: 120,
      },
    ],
  },
  {
    id: 'usr_renate',
    name: 'Oma Renate',
    email: 'renate@famplay.com',
    role: 'user',
    familyRole: 'Grandparent',
    clanName: 'The Miller Squad',
    level: 9,
    xp: 1850,
    coins: 1950,
    gems: 40,
    isVip: false,
    streakDays: 9,
    lastDailyClaim: '2026-10-11',
    joinedDate: '20. März 2025',
    avatar: {
      skinTone: '#FEF08A',
      hairStyle: 'grandpa',
      hairColor: '#E5E7EB',
      eyes: 'glasses',
      mouth: 'smile',
      outfit: 'royal',
      outfitColor: '#8B5CF6',
      accessory: 'none',
      flair: 'none',
    },
    stats: {
      gamesPlayed: 92,
      gamesWon: 48,
      tournamentsWon: 0,
      favoriteGame: 'Skat (Altenburg)',
    },
    matchHistory: [],
  },
  {
    id: 'usr_guest',
    name: 'Gast-Spieler',
    email: 'gast@famplay.com',
    role: 'user',
    familyRole: 'Teen',
    clanName: 'Entdecker',
    level: 1,
    xp: 120,
    coins: 400,
    gems: 10,
    isVip: false,
    streakDays: 1,
    lastDailyClaim: '',
    joinedDate: 'Heute',
    avatar: {
      skinTone: '#FCD34D',
      hairStyle: 'straight',
      hairColor: '#1F2937',
      eyes: 'happy',
      mouth: 'smile',
      outfit: 'tshirt',
      outfitColor: '#6B7280',
      accessory: 'headphones',
      flair: 'none',
    },
    stats: {
      gamesPlayed: 3,
      gamesWon: 1,
      tournamentsWon: 0,
      favoriteGame: 'Vier Gewinnt',
    },
    matchHistory: [],
  },
];

const INITIAL_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'log_1',
    timestamp: '13.10.2026, 12:40',
    adminName: 'Alex Gamer (Admin)',
    action: 'SYSTEM_BOOT',
    target: 'FamPlay Server-Cluster',
    details: 'Cluster gestartet, 100+ Spielbibliotheken verifiziert & synchronisiert.',
  },
  {
    id: 'log_2',
    timestamp: '13.10.2026, 12:45',
    adminName: 'Alex Gamer (Admin)',
    action: 'BROADCAST_SENT',
    target: 'Global Player Feed',
    details: 'Willkommensbanner für den Familientisch aktiviert.',
  },
  {
    id: 'log_3',
    timestamp: '13.10.2026, 13:00',
    adminName: 'Alex Gamer (Admin)',
    action: 'FEATURED_GAME',
    target: 'Ludo (Mensch ärgere Dich nicht)',
    details: 'Als empfohlenes Flaggschiff-Spiel der Woche markiert.',
  },
];

export const authService = {
  getUsers(): UserProfile[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_USERS);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(INITIAL_DEMO_USERS));
    return INITIAL_DEMO_USERS;
  },

  saveUsers(users: UserProfile[]) {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch {
      // ignore
    }
  },

  getCurrentUser(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    const defaultUser = INITIAL_DEMO_USERS[0];
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(defaultUser));
    return defaultUser;
  },

  setCurrentUser(user: UserProfile) {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
      // Also update in all users list
      const users = this.getUsers();
      const idx = users.findIndex((u) => u.id === user.id);
      if (idx !== -1) {
        users[idx] = user;
      } else {
        users.push(user);
      }
      this.saveUsers(users);
    } catch {
      // ignore
    }
  },

  login(identifier: string, _password?: string): { success: boolean; user?: UserProfile; error?: string } {
    const users = this.getUsers();
    const cleanId = identifier.trim().toLowerCase();
    
    const found = users.find(
      (u) =>
        u.email?.toLowerCase() === cleanId ||
        u.name.toLowerCase() === cleanId ||
        u.id.toLowerCase() === cleanId
    );

    if (!found) {
      return { success: false, error: 'Kein Benutzer mit dieser E-Mail oder diesem Benutzernamen gefunden.' };
    }

    if (found.isBanned) {
      return { 
        success: false, 
        error: `Dieses Konto wurde vom Administrator gesperrt. Grund: ${found.banReason || 'Verstoß gegen die Regeln'}` 
      };
    }

    this.setCurrentUser(found);
    return { success: true, user: found };
  },

  register(params: {
    name: string;
    email: string;
    familyRole: 'Child' | 'Teen' | 'Parent' | 'Grandparent' | 'Family Champion';
    clanName?: string;
  }): { success: boolean; user?: UserProfile; error?: string } {
    const users = this.getUsers();
    const cleanEmail = params.email.trim().toLowerCase();
    
    if (users.some((u) => u.email?.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Ein Konto mit dieser E-Mail-Adresse existiert bereits.' };
    }

    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: params.name.trim(),
      email: cleanEmail,
      role: 'user',
      familyRole: params.familyRole,
      clanName: params.clanName?.trim() || 'Familie ' + params.name.trim(),
      level: 1,
      xp: 0,
      coins: 500, // Willkommensbonus
      gems: 20,
      isVip: false,
      streakDays: 1,
      lastDailyClaim: '',
      joinedDate: 'Heute',
      avatar: {
        skinTone: '#FCD34D',
        hairStyle: 'spiky',
        hairColor: '#451A03',
        eyes: 'happy',
        mouth: 'smile',
        outfit: 'hoodie',
        outfitColor: '#3B82F6',
        accessory: 'none',
        flair: 'none',
      },
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        tournamentsWon: 0,
        favoriteGame: 'Mensch ärgere Dich nicht',
      },
      matchHistory: [],
    };

    users.push(newUser);
    this.saveUsers(users);
    this.setCurrentUser(newUser);

    this.addAuditLog('USER_REGISTERED', newUser.name, `Neues Konto (${newUser.email}) registriert.`);
    return { success: true, user: newUser };
  },

  logout(): UserProfile {
    const guestUser = INITIAL_DEMO_USERS.find((u) => u.id === 'usr_guest') || INITIAL_DEMO_USERS[0];
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(guestUser));
    return guestUser;
  },

  switchAccount(userId: string): UserProfile | null {
    const users = this.getUsers();
    const found = users.find((u) => u.id === userId);
    if (found) {
      this.setCurrentUser(found);
      return found;
    }
    return null;
  },

  getAuditLogs(): AdminAuditLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    return INITIAL_AUDIT_LOGS;
  },

  addAuditLog(action: string, target: string, details: string, adminName: string = 'System Admin') {
    const logs = this.getAuditLogs();
    const newLog: AdminAuditLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }),
      adminName,
      action,
      target,
      details,
    };
    logs.unshift(newLog);
    if (logs.length > 50) logs.pop();
    try {
      localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(logs));
    } catch {
      // ignore
    }
  },
};
