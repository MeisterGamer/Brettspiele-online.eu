import React, { useState, useEffect, useRef } from 'react';
import { 
  BoardSpace, 
  BOARD_SPACES, 
  CHANCE_CARDS, 
  COMMUNITY_CARDS, 
  CardAction, 
  PROPERTY_GROUP_COLORS,
  MONOPOLY_FIGURES,
  MonopolyFigureId
} from './monopoly/monopolyData';
import { 
  MonopolyPlayerState, 
  TradeOffer, 
  MonopolyTradeModal 
} from './monopoly/MonopolyTradeModal';
import { MonopolyBoardRenderer } from './monopoly/MonopolyBoardRenderer';
import { MonopolyDeedModal } from './monopoly/MonopolyDeedModal';
import { MonopolyAuctionModal } from './monopoly/MonopolyAuctionModal';
import { MonopolyCardModal } from './monopoly/MonopolyCardModal';
import { MonopolyFigureRenderer } from './monopoly/MonopolyFigureRenderer';
import { RoomParticipant } from '../../types';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import { multiplayerService } from '../../services/multiplayerService';
import { 
  Dices, 
  Home, 
  Building2, 
  ArrowRightLeft, 
  DollarSign, 
  RotateCcw, 
  Trophy, 
  Wifi, 
  AlertCircle,
  HelpCircle,
  Shield,
  Layers,
  ChevronRight
} from 'lucide-react';

interface MonopolyGameProps {
  onGameEnd?: (winner: string) => void;
  tableParticipants?: RoomParticipant[];
  currentUserId?: string;
  onActiveTurnChange?: (turnPlayerId: string) => void;
  roomCode?: string;
  isHost?: boolean;
}

