import { useAuthoritativeGame } from './useAuthoritativeGame';
import { CampaignSelector } from './CampaignSelector';
import { mahjongLevelConfig } from '../../services/mahjongCampaign';
import { initialMahjong, reduceMahjong, chooseMahjongMove } from '../../services/mahjongEngine';
import { initialUserProfile } from '../../data/mockData';
import { multiplayerService } from '../../services/multiplayerService';
import { useAIDifficulty } from './GameArena';
import { useGameTimers } from './useGameTimers';
import React, { useState, useEffect, useRef } from 'react';
import {
  PlacedMahjongTile,
  MahjongLayoutType,
  generateMahjongBoard,
  isTileFree,
  findAvailablePairs,
  canTilesMatch,
} from './mahjong/mahjongData';
import { MahjongTileRenderer } from './mahjong/MahjongTileRenderer';
import { RoomParticipant } from '../../types';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import {
  Sparkles,
  RotateCcw,
  Undo2,
  Lightbulb,
  Shuffle,
  HelpCircle,
  Trophy,
  Flame,
  Clock,
  Eye,
  EyeOff,
  Palette,
  X,
  Users,
  Bot,
  Crown,
  Play,
  Pause,
  Award,
} from 'lucide-react';

interface MahjongGameProps {
  onGameEnd?: (winner: string) => void;
  tableParticipants?: RoomParticipant[];
  currentUserId?: string;
  onActiveTurnChange?: (turnPlayerId: string) => void;
  roomCode?: string;
  isHost?: boolean;
}

interface MatchHistoryEntry {
  tile1Id: string;
  tile2Id: string;
  playerId: string;
  points: number;
}

interface MahjongPlayer {
  id: string;
  name: string;
  color: string;
  isAi: boolean;
  score: number;
  matchedPairsCount: number;
}

