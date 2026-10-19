import { useGameTimers } from './useGameTimers';
import React, { useState, useEffect, useRef } from 'react';
import { 
  SkipBoCard, 
  SkipBoPlayer, 
  BuildingPile, 
  createOfficialDeck, 
  canPlayOnBuildingPile 
} from './skipbo/skipboData';
import { SkipBoCardRenderer } from './skipbo/SkipBoCardRenderer';
import { RoomParticipant } from '../../types';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import { multiplayerService } from '../../services/multiplayerService';
import { 
  Layers, 
  RotateCcw, 
  Trophy, 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  ChevronRight,
  Flame,
  Bot
} from 'lucide-react';

interface SkipBoGameProps {
  onGameEnd?: (winner: string) => void;
  tableParticipants?: RoomParticipant[];
  currentUserId?: string;
  onActiveTurnChange?: (turnPlayerId: string) => void;
  roomCode?: string;
  isHost?: boolean;
}

type CardSourceType = 'stockpile' | 'hand' | 'discard';

interface SelectedCardInfo {
  source: CardSourceType;
  index: number; // hand index or discard pile index
  card: SkipBoCard;
}

export const SkipBoGame: React.FC<SkipBoGameProps> = ({
  onGameEnd,
  tableParticipants,
  currentUserId = 'user-1',
  onActiveTurnChange,
  roomCode,
  isHost = true,
}) => {
  const { schedule, cancelAll } = useGameTimers();
  // Preset AI bots for filling empty seats
  const BOT_PRESETS = [
    { name: 'Oma Grete (KI)', color: '#8b5cf6' },
    { name: 'Papa Thomas (KI)', color: '#2563eb' },
    { name: 'Junior Leo (KI)', color: '#10b981' },
    { name: 'Tante Lisa (KI)', color: '#ec4899' },
  ];

  // Stockpile size (15 cards for crisp online games, configurable)
  const STOCKPILE_SIZE = 15;

  // Initialize Game State
  const setupInitialGame = () => {
    const deck = createOfficialDeck();
    const playersList: SkipBoPlayer[] = [];

    // Current human user
    const userPart = tableParticipants?.find(p => p.id === currentUserId);
    const userStockpile = deck.splice(0, STOCKPILE_SIZE);
    const userHand = deck.splice(0, 5);

    playersList.push({
      id: currentUserId,
      name: userPart?.name || 'Du',
      color: '#f59e0b',
      isAi: false,
      stockpile: userStockpile,
      hand: userHand,
      discardPiles: [[], [], [], []],
    });

    // Other room participants
    const otherParticipants = (tableParticipants || []).filter(p => p.id !== currentUserId);
    otherParticipants.forEach((part, idx) => {
      if (playersList.length >= 4) return;
      const stock = deck.splice(0, STOCKPILE_SIZE);
      const hand = deck.splice(0, 5);
      playersList.push({
        id: part.id,
        name: part.name,
        color: idx === 0 ? '#3b82f6' : idx === 1 ? '#10b981' : '#ec4899',
        isAi: part.isBot || false,
        stockpile: stock,
        hand,
        discardPiles: [[], [], [], []],
      });
    });

    // Fill remaining seats with friendly family bots up to 4
    let botIdx = 0;
    while (playersList.length < 4 && botIdx < BOT_PRESETS.length) {
      const preset = BOT_PRESETS[botIdx];
      const stock = deck.splice(0, STOCKPILE_SIZE);
      const hand = deck.splice(0, 5);
      playersList.push({
        id: `bot-${botIdx + 1}`,
        name: preset.name,
        color: preset.color,
        isAi: true,
        stockpile: stock,
        hand,
        discardPiles: [[], [], [], []],
      });
      botIdx++;
    }

    // 4 Empty Building Piles in the center
    const initialBuildingPiles: BuildingPile[] = [
      { id: 1, cards: [], currentValue: 0 },
      { id: 2, cards: [], currentValue: 0 },
      { id: 3, cards: [], currentValue: 0 },
      { id: 4, cards: [], currentValue: 0 },
    ];

    return {
      deck,
      discardedCompletedCards: [] as SkipBoCard[],
      players: playersList,
      buildingPiles: initialBuildingPiles,
      currentTurnIndex: 0,
    };
  };

  const initial = setupInitialGame();
  const [deck, setDeck] = useState<SkipBoCard[]>(initial.deck);
  const [completedPilesCards, setCompletedPilesCards] = useState<SkipBoCard[]>([]);
  const [players, setPlayers] = useState<SkipBoPlayer[]>(initial.players);
  const [buildingPiles, setBuildingPiles] = useState<BuildingPile[]>(initial.buildingPiles);
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [selectedCard, setSelectedCard] = useState<SelectedCardInfo | null>(null);
  const [winner, setWinner] = useState<SkipBoPlayer | null>(null);
  const [gameLog, setGameLog] = useState<string[]>([
    'Willkommen bei Skip-Bo! Baue deinen Spielerstapel als Erster ab, um zu gewinnen!'
  ]);
  const [lastCompletedPileId, setLastCompletedPileId] = useState<number | null>(null);

  const currentPlayer = players[currentTurnIndex] || players[0];
  const isMyTurn = currentPlayer.id === currentUserId;

  // Sync turn to parent
  useEffect(() => {
    if (onActiveTurnChange && currentPlayer) {
      onActiveTurnChange(currentPlayer.id);
    }
  }, [currentTurnIndex, currentPlayer, onActiveTurnChange]);

  const addLog = (msg: string) => {
    setGameLog(prev => [msg, ...prev.slice(0, 30)]);
  };

  // Recycle completed cards when deck runs low
  const checkDeckReplenishment = (currentDeck: SkipBoCard[], recycleCards: SkipBoCard[]): SkipBoCard[] => {
    if (currentDeck.length >= 10) return currentDeck;

    // Reshuffle recycleCards
    const newDeck = [...currentDeck, ...recycleCards];
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    setCompletedPilesCards([]);
    addLog('🔄 Der Nachziehstapel wurde mit gemischten Karten neu aufgefüllt!');
    return newDeck;
  };

  // --------------------------------------------------------------------------
  // MULTIPLAYER ACTIONS & BROADCASTING
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!roomCode) return;

    const unsubscribe = multiplayerService.subscribeToGameActions((evt) => {
      if (evt.roomCode !== roomCode || evt.gameType !== 'skip-bo') return;
      if (evt.senderId === currentUserId) return;

      if (evt.action === 'SYNC_STATE') {
        const { state } = evt.payload;
        setPlayers(state.players);
        setBuildingPiles(state.buildingPiles);
        setCurrentTurnIndex(state.currentTurnIndex);
        setDeck(state.deck);
      } else if (evt.action === 'PLAY_TO_BUILD_PILE') {
        const { playerId, source, sourceIndex, buildingPileId, card, assignedValue } = evt.payload;
        executePlayCard(playerId, source, sourceIndex, buildingPileId, card, assignedValue, false);
      } else if (evt.action === 'DISCARD_END_TURN') {
        const { playerId, handIndex, discardPileIndex, card, nextIndex } = evt.payload;
        executeDiscardEndTurn(playerId, handIndex, discardPileIndex, card, nextIndex, false);
      }
    });

    return () => unsubscribe();
  }, [roomCode, currentUserId]);

  const broadcastAction = (action: string, payload: any) => {
    if (!roomCode) return;
    multiplayerService.sendGameAction(roomCode, 'skip-bo', action, payload, currentUserId);
  };

  // --------------------------------------------------------------------------
  // PLAYING CARDS ON BUILDING PILES
  // --------------------------------------------------------------------------
  const executePlayCard = (
    playerId: string,
    source: CardSourceType,
    sourceIndex: number,
    buildingPileId: number,
    card: SkipBoCard,
    assignedVal: number,
    broadcast = true
  ) => {
    sound.playCardDeal();

    // 1. Update building pile
    let pileCompleted = false;
    let newCompletedCards: SkipBoCard[] = [];

    setBuildingPiles(prev => prev.map(pile => {
      if (pile.id === buildingPileId) {
        const playedCardWithVal: SkipBoCard = {
          ...card,
          assignedValue: card.value === 'SKIP-BO' ? assignedVal : undefined,
        };
        const nextVal = pile.currentValue + 1;

        if (nextVal >= 12) {
          // Completed pile (1..12)!
          pileCompleted = true;
          newCompletedCards = [...pile.cards, playedCardWithVal];
          return {
            ...pile,
            cards: [],
            currentValue: 0,
          };
        }

        return {
          ...pile,
          cards: [...pile.cards, playedCardWithVal],
          currentValue: nextVal,
        };
      }
      return pile;
    }));

    if (pileCompleted) {
      sound.playSuccess();
      setLastCompletedPileId(buildingPileId);
      schedule(() => setLastCompletedPileId(null), 1800);
      setCompletedPilesCards(prev => [...prev, ...newCompletedCards]);
      addLog(`✨ Baustapel ${buildingPileId} wurde mit 12 vollendet und abgeräumt!`);
    }

    // 2. Remove card from player source
    let wonPlayer: SkipBoPlayer | null = null;
    let handEmptied = false;

    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;

      let newStock = [...p.stockpile];
      let newHand = [...p.hand];
      let newDiscards = p.discardPiles.map(dp => [...dp]);

      if (source === 'stockpile') {
        newStock.shift(); // remove top card
        if (newStock.length === 0) {
          // Player emptied their stockpile -> WINNER!
          wonPlayer = p;
        }
      } else if (source === 'hand') {
        newHand.splice(sourceIndex, 1);
        if (newHand.length === 0) {
          handEmptied = true;
        }
      } else if (source === 'discard') {
        newDiscards[sourceIndex].pop();
      }

      return {
        ...p,
        stockpile: newStock,
        hand: newHand,
        discardPiles: newDiscards,
      };
    }));

    // If Stockpile emptied -> Player wins!
    if (wonPlayer) {
      handleGameWon(wonPlayer);
      return;
    }

    // Hand-Refill Bonus Rule: if hand emptied during turn, draw 5 new cards immediately!
    if (handEmptied) {
      addLog(`🎁 ${players.find(p => p.id === playerId)?.name} hat alle 5 Handkarten gespielt und zieht 5 neue!`);
      sound.playReward();
      refillHand(playerId, 5);
    }

    const pName = players.find(p => p.id === playerId)?.name || 'Spieler';
    const cardName = card.value === 'SKIP-BO' ? `SKIP-BO (als ${assignedVal})` : `${card.value}`;
    addLog(`🃏 ${pName} legt ${cardName} auf Baustapel ${buildingPileId}.`);

    if (broadcast) {
      broadcastAction('PLAY_TO_BUILD_PILE', {
        playerId,
        source,
        sourceIndex,
        buildingPileId,
        card,
        assignedValue: assignedVal,
      });
    }

    setSelectedCard(null);
  };

  // Refill hand up to count
  const refillHand = (playerId: string, needed: number) => {
    let currentDeck = [...deck];
    if (currentDeck.length < needed) {
      currentDeck = checkDeckReplenishment(currentDeck, completedPilesCards);
    }
    const drawn = currentDeck.splice(0, needed);
    setDeck(currentDeck);

    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          hand: [...p.hand, ...drawn],
        };
      }
      return p;
    }));
  };

  // --------------------------------------------------------------------------
  // DISCARDING CARD & ENDING TURN
  // --------------------------------------------------------------------------
  const executeDiscardEndTurn = (
    playerId: string,
    handIndex: number,
    discardPileIndex: number,
    card: SkipBoCard,
    nextIndex: number,
    broadcast = true
  ) => {
    sound.playChip();

    // 1. Place card onto discard pile
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      const newHand = [...p.hand];
      newHand.splice(handIndex, 1);
      const newDiscards = p.discardPiles.map((dp, i) => 
        i === discardPileIndex ? [...dp, card] : [...dp]
      );
      return {
        ...p,
        hand: newHand,
        discardPiles: newDiscards,
      };
    }));

    const pName = players.find(p => p.id === playerId)?.name || 'Spieler';
    addLog(`📥 ${pName} legt ${card.value} auf Hilfsstapel ${discardPileIndex + 1} ab und beendet den Zug.`);

    // 2. Advance turn
    setCurrentTurnIndex(nextIndex);
    setSelectedCard(null);

    // 3. Next player draws up to 5 hand cards
    const nextPlayer = players[nextIndex];
    if (nextPlayer) {
      const cardsToDraw = 5 - nextPlayer.hand.length;
      if (cardsToDraw > 0) {
        refillHand(nextPlayer.id, cardsToDraw);
      }
    }

    if (broadcast) {
      broadcastAction('DISCARD_END_TURN', {
        playerId,
        handIndex,
        discardPileIndex,
        card,
        nextIndex,
      });
    }
  };

  // --------------------------------------------------------------------------
  // HUMAN PLAYER INTERACTIONS
  // --------------------------------------------------------------------------
  const handleSelectCard = (source: CardSourceType, index: number, card: SkipBoCard) => {
    if (!isMyTurn || winner) return;

    sound.playClick();
    // Toggle selection
    if (selectedCard && selectedCard.source === source && selectedCard.index === index) {
      setSelectedCard(null);
    } else {
      setSelectedCard({ source, index, card });
    }
  };

  // Clicking on a Building Pile
  const handleBuildingPileClick = (pile: BuildingPile) => {
    if (!isMyTurn || !selectedCard || winner) return;

    const { card, source, index } = selectedCard;
    if (canPlayOnBuildingPile(card, pile.currentValue)) {
      const assignedVal = pile.currentValue + 1;
      executePlayCard(currentUserId, source, index, pile.id, card, assignedVal, true);
    } else {
      sound.playError();
    }
  };

  // Clicking on one of personal Discard Piles
  const handleDiscardPileClick = (pileIndex: number) => {
    if (!isMyTurn || !selectedCard || winner) return;

    // Discarding is only allowed from HAND to end turn
    if (selectedCard.source === 'hand') {
      const nextIdx = (currentTurnIndex + 1) % players.length;
      executeDiscardEndTurn(currentUserId, selectedCard.index, pileIndex, selectedCard.card, nextIdx, true);
    } else {
      sound.playError();
    }
  };

  // --------------------------------------------------------------------------
  // INTELLIGENT AI TURN ENGINE
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isHost || winner) return;
    if (!currentPlayer.isAi) return;

    let aiTimeout: any = null;

    const playAiTurn = () => {
      // 1. Ensure AI has 5 cards in hand at start of turn
      const needed = 5 - currentPlayer.hand.length;
      if (needed > 0) {
        refillHand(currentPlayer.id, needed);
      }

      // Step-by-step thinking loop
      const runAiStep = () => {
        const freshPlayer = players[currentTurnIndex];
        if (!freshPlayer || freshPlayer.id !== currentPlayer.id) return;

        // A. Check Stockpile top card FIRST (highest priority!)
        const topStockCard = freshPlayer.stockpile[0];
        if (topStockCard) {
          for (const pile of buildingPiles) {
            if (canPlayOnBuildingPile(topStockCard, pile.currentValue)) {
              const assignedVal = pile.currentValue + 1;
              executePlayCard(freshPlayer.id, 'stockpile', 0, pile.id, topStockCard, assignedVal, true);
              aiTimeout = schedule(runAiStep, 1000);
              return;
            }
          }
        }

        // B. Check Hand cards
        for (let hIdx = 0; hIdx < freshPlayer.hand.length; hIdx++) {
          const hCard = freshPlayer.hand[hIdx];
          for (const pile of buildingPiles) {
            if (canPlayOnBuildingPile(hCard, pile.currentValue)) {
              const assignedVal = pile.currentValue + 1;
              executePlayCard(freshPlayer.id, 'hand', hIdx, pile.id, hCard, assignedVal, true);
              aiTimeout = schedule(runAiStep, 1000);
              return;
            }
          }
        }

        // C. Check Discard piles top cards
        for (let dIdx = 0; dIdx < 4; dIdx++) {
          const dPile = freshPlayer.discardPiles[dIdx];
          if (dPile && dPile.length > 0) {
            const topDCard = dPile[dPile.length - 1];
            for (const pile of buildingPiles) {
              if (canPlayOnBuildingPile(topDCard, pile.currentValue)) {
                const assignedVal = pile.currentValue + 1;
                executePlayCard(freshPlayer.id, 'discard', dIdx, pile.id, topDCard, assignedVal, true);
                aiTimeout = schedule(runAiStep, 1000);
                return;
              }
            }
          }
        }

        // D. No valid plays remaining -> MUST DISCARD 1 CARD FROM HAND TO END TURN!
        if (freshPlayer.hand.length > 0) {
          // Choose card to discard: prefer high cards or cards that don't match stockpile
          const discardCardIndex = 0;
          const cardToDiscard = freshPlayer.hand[discardCardIndex];

          // Pick best discard pile: empty pile or matching pile
          let targetPileIndex = 0;
          const emptyPileIndex = freshPlayer.discardPiles.findIndex(dp => dp.length === 0);
          if (emptyPileIndex !== -1) {
            targetPileIndex = emptyPileIndex;
          } else {
            // Pick pile with smallest length
            let minLen = 999;
            freshPlayer.discardPiles.forEach((dp, idx) => {
              if (dp.length < minLen) {
                minLen = dp.length;
                targetPileIndex = idx;
              }
            });
          }

          const nextTurn = (currentTurnIndex + 1) % players.length;
          executeDiscardEndTurn(freshPlayer.id, discardCardIndex, targetPileIndex, cardToDiscard, nextTurn, true);
        }
      };

      aiTimeout = schedule(runAiStep, 1200);
    };

    playAiTurn();

    return () => {
      if (aiTimeout) clearTimeout(aiTimeout);
    };
  }, [isHost, currentTurnIndex, currentPlayer, winner, buildingPiles]);

  // --------------------------------------------------------------------------
  // GAME END & VICTORY
  // --------------------------------------------------------------------------
  const handleGameWon = (wonPlayer: SkipBoPlayer) => {
    setWinner(wonPlayer);
    sound.playVictory();
    confetti();
    addLog(`🏆 ${wonPlayer.name} hat den gesamten Spielerstapel abgebaut und GEWINNT SKIP-BO!`);
    if (onGameEnd) {
      onGameEnd(wonPlayer.name);
    }
  };

  const handleRestart = () => {
    cancelAll();
    sound.playClick();
    const fresh = setupInitialGame();
    setDeck(fresh.deck);
    setCompletedPilesCards([]);
    setPlayers(fresh.players);
    setBuildingPiles(fresh.buildingPiles);
    setCurrentTurnIndex(0);
    setSelectedCard(null);
    setWinner(null);
    setGameLog(['Neues Skip-Bo Spiel gestartet! Baue deinen Spielerstapel ab!']);
  };

  const myPlayer = players.find(p => p.id === currentUserId) || players[0];
  const opponents = players.filter(p => p.id !== currentUserId);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center select-none text-white font-sans">
      {/* 1. TOP OPPONENTS AREA */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        {opponents.map(opp => {
          const isOppTurn = opp.id === currentPlayer.id;
          const topStock = opp.stockpile[0];

          return (
            <div
              key={opp.id}
              className={`p-2.5 rounded-2xl border transition duration-200 relative overflow-hidden flex items-center justify-between shadow-lg ${
                isOppTurn 
                  ? 'bg-slate-800/95 border-amber-400 ring-2 ring-amber-400/40' 
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              {isOppTurn && (
                <div 
                  className="absolute top-0 left-0 bottom-0 w-1.5"
                  style={{ backgroundColor: opp.color }}
                />
              )}

              {/* Opponent Info */}
              <div className="flex items-center gap-2 pl-1 truncate">
                <div 
                  className="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs border shrink-0 shadow"
                  style={{ backgroundColor: `${opp.color}30`, borderColor: opp.color, color: opp.color }}
                >
                  {opp.isAi ? <Bot className="w-4 h-4" /> : opp.name.substring(0, 1)}
                </div>
                <div className="truncate">
                  <div className="text-xs font-black truncate text-slate-200">{opp.name}</div>
                  <div className="text-[10px] text-slate-400">
                    Stapel: <span className="font-bold text-amber-400">{opp.stockpile.length}</span> • Hand: {opp.hand.length}
                  </div>
                </div>
              </div>

              {/* Opponent Stockpile Top Card & Discard Piles */}
              <div className="flex items-center gap-2">
                {/* 4 Discards preview */}
                <div className="hidden sm:flex gap-1">
                  {opp.discardPiles.map((dp, i) => {
                    const top = dp[dp.length - 1];
                    return (
                      <div key={i} className="w-6 h-8 rounded bg-slate-950/70 border border-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-300">
                        {top ? (top.value === 'SKIP-BO' ? '★' : top.value) : '-'}
                      </div>
                    );
                  })}
                </div>

                {/* Stockpile Top Card */}
                <div className="relative">
                  <SkipBoCardRenderer
                    card={topStock}
                    size="sm"
                    stackCount={opp.stockpile.length}
                    disabled
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. CENTER SHARED ARENA: DRAW PILE & 4 BUILDING PILES */}
      <div className="w-full bg-gradient-to-br from-[#0c2e4e] via-[#081e33] to-[#040f1a] border-2 border-indigo-500/30 rounded-3xl p-3 sm:p-6 shadow-2xl mb-3 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle Felt Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* Center Header */}
        <div className="relative z-10 flex items-center justify-between pb-2 border-b border-indigo-400/20 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: currentPlayer.color }} />
            <h3 className="font-display font-black text-xs sm:text-sm tracking-wide text-white">
              {isMyTurn ? 'Du bist am Zug! Wähle eine Karte zum Ausspielen' : `${currentPlayer.name} ist am Zug...`}
            </h3>
          </div>

          <div className="text-[11px] font-mono text-sky-300 font-bold flex items-center gap-2">
            <span>Nachziehstapel: {deck.length}</span>
            {completedPilesCards.length > 0 && (
              <span className="text-slate-400">({completedPilesCards.length} abgelegt)</span>
            )}
          </div>
        </div>

        {/* Stacks Grid in Center */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 sm:gap-6 py-2">
          {/* Central Draw Pile (Nachziehstapel) */}
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-1">
              Nachziehstapel
            </div>
            <SkipBoCardRenderer
              isFaceDown
              stackCount={deck.length}
              size="md"
              disabled
            />
          </div>

          {/* Vertical Divider */}
          <div className="hidden sm:block w-px h-28 bg-indigo-500/30 mx-2" />

          {/* 4 Shared Building Piles (Baustapel 1 bis 12) */}
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
              4 Gemeinsame Baustapel (1 bis 12)
            </div>
            <div className="grid grid-cols-4 gap-2 sm:gap-4">
              {buildingPiles.map(pile => {
                const topCard = pile.cards[pile.cards.length - 1];
                const canPlaySelected = selectedCard ? canPlayOnBuildingPile(selectedCard.card, pile.currentValue) : false;
                const isJustCompleted = lastCompletedPileId === pile.id;

                return (
                  <div
                    key={pile.id}
                    onClick={() => handleBuildingPileClick(pile)}
                    className="flex flex-col items-center"
                  >
                    <div 
                      className={`relative rounded-xl sm:rounded-2xl transition-all duration-200 ${
                        canPlaySelected && isMyTurn ? 'cursor-pointer transform hover:scale-105' : ''
                      }`}
                    >
                      {topCard ? (
                        <SkipBoCardRenderer
                          card={topCard}
                          size="md"
                          stackCount={pile.cards.length}
                          isPlayable={canPlaySelected && isMyTurn}
                        />
                      ) : (
                        // Empty slot awaiting 1 or SKIP-BO
                        <div 
                          className={`w-14 h-20 sm:w-18 sm:h-26 rounded-xl sm:rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                            canPlaySelected && isMyTurn 
                              ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_20px_rgba(52,211,153,0.5)] cursor-pointer' 
                              : 'border-slate-700 bg-slate-900/60 text-slate-500'
                          }`}
                        >
                          <span className="text-[11px] sm:text-xs font-black font-display text-sky-400">START</span>
                          <span className="text-xs sm:text-sm font-black text-white">1</span>
                          <span className="text-[8px] text-slate-400">oder Joker</span>
                        </div>
                      )}

                      {/* Completed celebration banner */}
                      {isJustCompleted && (
                        <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-amber-500/90 flex items-center justify-center text-center p-1 font-black text-slate-950 text-xs animate-bounce z-20">
                          12! VOLL!
                        </div>
                      )}
                    </div>

                    <span className="text-[9px] font-mono text-slate-400 mt-1">
                      {pile.currentValue > 0 ? `Wert: ${pile.currentValue}` : 'Frei'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. CURRENT PLAYER AREA (Stockpile, Hand Cards, 4 Discard Piles) */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-3 sm:p-5 shadow-2xl space-y-4">
        {/* Sub-header with instructions */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
              Dein Bereich
            </div>
            <span className="text-xs text-slate-400">
              {selectedCard 
                ? 'Klicke auf einen Baustapel (zum Ausspielen) oder einen Hilfsstapel (um mit Ablage den Zug zu beenden)'
                : 'Wähle eine Karte von deinem Spielerstapel, deiner Hand oder deinen Hilfsstapeln'}
            </span>
          </div>

          {selectedCard && (
            <button
              onClick={() => setSelectedCard(null)}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Abwählen
            </button>
          )}
        </div>

        {/* Player Layout: Left = Stockpile, Middle = Hand Cards, Right = 4 Discard Piles */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Left Column: Player Stockpile (Spielerstapel) */}
          <div className="lg:col-span-3 bg-slate-850/80 p-3 rounded-2xl border border-slate-700/80 flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                Spielerstapel
              </span>
              <span className="text-xs font-mono font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Noch {myPlayer.stockpile.length}
              </span>
            </div>

            <div className="py-1">
              {myPlayer.stockpile.length > 0 ? (
                <SkipBoCardRenderer
                  card={myPlayer.stockpile[0]}
                  size="md"
                  stackCount={myPlayer.stockpile.length}
                  isSelected={selectedCard?.source === 'stockpile'}
                  onClick={() => handleSelectCard('stockpile', 0, myPlayer.stockpile[0])}
                  disabled={!isMyTurn}
                />
              ) : (
                <div className="w-14 h-20 sm:w-18 sm:h-26 rounded-2xl border-2 border-emerald-400 bg-emerald-500/20 flex flex-col items-center justify-center text-emerald-300 font-bold text-xs">
                  <span>LEER!</span>
                  <Trophy className="w-5 h-5 text-amber-400 mt-1 animate-bounce" />
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 text-center mt-1">
              Ziel: Diesen Stapel als Erster komplett leeren!
            </span>
          </div>

          {/* Center Column: Hand Cards (5 cards) */}
          <div className="lg:col-span-5 bg-slate-850/80 p-3 rounded-2xl border border-slate-700/80 flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-sky-400">
                Deine Handkarten ({myPlayer.hand.length})
              </span>
              <span className="text-[10px] text-slate-400">
                {myPlayer.hand.length === 0 ? 'Leer! +5 neue Karten' : 'Karten 1 bis 12 anlegen'}
              </span>
            </div>

            <div className="mobile-card-hand flex w-full min-w-0 max-w-full overflow-x-auto items-center justify-start gap-1.5 sm:gap-2.5 py-1 min-h-[120px] sm:min-h-[130px]">
              {myPlayer.hand.map((card, idx) => (
                <SkipBoCardRenderer
                  key={card.id}
                  card={card}
                  size="md"
                  isSelected={selectedCard?.source === 'hand' && selectedCard.index === idx}
                  onClick={() => handleSelectCard('hand', idx, card)}
                  disabled={!isMyTurn}
                />
              ))}
              {myPlayer.hand.length === 0 && (
                <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Alle Handkarten gespielt! Ziehe 5 neue Karten...</span>
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 text-center mt-1">
              Lege eine Handkarte auf einen Hilfsstapel, um deinen Zug zu beenden.
            </span>
          </div>

          {/* Right Column: 4 Personal Discard Piles (Hilfsstapel) */}
          <div className="lg:col-span-4 bg-slate-850/80 p-3 rounded-2xl border border-slate-700/80 flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-300">
                Deine 4 Hilfsstapel
              </span>
              <span className="text-[10px] text-slate-400">
                Ablage = Zugende
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 py-1">
              {myPlayer.discardPiles.map((pile, pIdx) => {
                const topCard = pile[pile.length - 1];
                const isSelectedThis = selectedCard?.source === 'discard' && selectedCard.index === pIdx;
                const canDiscardHere = selectedCard?.source === 'hand';

                return (
                  <div
                    key={pIdx}
                    onClick={() => {
                      if (canDiscardHere) {
                        handleDiscardPileClick(pIdx);
                      } else if (topCard) {
                        handleSelectCard('discard', pIdx, topCard);
                      }
                    }}
                    className={`flex flex-col items-center cursor-pointer transition-all ${
                      canDiscardHere ? 'transform hover:scale-105' : ''
                    }`}
                  >
                    {topCard ? (
                      <SkipBoCardRenderer
                        card={topCard}
                        size="md"
                        stackCount={pile.length}
                        isSelected={isSelectedThis}
                        disabled={!isMyTurn}
                      />
                    ) : (
                      <div 
                        className={`w-14 h-20 sm:w-18 sm:h-26 rounded-xl sm:rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                          canDiscardHere && isMyTurn 
                            ? 'border-indigo-400 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                            : 'border-slate-700 bg-slate-900/60 text-slate-500'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-slate-400">Ablage</span>
                        <span className="text-xs font-black text-slate-300">{pIdx + 1}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <span className="text-[10px] text-slate-400 text-center mt-1">
              Nur die oberste Karte jedes Hilfsstapels kann gespielt werden.
            </span>
          </div>
        </div>

        {/* Live Game Log */}
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 max-h-24 overflow-y-auto space-y-1">
          {gameLog.map((log, i) => (
            <div key={i} className="leading-snug">
              {log}
            </div>
          ))}
        </div>
      </div>

      {/* 4. VICTORY FANFARE MODAL */}
      {winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-gradient-to-b from-amber-950/80 to-slate-900 border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(245,158,11,0.4)] text-center text-white">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-amber-300 mb-1">
              SKIP-BO CHAMPION!
            </h2>
            <p className="text-sm text-slate-300 font-bold mb-6">
              <span className="text-white font-black">{winner.name}</span> hat den gesamten Spielerstapel abgebaut und gewinnt die Skip-Bo Runde!
            </p>
            <button
              onClick={handleRestart}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl transition"
            >
              Neues Spiel starten
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
