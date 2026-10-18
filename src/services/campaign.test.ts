import {test} from 'node:test';
import assert from 'node:assert/strict';
import {campaignLevel,levelUnlocked} from './campaign';
import {mahjongLevelBoard,mahjongLevelConfig} from './mahjongCampaign';
import {isTileFree,canTilesMatch} from '../components/games/mahjong/mahjongData';
import {getLevelConfig} from '../components/games/diamondBlast/levelGenerator';
import {createInitialBoard,hasValidMoves,findMatches} from '../components/games/diamondBlast/matchEngine';
import {initialMahjong,reduceMahjong} from './mahjongEngine';
import {initialUserProfile} from '../data/mockData';
test('campaign: five independent difficulty stages, ten levels each',()=>{
  for(let tier=0;tier<5;tier++){
    assert.equal(levelUnlocked(tier*10+1,{}),true);
    assert.equal(levelUnlocked(tier*10+2,{}),false);
    assert.equal(levelUnlocked(tier*10+2,{[tier*10+1]:1}),true);
    assert.equal(campaignLevel(tier*10+10).tier,tier);
    assert.equal(campaignLevel(tier*10+10).stage,10);
  }
});
test('all 50 Mahjong levels are deterministic and have a complete legal solution',()=>{
  const fingerprints=new Set<string>();
  for(let id=1;id<=50;id++){
    const config=mahjongLevelConfig(id),tiles=mahjongLevelBoard(id);
    assert.equal(tiles.length,config.tileCount);
    assert.deepEqual(tiles,mahjongLevelBoard(id));
    fingerprints.add(JSON.stringify(tiles.map(t=>[t.x,t.y,t.layer,t.definition])));
    let removed=0;
    while(removed<tiles.length){
      const free=tiles.filter(t=>!t.matched&&isTileFree(t,tiles)).sort((a,b)=>b.layer-a.layer||a.x-b.x||a.y-b.y);
      assert.ok(free.length>=2,`level ${id}: inaccessible remainder`);
      assert.ok(canTilesMatch(free[0].definition,free[1].definition),`level ${id}: solution pair`);
      free[0].matched=true;free[1].matched=true;removed+=2;
    }
  }
  assert.equal(fingerprints.size,50);
});
test('Mahjong campaign enforces help budgets and disallows undo',()=>{
  const players=[{id:'p',name:'P',avatar:initialUserProfile.avatar,isHost:true,isReady:true,score:0,ping:0}];
  let easy=initialMahjong(players,'turtle',0,1);
  for(let i=0;i<8;i++)easy=reduceMahjong(easy,{type:'HINT'},1);
  assert.equal(easy.hintsUsed,8);assert.equal(reduceMahjong(easy,{type:'HINT'},1),easy);
  const hard=initialMahjong(players,'turtle',0,41);
  assert.equal(reduceMahjong(hard,{type:'HINT'}),hard);
  assert.equal(reduceMahjong(hard,{type:'SHUFFLE'}),hard);
  assert.equal(reduceMahjong(hard,{type:'UNDO'}),hard);
});
test('all 50 Diamond Blast levels have playable starts and exact obstacle goals',()=>{
  const fingerprints=new Set<string>();
  const goalTypes={ice:'clear-ice',rock:'destroy-rocks',chain:'unlock-chains'};
  for(let id=1;id<=50;id++){
    const config=getLevelConfig(id);fingerprints.add(JSON.stringify(config));
    assert.ok(config.maxMoves>=20);
    assert.equal(new Set(config.obstacles.map(o=>`${o.r},${o.c}`)).size,config.obstacles.length);
    for(const [type,goal]of Object.entries(goalTypes))assert.equal(config.goals.find(g=>g.type===goal)?.target||0,config.obstacles.filter(o=>o.type===type).length);
    for(let trial=0;trial<3;trial++){
      const board=createInitialBoard(config);
      assert.ok(hasValidMoves(board));assert.equal(findMatches(board).matches.length,0);
      assert.equal(board.flat().filter(g=>g?.obstacle&&g.obstacle!=='none').length,config.obstacles.length);
    }
  }
  assert.equal(fingerprints.size,50);
  assert.ok(getLevelConfig(41).maxMoves<getLevelConfig(1).maxMoves);
  assert.ok(getLevelConfig(50).targetScore>getLevelConfig(40).targetScore);
});
