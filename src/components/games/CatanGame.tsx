import type { CatanState } from '../../services/catanEngine';
import { useAuthoritativeGame } from './useAuthoritativeGame';
import { initialCatan, reduceCatan, chooseCatanMove, canCatanSettle, canCatanRoad, catanHarbors, totalResources, resources, type CatanCommand } from '../../services/catanEngine';
import { initialUserProfile } from '../../data/mockData';
import { shuffle } from '../../services/gameAI';
import { useGameTimers } from './useGameTimers';
import React, { useState, useEffect, useRef } from 'react';
import {
  ResourceType,
  ResourceCount,
  DevCardType,
  CatanHex,
  CatanVertex,
  CatanEdge,
  CatanPlayerState,
  CatanGamePhase,
  CatanActionLogItem,
  generateCatanBoard,
  BUILDING_COSTS,
  INITIAL_DEV_CARDS_DECK,
  RESOURCE_COLORS
} from './catan/catanData';
import { CatanBoardRenderer } from './catan/CatanBoardRenderer';
import { ResourceCardBadge, WoodenSettlement, WoodenCity, WoodenRoad, WoodenRobber } from './catan/CatanFigureRenderer';
import { CatanTradeModal } from './catan/CatanTradeModal';
import { RoomParticipant } from '../../types';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import { multiplayerService } from '../../services/multiplayerService';
import {
  Dices,
  RotateCcw,
  Trophy,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Bot,
  Hammer,
  ArrowRightLeft,
  Crown,
  ChevronRight,
  X,
  Swords,
  Award,
  Scroll,
  Coins
} from 'lucide-react';

interface CatanGameProps {
  onGameEnd?: (winner: string) => void;
  tableParticipants?: RoomParticipant[];
  currentUserId?: string;
  onActiveTurnChange?: (turnPlayerId: string) => void;
  roomCode?: string;
  isHost?: boolean;
}

