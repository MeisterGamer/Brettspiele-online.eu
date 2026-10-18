import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {GameSessions} from './gameSessions';
import {MatchStore} from './matchStore';
import {gamesCatalog} from '../src/data/gamesCatalog';
import {findAvailablePairs} from '../src/components/games/mahjong/mahjongData';
import {initialUserProfile} from '../src/data/mockData';
import type {GameRoom} from '../src/types';

function room(engine:string):GameRoom {
  return {id:'test-'+engine,code:'TEST-'+engine,gameId:gamesCatalog.find(g=>g.engine===engine)!.id,gameTitle:engine,name:'Test',isPrivate:true,maxPlayers:engine==='catan'?4:2,currentPlayers:2,status:'lobby',voiceChatActive:false,hostName:'Host',createdAt:'Test',roundNumber:0,participants:['host','guest'].map((id,i)=>({id,name:id,avatar:initialUserProfile.avatar,isHost:i===0,isReady:true,isBot:false,score:0,ping:0,seatIndex:i}))};
}
const payload=(state:any,command:any,commandId=crypto.randomUUID())=>({command,baseRevision:state.revision,round:0,commandId});

test('server Mahjong campaign: only host selects valid levels; both users resume identical campaign',()=>{
  const r=room('mahjong'),sessions=new GameSessions(()=>{},()=>r);
  try {
    const start=sessions.read(r,'host').state;
    assert.throws(()=>sessions.dispatch(r,'guest',payload(start,{type:'START_LEVEL',level:41})),/Host/);
    assert.throws(()=>sessions.dispatch(r,'host',payload(start,{type:'START_LEVEL',level:51})),/Level/);
    const state=sessions.dispatch(r,'host',payload(start,{type:'START_LEVEL',level:41})).state as any;
    assert.equal(state.campaignLevel,41);assert.equal(state.tiles.length,144);
    assert.deepEqual(sessions.read(r,'guest').state,state);
    assert.throws(()=>sessions.dispatch(r,'host',payload(state,{type:'HINT'})),/nicht erlaubt/);
    const restored=new GameSessions(()=>{},()=>r);
    try{restored.restore(JSON.parse(JSON.stringify(sessions.export())));assert.deepEqual(restored.read(r,'host').state,state);}finally{restored.stop();}
  }finally{sessions.stop();}
});

test('server chess: turn, legality, revision, duplicate delivery and draw agreement',()=>{
  const r=room('chess'),sessions=new GameSessions(()=>{},code=>code===r.code?r:undefined);
  try{
    const initial=sessions.read(r,'host').state;
    assert.throws(()=>sessions.dispatch(r,'guest',payload(initial,{type:'MOVE',from:'e2',to:'e4'})),/nicht erlaubt/);
    assert.throws(()=>sessions.dispatch(r,'host',payload(initial,{type:'MOVE',from:'e2',to:'e5'})),/nicht erlaubt/);
    const command=payload(initial,{type:'MOVE',from:'e2',to:'e4'});
    const moved=sessions.dispatch(r,'host',command).state;
    assert.equal(moved.revision,1);assert.deepEqual(sessions.dispatch(r,'host',command).state,moved);
    assert.throws(()=>sessions.dispatch(r,'guest',payload(initial,{type:'MOVE',from:'e7',to:'e5'})),/aktualisiert/);
    const offered=sessions.dispatch(r,'guest',payload(moved,{type:'OFFER_DRAW',color:'w'})).state;
    assert.equal((offered as any).offer,'b','server derives the color from authenticated identity');
    const accepted=sessions.dispatch(r,'host',payload(offered,{type:'ACCEPT_DRAW'})).state;
    assert.equal((accepted as any).result,'draw');
  }finally{sessions.stop();}
});

test('server draughts: refuses arbitrary paths and spectators cannot move or resign',()=>{
  const r=room('checkers'),sessions=new GameSessions(()=>{},()=>r);
  try{
    const initial=sessions.read(r,'host').state;
    assert.throws(()=>sessions.dispatch(r,'guest',payload(initial,{type:'MOVE',path:[[5,0],[4,1]]})),/nicht erlaubt/);
    assert.throws(()=>sessions.dispatch(r,'host',payload(initial,{type:'MOVE',path:[[5,0],[0,7]]})),/nicht erlaubt/);
    assert.throws(()=>sessions.dispatch(r,'spectator',payload(initial,{type:'RESIGN',color:'red'})),/nicht erlaubt/);
    const next=sessions.dispatch(r,'host',payload(initial,{type:'MOVE',path:[[5,0],[4,1]]})).state;
    assert.equal((next as any).turn,'black');assert.equal(next.revision,1);
  }finally{sessions.stop();}
});

