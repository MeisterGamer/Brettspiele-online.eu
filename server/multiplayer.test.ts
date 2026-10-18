import { test, after } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import type { DbUserRecord } from './db';
import { gamesCatalog } from '../src/data/gamesCatalog';
import { initialUserProfile } from '../src/data/mockData';
const testDir=mkdtempSync(path.join(tmpdir(),'famplay-multiplayer-'));
process.env.FAMPLAY_DATA_DIR=testDir;
const { createUser }=await import('./db');
const { JWT_SECRET }=await import('./security');
const { getRoom, getRoomEventsSince, handleHttpMessage, setupWebSocketServer }=await import('./multiplayer/wsServer');
after(() => {
  assert.ok(path.resolve(testDir).startsWith(path.resolve(tmpdir())+path.sep+'famplay-multiplayer-'));
  rmSync(testDir,{recursive:true,force:true});
});

const user = (id:string):DbUserRecord => ({
  id,username:id,email:`${id}@example.invalid`,password_hash:'not-a-login',role:'user',family_role:'Family Member',clan_name:'',level:1,xp:0,coins:0,gems:0,is_vip:false,is_banned:false,is_verified:true,avatar_json:JSON.stringify(initialUserProfile.avatar),stats_json:'{}',
});
const create = (code:string,gameId=gamesCatalog[0].id) => ({type:'CREATE_ROOM',roomCode:code,host:{id:'forged'},config:{name:'Testtisch',gameId,maxPlayers:4}});

test('HTTP-only players create, join, ready, chat and restart together with enforced host permissions', () => {
  const host=user('http-host'), guest=user('http-guest'), stranger=user('stranger');
  const code='FAM-AABBCCDDEEFF';
  handleHttpMessage(host,create(code));
  assert.equal(getRoom(code)!.participants[0].id,host.id);
  handleHttpMessage(guest,{type:'JOIN_ROOM',roomCode:code});
  assert.equal(getRoom(code)!.participants.length,2);
  assert.equal(getRoom(code)!.participants[1].isReady,false);
  const joinSnapshot=getRoomEventsSince(code,0).filter(event=>event.data.type==='ROOM_STATE_SYNC').at(-1)!.data.room;
  const before=getRoom(code)!.roundNumber;
  assert.ok((handleHttpMessage(host,{type:'START_ROUND',roomCode:code}) as any[]).some(m=>m.type==='ROOM_ERROR'));
  handleHttpMessage(guest,{type:'SET_READY',roomCode:code,ready:true});
  assert.equal(joinSnapshot.participants[1].isReady,false, 'historical room states must remain immutable');
  handleHttpMessage(guest,{type:'SET_DIFFICULTY',roomCode:code,difficulty:'easy'});
  assert.equal(getRoom(code)!.aiDifficulty,'normal');
  handleHttpMessage(host,{type:'SET_DIFFICULTY',roomCode:code,difficulty:'hard'});
  assert.equal(getRoom(code)!.aiDifficulty,'hard');
  handleHttpMessage(guest,{type:'START_ROUND',roomCode:code});
  assert.equal(getRoom(code)!.roundNumber,before);
  handleHttpMessage(host,{type:'START_ROUND',roomCode:code});
  assert.equal(getRoom(code)!.roundNumber,1);
  handleHttpMessage(guest,{type:'ROOM_CHAT',roomCode:code,text:'Hallo',senderName:'admin',senderId:host.id});
  const chat=getRoomEventsSince(code,0).find(e=>e.data.type==='ROOM_CHAT')!.data;
  assert.equal(chat.senderId,guest.id); assert.equal(chat.senderName,guest.username);
  const length=getRoomEventsSince(code,0).length;
  handleHttpMessage(stranger,{type:'GAME_ACTION',roomCode:code,gameType:'test',action:'MOVE',payload:{}});
  assert.equal(getRoomEventsSince(code,0).length,length);
  handleHttpMessage(guest,{type:'LEAVE_ROOM',roomCode:code,userId:host.id});
  assert.equal(getRoom(code)!.participants.length,1);
  assert.equal(getRoom(code)!.participants[0].id,host.id);
  handleHttpMessage(host,{type:'LEAVE_ROOM',roomCode:code});
  assert.equal(getRoom(code),undefined);
});

