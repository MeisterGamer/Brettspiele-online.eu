import { UserProfile, AdminAuditLog } from '../types';

const STORAGE_KEY_CURRENT_USER = 'famplay_current_user_v2';
const STORAGE_KEY_USERS = 'famplay_all_users_v2';
const STORAGE_KEY_AUDIT_LOGS = 'famplay_audit_logs_v2';

// Clean initial accounts without fake match records or fake stats
export const INITIAL_DEMO_USERS: UserProfile[] = [
  {
    id: 'usr_admin',
    name: 'Admin',
    email: 'admin@famplay.com',
    role: 'admin',
    familyRole: 'Family Champion',
    clanName: '',
    level: 1,
    xp: 0,
    coins: 500,
    gems: 20,
    isVip: true,
    streakDays: 0,
    lastDailyClaim: '',
    joinedDate: 'Heute',
    avatar: {
      skinTone: '#FCD34D',
      hairStyle: 'spiky',
      hairColor: '#451A03',
      eyes: 'sparkle',
      mouth: 'smile',
      outfit: 'royal',
      outfitColor: '#4F46E5',
      accessory: 'crown',
      flair: 'gold-vip',
    },
    stats: {
      gamesPlayed: 0,
      gamesWon: 0,
      tournamentsWon: 0,
      favoriteGame: 'Mensch ärgere Dich nicht',
    },
    matchHistory: [],
  },
  {
    id: 'usr_guest',
    name: 'Gast-Spieler',
    email: 'gast@famplay.com',
    role: 'user',
    familyRole: 'Child',
    clanName: '',
    level: 1,
    xp: 0,
    coins: 200,
    gems: 0,
    isVip: false,
    streakDays: 0,
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
  },
];

const INITIAL_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'log_boot',
    timestamp: new Date().toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }),
    adminName: 'System',
    action: 'SYSTEM_BOOT',
    target: 'FamPlay Plattform',
    details: 'System initialisiert mit sauberen Spieldaten und 10 echten Spieltischen.',
  },
];

export const authService = {
  getUsers(): UserProfile[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_USERS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
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
      clanName: params.clanName?.trim() || '',
      level: 1,
      xp: 0,
      coins: 500, // Willkommensbonus
      gems: 10,
      isVip: false,
      streakDays: 0,
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
    try {
      localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(logs.slice(0, 100)));
    } catch {
      // ignore
    }
  },

  clearAllPlayerData(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_USERS);
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      localStorage.removeItem(STORAGE_KEY_AUDIT_LOGS);
      // Clean up old keys as well
      localStorage.removeItem('famplay_current_user_v1');
      localStorage.removeItem('famplay_all_users_v1');
      localStorage.removeItem('famplay_audit_logs_v1');
      localStorage.removeItem('famplay_multiplayer_rooms_v1');
    } catch {
      // ignore
    }
  },
};
