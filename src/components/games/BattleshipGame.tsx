import {BoardSurface} from './BoardSurface';
import { useAIDifficulty } from './GameArena';
import { chooseBattleshipShot } from '../../services/gameAI';
import { useGameTimers } from './useGameTimers';
import React, { useState, useEffect } from 'react';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import { RefreshCw, Trophy, Target, Shield, Crosshair, AlertCircle, Flame, Waves, Bot, Users } from 'lucide-react';
import { NAVAL_FLEET_PHOTOS, TABLE_BACKGROUNDS } from '../../services/gameImages';
import { RoomParticipant } from '../../types';
import { AvatarDisplay } from '../avatar/AvatarDisplay';

const GRID_SIZE = 8; // 8x8 for fast, fun family gameplay

type CellState = 'empty' | 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer';

interface ShipDef {
  id: 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer';
  name: string;
  size: number;
  photo: string;
  type: string;
}

const SHIPS: ShipDef[] = [
  { id: 'carrier', ...NAVAL_FLEET_PHOTOS.carrier },
  { id: 'battleship', ...NAVAL_FLEET_PHOTOS.battleship },
  { id: 'cruiser', ...NAVAL_FLEET_PHOTOS.cruiser },
  { id: 'submarine', ...NAVAL_FLEET_PHOTOS.submarine },
  { id: 'destroyer', ...NAVAL_FLEET_PHOTOS.destroyer },
];

import { multiplayerService } from '../../services/multiplayerService';
import { Wifi } from 'lucide-react';

interface BattleshipGameProps {
  onGameEnd?: (winner: string) => void;
  tableParticipants?: RoomParticipant[];
  currentUserId?: string;
  onActiveTurnChange?: (turnPlayerId: string) => void;
  roomCode?: string;
  isHost?: boolean;
}

