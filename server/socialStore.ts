import fs from 'node:fs';
import path from 'node:path';
import { getDatabasePool } from './db.js';

export interface FriendLink { userId: string; friendId: string; nickname: string; familyRole: string; isFavorite: boolean; addedAt: string }
export interface Invitation { id: string; senderId: string; recipientId: string; roomCode: string; createdAt: string }
const file = path.resolve(process.env.FAMPLAY_DATA_DIR || '.data', 'social.json');
let state: { friends: FriendLink[]; invitations: Invitation[] } = { friends: [], invitations: [] };
if (fs.existsSync(file)) state = JSON.parse(fs.readFileSync(file, 'utf8'));
function save() {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(`${file}.tmp`, JSON.stringify(state), { mode: 0o600 });
  fs.renameSync(`${file}.tmp`, file);
}
export async function listFriendLinks(userId: string): Promise<FriendLink[]> {
  const db = getDatabasePool();
  if (!db) return state.friends.filter(f => f.userId === userId);
  const [rows]: any = await db.query('SELECT * FROM friendships WHERE user_id = ?', [userId]);
  return rows.map((r: any) => ({ userId: r.user_id, friendId: r.friend_id, nickname: r.nickname, familyRole: r.family_role, isFavorite: Boolean(r.is_favorite), addedAt: new Date(r.created_at).toISOString() }));
}
export async function saveFriendLink(link: FriendLink) {
  const db = getDatabasePool();
  if (db) {
    await db.query('INSERT INTO friendships (user_id,friend_id,nickname,family_role,is_favorite) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE nickname=VALUES(nickname),family_role=VALUES(family_role),is_favorite=VALUES(is_favorite)', [link.userId,link.friendId,link.nickname,link.familyRole,link.isFavorite]);
  } else {
    state.friends = state.friends.filter(f => f.userId !== link.userId || f.friendId !== link.friendId);
    state.friends.push(link); save();
  }
}
export async function removeFriendLink(userId: string, friendId: string) {
  const db = getDatabasePool();
  if (db) await db.query('DELETE FROM friendships WHERE user_id=? AND friend_id=?', [userId, friendId]);
  else { state.friends = state.friends.filter(f => f.userId !== userId || f.friendId !== friendId); save(); }
}
export async function saveInvitation(invite: Invitation) {
  const db = getDatabasePool();
  if (db) await db.query('INSERT INTO game_invitations (id,sender_id,recipient_id,room_code,created_at) VALUES (?,?,?,?,?)', [invite.id,invite.senderId,invite.recipientId,invite.roomCode,new Date(invite.createdAt)]);
  else { state.invitations = state.invitations.filter(i => Date.parse(i.createdAt) > Date.now() - 86400000); state.invitations.push(invite); save(); }
}
export async function listInvitations(userId: string): Promise<Invitation[]> {
  const db = getDatabasePool();
  if (!db) return state.invitations.filter(i => i.recipientId === userId && Date.parse(i.createdAt) > Date.now() - 86400000);
  const [rows]: any = await db.query('SELECT * FROM game_invitations WHERE recipient_id=? AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)', [userId]);
  return rows.map((r: any) => ({id:r.id,senderId:r.sender_id,recipientId:r.recipient_id,roomCode:r.room_code,createdAt:new Date(r.created_at).toISOString()}));
}