export const CatanGame:React.FC<CatanGameProps>=({onGameEnd,tableParticipants,currentUserId='user-1',onActiveTurnChange,roomCode,isHost=true})=>{
  const {schedule,cancelAll}=useGameTimers();
  const participants=tableParticipants?.length?tableParticipants:[{id:currentUserId,name:'Du',avatar:initialUserProfile.avatar,isHost:true,isReady:true,score:0,ping:0}];
  type Command=CatanCommand&{actor?:string};
  const game=useAuthoritativeGame<CatanState,Command>({roomCode,userId:currentUserId,engine:'catan',initial:()=>initialCatan(participants),reduce:(state,command)=>reduceCatan(state,command,command.actor||currentUserId)});
  const {state,send}=game;
  const {board,players,activePlayerIndex,gamePhase,setupSubStep,lastPlacedVertexId,robberHexId,dice,lastDiceSum,lastRollProducingHexIds}=state;
  const activePlayer=players[activePlayerIndex],localPlayer=players.find(p=>p.id===currentUserId)||players[0];
  const isHumanTurn=!activePlayer.isAi&&activePlayer.id===currentUserId&&game.ready&&!game.pending;
  const isRolling=game.pending;
  const [buildingMode,setActiveBuildingMode]=useState<'settlement'|'city'|'road'|'robber'|null>(null);
  const setup=gamePhase==='SETUP_1'||gamePhase==='SETUP_2';
  const activeBuildingMode=setup?setupSubStep:gamePhase==='ROBBER_MOVE'?'robber':state.freeRoads?'road':buildingMode;
  const [isTradeOpen,setIsTradeOpen]=useState(false),[isRulesOpen,setIsRulesOpen]=useState(false),[isDevCardsOpen,setIsDevCardsOpen]=useState(false);
  const [yearOfPlentySelection,setYearOfPlentySelection]=useState<[ResourceType,ResourceType]>(['wood','brick']);
  const [discardSelection,setDiscardSelection]=useState<Partial<ResourceCount>>({});
  const isYearOfPlentyOpen=isHumanTurn&&state.pendingDev==='yearOfPlenty',isMonopolyOpen=isHumanTurn&&state.pendingDev==='monopoly';
  const robberVictims=players.filter(p=>state.robberVictims.includes(p.id)),isRobberStealModalOpen=isHumanTurn&&robberVictims.length>0;
  const winner=players.find(p=>p.id===state.winner)||null;
  const actionLog=state.log.map((text,index)=>({id:String(index),text,time:'',color:'text-slate-200',icon:'📜'}));
  const currentHarbors=catanHarbors(state,activePlayer);
  const getTotalCards=totalResources;
  const reported=useRef(false);
  useEffect(()=>{onActiveTurnChange?.(activePlayer.id);},[activePlayer.id,onActiveTurnChange]);
  useEffect(()=>{setActiveBuildingMode(null);},[activePlayerIndex,gamePhase]);
  useEffect(()=>{if(winner&&!reported.current){reported.current=true;onGameEnd?.(winner.id===currentUserId?'player':'opponent');}},[winner?.id]);
  useEffect(()=>{if(roomCode)return;const action=chooseCatanMove(state);if(!action)return;const timer=schedule(()=>send({...action.command,actor:action.actor}),400);return()=>clearTimeout(timer);},[state,roomCode]);
  const getHighlightedVertexIds=()=>!isHumanTurn?[]:setup&&setupSubStep==='settlement'||gamePhase==='MAIN_ACTION'&&activeBuildingMode==='settlement'?board.vertices.filter(v=>canCatanSettle(state,v.id,activePlayer,setup)).map(v=>v.id):gamePhase==='MAIN_ACTION'&&activeBuildingMode==='city'?activePlayer.settlements:[];
  const getHighlightedEdgeIds=()=>isHumanTurn&&(setup&&setupSubStep==='road'||gamePhase==='MAIN_ACTION'&&activeBuildingMode==='road')?board.edges.filter(e=>canCatanRoad(state,e.id,activePlayer,setup)).map(e=>e.id):[];
  const getHighlightedHexIds=()=>isHumanTurn&&gamePhase==='ROBBER_MOVE'&&!state.robberVictims.length?board.hexes.filter(h=>h.id!==robberHexId).map(h=>h.id):[];
  const handleVertexClick=(vertex:number)=>{if(isHumanTurn)send({type:activeBuildingMode==='city'?'CITY':'SETTLEMENT',vertex});};
  const handleEdgeClick=(edge:string)=>{if(isHumanTurn)send({type:'ROAD',edge});};
  const handleRollDice=()=>{if(isHumanTurn)send({type:'ROLL'});};
  const handleHexClick=(hex:number)=>{if(isHumanTurn)send({type:'ROBBER',hex});};
  const executeRobberSteal=(victim:string)=>send({type:'STEAL',victim});
  const handleBuyDevCard=()=>send({type:'BUY_DEV'});
  const handlePlayDevCard=(card:DevCardType)=>{setIsDevCardsOpen(false);send({type:'PLAY_DEV',card});};
  const handleConfirmYearOfPlenty=()=>send({type:'PLENTY',choices:yearOfPlentySelection.slice(0,Math.min(2,totalResources(state.bank)))});
  const handleConfirmMonopoly=(resource:ResourceType)=>send({type:'MONOPOLY',resource});
  const handleExecuteBankTrade=(give:ResourceType,_amount:number,get:ResourceType)=>send({type:'BANK',give,get});
  const handleProposeDomesticTrade=(target:string,offer:Partial<ResourceCount>,request:Partial<ResourceCount>)=>{send({type:'TRADE',target,offer,request});return {accepted:true,message:'Angebot gesendet. Der Mitspieler entscheidet über den Handel.'};};
  const handleEndTurn=()=>send({type:'END'});
  const handleRestart=()=>{cancelAll();reported.current=false;if(roomCode)multiplayerService.startRound(roomCode);else game.resetLocal();};
  const discardPlayer=roomCode?localPlayer:players.find(p=>!p.isAi&&state.pendingDiscards[p.id]);
  const discardAmount=discardPlayer?state.pendingDiscards[discardPlayer.id]||0:0;
  if(!game.ready)return <p role="status">Catan-Spielstand wird geladen …</p>;
  return (
    <div className="relative w-full max-w-7xl mx-auto flex flex-col gap-4 text-white">
      {game.error&&<p role="alert" className="text-rose-300">{game.error}</p>}
      {game.pending&&<p role="status" className="text-amber-300">Aktion wird bestätigt …</p>}
      {gamePhase==='ROBBER_DISCARD'&&<div className="border border-amber-500 rounded-xl p-3 text-sm"><p>Sieben gewürfelt: Spieler mit mehr als sieben Rohstoffen müssen die Hälfte abgeben.</p>{discardAmount>0&&discardPlayer&&<form onSubmit={event=>{event.preventDefault();send({type:'DISCARD',cards:discardSelection,actor:discardPlayer.id});setDiscardSelection({});}}><p>{discardPlayer.name}: {discardAmount} Karten auswählen ({totalResources(discardSelection)} ausgewählt)</p><div className="flex flex-wrap gap-2">{resources.map(r=><label key={r} className="flex flex-col">{RESOURCE_COLORS[r].labelDe}<input aria-label={`${RESOURCE_COLORS[r].labelDe} abgeben`} type="number" min={0} max={discardPlayer.resources[r]} value={discardSelection[r]||0} onChange={event=>setDiscardSelection(previous=>({...previous,[r]:Math.min(discardPlayer.resources[r],Math.max(0,Number(event.target.value)||0))}))} className="w-20 p-2 bg-slate-800 rounded-xl"/></label>)}</div><button disabled={totalResources(discardSelection)!==discardAmount||game.pending} className="px-4 py-2 mt-2 bg-amber-600 rounded-xl disabled:opacity-50">Abgeben</button></form>}</div>}
      {state.pendingTrade&&(state.pendingTrade.target===currentUserId||!roomCode)&&<div className="border border-sky-500 rounded-xl p-3 text-sm"><p>Handelsangebot von {players.find(p=>p.id===state.pendingTrade!.from)?.name}</p><p>Du erhältst: {resources.filter(r=>state.pendingTrade!.offer[r]).map(r=>`${state.pendingTrade!.offer[r]} ${RESOURCE_COLORS[r].labelDe}`).join(', ')}.</p><p>Du gibst: {resources.filter(r=>state.pendingTrade!.request[r]).map(r=>`${state.pendingTrade!.request[r]} ${RESOURCE_COLORS[r].labelDe}`).join(', ')}.</p><div className="flex gap-2 mt-2">{[true,false].map(accept=><button key={String(accept)} className="p-2 bg-slate-800 rounded-xl" onClick={()=>send({type:'REPLY_TRADE',accept,actor:state.pendingTrade!.target})}>{accept?'Annehmen':'Ablehnen'}</button>)}</div></div>}
      {/* 1. TOP STATUS BAR: Current Turn, Game Phase, Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shadow-md border border-white/20"
            style={{ backgroundColor: activePlayer?.color || '#f97316' }}
          >
            {activePlayer?.isAi ? '🤖' : '👤'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg">{activePlayer?.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 font-mono text-amber-300">
                {activePlayer?.victoryPoints || 0} / 10 VP
              </span>
              {activePlayer?.hasLongestRoad && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                  🛣️ Straße
                </span>
              )}
              {activePlayer?.hasLargestArmy && (
                <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                  ⚔️ Ritter
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400">
              {gamePhase === 'SETUP_1' && 'Startaufstellung Runde 1 (Siedlung + Straße)'}
              {gamePhase === 'SETUP_2' && 'Startaufstellung Runde 2 (Siedlung + Startrohstoffe)'}
              {gamePhase === 'ROLL' && (isHumanTurn ? 'Du bist am Zug: Bitte würfeln!' : 'Würfelt...')}
              {gamePhase === 'ROBBER_MOVE' && 'Versetze den Räuber auf ein neues Feld!'}
              {gamePhase === 'MAIN_ACTION' && (isHumanTurn ? 'Hauptphase: Bauen, Handeln oder Zug beenden' : 'Baut & handelt...')}
              {gamePhase === 'GAME_OVER' && 'Spiel beendet!'}
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRulesOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold transition-all"
            title="Offizielle Catan-Regeln ansehen"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Regeln</span>
          </button>
          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold transition-all"
            title="Spiel neu starten"
          >
            <RotateCcw className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Neu starten</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN ARENA GRID: Left Players Sidebar, Center SVG Board, Right Action Console & Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Players Roster & VP Tracker (3 cols on lg) */}
        <div className="lg:col-span-2 min-w-0 flex flex-col gap-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-lg">
            <h3 className="text-xs font-black tracking-wider uppercase text-slate-400 mb-2 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Siegpunkte & Siedler
            </h3>
            <div className="flex flex-col gap-2">
              {players.map((p, idx) => {
                const isActive = idx === activePlayerIndex;
                const totalCards = (p as any).resourceTotal ?? getTotalCards(p.resources);
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl p-2.5 border transition-all ${
                      isActive
                        ? 'bg-slate-800/90 border-amber-400/80 shadow-md ring-1 ring-amber-400/50'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full ring-2 ring-white/30"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="text-xs font-bold truncate max-w-[110px]">{p.name}</span>
                        {p.isAi && <Bot className="w-3 h-3 text-slate-400" />}
                      </div>
                      <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 font-mono text-xs px-2 py-0.5 rounded-md font-bold">
                        {p.victoryPoints} VP
                      </div>
                    </div>

                    {/* Stats pills */}
                    <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-300 pt-1 border-t border-slate-800/60">
                      <span title="Rohstoffkarten auf der Hand" className="flex items-center gap-1">
                        🃏 {totalCards}
                      </span>
                      <span title="Gebäude (Siedlungen / Städte)" className="flex items-center gap-1">
                        🏠 {p.settlements.length}/{p.cities.length}
                      </span>
                      <span title="Straßenlänge" className="flex items-center gap-1">
                        🛣️ {p.roads.length}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dice Result Display */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Letzter Wurf</span>
              <div className="text-xl font-black text-amber-300 font-mono">
                {lastDiceSum !== null ? `${lastDiceSum}` : '—'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center font-black text-lg text-white shadow-inner font-mono">
                {dice[0]}
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center font-black text-lg text-white shadow-inner font-mono">
                {dice[1]}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Interactive 720x640 Authentic Hex Board (6 cols on lg) */}
        <div className="order-first lg:order-none lg:col-span-8 min-w-0 flex flex-col items-center">
          <CatanBoardRenderer
            hexes={board.hexes}
            vertices={board.vertices}
            edges={board.edges}
            players={players}
            robberHexId={robberHexId}
            highlightedVertexIds={getHighlightedVertexIds()}
            highlightedEdgeIds={getHighlightedEdgeIds()}
            highlightedHexIds={getHighlightedHexIds()}
            onVertexClick={handleVertexClick}
            onEdgeClick={handleEdgeClick}
            onHexClick={handleHexClick}
            activeBuildingMode={activeBuildingMode}
            lastDiceRollHexIds={lastRollProducingHexIds}
          />

          {isHumanTurn&&<details className="w-full text-sm mt-3"><summary className="cursor-pointer rounded-xl bg-slate-800 p-3">Mögliche Züge als Liste</summary><div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto p-2">{getHighlightedVertexIds().map(id=><button key={id} className="bg-slate-800 p-3 rounded-xl" onClick={()=>handleVertexClick(id)}>Bauplatz {id+1}</button>)}{getHighlightedEdgeIds().map(id=><button key={id} className="bg-slate-800 p-3 rounded-xl" onClick={()=>handleEdgeClick(id)}>Straße {id}</button>)}{getHighlightedHexIds().map(id=><button key={id} className="bg-slate-800 p-3 rounded-xl" onClick={()=>handleHexClick(id)}>Räuber: Feld {id+1}</button>)}</div></details>}
          {/* Prompt banner under board */}
          <div className="mt-2 text-xs text-center text-slate-400 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {gamePhase === 'SETUP_1' && `Runde 1: ${activePlayer.name} platziert Siedlung & Straße`}
            {gamePhase === 'SETUP_2' && `Runde 2: ${activePlayer.name} platziert Siedlung & Straße`}
            {gamePhase === 'ROLL' && `Würfelphase von ${activePlayer.name}`}
            {gamePhase === 'ROBBER_MOVE' && 'Klicke auf ein Zielfeld für den Räuber'}
            {gamePhase === 'MAIN_ACTION' && activeBuildingMode === 'settlement' && 'Klicke auf einen blau leuchtenden Bauplatz für deine Siedlung'}
            {gamePhase === 'MAIN_ACTION' && activeBuildingMode === 'city' && 'Klicke auf eine deiner Siedlungen zum Ausbau zur Stadt'}
            {gamePhase === 'MAIN_ACTION' && activeBuildingMode === 'road' && 'Klicke auf eine freie gepunktete Kante für deine Straße'}
            {gamePhase === 'MAIN_ACTION' && !activeBuildingMode && 'Aktionsphase: Wähle eine Bauaktion, handle oder beende deinen Zug'}
          </div>
        </div>

        {/* Right: Action Console & Live Log (3 cols on lg) */}
        <div className="lg:col-span-2 min-w-0 flex flex-col gap-3">
          {gamePhase==='ROLL'&&isHumanTurn&&<button className="p-3 bg-purple-900 rounded-xl text-sm" onClick={()=>setIsDevCardsOpen(true)}>Entwicklungskarten vor dem Würfeln</button>}
          {/* Active Turn Actions Panel */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-xl">
            <h3 className="text-xs font-black tracking-wider uppercase text-slate-400 mb-2 flex items-center justify-between">
              <span>Aktionen</span>
              {isHumanTurn && <span className="text-[10px] text-emerald-400 font-bold">DEIN ZUG</span>}
            </h3>

            {/* Roll Dice Button (visible in ROLL phase) */}
            {gamePhase === 'ROLL' && (
              <button
                disabled={!isHumanTurn || isRolling}
                onClick={handleRollDice}
                className={`w-full py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                  isHumanTurn
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 active:scale-95 animate-pulse'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Dices className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
                <span>{isRolling ? 'Würfel rollen...' : 'Jetzt Würfeln!'}</span>
              </button>
            )}

            {/* Main Action Controls */}
            {gamePhase === 'MAIN_ACTION' && isHumanTurn && (
              <div className="flex flex-col gap-2">
                {/* Build Road */}
                <button
                  onClick={() => setActiveBuildingMode(activeBuildingMode === 'road' ? null : 'road')}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs font-semibold transition-all ${
                    activeBuildingMode === 'road'
                      ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                      : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🛣️</span>
                    <span>Straße bauen</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">1🌲 1🧱</span>
                </button>

                {/* Build Settlement */}
                <button
                  onClick={() => setActiveBuildingMode(activeBuildingMode === 'settlement' ? null : 'settlement')}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs font-semibold transition-all ${
                    activeBuildingMode === 'settlement'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                      : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🏠</span>
                    <span>Siedlung (+1 VP)</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">1🌲 1🧱 1🐑 1🌾</span>
                </button>

                {/* Build City */}
                <button
                  onClick={() => setActiveBuildingMode(activeBuildingMode === 'city' ? null : 'city')}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs font-semibold transition-all ${
                    activeBuildingMode === 'city'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                      : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🏰</span>
                    <span>Stadt ausbauen (+1 VP netto)</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">2🌾 3⛰️</span>
                </button>

                {/* Trade Button */}
                <button
                  onClick={() => setIsTradeOpen(true)}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                    <span>Rohstoffhandel</span>
                  </div>
                  <span className="text-[10px] text-amber-400">Bank & Mitspieler</span>
                </button>

                {/* Buy Dev Card */}
                <button
                  onClick={handleBuyDevCard}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Scroll className="w-4 h-4 text-purple-400" />
                    <span>Entwicklungskarte</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">1🐑 1🌾 1⛰️</span>
                </button>

                {/* Open Dev Cards Hand */}
                <button
                  onClick={() => setIsDevCardsOpen(true)}
                  className="flex items-center justify-between p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-700/50 text-xs font-semibold text-purple-200 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-300" />
                    <span>Meine Karten</span>
                  </div>
                  <span className="text-[10px] font-bold bg-purple-600/40 px-1.5 py-0.5 rounded">
                    {Object.values(activePlayer.devCards).reduce((a, b) => a + b, 0)}
                  </span>
                </button>

                {/* End Turn Button */}
                <button
                  onClick={handleEndTurn}
                  className="w-full mt-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all text-white"
                >
                  <span>Zug beenden</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {gamePhase === 'MAIN_ACTION' && !isHumanTurn && (
              <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400 gap-2">
                <Bot className="w-6 h-6 text-sky-400 animate-bounce" />
                <span className="text-xs">{activePlayer.name} überlegt den nächsten Spielzug...</span>
              </div>
            )}
          </div>

          {/* Action History Log */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-lg flex flex-col h-56">
            <h4 className="text-xs font-black tracking-wider uppercase text-slate-400 mb-2 flex items-center gap-1.5">
              <Scroll className="w-3.5 h-3.5 text-sky-400" />
              Ereignisprotokoll
            </h4>
            <div className="flex-1 overflow-y-auto space-y-2 text-[11px] pr-1">
              {actionLog.map((log) => (
                <div key={log.id} className="flex items-start gap-1.5 leading-snug">
                  <span className="text-xs select-none">{log.icon || '•'}</span>
                  <div className="flex-1">
                    <span className={log.color || 'text-slate-200'}>{log.text}</span>
                    <span className="text-[9px] text-slate-500 ml-1 font-mono">{log.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM RESOURCE BAR: Active Human Hand Display */}
      {players[0] && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              Mein Rohstoff-Inventar ({localPlayer.name})
            </span>
            <span className="text-xs font-mono text-slate-400">
              Gesamt: {getTotalCards(localPlayer.resources)} Karten
            </span>
          </div>

          <div className="grid grid-cols-5 sm:flex sm:items-center sm:justify-start gap-2 overflow-x-auto pb-1">
            <ResourceCardBadge type="wood" count={localPlayer.resources.wood} size="md" />
            <ResourceCardBadge type="brick" count={localPlayer.resources.brick} size="md" />
            <ResourceCardBadge type="wool" count={localPlayer.resources.wool} size="md" />
            <ResourceCardBadge type="wheat" count={localPlayer.resources.wheat} size="md" />
            <ResourceCardBadge type="ore" count={localPlayer.resources.ore} size="md" />
          </div>
        </div>
      )}

      {/* 4. MODALS */}

      {/* Trade Modal */}
      <CatanTradeModal
        isOpen={isTradeOpen&&isHumanTurn}
        onClose={() => setIsTradeOpen(false)}
        currentPlayer={activePlayer}
        otherPlayers={players.filter((p) => p.id !== activePlayer.id)}
        playerHarborTypes={currentHarbors}
        onExecuteBankTrade={handleExecuteBankTrade}
        onProposeDomesticTrade={handleProposeDomesticTrade}
      />

      {/* Development Cards Modal */}
      {isDevCardsOpen && isHumanTurn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-purple-500/50 rounded-3xl p-5 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Scroll className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-base text-white">Entwicklungskarten</h3>
              </div>
              <button
                onClick={() => setIsDevCardsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              {/* Knights */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                <div>
                  <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                    ⚔️ Ritterkarte ({activePlayer.devCards.knight})
                  </div>
                  <div className="text-[11px] text-slate-400">Versetzt den Räuber & zählt zur Größten Rittermacht</div>
                </div>
                <button
                  disabled={activePlayer.devCards.knight <= 0 || (gamePhase !== 'MAIN_ACTION'&&gamePhase !== 'ROLL')}
                  onClick={() => handlePlayDevCard('knight')}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-xs font-bold transition-all"
                >
                  Ausspielen
                </button>
              </div>

              {/* Road Building */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                <div>
                  <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                    🛣️ Straßenbau ({activePlayer.devCards.roadBuilding})
                  </div>
                  <div className="text-[11px] text-slate-400">Baue sofort 2 kostenlose Straßen</div>
                </div>
                <button
                  disabled={activePlayer.devCards.roadBuilding <= 0 || (gamePhase !== 'MAIN_ACTION'&&gamePhase !== 'ROLL')}
                  onClick={() => handlePlayDevCard('roadBuilding')}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-xs font-bold transition-all"
                >
                  Ausspielen
                </button>
              </div>

              {/* Year of Plenty */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                <div>
                  <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                    🌾 Erfindung / Überfluss ({activePlayer.devCards.yearOfPlenty})
                  </div>
                  <div className="text-[11px] text-slate-400">Nimm 2 beliebige Rohstoffe aus der Bank</div>
                </div>
                <button
                  disabled={activePlayer.devCards.yearOfPlenty <= 0 || (gamePhase !== 'MAIN_ACTION'&&gamePhase !== 'ROLL')}
                  onClick={() => handlePlayDevCard('yearOfPlenty')}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-xs font-bold transition-all"
                >
                  Ausspielen
                </button>
              </div>

              {/* Monopoly */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                <div>
                  <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                    💎 Monopol ({activePlayer.devCards.monopoly})
                  </div>
                  <div className="text-[11px] text-slate-400">Erhalte alle Karten einer Rohstoffart von allen Mitspielern</div>
                </div>
                <button
                  disabled={activePlayer.devCards.monopoly <= 0 || (gamePhase !== 'MAIN_ACTION'&&gamePhase !== 'ROLL')}
                  onClick={() => handlePlayDevCard('monopoly')}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-xs font-bold transition-all"
                >
                  Ausspielen
                </button>
              </div>

              {/* Victory Point Cards */}
              <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-600/40 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-amber-200 flex items-center gap-1.5">
                    🏛️ Siegpunkt-Karten ({activePlayer.devCards.victoryPoint})
                  </div>
                  <div className="text-[11px] text-amber-300/70">Zählen automatisch zu deinen Siegpunkten</div>
                </div>
                <span className="text-xs font-mono font-bold text-amber-300">
                  +{activePlayer.devCards.victoryPoint} VP
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Year of Plenty Picker Modal */}
      {isYearOfPlentyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-5 max-w-sm w-full shadow-2xl text-center">
            <h3 className="font-bold text-lg text-amber-300 mb-1">Jahr des Überflusses</h3>
            <p className="text-xs text-slate-400 mb-4">Wähle 2 kostenlose Rohstoffe aus der Bank</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">1. Rohstoff</label>
                <select
                  value={yearOfPlentySelection[0]}
                  onChange={(e) => setYearOfPlentySelection([e.target.value as ResourceType, yearOfPlentySelection[1]])}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs font-bold text-white"
                >
                  <option value="wood">Holz 🌲</option>
                  <option value="brick">Lehm 🧱</option>
                  <option value="wool">Wolle 🐑</option>
                  <option value="wheat">Getreide 🌾</option>
                  <option value="ore">Erz ⛰️</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">2. Rohstoff</label>
                <select
                  value={yearOfPlentySelection[1]}
                  onChange={(e) => setYearOfPlentySelection([yearOfPlentySelection[0], e.target.value as ResourceType])}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs font-bold text-white"
                >
                  <option value="wood">Holz 🌲</option>
                  <option value="brick">Lehm 🧱</option>
                  <option value="wool">Wolle 🐑</option>
                  <option value="wheat">Getreide 🌾</option>
                  <option value="ore">Erz ⛰️</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleConfirmYearOfPlenty}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg"
            >
              Rohstoffe erhalten
            </button>
          </div>
        </div>
      )}

      {/* Monopoly Picker Modal */}
      {isMonopolyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-5 max-w-sm w-full shadow-2xl text-center">
            <h3 className="font-bold text-lg text-amber-300 mb-1">Monopol-Karte</h3>
            <p className="text-xs text-slate-400 mb-4">Wähle einen Rohstoff. Alle Mitspieler müssen dir alle Karten dieser Art abgeben!</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(['wood', 'brick', 'wool', 'wheat', 'ore'] as ResourceType[]).map((res) => (
                <button
                  key={res}
                  onClick={() => handleConfirmMonopoly(res)}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 border border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>{RESOURCE_COLORS[res].icon}</span>
                  <span>{RESOURCE_COLORS[res].labelDe}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Robber Steal Selection Modal */}
      {isRobberStealModalOpen && robberVictims.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-5 max-w-sm w-full shadow-2xl text-center">
            <h3 className="font-bold text-lg text-rose-400 mb-1">Räuber-Beutezug!</h3>
            <p className="text-xs text-slate-400 mb-4">Wähle einen Mitspieler an diesem Feld, um 1 zufälligen Rohstoff zu stehlen:</p>
            <div className="space-y-2 mb-4">
              {robberVictims.map((v) => (
                <button
                  key={v.id}
                  onClick={() => executeRobberSteal(v.id)}
                  className="w-full p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-between text-xs font-bold transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: v.color }} />
                    <span>{v.name}</span>
                  </div>
                  <span className="text-amber-300 font-mono">{(v as any).resourceTotal ?? getTotalCards(v.resources)} Karten</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Victory Celebration Modal */}
      {winner && gamePhase === 'GAME_OVER' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-center relative overflow-hidden">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-4xl mb-4 shadow-inner">
              👑
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-amber-300 mb-2">
              Sieg auf der Insel Catan!
            </h2>
            <p className="text-sm text-slate-300 mb-6">
              <span className="font-bold text-white text-base">{winner.name}</span> hat mit{' '}
              <span className="text-amber-300 font-black">{winner.victoryPoints} Siegpunkten</span> die Herrschaft über Catan errungen!
            </p>

            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 mb-6 text-xs grid grid-cols-2 gap-3 text-left">
              <div>
                <span className="text-slate-400">Siedlungen:</span>{' '}
                <span className="font-bold text-white">{winner.settlements.length} (x1 VP)</span>
              </div>
              <div>
                <span className="text-slate-400">Städte:</span>{' '}
                <span className="font-bold text-white">{winner.cities.length} (x2 VP)</span>
              </div>
              <div>
                <span className="text-slate-400">Längste Straße:</span>{' '}
                <span className="font-bold text-white">{winner.hasLongestRoad ? 'Ja (+2 VP)' : 'Nein'}</span>
              </div>
              <div>
                <span className="text-slate-400">Größte Rittermacht:</span>{' '}
                <span className="font-bold text-white">{winner.hasLargestArmy ? 'Ja (+2 VP)' : 'Nein'}</span>
              </div>
            </div>

            <button
              onClick={handleRestart}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl active:scale-95 transition-all"
            >
              Revanche spielen
            </button>
          </div>
        </div>
      )}

      {/* Official Catan Rules Guide Modal */}
      {isRulesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-xl w-full shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Offizielle Regeln: Die Siedler von Catan</h3>
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
                <h4 className="font-bold text-amber-300 text-sm mb-1">1. Spielziel & Siegpunkte</h4>
                <p>
                  Wer als erster Spieler <strong>10 Siegpunkte (VP)</strong> erreicht, gewinnt das Spiel:
                </p>
                <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-400">
                  <li>Siedlung = 1 Siegpunkt</li>
                  <li>Stadt = 2 Siegpunkte (erzeugt außerdem doppelte Rohstofferträge!)</li>
                  <li>Längste Handelsstraße (mindestens 5 zusammenhängende Straßen) = 2 Siegpunkte</li>
                  <li>Größte Rittermacht (mindestens 3 ausgespielte Ritterkarten) = 2 Siegpunkte</li>
                  <li>Siegpunkt-Entwicklungskarten = je 1 Siegpunkt</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-amber-300 text-sm mb-1">2. Die Baukosten</h4>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
                    <span className="font-bold text-white block">Straße:</span>
                    <span className="text-slate-400">1 Holz 🌲 + 1 Lehm 🧱</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
                    <span className="font-bold text-white block">Siedlung:</span>
                    <span className="text-slate-400">1 Holz 🌲 + 1 Lehm 🧱 + 1 Wolle 🐑 + 1 Getreide 🌾</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
                    <span className="font-bold text-white block">Stadt:</span>
                    <span className="text-slate-400">2 Getreide 🌾 + 3 Erz ⛰️</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
                    <span className="font-bold text-white block">Entwicklungskarte:</span>
                    <span className="text-slate-400">1 Wolle 🐑 + 1 Getreide 🌾 + 1 Erz ⛰️</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-amber-300 text-sm mb-1">3. Die Abstandsregel</h4>
                <p>
                  Eine Siedlung darf nur auf einer Kreuzung gebaut werden, wenn alle 3 benachbarten Kreuzungen frei von
                  Siedlungen und Städten sind (mindestens 2 Straßenabschnitte Abstand).
                </p>
              </div>

              <div>
                <h4 className="font-bold text-amber-300 text-sm mb-1">4. Der Räuber & die 7</h4>
                <p>
                  Wird eine 7 gewürfelt, erhält kein Feld Rohstoffe. Jeder Spieler mit mehr als 7 Handkarten muss die Hälfte
                  seiner Karten abgeben. Anschließend versetzt der aktive Spieler den Räuber und stiehlt 1 Rohstoff von
                  einem Mitspieler am Zielfeld.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-amber-300 text-sm mb-1">5. Seehandel & Häfen</h4>
                <p>
                  Ohne Hafen kann jeder Spieler 4 gleiche Rohstoffe gegen 1 beliebigen Rohstoff bei der Bank tauschen.
                  Besitzt man eine Siedlung an einem 3:1-Hafen, tauscht man 3:1; an einem Spezialhafen (z.B. Holzhafen)
                  tauscht man diesen Rohstoff sogar 2:1!
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsRulesOpen(false)}
              className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-white transition-all mt-2"
            >
              Verstanden
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
