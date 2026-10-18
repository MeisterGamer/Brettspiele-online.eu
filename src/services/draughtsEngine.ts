import type { Difficulty } from './gameAI';
export type DraughtsColor='red'|'black';
export interface DraughtsPiece { player:DraughtsColor; isKing:boolean }
export type DraughtsBoard=(DraughtsPiece|null)[][];
export type Point=[number,number];
export interface DraughtsMove { path:Point[]; captures:Point[] }
export interface DraughtsState {
  board:DraughtsBoard;turn:DraughtsColor;result:DraughtsColor|'draw'|null;reason:string;revision:number;
  positions:Record<string,number>;quietKings:number;materialPly:number;endgames:{key:string;count:number}[];offer:DraughtsColor|null;
}
const directions=[[-1,-1],[-1,1],[1,-1],[1,1]];
const inside=(r:number,c:number)=>r>=0&&r<8&&c>=0&&c<8;
const same=(a:Point,b:Point)=>a[0]===b[0]&&a[1]===b[1];
const copy=(board:DraughtsBoard)=>board.map(row=>row.map(p=>p?{...p}:null));
const key=(board:DraughtsBoard,turn:DraughtsColor)=>turn+':'+board.flat().map(p=>p?(p.player==='red'?'r':'b')+(p.isKing?'K':'m'):'.').join('');

