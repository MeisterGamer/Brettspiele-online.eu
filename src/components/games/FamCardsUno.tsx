import React, { useState, useEffect } from 'react';
import { sound } from '../../services/sound';
import confetti from 'canvas-confetti';
import { RefreshCw, Trophy, Bell, Layers, Plus } from 'lucide-react';

export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type CardValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'skip' | 'reverse' | '+2' | 'wild' | '+4';

export interface Card {
  id: string;
  color: CardColor;
  value: CardValue;
}

interface FamCardsUnoProps {
  onGameEnd?: (winner: string) => void;
}

const COLORS: ('red' | 'blue' | 'green' | 'yellow')[] = ['red', 'blue', 'green', 'yellow'];

function createUnoDeck(): Card[] {
  const deck: Card[] = [];
  let id = 1;

  for (const c of COLORS) {
    // One 0 per color
    deck.push({ id: `c_${id++}`, color: c, value: '0' });
    // Two of 1-9, skip, reverse, +2
    const values: CardValue[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', '+2'];
    for (let count = 0; count < 2; count++) {
      for (const val of values) {
        deck.push({ id: `c_${id++}`, color: c, value: val });
      }
    }
  }

  // 4 Wild and 4 Wild +4
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `c_${id++}`, color: 'wild', value: 'wild' });
    deck.push({ id: `c_${id++}`, color: 'wild', value: '+4' });
  }

  // Shuffle
  return deck.sort(() => Math.random() - 0.5);
}