export const MonopolyGame: React.FC<MonopolyGameProps> = ({
  onGameEnd,
  tableParticipants,
  currentUserId = 'user-1',
  onActiveTurnChange,
  roomCode,
  isHost = true,
}) => {
  // Preset AI bot avatars if fewer than 4 human players
  const BOT_PRESETS = [
    { name: 'Oma Grete (KI)', color: '#8b5cf6', figure: 'cat' },
    { name: 'Papa Thomas (KI)', color: '#2563eb', figure: 'car' },
    { name: 'Junior Leo (KI)', color: '#10b981', figure: 'dino' },
    { name: 'Tante Lisa (KI)', color: '#ec4899', figure: 'dog' },
  ];

  // Initialize 4 Players
  const initializePlayers = (): MonopolyPlayerState[] => {
    const list: MonopolyPlayerState[] = [];

    // 1. Add current user
    const userPart = tableParticipants?.find(p => p.id === currentUserId);
    list.push({
      id: currentUserId,
      name: userPart?.name || 'Du (Immobilienhai)',
      color: '#f59e0b',
      figure: 'hat',
      money: 1500,
      position: 0,
      properties: [],
      houses: {},
      mortgaged: [],
      inJail: false,
      jailTurns: 0,
      jailFreeCards: 0,
      isBankrupt: false,
      isAi: false,
    });

    // 2. Add other participants from room
    const otherParticipants = (tableParticipants || []).filter(p => p.id !== currentUserId);
    otherParticipants.forEach((part, idx) => {
      if (list.length >= 4) return;
      const figures: MonopolyFigureId[] = ['car', 'dog', 'ship', 'jet'];
      list.push({
        id: part.id,
        name: part.name,
        color: idx === 0 ? '#3b82f6' : idx === 1 ? '#10b981' : '#ec4899',
        figure: figures[idx] || 'ship',
        money: 1500,
        position: 0,
        properties: [],
        houses: {},
        mortgaged: [],
        inJail: false,
        jailTurns: 0,
        jailFreeCards: 0,
        isBankrupt: false,
        isAi: part.isBot || false,
      });
    });

    // 3. Fill remaining seats with friendly family bots up to 4
    let botIdx = 0;
    while (list.length < 4 && botIdx < BOT_PRESETS.length) {
      const preset = BOT_PRESETS[botIdx];
      // ensure figure is unique
      const usedFigures = list.map(p => p.figure);
      const availableFigure = MONOPOLY_FIGURES.find(f => !usedFigures.includes(f.id))?.id || preset.figure;

      list.push({
        id: `bot-${botIdx + 1}`,
        name: preset.name,
        color: preset.color,
        figure: availableFigure,
        money: 1500,
        position: 0,
        properties: [],
        houses: {},
        mortgaged: [],
        inJail: false,
        jailTurns: 0,
        jailFreeCards: 0,
        isBankrupt: false,
        isAi: true,
      });
      botIdx++;
    }

    return list;
  };

  const [players, setPlayers] = useState<MonopolyPlayerState[]>(initializePlayers);
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [dice, setDice] = useState<[number, number]>([1, 2]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [hasRolled, setHasRolled] = useState<boolean>(false);
  const [doublesStreak, setDoublesStreak] = useState<number>(0);
  const [freeParkingPot, setFreeParkingPot] = useState<number>(100);
  const [gameLog, setGameLog] = useState<string[]>([
    'Willkommen bei Monopoly 2026 Next-Gen! Jeder Spieler startet mit 1.500 €.'
  ]);

  // Selected space for Deed Modal
  const [inspectedSpace, setInspectedSpace] = useState<BoardSpace | null>(null);

  // Active Trade Modal State
  const [isTradeOpen, setIsTradeOpen] = useState<boolean>(false);
  const [incomingTradeOffer, setIncomingTradeOffer] = useState<TradeOffer | null>(null);

  // Active Auction State
  const [auctionSpace, setAuctionSpace] = useState<BoardSpace | null>(null);

  // Active Card Drawn Popup
  const [drawnCard, setDrawnCard] = useState<CardAction | null>(null);

  // Winner State
  const [winner, setWinner] = useState<MonopolyPlayerState | null>(null);

  // Mobile active tab view: 'board' | 'properties' | 'log'
  const [mobileTab, setMobileTab] = useState<'board' | 'properties' | 'log'>('board');

  const currentPlayer = players[currentTurnIndex] || players[0];
  const isMyTurn = currentPlayer.id === currentUserId;

  // Sync turn to parent
  useEffect(() => {
    if (onActiveTurnChange && currentPlayer) {
      onActiveTurnChange(currentPlayer.id);
    }
  }, [currentTurnIndex, currentPlayer, onActiveTurnChange]);

  // Log message helper
  const addLog = (msg: string) => {
    setGameLog(prev => [msg, ...prev.slice(0, 40)]);
  };

  // --------------------------------------------------------------------------
  // MULTIPLAYER NETWORKING & SYNCHRONIZATION
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!roomCode) return;

    const unsubscribe = multiplayerService.subscribeToGameActions((evt) => {
      if (evt.roomCode !== roomCode || evt.gameType !== 'monopoly') return;
      if (evt.senderId === currentUserId) return; // ignore self

      if (evt.action === 'SYNC_STATE') {
        const { state } = evt.payload;
        setPlayers(state.players);
        setCurrentTurnIndex(state.currentTurnIndex);
        setDice(state.dice);
        setFreeParkingPot(state.freeParkingPot);
        setHasRolled(state.hasRolled);
        setDoublesStreak(state.doublesStreak);
      } else if (evt.action === 'ROLL_DICE') {
        const { diceVal, doubles } = evt.payload;
        setDice(diceVal);
        setIsRolling(false);
        setHasRolled(true);
        sound.playDiceRoll();
      } else if (evt.action === 'MOVE_TOKEN') {
        const { playerId, newPos, passedGo } = evt.payload;
        setPlayers(prev => prev.map(p => {
          if (p.id === playerId) {
            return {
              ...p,
              position: newPos,
              money: passedGo ? p.money + 200 : p.money,
            };
          }
          return p;
        }));
        if (passedGo) sound.playCashRegister();
      } else if (evt.action === 'BUY_PROPERTY') {
        const { playerId, spaceIndex, cost } = evt.payload;
        setPlayers(prev => prev.map(p => {
          if (p.id === playerId) {
            return {
              ...p,
              money: p.money - cost,
              properties: [...p.properties, spaceIndex],
            };
          }
          return p;
        }));
        sound.playCashRegister();
      } else if (evt.action === 'PAY_RENT') {
        const { fromId, toId, rentAmount } = evt.payload;
        setPlayers(prev => prev.map(p => {
          if (p.id === fromId) return { ...p, money: p.money - rentAmount };
          if (p.id === toId) return { ...p, money: p.money + rentAmount };
          return p;
        }));
        sound.playCashRegister();
      } else if (evt.action === 'BUILD_HOUSE') {
        const { playerId, spaceIndex, newCount, cost } = evt.payload;
        setPlayers(prev => prev.map(p => {
          if (p.id === playerId) {
            return {
              ...p,
              money: p.money - cost,
              houses: { ...p.houses, [spaceIndex]: newCount },
            };
          }
          return p;
        }));
        sound.playBuildHouse();
      } else if (evt.action === 'TRADE_OFFER') {
        setIncomingTradeOffer(evt.payload.offer);
        setIsTradeOpen(true);
        sound.playReward();
      } else if (evt.action === 'TRADE_RESOLVED') {
        const { updatedPlayers, logMsg } = evt.payload;
        setPlayers(updatedPlayers);
        setIncomingTradeOffer(null);
        setIsTradeOpen(false);
        addLog(logMsg);
        sound.playSuccess();
      } else if (evt.action === 'START_AUCTION') {
        setAuctionSpace(BOARD_SPACES[evt.payload.spaceIndex]);
      } else if (evt.action === 'END_AUCTION') {
        const { winnerId, spaceIndex, finalAmount } = evt.payload;
        setAuctionSpace(null);
        if (winnerId && finalAmount > 0) {
          setPlayers(prev => prev.map(p => {
            if (p.id === winnerId) {
              return {
                ...p,
                money: p.money - finalAmount,
                properties: [...p.properties, spaceIndex],
              };
            }
            return p;
          }));
          sound.playCashRegister();
        }
      } else if (evt.action === 'END_TURN') {
        setCurrentTurnIndex(evt.payload.nextIndex);
        setHasRolled(false);
        setDoublesStreak(0);
      }
    });

    return () => unsubscribe();
  }, [roomCode, currentUserId]);

  // Host broadcasts state
  const broadcastAction = (action: string, payload: any) => {
    if (!roomCode) return;
    multiplayerService.sendGameAction(roomCode, 'monopoly', action, payload, currentUserId);
  };

  // --------------------------------------------------------------------------
  // DICE ROLLING & TOKEN MOVEMENT
  // --------------------------------------------------------------------------
  const handleRollDice = () => {
    if (isRolling || hasRolled || winner) return;
    if (!isMyTurn && !currentPlayer.isAi) return;

    setIsRolling(true);
    sound.playDiceRoll();

    let rollCount = 0;
    const interval = setInterval(() => {
      setDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
      rollCount++;

      if (rollCount >= 7) {
        clearInterval(interval);
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const finalDice: [number, number] = [d1, d2];
        const isDoubles = d1 === d2;
        const total = d1 + d2;

        setDice(finalDice);
        setIsRolling(false);
        setHasRolled(true);

        broadcastAction('ROLL_DICE', { diceVal: finalDice, doubles: isDoubles });

        // Jail check: if 3 doubles in a row -> Jail!
        if (isDoubles) {
          const newStreak = doublesStreak + 1;
          setDoublesStreak(newStreak);
          if (newStreak >= 3) {
            addLog(`🚨 ${currentPlayer.name} hat dreimal einen Pasch gewürfelt und geht direkt ins Gefängnis!`);
            sendToJail(currentPlayer.id);
            return;
          }
        } else {
          setDoublesStreak(0);
        }

        // If in jail currently
        if (currentPlayer.inJail) {
          if (isDoubles) {
            addLog(`🎉 ${currentPlayer.name} hat einen Pasch gewürfelt und ist frei aus dem Gefängnis!`);
            sound.playSuccess();
            setPlayers(prev => prev.map(p => p.id === currentPlayer.id ? { ...p, inJail: false, jailTurns: 0 } : p));
            movePlayer(currentPlayer.id, total);
          } else {
            const turns = currentPlayer.jailTurns + 1;
            if (turns >= 3) {
              addLog(`⚠️ ${currentPlayer.name} zahlt 50 € Kaution nach 3 Runden im Gefängnis.`);
              sound.playCashRegister();
              setPlayers(prev => prev.map(p => p.id === currentPlayer.id ? { ...p, inJail: false, jailTurns: 0, money: p.money - 50 } : p));
              movePlayer(currentPlayer.id, total);
            } else {
              addLog(`🔒 ${currentPlayer.name} bleibt im Gefängnis (Runde ${turns}/3).`);
              sound.playJailDoor();
              setPlayers(prev => prev.map(p => p.id === currentPlayer.id ? { ...p, jailTurns: turns } : p));
            }
          }
          return;
        }

        // Normal movement
        movePlayer(currentPlayer.id, total);
      }
    }, 60);
  };

  // Move token along the board
  const movePlayer = (playerId: string, steps: number) => {
    const p = players.find(x => x.id === playerId);
    if (!p) return;

    const oldPos = p.position;
    const newPos = (oldPos + steps) % 40;
    const passedGo = oldPos + steps >= 40;

    setPlayers(prev => prev.map(player => {
      if (player.id === playerId) {
        return {
          ...player,
          position: newPos,
          money: passedGo ? player.money + 200 : player.money,
        };
      }
      return player;
    }));

    if (passedGo) {
      sound.playCashRegister();
      addLog(`🏁 ${p.name} zieht über LOS und kassiert 200 € Bank-Gehalt!`);
    }

    broadcastAction('MOVE_TOKEN', { playerId, newPos, passedGo });

    // Resolve landing on new space
    setTimeout(() => {
      resolveLanding(playerId, newPos, steps);
    }, 600);
  };

  // Resolve tile landing logic
  const resolveLanding = (playerId: string, spaceIndex: number, rolledSteps: number) => {
    const space = BOARD_SPACES[spaceIndex];
    const landingPlayer = players.find(p => p.id === playerId);
    if (!landingPlayer) return;

    addLog(`📍 ${landingPlayer.name} landet auf ${space.name}.`);

    // 1. Go to Jail field
    if (space.type === 'go-to-jail') {
      sound.playJailDoor();
      addLog(`👮 ${landingPlayer.name} muss direkt ins Gefängnis! Nicht über LOS.`);
      sendToJail(playerId);
      return;
    }

    // 2. Free Parking field
    if (space.type === 'parking') {
      if (freeParkingPot > 0) {
        sound.playReward();
        addLog(`🚗 ${landingPlayer.name} gewinnt den Frei-Parken Jackpot von ${freeParkingPot} €!`);
        setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, money: p.money + freeParkingPot } : p));
        setFreeParkingPot(0);
      }
      return;
    }

    // 3. Tax fields
    if (space.type === 'tax' && space.price) {
      sound.playCashRegister();
      addLog(`💸 ${landingPlayer.name} zahlt ${space.price} € Steuern in den Frei-Parken-Topf.`);
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, money: p.money - (space.price || 0) } : p));
      setFreeParkingPot(prev => prev + (space.price || 0));
      return;
    }

    // 4. Card Decks (Chance / Community)
    if (space.type === 'chance' || space.type === 'community') {
      const deck = space.type === 'chance' ? CHANCE_CARDS : COMMUNITY_CARDS;
      const card = deck[Math.floor(Math.random() * deck.length)];
      sound.playCardDeal();
      setDrawnCard(card);
      return;
    }

    // 5. Unowned Property / Station / Utility
    const owner = players.find(p => p.properties.includes(spaceIndex));

    if (!owner && space.price) {
      // Unowned: Human can buy or auction; AI decides
      if (landingPlayer.isAi && isHost) {
        // AI logic: buy if has enough liquidity
        if (landingPlayer.money >= (space.price + 150)) {
          buyProperty(playerId, spaceIndex);
        } else {
          // AI passes -> start auction
          addLog(`⚖️ ${landingPlayer.name} verzichtet auf den Kauf von ${space.name} -> Versteigerung!`);
          startAuction(spaceIndex);
        }
      } else if (landingPlayer.id === currentUserId) {
        // Human landing: open inspect or show prompt
        setInspectedSpace(space);
      }
      return;
    }

    // 6. Owned by another player: PAY RENT!
    if (owner && owner.id !== playerId) {
      if (owner.mortgaged.includes(spaceIndex)) {
        addLog(`🛡️ ${space.name} ist hypothekarisch belastet. Keine Miete fällig!`);
        return;
      }

      const rentAmount = calculateRent(space, owner, rolledSteps);
      sound.playCashRegister();
      addLog(`💵 ${landingPlayer.name} zahlt ${rentAmount} € Miete an ${owner.name} für ${space.name}.`);

      setPlayers(prev => prev.map(p => {
        if (p.id === playerId) return { ...p, money: p.money - rentAmount };
        if (p.id === owner.id) return { ...p, money: p.money + rentAmount };
        return p;
      }));

      broadcastAction('PAY_RENT', { fromId: playerId, toId: owner.id, rentAmount });
      checkBankruptcy(playerId);
    }
  };

  // Calculate rent including color monopolies, houses, stations, utilities
  const calculateRent = (space: BoardSpace, owner: MonopolyPlayerState, rolledTotal: number): number => {
    if (space.type === 'property' && space.houseRents) {
      const houses = owner.houses[space.index] || 0;
      if (houses > 0) {
        return space.houseRents[houses - 1];
      }
      // Check full color group ownership
      const hasFullGroup = hasMonopoly(owner, space.group!);
      return hasFullGroup ? (space.baseRent || 2) * 2 : (space.baseRent || 2);
    }

    if (space.type === 'station') {
      const ownedStations = owner.properties.filter(idx => BOARD_SPACES[idx].type === 'station').length;
      if (ownedStations === 1) return 25;
      if (ownedStations === 2) return 50;
      if (ownedStations === 3) return 100;
      return 200;
    }

    if (space.type === 'utility') {
      const ownedUtilities = owner.properties.filter(idx => BOARD_SPACES[idx].type === 'utility').length;
      const multiplier = ownedUtilities >= 2 ? 10 : 4;
      return (rolledTotal || 7) * multiplier;
    }

    return 10;
  };

  // Check if player owns all properties of a color group
  const hasMonopoly = (player: MonopolyPlayerState, group: string): boolean => {
    const groupSpaces = BOARD_SPACES.filter(s => s.group === group);
    return groupSpaces.every(s => player.properties.includes(s.index));
  };

  // Buy Property
  const buyProperty = (playerId: string, spaceIndex: number) => {
    const space = BOARD_SPACES[spaceIndex];
    if (!space.price) return;

    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          money: p.money - (space.price || 0),
          properties: [...p.properties, spaceIndex],
        };
      }
      return p;
    }));

    sound.playCashRegister();
    addLog(`🏢 ${players.find(p => p.id === playerId)?.name} kauft ${space.name} für ${space.price} €!`);
    broadcastAction('BUY_PROPERTY', { playerId, spaceIndex, cost: space.price });
    setInspectedSpace(null);
  };

  // Start Auction
  const startAuction = (spaceIndex: number) => {
    setAuctionSpace(BOARD_SPACES[spaceIndex]);
    setInspectedSpace(null);
    broadcastAction('START_AUCTION', { spaceIndex });
  };

  // End Auction
  const handleAuctionEnd = (winnerId: string, finalAmount: number) => {
    if (!auctionSpace) return;
    const spaceIdx = auctionSpace.index;
    const spaceName = auctionSpace.name;
    setAuctionSpace(null);

    if (winnerId && finalAmount > 0) {
      const winnerPlayer = players.find(p => p.id === winnerId);
      addLog(`🔨 Zuschlag! ${winnerPlayer?.name} ersteigert ${spaceName} für ${finalAmount} €!`);
      sound.playCashRegister();

      setPlayers(prev => prev.map(p => {
        if (p.id === winnerId) {
          return {
            ...p,
            money: p.money - finalAmount,
            properties: [...p.properties, spaceIdx],
          };
        }
        return p;
      }));

      broadcastAction('END_AUCTION', { winnerId, spaceIndex: spaceIdx, finalAmount });
    } else {
      addLog(`🔨 Keine Gebote für ${spaceName}. Bleibt im Besitz der Bank.`);
      broadcastAction('END_AUCTION', { winnerId: '', spaceIndex: spaceIdx, finalAmount: 0 });
    }
  };

  // Build house on a property
  const handleBuildHouse = (spaceIndex: number) => {
    const space = BOARD_SPACES[spaceIndex];
    if (!space.houseCost || !currentPlayer.properties.includes(spaceIndex)) return;
    const currentHouses = currentPlayer.houses[spaceIndex] || 0;
    if (currentHouses >= 5 || currentPlayer.money < space.houseCost) {
      sound.playError();
      return;
    }

    const newCount = currentHouses + 1;
    setPlayers(prev => prev.map(p => {
      if (p.id === currentPlayer.id) {
        return {
          ...p,
          money: p.money - (space.houseCost || 50),
          houses: { ...p.houses, [spaceIndex]: newCount },
        };
      }
      return p;
    }));

    sound.playBuildHouse();
    addLog(`🏡 ${currentPlayer.name} baut ${newCount === 5 ? 'ein HOTEL' : 'ein Haus'} auf ${space.name}!`);
    broadcastAction('BUILD_HOUSE', { playerId: currentPlayer.id, spaceIndex, newCount, cost: space.houseCost });
  };

  // Toggle Mortgage
  const handleToggleMortgage = (spaceIndex: number) => {
    const space = BOARD_SPACES[spaceIndex];
    if (!space.mortgageValue) return;

    const isMortgaged = currentPlayer.mortgaged.includes(spaceIndex);
    if (!isMortgaged) {
      // Take mortgage
      setPlayers(prev => prev.map(p => {
        if (p.id === currentPlayer.id) {
          return {
            ...p,
            money: p.money + (space.mortgageValue || 50),
            mortgaged: [...p.mortgaged, spaceIndex],
          };
        }
        return p;
      }));
      sound.playCashRegister();
      addLog(`🏦 ${currentPlayer.name} nimmt eine Hypothek auf ${space.name} auf (+${space.mortgageValue} €).`);
    } else {
      // Lift mortgage (cost + 10% fee)
      const unmortgageCost = Math.round((space.mortgageValue || 50) * 1.1);
      if (currentPlayer.money < unmortgageCost) {
        sound.playError();
        return;
      }
      setPlayers(prev => prev.map(p => {
        if (p.id === currentPlayer.id) {
          return {
            ...p,
            money: p.money - unmortgageCost,
            mortgaged: p.mortgaged.filter(x => x !== spaceIndex),
          };
        }
        return p;
      }));
      sound.playCashRegister();
      addLog(`✨ ${currentPlayer.name} tilgt die Hypothek auf ${space.name} (-${unmortgageCost} €).`);
    }
  };

  // Send player to jail
  const sendToJail = (playerId: string) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          position: 10,
          inJail: true,
          jailTurns: 0,
        };
      }
      return p;
    }));
  };

  // Confirm card action drawn from deck
  const handleConfirmCard = () => {
    if (!drawnCard) return;
    const card = drawnCard;
    setDrawnCard(null);

    const p = currentPlayer;

    if (card.type === 'money' && card.amount) {
      setPlayers(prev => prev.map(x => x.id === p.id ? { ...x, money: x.money + card.amount! } : x));
      addLog(`📜 ${p.name}: ${card.title} (${card.amount > 0 ? '+' : ''}${card.amount} €).`);
    } else if (card.type === 'move' && card.targetIndex !== undefined) {
      const passedGo = card.targetIndex < p.position;
      setPlayers(prev => prev.map(x => x.id === p.id ? { 
        ...x, 
        position: card.targetIndex!,
        money: passedGo ? x.money + 200 : x.money 
      } : x));
      addLog(`📜 ${p.name} zieht nach ${BOARD_SPACES[card.targetIndex].name}.`);
    } else if (card.type === 'jail') {
      sendToJail(p.id);
      addLog(`👮 ${p.name} muss durch Ereigniskarte ins Gefängnis!`);
    } else if (card.type === 'jail-free') {
      setPlayers(prev => prev.map(x => x.id === p.id ? { ...x, jailFreeCards: x.jailFreeCards + 1 } : x));
      addLog(`🗝️ ${p.name} erhält eine Gefängnis-Freikarte!`);
    } else if (card.type === 'collect-from-players' && card.amount) {
      const perPlayer = card.amount;
      const count = players.filter(x => x.id !== p.id && !x.isBankrupt).length;
      setPlayers(prev => prev.map(x => {
        if (x.id === p.id) return { ...x, money: x.money + perPlayer * count };
        return { ...x, money: x.money - perPlayer };
      }));
      addLog(`🎂 Geburtstag von ${p.name}: Erhält ${perPlayer} € von jedem Mitspieler!`);
    }
  };

  // Trade offer resolution
  const handleSendTradeOffer = (offer: TradeOffer) => {
    setIsTradeOpen(false);
    broadcastAction('TRADE_OFFER', { offer });
    addLog(`🤝 ${currentPlayer.name} sendet ein Handelsangebot an ${players.find(p => p.id === offer.toPlayerId)?.name}.`);
    sound.playClick();
  };

  const handleAcceptTradeOffer = () => {
    if (!incomingTradeOffer) return;
    const offer = incomingTradeOffer;

    const fromP = players.find(p => p.id === offer.fromPlayerId);
    const toP = players.find(p => p.id === offer.toPlayerId);

    if (!fromP || !toP) return;

    const updated = players.map(p => {
      if (p.id === fromP.id) {
        return {
          ...p,
          money: p.money - offer.offerMoney + offer.requestMoney,
          properties: [
            ...p.properties.filter(idx => !offer.offerProperties.includes(idx)),
            ...offer.requestProperties
          ],
        };
      }
      if (p.id === toP.id) {
        return {
          ...p,
          money: p.money + offer.offerMoney - offer.requestMoney,
          properties: [
            ...p.properties.filter(idx => !offer.requestProperties.includes(idx)),
            ...offer.offerProperties
          ],
        };
      }
      return p;
    });

    setPlayers(updated);
    setIncomingTradeOffer(null);
    setIsTradeOpen(false);
    const msg = `🎉 Handel abgeschlossen zwischen ${fromP.name} und ${toP.name}!`;
    addLog(msg);
    sound.playCashRegister();
    broadcastAction('TRADE_RESOLVED', { updatedPlayers: updated, logMsg: msg });
  };

  const handleRejectTradeOffer = () => {
    setIncomingTradeOffer(null);
    setIsTradeOpen(false);
    addLog(`❌ Handelsangebot wurde abgelehnt.`);
    sound.playError();
  };

  // Bankruptcy check
  const checkBankruptcy = (playerId: string) => {
    const p = players.find(x => x.id === playerId);
    if (!p) return;

    if (p.money < 0 && p.properties.length === 0) {
      sound.playError();
      addLog(`💥 ${p.name} ist BANKROTT und scheidet aus dem Spiel aus!`);
      setPlayers(prev => prev.map(x => x.id === playerId ? { ...x, isBankrupt: true } : x));

      // Check remaining active players
      const survivors = players.filter(x => x.id !== playerId && !x.isBankrupt);
      if (survivors.length === 1) {
        handleVictory(survivors[0]);
      }
    }
  };

  // End Current Turn
  const handleEndTurn = () => {
    if (!hasRolled && !currentPlayer.inJail) {
      sound.playError();
      return;
    }

    sound.playClick();
    let nextIdx = (currentTurnIndex + 1) % players.length;
    while (players[nextIdx]?.isBankrupt) {
      nextIdx = (nextIdx + 1) % players.length;
    }

    setCurrentTurnIndex(nextIdx);
    setHasRolled(false);
    setDoublesStreak(0);

    broadcastAction('END_TURN', { nextIndex: nextIdx });
  };

  // Automatic AI Turn Runner
  useEffect(() => {
    if (!isHost || winner) return;
    if (!currentPlayer.isAi || currentPlayer.isBankrupt) return;

    const timeout = setTimeout(() => {
      if (!hasRolled) {
        handleRollDice();
      } else {
        // AI evaluates house building if it has a monopoly
        const fullColorGroups = ['brown', 'light-blue', 'pink', 'orange', 'red', 'yellow', 'green', 'dark-blue'];
        for (const grp of fullColorGroups) {
          if (hasMonopoly(currentPlayer, grp)) {
            const spaces = BOARD_SPACES.filter(s => s.group === grp);
            for (const sp of spaces) {
              const count = currentPlayer.houses[sp.index] || 0;
              if (count < 5 && currentPlayer.money > (sp.houseCost || 100) + 300) {
                handleBuildHouse(sp.index);
                break;
              }
            }
          }
        }
        // End AI turn
        setTimeout(() => {
          handleEndTurn();
        }, 1200);
      }
    }, 1500);

    return () => clearTimeout(timeout);
  }, [isHost, currentTurnIndex, hasRolled, currentPlayer, winner]);

  // Victory declaration
  const handleVictory = (winnerPlayer: MonopolyPlayerState) => {
    setWinner(winnerPlayer);
    sound.playVictory();
    confetti();
    addLog(`👑 ${winnerPlayer.name} IST DER NEUE MONOPOLY 2026 CHAMPION!`);
    if (onGameEnd) {
      onGameEnd(winnerPlayer.name);
    }
  };

  // Reset Game
  const handleResetGame = () => {
    sound.playClick();
    setPlayers(initializePlayers());
    setCurrentTurnIndex(0);
    setDice([1, 2]);
    setIsRolling(false);
    setHasRolled(false);
    setDoublesStreak(0);
    setFreeParkingPot(100);
    setWinner(null);
    setGameLog(['Neues Monopoly 2026 Spiel gestartet!']);
  };

  // Check if current user can build/mortgage inspected space
  const isInspectedOwnedByMe = inspectedSpace ? currentPlayer.properties.includes(inspectedSpace.index) : false;
  const inspectedGroupHasMonopoly = inspectedSpace?.group ? hasMonopoly(currentPlayer, inspectedSpace.group) : false;
  const inspectedHousesCount = inspectedSpace ? (currentPlayer.houses[inspectedSpace.index] || 0) : 0;
  const isInspectedMortgaged = inspectedSpace ? currentPlayer.mortgaged.includes(inspectedSpace.index) : false;

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center select-none text-white">
      {/* 1. TOP PLAYERS BAR / HUD */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {players.map((p, idx) => {
          const isTurn = idx === currentTurnIndex;
          const isMe = p.id === currentUserId;
          return (
            <div
              key={p.id}
              className={`p-2.5 rounded-2xl border transition duration-200 relative overflow-hidden flex items-center justify-between shadow-lg ${
                isTurn 
                  ? 'bg-slate-800/95 border-amber-400 ring-2 ring-amber-400/40' 
                  : p.isBankrupt 
                    ? 'bg-slate-900/40 border-slate-800 opacity-40' 
                    : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              {/* Turn indicator glow */}
              {isTurn && (
                <div 
                  className="absolute top-0 left-0 bottom-0 w-1.5"
                  style={{ backgroundColor: p.color }}
                />
              )}

              <div className="flex items-center gap-2 pl-1 truncate">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow"
                  style={{ backgroundColor: `${p.color}30`, borderColor: p.color }}
                >
                  <MonopolyFigureRenderer figureId={p.figure as MonopolyFigureId} size={22} />
                </div>
                <div className="truncate">
                  <div className="text-xs font-black truncate flex items-center gap-1">
                    <span>{p.name}</span>
                    {isMe && <span className="text-[10px] text-amber-400">(Du)</span>}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {p.isBankrupt ? 'Bankrott' : `${p.properties.length} Straßen`}
                    {p.inJail && ' • ⛓️ Gefängnis'}
                  </div>
                </div>
              </div>

              {/* Player Money */}
              <div className="text-right shrink-0">
                <div className="text-sm font-black font-mono text-emerald-400">
                  {p.money} €
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. MOBILE TABS TOGGLE (Brett, Meine Straßen, Log) */}
      <div className="sm:hidden w-full flex items-center gap-1.5 mb-2 bg-slate-900/80 p-1 rounded-2xl border border-slate-800">
        <button
          onClick={() => setMobileTab('board')}
          className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition ${
            mobileTab === 'board' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          🎲 Brett
        </button>
        <button
          onClick={() => setMobileTab('properties')}
          className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition ${
            mobileTab === 'properties' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          🏘️ Straßen ({currentPlayer.properties.length})
        </button>
        <button
          onClick={() => setMobileTab('log')}
          className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition ${
            mobileTab === 'log' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          📜 Ticker
        </button>
      </div>

      {/* 3. MAIN GAMEPLAY AREA */}
      <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4">
        {/* Left / Center: Authentic 40-Spaces Board */}
        <div className={`w-full lg:w-auto flex flex-col items-center ${mobileTab !== 'board' ? 'hidden sm:flex' : 'flex'}`}>
          <MonopolyBoardRenderer
            players={players}
            currentTurnPlayerId={currentPlayer.id}
            dice={dice}
            isRolling={isRolling}
            freeParkingPot={freeParkingPot}
            onSelectSpace={(sp) => setInspectedSpace(sp)}
            onRollDice={handleRollDice}
            canRoll={!hasRolled && isMyTurn}
            isMyTurn={isMyTurn}
          />
        </div>

        {/* Right Column: Player Controls & Management Panels */}
        <div className="w-full lg:w-80 flex flex-col gap-3">
          {/* Turn Action Strip */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: currentPlayer.color }} />
                <span className="text-xs font-black text-slate-300">
                  {isMyTurn ? 'Du bist am Zug!' : `${currentPlayer.name} zieht...`}
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-amber-400">
                Würfel: {dice[0]} + {dice[1]} = {dice[0] + dice[1]}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="space-y-2">
              {isMyTurn && !hasRolled && (
                <button
                  onClick={handleRollDice}
                  disabled={isRolling}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-black text-sm shadow-lg flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <Dices className="w-4 h-4" />
                  <span>Jetzt Würfeln!</span>
                </button>
              )}

              {/* If landed on unowned property */}
              {isMyTurn && hasRolled && BOARD_SPACES[currentPlayer.position].price && !players.some(p => p.properties.includes(currentPlayer.position)) && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => buyProperty(currentPlayer.id, currentPlayer.position)}
                    disabled={currentPlayer.money < (BOARD_SPACES[currentPlayer.position].price || 0)}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow flex items-center justify-center gap-1.5 transition"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Kaufen ({BOARD_SPACES[currentPlayer.position].price} €)</span>
                  </button>
                  <button
                    onClick={() => startAuction(currentPlayer.position)}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Versteigern</span>
                  </button>
                </div>
              )}

              {/* Open Trade Button */}
              <button
                onClick={() => {
                  sound.playClick();
                  setIsTradeOpen(true);
                }}
                className="w-full py-2.5 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Handelszentrum öffnen</span>
              </button>

              {/* End Turn Button */}
              {isMyTurn && hasRolled && (
                <button
                  onClick={handleEndTurn}
                  className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs flex items-center justify-center gap-1.5 border border-slate-700 shadow transition"
                >
                  <span>Zug beenden</span>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </button>
              )}
            </div>
          </div>

          {/* Properties Inventory Panel */}
          <div className={`p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2.5 ${mobileTab === 'properties' ? 'block' : 'hidden sm:block'}`}>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-amber-400" />
                <span>Deine Besitztümer ({currentPlayer.properties.length})</span>
              </h4>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">{currentPlayer.money} €</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {currentPlayer.properties.length === 0 ? (
                <div className="text-xs text-slate-500 italic py-4 text-center">
                  Du besitzt noch keine Grundstücke. Würfle und kaufe Straßen!
                </div>
              ) : (
                currentPlayer.properties.map(idx => {
                  const sp = BOARD_SPACES[idx];
                  const col = sp.group ? PROPERTY_GROUP_COLORS[sp.group] : null;
                  const houses = currentPlayer.houses[idx] || 0;
                  const isMortgaged = currentPlayer.mortgaged.includes(idx);

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        sound.playClick();
                        setInspectedSpace(sp);
                      }}
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 flex items-center justify-between text-xs cursor-pointer transition"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {col && <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: col.bg }} />}
                        <span className="font-bold truncate text-slate-200">{sp.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {houses > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-bold">
                            {houses === 5 ? '1 Hotel' : `${houses} H.`}
                          </span>
                        )}
                        {isMortgaged && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300 font-bold">
                            Hypothek
                          </span>
                        )}
                        <span className="text-slate-400 font-mono text-[11px]">{sp.price} €</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Live Game Event Ticker */}
          <div className={`p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2 ${mobileTab === 'log' ? 'block' : 'hidden sm:block'}`}>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Live Spiel-Ticker
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto text-xs text-slate-300 pr-1">
              {gameLog.map((log, i) => (
                <div key={i} className="py-1 border-b border-slate-800/60 leading-snug">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. MODALS & POPUPS */}
      {/* Deed Inspector Modal */}
      {inspectedSpace && (
        <MonopolyDeedModal
          space={inspectedSpace}
          onClose={() => setInspectedSpace(null)}
          ownerName={players.find(p => p.properties.includes(inspectedSpace.index))?.name}
          ownerColor={players.find(p => p.properties.includes(inspectedSpace.index))?.color}
          housesCount={inspectedHousesCount}
          isMortgaged={isInspectedMortgaged}
          canBuild={isInspectedOwnedByMe && inspectedGroupHasMonopoly && inspectedHousesCount < 5 && isMyTurn}
          canSellHouse={isInspectedOwnedByMe && inspectedHousesCount > 0 && isMyTurn}
          canMortgage={isInspectedOwnedByMe && inspectedHousesCount === 0 && !isInspectedMortgaged && isMyTurn}
          canUnmortgage={isInspectedOwnedByMe && isInspectedMortgaged && isMyTurn}
          onBuildHouse={() => handleBuildHouse(inspectedSpace.index)}
          onToggleMortgage={() => handleToggleMortgage(inspectedSpace.index)}
        />
      )}

      {/* Trade Modal */}
      {isTradeOpen && (
        <MonopolyTradeModal
          currentUser={currentPlayer}
          players={players}
          incomingOffer={incomingTradeOffer}
          onSendOffer={handleSendTradeOffer}
          onAcceptOffer={handleAcceptTradeOffer}
          onRejectOffer={handleRejectTradeOffer}
          onClose={() => setIsTradeOpen(false)}
        />
      )}

      {/* Auction Modal */}
      {auctionSpace && (
        <MonopolyAuctionModal
          space={auctionSpace}
          players={players}
          currentUserId={currentUserId}
          isHost={isHost}
          onBid={(bidderId, amount) => {
            broadcastAction('AUCTION_BID', { bidderId, amount });
          }}
          onPass={(bidderId) => {
            broadcastAction('AUCTION_PASS', { bidderId });
          }}
          onAuctionEnd={handleAuctionEnd}
        />
      )}

      {/* Chance / Community Card Drawn Modal */}
      {drawnCard && (
        <MonopolyCardModal
          card={drawnCard}
          onConfirm={handleConfirmCard}
        />
      )}

      {/* Winner Fanfare Modal */}
      {winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-gradient-to-b from-amber-950/80 to-slate-900 border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(245,158,11,0.4)] text-center text-white">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-amber-300 mb-1">
              HERZLICHEN GLÜCKWUNSCH!
            </h2>
            <p className="text-sm text-slate-300 font-bold mb-4">
              <span className="text-white font-black">{winner.name}</span> hat das Monopol an sich gerissen und gewinnt Monopoly 2026!
            </p>
            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs text-slate-300 mb-6 flex justify-around">
              <div>Endvermögen: <span className="font-mono text-emerald-400 font-bold">{winner.money} €</span></div>
              <div>Besitztümer: <span className="font-bold text-amber-400">{winner.properties.length}</span></div>
            </div>
            <button
              onClick={handleResetGame}
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
