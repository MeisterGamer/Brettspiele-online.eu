import { Chess, type Color, type Square } from 'chess.js';
import type { Difficulty } from './gameAI';

export interface ChessState {
  initialFen: string; moves: string[]; fen: string; turn: Color; check: boolean;
  result: Color | 'draw' | null; reason: string; offer: Color | null; revision: number;
}
export type ChessCommand = { type:'MOVE'; from:string; to:string; promotion?:string } | { type:'RESIGN'|'OFFER_DRAW'|'ACCEPT_DRAW'|'CLAIM_DRAW'; color:Color };
export function chessPosition(state: ChessState) {
  const chess=new Chess(state.initialFen);
  for (const move of state.moves) chess.move(move);
  return chess;
}
function outcome(chess: Chess): Pick<ChessState,'result'|'reason'> {
  if (chess.isCheckmate()) return {result:chess.turn()==='w'?'b':'w',reason:'Schachmatt'};
  if (chess.isStalemate()) return {result:'draw',reason:'Patt'};
  if (chess.isInsufficientMaterial()) return {result:'draw',reason:'Unzureichendes Material'};
  if (Number(chess.fen().split(' ')[4])>=150) return {result:'draw',reason:'75-Züge-Regel'};
  const key=(fen:string)=>fen.split(' ').slice(0,4).join(' ');
  const history=chess.history({verbose:true});
  const repetitions=[history[0]?.before || chess.fen(),...history.map(m=>m.after)].filter(f=>key(f)===key(chess.fen())).length;
  if (repetitions>=5) return {result:'draw',reason:'Fünffache Stellungswiederholung'};
  return {result:null,reason:chess.isCheck()?'Schach':''};
}
export function initialChess(fen?:string):ChessState {
  const chess=new Chess(fen);
  return {initialFen:chess.fen(),moves:[],fen:chess.fen(),turn:chess.turn(),check:chess.isCheck(),...outcome(chess),offer:null,revision:0};
}
export function reduceChess(state:ChessState,command:ChessCommand):ChessState {
  if (state.result) return state;
  const chess=chessPosition(state);
  if (command.type==='MOVE') {
    if (!/^[a-h][1-8]$/.test(command.from)||!/^[a-h][1-8]$/.test(command.to)) return state;
    try {
      const move=chess.move({from:command.from,to:command.to,promotion:command.promotion});
      if (!move) return state;
      return {...state,moves:[...state.moves,move.san],fen:chess.fen(),turn:chess.turn(),check:chess.isCheck(),...outcome(chess),offer:null,revision:state.revision+1};
    } catch { return state; }
  }
  if (command.color!=='w' && command.color!=='b') return state;
  if (command.type==='RESIGN') return {...state,result:command.color==='w'?'b':'w',reason:'Aufgabe',revision:state.revision+1};
  if (command.type==='OFFER_DRAW') return {...state,offer:command.color,revision:state.revision+1};
  if (command.type==='ACCEPT_DRAW' && state.offer && state.offer!==command.color) return {...state,result:'draw',reason:'Remis vereinbart',revision:state.revision+1};
  if (command.type==='CLAIM_DRAW' && command.color===state.turn && (chess.isThreefoldRepetition() || chess.isDrawByFiftyMoves())) return {...state,result:'draw',reason:chess.isThreefoldRepetition()?'Dreifache Stellungswiederholung':'50-Züge-Regel',revision:state.revision+1};
  return state;
}
export function chooseChessMove(state:ChessState,difficulty:Difficulty):ChessCommand|null {
  if (state.result) return null;
  const chess=chessPosition(state), side=chess.turn();
  const legal=chess.moves({verbose:true}); if (!legal.length) return null;
  if (difficulty==='easy') { const m=legal[Math.floor(Math.random()*legal.length)]; return {type:'MOVE',from:m.from,to:m.to,promotion:m.promotion}; }
  const values={p:100,n:320,b:330,r:500,q:900,k:0};
  const evaluate=()=>chess.board().flat().reduce((sum,p)=> {
    if (!p) return sum;
    const file=p.square.charCodeAt(0)-97,rank=Number(p.square[1])-1;
    const position=p.type==='p' ? (p.color==='w'?rank:7-rank)*7 : p.type==='k'?0:(3.5-Math.abs(3.5-file)+3.5-Math.abs(3.5-rank))*4;
    return sum+(p.color===side?1:-1)*(values[p.type]+position);
  },0);
  let nodes=0;
  const search=(depth:number,alpha:number,beta:number):number=> {
    if (chess.isCheckmate()) return chess.turn()===side ? -100000-depth : 100000+depth;
    if (chess.isStalemate() || chess.isInsufficientMaterial()) return 0;
    if (!depth || ++nodes>6000) return evaluate();
    const maximizing=chess.turn()===side;
    let best=maximizing?-Infinity:Infinity;
    const moves=chess.moves({verbose:true}).sort((a,b)=>(b.captured?values[b.captured]:0)-(a.captured?values[a.captured]:0));
    for (const move of moves) {
      chess.move(move); const score=search(depth-1,alpha,beta); chess.undo();
      best=maximizing?Math.max(best,score):Math.min(best,score);
      if (maximizing) alpha=Math.max(alpha,best); else beta=Math.min(beta,best);
      if (alpha>=beta) break;
    }
    return best;
  };
  let best=legal[0],score=-Infinity;
  for (const move of legal) {
    chess.move(move); const candidate=search(difficulty==='hard'?2:1,-Infinity,Infinity); chess.undo();
    if (candidate>score) {best=move;score=candidate;}
  }
  return {type:'MOVE',from:best.from,to:best.to,promotion:best.promotion};
}
export const chessSquare=(r:number,c:number):Square=>`${String.fromCharCode(97+c)}${8-r}` as Square;
