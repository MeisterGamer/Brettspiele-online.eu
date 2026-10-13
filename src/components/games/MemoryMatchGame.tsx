import React, { useState, useEffect } from 'react';
import { sound } from '../../services/sound';
import confetti from 'canvas-confetti';
import { RefreshCw, Trophy, Brain, Sparkles } from 'lucide-react';

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
  onGameEnd?: (moves: number) => void;
}

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({ onGameEnd }) => {
  const [cards, setCards] = useState<AnimalCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);

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
        // Real match!
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

          if (pairs === ANIMALS.length) {
            setGameOver(true);
            sound.playVictory();
            try {
              confetti({ particleCount: 90, spread: 75 });
            } catch (e) {}
            if (onGameEnd) onGameEnd(moves + 1);
          }
        }, 350);
      } else {
        // Not a match, flip back
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[firstIdx].isFlipped = false;
            updated[secondIdx].isFlipped = false;
            return updated;
          });
          setFlippedIndices([]);
          setIsLocked(false);
        }, 900);
      }
    }
  };

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto w-full select-none text-slate-100">
      
      {/* Score Header */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3 rounded-2xl mb-4 text-xs shadow-md">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-slate-300">Moves:</span>
          <span className="font-mono text-amber-400 font-bold text-sm">{moves}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Animals Found:</span>
          <span className="font-mono text-emerald-400 font-bold text-sm">
            {matchedPairs} / {ANIMALS.length}
          </span>
        </div>
      </div>

      {gameOver && (
        <div className="mb-3 text-sm font-bold text-amber-300 flex items-center gap-2 animate-bounce bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-2xl">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span>Brilliant Memory! All {ANIMALS.length} animal pairs matched in {moves} moves!</span>
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
