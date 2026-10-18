import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseTicMove, ticResult, chooseConnectMove, chooseBattleshipShot, chooseBoxLine, shuffle, type ConnectCell } from './gameAI';
import { initialYatzy, reduceYatzy, yatzyScore, yatzyTotal, chooseYatzyCategory } from './yatzyEngine';

test('Tic-Tac-Toe takes a win before blocking and rejects finished boards', () => {
  assert.equal(chooseTicMove(['O','O',null,'X','X',null,null,null,null],'normal'),2);
  assert.equal(chooseTicMove(['X','X','X',null,'O',null,null,null,'O'],'hard'),null);
});
test('hard Tic-Tac-Toe never loses against any human move sequence', () => {
  let endings=0;
  const play=(board:(string|null)[]) => {
    const result=ticResult(board);
    if (result) { assert.notEqual(result,'X'); endings++; return; }
    for (let i=0;i<9;i++) if (!board[i]) {
      const next=[...board]; next[i]='X';
      if (ticResult(next)) { assert.notEqual(ticResult(next),'X'); endings++; continue; }
      const move=chooseTicMove(next,'hard'); assert.notEqual(move,null);
      next[move!]='O'; play(next);
    }
  };
  play(Array(9).fill(null)); assert.ok(endings>100);
});
test('Connect Four wins, blocks, and never selects a full column', () => {
  const grid=():ConnectCell[][]=>Array.from({length:6},()=>Array(7).fill(null));
  const win=grid(); win[5]=[2,2,2,null,1,1,null];
  assert.equal(chooseConnectMove(win,'hard'),3);
  const block=grid(); block[5]=[1,1,1,null,2,null,2];
  assert.equal(chooseConnectMove(block,'normal'),3);
  const full=grid(); full.forEach((row,r)=>row[3]=r%2 ? 1 : 2);
  assert.notEqual(chooseConnectMove(full,'hard'),3);
  assert.equal(chooseConnectMove(Array.from({length:6},()=>Array(7).fill(1)),'hard'),null);
});
test('battleship follows known hit direction without hidden fleet information', () => {
  const grid=Array.from({length:6},()=>Array(6).fill('empty'));
  grid[2][1]='miss'; grid[2][2]='hit'; grid[2][3]='hit';
  assert.deepEqual(chooseBattleshipShot(grid,'hard'),[2,4]);
  const [r,c]=chooseBattleshipShot(grid,'normal')!;
  assert.equal(grid[r][c],'empty');
});
test('Dots and Boxes captures available boxes and avoids a third edge', () => {
  const h=[[true],[true]],v=[[true,false]];
  assert.deepEqual(chooseBoxLine(h,v,'hard'),{type:'V',r:0,c:1,score:100});
  const safe=chooseBoxLine([[true,false],[false,false],[false,false]],[[true,false,false],[false,false,false]],'normal')!;
  assert.notDeepEqual([safe.type,safe.r,safe.c],['H',1,0]);
  assert.notDeepEqual([safe.type,safe.r,safe.c],['V',0,1]);
});
test('shuffle preserves every card and never mutates the deck', () => {
  const deck=[1,2,3,4,5];
  const result=shuffle(deck,()=>0);
  assert.deepEqual(deck,[1,2,3,4,5]);
  assert.deepEqual([...result].sort(),deck);
  assert.notDeepEqual(result,deck);
});
test('Yatzy respects holds, rotates scorecards and enforces three rolls', () => {
  let state=initialYatzy(2);
  assert.equal(reduceYatzy(state,{type:'SCORE',category:'chance'}),state);
  state=reduceYatzy(state,{type:'ROLL',dice:[6,6,2,3,4]});
  state=reduceYatzy(state,{type:'HOLD',index:0});
  state=reduceYatzy(state,{type:'ROLL',dice:[1,1,1,1,1]});
  assert.equal(state.dice[0],6);
  state=reduceYatzy(state,{type:'ROLL',dice:[2,2,2,2,2]});
  assert.equal(reduceYatzy(state,{type:'ROLL',dice:[5,5,5,5,5]}),state);
  state=reduceYatzy(state,{type:'SCORE',category:'chance'});
  assert.equal(state.cards[0].chance,14);
  assert.equal(state.cards[1].chance,undefined);
  assert.equal(state.active,1); assert.equal(state.rollsLeft,3);
});
test('Yatzy scoring includes upper bonus and bot finishes a complete multiplayer match', () => {
  assert.equal(yatzyScore([1,2,3,4,4],'smallStraight'),30);
  assert.equal(yatzyScore([2,2,3,3,3],'fullHouse'),25);
  assert.equal(yatzyTotal({ones:3,twos:6,threes:9,fours:12,fives:15,sixes:18}),98);
  let state=initialYatzy(4);
  for (let turn=0;turn<52;turn++) {
    state=reduceYatzy(state,{type:'ROLL',dice:[1,2,3,4,5]});
    state=reduceYatzy(state,{type:'SCORE',category:chooseYatzyCategory(state)});
  }
  assert.equal(state.finished,true);
  assert.ok(state.cards.every(card=>Object.keys(card).length===13));
});
