import {BoardSurface} from './BoardSurface';
import { useAIDifficulty } from './GameArena';
import { chooseBoxLine } from '../../services/gameAI';
import { useGameTimers } from './useGameTimers';
import React, { useState, useEffect } from 'react';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import { RefreshCw, Trophy, Shield, Crown, Wifi } from 'lucide-react';
import { TABLE_BACKGROUNDS } from '../../services/gameImages';

import { RoomParticipant } from '../../types';
import { AvatarDisplay } from '../avatar/AvatarDisplay';
import { multiplayerService } from '../../services/multiplayerService';

interface DotsAndBoxesProps {
  onGameEnd?: (winner: string) => void;
  tableParticipants?: RoomParticipant[];
  currentUserId?: string;
  onActiveTurnChange?: (turnPlayerId: string) => void;
  roomCode?: string;
  isHost?: boolean;
}

const GRID_SIZE = 4; // 4x4 dots = 3x3 boxes (9 total territory boxes)

export const DotsAndBoxesGame: React.FC<DotsAndBoxesProps> = ({ 
  onGameEnd,
  tableParticipants,
  currentUserId,
  onActiveTurnChange,
  roomCode,
}) => {
  const { schedule, cancelAll } = useGameTimers();
  const difficulty = useAIDifficulty();
  const p1 = tableParticipants?.[0];
  const p2 = tableParticipants?.[1];
  const p1Name = p1?.name || 'Blau (Spieler 1)';
  const p2Name = p2?.name || (p2?.isBot ? 'KI-Gegner' : 'Gelb (Spieler 2)');
  const isP2Bot = p2 ? !!p2.isBot : true;

  const isOnlineMultiplayer = Boolean(roomCode && p1 && p2 && !p2.isBot);
  const myPlayer: 'p1' | 'p2' | null = isOnlineMultiplayer
    ? currentUserId === p1?.id
      ? 'p1'
      : currentUserId === p2?.id
      ? 'p2'
      : null
    : null;

  // Horizontal lines: GRID_SIZE rows of (GRID_SIZE - 1)
  const [hLines, setHLines] = useState<boolean[][]>(() =>
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE - 1).fill(false))
  );

  // Vertical lines: (GRID_SIZE - 1) rows of GRID_SIZE
  const [vLines, setVLines] = useState<boolean[][]>(() =>
    Array(GRID_SIZE - 1).fill(null).map(() => Array(GRID_SIZE).fill(false))
  );

  // Boxes: (GRID_SIZE - 1) x (GRID_SIZE - 1)
  const [boxes, setBoxes] = useState<('p1' | 'p2' | null)[][]>(() =>
    Array(GRID_SIZE - 1).fill(null).map(() => Array(GRID_SIZE - 1).fill(null))
  );

  const [turn, setTurn] = useState<'p1' | 'p2'>('p1');
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    if (onActiveTurnChange) {
      const activeId = turn === 'p1' ? (p1?.id || 'p1') : (p2?.id || 'p2');
      onActiveTurnChange(activeId);
    }
  }, [turn, p1?.id, p2?.id, onActiveTurnChange]);

  // WebSocket Multiplayer Synchronization
  useEffect(() => {
    if (!roomCode) return;

    const unsubscribe = multiplayerService.subscribeToGameActions((event) => {
      if (event.gameType !== 'dotsandboxes' || event.roomCode !== roomCode) return;
      if (event.senderId === currentUserId) return;

      if (event.action === 'DRAW_LINE') {
        const { lineType, r, c } = event.payload;
        applyRemoteLine(lineType, r, c);
      } else if (event.action === 'RESET') {
        cancelAll();
        sound.playClick();
        setHLines(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE - 1).fill(false)));
        setVLines(Array(GRID_SIZE - 1).fill(null).map(() => Array(GRID_SIZE).fill(false)));
        setBoxes(Array(GRID_SIZE - 1).fill(null).map(() => Array(GRID_SIZE - 1).fill(null)));
        setScores({ p1: 0, p2: 0 });
        setTurn('p1');
        setWinner(null);
      }
    });

    return () => unsubscribe();
  }, [roomCode, currentUserId, onGameEnd]);

  // Apply remote line
  const applyRemoteLine = (lineType: 'H' | 'V', r: number, c: number) => {
    sound.playPieceDrop();
    if (lineType === 'H') {
      setHLines((prevH) => {
        const newH = prevH.map((row) => [...row]);
        newH[r][c] = true;
        setVLines((prevV) => {
          processTurnAfterLine(newH, prevV);
          return prevV;
        });
        return newH;
      });
    } else {
      setVLines((prevV) => {
        const newV = prevV.map((row) => [...row]);
        newV[r][c] = true;
        setHLines((prevH) => {
          processTurnAfterLine(prevH, newV);
          return prevH;
        });
        return newV;
      });
    }
  };

  // Check if box (r, c) is completed
  const checkCompletedBoxes = (
    currentHLines: boolean[][],
    currentVLines: boolean[][],
    currentBoxes: ('p1' | 'p2' | null)[][],
    currentTurn: 'p1' | 'p2'
  ): { newBoxes: ('p1' | 'p2' | null)[][]; countP1: number; countP2: number } => {
    const updatedBoxes = currentBoxes.map((row) => [...row]);
    let countP1 = 0;
    let countP2 = 0;

    for (let r = 0; r < GRID_SIZE - 1; r++) {
      for (let c = 0; c < GRID_SIZE - 1; c++) {
        if (!updatedBoxes[r][c]) {
          const top = currentHLines[r][c];
          const bottom = currentHLines[r + 1][c];
          const left = currentVLines[r][c];
          const right = currentVLines[r][c + 1];

          if (top && bottom && left && right) {
            updatedBoxes[r][c] = currentTurn;
            if (currentTurn === 'p1') countP1++;
            else countP2++;
          }
        }
      }
    }

    return { newBoxes: updatedBoxes, countP1, countP2 };
  };

  const processTurnAfterLine = (newH: boolean[][], newV: boolean[][]) => {
    setBoxes((prevBoxes) => {
      const result = checkCompletedBoxes(newH, newV, prevBoxes, turn);
      const boxesClaimed = result.countP1 + result.countP2;

      if (boxesClaimed > 0) {
        sound.playReward();
        setScores((prev) => ({
          p1: prev.p1 + result.countP1,
          p2: prev.p2 + result.countP2,
        }));
        // Turn is retained!
      } else {
        setTurn((t) => (t === 'p1' ? 'p2' : 'p1'));
      }

      // Check game finish (all 9 boxes claimed)
      let totalClaimed = 0;
      result.newBoxes.forEach((row) => row.forEach((cell) => { if (cell) totalClaimed++; }));

      if (totalClaimed === (GRID_SIZE - 1) * (GRID_SIZE - 1)) {
        setScores((curScores) => {
          const finalP1 = curScores.p1 + result.countP1;
          const finalP2 = curScores.p2 + result.countP2;
          const finalWinner = finalP1 > finalP2 ? p1Name : finalP2 > finalP1 ? p2Name : 'Unentschieden';
          setWinner(finalWinner);
          sound.playVictory();
          try {
            confetti({ particleCount: 80, spread: 70 });
          } catch (e) {}
          if (onGameEnd) onGameEnd(finalWinner);
          return curScores;
        });
      }

      return result.newBoxes;
    });
  };

  const handleHLineClick = (r: number, c: number) => {
    if (hLines[r][c] || winner) return;

    if (isOnlineMultiplayer && (!myPlayer || turn !== myPlayer)) {
      sound.playError();
      return;
    }

    sound.playPieceDrop();
    const newH = hLines.map((row) => [...row]);
    newH[r][c] = true;
    setHLines(newH);

    if (roomCode) {
      multiplayerService.sendGameAction(roomCode, 'dotsandboxes', 'DRAW_LINE', {
        lineType: 'H',
        r,
        c,
      }, currentUserId || 'p1');
    }

    processTurnAfterLine(newH, vLines);
  };

  const handleVLineClick = (r: number, c: number) => {
    if (vLines[r][c] || winner) return;

    if (isOnlineMultiplayer && (!myPlayer || turn !== myPlayer)) {
      sound.playError();
      return;
    }

    sound.playPieceDrop();
    const newV = vLines.map((row) => [...row]);
    newV[r][c] = true;
    setVLines(newV);

    if (roomCode) {
      multiplayerService.sendGameAction(roomCode, 'dotsandboxes', 'DRAW_LINE', {
        lineType: 'V',
        r,
        c,
      }, currentUserId || 'p1');
    }

    processTurnAfterLine(hLines, newV);
  };

  // Bot Turn in Local Bot Mode
  useEffect(() => {
    if (isOnlineMultiplayer || !isP2Bot || turn !== 'p2' || winner) return;

    const botTimer = schedule(() => {
      // Find all unplaced lines
      const availableHLines: [number, number][] = [];
      const availableVLines: [number, number][] = [];

      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE - 1; c++) {
          if (!hLines[r][c]) availableHLines.push([r, c]);
        }
      }
      for (let r = 0; r < GRID_SIZE - 1; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (!vLines[r][c]) availableVLines.push([r, c]);
        }
      }

      const totalAvailable = availableHLines.length + availableVLines.length;
      if (totalAvailable === 0) return;

      const move = chooseBoxLine(hLines, vLines, difficulty);
      if (move?.type === 'H') handleHLineClick(move.r, move.c);
      else if (move) handleVLineClick(move.r, move.c);
    }, 600);

    return () => clearTimeout(botTimer);
  }, [turn, isOnlineMultiplayer, isP2Bot, winner, hLines, vLines]);

  const resetGame = () => {
    cancelAll();
    sound.playClick();
    setHLines(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE - 1).fill(false)));
    setVLines(Array(GRID_SIZE - 1).fill(null).map(() => Array(GRID_SIZE).fill(false)));
    setBoxes(Array(GRID_SIZE - 1).fill(null).map(() => Array(GRID_SIZE - 1).fill(null)));
    setScores({ p1: 0, p2: 0 });
    setTurn('p1');
    setWinner(null);

    if (roomCode) {
      multiplayerService.sendGameAction(roomCode, 'dotsandboxes', 'RESET', {}, currentUserId || 'p1');
    }
  };

  return (
    <div className="flex flex-col items-center max-w-6xl mx-auto w-full select-none text-slate-100">
      
      {/* Score Header with Avatars */}
      <div className="w-full mobile-game-header flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 p-3 sm:p-3.5 rounded-2xl mb-4 text-xs font-semibold shadow-xl">
        <div className={`flex items-center gap-2 p-1 rounded-xl transition ${turn === 'p1' && !winner ? 'bg-sky-950/40 ring-1 ring-sky-500/50' : ''}`}>
          {p1?.avatar ? (
            <AvatarDisplay avatar={p1.avatar} size="sm" />
          ) : (
            <div className="w-4 h-4 rounded-md bg-sky-500 shadow-md ring-1 ring-sky-300" />
          )}
          <div>
            <div className="font-bold text-slate-200 flex items-center gap-1">
              <span>{p1Name}</span>
              <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
            </div>
            <div className="text-[11px] text-sky-400 font-mono">Kästchen: {scores.p1}</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="text-[11px] text-slate-300 font-bold uppercase tracking-wider bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
            {winner ? 'Spiel beendet' : turn === 'p1' ? '⚡ Blau am Zug' : '⚡ Gelb am Zug'}
          </div>
          {isOnlineMultiplayer && (
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-black">
              <Wifi className="w-2.5 h-2.5 animate-pulse" />
              <span>ONLINE</span>
            </div>
          )}
        </div>

        <div className={`flex items-center gap-2 p-1 rounded-xl transition ${turn === 'p2' && !winner ? 'bg-amber-950/40 ring-1 ring-amber-500/50' : ''}`}>
          <div className="text-right">
            <div className="font-bold text-slate-200 flex items-center gap-1 justify-end">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span>{p2Name}</span>
            </div>
            <div className="text-[11px] text-amber-400 font-mono">Kästchen: {scores.p2}</div>
          </div>
          {p2?.avatar ? (
            <AvatarDisplay avatar={p2.avatar} size="sm" />
          ) : (
            <div className="w-4 h-4 rounded-md bg-amber-500 shadow-md ring-1 ring-amber-300" />
          )}
        </div>
      </div>

      {winner && (
        <div className="mb-3 text-sm font-bold text-amber-300 flex items-center gap-2 animate-bounce bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-400/30">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>{winner} gewinnt das Spiel!</span>
        </div>
      )}

      {/* VINTAGE ARCHITECTURAL DRAFTING BLUEPRINT WITH 3D BRASS PINS */}
      <BoardSurface name="Käsekästchen" ><div className="responsive-board relative rounded-3xl p-6 sm:p-7 border-4 border-slate-800 shadow-2xl flex flex-col items-center overflow-hidden bg-slate-950">
        
        {/* Real Drafting Blueprint / Leather Desk Background Photo */}
        <img
          src={TABLE_BACKGROUNDS.slateZen}
          alt="Vintage Desk Surface"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.2] contrast-125"
        />
        <div className="absolute inset-0 bg-blue-950/20 pointer-events-none" />

        <div className="dots-board-grid relative z-10" role="group" aria-label="Käsekästchen-Spielbrett">
          {Array.from({length:GRID_SIZE*2-1},(_,row)=>Array.from({length:GRID_SIZE*2-1},(_,col)=>{
            if(row%2===0&&col%2===0)return <div key={row+':'+col} className="flex items-center justify-center"><span className="w-3 h-3 rounded-full bg-amber-300 shadow-lg"/></div>;
            if(row%2===0){const r=row/2,c=(col-1)/2,owner=hLines[r][c];return <button key={row+':'+col} aria-label={'Waagerechte Linie '+(r+1)+', '+(c+1)} onClick={()=>handleHLineClick(r,c)} disabled={Boolean(owner||winner||(isOnlineMultiplayer&&myPlayer&&turn!==myPlayer))} className="dots-line flex items-center justify-center"><span className={'h-2 w-full rounded-full '+(owner?'bg-amber-300':'bg-slate-700')}/></button>;}
            if(col%2===0){const r=(row-1)/2,c=col/2,owner=vLines[r][c];return <button key={row+':'+col} aria-label={'Senkrechte Linie '+(r+1)+', '+(c+1)} onClick={()=>handleVLineClick(r,c)} disabled={Boolean(owner||winner||(isOnlineMultiplayer&&myPlayer&&turn!==myPlayer))} className="dots-line flex items-center justify-center"><span className={'w-2 h-full rounded-full '+(owner?'bg-amber-300':'bg-slate-700')}/></button>;}
            const owner=boxes[(row-1)/2][(col-1)/2];return <div key={row+':'+col} className={'flex items-center justify-center rounded-xl font-bold '+(owner==='p1'?'bg-sky-700/40 text-sky-200':owner==='p2'?'bg-amber-700/40 text-amber-200':'bg-slate-900/40')}>{owner==='p1'?'1':owner==='p2'?'2':''}</div>;
          }))}
        </div>
      </div></BoardSurface>

      <div className="mt-4">
        <button
          onClick={resetGame}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Neu starten
        </button>
      </div>
    </div>
  );
};
