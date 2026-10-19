import {BoardSurface} from './BoardSurface';
import {AtelierPiece} from './AtelierPiece';
import {boardAsset} from '../../services/gameAssets';
import React,{useEffect,useRef,useState} from 'react';
import {RefreshCw,Trophy,Bot,Users,Crown,Wifi} from 'lucide-react';
import {useAIDifficulty} from './GameArena';
import {useGameTimers} from './useGameTimers';
import {useAuthoritativeGame} from './useAuthoritativeGame';
import {initialDraughts,reduceDraughts,draughtsMoves,chooseDraughtsMove,type Point} from '../../services/draughtsEngine';
import {multiplayerService} from '../../services/multiplayerService';
import {sound} from '../../services/sound';
import {TABLE_BACKGROUNDS} from '../../services/gameImages';
import {AvatarDisplay} from '../avatar/AvatarDisplay';
import type {RoomParticipant} from '../../types';
interface CheckersGameProps{onGameEnd?:(winner:string)=>void;tableParticipants?:RoomParticipant[];currentUserId?:string;onActiveTurnChange?:(id:string)=>void;roomCode?:string;isHost?:boolean}
export const CheckersGame:React.FC<CheckersGameProps>=({onGameEnd,tableParticipants,currentUserId,onActiveTurnChange,roomCode})=>{
  const difficulty=useAIDifficulty(),{schedule,cancelAll}=useGameTimers();
  const game=useAuthoritativeGame({roomCode,userId:currentUserId,engine:'checkers',initial:()=>initialDraughts(),reduce:reduceDraughts});
  const {state,send}=game;
  const participants:RoomParticipant[]=(state as any).participants||tableParticipants||[];
  const p1=participants[0],p2=participants[1],p1Name=p1?.name||'Rot',p2Name=p2?.name||'Dame-KI';
  const isOnlineMultiplayer=Boolean(roomCode),myPlayer=currentUserId===p1?.id?'red':currentUserId===p2?.id?'black':null;
  const [localMode,setMode]=useState<'bot'|'local2p'>(p2&&!p2.isBot?'local2p':'bot');
  const mode=isOnlineMultiplayer?'online':localMode;
  const [path,setPath]=useState<Point[]>([]);
  const legal=draughtsMoves(state.board,state.turn);
  const matching=legal.filter(move=>path.every((p,i)=>move.path[i]?.[0]===p[0]&&move.path[i]?.[1]===p[1]));
  const selectedPos=path.at(-1)||null;
  const validMoves:Point[]=path.length?matching.map(m=>m.path[path.length]).filter(Boolean):[];
  const board=state.board.map(row=>row.map(p=>p?{...p}:null));
  if(path.length>1){const piece=board[path[0][0]][path[0][1]];board[path[0][0]][path[0][1]]=null;board[path.at(-1)![0]][path.at(-1)![1]]=piece;}
  const turn=state.turn,winner=state.result==='draw'?'Unentschieden':state.result==='red'?p1Name:state.result==='black'?p2Name:null;
  const canPlay=game.ready&&!game.pending&&!state.result&&(isOnlineMultiplayer?myPlayer===turn:mode==='local2p'||turn==='red');
  const reported=useRef(false);
  useEffect(()=>{onActiveTurnChange?.(turn==='red'?p1?.id||'p1':p2?.id||'p2');},[turn,p1?.id,p2?.id,onActiveTurnChange]);
  useEffect(()=>{setPath([]);if(state.revision)sound.playPieceDrop();if(state.result&&!reported.current){reported.current=true;onGameEnd?.(state.result==='draw'?'draw':state.result===(myPlayer||'red')?'player':'opponent');}},[state.revision,state.result]);
  useEffect(()=>{if(isOnlineMultiplayer||mode!=='bot'||turn!=='black'||state.result)return;const timer=schedule(()=>{const command=chooseDraughtsMove(state,difficulty);if(command)send(command);},450);return()=>clearTimeout(timer);},[state,mode,difficulty,isOnlineMultiplayer]);
  const handleCellClick=(r:number,c:number)=>{
    if(!canPlay)return;
    if(path.length&&validMoves.some(p=>p[0]===r&&p[1]===c)){
      const next:Point[]=[...path,[r,c]];
      const complete=matching.find(m=>m.path.length===next.length&&m.path.every((p,i)=>p[0]===next[i][0]&&p[1]===next[i][1]));
      if(complete){send({type:'MOVE',path:complete.path});setPath([]);}else setPath(next);
      return;
    }
    if(path.length<=1&&legal.some(m=>m.path[0][0]===r&&m.path[0][1]===c))setPath([[r,c]]);
  };
  const resetGame=()=>{cancelAll();setPath([]);reported.current=false;if(roomCode)multiplayerService.startRound(roomCode);else game.resetLocal();};
  if(!game.ready)return <p role="status">Dame-Spielstand wird geladen …</p>;
  // Piece counts
  let redPieces = 0;
  let blackPieces = 0;
  board.forEach((r) => r.forEach((p) => {
    if (p?.player === 'red') redPieces++;
    if (p?.player === 'black') blackPieces++;
  }));

  return (
    <div className="flex flex-col items-center max-w-6xl mx-auto w-full select-none text-slate-100">
      
      <p className="text-xs text-slate-400 mb-2">Dame 8×8 · Brasilianisch · Lange Damen · Maximale Schlagpflicht</p>
      {game.error&&<p role="alert" className="text-rose-300 mb-2">{game.error}</p>}
      {path.length>1&&<p role="status" className="text-amber-300 mb-2 text-sm">Schlagfolge fortsetzen: dieselbe Figur muss weiterschlagen.</p>}
      <p role="status" className="text-xs text-amber-200 mb-2">{game.pending?'Zug wird bestätigt …':state.reason|| (legal[0]?.captures.length?`Schlagpflicht: ${legal[0].captures.length} Steine schlagen`:'')}</p>
      {/* Header bar with realistic player badges, avatars and piece count */}
      <div className="w-full mobile-game-header flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 p-3 sm:p-3.5 rounded-2xl mb-3 text-xs shadow-xl">
        <div className={`flex items-center gap-2 p-1 rounded-xl transition ${turn === 'red' && !winner ? 'bg-rose-950/40 ring-1 ring-rose-500/50' : ''}`}>
          {p1?.avatar ? (
            <AvatarDisplay avatar={p1.avatar} size="sm" />
          ) : (
            <div
              className="w-5 h-5 rounded-full border border-red-300 shadow"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #ff4b72, #b91c1c)',
              }}
            />
          )}
          <div>
            <div className="font-bold text-slate-200 flex items-center gap-1">
              <span>{p1Name}</span>
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            </div>
            <div className="text-[11px] text-rose-400 font-mono">Steine: {redPieces}</div>
          </div>
        </div>

        {isOnlineMultiplayer ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-black">
            <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>LIVE-DAME ({myPlayer ? `Du bist ${myPlayer === 'red' ? 'Rot' : 'Schwarz'}` : 'Zuschauer'})</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setMode('bot');
                resetGame();
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
                mode === 'bot' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              <Bot className="w-3.5 h-3.5" /> KI
            </button>
            <button
              onClick={() => {
                setMode('local2p');
                resetGame();
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
                mode === 'local2p' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> 2P Duell
            </button>
          </div>
        )}

        <div className={`flex items-center gap-2 p-1 rounded-xl transition ${turn === 'black' && !winner ? 'bg-slate-800/80 ring-1 ring-slate-400/50' : ''}`}>
          <div className="text-right">
            <div className="font-bold text-slate-200 flex items-center gap-1 justify-end">
              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
              <span>{p2Name}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">Steine: {blackPieces}</div>
          </div>
          {p2?.avatar ? (
            <AvatarDisplay avatar={p2.avatar} size="sm" />
          ) : (
            <div
              className="w-5 h-5 rounded-full border border-slate-500 shadow"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #475569, #0f172a)',
              }}
            />
          )}
        </div>
      </div>

      {/* Turn indicator */}
      <div className="mb-2 text-center text-xs font-semibold">
        {winner ? (
          <div className="text-amber-300 font-bold flex items-center gap-2 animate-bounce bg-amber-500/10 px-4 py-1 rounded-full border border-amber-400/30">
            <Trophy className="w-4 h-4 text-amber-400" /> {winner === 'Red' ? p1Name : p2Name} gewinnt die Partie! 🏆
          </div>
        ) : (
          <span className="text-slate-300">
            Am Zug: <strong className={turn === 'red' ? 'text-rose-400' : 'text-slate-200'}>{turn === 'red' ? `${p1Name} (Rot)` : `${p2Name} (Schwarz)`}</strong>
          </span>
        )}
      </div>

      {/* 8x8 REALISTIC WOODEN CHECKERBOARD WITH INLAID MAHOGANY & MAPLE */}
      <BoardSurface name="Dame" minBoardWidth={372}><div className="responsive-board relative rounded-3xl p-3 sm:p-5 border-4 border-amber-950 shadow-2xl max-w-sm sm:max-w-md w-full overflow-hidden bg-amber-950">
        
        {/* Real Wood Grain Background Photo Inlay */}
        <img
          src={TABLE_BACKGROUNDS.mahogany}
          alt="Wood Texture"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover "
        />

        <div style={{backgroundImage:`url(${boardAsset('checkers')})`,backgroundSize:'100% 100%'}} className="relative z-10 grid grid-cols-8 rounded-2xl overflow-hidden border-2 border-amber-900/90 shadow-2xl bg-amber-950">
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
                  onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleCellClick(r,c); } }}
                  onClick={() => handleCellClick(r, c)}
                  className={`aspect-square flex items-center justify-center relative cursor-pointer transition-colors ${
                    isDark
                      ? 'hover:bg-white/10'
                      : 'hover:bg-black/10'
                  } ${isSelected ? 'ring-2 ring-amber-400 z-10' : ''}`}
                >
                  {/* Destination hint indicator */}
                  {isValid && (
                    <div className="w-4 h-4 rounded-full bg-emerald-400/90 animate-ping z-20 shadow-md ring-2 ring-white" />
                  )}

                  {cell&&<AtelierPiece kind={`checker-${cell.player}${cell.isKing?'-king':''}`} label={`${cell.player==='red'?'Roter':'Schwarzer'} ${cell.isKing?'Damenstein':'Stein'}`} className={`w-[88%] h-[88%] object-contain pointer-events-none ${isSelected?'scale-110':''}`}/>}

                </div>
              );
            })
          )}
        </div>
      </div></BoardSurface>

      {!state.result&&<div className="flex flex-wrap gap-2 mt-3 text-xs">
        <button className="bg-slate-800 px-3 py-2 rounded-xl" disabled={isOnlineMultiplayer&&!myPlayer} onClick={()=>send({type:'RESIGN',color:myPlayer||turn})}>Aufgeben</button>
        <button className="bg-slate-800 px-3 py-2 rounded-xl" disabled={isOnlineMultiplayer&&!myPlayer} onClick={()=>send({type:state.offer&&state.offer!==(myPlayer||turn)?'ACCEPT_DRAW':'OFFER_DRAW',color:myPlayer||turn})}>{state.offer&&state.offer!==(myPlayer||turn)?'Remis annehmen':'Remis anbieten'}</button>
      </div>}
      {/* Action Footer */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={resetGame}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Restart Match
        </button>
      </div>
    </div>
  );
};
