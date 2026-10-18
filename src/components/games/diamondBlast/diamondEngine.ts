import type {BoardGrid,GemColor,LevelGoal,MatchGroup} from './types';
import {cloneBoard,createGem,findMatches,GEM_COLORS,hasValidMoves,isValidSwap,shuffleBoard} from './matchEngine';
type Point=[number,number];
const key=(r:number,c:number)=>`${r},${c}`;
const inside=(r:number,c:number)=>r>=0&&r<8&&c>=0&&c<8;
export interface DiamondResult {
  valid:boolean;board:BoardGrid;frames:BoardGrid[];score:number;collected:Record<GemColor,number>;
  cleared:{ice:number;rock:number;chain:number};created:number;combo:number;matches:number;detonations:number;shuffled:boolean;
}
const empty=(board:BoardGrid):DiamondResult=>({valid:false,board,frames:[],score:0,collected:{red:0,blue:0,green:0,yellow:0,purple:0,orange:0},cleared:{ice:0,rock:0,chain:0},created:0,combo:0,matches:0,detonations:0,shuffled:false});
/** Damage a tile at most once per wave, including special-chain reactions and all goal counts. */
export function clearDiamondWave(input:BoardGrid,hits:Set<string>,combo=1,groups:MatchGroup[]=[]):DiamondResult {
  const board=cloneBoard(input),out=empty(board);out.valid=true;
  const queue=[...hits],visited=new Set<string>(),damage=new Set<string>();
  const add=(r:number,c:number)=>{if(inside(r,c)&&!hits.has(key(r,c))){hits.add(key(r,c));queue.push(key(r,c));}};
  const area=(r:number,c:number,radius:number)=>{for(let y=r-radius;y<=r+radius;y++)for(let x=c-radius;x<=c+radius;x++)add(y,x);};
  for(let i=0;i<queue.length;i++){
    const at=queue[i];if(visited.has(at))continue;visited.add(at);
    const [r,c]=at.split(',').map(Number);if(!inside(r,c))continue;
    const g=board[r][c];if(!g)continue;
    if(g.obstacle==='rock'){damage.add(at);continue;}
    if(g.obstacle!=='none')damage.add(at);
    for(const [nr,nc]of [[r-1,c],[r+1,c],[r,c-1],[r,c+1]])if(inside(nr,nc)&&['rock','ice'].includes(board[nr][nc]?.obstacle||''))damage.add(key(nr,nc));
    if(g.special==='line-h')for(let x=0;x<8;x++)add(r,x);
    if(g.special==='line-v')for(let y=0;y<8;y++)add(y,c);
    if(g.special==='bomb'){area(r,c,1);out.detonations++;}
    if(g.special==='rainbow'){
      const color=[...GEM_COLORS].sort((a,b)=>board.flat().filter(g=>g?.color===b&&g.obstacle!=='rock').length-board.flat().filter(g=>g?.color===a&&g.obstacle!=='rock').length)[0];
      board.forEach((row,y)=>row.forEach((gem,x)=>{if(gem?.color===color)add(y,x);}));
    }
  }
  for(const at of damage){
    const [r,c]=at.split(',').map(Number),g=board[r][c];if(!g||g.obstacle==='none')continue;
    if(g.obstacle==='rock'){
      g.obstacleHealth--;if(g.obstacleHealth>0)continue;
      out.cleared.rock++;board[r][c]=null;out.score+=75;
    }else{out.cleared[g.obstacle]++;g.obstacle='none';out.score+=25;}
  }
  for(const at of hits){
    const [r,c]=at.split(',').map(Number);if(!inside(r,c))continue;
    const g=board[r][c];if(!g||g.obstacle==='rock')continue;
    out.collected[g.color]++;out.score+=100*Math.min(combo,8);board[r][c]=null;
  }
  for(const group of groups){const p=group.createsSpecial;if(p&&board[p.r][p.c]?.obstacle!=='rock'){board[p.r][p.c]=createGem(p.color,p.special);out.created++;}}
  out.matches=groups.length;out.combo=combo;return out;
}
/** Frozen/locked cells and rocks stay at their coordinates; gems fall only inside open segments. */
export function settleDiamondBoard(input:BoardGrid,random=Math.random,colors=GEM_COLORS):BoardGrid {
  const board=cloneBoard(input);
  for(let c=0;c<8;c++){
    let end=7;
    while(end>=0){
      if(board[end][c]&&board[end][c]!.obstacle!=='none'){end--;continue;}
      let start=end;while(start>=0&&(!board[start][c]||board[start][c]!.obstacle==='none'))start--;
      const gems=[];for(let r=end;r>start;r--)if(board[r][c])gems.push(board[r][c]!);
      let index=0;for(let r=end;r>start;r--)board[r][c]=gems[index++]||createGem(colors[Math.floor(random()*colors.length)]);
      end=start;
    }
  }
  return board;
}
export function advanceDiamondGoals(goals:LevelGoal[],result:DiamondResult):LevelGoal[] {
  return goals.map(g=>{
    const delta=g.type==='score'?result.score:g.type==='collect-color'?result.collected[g.color!]:g.type==='clear-ice'?result.cleared.ice:g.type==='destroy-rocks'?result.cleared.rock:result.cleared.chain;
    return {...g,current:Math.min(g.target,g.current+delta)};
  });
}
export function resolveDiamondMove(input:BoardGrid,from:Point,to:Point,random=Math.random,colors=GEM_COLORS):DiamondResult {
  const out=empty(input);if(!isValidSwap(...from,...to,input))return out;
  out.valid=true;let board=cloneBoard(input);
  const [r1,c1]=from,[r2,c2]=to,a=board[r1][c1]!,b=board[r2][c2]!;
  [board[r1][c1],board[r2][c2]]=[b,a];out.frames.push(cloneBoard(board));
  let specialHits:Set<string>|null=null;
  if(a.special==='rainbow'||b.special==='rainbow'||a.special!=='none'&&b.special!=='none'){
    specialHits=new Set([key(r1,c1),key(r2,c2)]);
    const rainbow=a.special==='rainbow'||b.special==='rainbow',bothRainbow=a.special==='rainbow'&&b.special==='rainbow';
    if(rainbow){const color=a.special==='rainbow'?b.color:a.color;board.forEach((row,r)=>row.forEach((g,c)=>{if(bothRainbow||g?.color===color)specialHits!.add(key(r,c));}));}
    else if(a.special==='bomb'&&b.special==='bomb'){for(let r=r2-2;r<=r2+2;r++)for(let c=c2-2;c<=c2+2;c++)if(inside(r,c))specialHits.add(key(r,c));}
    else if(a.special==='bomb'||b.special==='bomb'){for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(Math.abs(r-r2)<=1||Math.abs(c-c2)<=1)specialHits.add(key(r,c));}
    else {for(let i=0;i<8;i++){specialHits.add(key(r2,i));specialHits.add(key(i,c2));}}
    // A prism + a selected color has one precise effect; don't trigger a second random-color wipe.
    if(a.special==='rainbow')board[r2][c2]!.special='none';
    if(b.special==='rainbow')board[r1][c1]!.special='none';
  }
  for(let combo=1;combo<=80;combo++){
    const {matches,matchedIndices}=specialHits?{matches:[],matchedIndices:specialHits}:findMatches(board);
    specialHits=null;if(!matchedIndices.size)break;
    const wave=clearDiamondWave(board,new Set(matchedIndices),combo,matches);board=wave.board;
    out.score+=wave.score;out.created+=wave.created;out.matches+=wave.matches;out.detonations+=wave.detonations;out.combo=combo;
    for(const color of GEM_COLORS)out.collected[color]+=wave.collected[color];
    for(const type of ['ice','rock','chain'] as const)out.cleared[type]+=wave.cleared[type];
    out.frames.push(cloneBoard(board));board=settleDiamondBoard(board,random,colors);out.frames.push(cloneBoard(board));
  }
  if(findMatches(board).matches.length||!hasValidMoves(board)){board=shuffleBoard(board,random,colors);out.shuffled=true;out.frames.push(cloneBoard(board));}
  out.board=board;return out;
}
