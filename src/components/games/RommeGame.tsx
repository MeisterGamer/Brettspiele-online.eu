import React, { useState, useEffect } from 'react';
import { 
  RommeCard, 
  RommeMeld, 
  RommePlayer, 
  createRommeDeck, 
  validateMeld, 
  calculateMeldPoints, 
  canAddToTableMeld, 
  canSwapJokerInMeld, 
  RANK_VALUES 
} from './romme/rommeData';
import { RommeCardRenderer } from './romme/RommeCardRenderer';
import { RoomParticipant } from '../../types';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import { multiplayerService } from '../../services/multiplayerService';
import { 
  Trophy, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  Flame, 
  Bot, 
  RefreshCw, 
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';

interface RommeGameProps {
  onGameEnd?: (winner: string) => void;
  tableParticipants?: RoomParticipant[];
  currentUserId?: string;
  onActiveTurnChange?: (turnPlayerId: string) => void;
  roomCode?: string;
  isHost?: boolean;
}

export const RommeGame: React.FC<RommeGameProps> = ({
  onGameEnd,
  tableParticipants,
  currentUserId = 'user-1',
  onActiveTurnChange,
  roomCode,
  isHost = true,
}) => {
  // Preset AI bots for filling empty seats
  const BOT_PRESETS = [
    { name: 'Oma Grete (KI)', color: '#8b5cf6' },
    { name: 'Papa Thomas (KI)', color: '#2563eb' },
    { name: 'Junior Leo (KI)', color: '#10b981' },
    { name: 'Tante Lisa (KI)', color: '#ec4899' },
  ];

  // Initialize Game with 110 French playing cards (13 cards dealt per player)
  const setupInitialGame = () => {
    const fullDeck = createRommeDeck();
    const playersList: RommePlayer[] = [];

    // Current human player
    const userPart = tableParticipants?.find(p => p.id === currentUserId);
    const userHand = fullDeck.splice(0, 13);
    playersList.push({
      id: currentUserId,
      name: userPart?.name || 'Du',
      color: '#f59e0b',
      isAi: false,
      hand: userHand,
      hasMadeInitialMeld: false,
      totalMeldsPoints: 0,
    });

    // Other room participants
    const otherParticipants = (tableParticipants || []).filter(p => p.id !== currentUserId);
    otherParticipants.forEach((part, idx) => {
      if (playersList.length >= 4) return;
      const hand = fullDeck.splice(0, 13);
      playersList.push({
        id: part.id,
        name: part.name,
        color: idx === 0 ? '#3b82f6' : idx === 1 ? '#10b981' : '#ec4899',
        isAi: part.isBot || false,
        hand,
        hasMadeInitialMeld: false,
        totalMeldsPoints: 0,
      });
    });

    // Fill remaining seats with friendly family bots up to 4
    let botIdx = 0;
    while (playersList.length < 4 && botIdx < BOT_PRESETS.length) {
      const preset = BOT_PRESETS[botIdx];
      const hand = fullDeck.splice(0, 13);
      playersList.push({
        id: `bot-${botIdx + 1}`,
        name: preset.name,
        color: preset.color,
        isAi: true,
        hand,
        hasMadeInitialMeld: false,
        totalMeldsPoints: 0,
      });
      botIdx++;
    }

    // 1 card face-up on discard pile to start
    const firstDiscard = fullDeck.splice(0, 1);

    return {
      deck: fullDeck,
      discardPile: firstDiscard,
      players: playersList,
      melds: [] as RommeMeld[],
      currentTurnIndex: 0,
    };
  };

  const initial = setupInitialGame();
  const [deck, setDeck] = useState<RommeCard[]>(initial.deck);
  const [discardPile, setDiscardPile] = useState<RommeCard[]>(initial.discardPile);
  const [players, setPlayers] = useState<RommePlayer[]>(initial.players);
  const [tableMelds, setTableMelds] = useState<RommeMeld[]>(initial.melds);
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);

  // Turn state: 'draw' | 'play'
  const [turnPhase, setTurnPhase] = useState<'draw' | 'play'>('draw');

  // Selected hand cards (multi-select for building Sätze & Folgen)
  const [selectedHandCardIds, setSelectedHandCardIds] = useState<string[]>([]);

  // Selected table meld (for adding cards or swapping Jokers)
  const [selectedMeldId, setSelectedMeldId] = useState<string | null>(null);

  // Winner State
  const [winner, setWinner] = useState<RommePlayer | null>(null);
  const [isHandromme, setIsHandromme] = useState<boolean>(false);

  // Live Game Log
  const [gameLog, setGameLog] = useState<string[]>([
    'Willkommen bei Rommé nach echten Originalregeln! 40 Punkte für die Erstmeldung erforderlich.'
  ]);

  const currentPlayer = players[currentTurnIndex] || players[0];
  const isMyTurn = currentPlayer.id === currentUserId;

  // Sync turn to parent
  useEffect(() => {
    if (onActiveTurnChange && currentPlayer) {
      onActiveTurnChange(currentPlayer.id);
    }
  }, [currentTurnIndex, currentPlayer, onActiveTurnChange]);

  const addLog = (msg: string) => {
    setGameLog(prev => [msg, ...prev.slice(0, 35)]);
  };

  // Selected Cards objects
  const selectedCards = currentPlayer.hand.filter(c => selectedHandCardIds.includes(c.id));
  const validationResult = validateMeld(selectedCards);
  const selectedPoints = validationResult.valid ? calculateMeldPoints(selectedCards) : 0;
  const canMakeInitialMeld = !currentPlayer.hasMadeInitialMeld && validationResult.valid && selectedPoints >= 40;
  const canMakeRegularMeld = currentPlayer.hasMadeInitialMeld && validationResult.valid;

  // --------------------------------------------------------------------------
  // MULTIPLAYER NETWORKING & SYNCHRONIZATION
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!roomCode) return;

    const unsubscribe = multiplayerService.subscribeToGameActions((evt) => {
      if (evt.roomCode !== roomCode || evt.gameType !== 'romme') return;
      if (evt.senderId === currentUserId) return;

      if (evt.action === 'SYNC_STATE') {
        const { state } = evt.payload;
        setPlayers(state.players);
        setTableMelds(state.tableMelds);
        setDeck(state.deck);
        setDiscardPile(state.discardPile);
        setCurrentTurnIndex(state.currentTurnIndex);
        setTurnPhase(state.turnPhase);
      } else if (evt.action === 'DRAW_CARD') {
        const { playerId, fromSource } = evt.payload;
        executeDrawCard(playerId, fromSource, false);
      } else if (evt.action === 'MELD_COMBINATION') {
        const { playerId, cards, meldType, points } = evt.payload;
        executeMeld(playerId, cards, meldType, points, false);
      } else if (evt.action === 'ADD_TO_MELD') {
        const { playerId, meldId, card } = evt.payload;
        executeAddToMeld(playerId, meldId, card, false);
      } else if (evt.action === 'EXCHANGE_JOKER') {
        const { playerId, meldId, card } = evt.payload;
        executeExchangeJoker(playerId, meldId, card, false);
      } else if (evt.action === 'DISCARD_CARD') {
        const { playerId, card, nextIndex } = evt.payload;
        executeDiscardCard(playerId, card, nextIndex, false);
      }
    });

    return () => unsubscribe();
  }, [roomCode, currentUserId]);

  const broadcastAction = (action: string, payload: any) => {
    if (!roomCode) return;
    multiplayerService.sendGameAction(roomCode, 'romme', action, payload, currentUserId);
  };

  // --------------------------------------------------------------------------
  // DRAW PHASE (Talon or Discard Pile)
  // --------------------------------------------------------------------------
  const executeDrawCard = (playerId: string, fromSource: 'talon' | 'discard', broadcast = true) => {
    sound.playCardDeal();

    let drawnCard: RommeCard | null = null;
    let newDeck = [...deck];
    let newDiscard = [...discardPile];

    if (fromSource === 'talon') {
      if (newDeck.length === 0) {
        // Recycle discard pile except top card
        if (newDiscard.length > 1) {
          const top = newDiscard.pop()!;
          newDeck = [...newDiscard];
          // shuffle
          for (let i = newDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
          }
          newDiscard = [top];
          addLog('🔄 Der Talon wurde aus dem Ablagestapel neu gemischt!');
        }
      }
      drawnCard = newDeck.shift() || null;
      setDeck(newDeck);
    } else {
      drawnCard = newDiscard.pop() || null;
      setDiscardPile(newDiscard);
    }

    if (!drawnCard) return;

    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          hand: [...p.hand, drawnCard!],
        };
      }
      return p;
    }));

    setTurnPhase('play');

    const pName = players.find(p => p.id === playerId)?.name || 'Spieler';
    addLog(`📥 ${pName} zieht 1 Karte vom ${fromSource === 'talon' ? 'Talon' : 'Ablagestapel'}.`);

    if (broadcast) {
      broadcastAction('DRAW_CARD', { playerId, fromSource });
    }
  };

  // --------------------------------------------------------------------------
  // MELD COMBINATIONS (Sätze & Folgen)
  // --------------------------------------------------------------------------
  const executeMeld = (
    playerId: string,
    cards: RommeCard[],
    meldType: 'set' | 'run',
    points: number,
    broadcast = true
  ) => {
    sound.playReward();

    const newMeld: RommeMeld = {
      id: `meld_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: meldType,
      cards,
      ownerId: playerId,
    };

    setTableMelds(prev => [...prev, newMeld]);

    // Remove cards from player hand
    const cardIds = cards.map(c => c.id);
    let wonPlayer: RommePlayer | null = null;

    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      const newHand = p.hand.filter(c => !cardIds.includes(c.id));
      const wasInitial = p.hasMadeInitialMeld;

      if (newHand.length === 0) {
        wonPlayer = { ...p, hand: newHand };
        if (!wasInitial) {
          setIsHandromme(true);
        }
      }

      return {
        ...p,
        hand: newHand,
        hasMadeInitialMeld: true,
        totalMeldsPoints: p.totalMeldsPoints + points,
      };
    }));

    const pName = players.find(p => p.id === playerId)?.name || 'Spieler';
    const typeName = meldType === 'set' ? 'Satz' : 'Sequenz';
    addLog(`✨ ${pName} legt ${typeName} (${points} Pkt) aus!`);

    setSelectedHandCardIds([]);

    if (wonPlayer) {
      handleRommeWon(wonPlayer);
      return;
    }

    if (broadcast) {
      broadcastAction('MELD_COMBINATION', { playerId, cards, meldType, points });
    }
  };

  // --------------------------------------------------------------------------
  // ANLEGEN (Append to existing table meld)
  // --------------------------------------------------------------------------
  const executeAddToMeld = (playerId: string, meldId: string, card: RommeCard, broadcast = true) => {
    sound.playChip();

    setTableMelds(prev => prev.map(m => {
      if (m.id === meldId) {
        // Append card in proper order
        const newCards = [...m.cards, card];
        return {
          ...m,
          cards: newCards,
        };
      }
      return m;
    }));

    let wonPlayer: RommePlayer | null = null;

    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      const newHand = p.hand.filter(c => c.id !== card.id);
      if (newHand.length === 0) {
        wonPlayer = { ...p, hand: newHand };
      }
      return {
        ...p,
        hand: newHand,
      };
    }));

    const pName = players.find(p => p.id === playerId)?.name || 'Spieler';
    addLog(`➕ ${pName} legt ${card.rank} an eine Tischfigur an.`);

    setSelectedHandCardIds([]);
    setSelectedMeldId(null);

    if (wonPlayer) {
      handleRommeWon(wonPlayer);
      return;
    }

    if (broadcast) {
      broadcastAction('ADD_TO_MELD', { playerId, meldId, card });
    }
  };

  // --------------------------------------------------------------------------
  // JOKER AUSTAUSCHEN (Joker exchange in table meld)
  // --------------------------------------------------------------------------
  const executeExchangeJoker = (playerId: string, meldId: string, card: RommeCard, broadcast = true) => {
    sound.playSuccess();

    let swappedJoker: RommeCard | null = null;

    setTableMelds(prev => prev.map(m => {
      if (m.id === meldId) {
        const jIdx = m.cards.findIndex(c => c.rank === 'JOKER');
        if (jIdx !== -1) {
          swappedJoker = m.cards[jIdx];
          const newCards = [...m.cards];
          newCards[jIdx] = card;
          return {
            ...m,
            cards: newCards,
          };
        }
      }
      return m;
    }));

    if (swappedJoker) {
      setPlayers(prev => prev.map(p => {
        if (p.id !== playerId) return p;
        // Remove card from hand and take the Joker into hand!
        const handWithoutCard = p.hand.filter(c => c.id !== card.id);
        return {
          ...p,
          hand: [...handWithoutCard, swappedJoker!],
        };
      }));

      const pName = players.find(p => p.id === playerId)?.name || 'Spieler';
      addLog(`🃏 ${pName} tauscht ${card.rank} gegen den JOKER aus!`);

      setSelectedHandCardIds([]);
      setSelectedMeldId(null);

      if (broadcast) {
        broadcastAction('EXCHANGE_JOKER', { playerId, meldId, card });
      }
    }
  };

  // --------------------------------------------------------------------------
  // DISCARD PHASE & END TURN
  // --------------------------------------------------------------------------
  const executeDiscardCard = (playerId: string, card: RommeCard, nextIndex: number, broadcast = true) => {
    sound.playChip();

    setDiscardPile(prev => [...prev, card]);

    let wonPlayer: RommePlayer | null = null;

    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      const newHand = p.hand.filter(c => c.id !== card.id);
      if (newHand.length === 0) {
        wonPlayer = { ...p, hand: newHand };
      }
      return {
        ...p,
        hand: newHand,
      };
    }));

    const pName = players.find(p => p.id === playerId)?.name || 'Spieler';
    addLog(`📤 ${pName} wirft ${card.rank} ab und beendet den Zug.`);

    if (wonPlayer) {
      handleRommeWon(wonPlayer);
      return;
    }

    setCurrentTurnIndex(nextIndex);
    setTurnPhase('draw');
    setSelectedHandCardIds([]);
    setSelectedMeldId(null);

    if (broadcast) {
      broadcastAction('DISCARD_CARD', { playerId, card, nextIndex });
    }
  };

  // --------------------------------------------------------------------------
  // USER ACTIONS
  // --------------------------------------------------------------------------
  const handleToggleCardSelection = (cardId: string) => {
    if (!isMyTurn || winner || turnPhase !== 'play') return;
    sound.playClick();
    setSelectedHandCardIds(prev => 
      prev.includes(cardId) ? prev.filter(x => x !== cardId) : [...prev, cardId]
    );
  };

  // Lay down selected cards as a new meld
  const handleConfirmMeld = () => {
    if (!validationResult.valid || !validationResult.type) {
      sound.playError();
      return;
    }

    if (!currentPlayer.hasMadeInitialMeld && selectedPoints < 40) {
      sound.playError();
      addLog(`⚠️ Für die Erstmeldung werden mindestens 40 Punkte benötigt (aktuell: ${selectedPoints} Pkt).`);
      return;
    }

    executeMeld(currentUserId, selectedCards, validationResult.type, selectedPoints, true);
  };

  // Append 1 card from hand to selected table meld
  const handleAddToMeld = (meld: RommeMeld) => {
    if (!isMyTurn || turnPhase !== 'play' || !currentPlayer.hasMadeInitialMeld) {
      sound.playError();
      return;
    }

    if (selectedCards.length !== 1) {
      sound.playClick();
      setSelectedMeldId(selectedMeldId === meld.id ? null : meld.id);
      return;
    }

    const singleCard = selectedCards[0];
    // Check if can swap Joker
    const swapCheck = canSwapJokerInMeld(singleCard, meld);
    if (swapCheck.canSwap) {
      executeExchangeJoker(currentUserId, meld.id, singleCard, true);
      return;
    }

    // Check if can append
    if (canAddToTableMeld(singleCard, meld)) {
      executeAddToMeld(currentUserId, meld.id, singleCard, true);
    } else {
      sound.playError();
      addLog('❌ Diese Karte passt nicht an die gewählte Figur.');
    }
  };

  // Discard selected card to end turn
  const handleDiscard = () => {
    if (!isMyTurn || turnPhase !== 'play' || selectedCards.length !== 1) {
      sound.playError();
      return;
    }
    const cardToDiscard = selectedCards[0];
    const nextIdx = (currentTurnIndex + 1) % players.length;
    executeDiscardCard(currentUserId, cardToDiscard, nextIdx, true);
  };

  // Sort Hand
  const handleSortBySuit = () => {
    sound.playClick();
    setPlayers(prev => prev.map(p => {
      if (p.id !== currentUserId) return p;
      const sorted = [...p.hand].sort((a, b) => {
        if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
        return RANK_VALUES[a.rank] - RANK_VALUES[b.rank];
      });
      return { ...p, hand: sorted };
    }));
  };

  const handleSortByRank = () => {
    sound.playClick();
    setPlayers(prev => prev.map(p => {
      if (p.id !== currentUserId) return p;
      const sorted = [...p.hand].sort((a, b) => {
        if (RANK_VALUES[a.rank] !== RANK_VALUES[b.rank]) {
          return RANK_VALUES[a.rank] - RANK_VALUES[b.rank];
        }
        return a.suit.localeCompare(b.suit);
      });
      return { ...p, hand: sorted };
    }));
  };

  // --------------------------------------------------------------------------
  // INTELLIGENT AI TURN ENGINE
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isHost || winner) return;
    if (!currentPlayer.isAi) return;

    let timer: any = null;

    const runAi = () => {
      // 1. Draw Phase
      if (turnPhase === 'draw') {
        timer = setTimeout(() => {
          // AI checks top discard card: if useful, take it; else take talon
          executeDrawCard(currentPlayer.id, 'talon', true);
        }, 1000);
        return;
      }

      // 2. Play Phase
      if (turnPhase === 'play') {
        timer = setTimeout(() => {
          const freshPlayer = players[currentTurnIndex];
          if (!freshPlayer) return;

          // Search for combinations in hand
          const hand = [...freshPlayer.hand];
          let madeMeld = false;

          // Check all 3-card and 4-card subsets
          for (let i = 0; i < hand.length - 2; i++) {
            for (let j = i + 1; j < hand.length - 1; j++) {
              for (let k = j + 1; k < hand.length; k++) {
                const sub = [hand[i], hand[j], hand[k]];
                const v = validateMeld(sub);
                if (v.valid && v.type) {
                  const pts = calculateMeldPoints(sub);
                  if (freshPlayer.hasMadeInitialMeld || pts >= 40) {
                    executeMeld(freshPlayer.id, sub, v.type, pts, true);
                    madeMeld = true;
                    break;
                  }
                }
              }
              if (madeMeld) break;
            }
            if (madeMeld) break;
          }

          // If already made initial meld, test appending to table melds
          if (freshPlayer.hasMadeInitialMeld && !madeMeld) {
            for (const c of freshPlayer.hand) {
              for (const m of tableMelds) {
                const swap = canSwapJokerInMeld(c, m);
                if (swap.canSwap) {
                  executeExchangeJoker(freshPlayer.id, m.id, c, true);
                  madeMeld = true;
                  break;
                }
                if (canAddToTableMeld(c, m)) {
                  executeAddToMeld(freshPlayer.id, m.id, c, true);
                  madeMeld = true;
                  break;
                }
              }
              if (madeMeld) break;
            }
          }

          // 3. Discard Phase: AI discards least valuable / duplicate card
          setTimeout(() => {
            const currentHand = players[currentTurnIndex]?.hand;
            if (currentHand && currentHand.length > 0) {
              // Pick card to discard
              const discardCandidate = currentHand[0];
              const nextIndex = (currentTurnIndex + 1) % players.length;
              executeDiscardCard(currentPlayer.id, discardCandidate, nextIndex, true);
            }
          }, 1200);
        }, 1200);
      }
    };

    runAi();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isHost, currentTurnIndex, turnPhase, currentPlayer, winner, tableMelds]);

  // --------------------------------------------------------------------------
  // GAME END & VICTORY
  // --------------------------------------------------------------------------
  const handleRommeWon = (wonPlayer: RommePlayer) => {
    setWinner(wonPlayer);
    sound.playVictory();
    confetti();
    addLog(`👑 ${wonPlayer.name} RUFT ROMMÉ UND GEWINNT DIE PARTIE!`);
    if (onGameEnd) {
      onGameEnd(wonPlayer.name);
    }
  };

  const handleRestart = () => {
    sound.playClick();
    const fresh = setupInitialGame();
    setDeck(fresh.deck);
    setDiscardPile(fresh.discardPile);
    setPlayers(fresh.players);
    setTableMelds(fresh.melds);
    setCurrentTurnIndex(0);
    setTurnPhase('draw');
    setSelectedHandCardIds([]);
    setSelectedMeldId(null);
    setWinner(null);
    setIsHandromme(false);
    setGameLog(['Neues Rommé Spiel gestartet! 40 Punkte für Erstmeldung erforderlich.']);
  };

  const topDiscard = discardPile[discardPile.length - 1];
  const opponents = players.filter(p => p.id !== currentUserId);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center select-none text-white font-sans">
      {/* 1. TOP OPPONENTS BAR */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        {opponents.map(opp => {
          const isOppTurn = opp.id === currentPlayer.id;

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
                    Hand: <span className="font-bold text-amber-400">{opp.hand.length} Karten</span>
                    {opp.hasMadeInitialMeld && ' • ✓ Ausgelegt'}
                  </div>
                </div>
              </div>

              {/* Opponent Card Stack Back */}
              <div className="flex items-center gap-1">
                <div className="relative">
                  <RommeCardRenderer
                    isFaceDown
                    size="sm"
                    stackCount={opp.hand.length}
                    disabled
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. CENTER TABLE AREA (Talon, Discard Pile & Table Melds) */}
      <div className="w-full bg-gradient-to-br from-[#0e3a22] via-[#092516] to-[#04120b] border-2 border-emerald-500/30 rounded-3xl p-3 sm:p-5 shadow-2xl mb-3 flex flex-col justify-between relative overflow-hidden min-h-[300px]">
        {/* Felt Texture */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* Center Header Strip */}
        <div className="relative z-10 flex items-center justify-between pb-2 border-b border-emerald-500/20 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: currentPlayer.color }} />
            <h3 className="font-display font-black text-xs sm:text-sm tracking-wide text-white">
              {isMyTurn 
                ? turnPhase === 'draw' 
                  ? 'Du bist am Zug: Ziehe 1 Karte vom Talon oder Ablagestapel' 
                  : 'Auslegen (>= 40 Pkt), Anlegen oder 1 Karte abwerfen zum Beenden'
                : `${currentPlayer.name} ist am Zug...`}
            </h3>
          </div>

          <div className="text-[11px] font-mono text-emerald-300 font-bold">
            Talon: {deck.length} Karten
          </div>
        </div>

        {/* Talon & Discard Pile in Center */}
        <div className="relative z-10 flex items-center justify-center gap-6 sm:gap-10 py-2">
          {/* Talon (Draw Pile) */}
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <span>Talon (Nachziehen)</span>
            </div>
            <RommeCardRenderer
              isFaceDown
              stackCount={deck.length}
              size="md"
              onClick={() => {
                if (isMyTurn && turnPhase === 'draw') {
                  executeDrawCard(currentUserId, 'talon', true);
                }
              }}
              disabled={!isMyTurn || turnPhase !== 'draw'}
            />
          </div>

          {/* Discard Pile (Ablagestapel) */}
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <span>Ablagestapel</span>
            </div>
            {topDiscard ? (
              <RommeCardRenderer
                card={topDiscard}
                stackCount={discardPile.length}
                size="md"
                onClick={() => {
                  if (isMyTurn && turnPhase === 'draw') {
                    executeDrawCard(currentUserId, 'discard', true);
                  }
                }}
                disabled={!isMyTurn || turnPhase !== 'draw'}
              />
            ) : (
              <div className="w-14 h-21 sm:w-16 sm:h-24 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/50 flex items-center justify-center text-xs text-slate-500">
                Leer
              </div>
            )}
          </div>
        </div>

        {/* Table Melds (Gemeinsame Auslagen: Sätze & Folgen) */}
        <div className="relative z-10 pt-3 border-t border-emerald-500/20">
          <div className="text-[11px] font-black uppercase tracking-wider text-emerald-400 mb-2 flex items-center justify-between">
            <span>Auf dem Tisch ausgelegte Figuren ({tableMelds.length})</span>
            <span className="text-[10px] text-slate-400 font-normal">
              {currentPlayer.hasMadeInitialMeld ? 'Klicke auf eine Figur, um eine Karte anzulegen' : 'Erst nach eigener 40-Pkt-Erstmeldung anlegbar'}
            </span>
          </div>

          {tableMelds.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-400 italic">
              Noch keine Figuren ausgelegt. Sammle Sätze oder Folgen mit mindestens 40 Punkten zur Erstmeldung!
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 max-h-44 overflow-y-auto pr-1">
              {tableMelds.map(meld => {
                const isSelectedMeld = selectedMeldId === meld.id;
                const meldOwner = players.find(p => p.id === meld.ownerId);

                return (
                  <div
                    key={meld.id}
                    onClick={() => handleAddToMeld(meld)}
                    className={`p-2 rounded-2xl border transition-all cursor-pointer ${
                      isSelectedMeld 
                        ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-400/40 shadow-lg' 
                        : 'bg-slate-950/70 border-emerald-600/40 hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1 px-1">
                      <span>{meld.type === 'set' ? 'Satz' : 'Sequenz'}</span>
                      <span className="text-amber-400">{meldOwner?.name}</span>
                    </div>

                    <div className="flex -space-x-4 sm:-space-x-5 overflow-visible py-0.5">
                      {meld.cards.map((c, i) => (
                        <div key={i} className="transform hover:-translate-y-1 transition duration-150">
                          <RommeCardRenderer
                            card={c}
                            size="sm"
                            disabled
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. CURRENT PLAYER AREA (Hand cards, Sorting, Melding, Discarding) */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-3 sm:p-5 shadow-2xl space-y-3">
        {/* Action Controls & Point Tally */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
              Deine Hand ({currentPlayer.hand.length})
            </span>
            <div className="text-xs text-slate-300">
              {currentPlayer.hasMadeInitialMeld ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Erstmeldung geschafft! (Freies Anlegen & Jokertausch aktiv)
                </span>
              ) : (
                <span className="text-amber-400 font-semibold">
                  Erstmeldung: mind. 40 Punkte in Sätzen/Folgen erforderlich
                </span>
              )}
            </div>
          </div>

          {/* Quick Hand Sorting Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSortBySuit}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition flex items-center gap-1 border border-slate-700"
              title="Nach Farben sortieren (Herz, Karo, Kreuz, Pik)"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-sky-400" />
              <span>Nach Farben</span>
            </button>
            <button
              onClick={handleSortByRank}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition flex items-center gap-1 border border-slate-700"
              title="Nach Werten sortieren (2, 3 ... 10, J, Q, K, A)"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
              <span>Nach Werten</span>
            </button>
          </div>
        </div>

        {/* Player Hand Cards Display */}
        <div className="w-full overflow-x-auto py-2">
          <div className="flex items-center justify-start sm:justify-center -space-x-3 sm:-space-x-4 min-h-[95px] sm:min-h-[115px] px-2">
            {currentPlayer.hand.map((card) => {
              const isSelected = selectedHandCardIds.includes(card.id);
              return (
                <div key={card.id} className="relative transform transition-all duration-150">
                  <RommeCardRenderer
                    card={card}
                    size="md"
                    isSelected={isSelected}
                    onClick={() => handleToggleCardSelection(card.id)}
                    disabled={!isMyTurn || turnPhase !== 'play'}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Meld & Discard Action Toolbar */}
        {isMyTurn && turnPhase === 'play' && (
          <div className="p-3 rounded-2xl bg-slate-850 border border-slate-700 flex flex-wrap items-center justify-between gap-2">
            {/* Left: Selected points info */}
            <div className="text-xs">
              <span className="text-slate-400">Ausgewählt ({selectedCards.length} Karten): </span>
              {selectedCards.length > 0 ? (
                validationResult.valid ? (
                  <span className="font-bold text-emerald-400">
                    Gültiger {validationResult.type === 'set' ? 'Satz' : 'Sequenz'} ({selectedPoints} Punkte)
                  </span>
                ) : (
                  <span className="font-semibold text-rose-400">
                    Ungültige Kombination
                  </span>
                )
              ) : (
                <span className="text-slate-500 italic">Klicke Karten zum Auslegen oder Abwerfen an</span>
              )}
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Meld button */}
              {(canMakeInitialMeld || canMakeRegularMeld) && (
                <button
                  onClick={handleConfirmMeld}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Kombination auslegen ({selectedPoints} Pkt)</span>
                </button>
              )}

              {/* Discard & End Turn button */}
              {selectedCards.length === 1 && (
                <button
                  onClick={handleDiscard}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs shadow-lg transition flex items-center gap-1.5"
                >
                  <span>Karte abwerfen & Zug beenden</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}

              {selectedCards.length > 0 && (
                <button
                  onClick={() => setSelectedHandCardIds([])}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs transition"
                >
                  Abwählen
                </button>
              )}
            </div>
          </div>
        )}

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
              {isHandromme ? 'HANDROMMÉ! MEISTERHAFT!' : 'ROMMÉ GEWONNEN!'}
            </h2>
            <p className="text-sm text-slate-300 font-bold mb-6">
              <span className="text-white font-black">{winner.name}</span> hat alle Karten erfolgreich ausgelegt und gewinnt das Spiel!
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
