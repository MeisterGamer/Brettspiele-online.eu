import { UserProfile } from '../types';

async function authFetch(url: string, init: RequestInit = {}) {
  const res = await fetch(url,{...init,signal:AbortSignal.timeout(15000)});
  if (!res.headers.get('content-type')?.includes('application/json')) throw new Error('Der Anmeldeserver ist nicht erreichbar. Bitte den FamPlay-Server starten und die API-Weiterleitung prüfen.');
  return res;
}
const connectionError = (error: unknown) => error instanceof Error && error.message.includes('Anmeldeserver') ? error.message : 'Die Verbindung zum Server ist fehlgeschlagen. Bitte erneut versuchen.';

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
  async resendVerification(): Promise<AuthResponse> {
    const res=await authFetch('/api/auth/resend-verification',{method:'POST',headers:{Authorization:'Bearer '+this.getToken()}});
    return res.json();
  },
  async adminUsers(): Promise<UserProfile[]> {
    const response=await authFetch('/api/auth/users',{headers:{Authorization:'Bearer '+this.getToken()}});
    const data=await response.json();
    if(!response.ok) throw new Error(data.error || 'Benutzer konnten nicht geladen werden.');
    return data.users;
  },
  async adminUpdate(userId: string, updates: {role?:string;isVip?:boolean;isBanned?:boolean;coinsDelta?:number}): Promise<UserProfile> {
    const response=await authFetch('/api/auth/users/'+encodeURIComponent(userId),{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer '+this.getToken()},body:JSON.stringify(updates)});
    const data=await response.json();
    if(!response.ok) throw new Error(data.error || 'Benutzer konnte nicht gespeichert werden.');
    return data.user;
  },
  async updateProfile(user: UserProfile): Promise<UserProfile> {
    const res = await authFetch('/api/auth/profile',{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer '+this.getToken()},body:JSON.stringify({name:user.name,clanName:user.clanName,familyRole:user.familyRole,avatar:user.avatar,themeId:user.themeId})});
    const data = await res.json();
    if (!res.ok || !data.user) throw new Error(data.error || 'Profil konnte nicht gespeichert werden.');
    this.setCachedUser(data.user); return data.user;
  },
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
      const res = await authFetch('/api/auth/login', {
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
      return { success: false, error: connectionError(err) };
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
      const res = await authFetch('/api/auth/register', {
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
      return { success: false, error: connectionError(err) };
    }
  },

  async fetchCurrentUser(): Promise<UserProfile | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await authFetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          this.setCachedUser(data.user);
          return data.user;
        }
      }
      // A temporary server failure must not destroy a valid local session.
      if ([401,403,404].includes(res.status)) {this.logout();return null;}
      return this.getCachedUser();
    } catch (err) {
      // In case of temporary network error, only return if token exists
      return this.getCachedUser();
    }
  },

  async verifyEmail(codeOrToken: string): Promise<AuthResponse> {
    try {
      const res = await authFetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + this.getToken() },
        body: JSON.stringify({ codeOrToken }),
      });
      const data = await res.json();
      if (data.success && data.user && this.getCachedUser()?.id===data.user.id) {
        this.setCachedUser(data.user);
      }
      return data;
    } catch (err) {
      return { success: false, error: 'Verbindungsfehler bei der E-Mail-Prüfung.' };
    }
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await authFetch('/api/auth/forgot-password', {
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
      const res = await authFetch('/api/auth/reset-password', {
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
      const res = await authFetch('/api/auth/status');
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

    }
  },
};
