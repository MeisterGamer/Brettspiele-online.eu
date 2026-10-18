import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getLevelConfig} from './levelGenerator';
import {createInitialBoard,createGem,findMatches,hasValidMoves,isValidSwap,findHintMove,shuffleBoard} from './matchEngine';
import {clearDiamondWave,settleDiamondBoard,advanceDiamondGoals,resolveDiamondMove} from './diamondEngine';
import {normalizeDiamondProgress,diamondLevelUnlocked,recordDiamondWin} from './progress';
import {seededRandom} from '../../../services/campaign';
import type {BoardGrid} from './types';
import {readFileSync} from 'node:fs';
const fresh=():BoardGrid=>Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>createGem(['red','blue','green','yellow','purple','orange'][(r*2+c)%6] as any)));
const fingerprint=(b:BoardGrid)=>b.map(row=>row.map(g=>g?[g.color,g.special,g.obstacle,g.obstacleHealth]:null));
test('50 unique repeatable levels: rising targets, non-increasing moves, no difficulty reset',()=>{
  const starts=new Set<string>(),layouts=new Set<string>();
  for(let id=1;id<=50;id++){
    const config=getLevelConfig(id),board=createInitialBoard(config);
    assert.deepEqual(fingerprint(board),fingerprint(createInitialBoard(config)));
    assert.equal(findMatches(board).matches.length,0);assert.ok(hasValidMoves(board));
    starts.add(JSON.stringify(fingerprint(board)));
    if(id>=8)layouts.add(JSON.stringify(config.obstacles));
    assert.equal(new Set(config.obstacles.map(o=>`${o.r},${o.c}`)).size,config.obstacles.length);
    if(id>1){const prev=getLevelConfig(id-1);assert.ok(config.targetScore>prev.targetScore);assert.ok(config.maxMoves<=prev.maxMoves);assert.ok(config.obstacles.length>=prev.obstacles.length);assert.ok(config.colors!.length>=prev.colors!.length);}
  }
  assert.equal(starts.size,50);assert.equal(layouts.size,43);
  assert.equal(getLevelConfig(51).levelNumber,50);assert.equal(getLevelConfig(NaN).levelNumber,1);
});
test('one campaign: no independent entry at 11,21,31,41, and no level 51 after final win',()=>{
  let progress=normalizeDiamondProgress({unlockedLevel:50,levelStars:{41:3,100:3}});
  assert.equal(progress.unlockedLevel,1);
  for(const id of [11,21,31,41,51])assert.equal(diamondLevelUnlocked(id,progress),false);
  for(let id=1;id<=50;id++){assert.ok(diamondLevelUnlocked(id,progress));progress=recordDiamondWin(progress,id,2,id*1000);assert.ok(progress.unlockedLevel<=50);}
  assert.equal(progress.unlockedLevel,50);assert.equal(Object.keys(progress.levelStars).length,50);assert.equal(diamondLevelUnlocked(51,progress),false);
  assert.deepEqual(normalizeDiamondProgress(JSON.parse(JSON.stringify(progress))),progress);
});
test('a rock interrupts runs and specials cannot bypass adjacency or obstacle locks',()=>{
  const b=fresh();b[0][0]=createGem('red');b[0][1]=createGem('red','none','rock',2);b[0][2]=createGem('red');
  assert.equal(findMatches(b).matches.length,0);
  b[0][0]!.special='rainbow';assert.equal(isValidSwap(0,0,0,1,b),false);assert.equal(isValidSwap(0,0,0,3,b),false);
  assert.equal(resolveDiamondMove(b,[0,0],[0,1]).valid,false);
});
test('one wave damages adjacent rocks once, counts matched ice and chains exactly once',()=>{
  const b=fresh();b[3][3]=createGem('red','none','rock',2);b[2][3]=createGem('blue','none','ice');b[3][2]=createGem('green','none','chain');
  const result=clearDiamondWave(b,new Set(['2,3','3,2','4,3','3,4']));
  assert.equal(result.board[3][3]?.obstacleHealth,1);assert.equal(result.cleared.rock,0);
  assert.equal(result.cleared.ice,1);assert.equal(result.cleared.chain,1);
  assert.equal(b[3][3]?.obstacleHealth,2);
  const broken=clearDiamondWave(result.board,new Set(['3,3']));assert.equal(broken.cleared.rock,1);
});
test('lasers trigger bombs, destroy obstacles, collect colors, and advance every matching goal',()=>{
  const b=fresh();b[4][1]=createGem('red','line-h');b[4][4]=createGem('blue','bomb');
  b[3][4]=createGem('green','none','rock',1);b[4][6]=createGem('yellow','none','chain');b[5][4]=createGem('purple','none','ice');
  const result=clearDiamondWave(b,new Set(['4,1']));
  assert.equal(result.detonations,1);assert.equal(result.cleared.rock,1);assert.equal(result.cleared.ice,1);assert.equal(result.cleared.chain,1);assert.ok(result.collected.yellow>0);
  const goals=advanceDiamondGoals([{type:'destroy-rocks',target:1,current:0,label:'rock'},{type:'collect-color',target:1,current:0,color:'yellow',label:'yellow'}],result);
  assert.ok(goals.every(g=>g.current===g.target));
});
test('gravity and shuffling preserve remaining obstacle coordinates and rock health',()=>{
  const b=fresh();b[4][0]=createGem('green','none','rock',2);b[2][1]=createGem('red','none','chain');b[1][2]=createGem('purple','none','ice');b[7][0]=null;b[7][1]=null;
  const next=settleDiamondBoard(b,seededRandom(1));
  assert.equal(next[4][0]?.obstacle,'rock');assert.equal(next[2][1]?.obstacle,'chain');assert.equal(next[1][2]?.obstacle,'ice');assert.ok(next.flat().every(Boolean));
  const shuffled=shuffleBoard(next,seededRandom(5));
  for(const [r,c]of [[4,0],[2,1],[1,2]]){assert.equal(shuffled[r][c]?.obstacle,next[r][c]?.obstacle);assert.equal(shuffled[r][c]?.obstacleHealth,next[r][c]?.obstacleHealth);}
  assert.ok(hasValidMoves(shuffled));assert.equal(findMatches(shuffled).matches.length,0);
});
test('every level resolves a series of legal turns to a full settled playable board',()=>{
  for(let id=1;id<=50;id++){
    const config=getLevelConfig(id),random=seededRandom(config.seed!);let board=createInitialBoard(config,random);
    for(let turn=0;turn<5;turn++){
      const hint=findHintMove(board)!;assert.ok(hint,`level ${id}`);
      const result=resolveDiamondMove(board,hint.from,hint.to,random,config.colors);
      assert.ok(result.valid);assert.ok(result.score>0);assert.ok(result.board.flat().every(Boolean));assert.equal(findMatches(result.board).matches.length,0);assert.ok(hasValidMoves(result.board));
      assert.ok(result.board.flat().every(g=>config.colors!.includes(g!.color)));board=result.board;
    }
  }
});

test('all 50 levels have a verified winning route inside their move budget',()=>{
  const solutions=JSON.parse(readFileSync(new URL('./fixtures/solutions.json',import.meta.url),'utf8')) as Record<string,[number,number,number,number][]>;
  assert.equal(Object.keys(solutions).length,50);
  for(let id=1;id<=50;id++){
    const config=getLevelConfig(id),random=seededRandom(config.seed!);let board=createInitialBoard(config,random),goals=config.goals;
    assert.ok(solutions[id].length<=config.maxMoves,`level ${id}: move limit`);
    for(const [r,c,nr,nc]of solutions[id]){
      const result=resolveDiamondMove(board,[r,c],[nr,nc],random,config.colors);
      assert.ok(result.valid,`level ${id}: legal move`);board=result.board;goals=advanceDiamondGoals(goals,result);
    }
    assert.ok(goals.every(g=>g.current>=g.target),`level ${id}: all goals completed`);
  }
});
