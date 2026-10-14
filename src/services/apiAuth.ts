import { UserProfile } from '../types';

const TOKEN_KEY = 'famplay_auth_jwt_token';
const USER_KEY = 'famplay_auth_cached_user';

export interface AuthResponse {
  success: boolean;
  user?: UserProfile;
  token?: string;
  error?: string;
  message?: string;
  verificationCode?: string;
}

export const apiAuth = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  getCachedUser(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    const token = this.getToken();
    if (!token) {
      // Mandatory authentication: never return cached user without a valid JWT token
      localStorage.removeItem(USER_KEY);
      return null;
    }
    const data = localStorage.getItem(USER_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  setCachedUser(user: UserProfile | null) {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  },

  async login(usernameOrEmail: string, password: string): Promise<AuthResponse> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password }),
      });
      const data = await res.json();
      if (data.success && data.token && data.user) {
        this.setToken(data.token);
        this.setCachedUser(data.user);
      }
      return data;
    } catch (err: any) {
      return { success: false, error: 'Verbindungsfehler zum MariaDB Server. Bitte Serververbindung prüfen.' };
    }
  },

  async register(params: {
    username: string;
    email: string;
    password: string;
    familyRole: string;
    clanName?: string;
  }): Promise<AuthResponse> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (data.success && data.token && data.user) {
        this.setToken(data.token);
        this.setCachedUser(data.user);
      }
      return data;
    } catch (err: any) {
      return { success: false, error: 'Verbindungsfehler bei der Registrierung in MariaDB.' };
    }
  },

  async fetchCurrentUser(): Promise<UserProfile | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          this.setCachedUser(data.user);
          return data.user;
        }
      }
      // If unauthorized, clear cached tokens
      this.logout();
      return null;
    } catch (err) {
      // In case of temporary network error, only return if token exists
      return this.getCachedUser();
    }
  },

  async verifyEmail(codeOrToken: string): Promise<AuthResponse> {
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeOrToken }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        this.setCachedUser(data.user);
      }
      return data;
    } catch (err) {
      return { success: false, error: 'Verbindungsfehler bei der E-Mail-Prüfung.' };
    }
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: 'Verbindungsfehler beim E-Mail-Versand.' };
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: 'Verbindungsfehler beim Ändern des Passworts.' };
    }
  },

  async getStatus(): Promise<any> {
    try {
      const res = await fetch('/api/auth/status');
      if (res.ok) return await res.json();
      return null;
    } catch {
      return null;
    }
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem('famplay_current_user_v2');
      localStorage.removeItem('famplay_current_user_v1');
      sessionStorage.clear();
    }
  },
};
