import {AtelierPiece} from './AtelierPiece';
import {boardAsset} from '../../services/gameAssets';
import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Trophy, Bot, Users, Wifi } from 'lucide-react';
import { Chess } from 'chess.js';
import { useAIDifficulty } from './GameArena';
import { useGameTimers } from './useGameTimers';
import { useAuthoritativeGame } from './useAuthoritativeGame';
import { initialChess, chessPosition, chessSquare, reduceChess, chooseChessMove, type ChessCommand } from '../../services/chessEngine';
import { multiplayerService } from '../../services/multiplayerService';
import { sound } from '../../services/sound';
import { TABLE_BACKGROUNDS } from '../../services/gameImages';
import { AvatarDisplay } from '../avatar/AvatarDisplay';
import type { RoomParticipant } from '../../types';
type PieceType='p'|'r'|'n'|'b'|'q'|'k';
type PieceColor='w'|'b';
interface ChessPiece {type:PieceType;color:PieceColor}
interface ChessGameProps {
  onGameEnd?:(winner:string)=>void;tableParticipants?:RoomParticipant[];currentUserId?:string;
  onActiveTurnChange?:(id:string)=>void;roomCode?:string;isHost?:boolean;
}
export const ChessGame:React.FC<ChessGameProps>=({onGameEnd,tableParticipants,currentUserId,onActiveTurnChange,roomCode})=>{
  const difficulty=useAIDifficulty(),{schedule,cancelAll}=useGameTimers();
  const game=useAuthoritativeGame({roomCode,userId:currentUserId,engine:'chess',initial:()=>initialChess(),reduce:reduceChess});
  const {state,send}=game;
  const participants:RoomParticipant[]=(state as any).participants||tableParticipants||[];
  const p1=participants[0],p2=participants[1],p1Name=p1?.name||'Weiß',p2Name=p2?.name||'Schach-KI';
  const isOnlineMultiplayer=Boolean(roomCode);
  const myColor:PieceColor|null=currentUserId===p1?.id?'w':currentUserId===p2?.id?'b':null;
  const [localMode,setLocalMode]=useState<'bot'|'local2p'>(p2&&!p2.isBot?'local2p':'bot');
  const mode=isOnlineMultiplayer?'online':localMode;
  const setMode=(value:'bot'|'local2p')=>setLocalMode(value);
  const [selectedPos,setSelectedPos]=useState<[number,number]|null>(null);
  const [promotion,setPromotion]=useState<{from:string;to:string}|null>(null);
  const chess=chessPosition(state),board=chess.board(),turn=state.turn;
  const winner=state.result==='draw'?'Unentschieden':state.result==='w'?p1Name:state.result==='b'?p2Name:null;
  const moves=selectedPos?chess.moves({square:chessSquare(...selectedPos),verbose:true}):[];
  const validMoves:[number,number][]=moves.map(m=>[8-Number(m.to[1]),m.to.charCodeAt(0)-97]);
  const canPlay=game.ready&&!game.pending&&!state.result&&(isOnlineMultiplayer?myColor===turn:mode==='local2p'||turn==='w');
  const reported=useRef(false);
  useEffect(()=>{onActiveTurnChange?.(turn==='w'?p1?.id||'p1':p2?.id||'p2');},[turn,p1?.id,p2?.id,onActiveTurnChange]);
  useEffect(()=>{
    setSelectedPos(null);setPromotion(null);
    if(state.moves.length)sound.playPieceDrop();
    if(state.result&&!reported.current){reported.current=true;onGameEnd?.(state.result==='draw'?'draw':state.result===(myColor||'w')?'player':'opponent');}
  },[state.revision,state.result]);
  useEffect(()=>{
    if(isOnlineMultiplayer||mode!=='bot'||turn!=='b'||state.result)return;
    const timer=schedule(()=>{const command=chooseChessMove(state,difficulty);if(command)send(command);},450);
    return ()=>clearTimeout(timer);
  },[state,mode,difficulty,isOnlineMultiplayer]);
  const handleSquareClick=(r:number,c:number)=>{
    if(!canPlay||promotion)return;
    const to=chessSquare(r,c);
    if(selectedPos){
      const from=chessSquare(...selectedPos),legal=moves.filter(m=>m.to===to);
      if(legal.length){
        if(legal.some(m=>m.promotion))setPromotion({from,to});
        else send({type:'MOVE',from,to});
        setSelectedPos(null);return;
      }
    }
    setSelectedPos(board[r][c]?.color===turn?[r,c]:null);
  };
  const resetGame=()=>{
    cancelAll();setSelectedPos(null);setPromotion(null);reported.current=false;
    if(roomCode)multiplayerService.startRound(roomCode);else game.resetLocal();
  };
  const drawColor=isOnlineMultiplayer?myColor:turn;
  if(!game.ready)return <p role="status">Schachstellung wird geladen …</p>;
  const renderStauntonPiece=(piece:ChessPiece)=><AtelierPiece kind={`chess-${piece.color}-${piece.type}`} label={`${piece.color==='w'?'Weiße':'Schwarze'} Figur: ${{p:'Bauer',r:'Turm',n:'Springer',b:'Läufer',q:'Dame',k:'König'}[piece.type]}`} className="w-[90%] h-[90%] object-contain pointer-events-none drop-shadow-md"/>;
  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none text-slate-100">
      
      {/* Header bar with player avatars and turn indicators */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3 sm:p-3.5 rounded-2xl mb-3 text-xs shadow-xl">
        <div className={`flex items-center gap-2 p-1 rounded-xl transition ${turn === 'w' && !winner ? 'bg-amber-950/40 ring-1 ring-amber-400/60' : ''}`}>
          {p1?.avatar ? (
            <AvatarDisplay avatar={p1.avatar} size="sm" />
          ) : (
            <span className="w-4 h-4 rounded-full bg-amber-100 border border-amber-300 shadow" />
          )}
          <div>
            <div className="font-bold text-slate-200 flex items-center gap-1">
              <span>{p1Name}</span>
              <span className="w-2 h-2 rounded-full bg-amber-100 inline-block" />
            </div>
            <div className="text-[11px] text-amber-300">{turn === 'w' ? '● Am Zug' : 'Wartet'}</div>
          </div>
        </div>

        {isOnlineMultiplayer ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-black">
            <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>LIVE-SCHACH ({myColor ? `Du bist ${myColor === 'w' ? 'Weiß' : 'Schwarz'}` : 'Zuschauer'})</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => { setMode('bot'); resetGame(); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                mode === 'bot' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              <Bot className="w-3.5 h-3.5" /> vs. Schach-KI
            </button>
            <button
              onClick={() => { setMode('local2p'); resetGame(); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                mode === 'local2p' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> 2P Duell
            </button>
          </div>
        )}

        <div className={`flex items-center gap-2 p-1 rounded-xl transition ${turn === 'b' && !winner ? 'bg-slate-800/80 ring-1 ring-slate-400/60' : ''}`}>
          <div className="text-right">
            <div className="font-bold text-slate-200 flex items-center gap-1 justify-end">
              <span className="w-2 h-2 rounded-full bg-slate-800 inline-block border border-slate-600" />
              <span>{p2Name}</span>
            </div>
            <div className="text-[11px] text-slate-400">{turn === 'b' ? '● Am Zug' : 'Wartet'}</div>
          </div>
          {p2?.avatar ? (
            <AvatarDisplay avatar={p2.avatar} size="sm" />
          ) : (
            <span className="w-4 h-4 rounded-full bg-slate-900 border border-slate-600 shadow" />
          )}
        </div>

        <button
          onClick={resetGame}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          title="Brett zurücksetzen"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <p role="status" className="text-sm mb-3 text-amber-200">{game.pending?'Zug wird bestätigt …':state.reason||`${turn==='w'?'Weiß':'Schwarz'} am Zug`}</p>
      {game.error&&<p role="alert" className="text-rose-300 mb-3">{game.error}</p>}
      {promotion&&<div role="dialog" aria-label="Bauernumwandlung" className="mb-3 p-3 border border-amber-400 rounded-xl"><p>In welche Figur umwandeln?</p><div className="flex flex-wrap gap-2">{(['q','r','b','n'] as const).map((piece,index)=><button key={piece} className="bg-slate-800 p-3 rounded-xl" onClick={()=>{send({type:'MOVE',...promotion,promotion:piece});setPromotion(null);}}>{['Dame','Turm','Läufer','Springer'][index]}</button>)}</div></div>}
      {/* 8x8 REAL INLAID WOODEN CHESSBOARD */}
      <div className="relative rounded-3xl p-3 sm:p-5 border-4 border-amber-950 shadow-2xl max-w-md w-full overflow-hidden bg-amber-950">
        
        {/* Real Wood Grain Background Photo Inlay */}
        <img
          src={TABLE_BACKGROUNDS.mahogany}
          alt="Wood Texture"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover "
        />

        <div style={{backgroundImage:`url(${boardAsset('chess')})`,backgroundSize:'100% 100%'}} className="relative z-10 grid grid-cols-8 rounded-2xl overflow-hidden border-2 border-amber-900/90 shadow-2xl bg-amber-950">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isDark = (r + c) % 2 === 1;
              const isSelected = selectedPos?.[0] === r && selectedPos?.[1] === c;
              const isValid = validMoves.some(([mr, mc]) => mr === r && mc === c);

              return (
                <div
                  key={`${r}-${c}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Feld ${String.fromCharCode(97 + c)}${8 - r}`}
                  onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleSquareClick(r,c); } }}
                  onClick={() => handleSquareClick(r, c)}
                  className={`aspect-square flex items-center justify-center relative cursor-pointer transition-colors ${
                    isDark
                      ? 'hover:bg-white/10'
                      : 'hover:bg-black/10'
                  } ${isSelected ? 'ring-2 ring-amber-400 z-10' : ''}`}
                >
                  {/* Destination hint indicator */}
                  {isValid && (
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-400/90 animate-ping z-20 shadow-md ring-2 ring-white" />
                  )}

                  {/* Staunton Chess Figure */}
                  {cell && renderStauntonPiece(cell)}
                </div>
              );
            })
          )}
        </div>
      </div>

      {!state.result&&drawColor&&<div className="flex flex-wrap gap-2 mt-3 text-xs">
        <button className="bg-slate-800 rounded-xl px-3 py-2" onClick={()=>send({type:'RESIGN',color:drawColor})}>Aufgeben</button>
        {state.offer&&state.offer!==drawColor?<button className="bg-slate-800 rounded-xl px-3 py-2" onClick={()=>send({type:'ACCEPT_DRAW',color:drawColor})}>Remis annehmen</button>:<button className="bg-slate-800 rounded-xl px-3 py-2" onClick={()=>send({type:'OFFER_DRAW',color:drawColor})}>Remis anbieten</button>}
        {(chess.isThreefoldRepetition()||chess.isDrawByFiftyMoves())&&<button className="bg-slate-800 rounded-xl px-3 py-2" onClick={()=>send({type:'CLAIM_DRAW',color:drawColor})}>Remis beanspruchen</button>}
      </div>}
      <details className="w-full mt-3 text-xs"><summary>Zugliste ({state.moves.length})</summary><p className="break-words p-2">{state.moves.map((move,index)=>`${index%2===0?`${Math.floor(index/2)+1}. `:''}${move}`).join(' ')||'Noch keine Züge.'}</p></details>
      {/* Winner Banner */}
      {winner && (
        <div className="mt-3 bg-amber-500/20 border border-amber-500/40 text-amber-300 px-4 py-2 rounded-2xl font-bold flex items-center gap-2 animate-bounce">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>{state.result==='draw'?`Remis: ${state.reason}`:`${state.reason}: ${winner} gewinnt!`}</span>
        </div>
      )}
    </div>
  );
};
