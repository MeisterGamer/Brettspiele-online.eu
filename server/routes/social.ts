import { Router } from 'express';
import crypto from 'node:crypto';
import { requireUser, rateLimit } from '../security.js';
import { findUserById, findUserByEmailOrUsername } from '../db.js';
import { listFriendLinks, saveFriendLink, removeFriendLink, listInvitations, saveInvitation } from '../socialStore.js';
import { getRoom, getPlayerPresence } from '../multiplayer/wsServer.js';

export const socialRouter = Router();
const lastSeen = new Map<string, number>();
socialRouter.use(rateLimit(120), requireUser);
socialRouter.use((_req, res, next) => { lastSeen.set(res.locals.user.id, Date.now()); next(); });
async function friends(userId: string) {
  const result = await Promise.all((await listFriendLinks(userId)).map(async link => {
    const u = await findUserById(link.friendId);
    if (!u || u.is_banned) return null;
    const presence = getPlayerPresence(u.id);
    let avatar = {}; try { avatar = JSON.parse(u.avatar_json); } catch {}
    return { id:u.id, name:link.nickname || u.username, familyRole:link.familyRole || u.family_role,
      clanName:u.clan_name, level:u.level, avatar, isFavorite:link.isFavorite, addedAt:link.addedAt,
      status:presence?.status || (Date.now() - (lastSeen.get(u.id) || 0) < 45000 ? 'online' : 'offline'),
      currentGame:presence?.currentGame || null, lastSeen:presence || Date.now()-(lastSeen.get(u.id)||0)<45000 ? 'Jetzt aktiv' : 'Offline' };
  }));
  return result.filter(Boolean);
}
// Express 4 does not forward rejected async handlers automatically.
const route = (fn: any): any => (req: any, res: any, next: any) => Promise.resolve(fn(req,res)).catch(next);
socialRouter.get('/friends', route(async (_req: any, res: any) => res.json({success:true,friends:await friends(res.locals.user.id)})));
socialRouter.post('/friends', route(async (req: any,res: any) => {
  const { target, nickname = '', familyRole = '' } = req.body;
  if (typeof target !== 'string' || !target.trim() || target.length > 191 || typeof nickname !== 'string' || nickname.length>64 || typeof familyRole !== 'string' || familyRole.length>32) return res.status(400).json({error:'Ungültige Freundesdaten.'});
  const u = await findUserById(target.trim()) || await findUserByEmailOrUsername(target.trim());
  if (!u || u.is_banned) return res.status(404).json({error:'Spieler nicht gefunden.'});
  if (u.id === res.locals.user.id) return res.status(400).json({error:'Du kannst dich nicht selbst hinzufügen.'});
  if ((await listFriendLinks(res.locals.user.id)).some(f => f.friendId === u.id)) return res.status(409).json({error:'Dieser Spieler ist bereits in deiner Freundesliste.'});
  await saveFriendLink({userId:res.locals.user.id,friendId:u.id,nickname:nickname.trim(),familyRole,isFavorite:false,addedAt:new Date().toISOString()});
  res.status(201).json({success:true,friends:await friends(res.locals.user.id),friend:(await friends(res.locals.user.id)).find((f: any)=>f.id===u.id)});
}));
socialRouter.patch('/friends/:id', route(async (req: any,res: any) => {
  const link = (await listFriendLinks(res.locals.user.id)).find(f=>f.friendId===req.params.id);
  if (!link) return res.status(404).json({error:'Freund nicht gefunden.'});
  if (typeof req.body.isFavorite !== 'boolean') return res.status(400).json({error:'Ungültiger Favoritenstatus.'});
  await saveFriendLink({...link,isFavorite:req.body.isFavorite});
  res.json({success:true,friends:await friends(res.locals.user.id)});
}));
socialRouter.delete('/friends/:id', route(async (req: any,res: any) => {
  await removeFriendLink(res.locals.user.id,req.params.id);
  res.json({success:true,friends:await friends(res.locals.user.id)});
}));
socialRouter.post('/invitations', route(async (req: any,res: any) => {
  const { friendId, roomCode } = req.body;
  const room = typeof roomCode === 'string' ? getRoom(roomCode) : undefined;
  if (!room?.participants.some(p=>p.id===res.locals.user.id)) return res.status(403).json({error:'Bitte zuerst einem Tisch beitreten.'});
  if (!(await listFriendLinks(res.locals.user.id)).some(f=>f.friendId===friendId)) return res.status(403).json({error:'Spieler ist nicht in deiner Freundesliste.'});
  const recipient = await findUserById(friendId);
  if (!recipient || recipient.is_banned) return res.status(404).json({error:'Spieler nicht verfügbar.'});
  const invitation = {id:crypto.randomUUID(),senderId:res.locals.user.id,recipientId:friendId,roomCode:room.code,createdAt:new Date().toISOString()};
  await saveInvitation(invitation); res.status(201).json({success:true});
}));
socialRouter.get('/invitations', route(async (_req: any,res: any) => {
  const invitations = await Promise.all((await listInvitations(res.locals.user.id)).map(async i=> {
    const room=getRoom(i.roomCode), sender=await findUserById(i.senderId);
    return room && sender && !sender.is_banned && room.participants.some(p=>p.id===i.senderId) ? {...i,senderName:sender.username,gameTitle:room.gameTitle} : null;
  }));
  res.json({success:true,invitations:invitations.filter(Boolean)});
}));
