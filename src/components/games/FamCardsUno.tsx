import {familyCardAsset,cardBack,familyCardLabel,cardColorName} from '../../services/gameAssets';
import { shuffle } from '../../services/gameAI';
import { useGameTimers } from './useGameTimers';
import React, { useState, useEffect } from 'react';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import { TABLE_BACKGROUNDS } from '../../services/gameImages';
import { RefreshCw, Trophy, Bell, Layers, Wifi } from 'lucide-react';
import { RoomParticipant } from '../../types';
import { AvatarDisplay } from '../avatar/AvatarDisplay';
import { multiplayerService } from '../../services/multiplayerService';

export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type CardValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'skip' | 'reverse' | '+2' | 'wild' | '+4';

export interface Card {
  id: string;
  color: CardColor;
  value: CardValue;
}

interface FamCardsUnoProps {
  onGameEnd?: (winner: string) => void;
  tableParticipants?: RoomParticipant[];
  currentUserId?: string;
  onActiveTurnChange?: (turnPlayerId: string) => void;
  roomCode?: string;
  isHost?: boolean;
}

const COLORS: ('red' | 'blue' | 'green' | 'yellow')[] = ['red', 'blue', 'green', 'yellow'];

function createUnoDeck(): Card[] {
  const deck: Card[] = [];
  let id = 1;

  for (const c of COLORS) {
    deck.push({ id: `c_${id++}`, color: c, value: '0' });
    const values: CardValue[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', '+2'];
    for (let count = 0; count < 2; count++) {
      for (const val of values) {
        deck.push({ id: `c_${id++}`, color: c, value: val });
      }
    }
  }

  for (let i = 0; i < 4; i++) {
    deck.push({ id: `c_${id++}`, color: 'wild', value: 'wild' });
    deck.push({ id: `c_${id++}`, color: 'wild', value: '+4' });
  }

  return shuffle(deck);
}

export const FamCardsUno: React.FC<FamCardsUnoProps> = ({ 
  onGameEnd,
  tableParticipants,
  currentUserId,
  onActiveTurnChange,
  roomCode,
  isHost
}) => {
  const { schedule, cancelAll } = useGameTimers();
  const p1 = tableParticipants?.[0];
  const p2 = tableParticipants?.[1];
  const p1Name = p1?.name || 'Spieler 1';
  const p2Name = p2?.name || (p2?.isBot ? 'Familien-KI' : 'Spieler 2');
  const isP2Bot = p2 ? !!p2.isBot : true;

  const isOnlineMultiplayer = Boolean(roomCode && p1 && p2 && !p2.isBot);
  const isPlayer1 = currentUserId === p1?.id;
  const isPlayer2 = currentUserId === p2?.id;
  const myRole: 'player' | 'bot' = isPlayer2 ? 'bot' : 'player';

  const [deck, setDeck] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [botHand, setBotHand] = useState<Card[]>([]);
  const [currentTurn, setCurrentTurn] = useState<'player' | 'bot'>('player');
  const [activeColor, setActiveColor] = useState<CardColor>('red');
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [pendingWildCard, setPendingWildCard] = useState<Card | null>(null);
  const [calledUno, setCalledUno] = useState<boolean>(false);
  const [gameMessage, setGameMessage] = useState<string>('Bediene Farbe oder Zahl!');
  const [winner, setWinner] = useState<string | null>(null);

  const isMyTurn = !isOnlineMultiplayer ? (currentTurn === 'player') : (currentTurn === myRole);

  useEffect(() => {
    if (onActiveTurnChange) {
      const activeId = currentTurn === 'player' ? (p1?.id || 'p1') : (p2?.id || 'p2');
      onActiveTurnChange(activeId);
    }
  }, [currentTurn, p1?.id, p2?.id, onActiveTurnChange]);

  // Initialize round
  const startNewGame = (broadcast = true) => {
    cancelAll();
    sound.playCardDeal();
    const newDeck = createUnoDeck();
    const pHand = newDeck.splice(0, 7);
    const bHand = newDeck.splice(0, 7);

    let firstCard = newDeck.shift()!;
    while (firstCard.value === '+4') {
      newDeck.push(firstCard);
      firstCard = newDeck.shift()!;
    }

    const initActiveColor = firstCard.color === 'wild' ? 'red' : firstCard.color;

    setPlayerHand(pHand);
    setBotHand(bHand);
    setDiscardPile([firstCard]);
    setActiveColor(initActiveColor);
    setDeck(newDeck);
    setCurrentTurn('player');
    setWinner(null);
    setCalledUno(false);
    setGameMessage(`${p1Name} beginnt! Gleiche Farbe oder Zahl ablegen.`);

    if (broadcast && roomCode) {
      multiplayerService.sendGameAction(
        roomCode,
        'uno',
        'INIT_GAME',
        {
          deck: newDeck,
          playerHand: pHand,
          botHand: bHand,
          firstCard,
          activeColor: initActiveColor,
        },
        currentUserId || 'p1'
      );
    }
  };

  useEffect(() => {
    if (!isOnlineMultiplayer || isHost) {
      startNewGame(Boolean(isOnlineMultiplayer && isHost));
    }
  }, []);

  // Listen to remote WebSocket actions
  useEffect(() => {
    if (!roomCode || !isOnlineMultiplayer) return;

    const unsubscribe = multiplayerService.subscribeToGameActions((evt) => {
      if (evt.roomCode !== roomCode || evt.gameType !== 'uno') return;
      if (evt.senderId === currentUserId) return;

      if (evt.action === 'INIT_GAME') {
        const { deck: remoteDeck, playerHand: remotePHand, botHand: remoteBHand, firstCard, activeColor: remoteColor } = evt.payload;
        setDeck(remoteDeck);
        setPlayerHand(remotePHand);
        setBotHand(remoteBHand);
        setDiscardPile([firstCard]);
        setActiveColor(remoteColor);
        setCurrentTurn('player');
        setWinner(null);
        setCalledUno(false);
        setGameMessage(`${p1Name} beginnt! Gleiche Farbe oder Zahl ablegen.`);
        sound.playCardDeal();
      } else if (evt.action === 'PLAY_CARD') {
        const { card, newColor, player } = evt.payload;
        executePlayInternal(card, newColor, player);
      } else if (evt.action === 'DRAW_CARD') {
        const { player } = evt.payload;
        executeDrawInternal(player);
      } else if (evt.action === 'CALL_UNO') {
        const { player } = evt.payload;
        const name = player === 'player' ? p1Name : p2Name;
        sound.playReward();
        setCalledUno(true);
        setGameMessage(`🔥 ${name} hat UNO gerufen!`);
      } else if (evt.action === 'RESET') {
        startNewGame(false);
      }
    });

    return () => unsubscribe();
  }, [roomCode, isOnlineMultiplayer, currentUserId, playerHand, botHand, deck, discardPile, activeColor, p1Name, p2Name]);

  const topCard = discardPile[discardPile.length - 1];

  const canPlayCard = (card: Card): boolean => {
    if (!topCard) return false;
    if (card.color === 'wild') return true;
    if (card.color === activeColor) return true;
    if (card.value === topCard.value) return true;
    return false;
  };

  const handlePlayCard = (card: Card) => {
    if (!isMyTurn || winner) return;

    if (!canPlayCard(card)) {
      sound.playError();
      setGameMessage('Diese Karte kann nicht gelegt werden! Gleiche Farbe oder Symbol.');
      return;
    }

    if (card.color === 'wild') {
      sound.playCardDeal();
      setPendingWildCard(card);
      setShowColorPicker(true);
      return;
    }

    executePlay(card, card.color, myRole);
  };

  const handleSelectWildColor = (chosenColor: 'red' | 'blue' | 'green' | 'yellow') => {
    if (!pendingWildCard) return;
    setShowColorPicker(false);
    executePlay(pendingWildCard, chosenColor, myRole);
    setPendingWildCard(null);
  };

  const executePlayInternal = (card: Card, newColor: CardColor, player: 'player' | 'bot') => {
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

    const playerName = player === 'player' ? p1Name : p2Name;
    const oppName = player === 'player' ? p2Name : p1Name;

    // Check Victory
    const handCount = player === 'player' ? playerHand.length - 1 : botHand.length - 1;
    if (handCount <= 0) {
      setWinner(playerName);
      sound.playVictory();
      try {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
      if (onGameEnd) onGameEnd(playerName);
      return;
    }

    // Actions: Skip, Reverse, +2, +4
    let nextTurn: 'player' | 'bot' = player === 'player' ? 'bot' : 'player';

    if (card.value === 'skip' || card.value === 'reverse') {
      sound.playClick();
      setGameMessage(`${playerName} hat AUSSETZEN gelegt! ${oppName} wird übersprungen!`);
      nextTurn = player; // keep turn
    } else if (card.value === '+2') {
      sound.playReward();
      setGameMessage(`${playerName} hat +2 gelegt! ${oppName} zieht 2 Karten!`);
      drawCards(nextTurn, 2);
    } else if (card.value === '+4') {
      sound.playReward();
      setGameMessage(`${playerName} hat +4 FARBWAHL gelegt! ${oppName} zieht 4 Karten!`);
      drawCards(nextTurn, 4);
    } else {
      setGameMessage(`${nextTurn === 'player' ? p1Name : p2Name} ist am Zug.`);
    }

    setCurrentTurn(nextTurn);
  };

  const executePlay = (card: Card, newColor: CardColor, player: 'player' | 'bot') => {
    executePlayInternal(card, newColor, player);

    if (roomCode) {
      multiplayerService.sendGameAction(
        roomCode,
        'uno',
        'PLAY_CARD',
        { card, newColor, player },
        currentUserId || 'p1'
      );
    }
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

  const executeDrawInternal = (target: 'player' | 'bot') => {
    sound.playCardDeal();
    let currentDeck = [...deck];
    if (currentDeck.length === 0) currentDeck = createUnoDeck();
    const drawn = currentDeck.shift()!;
    setDeck(currentDeck);

    if (target === 'player') {
      setPlayerHand((prev) => [...prev, drawn]);
    } else {
      setBotHand((prev) => [...prev, drawn]);
    }

    const playerName = target === 'player' ? p1Name : p2Name;
    const oppName = target === 'player' ? p2Name : p1Name;

    if (canPlayCard(drawn)) {
      setGameMessage(`${playerName} hat ${drawn.color} ${drawn.value} gezogen und kann legen!`);
    } else {
      setGameMessage(`${playerName} hat gezogen. Keine passende Karte – Zug geht an ${oppName}.`);
      setCurrentTurn(target === 'player' ? 'bot' : 'player');
    }
  };

  const handlePlayerDraw = () => {
    if (!isMyTurn || winner) return;
    executeDrawInternal(myRole);

    if (roomCode) {
      multiplayerService.sendGameAction(
        roomCode,
        'uno',
        'DRAW_CARD',
        { player: myRole },
        currentUserId || 'p1'
      );
    }
  };

  // Bot Turn Automation (Only runs if opponent is actually a Bot)
  useEffect(() => {
    if (currentTurn === 'bot' && isP2Bot && !winner) {
      const timer = schedule(() => {
        const playable = botHand.filter(canPlayCard);
        if (playable.length > 0) {
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
          drawCards('bot', 1);
          setGameMessage('KI hatte keine passende Karte und hat gezogen.');
          setCurrentTurn('player');
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentTurn, botHand, activeColor, topCard, winner, isOnlineMultiplayer, isP2Bot]);

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

  // Which hand is displayed at the bottom for this user?
  const myHand = myRole === 'bot' ? botHand : playerHand;
  const oppHand = myRole === 'bot' ? playerHand : botHand;
  const oppParticipant = myRole === 'bot' ? p1 : p2;
  const oppName = myRole === 'bot' ? p1Name : p2Name;
  const isOppTurn = myRole === 'bot' ? currentTurn === 'player' : currentTurn === 'bot';

  return (
    <div className="flex flex-col items-center max-w-6xl mx-auto w-full select-none text-slate-100">
      
      {/* Online indicator */}
      {isOnlineMultiplayer && (
        <div className="mb-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow">
          <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Echte Online-Synchronisation aktiv ({isPlayer1 ? 'Du bist Spieler 1' : 'Du bist Spieler 2'})</span>
        </div>
      )}

      {/* Opponent Hand Area */}
      <div className={`w-full mobile-game-header flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl mb-4 text-xs transition ${isOppTurn ? 'ring-2 ring-amber-400/80 bg-amber-950/20' : ''}`}>
        <div className="flex items-center gap-2.5">
          {oppParticipant?.avatar ? (
            <AvatarDisplay avatar={oppParticipant.avatar} size="sm" />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-300">
              ★
            </div>
          )}
          <div>
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <span>{oppName}</span>
              {isOppTurn && (
                <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full font-black animate-pulse">
                  Am Zug
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              <span className="text-amber-400 font-bold">{oppHand.length}</span> Karten auf der Hand
            </div>
          </div>
        </div>

        {/* Opponent Card backs */}
        <div className="flex -space-x-4 overflow-hidden">
          {oppHand.slice(0, 7).map((_, i) => (
            <div
              key={i}
              className="w-8 h-12 rounded-lg bg-indigo-950 border border-indigo-700/60 shadow-md flex items-center justify-center font-bold text-[9px] text-amber-400"
            >
              <img src={cardBack('family')} alt="Verdeckte Karte" draggable={false} className="w-full h-full rounded-lg"/>
            </div>
          ))}
          {oppHand.length > 7 && (
            <div className="w-8 h-12 rounded-lg bg-indigo-900 flex items-center justify-center text-[10px] font-bold">
              +{oppHand.length - 7}
            </div>
          )}
        </div>

        <div className="text-[11px] font-semibold text-slate-400">
          Farbe: <strong className="uppercase font-bold" style={{ color: activeColor === 'yellow' ? '#F59E0B' : activeColor }}>{cardColorName(activeColor)}</strong>
        </div>
      </div>

      {/* Middle Playing Mat with Real Wooden Tabletop Photo & Felt Texture */}
      <div className="relative w-full rounded-3xl p-6 flex flex-col items-center justify-center min-h-[240px] shadow-2xl mb-4 overflow-hidden border-4 border-emerald-950 bg-slate-950">
        
        {/* Real Tabletop Background Photo */}
        <img
          src={TABLE_BACKGROUNDS.feltGreen}
          alt="Card Table Texture"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover "
        />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/70 via-emerald-950/85 to-slate-950/90 pointer-events-none" />

        {/* Game status announcement banner */}
        <div className="relative z-10 mb-4 text-center">
          {winner ? (
            <div className="text-lg font-bold text-amber-300 flex items-center gap-2 animate-bounce bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-amber-500/40">
              <Trophy className="w-6 h-6 text-amber-400" />
              <span>{winner} hat die Runde gewonnen! 🎉</span>
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
            disabled={!isMyTurn || !!winner}
            className={`w-22 h-32 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border-2 border-indigo-400 shadow-2xl flex flex-col items-center justify-center gap-1.5 transition-all relative ${
              isMyTurn && !winner
                ? 'hover:scale-105 ring-4 ring-indigo-400/60 animate-pulse shadow-indigo-500/30 cursor-pointer'
                : 'opacity-70 cursor-not-allowed'
            }`}
            style={{
              boxShadow: '4px 4px 0px rgba(15, 23, 42, 0.9), 8px 8px 0px rgba(2, 6, 23, 0.7)'
            }}
          >
            <img src={cardBack('family')} alt="Karte ziehen" draggable={false} className="absolute inset-0 w-full h-full rounded-xl pointer-events-none"/>

          </button>

          {/* Active Discard Top Card with Real Oval Card Center */}
          {topCard && (
            <div
              className={`w-20 h-28 sm:w-24 sm:h-32 rounded-2xl border-2 shadow-2xl flex flex-col items-center justify-between p-0 font-display transition-transform ${getColorBg(
                topCard.color === 'wild' ? activeColor : topCard.color
              )}`}
              style={{
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.7), inset 0 2px 4px rgba(255, 255, 255, 0.4)'
              }}
            >
              <img src={familyCardAsset(topCard.color,topCard.value)} alt={`Ablage: ${familyCardLabel(topCard.color,topCard.value)}`} draggable={false} className="w-full h-full object-fill rounded-xl"/>

            </div>
          )}
        </div>

        {/* Active Color Ring */}
        <div className="relative z-10 mt-4 flex items-center gap-2 text-xs text-slate-200 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow">
          <span>Aktuelle Farbe:</span>
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
          Deine Hand ({myHand.length} Karten):
        </span>

        {/* UNO Shout Button */}
        <button
          onClick={() => {
            sound.playReward();
            setCalledUno(true);
            setGameMessage(`🔥 ${myRole === 'player' ? p1Name : p2Name} hat UNO gerufen!`);
            if (roomCode) {
              multiplayerService.sendGameAction(roomCode, 'uno', 'CALL_UNO', { player: myRole }, currentUserId || 'p1');
            }
          }}
          className={`px-3 py-1 rounded-xl text-xs font-black tracking-wider transition flex items-center gap-1 shadow-md ${
            myHand.length <= 2
              ? 'bg-rose-600 hover:bg-rose-500 text-white animate-bounce ring-2 ring-white cursor-pointer'
              : 'bg-slate-800 text-slate-400 opacity-60'
          }`}
        >
          <Bell className="w-3.5 h-3.5" /> UNO RUFEN!
        </button>
      </div>

      {/* Player Hand Cards Scroll */}
      <div className="mobile-card-hand w-full overflow-x-auto pb-3 pt-1 flex gap-2.5 justify-start sm:justify-center px-1">
        {myHand.map((card) => {
          const playable = canPlayCard(card) && isMyTurn && !winner;
          return (
            <button
              key={card.id}
              onClick={() => handlePlayCard(card)}
              disabled={!playable}
              className={`w-18 h-28 sm:w-20 sm:h-30 shrink-0 rounded-2xl border-2 flex flex-col items-center justify-between p-0 font-display transition-all relative ${
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
              <img src={familyCardAsset(card.color,card.value)} alt={familyCardLabel(card.color,card.value)} draggable={false} className="w-full h-full rounded-xl pointer-events-none"/>

            </button>
          );
        })}
      </div>

      {/* Wild Color Picker Dialog */}
      {showColorPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3">Farbe wählen:</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { color: 'red', label: 'Rot', bg: 'bg-rose-600 hover:bg-rose-500' },
                { color: 'blue', label: 'Blau', bg: 'bg-blue-600 hover:bg-blue-500' },
                { color: 'green', label: 'Grün', bg: 'bg-emerald-600 hover:bg-emerald-500' },
                { color: 'yellow', label: 'Gelb', bg: 'bg-amber-500 hover:bg-amber-400 text-slate-950' },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => handleSelectWildColor(c.color as any)}
                  className={`py-3 rounded-2xl font-bold text-sm shadow-md transition cursor-pointer ${c.bg}`}
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
          onClick={() => {
            startNewGame(true);
            if (roomCode) {
              multiplayerService.sendGameAction(roomCode, 'uno', 'RESET', {}, currentUserId || 'p1');
            }
          }}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Neue Runde
        </button>
      </div>
    </div>
  );
};
