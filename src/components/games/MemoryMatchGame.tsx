import React, { useState, useEffect } from 'react';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import { RefreshCw, Trophy, Brain, Sparkles, Users, Bot, Wifi } from 'lucide-react';
import { RoomParticipant } from '../../types';
import { AvatarDisplay } from '../avatar/AvatarDisplay';
import { TABLE_BACKGROUNDS, svgToDataUri } from '../../services/gameImages';
import { multiplayerService } from '../../services/multiplayerService';

interface AnimalCard {
  id: number;
  animalId: string;
  name: string;
  photoUrl: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const makeAnimalSvg = (emoji: string, bg: string, label: string) => svgToDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="100%" height="100%" rx="32" fill="${bg}"/>
    <circle cx="100" cy="85" r="55" fill="#ffffff" opacity="0.2"/>
    <text x="100" y="108" font-size="64" text-anchor="middle">${emoji}</text>
    <text x="100" y="165" font-family="sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">${label}</text>
  </svg>
`);

const ANIMALS = [
  { id: 'dog', name: 'Golden Puppy', photoUrl: makeAnimalSvg('🐶', '#f59e0b', 'Welpe') },
  { id: 'cat', name: 'Ginger Cat', photoUrl: makeAnimalSvg('🐱', '#fb923c', 'Kätzchen') },
  { id: 'panda', name: 'Giant Panda', photoUrl: makeAnimalSvg('🐼', '#334155', 'Panda') },
  { id: 'lion', name: 'Lion Cub', photoUrl: makeAnimalSvg('🦁', '#eab308', 'Löwe') },
  { id: 'fox', name: 'Red Fox', photoUrl: makeAnimalSvg('🦊', '#ea580c', 'Fuchs') },
  { id: 'penguin', name: 'Baby Penguin', photoUrl: makeAnimalSvg('🐧', '#0284c7', 'Pinguin') },
  { id: 'rabbit', name: 'Fluffy Bunny', photoUrl: makeAnimalSvg('🐰', '#ec4899', 'Häschen') },
  { id: 'koala', name: 'Koala Bear', photoUrl: makeAnimalSvg('🐨', '#64748b', 'Koala') },
];

interface MemoryMatchGameProps {
  onGameEnd?: (movesOrWinner: any) => void;
  tableParticipants?: RoomParticipant[];
  currentUserId?: string;
  onActiveTurnChange?: (turnPlayerId: string) => void;
  roomCode?: string;
  isHost?: boolean;
}

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({ 
  onGameEnd,
  tableParticipants,
  currentUserId,
  onActiveTurnChange,
  roomCode,
  isHost,
}) => {
  const p1 = tableParticipants?.[0];
  const p2 = tableParticipants?.[1];
  const p1Name = p1?.name || 'Spieler 1';
  const p2Name = p2?.name || (p2?.isBot ? 'Gedächtnis-KI' : 'Spieler 2');
  const isP2Bot = p2 ? !!p2.isBot : true;

  const isOnlineMultiplayer = Boolean(roomCode && p1 && p2 && !p2.isBot);
  const myPlayerNumber: 1 | 2 | null = isOnlineMultiplayer
    ? currentUserId === p1?.id
      ? 1
      : currentUserId === p2?.id
      ? 2
      : null
    : null;

  const [cards, setCards] = useState<AnimalCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [mode, setMode] = useState<'solo' | 'duel'>(() => isOnlineMultiplayer ? 'duel' : (isP2Bot ? 'solo' : 'duel'));
  const [currentTurn, setCurrentTurn] = useState<1 | 2>(1);
  const [scores, setScores] = useState({ p1: 0, p2: 0 });

  const isMyTurn = isOnlineMultiplayer
    ? myPlayerNumber === currentTurn
    : true;

  useEffect(() => {
    if (onActiveTurnChange && mode === 'duel') {
      const activeId = currentTurn === 1 ? (p1?.id || 'p1') : (p2?.id || 'p2');
      onActiveTurnChange(activeId);
    }
  }, [currentTurn, p1?.id, p2?.id, mode, onActiveTurnChange]);

  const generateDeck = (customOrder?: number[]) => {
    const rawPairs = [...ANIMALS, ...ANIMALS];
    let ordered = rawPairs;
    if (customOrder && customOrder.length === 16) {
      ordered = customOrder.map((idx) => rawPairs[idx]);
    } else {
      ordered = rawPairs.sort(() => Math.random() - 0.5);
    }

    return ordered.map((item, index) => ({
      id: index,
      animalId: item.id,
      name: item.name,
      photoUrl: item.photoUrl,
      isFlipped: false,
      isMatched: false,
    }));
  };

  const initGame = (customDeck?: AnimalCard[]) => {
    sound.playCardDeal();
    const deck = customDeck || generateDeck();
    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setMatchedPairs(0);
    setIsLocked(false);
    setGameOver(false);
    setCurrentTurn(1);
    setScores({ p1: 0, p2: 0 });

    if (isOnlineMultiplayer && isHost && roomCode && !customDeck) {
      const order = deck.map((c) => ANIMALS.findIndex((a) => a.id === c.animalId));
      multiplayerService.sendGameAction(roomCode, 'memory', 'SYNC_DECK', {
        deckOrder: order,
      }, currentUserId || 'p1');
    }
  };

  useEffect(() => {
    initGame();
  }, []);

  // WebSocket Multiplayer Synchronization
  useEffect(() => {
    if (!roomCode) return;

    const unsubscribe = multiplayerService.subscribeToGameActions((event) => {
      if (event.gameType !== 'memory' || event.roomCode !== roomCode) return;
      if (event.senderId === currentUserId) return;

      if (event.action === 'SYNC_DECK') {
        const { deckOrder } = event.payload;
        const syncedDeck = generateDeck(deckOrder);
        initGame(syncedDeck);
      } else if (event.action === 'FLIP_CARD') {
        const { index } = event.payload;
        applyCardFlip(index);
      } else if (event.action === 'RESET') {
        initGame();
      }
    });

    return () => unsubscribe();
  }, [roomCode, currentUserId, isHost]);

  const applyCardFlip = (index: number) => {
    setCards((prevCards) => {
      if (prevCards[index].isFlipped || prevCards[index].isMatched) return prevCards;

      sound.playClick();
      const newCards = [...prevCards];
      newCards[index] = { ...newCards[index], isFlipped: true };

      setFlippedIndices((prevFlipped) => {
        const nextFlipped = [...prevFlipped, index];

        if (nextFlipped.length === 2) {
          setMoves((m) => m + 1);
          setIsLocked(true);

          const [firstIdx, secondIdx] = nextFlipped;
          if (newCards[firstIdx].animalId === newCards[secondIdx].animalId) {
            // Match found!
            sound.playReward();
            setTimeout(() => {
              setCards((latestCards) => {
                const updated = [...latestCards];
                updated[firstIdx] = { ...updated[firstIdx], isMatched: true };
                updated[secondIdx] = { ...updated[secondIdx], isMatched: true };
                return updated;
              });
              setFlippedIndices([]);
              setIsLocked(false);
              setMatchedPairs((pairs) => {
                const nextPairs = pairs + 1;
                if (nextPairs === ANIMALS.length) {
                  setGameOver(true);
                  sound.playVictory();
                  try { confetti({ particleCount: 90, spread: 75 }); } catch (e) {}
                  setScores((s) => {
                    const finalP1 = currentTurn === 1 ? s.p1 + 1 : s.p1;
                    const finalP2 = currentTurn === 2 ? s.p2 + 1 : s.p2;
                    const winName = finalP1 >= finalP2 ? p1Name : p2Name;
                    if (onGameEnd) onGameEnd(winName);
                    return { p1: finalP1, p2: finalP2 };
                  });
                }
                return nextPairs;
              });

              setScores((s) => ({
                ...s,
                [currentTurn === 1 ? 'p1' : 'p2']: s[currentTurn === 1 ? 'p1' : 'p2'] + 1,
              }));
            }, 400);
          } else {
            // Not a match, flip back
            setTimeout(() => {
              setCards((latestCards) => {
                const updated = [...latestCards];
                updated[firstIdx] = { ...updated[firstIdx], isFlipped: false };
                updated[secondIdx] = { ...updated[secondIdx], isFlipped: false };
                return updated;
              });
              setFlippedIndices([]);
              setIsLocked(false);
              setCurrentTurn((t) => (t === 1 ? 2 : 1));
            }, 900);
          }
        }

        return nextFlipped;
      });

      return newCards;
    });
  };

  const handleCardClick = (index: number) => {
    if (isLocked || cards[index].isFlipped || cards[index].isMatched) return;
    if (isOnlineMultiplayer && !isMyTurn) {
      sound.playError();
      return;
    }

    if (roomCode) {
      multiplayerService.sendGameAction(roomCode, 'memory', 'FLIP_CARD', {
        index,
      }, currentUserId || 'p1');
    }

    applyCardFlip(index);
  };

  // Bot Turn Automation in Duel mode against Bot
  useEffect(() => {
    if (mode !== 'duel' || currentTurn !== 2 || isOnlineMultiplayer || !isP2Bot || gameOver || isLocked) return;

    const timer = setTimeout(() => {
      const availableIndices = cards
        .map((c, i) => (!c.isFlipped && !c.isMatched ? i : null))
        .filter((i): i is number => i !== null);

      if (availableIndices.length < 2) return;

      const firstPick = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      applyCardFlip(firstPick);

      setTimeout(() => {
        setCards((curCards) => {
          const remaining = curCards
            .map((c, i) => (!c.isFlipped && !c.isMatched && i !== firstPick ? i : null))
            .filter((i): i is number => i !== null);

          if (remaining.length > 0) {
            const secondPick = remaining[Math.floor(Math.random() * remaining.length)];
            applyCardFlip(secondPick);
          }
          return curCards;
        });
      }, 750);
    }, 850);

    return () => clearTimeout(timer);
  }, [mode, currentTurn, isP2Bot, isOnlineMultiplayer, gameOver, isLocked, cards]);

  const resetGame = () => {
    sound.playClick();
    initGame();

    if (roomCode) {
      multiplayerService.sendGameAction(roomCode, 'memory', 'RESET', {}, currentUserId || 'p1');
    }
  };

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto w-full select-none text-slate-100">
      
      {/* Header bar with Player 1, Mode switcher, and Player 2 */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3 sm:p-3.5 rounded-2xl mb-4 text-xs shadow-xl">
        <div className={`flex items-center gap-2 p-1 rounded-xl transition ${currentTurn === 1 && !gameOver ? 'bg-indigo-950/40 ring-1 ring-indigo-500/60' : ''}`}>
          {p1?.avatar ? (
            <AvatarDisplay avatar={p1.avatar} size="sm" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-indigo-500/30 border border-indigo-400 flex items-center justify-center font-bold text-xs text-indigo-300">
              1
            </div>
          )}
          <div>
            <div className="font-bold text-slate-200">{p1Name}</div>
            <div className="text-[11px] text-amber-400 font-mono font-bold">
              {mode === 'duel' ? `${scores.p1} Paare` : `${moves} Züge`}
            </div>
          </div>
        </div>

        {/* Online Indicator / Mode Switch */}
        {isOnlineMultiplayer ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-black">
            <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>ONLINE DUEL</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => { setMode('duel'); initGame(); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                mode === 'duel' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> 2P Duell
            </button>
            <button
              onClick={() => { setMode('solo'); initGame(); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                mode === 'solo' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              <Brain className="w-3.5 h-3.5" /> Solo
            </button>
          </div>
        )}

        <div className={`flex items-center gap-2 p-1 rounded-xl transition ${currentTurn === 2 && !gameOver ? 'bg-rose-950/40 ring-1 ring-rose-500/60' : ''}`}>
          <div className="text-right">
            <div className="font-bold text-slate-200">{p2Name}</div>
            <div className="text-[11px] text-rose-400 font-mono font-bold">{scores.p2} Paare</div>
          </div>
          {p2?.avatar ? (
            <AvatarDisplay avatar={p2.avatar} size="sm" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-rose-500/30 border border-rose-400 flex items-center justify-center font-bold text-xs text-rose-300">
              2
            </div>
          )}
        </div>
      </div>

      {gameOver && (
        <div className="mb-4 text-sm font-bold text-amber-300 flex items-center gap-2 animate-bounce bg-amber-500/10 px-4 py-2 rounded-2xl border border-amber-400/30">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>
            {mode === 'duel'
              ? `${scores.p1 > scores.p2 ? p1Name : scores.p2 > scores.p1 ? p2Name : 'Unentschieden'} hat gewonnen!`
              : `Glückwunsch! In ${moves} Zügen alle Paare gefunden!`}
          </span>
        </div>
      )}

      {/* 4x4 CARD GRID */}
      <div className="relative rounded-3xl p-4 sm:p-6 border-4 border-slate-800 shadow-2xl flex flex-col items-center overflow-hidden bg-slate-950 w-full">
        <img
          src={TABLE_BACKGROUNDS.slateZen}
          alt="Card Table Surface"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.25] contrast-125"
        />

        <div className="relative z-10 grid grid-cols-4 gap-2.5 sm:gap-3.5 w-full aspect-square max-w-sm">
          {cards.map((card, idx) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(idx)}
              disabled={isLocked || card.isFlipped || card.isMatched || (isOnlineMultiplayer && !isMyTurn)}
              className={`relative rounded-2xl transition-all duration-300 transform preserve-3d overflow-hidden ${
                card.isFlipped || card.isMatched
                  ? 'rotate-y-180 ring-2 ring-amber-400/80 shadow-lg'
                  : 'bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 border border-indigo-500/40 hover:-translate-y-1 shadow-md hover:shadow-indigo-500/30 cursor-pointer'
              }`}
            >
              {card.isFlipped || card.isMatched ? (
                <div className="w-full h-full p-1 bg-slate-900 flex items-center justify-center">
                  <img
                    src={card.photoUrl}
                    alt={card.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                  <span className="text-[10px] font-black text-indigo-200/80 tracking-wider">FAM</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={resetGame}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Neu mischen
        </button>
      </div>
    </div>
  );
};