/** Brazilian draughts-64: flying kings, backward captures, maximum capture, crown at turn end. */
export function draughtsMoves(board:DraughtsBoard,turn:DraughtsColor):DraughtsMove[] {
  const captures:DraughtsMove[]=[],quiet:DraughtsMove[]=[];
  const walk=(grid:DraughtsBoard,at:Point,piece:DraughtsPiece,path:Point[],taken:Point[])=> {
    let continued=false;
    for (const [dr,dc] of directions) {
      let r=at[0]+dr,c=at[1]+dc;
      if (piece.isKing) while(inside(r,c)&&!grid[r][c]) {r+=dr;c+=dc;}
      if (!inside(r,c) || !grid[r][c] || grid[r][c]!.player===turn || taken.some(p=>same(p,[r,c]))) continue;
      const victim:Point=[r,c]; r+=dr;c+=dc;
      while(inside(r,c)&&!grid[r][c]) {
        continued=true;
        const next=copy(grid); next[at[0]][at[1]]=null; next[r][c]={...piece};
        // Captured pieces block the board until the whole sequence is complete.
        walk(next,[r,c],piece,[...path,[r,c]],[...taken,victim]);
        if (!piece.isKing) break;
        r+=dr;c+=dc;
      }
    }
    if (!continued&&taken.length) captures.push({path,captures:taken});
  };
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) {
    const piece=board[r][c]; if(!piece||piece.player!==turn) continue;
    walk(board,[r,c],piece,[[r,c]],[]);
    for(const [dr,dc] of directions) {
      if(!piece.isKing&&dr!==(turn==='red'?-1:1)) continue;
      let tr=r+dr,tc=c+dc;
      while(inside(tr,tc)&&!board[tr][tc]) {
        quiet.push({path:[[r,c],[tr,tc]],captures:[]});
        if(!piece.isKing) break;
        tr+=dr;tc+=dc;
      }
    }
  }
  if(!captures.length) return quiet;
  const maximum=Math.max(...captures.map(m=>m.captures.length));
  return captures.filter(m=>m.captures.length===maximum);
}
export function initialDraughts(board?:DraughtsBoard,turn:DraughtsColor='red'):DraughtsState {
  const initial=board?copy(board):Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>(r+c)%2&& (r<3||r>4)?{player:r<3?'black' as const:'red' as const,isKing:false}:null));
  return {board:initial,turn,result:draughtsMoves(initial,turn).length?null:turn==='red'?'black':'red',reason:'',revision:0,positions:{[key(initial,turn)]:1},quietKings:0,materialPly:0,endgames:[{key:'',count:0},{key:'',count:0}],offer:null};
}
export function applyDraughts(state:DraughtsState,path:Point[]):DraughtsState {
  if(state.result||!Array.isArray(path)||path.length>13||!path.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isInteger))) return state;
  const move=draughtsMoves(state.board,state.turn).find(m=>m.path.length===path.length&&m.path.every((p,i)=>same(p,path[i])));
  if(!move) return state;
  const board=copy(state.board),from=move.path[0],to=move.path.at(-1)!;
  const piece={...board[from[0]][from[1]]!};
  board[from[0]][from[1]]=null;
  for(const [r,c] of move.captures) board[r][c]=null;
  const promoted=!piece.isKing&&to[0]===(piece.player==='red'?0:7);
  const wasKing=piece.isKing;
  piece.isKing ||= promoted;
  board[to[0]][to[1]]=piece;
  const turn=state.turn==='red'?'black':'red';
  const position=key(board,turn),positions={...state.positions,[position]:(state.positions[position]||0)+1};
  const quietKings=wasKing&&!move.captures.length?state.quietKings+1:0;
  const materialPly=move.captures.length||promoted?0:state.materialPly+1;
  const colors:DraughtsColor[]=['red','black'];
  const endgames=colors.map((color,index)=> {
    const own: {p:DraughtsPiece;r:number;c:number}[]=[],enemy:typeof own=[];
    board.forEach((row,r)=>row.forEach((p,c)=>{if(p)(p.player===color?own:enemy).push({p,r,c});}));
    let limit=0;
    if(enemy.length===1&&enemy[0].p.isKing&&own.some(x=>x.p.isKing)) {
      if(own.length<=2||(own.length===3&&enemy[0].r+enemy[0].c===7)) limit=5;
      else if(own.length>=3&&own.every(x=>x.p.isKing)) limit=15;
    }
    const signature=limit?`${own.length}:${own.filter(x=>x.p.isKing).length}:${limit}`:'';
    const previous=state.endgames[index];
    const count=signature&&signature===previous.key?previous.count+(state.turn===color?1:0):0;
    return {key:signature,count};
  });
  let result:DraughtsState['result']=null,reason='';
  if(!draughtsMoves(board,turn).length) {result=state.turn;reason='Keine legalen Züge';}
  else if(positions[position]>=3) {result='draw';reason='Dreifache Stellungswiederholung';}
  else if(quietKings>=30) {result='draw';reason='15 Züge nur mit Damen ohne Schlag';}
  else if(endgames.some(e=>e.key&&e.count>=Number(e.key.split(':')[2]))) {result='draw';reason='Endspiel-Remisregel';}
  else {
    const pieces=board.flat().filter(Boolean),bothKings=colors.every(color=>pieces.some(p=>p!.player===color&&p!.isKing));
    if(bothKings&&((pieces.length<=5&&materialPly>=60)||(pieces.length<=7&&materialPly>=120))) {result='draw';reason='Unverändertes Endspielmaterial';}
  }
  return {...state,board,turn,result,reason,positions,quietKings,materialPly,endgames,offer:null,revision:state.revision+1};
}
export type DraughtsCommand={type:'MOVE';path:Point[]}|{type:'RESIGN'|'OFFER_DRAW'|'ACCEPT_DRAW';color:DraughtsColor};
export function reduceDraughts(state:DraughtsState,command:DraughtsCommand):DraughtsState {
  if(state.result) return state;
  if(command.type==='MOVE') return applyDraughts(state,command.path);
  if(!['red','black'].includes(command.color)) return state;
  if(command.type==='RESIGN') return {...state,result:command.color==='red'?'black':'red',reason:'Aufgabe',revision:state.revision+1};
  if(command.type==='OFFER_DRAW') return {...state,offer:command.color,revision:state.revision+1};
  if(command.type==='ACCEPT_DRAW'&&state.offer&&state.offer!==command.color) return {...state,result:'draw',reason:'Remis vereinbart',revision:state.revision+1};
  return state;
}
export function chooseDraughtsMove(state:DraughtsState,difficulty:Difficulty):DraughtsCommand|null {
  const moves=draughtsMoves(state.board,state.turn);if(!moves.length||state.result)return null;
  if(difficulty==='easy')return {type:'MOVE',path:moves[Math.floor(Math.random()*moves.length)].path};
  const side=state.turn; let nodes=0;
  const evaluate=(s:DraughtsState)=>s.board.reduce((sum,row,r)=>sum+row.reduce((n,p,c)=>n+(p?(p.player===side?1:-1)*((p.isKing?350:100)+(p.isKing?0:(p.player==='red'?7-r:r)*5)+(3.5-Math.abs(3.5-c))*2):0),0),0);
  const search=(s:DraughtsState,depth:number,alpha:number,beta:number):number=>{
    if(s.result)return s.result==='draw'?0:s.result===side?10000+depth:-10000-depth;
    if(!depth||++nodes>3000)return evaluate(s);
    const max=s.turn===side;let best=max?-Infinity:Infinity;
    for(const move of draughtsMoves(s.board,s.turn)){
      const score=search(applyDraughts(s,move.path),depth-1,alpha,beta);
      best=max?Math.max(best,score):Math.min(best,score);
      if(max)alpha=Math.max(alpha,best);else beta=Math.min(beta,best);
      if(alpha>=beta)break;
    }
    return best;
  };
  let best=moves[0],score=-Infinity;
  for(const move of moves){const value=search(applyDraughts(state,move.path),difficulty==='hard'?3:1,-Infinity,Infinity);if(value>score){best=move;score=value;}}
  return {type:'MOVE',path:best.path};
}
