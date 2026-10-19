import { Router } from 'express';
import { rateLimit, requireUser } from '../security.js';
import { getRoomsList, getRoom, getRoomEventsSince, handleHttpMessage, touchHttpSession } from '../multiplayer/wsServer.js';

export const multiplayerRouter = Router();
multiplayerRouter.get('/rooms', (_req,res)=>res.json({rooms:getRoomsList()}));
multiplayerRouter.get('/multiplayer/status', (_req,res)=>res.json({status:'ok',wsSupported:true,wsPath:'/ws'}));
multiplayerRouter.post(['/multiplayer/action','/multiplayer/message'],rateLimit(240),requireUser,(req,res)=> {
  try {
    const messages = handleHttpMessage(res.locals.user,req.body);
    const error = messages.find((message: any)=>message.type==='ROOM_ERROR');
    res.status(error?409:200).json({success:!error,messages});
  } catch { res.status(400).json({success:false,error:'Ungültige Multiplayer-Nachricht.'}); }
});
multiplayerRouter.get('/multiplayer/events', requireUser,(req,res)=> {
  const roomCode=String(req.query.roomCode || '');
  const room=getRoom(roomCode);
  if (!room?.participants.some(p=>p.id===res.locals.user.id)) return res.status(403).json({error:'Kein Raumzugriff.'});
  touchHttpSession(res.locals.user.id);
  const since=Number(req.query.since || 0);
  res.json({events:getRoomEventsSince(room.code,Number.isSafeInteger(since)&&since>=0?since:0)});
});