export const BattleshipGame: React.FC<BattleshipGameProps> = ({ 
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
  const p1Name = p1?.name || 'Admiral (Du)';
  const p2Name = p2?.name || (p2?.isBot ? 'KI Flottenadmiral' : 'Gegnerischer Admiral');
  const isP2Bot = p2 ? !!p2.isBot : true;

  const isOnlineMultiplayer = Boolean(roomCode && p1 && p2 && !p2.isBot);
  const isPlayer1 = currentUserId === p1?.id;
  const isPlayer2 = currentUserId === p2?.id;

  const generateRandomFleet = (): CellState[][] => {
    const grid: CellState[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('empty'));

    for (const ship of SHIPS) {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 100) {
        attempts++;
        const horizontal = Math.random() > 0.5;
        const r = Math.floor(Math.random() * (horizontal ? GRID_SIZE : GRID_SIZE - ship.size + 1));
        const c = Math.floor(Math.random() * (horizontal ? GRID_SIZE - ship.size : GRID_SIZE));

        let canPlace = true;
        for (let i = 0; i < ship.size; i++) {
          const checkR = horizontal ? r : r + i;
          const checkC = horizontal ? c + i : c;
          if (grid[checkR][checkC] !== 'empty') {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          for (let i = 0; i < ship.size; i++) {
            const placeR = horizontal ? r : r + i;
            const placeC = horizontal ? c + i : c;
            grid[placeR][placeC] = ship.id;
          }
          placed = true;
        }
      }
    }
    return grid;
  };

  const [playerGrid, setPlayerGrid] = useState<CellState[][]>(generateRandomFleet);
  const [enemyGrid, setEnemyGrid] = useState<CellState[][]>(generateRandomFleet);
  const [enemyRevealed, setEnemyRevealed] = useState<('empty' | 'hit' | 'miss')[][]>(() =>
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('empty'))
  );
  const [playerDamage, setPlayerDamage] = useState<('empty' | 'hit' | 'miss')[][]>(() =>
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('empty'))
  );

  // Turn: 'p1' or 'p2' (or 'player' / 'enemy' in local)
  const [activeTurn, setActiveTurn] = useState<string>(() => isOnlineMultiplayer ? (p1?.id || 'p1') : 'player');
  const [winner, setWinner] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Wähle Zielkoordinaten auf dem Radar zum Feuern!');
  const [lastStrikeResult, setLastStrikeResult] = useState<'hit' | 'miss' | null>(null);

  const isMyTurn = isOnlineMultiplayer
    ? activeTurn === currentUserId
    : activeTurn === 'player';

  useEffect(() => {
    if (onActiveTurnChange) {
      if (isOnlineMultiplayer) {
        onActiveTurnChange(activeTurn);
      } else {
        const activeId = activeTurn === 'player' ? (p1?.id || 'p1') : (p2?.id || 'p2');
        onActiveTurnChange(activeId);
      }
    }
  }, [activeTurn, p1?.id, p2?.id, isOnlineMultiplayer, onActiveTurnChange]);

  // Real-time WebSocket event handler for online Battleship
  useEffect(() => {
    if (!roomCode || !isOnlineMultiplayer) return;

    const unsubscribe = multiplayerService.subscribeToGameActions((event) => {
      if (event.gameType !== 'battleship' || event.roomCode !== roomCode) return;
      if (event.senderId === currentUserId) return;

      if (event.action === 'FIRE') {
        const { r, c } = event.payload;
        // The opponent fired at our grid! Check our playerGrid
        const cellVal = playerGrid[r][c];
        const isHit = cellVal !== 'empty';

        setPlayerDamage((prev) => {
          const next = prev.map((row) => [...row]);
          next[r][c] = isHit ? 'hit' : 'miss';

          let totalDmg = 0;
          next.forEach((row) => row.forEach((cell) => { if (cell === 'hit') totalDmg++; }));
          const allSunk = totalDmg >= 14;

          // Send back FIRE_RESULT
          multiplayerService.sendGameAction(roomCode, 'battleship', 'FIRE_RESULT', {
            r,
            c,
            isHit,
            shipId: isHit ? cellVal : null,
            allSunk,
            targetPlayerId: currentUserId,
          }, currentUserId || 'p2');

          if (isHit) {
            sound.playError();
            const hitShip = SHIPS.find((s) => s.id === cellVal);
            const coordName = `${String.fromCharCode(65 + r)}${c + 1}`;
            setStatusMessage(`ALARM: Gegner traf deine ${hitShip?.name || 'Flotte'} bei [${coordName}]! ⚠️`);
          } else {
            sound.playPieceDrop();
            setStatusMessage(`Gegner feuerte ins Wasser!`);
          }

          if (allSunk) {
            const winName = p1?.id === currentUserId ? p2Name : p1Name;
            setWinner(winName);
            sound.playVictory();
            try { confetti({ particleCount: 100, spread: 80 }); } catch (e) {}
            if (onGameEnd) onGameEnd(winName);
          } else {
            // Turn passes to us!
            setActiveTurn(currentUserId || 'p1');
          }

          return next;
        });

      } else if (event.action === 'FIRE_RESULT') {
        const { r, c, isHit, shipId, allSunk } = event.payload;
        const coordName = `${String.fromCharCode(65 + r)}${c + 1}`;

        setEnemyRevealed((prev) => {
          const next = prev.map((row) => [...row]);
          next[r][c] = isHit ? 'hit' : 'miss';
          return next;
        });

        if (isHit) {
          sound.playReward();
          setLastStrikeResult('hit');
          const hitShip = SHIPS.find((s) => s.id === shipId);
          setStatusMessage(`VOLLTREFFER! Feindliches Schiff ${hitShip?.name || ''} bei [${coordName}] getroffen! 🔥`);
        } else {
          sound.playPieceDrop();
          setLastStrikeResult('miss');
          setStatusMessage(`Wasser! Torpedo verfehlte bei [${coordName}]. 🌊`);
        }

        if (allSunk) {
          const myName = currentUserId === p1?.id ? p1Name : p2Name;
          setWinner(myName);
          sound.playVictory();
          try { confetti({ particleCount: 100, spread: 80 }); } catch (e) {}
          if (onGameEnd) onGameEnd(myName);
        } else {
          // Turn passes to opponent
          const otherId = currentUserId === p1?.id ? (p2?.id || 'p2') : (p1?.id || 'p1');
          setActiveTurn(otherId);
        }

      } else if (event.action === 'RESET') {
        cancelAll();
        sound.playClick();
        setPlayerGrid(generateRandomFleet());
        setEnemyGrid(generateRandomFleet());
        setEnemyRevealed(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('empty')));
        setPlayerDamage(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('empty')));
        setActiveTurn(p1?.id || 'p1');
        setWinner(null);
        setLastStrikeResult(null);
        setStatusMessage('Flotten neu formiert! Gefechtsbereit.');
      }
    });

    return () => unsubscribe();
  }, [roomCode, isOnlineMultiplayer, currentUserId, playerGrid, p1?.id, p2?.id, p1Name, p2Name, onGameEnd]);

  // Calculate damage per ship class
  const getEnemyShipHits = (shipId: string): number => {
    let hits = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (enemyGrid[r][c] === shipId && enemyRevealed[r][c] === 'hit') {
          hits++;
        }
      }
    }
    return hits;
  };

  const getPlayerShipHits = (shipId: string): number => {
    let hits = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (playerGrid[r][c] === shipId && playerDamage[r][c] === 'hit') {
          hits++;
        }
      }
    }
    return hits;
  };

  const handlePlayerFire = (r: number, c: number) => {
    if (winner || enemyRevealed[r][c] !== 'empty') return;
    if (!isMyTurn) {
      sound.playError();
      return;
    }

    if (isOnlineMultiplayer) {
      // In online mode, send FIRE action to room
      sound.playClick();
      const coordName = `${String.fromCharCode(65 + r)}${c + 1}`;
      setStatusMessage(`Torpedo auf [${coordName}] abgefeuert... Telemetrie wird empfangen...`);

      if (roomCode) {
        multiplayerService.sendGameAction(roomCode, 'battleship', 'FIRE', { r, c }, currentUserId || 'p1');
      }
      return;
    }

    // Local Bot Mode
    sound.playClick();
    const cellValue = enemyGrid[r][c];
    const isHit = cellValue !== 'empty';

    const newRevealed = enemyRevealed.map((row) => [...row]);
    newRevealed[r][c] = isHit ? 'hit' : 'miss';
    setEnemyRevealed(newRevealed);

    const coordName = `${String.fromCharCode(65 + r)}${c + 1}`;

    if (isHit) {
      sound.playReward();
      setLastStrikeResult('hit');
      const hitShip = SHIPS.find((s) => s.id === cellValue);
      setStatusMessage(`DIREKTER TREFFER auf feindliches ${hitShip?.name || 'Schiff'} bei [${coordName}]! 🔥`);
    } else {
      sound.playPieceDrop();
      setLastStrikeResult('miss');
      setStatusMessage(`Ins Wasser geschossen bei [${coordName}]. 🌊`);
    }

    // Check if all enemy ships are sunk (total ship cells = 4 + 3 + 3 + 2 + 2 = 14)
    let totalHits = 0;
    newRevealed.forEach((row) => row.forEach((cell) => { if (cell === 'hit') totalHits++; }));

    if (totalHits >= 14) {
      setWinner(p1Name);
      sound.playVictory();
      try {
        confetti({ particleCount: 100, spread: 80 });
      } catch (e) {}
      if (onGameEnd) onGameEnd(p1Name);
      return;
    }

    // Enemy AI turn
    setActiveTurn('enemy');
    schedule(() => {
      executeEnemyTurn();
    }, 750);
  };

  const executeEnemyTurn = () => {
    if (winner) return;

    const unhitCoords: [number, number][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (playerDamage[r][c] === 'empty') {
          unhitCoords.push([r, c]);
        }
      }
    }

    if (unhitCoords.length === 0) {
      setActiveTurn('player');
      return;
    }

    const shot = chooseBattleshipShot(playerDamage, difficulty);
    if (!shot) return;
    const [tarR, tarC] = shot;
    const isHit = playerGrid[tarR][tarC] !== 'empty';

    const newDamage = playerDamage.map((row) => [...row]);
    newDamage[tarR][tarC] = isHit ? 'hit' : 'miss';
    setPlayerDamage(newDamage);

    const coordName = `${String.fromCharCode(65 + tarR)}${tarC + 1}`;
    if (isHit) {
      sound.playError();
      const hitShip = SHIPS.find((s) => s.id === playerGrid[tarR][tarC]);
      setStatusMessage(`WARNUNG: Feind traf deine ${hitShip?.name || 'Flotte'} bei [${coordName}]! ⚠️`);
    } else {
      sound.playPieceDrop();
      setStatusMessage(`Feindliche Radarrakete verfehlte im Meer bei [${coordName}].`);
    }

    let totalPlayerDamage = 0;
    newDamage.forEach((row) => row.forEach((cell) => { if (cell === 'hit') totalPlayerDamage++; }));

    if (totalPlayerDamage >= 14) {
      setWinner(p2Name);
      sound.playError();
      if (onGameEnd) onGameEnd(p2Name);
      return;
    }

    setActiveTurn('player');
  };

  const resetGame = () => {
    cancelAll();
    sound.playClick();
    setPlayerGrid(generateRandomFleet());
    setEnemyGrid(generateRandomFleet());
    setEnemyRevealed(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('empty')));
    setPlayerDamage(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('empty')));
    setActiveTurn(isOnlineMultiplayer ? (p1?.id || 'p1') : 'player');
    setWinner(null);
    setLastStrikeResult(null);
    setStatusMessage('Flotten neu aufgestellt! Gefechtsbereit.');

    if (roomCode) {
      multiplayerService.sendGameAction(roomCode, 'battleship', 'RESET', {}, currentUserId || 'p1');
    }
  };

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto w-full select-none text-slate-100">
      
      {/* Tactical Status Banner & Commanders */}
      <div className="w-full bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl mb-4 text-xs shadow-xl space-y-3">
        {/* Commanders Avatar Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          {/* Commander 1 */}
          <div className="flex items-center gap-2.5">
            {p1?.avatar ? (
              <div className="p-0.5 rounded-xl ring-2 ring-emerald-500 shadow">
                <AvatarDisplay avatar={p1.avatar} size="sm" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-xl bg-emerald-600/30 border border-emerald-500 flex items-center justify-center text-xs font-bold text-emerald-300">
                A1
              </div>
            )}
            <div>
              <div className="font-bold text-white text-xs flex items-center gap-1.5">
                <span>{p1Name}</span>
                {activeTurn === (isOnlineMultiplayer ? (p1?.id || 'p1') : 'player') && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-black border border-emerald-500/30 animate-pulse">
                    AM ZUG
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400">Blaue Flotte · {isPlayer1 ? 'Deine Flotte' : 'Spieler 1'}</div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-slate-600 font-black text-xs">VS</span>
            {isOnlineMultiplayer && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-black text-emerald-400">
                <Wifi className="w-2.5 h-2.5 animate-pulse" />
                <span>ONLINE</span>
              </div>
            )}
          </div>

          {/* Commander 2 */}
          <div className="flex items-center gap-2.5 text-right">
            <div>
              <div className="font-bold text-white text-xs flex items-center gap-1.5 justify-end">
                {activeTurn === (isOnlineMultiplayer ? (p2?.id || 'p2') : 'enemy') && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-black border border-amber-500/30 animate-pulse">
                    AM ZUG
                  </span>
                )}
                <span>{p2Name}</span>
              </div>
              <div className="text-[10px] text-slate-400">Rote Flotte · {isPlayer2 ? 'Deine Flotte' : (p2?.isBot ? 'KI-Admiral' : 'Spieler 2')}</div>
            </div>
            {p2?.avatar ? (
              <div className="p-0.5 rounded-xl ring-2 ring-rose-500 shadow">
                <AvatarDisplay avatar={p2.avatar} size="sm" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-xl bg-rose-600/30 border border-rose-500 flex items-center justify-center text-xs font-bold text-rose-300">
                A2
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold text-slate-200">{statusMessage}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] uppercase tracking-wider ${
              isMyTurn
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              {isMyTurn ? '🎯 Dein Zug: Ziel wählen' : (isOnlineMultiplayer ? '⏳ Gegner ist am Zug...' : '⚡ KI-Rakete im Anflug...')}
            </span>
            <button
              onClick={resetGame}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Flotte neu aufstellen"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {winner && (
        <div className="w-full mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-2 border-amber-400 flex items-center justify-between animate-bounce shadow-2xl">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            <div>
              <h3 className="font-display font-black text-lg text-amber-300">
                {winner} Has Sunk All Hostile Vessels!
              </h3>
              <p className="text-xs text-amber-200/80">Victory achieved through naval precision and tactical targeting.</p>
            </div>
          </div>
          <button
            onClick={resetGame}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition"
          >
            Play Rematch
          </button>
        </div>
      )}

      {/* REAL WARSHIPS FLEET STATUS SHOWCASE */}
      <div className="w-full mb-4 bg-slate-950/80 border border-slate-800/90 rounded-3xl p-3.5 shadow-xl">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
            <Shield className="w-4 h-4" /> Warship Fleet Command (Real Naval Vessels)
          </div>
          <span className="text-[10px] text-slate-400 font-mono">5 Naval Units Active</span>
        </div>

        <div className="flex sm:grid sm:grid-cols-5 gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {SHIPS.map((ship) => {
            const enemyHits = getEnemyShipHits(ship.id);
            const isEnemySunk = enemyHits >= ship.size;
            const playerHits = getPlayerShipHits(ship.id);
            const isPlayerSunk = playerHits >= ship.size;

            return (
              <div
                key={ship.id}
                className="w-36 sm:w-auto shrink-0 sm:shrink bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col group relative"
              >
                {/* Warship Real Photograph */}
                <div className="h-16 w-full relative overflow-hidden bg-slate-800">
                  <img
                    src={ship.photo}
                    alt={ship.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  
                  {isEnemySunk && (
                    <div className="absolute inset-0 bg-rose-950/80 backdrop-blur-xs flex items-center justify-center">
                      <span className="text-[10px] font-black uppercase text-rose-300 bg-rose-900/90 px-1.5 py-0.5 rounded border border-rose-500">
                        ENEMY SUNK 🔥
                      </span>
                    </div>
                  )}

                  <span className="absolute top-1 left-1.5 text-[9px] font-mono font-bold bg-slate-950/80 px-1.5 py-0.5 rounded text-amber-300">
                    {ship.size} Cells
                  </span>
                </div>

                <div className="p-2 space-y-1">
                  <h4 className="text-[11px] font-bold text-white line-clamp-1">{ship.name}</h4>
                  
                  {/* Health bars */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>Hostile:</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: ship.size }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-xs ${
                            i < enemyHits ? 'bg-rose-500 shadow-xs' : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Yours:</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: ship.size }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-xs ${
                            i < playerHits ? 'bg-amber-500 shadow-xs' : 'bg-emerald-500'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DUAL RADAR MAT: Enemy Sonar & Friendly Fleet with Real Ocean Photography Background */}
      <div className="relative rounded-3xl p-1 sm:p-3 border-2 border-slate-900 shadow-2xl w-full overflow-hidden bg-slate-950">
        
        {/* Real Ocean Background Photo Texture */}
        <img
          src={TABLE_BACKGROUNDS.oceanRadar}
          alt="Ocean Radar Background"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.25] contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-950/60 via-slate-950/80 to-slate-950 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          
          {/* 1. ENEMY SONAR RADAR (Player fires here) */}
          <div className="bg-slate-950/85 backdrop-blur-md border-2 border-sky-500/50 rounded-3xl p-1 sm:p-3 min-w-0 flex flex-col items-center shadow-2xl">
            <div className="flex items-center justify-between w-full mb-3 px-1">
              <div className="flex items-center gap-1.5 text-xs font-black text-sky-400 uppercase tracking-wider">
                <Target className="w-4 h-4 text-rose-400" /> Hostile Sector Sonar
              </div>
              <span className="text-[10px] font-mono text-sky-300/80 bg-sky-950/70 px-2 py-0.5 rounded-full border border-sky-800">
                CLICK TO FIRE 🎯
              </span>
            </div>

            {/* Column Coordinate Labels A-H */}
            <BoardSurface name="Gegnerisches Radar" minBoardWidth={400}><div className="grid grid-cols-8 gap-0.5 sm:gap-1.5 w-full max-w-none mb-1 px-1 text-center font-mono text-[10px] text-sky-400 font-bold">
              {['1', '2', '3', '4', '5', '6', '7', '8'].map((col) => (
                <div key={col}>{col}</div>
              ))}
            </div>

            {/* Grid 8x8 */}
            <div className="grid grid-cols-8 gap-0.5 sm:gap-1.5 bg-sky-950/80 p-2.5 rounded-2xl border border-sky-700/60 shadow-inner w-full max-w-none">
              {enemyRevealed.map((row, r) =>
                row.map((cell, c) => (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handlePlayerFire(r, c)}
                    disabled={cell !== 'empty' || !isMyTurn || !!winner}
                    className={`aspect-square rounded-xl flex items-center justify-center font-bold text-xs transition-all relative overflow-hidden group ${
                      cell === 'hit'
                        ? 'bg-gradient-to-tr from-rose-700 via-orange-600 to-amber-400 text-white shadow-lg ring-2 ring-rose-400 animate-pulse'
                        : cell === 'miss'
                        ? 'bg-slate-800/90 text-sky-300 font-bold border border-sky-900/60'
                        : 'bg-sky-950/60 hover:bg-sky-800/80 border border-sky-900/70 text-sky-500/40 hover:scale-105 active:scale-95'
                    }`}
                  >
                    {cell === 'hit' ? (
                      /* Realistic Fire / Explosion Graphic with Real Glow */
                      <div className="flex flex-col items-center justify-center">
                        <Flame className="w-4 h-4 text-yellow-200 fill-amber-400 animate-bounce" />
                      </div>
                    ) : cell === 'miss' ? (
                      /* Realistic Ocean Water Ripple Splash */
                      <Waves className="w-4 h-4 text-sky-400" />
                    ) : (
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] font-mono text-sky-300">
                        {String.fromCharCode(65 + r)}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div></BoardSurface>

            <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-300">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow" /> Direct Hit
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow" /> Water Splash
              </span>
            </div>
          </div>

          {/* 2. FRIENDLY FLEET DEFENSE COMMAND */}
          <div className="bg-slate-950/85 backdrop-blur-md border-2 border-emerald-500/50 rounded-3xl p-1 sm:p-3 min-w-0 flex flex-col items-center shadow-2xl">
            <div className="flex items-center justify-between w-full mb-3 px-1">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400 uppercase tracking-wider">
                <Shield className="w-4 h-4" /> Friendly Fleet Command
              </div>
              <span className="text-[10px] font-mono text-emerald-300/80 bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-800">
                DEFENSE SECTOR
              </span>
            </div>

            {/* Column Coordinate Labels 1-8 */}
            <BoardSurface name="Eigene Flotte" minBoardWidth={400}><div className="grid grid-cols-8 gap-0.5 sm:gap-1.5 w-full max-w-none mb-1 px-1 text-center font-mono text-[10px] text-emerald-400 font-bold">
              {['1', '2', '3', '4', '5', '6', '7', '8'].map((col) => (
                <div key={col}>{col}</div>
              ))}
            </div>

            {/* Grid 8x8 */}
            <div className="grid grid-cols-8 gap-0.5 sm:gap-1.5 bg-emerald-950/70 p-2.5 rounded-2xl border border-emerald-700/60 shadow-inner w-full max-w-none">
              {playerGrid.map((row, r) =>
                row.map((cell, c) => {
                  const damage = playerDamage[r][c];
                  const hasShip = cell !== 'empty';

                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`aspect-square rounded-xl flex items-center justify-center font-bold text-xs relative overflow-hidden ${
                        damage === 'hit'
                          ? 'bg-gradient-to-tr from-rose-700 via-red-600 to-orange-400 text-white shadow-lg ring-2 ring-rose-400 animate-pulse'
                          : damage === 'miss'
                          ? 'bg-slate-800/80 text-sky-300 font-bold'
                          : hasShip
                          ? 'bg-gradient-to-b from-slate-600 via-slate-700 to-slate-900 border border-slate-400 shadow-md text-emerald-300'
                          : 'bg-slate-950/60 border border-emerald-950/70'
                      }`}
                    >
                      {damage === 'hit' ? (
                        <Flame className="w-4 h-4 text-yellow-200 fill-amber-400 animate-bounce" />
                      ) : damage === 'miss' ? (
                        <Waves className="w-4 h-4 text-sky-400" />
                      ) : hasShip ? (
                        /* Realistic Metallic Warship Hull Rivet Plate */
                        <div className="w-full h-full flex items-center justify-center relative bg-gradient-to-br from-slate-500 via-slate-700 to-slate-900 border border-slate-400/80 rounded-lg shadow-inner">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs" />
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div></BoardSurface>

            <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-300">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-600 border border-slate-400" /> Warship Armor Hull
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Sensor Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
