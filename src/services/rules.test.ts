import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {initialChess,reduceChess,chessPosition,chooseChessMove} from './chessEngine';
import {initialDraughts,draughtsMoves,applyDraughts,chooseDraughtsMove,type DraughtsBoard} from './draughtsEngine';
import {initialMahjong,reduceMahjong} from './mahjongEngine';
import {findAvailablePairs,isTileFree} from '../components/games/mahjong/mahjongData';
import {initialCatan,reduceCatan,chooseCatanMove,resources,totalResources,catanLongestRoad,catanView,type CatanState,type CatanCommand} from './catanEngine';
import type {RoomParticipant} from '../types';
import {initialUserProfile} from '../data/mockData';
const participants=(count=2):RoomParticipant[]=>Array.from({length:count},(_,i)=>({id:`p${i}`,name:`Spieler ${i}`,avatar:initialUserProfile.avatar,isHost:i===0,isReady:true,isBot:false,score:0,ping:0}));
const move=(s:ReturnType<typeof initialChess>,from:string,to:string,promotion?:string)=>reduceChess(s,{type:'MOVE',from,to,promotion});

test('chess: king safety, castling, attacked transit and lost castling rights',()=>{
  const pinned=initialChess('k3r3/8/8/8/8/8/4R3/4K3 w - - 0 1');
  assert.equal(move(pinned,'e2','f2'),pinned);
  const start=initialChess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
  const castled=move(start,'e1','g1');
  assert.equal(chessPosition(castled).get('f1')?.type,'r');assert.equal(chessPosition(castled).get('g1')?.type,'k');
  const attacked=initialChess('r3kr1r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
  assert.equal(move(attacked,'e1','g1'),attacked);
  let lost=move(start,'h1','h2');lost=move(lost,'h8','h7');lost=move(lost,'h2','h1');lost=move(lost,'h7','h8');
  assert.equal(move(lost,'e1','g1'),lost);
});
test('chess: en passant removes the right pawn and all four promotions are available',()=>{
  let s=initialChess();for(const [from,to]of [['e2','e4'],['a7','a6'],['e4','e5'],['d7','d5'],['e5','d6']])s=move(s,from,to);
  assert.equal(chessPosition(s).get('d6')?.color,'w');assert.equal(chessPosition(s).get('d5'),undefined);
  for(const promotion of ['q','r','b','n']){
    const base=initialChess('7k/P7/8/8/8/8/8/7K w - - 0 1');
    assert.equal(chessPosition(move(base,'a7','a8',promotion)).get('a8')?.type,promotion);
  }
});
test('chess: checkmate, stalemate, claimable and automatic draws',()=>{
  let s=initialChess();for(const [from,to]of [['f2','f3'],['e7','e5'],['g2','g4'],['d8','h4']])s=move(s,from,to);
  assert.equal(s.result,'b');assert.equal(s.reason,'Schachmatt');assert.equal(move(s,'e1','f2'),s);
  assert.equal(initialChess('7k/5K2/6Q1/8/8/8/8/8 b - - 0 1').reason,'Patt');
  assert.equal(initialChess('7k/8/8/8/8/8/8/K7 w - - 0 1').result,'draw');
  s=initialChess();const cycle=[['g1','f3'],['g8','f6'],['f3','g1'],['f6','g8']];
  for(let n=0;n<2;n++)for(const[from,to]of cycle)s=move(s,from,to);
  assert.equal(s.result,null);assert.equal(reduceChess(s,{type:'CLAIM_DRAW',color:'w'}).result,'draw');
  for(let n=0;n<2;n++)for(const[from,to]of cycle)s=move(s,from,to);
  assert.equal(s.reason,'Fünffache Stellungswiederholung');
  const fifty=move(initialChess('4k3/8/8/8/8/8/8/R3K3 w Q - 99 1'),'a1','a2');
  assert.equal(fifty.result,null);assert.equal(reduceChess(fifty,{type:'CLAIM_DRAW',color:'b'}).reason,'50-Züge-Regel');
  assert.equal(move(initialChess('4k3/8/8/8/8/8/8/R3K3 w Q - 149 1'),'a1','a2').reason,'75-Züge-Regel');
});
test('chess: standard perft positions and AI always produce legal moves',()=>{
  const chess=new Chess();
  const perft=(depth:number):number=>{if(!depth)return 1;let n=0;for(const m of chess.moves()){chess.move(m);n+=perft(depth-1);chess.undo();}return n;};
  assert.equal(perft(1),20);assert.equal(perft(2),400);assert.equal(perft(3),8902);
  for(const difficulty of ['easy','normal','hard']as const){const s=initialChess();assert.notEqual(reduceChess(s,chooseChessMove(s,difficulty)!),s);}
});

const board=():DraughtsBoard=>Array.from({length:8},()=>Array(8).fill(null));
test('draughts: maximum capture, mandatory continuation and backwards capture',()=>{
  const b=board();b[5][2]={player:'red',isKing:false};b[4][3]={player:'black',isKing:false};b[2][5]={player:'black',isKing:false};b[5][6]={player:'red',isKing:false};b[4][5]={player:'black',isKing:false};
  const s=initialDraughts(b);assert.ok(draughtsMoves(b,'red').every(m=>m.captures.length===2));
  assert.equal(applyDraughts(s,[[5,2],[3,4]]),s);
  const next=applyDraughts(s,[[5,2],[3,4],[1,6]]);assert.equal(next.turn,'black');assert.equal(next.board[4][3],null);assert.equal(next.board[2][5],null);
  const back=board();back[3][2]={player:'red',isKing:false};back[4][3]={player:'black',isKing:false};
  assert.deepEqual(draughtsMoves(back,'red')[0].path,[[3,2],[5,4]]);
});
test('draughts: flying kings and captured pieces block repeat jumps',()=>{
  const b=board();b[7][0]={player:'red',isKing:true};b[3][4]={player:'black',isKing:false};
  assert.deepEqual(draughtsMoves(b,'red').map(m=>m.path.at(-1)),[[2,5],[1,6],[0,7]]);
  const blocked=board();blocked[5][2]={player:'red',isKing:true};blocked[4][3]={player:'black',isKing:false};blocked[6][1]={player:'black',isKing:false};
  assert.ok(draughtsMoves(blocked,'red').every(m=>m.captures.length===1));
});
test('draughts: promotion is deferred until the capture sequence ends; blockade and draw detection',()=>{
  const b=board();b[2][1]={player:'red',isKing:false};b[1][2]={player:'black',isKing:false};b[1][4]={player:'black',isKing:false};
  const next=applyDraughts(initialDraughts(b),[[2,1],[0,3],[2,5]]);assert.equal(next.board[2][5]?.isKing,false);
  const promotion=board();promotion[1][2]={player:'red',isKing:false};promotion[6][1]={player:'black',isKing:false};
  assert.equal(applyDraughts(initialDraughts(promotion),[[1,2],[0,1]]).board[0][1]?.isKing,true);
  const immobile=board();immobile[0][1]={player:'red',isKing:false};immobile[7][0]={player:'black',isKing:true};
  assert.equal(initialDraughts(immobile).result,'black');
  const kings=board();kings[7][0]={player:'red',isKing:true};kings[0][1]={player:'black',isKing:true};
  const draw={...initialDraughts(kings),quietKings:29};assert.equal(applyDraughts(draw,[[7,0],[6,1]]).result,'draw');
  const s=initialDraughts();assert.notEqual(applyDraughts(s,(chooseDraughtsMove(s,'hard')as any).path),s);
});

test('Mahjong: shared legal pair, blocked/same-tile rejection, turn and score update',()=>{
  const s=initialMahjong(participants());const pair=findAvailablePairs(s.tiles)[0];assert.ok(pair);
  assert.equal(reduceMahjong(s,{type:'MATCH',first:pair[0].id,second:pair[0].id}),s);
  const blocked=s.tiles.find(t=>!isTileFree(t,s.tiles))!;
  assert.equal(reduceMahjong(s,{type:'MATCH',first:blocked.id,second:pair[1].id}),s);
  const next=reduceMahjong(s,{type:'MATCH',first:pair[0].id,second:pair[1].id},1000);
  assert.equal(next.players[0].score,100);assert.equal(next.activePlayerIndex,1);assert.equal(next.tiles.filter(t=>t.matched).length,2);
  assert.equal(reduceMahjong(next,{type:'UNDO'}),next);
  assert.equal(reduceMahjong(s,{type:'SHUFFLE'}),s);
});
test('Mahjong: solo undo restores both tiles and preserves tile inventory when shuffled',()=>{
  const s=initialMahjong(participants(1));const pair=findAvailablePairs(s.tiles)[0];
  const next=reduceMahjong(s,{type:'MATCH',first:pair[0].id,second:pair[1].id});
  const undo=reduceMahjong(next,{type:'UNDO'});assert.equal(undo.score,0);assert.ok(undo.tiles.every(t=>!t.matched));
  const shuffled=reduceMahjong(s,{type:'SHUFFLE'},1000,()=>0.25);
  assert.equal(shuffled.tiles.length,144);
  assert.deepEqual(shuffled.tiles.map(t=>t.definition.symbol).sort(),s.tiles.map(t=>t.definition.symbol).sort());
});
test('all Mahjong layouts contain 144 distinct slots and a complete legal 72-pair solution',()=>{
  for(const layout of ['turtle','pyramid','fortress']as const){
    let s=initialMahjong(participants(1),layout,1000);
    assert.equal(s.tiles.length,144);
    assert.equal(new Set(s.tiles.map(t=>`${t.x}:${t.y}:${t.layer}`)).size,144);
    for(let n=0;n<72;n++){
      const free=s.tiles.filter(t=>isTileFree(t,s.tiles)).sort((a,b)=>b.layer-a.layer||a.x-b.x||a.y-b.y);
      assert.ok(free.length>=2);
      const next=reduceMahjong(s,{type:'MATCH',first:free[0].id,second:free[1].id},2000+n*1000);
      assert.notEqual(next,s);s=next;
    }
    assert.equal(s.finished,true);assert.equal(s.players[0].matchedPairsCount,72);assert.equal(s.history.length,72);
  }
});

const settled=():CatanState=>{
  let s=initialCatan(participants(3).map(p=>({...p,isBot:true})),()=>0.4);
  let steps=0;
  while(s.gamePhase.startsWith('SETUP')&&steps++<20){const choice=chooseCatanMove(s)!;assert.ok(choice);const next=reduceCatan(s,choice.command,choice.actor,()=>0.4);assert.notEqual(next,s);s=next;}
  assert.equal(s.gamePhase,'ROLL');return s;
};
const command=(s:CatanState,cmd:CatanCommand,actor=s.players[s.activePlayerIndex].id,random=()=>0.4)=>reduceCatan(s,cmd,actor,random);
test('Catan: real 19/54/72 graph, snake setup and conserved finite bank',()=>{
  const s=settled();assert.equal(s.board.hexes.length,19);assert.equal(s.board.vertices.length,54);assert.equal(s.board.edges.length,72);
  assert.ok(s.players.every(p=>p.settlements.length===2&&p.roads.length===2&&p.victoryPoints===2));
  assert.equal(s.activePlayerIndex,0);
  for(const r of resources)assert.equal(s.bank[r]+s.players.reduce((n,p)=>n+p.resources[r],0),19);
  assert.equal(command(s,{type:'ROLL'},'p1'),s);
  assert.equal(command(s,{type:'END'}),s);
  const rolled=command(s,{type:'ROLL'});assert.equal(rolled.gamePhase,'MAIN_ACTION');assert.equal(command(rolled,{type:'ROLL'}),rolled);
});
test('Catan: seven requires the exact chosen discard, then robber movement and stealing',()=>{
  let s=settled();s.players.forEach(p=>p.resources={wood:0,brick:0,wool:0,wheat:0,ore:0});s.players[0].resources.wood=8;s.players[1].resources.brick=9;
  let n=0;s=command(s,{type:'ROLL'},'p0',()=>n++%2===0?0:0.99);assert.equal(s.lastDiceSum,7);assert.equal(s.gamePhase,'ROBBER_DISCARD');
  assert.equal(command(s,{type:'DISCARD',cards:{wood:3}}),s);
  s=command(s,{type:'DISCARD',cards:{brick:4}},'p1');s=command(s,{type:'DISCARD',cards:{wood:4}},'p0');assert.equal(s.gamePhase,'ROBBER_MOVE');
  assert.equal(command(s,{type:'ROBBER',hex:s.robberHexId}),s);
  const victim=s.players[1],hex=s.board.hexes.find(h=>h.vertexIds.some(v=>victim.settlements.includes(v))&&h.id!==s.robberHexId)!;
  s=command(s,{type:'ROBBER',hex:hex.id});assert.ok(s.robberVictims.includes(victim.id));
  const before=totalResources(s.players[0].resources);s=command(s,{type:'STEAL',victim:victim.id});assert.equal(totalResources(s.players[0].resources),before+1);assert.equal(s.gamePhase,'MAIN_ACTION');
});
test('Catan: trade requires explicit counterparty acceptance, and invalid/negative trades are rejected',()=>{
  let s=settled();s.gamePhase='MAIN_ACTION';s.players[0].resources.wood=5;s.players[1].resources.brick=3;
  assert.equal(command(s,{type:'TRADE',target:'p1',offer:{wood:-1},request:{brick:1}}),s);
  s=command(s,{type:'TRADE',target:'p1',offer:{wood:2},request:{brick:1}});
  assert.equal(s.players[0].resources.wood,5);assert.ok(s.pendingTrade);
  assert.equal(command(s,{type:'REPLY_TRADE',accept:true},'p2'),s);
  const before=s.players[0].resources.brick;s=command(s,{type:'REPLY_TRADE',accept:true},'p1');
  assert.equal(s.players[0].resources.wood,3);assert.equal(s.players[0].resources.brick,before+1);assert.equal(s.pendingTrade,null);
});
test('Catan: freshly bought development cards and a second card per turn cannot be played',()=>{
  let s=settled();s.gamePhase='MAIN_ACTION';s.players[0].resources={wood:4,brick:4,wool:4,wheat:4,ore:4};s.devCardDeck=['knight'];
  s=command(s,{type:'BUY_DEV'});assert.equal(s.players[0].devCards.knight,1);
  assert.equal(command(s,{type:'PLAY_DEV',card:'knight'}),s);
  s.bought={};s=command(s,{type:'PLAY_DEV',card:'knight'});assert.equal(s.players[0].playedKnights,1);assert.equal(s.gamePhase,'ROBBER_MOVE');
  s.gamePhase='MAIN_ACTION';s.players[0].devCards.roadBuilding=1;
  assert.equal(command(s,{type:'PLAY_DEV',card:'roadBuilding'}),s);
});
test('Catan: bank ratio and hidden hands are server-controlled',()=>{
  const s=settled();s.gamePhase='MAIN_ACTION';s.players[0].resources.wood=1;
  assert.equal(command(s,{type:'BANK',give:'wood',get:'brick'}),s);
  s.players[1].resources.ore=7;s.players[1].devCards.victoryPoint=1;s.players[1].victoryPoints++;
  const view=catanView(s,'p0');assert.equal(view.players[1].resources.ore,0);assert.equal(view.players[1].devCards.victoryPoint,0);
  assert.equal((view.players[1]as any).resourceTotal,totalResources(s.players[1].resources));assert.deepEqual(view.devCardDeck,[]);assert.deepEqual(view.players[0].resources,s.players[0].resources);
});
test('Catan: longest road follows edges without reusing one and is interrupted by an opposing building',()=>{
  const s=initialCatan(participants(3));const p=s.players[0];
  const hex=s.board.hexes[9];p.roads=[...hex.edgeIds];assert.equal(catanLongestRoad(s,p),6);
  const findPath=(v:number,path:string[],vertices:number[]):{path:string[];vertices:number[]}|null=>{
    if(path.length===6)return {path,vertices};
    for(const e of s.board.edges.filter(e=>e.v1===v||e.v2===v)){const next=e.v1===v?e.v2:e.v1;if(vertices.includes(next))continue;const found=findPath(next,[...path,e.id],[...vertices,next]);if(found)return found;}
    return null;
  };
  const route=findPath(0,[],[0])!;p.roads=route.path;assert.equal(catanLongestRoad(s,p),6);
  s.players[1].settlements=[route.vertices[3]];assert.equal(catanLongestRoad(s,p),3);
});
