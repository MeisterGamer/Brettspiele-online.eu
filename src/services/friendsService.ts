import { FamilyFriend, FriendOnlineStatus } from '../types';
import { apiAuth } from './apiAuth';

const STORAGE_PREFIX = 'famplay_friends_v2_';
async function request(path: string, method = 'GET', body?: unknown) {
  const res = await fetch('/api/social' + path, {
    method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiAuth.getToken() },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Freundesaktion fehlgeschlagen.');
  return data;
}
export const friendsService = {
  getFriends(userId: string): FamilyFriend[] {
    try { return JSON.parse(localStorage.getItem(STORAGE_PREFIX + userId) || '[]'); } catch { return []; }
  },
  saveFriends(userId: string, friends: FamilyFriend[]) {
    try { localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify(friends)); } catch {}
    return friends;
  },
  async fetchFriends(userId: string): Promise<FamilyFriend[]> {
    const data = await request('/friends');
    return this.saveFriends(userId, data.friends);
  },
  async addFriend(userId: string, target: string, nickname?: string, familyRole?: string) {
    try {
      const data = await request('/friends', 'POST', {target,nickname,familyRole});
      this.saveFriends(userId,data.friends);
      return {success:true,friend:data.friend as FamilyFriend};
    } catch(error) { return {success:false,error:error instanceof Error ? error.message : 'Verbindung fehlgeschlagen.'}; }
  },
  async removeFriend(userId: string, friendId: string): Promise<FamilyFriend[]> {
    const data = await request('/friends/' + encodeURIComponent(friendId),'DELETE');
    return this.saveFriends(userId,data.friends);
  },
  async toggleFavorite(userId: string, friendId: string): Promise<FamilyFriend[]> {
    const friend = this.getFriends(userId).find(f=>f.id===friendId);
    const data = await request('/friends/' + encodeURIComponent(friendId),'PATCH',{isFavorite:!friend?.isFavorite});
    return this.saveFriends(userId,data.friends);
  },
  async invite(friendId: string, roomCode: string) { return request('/invitations','POST',{friendId,roomCode}); },
  async invitations() { return (await request('/invitations')).invitations as {id:string;roomCode:string;senderName:string;gameTitle:string;createdAt:string}[]; },

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