export const MahjongGame:React.FC<MahjongGameProps>=({onGameEnd,tableParticipants,currentUserId='user-1',onActiveTurnChange,roomCode,isHost=true})=>{
  const {schedule,repeat,cancelAll}=useGameTimers(),difficulty=useAIDifficulty();
  const participants=tableParticipants?.length?tableParticipants:[{id:currentUserId,name:'Du',avatar:initialUserProfile.avatar,isHost:true,isReady:true,score:0,ping:0}];
  const [localLevel,setLocalLevel]=useState<number|undefined>();
  const [levelTier,setLevelTier]=useState(0),[showLevels,setShowLevels]=useState(false);
  const [levelStars,setLevelStars]=useState<Record<number,number>>(()=>{try{const value=JSON.parse(localStorage.getItem('mahjong_levels_v1_'+currentUserId)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}});
  const [localLayout,setLocalLayout]=useState<MahjongLayoutType>('turtle');
  const game=useAuthoritativeGame({roomCode,userId:currentUserId,engine:'mahjong',initial:()=>initialMahjong(participants,localLayout,Date.now(),localLevel),reduce:reduceMahjong});
  const {state,send}=game;
  const {tiles,layout,players,activePlayerIndex,history,score,combo}=state;
  const levelConfig=state.campaignLevel?mahjongLevelConfig(state.campaignLevel):null;
  const gameMode=players.length>1?'duel':'solo';
  const activePlayer=players[activePlayerIndex];
  const isHumanTurn=game.ready&&!game.pending&&!state.finished&&!activePlayer.isAi&&(roomCode?activePlayer.id===currentUserId:true);
  const [tileTheme,setTileTheme]=useState<'ivory'|'emerald'|'wood'>('ivory');
  const [dimBlocked,setDimBlocked]=useState(true),[isRulesOpen,setIsRulesOpen]=useState(false);
  const [selectedTileId,setSelectedTileId]=useState<string|null>(null),[hintedTileIds,setHintedTileIds]=useState<string[]>([]);
  const [elapsedSeconds,setElapsedSeconds]=useState(0),[zoom,setZoom]=useState(false),[stageWidth,setStageWidth]=useState(960);
  const stage=useRef<HTMLDivElement>(null),reported=useRef(false);
  const availablePairs=findAvailablePairs(tiles),remainingCount=tiles.filter(t=>!t.matched).length,matchedPairsCount=state.history.length;
  const noMovesAlert=!availablePairs.length&&remainingCount>0,isVictoryOpen=state.finished;
  useEffect(()=>{const update=()=>setElapsedSeconds(Math.max(0,Math.floor(((state.finishedAt||Date.now())-state.startedAt)/1000)));update();if(state.finished)return;const timer=repeat(update,1000);return()=>clearInterval(timer);},[state.startedAt,state.finished]);
  useEffect(()=>{onActiveTurnChange?.(activePlayer.id);},[activePlayer.id,onActiveTurnChange]);
  useEffect(()=>{setSelectedTileId(null);if(state.finished&&!reported.current){reported.current=true;const max=Math.max(...players.map(p=>p.score));const winners=players.filter(p=>p.score===max);onGameEnd?.(winners.length>1?'draw':winners[0].id===currentUserId?'player':'opponent');}},[state.revision]);
  useEffect(()=>{if(roomCode||!activePlayer.isAi||state.finished)return;const timer=schedule(()=>{const command=chooseMahjongMove(state,difficulty);if(command)send(command);},650);return()=>clearTimeout(timer);},[state,difficulty,roomCode]);
  useEffect(()=>{if(!stage.current)return;const observer=new ResizeObserver(entries=>setStageWidth(entries[0].contentRect.width));observer.observe(stage.current);return()=>observer.disconnect();},[game.ready]);
  const handleTileClick=(tile:PlacedMahjongTile)=>{
    if(!isHumanTurn||!isTileFree(tile,tiles)||tile.matched)return;
    if(!selectedTileId||selectedTileId===tile.id){setSelectedTileId(selectedTileId===tile.id?null:tile.id);return;}
    const first=tiles.find(t=>t.id===selectedTileId)!;
    if(canTilesMatch(first.definition,tile.definition)){send({type:'MATCH',first:first.id,second:tile.id});setSelectedTileId(null);}else{sound.playError();setSelectedTileId(tile.id);}
  };
  const handleHint=()=>{if(!isHumanTurn||!availablePairs.length||levelConfig&&(state.hintsUsed||0)>=levelConfig.hints)return;setHintedTileIds(availablePairs[0].map(t=>t.id));send({type:'HINT'});schedule(()=>setHintedTileIds([]),3500);};
  const handleUndo=()=>{if(isHumanTurn&&gameMode==='solo')send({type:'UNDO'});};
  const handleShuffle=()=>{if(isHumanTurn)send({type:'SHUFFLE'});};
  const startCampaignLevel=(level:number)=>{reported.current=false;setShowLevels(false);setHintedTileIds([]);setSelectedTileId(null);if(roomCode){send({type:'START_LEVEL',level} as any);}else if(localLevel===level)game.resetLocal();else setLocalLevel(level);};
  useEffect(()=>{if(!state.finished||!state.campaignLevel)return;const seconds=((state.finishedAt||Date.now())-state.startedAt)/1000;const config=mahjongLevelConfig(state.campaignLevel);const stars=1+Number(!(state.hintsUsed||state.shufflesUsed))+Number(!(state.hintsUsed||state.shufflesUsed)&&seconds<=config.parSeconds);setLevelStars(previous=>{const next={...previous,[config.id]:Math.max(previous[config.id]||0,stars)};try{localStorage.setItem('mahjong_levels_v1_'+currentUserId,JSON.stringify(next));}catch{}return next;});},[state.finished,state.campaignLevel]);
  const handleNewGame=(newLayout?:MahjongLayoutType)=>{
    if(!newLayout&&state.campaignLevel){startCampaignLevel(state.campaignLevel);return;}
    if(newLayout)setLocalLevel(undefined);
    if(roomCode){if(!isHost)return;if(newLayout)send({type:'RESET_LAYOUT',layout:newLayout} as any);else multiplayerService.startRound(roomCode);return;}
    cancelAll();reported.current=false;
    if(newLayout&&newLayout!==localLayout)setLocalLayout(newLayout);else game.resetLocal();
  };
  useEffect(()=>{if(!roomCode){reported.current=false;game.resetLocal();}},[localLayout,localLevel]);
  const formatTime=(seconds:number)=>`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
  if(!game.ready)return <p role="status">Mahjong-Spielstand wird geladen …</p>;
  // Board coordinate bounding box calculations for SVG / responsive placement
  const minX = -2;
  const maxX = 30;
  const minY = 0;
  const maxY = 18;

  const boardWidth = maxX - minX;
  const boardHeight = maxY - minY;

  const scale=zoom?1:Math.min(1,Math.max(0.2,(stageWidth-16)/(boardWidth*26+120)));
  return (
    <div className="relative w-full max-w-7xl mx-auto flex flex-col gap-4 text-white">
      <div className="flex flex-wrap gap-2"><button className="p-3 bg-slate-800 rounded-xl" onClick={()=>setShowLevels(!showLevels)} aria-expanded={showLevels}>Levelauswahl · 5 × 10</button><button className="p-3 bg-slate-800 rounded-xl" disabled={Boolean(roomCode&&!isHost)} onClick={()=>handleNewGame(layout)}>Freies Spiel</button></div>
      {showLevels&&<CampaignSelector tier={levelTier} setTier={setLevelTier} stars={levelStars} current={state.campaignLevel} disabled={Boolean(game.pending||roomCode&&!isHost)} onSelect={startCampaignLevel}/>}
      {levelConfig&&<div className="rounded-xl bg-amber-950 border border-amber-600 p-3 text-sm"><strong>{levelConfig.label} · Level {levelConfig.stage}/10</strong><p>{levelConfig.tileCount} Steine · Tipps: {Math.max(0,levelConfig.hints-(state.hintsUsed||0))} · Mischen: {Math.max(0,levelConfig.shuffles-(state.shufflesUsed||0))}</p><p>★ Brett leeren · ★★ ohne Hilfen · ★★★ zusätzlich unter {formatTime(levelConfig.parSeconds)}. Rücknahme im Levelmodus deaktiviert.</p></div>}
      <div className="rounded-xl bg-slate-800 p-3 text-sm" aria-live="polite"><p>{state.finished?'Partie beendet':`${activePlayer.name} ist am Zug`}</p><div className="flex flex-wrap gap-3">{players.map(p=><span key={p.id}>{p.name}: {p.score} Punkte · {p.matchedPairsCount} Paare</span>)}</div></div>
      {game.error&&<p role="alert" className="text-rose-300">{game.error}</p>}
      {game.pending&&<p role="status">Zug wird bestätigt …</p>}
      {/* 1. TOP HEADER & CONTROLS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl backdrop-blur-md">
        {/* Title & Mode */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center font-black text-2xl shadow-lg border border-amber-300/40">
            🀄
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Mahjong</span>
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono">
                  {tiles.length} Steine
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                  Mojang Edition
                </span>
              </h2>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Layout: {layout === 'turtle' ? 'Schildkröte' : layout === 'pyramid' ? 'Pyramide' : 'Festung'}</span>
              <span>•</span>
              <span className={availablePairs.length > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {availablePairs.length} freie Paare
              </span>
            </div>
          </div>
        </div>

        {/* Stats: Score, Remaining, Timer */}
        <div className="flex items-center gap-2 sm:gap-4 bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-xl">
          {/* Score */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Punkte</span>
            <span className="text-sm sm:text-base font-black text-amber-300 font-mono">{score}</span>
          </div>

          <div className="w-px h-6 bg-slate-800" />

          {/* Remaining */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Übrig</span>
            <span className="text-sm sm:text-base font-black text-sky-400 font-mono">{remainingCount}</span>
          </div>

          <div className="w-px h-6 bg-slate-800" />

          {/* Time */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              Zeit
            </span>
            <span className="text-sm sm:text-base font-black text-white font-mono">{formatTime(elapsedSeconds)}</span>
          </div>

          {combo > 1 && (
            <>
              <div className="w-px h-6 bg-slate-800" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-orange-400 flex items-center gap-0.5 animate-pulse">
                  <Flame className="w-3 h-3 fill-current" />
                  Combo
                </span>
                <span className="text-sm sm:text-base font-black text-orange-400 font-mono">x{combo}</span>
              </div>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Hint */}
          <button
            onClick={handleHint}
            disabled={!isHumanTurn||availablePairs.length === 0||Boolean(levelConfig&&(state.hintsUsed||0)>=levelConfig.hints)}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-amber-300 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Freies Paar anzeigen (-25 Punkte)"
          >
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Tipp</span>
          </button>

          {/* Undo */}
          <button
            onClick={handleUndo}
            disabled={!isHumanTurn||gameMode==='duel'||history.length===0||Boolean(levelConfig)}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Letzten Zug rückgängig machen"
          >
            <Undo2 className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Zurück</span>
          </button>

          {/* Shuffle */}
          <button
            disabled={!isHumanTurn||(gameMode==='duel'&&availablePairs.length>0)||Boolean(levelConfig&&(state.shufflesUsed||0)>=levelConfig.shuffles)}
            onClick={handleShuffle}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Übrige Spielsteine neu mischen"
          >
            <Shuffle className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Mischen</span>
          </button>

          {/* Rules */}
          <button
            onClick={() => setIsRulesOpen(true)}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all"
            title="Mahjong-Regeln ansehen"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </button>

          {/* Restart */}
          <button
            disabled={Boolean(roomCode&&!isHost)}
            onClick={() => handleNewGame()}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all"
            title="Neues Spiel starten"
          >
            <RotateCcw className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* 2. SUB-BAR: Layout Selection, Theme Selector, Blocked Dimming Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        {/* Layout Pills */}
        <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 p-1 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Aufbau:</span>
          <button
            disabled={Boolean(roomCode&&!isHost)}
            onClick={() => handleNewGame('turtle')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              layout === 'turtle' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            🐢 Schildkröte
          </button>
          <button
            disabled={Boolean(roomCode&&!isHost)}
            onClick={() => handleNewGame('pyramid')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              layout === 'pyramid' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            🔺 Pyramide
          </button>
          <button
            disabled={Boolean(roomCode&&!isHost)}
            onClick={() => handleNewGame('fortress')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              layout === 'fortress' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            🏰 Festung
          </button>
        </div>

        {/* View & Theme Options */}
        <div className="flex items-center gap-2">
          {/* Dim Blocked Toggle */}
          <button
            onClick={() => setDimBlocked(!dimBlocked)}
            className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded-xl transition-all"
            title="Blockierte Steine abdunkeln"
          >
            {dimBlocked ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
            <span className="text-[11px] font-semibold hidden sm:inline">Blockierte abdunkeln</span>
          </button>

          {/* Theme Selector */}
          <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 p-1 rounded-xl">
            <Palette className="w-3.5 h-3.5 text-amber-400 ml-1.5 mr-0.5" />
            <button
              onClick={() => setTileTheme('ivory')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                tileTheme === 'ivory' ? 'bg-slate-700 text-amber-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Elfenbein
            </button>
            <button
              onClick={() => setTileTheme('emerald')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                tileTheme === 'emerald' ? 'bg-emerald-800 text-emerald-200' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Smaragd
            </button>
            <button
              onClick={() => setTileTheme('wood')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                tileTheme === 'wood' ? 'bg-amber-800 text-amber-200' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Holz
            </button>
          </div>
        </div>
      </div>

      {/* 3. NO MOVES DEADLOCK ALERT BANNER */}
      {noMovesAlert && (
        <div className="bg-rose-950/80 border border-rose-500/60 rounded-2xl p-3 flex items-center justify-between gap-3 text-rose-200 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span className="text-xs font-bold">
              Keine freien Paare mehr auf dem Spielfeld möglich!
            </span>
          </div>
          <button
            disabled={!isHumanTurn||(gameMode==='duel'&&availablePairs.length>0)||Boolean(levelConfig&&(state.shufflesUsed||0)>=levelConfig.shuffles)}
            onClick={handleShuffle}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-md transition-all active:scale-95"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Jetzt mischen</span>
          </button>
        </div>
      )}

      <button type="button" className="self-start px-3 py-2 bg-slate-800 rounded-xl text-sm" onClick={()=>setZoom(value=>!value)}>{zoom?'Ganzes Brett anzeigen':'Steine vergrößern und Brett verschieben'}</button>
      {/* 4. MAIN 3D MAHJONG TABLE CANVAS */}
      <div ref={stage} className="relative w-full rounded-3xl bg-radial from-slate-900 via-slate-950 to-black border border-slate-800/80 p-2 sm:p-6 shadow-2xl overflow-auto min-h-[260px] flex items-start justify-start">
        {/* Felt Table Pattern Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none rounded-3xl" />

        <div style={{width:(boardWidth*26+120)*scale,height:(boardHeight*30+120)*scale,flexShrink:0,position:"relative",margin:"0 auto"}}>
        {/* 3D Stacked Tiles Container */}
        <div
          className="relative select-none"
          style={{
            transform:`scale(${scale})`,transformOrigin:"top left",
            width: `${boardWidth * 26 + 120}px`,
            height: `${boardHeight * 30 + 120}px`,
          }}
        >
          {tiles.map((tile) => {
            if (tile.matched) return null;
            const isFree = isTileFree(tile, tiles);
            const isSelected = selectedTileId === tile.id;
            const isHinted = hintedTileIds.includes(tile.id);

            // Calculate pixel position from grid units
            const posX = (tile.x - minX) * 26 + 40;
            const posY = (tile.y - minY) * 30 + 30;

            return (
              <div
                key={tile.id}
                style={{
                  position: 'absolute',
                  left: `${posX}px`,
                  top: `${posY}px`,
                }}
              >
                <MahjongTileRenderer
                  tile={tile}
                  isFree={isFree}
                  isSelected={isSelected}
                  isHinted={isHinted}
                  onClick={() => handleTileClick(tile)}
                  tileTheme={tileTheme}
                  dimBlocked={dimBlocked}
                />
              </div>
            );
          })}
        </div>
        </div>
      </div>

      {/* 5. VICTORY CELEBRATION MODAL */}
      {isVictoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-4xl mb-4 shadow-inner animate-bounce">
              🀄
            </div>
            {levelConfig&&<p className="text-amber-300 text-3xl" aria-label={`${levelStars[levelConfig.id]||1} Sterne`}>{"★".repeat(levelStars[levelConfig.id]||1)}</p>}
            <h2 className="text-2xl sm:text-3xl font-black text-amber-300 mb-2">
              Mahjong-Meister!
            </h2>
            <p className="text-sm text-slate-300 mb-6">
              Du hast alle <strong className="text-white">{tiles.length} Spielsteine</strong> erfolgreich vom Brett abgeräumt!
            </p>

            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 mb-6 text-xs grid grid-cols-2 gap-3 text-left">
              <div>
                <span className="text-slate-400">Gesamtpunkte:</span>{' '}
                <span className="font-bold text-amber-300 font-mono text-sm">{score}</span>
              </div>
              <div>
                <span className="text-slate-400">Benötigte Zeit:</span>{' '}
                <span className="font-bold text-white font-mono text-sm">{formatTime(elapsedSeconds)}</span>
              </div>
              <div>
                <span className="text-slate-400">Gespielter Aufbau:</span>{' '}
                <span className="font-bold text-white capitalize">{layout}</span>
              </div>
              <div>
                <span className="text-slate-400">Gefundene Paare:</span>{' '}
                <span className="font-bold text-white">{history.length}</span>
              </div>
            </div>

            {levelConfig&&<div className="flex flex-wrap gap-2 mb-3">{levelConfig.stage<10&&<button disabled={Boolean(roomCode&&!isHost)} className="bg-amber-600 p-3 rounded-xl" onClick={()=>startCampaignLevel(levelConfig.id+1)}>Nächstes Level</button>}<button className="bg-slate-700 p-3 rounded-xl" disabled={Boolean(roomCode&&!isHost)} onClick={()=>{handleNewGame(layout);setShowLevels(true);}}>Zur Levelauswahl</button></div>}
            <button
              disabled={Boolean(roomCode&&!isHost)}
            onClick={() => handleNewGame()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl active:scale-95 transition-all"
            >
              Neues Spiel starten
            </button>
          </div>
        </div>
      )}

      {/* 6. OFFICIAL RULES MODAL */}
      {isRulesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-xl w-full shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Offizielle Mahjong (Mojang) Regeln</h3>
              </div>
              <button
                onClick={() => setIsRulesOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs text-slate-300 pr-1 leading-relaxed">
              <div>
                <h4 className="font-bold text-amber-300 text-sm mb-1">1. Das Spielziel</h4>
                <p>
                  Ziel des klassischen Mahjong-Solitaire ist es, alle <strong>144 Spielsteine</strong> paarweise vom Spielfeld abzuräumen.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-amber-300 text-sm mb-1">2. Wann ist ein Stein „frei“?</h4>
                <p>Ein Stein darf nur ausgewählt und gepaart werden, wenn folgende zwei Bedingungen erfüllt sind:</p>
                <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-400">
                  <li><strong>Kein aufliegender Stein:</strong> Es darf kein Stein ganz oder teilweise auf ihm liegen (auf einer höheren Ebene).</li>
                  <li><strong>Mindestens eine Seite frei:</strong> Seine linke <em>oder</em> seine rechte Seite darf nicht durch einen benachbarten Stein blockiert sein.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-amber-300 text-sm mb-1">3. Die 144 Spielsteine</h4>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
                    <span className="font-bold text-white block">🎋 Bambus (1–9):</span>
                    <span className="text-slate-400">Je 4 Steine (36 Steine gesamt). Die 1 ist der traditionelle Spatz.</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
                    <span className="font-bold text-white block">⭕ Kreise (1–9):</span>
                    <span className="text-slate-400">Je 4 Steine (36 Steine gesamt) mit konzentrischen Kreisen.</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
                    <span className="font-bold text-white block">萬 Schriftzeichen (1–9):</span>
                    <span className="text-slate-400">Je 4 Steine (36 Steine gesamt) mit chinesischen Zahlen 1 bis 9.</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
                    <span className="font-bold text-white block">💨 Winde & 🐉 Drachen:</span>
                    <span className="text-slate-400">Ost, Süd, West, Nord (16) + Roter, Grüner & Weißer Drache (12).</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-amber-300 text-sm mb-1">4. Die Sonderpaare: Blumen & Jahreszeiten</h4>
                <p>
                  <strong>🌸 Blumen</strong> (Pflaume, Orchidee, Chrysantheme, Bambus) und <strong>🍁 Jahreszeiten</strong> (Frühling, Sommer, Herbst, Winter) sind Unikate. Jede Blume kann mit <em>jeder</em> anderen Blume kombiniert werden, und jede Jahreszeit mit <em>jeder</em> anderen Jahreszeit!
                </p>
              </div>

              <div>
                <h4 className="font-bold text-amber-300 text-sm mb-1">5. Hilfen: Tipp, Rückgängig & Mischen</h4>
                <p>
                  Solltest du einmal nicht weiterkommen, nutze die <strong>Tipp-Taste</strong>, um ein freies Paar leuchtend hervorzuheben, mache Züge mit <strong>Zurück</strong> ungeschehen oder ordne die Steine mit <strong>Mischen</strong> neu an.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsRulesOpen(false)}
              className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-white transition-all mt-2"
            >
              Alles verstanden
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