test('Yatzy server rejects out-of-turn commands and generates authoritative rolls', () => {
  const host=user('dice-host'), guest=user('dice-guest'); const code='FAM-112233445566';
  handleHttpMessage(host,create(code,'yatzy'));
  // Use the actual catalog id if it differs from the engine name.
  assert.ok(getRoom(code));
  handleHttpMessage(guest,{type:'JOIN_ROOM',roomCode:code});
  const command=(who:DbUserRecord,payload:any)=>handleHttpMessage(who,{type:'GAME_ACTION',roomCode:code,gameType:'yatzy',action:'YATZY_COMMAND',payload});
  const revision=()=> (handleHttpMessage(host,{type:'GAME_ACTION',roomCode:code,gameType:'yatzy',action:'YATZY_GET_STATE',payload:{}}) as any[]).find(m=>m.action==='YATZY_STATE').payload.state;
  command(guest,{type:'ROLL',dice:[99,99,99,99,99]});
  assert.equal(revision().revision,0);
  command(host,{type:'ROLL',dice:[99,99,99,99,99]});
  const rolled=revision();
  assert.equal(rolled.rollsLeft,2);
  assert.ok(rolled.dice.every((d:number)=>d>=1&&d<=6));
  command(host,{type:'SCORE',category:'chance'});
  assert.equal(revision().active,1);
  command(host,{type:'ROLL'});
  assert.equal(revision().rollsLeft,3);
  handleHttpMessage(guest,{type:'LEAVE_ROOM',roomCode:code});
  handleHttpMessage(host,{type:'LEAVE_ROOM',roomCode:code});
});

test('authenticated WebSocket room commands and reconnect replay work across two users', async () => {
  const host=user('ws-host'),guest=user('ws-guest');
  await createUser(host); await createUser(guest);
  const server=createServer(); const wss=setupWebSocketServer(server);
  server.listen(0,'127.0.0.1'); await once(server,'listening');
  const url=`ws://127.0.0.1:${(server.address() as any).port}/ws`;
  const sockets:WebSocket[]=[];
  const connect=async (account:DbUserRecord) => {
    const ws=new WebSocket(url); sockets.push(ws); await once(ws,'open');
    ws.send(JSON.stringify({type:'IDENTIFY',token:jwt.sign({userId:account.id},JWT_SECRET,{expiresIn:'5m'})}));
    return ws;
  };
  const until=(ws:WebSocket,predicate:(message:any)=>boolean):Promise<any> => new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{ws.off('message',listener);reject(new Error('Message timeout'));},3000);
    const listener=(raw:any)=>{ const message=JSON.parse(raw.toString()); if(predicate(message)){clearTimeout(timer);ws.off('message',listener);resolve(message);} };
    ws.on('message',listener);
  });
  const code='FAM-FFEEDDCCBBAA';
  try {
    const a=await connect(host);
    const created=until(a,m=>m.type==='ROOM_STATE_SYNC'&&m.room.code===code);
    a.send(JSON.stringify(create(code))); await created;
    const b=await connect(guest);
    const joined=until(b,m=>m.type==='ROOM_STATE_SYNC'&&m.room.participants.length===2);
    b.send(JSON.stringify({type:'JOIN_ROOM',roomCode:code})); await joined;
    const delivered=until(a,m=>m.type==='ROOM_CHAT');
    b.send(JSON.stringify({type:'ROOM_CHAT',roomCode:code,text:'Synchronisiert'}));
    const chat=await delivered; assert.equal(chat.senderId,guest.id); assert.ok(chat.eventId);
    const replay=until(b,m=>m.type==='ROOM_EVENTS');
    b.send(JSON.stringify({type:'GET_EVENTS',roomCode:code,since:chat.eventId-1}));
    const result=await replay;
    assert.equal(result.events[0].id,chat.eventId);
    const empty=until(b,m=>m.type==='ROOM_EVENTS');
    b.send(JSON.stringify({type:'GET_EVENTS',roomCode:code,since:chat.eventId}));
    assert.deepEqual((await empty).events,[]);
    const order:string[]=[];
    const record=(raw:any)=>order.push(JSON.parse(raw.toString()).type);
    b.on('message',record);
    const rejoined=until(b,m=>m.type==='ROOM_STATE_SYNC'&&m.room.code===code);
    b.send(JSON.stringify({type:'JOIN_ROOM',roomCode:code,since:chat.eventId-1}));
    await rejoined;
    b.off('message',record);
    assert.ok(order.indexOf('ROOM_EVENTS')>=0);
    assert.ok(order.indexOf('ROOM_EVENTS')<order.indexOf('ROOM_STATE_SYNC'));
  } finally {
    handleHttpMessage(guest,{type:'LEAVE_ROOM',roomCode:code});
    handleHttpMessage(host,{type:'LEAVE_ROOM',roomCode:code});
    for(const ws of sockets) ws.terminate();
    await new Promise<void>(resolve=>wss.close(()=>resolve()));
    await new Promise<void>(resolve=>server.close(()=>resolve()));
  }
});