export const FamCardsUno: React.FC<FamCardsUnoProps> = ({ onGameEnd }) => {
  const [deck, setDeck] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [botHand, setBotHand] = useState<Card[]>([]);
  const [currentTurn, setCurrentTurn] = useState<'player' | 'bot'>('player');
  const [activeColor, setActiveColor] = useState<CardColor>('red');
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [pendingWildCard, setPendingWildCard] = useState<Card | null>(null);
  const [calledUno, setCalledUno] = useState<boolean>(false);
  const [gameMessage, setGameMessage] = useState<string>('Match color or number!');
  const [winner, setWinner] = useState<string | null>(null);

  // Initialize round
  const startNewGame = () => {
    sound.playCardDeal();
    const newDeck = createUnoDeck();
    const pHand = newDeck.splice(0, 7);
    const bHand = newDeck.splice(0, 7);

    // Initial discard (cannot be wild +4 for simplicity)
    let firstCard = newDeck.shift()!;
    while (firstCard.value === '+4') {
      newDeck.push(firstCard);
      firstCard = newDeck.shift()!;
    }

    setPlayerHand(pHand);
    setBotHand(bHand);
    setDiscardPile([firstCard]);
    setActiveColor(firstCard.color === 'wild' ? 'red' : firstCard.color);
    setDeck(newDeck);
    setCurrentTurn('player');
    setWinner(null);
    setCalledUno(false);
    setGameMessage('Your turn! Match the top card.');
  };

  useEffect(() => {
    startNewGame();
  }, []);

  const topCard = discardPile[discardPile.length - 1];

  const canPlayCard = (card: Card): boolean => {
    if (!topCard) return false;
    if (card.color === 'wild') return true;
    if (card.color === activeColor) return true;
    if (card.value === topCard.value) return true;
    return false;
  };

  const handlePlayCard = (card: Card) => {
    if (currentTurn !== 'player' || winner) return;

    if (!canPlayCard(card)) {
      sound.playError();
      setGameMessage('That card cannot be played! Must match color or number.');
      return;
    }

    if (card.color === 'wild') {
      sound.playCardDeal();
      setPendingWildCard(card);
      setShowColorPicker(true);
      return;
    }

    executePlay(card, card.color, 'player');
  };

  const handleSelectWildColor = (chosenColor: 'red' | 'blue' | 'green' | 'yellow') => {
    if (!pendingWildCard) return;
    setShowColorPicker(false);
    executePlay(pendingWildCard, chosenColor, 'player');
    setPendingWildCard(null);
  };

  const executePlay = (card: Card, newColor: CardColor, player: 'player' | 'bot') => {
    sound.playCardDeal();

    // Remove from hand
    if (player === 'player') {
      setPlayerHand((prev) => prev.filter((c) => c.id !== card.id));
    } else {
      setBotHand((prev) => prev.filter((c) => c.id !== card.id));
    }

    // Add to discard pile
    setDiscardPile((prev) => [...prev, card]);
    setActiveColor(newColor);

    // Check Victory
    const handCount = player === 'player' ? playerHand.length - 1 : botHand.length - 1;
    if (handCount === 0) {
      setWinner(player === 'player' ? 'You' : 'Family AI Bot');
      sound.playVictory();
      try {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
      if (onGameEnd) onGameEnd(player === 'player' ? 'You' : 'Bot');
      return;
    }

    // Actions: Skip, Reverse, +2, +4
    let nextTurn: 'player' | 'bot' = player === 'player' ? 'bot' : 'player';

    if (card.value === 'skip' || card.value === 'reverse') {
      sound.playClick();
      setGameMessage(`${player === 'player' ? 'You' : 'Bot'} played SKIP! Turn skipped!`);
      nextTurn = player; // keep turn
    } else if (card.value === '+2') {
      sound.playReward();
      setGameMessage(`${player === 'player' ? 'You' : 'Bot'} dropped DRAW TWO!`);
      drawCards(nextTurn, 2);
    } else if (card.value === '+4') {
      sound.playReward();
      setGameMessage(`${player === 'player' ? 'You' : 'Bot'} dropped WILD DRAW FOUR!`);
      drawCards(nextTurn, 4);
    } else {
      setGameMessage(`${nextTurn === 'player' ? 'Your' : 'Bot’s'} turn.`);
    }

    setCurrentTurn(nextTurn);
  };

  const drawCards = (target: 'player' | 'bot', count: number) => {
    let currentDeck = [...deck];
    if (currentDeck.length < count) {
      currentDeck = [...currentDeck, ...createUnoDeck()];
    }
    const drawn = currentDeck.splice(0, count);
    setDeck(currentDeck);

    if (target === 'player') {
      setPlayerHand((prev) => [...prev, ...drawn]);
    } else {
      setBotHand((prev) => [...prev, ...drawn]);
    }
  };

  const handlePlayerDraw = () => {
    if (currentTurn !== 'player' || winner) return;
    sound.playCardDeal();

    let currentDeck = [...deck];
    if (currentDeck.length === 0) currentDeck = createUnoDeck();
    const drawn = currentDeck.shift()!;
    setDeck(currentDeck);
    setPlayerHand((prev) => [...prev, drawn]);

    // Check if newly drawn card is playable
    if (canPlayCard(drawn)) {
      setGameMessage(`Drew ${drawn.color} ${drawn.value} - you can play it!`);
    } else {
      setGameMessage('No playable cards drawn. Turn passed to Bot.');
      setCurrentTurn('bot');
    }
  };

  // Bot Turn Automation
  useEffect(() => {
    if (currentTurn === 'bot' && !winner) {
      const timer = setTimeout(() => {
        // Find playable card in bot hand
        const playable = botHand.filter(canPlayCard);
        if (playable.length > 0) {
          // Play card (prioritize action or matching color)
          const chosen = playable[0];
          let chosenColor: CardColor = chosen.color;
          if (chosen.color === 'wild') {
            const counts: Record<string, number> = { red: 0, blue: 0, green: 0, yellow: 0 };
            botHand.forEach((c) => {
              if (c.color !== 'wild') counts[c.color]++;
            });
            chosenColor = (Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b) as CardColor) || 'red';
          }
          executePlay(chosen, chosenColor, 'bot');
        } else {
          // Bot must draw
          drawCards('bot', 1);
          setGameMessage('Bot had no match and drew a card.');
          setCurrentTurn('player');
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentTurn, botHand, activeColor, topCard, winner]);

  // Color display helper
  const getColorBg = (c: CardColor) => {
    switch (c) {
      case 'red': return 'bg-rose-600 text-white border-rose-500';
      case 'blue': return 'bg-blue-600 text-white border-blue-500';
      case 'green': return 'bg-emerald-600 text-white border-emerald-500';
      case 'yellow': return 'bg-amber-500 text-slate-950 border-amber-400';
      case 'wild': return 'bg-gradient-to-tr from-rose-500 via-amber-400 via-emerald-400 to-blue-500 text-white border-slate-600';
      default: return 'bg-slate-700 text-white';
    }
  };

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none text-slate-100">
      
      {/* Bot Hand Area */}
      <div className="w-full flex items-center justify-between bg-slate-900/80 border border-slate-800 p-2.5 rounded-2xl mb-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <span className="font-bold text-slate-300">Family AI Bot:</span>
          <span className="bg-slate-800 px-2 py-0.5 rounded-full font-mono text-amber-300">
            {botHand.length} Cards
          </span>
        </div>

        {/* Bot Card backs */}
        <div className="flex -space-x-4 overflow-hidden">
          {botHand.slice(0, 7).map((_, i) => (
            <div
              key={i}
              className="w-8 h-12 rounded-lg bg-indigo-950 border border-indigo-700/60 shadow-md flex items-center justify-center font-bold text-[9px] text-amber-400"
            >
              ★
            </div>
          ))}
          {botHand.length > 7 && (
            <div className="w-8 h-12 rounded-lg bg-indigo-900 flex items-center justify-center text-[10px] font-bold">
              +{botHand.length - 7}
            </div>
          )}
        </div>

        <div className="text-[11px] font-semibold text-slate-400">
          Active Color: <strong className="uppercase font-bold" style={{ color: activeColor === 'yellow' ? '#F59E0B' : activeColor }}>{activeColor}</strong>
        </div>
      </div>

      {/* Middle Playing Mat with Real Wooden Tabletop Photo & Felt Texture */}
      <div className="relative w-full rounded-3xl p-6 flex flex-col items-center justify-center min-h-[240px] shadow-2xl mb-4 overflow-hidden border-4 border-emerald-950 bg-slate-950">
        
        {/* Real Tabletop Background Photo */}
        <img
          src="https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&w=800&q=80"
          alt="Card Table Texture"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.25] contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/70 via-emerald-950/85 to-slate-950/90 pointer-events-none" />

        {/* Game status announcement banner */}
        <div className="relative z-10 mb-4 text-center">
          {winner ? (
            <div className="text-lg font-bold text-amber-300 flex items-center gap-2 animate-bounce bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-amber-500/40">
              <Trophy className="w-6 h-6 text-amber-400" />
              <span>{winner} Won the FamCards Match! 🎉</span>
            </div>
          ) : (
            <p className="text-xs font-semibold text-emerald-200 bg-emerald-950/90 backdrop-blur-sm px-4 py-1.5 rounded-full border border-emerald-600 shadow-md">
              {gameMessage}
            </p>
          )}
        </div>

        {/* Center: Discard Pile & Draw Deck */}
        <div className="relative z-10 flex items-center gap-7">
          
          {/* Draw Deck with Stacked 3D Card Edge Shadows */}
          <button
            onClick={handlePlayerDraw}
            disabled={currentTurn !== 'player' || !!winner}
            className={`w-22 h-32 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border-2 border-indigo-400 shadow-2xl flex flex-col items-center justify-center gap-1.5 transition-all relative ${
              currentTurn === 'player' && !winner
                ? 'hover:scale-105 ring-4 ring-indigo-400/60 animate-pulse shadow-indigo-500/30'
                : 'opacity-70'
            }`}
            style={{
              boxShadow: '4px 4px 0px rgba(15, 23, 42, 0.9), 8px 8px 0px rgba(2, 6, 23, 0.7)'
            }}
          >
            <div className="w-16 h-24 rounded-xl border border-indigo-500/40 bg-indigo-950/50 flex flex-col items-center justify-center">
              <Layers className="w-6 h-6 text-amber-400" />
              <span className="text-[10px] font-black text-amber-300 font-display mt-1">DRAW</span>
            </div>
          </button>

          {/* Active Discard Top Card with Real Oval Card Center */}
          {topCard && (
            <div
              className={`w-22 h-32 rounded-2xl border-2 shadow-2xl flex flex-col items-center justify-between p-2 font-display transition-transform ${getColorBg(
                topCard.color === 'wild' ? activeColor : topCard.color
              )}`}
              style={{
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.7), inset 0 2px 4px rgba(255, 255, 255, 0.4)'
              }}
            >
              <span className="text-xs self-start leading-none font-bold drop-shadow">{topCard.value}</span>
              
              {/* Central White Oval Emblem */}
              <div className="w-16 h-20 rounded-[50%] bg-white/95 text-slate-950 shadow-inner flex items-center justify-center -rotate-12 border border-black/10">
                <span className="text-3xl font-black font-display tracking-tight text-slate-950">
                  {topCard.value}
                </span>
              </div>

              <span className="text-xs self-end leading-none font-bold drop-shadow">{topCard.value}</span>
            </div>
          )}
        </div>

        {/* Active Color Ring */}
        <div className="relative z-10 mt-4 flex items-center gap-2 text-xs text-slate-200 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow">
          <span>Target Color:</span>
          <span
            className="w-4 h-4 rounded-full ring-2 ring-white shadow"
            style={{
              backgroundColor:
                activeColor === 'red'
                  ? '#E11D48'
                  : activeColor === 'blue'
                  ? '#2563EB'
                  : activeColor === 'green'
                  ? '#10B981'
                  : '#F59E0B',
            }}
          />
        </div>
      </div>

      {/* UNO Call & Player Hand Header */}
      <div className="w-full flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-bold text-slate-300">
          Your Cards ({playerHand.length}):
        </span>

        {/* UNO Shout Button */}
        <button
          onClick={() => {
            sound.playReward();
            setCalledUno(true);
            setGameMessage('SHOUTED UNO! 🔥');
          }}
          className={`px-3 py-1 rounded-xl text-xs font-black tracking-wider transition flex items-center gap-1 shadow-md ${
            playerHand.length <= 2
              ? 'bg-rose-600 hover:bg-rose-500 text-white animate-bounce ring-2 ring-white'
              : 'bg-slate-800 text-slate-400 opacity-60'
          }`}
        >
          <Bell className="w-3.5 h-3.5" /> SHOUT UNO!
        </button>
      </div>

      {/* Player Hand Cards Scroll */}
      <div className="w-full overflow-x-auto pb-3 pt-1 flex gap-2.5 justify-start sm:justify-center px-1">
        {playerHand.map((card) => {
          const playable = canPlayCard(card) && currentTurn === 'player' && !winner;
          return (
            <button
              key={card.id}
              onClick={() => handlePlayCard(card)}
              disabled={!playable}
              className={`w-18 h-26 shrink-0 rounded-2xl border-2 flex flex-col items-center justify-between p-1.5 font-display transition-all relative ${
                getColorBg(card.color)
              } ${
                playable
                  ? 'hover:-translate-y-3 cursor-pointer shadow-2xl hover:shadow-cyan-400/30 ring-2 ring-white/90 scale-102'
                  : 'opacity-50 grayscale-40 cursor-not-allowed'
              }`}
              style={{
                boxShadow: playable
                  ? '0 12px 18px -2px rgba(0,0,0,0.7), inset 0 2px 4px rgba(255,255,255,0.7)'
                  : '0 4px 6px rgba(0,0,0,0.5)'
              }}
            >
              <span className="text-[10px] self-start leading-none font-black drop-shadow">{card.value}</span>
              
              {/* Mini Oval Inner Center */}
              <div className="w-11 h-13 rounded-[50%] bg-white/95 text-slate-950 shadow-inner flex items-center justify-center -rotate-12 border border-black/10">
                <span className="text-base font-black font-display tracking-tight text-slate-950">
                  {card.value}
                </span>
              </div>

              <span className="text-[10px] self-end leading-none font-black drop-shadow">{card.value}</span>
            </button>
          );
        })}
      </div>

      {/* Wild Color Picker Dialog */}
      {showColorPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3">Choose Next Color:</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { color: 'red', label: 'Red', bg: 'bg-rose-600 hover:bg-rose-500' },
                { color: 'blue', label: 'Blue', bg: 'bg-blue-600 hover:bg-blue-500' },
                { color: 'green', label: 'Green', bg: 'bg-emerald-600 hover:bg-emerald-500' },
                { color: 'yellow', label: 'Yellow', bg: 'bg-amber-500 hover:bg-amber-400 text-slate-950' },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => handleSelectWildColor(c.color as any)}
                  className={`py-3 rounded-2xl font-bold text-sm shadow-md transition ${c.bg}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={startNewGame}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Restart Round
        </button>
      </div>
    </div>
  );
};
