import React, { useState, useEffect } from 'react';
import { sound } from '../../services/sound';
import confetti from 'canvas-confetti';
import { RefreshCw, Trophy, Brain, Sparkles, Users, Bot } from 'lucide-react';
import { RoomParticipant } from '../../types';
import { AvatarDisplay } from '../avatar/AvatarDisplay';

interface AnimalCard {
  id: number;
  animalId: string;
  name: string;
  photoUrl: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const ANIMALS = [
  { id: 'dog', name: 'Golden Puppy', photoUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80' },
  { id: 'cat', name: 'Ginger Cat', photoUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80' },
  { id: 'panda', name: 'Giant Panda', photoUrl: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&w=400&q=80' },
  { id: 'lion', name: 'Lion Cub', photoUrl: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=400&q=80' },
  { id: 'fox', name: 'Red Fox', photoUrl: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=400&q=80' },
  { id: 'penguin', name: 'Baby Penguin', photoUrl: 'https://images.unsplash.com/photo-1598439210625-5067c578f3f6?auto=format&fit=crop&w=400&q=80' },
  { id: 'rabbit', name: 'Fluffy Bunny', photoUrl: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=400&q=80' },
  { id: 'koala', name: 'Koala Bear', photoUrl: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?auto=format&fit=crop&w=400&q=80' },
];

interface MemoryMatchGameProps {
  onGameEnd?: (movesOrWinner: any) => void;
  tableParticipants?: RoomParticipant[];
  currentUserId?: string;
  onActiveTurnChange?: (turnPlayerId: string) => void;
}

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({ 
  onGameEnd,
  tableParticipants,
  currentUserId,
  onActiveTurnChange
}) => {
  const p1 = tableParticipants?.[0];
  const p2 = tableParticipants?.[1];
  const p1Name = p1?.name || 'Spieler 1';
  const p2Name = p2?.name || (p2?.isBot ? 'Gedächtnis-KI' : 'Spieler 2');

  const [cards, setCards] = useState<AnimalCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [mode, setMode] = useState<'solo' | 'duel'>('duel');
  const [currentTurn, setCurrentTurn] = useState<1 | 2>(1);
  const [scores, setScores] = useState({ p1: 0, p2: 0 });

  useEffect(() => {
    if (onActiveTurnChange && mode === 'duel') {
      const activeId = currentTurn === 1 ? (p1?.id || 'p1') : (p2?.id || 'p2');
      onActiveTurnChange(activeId);
    }
  }, [currentTurn, p1?.id, p2?.id, mode, onActiveTurnChange]);

  const initGame = () => {
    sound.playCardDeal();
    const deck: AnimalCard[] = [...ANIMALS, ...ANIMALS]
      .sort(() => Math.random() - 0.5)
      .map((item, index) => ({
        id: index,
        animalId: item.id,
        name: item.name,
        photoUrl: item.photoUrl,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setMatchedPairs(0);
    setIsLocked(false);
    setGameOver(false);
    setCurrentTurn(1);
    setScores({ p1: 0, p2: 0 });
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCardClick = (index: number) => {
    if (isLocked || cards[index].isFlipped || cards[index].isMatched) return;

    sound.playClick();
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      setIsLocked(true);

      const [firstIdx, secondIdx] = newFlipped;
      if (cards[firstIdx].animalId === cards[secondIdx].animalId) {
        // Real match! Current player scores and keeps turn
        sound.playReward();
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[firstIdx].isMatched = true;
            updated[secondIdx].isMatched = true;
            return updated;
          });
          setFlippedIndices([]);
          setIsLocked(false);
          const pairs = matchedPairs + 1;
          setMatchedPairs(pairs);
          setScores((s) => ({
            ...s,
            [currentTurn === 1 ? 'p1' : 'p2']: s[currentTurn === 1 ? 'p1' : 'p2'] + 1,
          }));

          if (pairs === ANIMALS.length) {
            setGameOver(true);
            sound.playVictory();
            try {
              confetti({ particleCount: 90, spread: 75 });
            } catch (e) {}
            if (onGameEnd) {
              const winnerName = scores.p1 >= scores.p2 ? p1Name : p2Name;
              onGameEnd(winnerName);
            }
          }
        }, 350);
      } else {
        // Not a match, flip back and pass turn
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[firstIdx].isFlipped = false;
            updated[secondIdx].isFlipped = false;
            return updated;
          });
          setFlippedIndices([]);
          setIsLocked(false);
          if (mode === 'duel') {
            setCurrentTurn((t) => (t === 1 ? 2 : 1));
          }
        }, 900);
      }
    }
  };

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto w-full select-none text-slate-100">
      
      {/* Header bar with Player 1, Mode switcher, and Player 2 */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3 sm:p-3.5 rounded-2xl mb-4 text-xs shadow-xl">
        <div className={`flex items-center gap-2 p-1 rounded-xl transition ${currentTurn === 1 && mode === 'duel' && !gameOver ? 'bg-indigo-950/40 ring-1 ring-indigo-500/60' : ''}`}>
          {p1?.avatar ? (
            <AvatarDisplay avatar={p1.avatar} size="sm" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-indigo-500/30 border border-indigo-400 flex items-center justify-center font-bold text-xs text-indigo-300">
              1
            </div>
          )}
          <div>
            <div className="font-bold text-slate-200">{p1Name}</div>
            <div className="text-[11px] text-amber-400 font-mono">
              {mode === 'duel' ? `${scores.p1} Paare` : `${moves} Züge`}
            </div>
          </div>
        </div>

        {/* Mode Toggle */}
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

        {mode === 'duel' ? (
          <div className={`flex items-center gap-2 p-1 rounded-xl transition ${currentTurn === 2 && !gameOver ? 'bg-rose-950/40 ring-1 ring-rose-500/60' : ''}`}>
            <div className="text-right">
              <div className="font-bold text-slate-200">{p2Name}</div>
              <div className="text-[11px] text-rose-400 font-mono">{scores.p2} Paare</div>
            </div>
            {p2?.avatar ? (
              <AvatarDisplay avatar={p2.avatar} size="sm" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-rose-500/30 border border-rose-400 flex items-center justify-center font-bold text-xs text-rose-300">
                2
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <span>Paare:</span>
            <span className="font-mono text-emerald-400 font-bold">{matchedPairs}/{ANIMALS.length}</span>
          </div>
        )}
      </div>

      {gameOver && (
        <div className="mb-3 text-sm font-bold text-amber-300 flex items-center gap-2 animate-bounce bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-2xl">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span>
            {mode === 'duel'
              ? scores.p1 > scores.p2
                ? `🏆 ${p1Name} gewinnt mit ${scores.p1} Paaren!`
                : scores.p2 > scores.p1
                ? `🏆 ${p2Name} gewinnt mit ${scores.p2} Paaren!`
                : `Unentschieden! Beide haben ${scores.p1} Paare!`
              : `Großartig! Alle ${ANIMALS.length} Paare in ${moves} Zügen gefunden!`}
          </span>
        </div>
      )}

      {/* 4x4 Real Photographic Cards Grid with Table Backdrop */}
      <div className="relative p-4 sm:p-5 rounded-3xl border-4 border-emerald-950 w-full shadow-2xl overflow-hidden bg-slate-950">
        {/* Real Tabletop Background Photo Texture */}
        <img
          src="https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&w=800&q=80"
          alt="Table Mat"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.25] contrast-125"
        />
        <div className="absolute inset-0 bg-emerald-950/40 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-4 gap-2.5 sm:gap-3 w-full">
          {cards.map((card, idx) => {
            const isRevealed = card.isFlipped || card.isMatched;

            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(idx)}
                className={`aspect-square rounded-2xl overflow-hidden relative transition-all duration-300 border-2 shadow-xl group ${
                  card.isMatched
                    ? 'border-emerald-400 ring-2 ring-emerald-400/80 scale-[0.98]'
                    : isRevealed
                    ? 'border-amber-400 ring-2 ring-amber-300 shadow-amber-500/30'
                    : 'border-amber-500/40 bg-slate-900 hover:border-amber-300 hover:scale-105'
                }`}
                style={{
                  boxShadow: '0 8px 12px rgba(0,0,0,0.6)'
                }}
              >
                {isRevealed ? (
                  /* Real Animal High-Res Photograph */
                  <div className="w-full h-full relative">
                    <img
                      src={card.photoUrl}
                      alt={card.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                    <span className="absolute bottom-1 inset-x-1 text-[9px] sm:text-[10px] font-bold text-white text-center truncate drop-shadow">
                      {card.name}
                    </span>
                    {card.isMatched && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center text-[10px] font-black shadow ring-1 ring-white">
                        ✓
                      </span>
                    )}
                  </div>
                ) : (
                  /* Luxury Gold-Foil Playing Card Back */
                  <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-2">
                    <div className="w-full h-full rounded-xl border border-amber-400/40 flex items-center justify-center bg-indigo-950/60 shadow-inner">
                      <Sparkles className="w-5 h-5 text-amber-300 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={initGame}
          className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-700 shadow-md"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Re-shuffle Animal Cards
        </button>
      </div>
    </div>
  );
};