test('server Mahjong: identical boards, shared score, turn order and host-only layout reset',()=>{
  const r=room('mahjong'),sessions=new GameSessions(()=>{},()=>r);
  try{
    const a=sessions.read(r,'host').state as any,b=sessions.read(r,'guest').state as any;
    assert.deepEqual(a.tiles,b.tiles);assert.equal(a.tiles.length,144);
    const [first,second]=findAvailablePairs(a.tiles)[0];
    assert.throws(()=>sessions.dispatch(r,'guest',payload(b,{type:'MATCH',first:first.id,second:second.id})),/nicht erlaubt/);
    const next=sessions.dispatch(r,'host',payload(a,{type:'MATCH',first:first.id,second:second.id})).state as any;
    const peer=sessions.read(r,'guest').state as any;
    assert.deepEqual(next,peer);assert.equal(peer.players[0].score,100);assert.equal(peer.activePlayerIndex,1);
    assert.throws(()=>sessions.dispatch(r,'guest',payload(peer,{type:'RESET_LAYOUT',layout:'fortress'})),/Host/);
    const reset=sessions.dispatch(r,'host',payload(next,{type:'RESET_LAYOUT',layout:'fortress'})).state as any;
    assert.equal(reset.tiles.length,144);assert.equal(reset.players[0].score,0);
  }finally{sessions.stop();}
});

test('server Catan: setup commands agree across users and hidden hands stay private',()=>{
  const r=room('catan'),sessions=new GameSessions(()=>{},()=>r);
  try{
    const initial=sessions.read(r,'host').state as any;
    assert.throws(()=>sessions.dispatch(r,'guest',payload(initial,{type:'SETTLEMENT',vertex:0})),/nicht erlaubt/);
    const placed=sessions.dispatch(r,'host',payload(initial,{type:'SETTLEMENT',vertex:0})).state as any;
    assert.equal(placed.players[0].settlements[0],0);
    assert.deepEqual((sessions.read(r,'guest').state as any).board,placed.board);
    const records=structuredClone(sessions.export());const full:any=records[0].state;
    full.players[0].resources.ore=8;full.players[0].devCards.victoryPoint=1;full.players[0].victoryPoints=2;
    sessions.restore(records);
    const own:any=sessions.read(r,'host').state,peer:any=sessions.read(r,'guest').state;
    assert.equal(own.players[0].resources.ore,8);assert.equal(peer.players[0].resources.ore,0);assert.equal(peer.players[0].resourceTotal,8);
    assert.equal(peer.players[0].devCards.victoryPoint,0);assert.deepEqual(peer.devCardDeck,[]);
    assert.equal(peer.players[0].victoryPoints,1);
  }finally{sessions.stop();}
});

test('all four engines: atomic disk snapshot survives restart with move history, boards and command IDs',()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'famplay-matches-'));
  const rooms=['chess','checkers','catan','mahjong'].map(room);
  const sessions=new GameSessions(()=>{},code=>rooms.find(r=>r.code===code)),restored=new GameSessions(()=>{},code=>rooms.find(r=>r.code===code));
  try{
    const chess=sessions.read(rooms[0],'host').state;
    const command=payload(chess,{type:'MOVE',from:'e2',to:'e4'});
    sessions.dispatch(rooms[0],'host',command);
    for(const r of rooms)sessions.read(r,'host');
    const before=rooms.map(r=>sessions.read(r,'host'));
    const store=new MatchStore(directory);store.save(rooms,sessions.export());const data=new MatchStore(directory).load();
    assert.equal(data.rooms.length,4);restored.restore(data.sessions);
    assert.deepEqual(rooms.map(r=>restored.read(r,'host')),before);
    assert.deepEqual(restored.dispatch(rooms[0],'host',command),before[0]);
    rooms[0].roundNumber=1;
    assert.throws(()=>restored.dispatch(rooms[0],'host',command),/aktualisiert/);
    assert.equal((restored.read(rooms[0],'host').state as any).moves.length,0);
  }finally{
    sessions.stop();restored.stop();
    assert.ok(path.resolve(directory).startsWith(path.resolve(os.tmpdir())+path.sep+'famplay-matches-'));
    fs.rmSync(directory,{recursive:true,force:true});
  }
});

test('server AI plays independently of host browser and cannot duplicate a revision',async()=>{
  const r=room('chess');r.participants[1].isBot=true;r.aiDifficulty='easy';
  let onBot:()=>void;
  const bot=new Promise<void>(resolve=>onBot=resolve);
  const sessions=new GameSessions(()=>{if((sessions.export()[0].state as any).moves.length===2)onBot();},()=>r);
  try{
    const initial=sessions.read(r,'host').state;
    sessions.dispatch(r,'host',payload(initial,{type:'MOVE',from:'e2',to:'e4'}));
    let timer:ReturnType<typeof setTimeout>;
    await Promise.race([bot,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Bot did not play')),4000);})]).finally(()=>clearTimeout(timer!));
    assert.equal((sessions.read(r,'host').state as any).moves.length,2);
    assert.equal((sessions.read(r,'host').state as any).turn,'w');
  }finally{sessions.stop();}
});
