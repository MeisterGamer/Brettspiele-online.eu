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

export const CatanGame: React.FC<CatanGameProps> = ({
  onGameEnd,
  tableParticipants,
  currentUserId = 'user-1',
  onActiveTurnChange,
  roomCode,
  isHost = true,
}) => {
  // Preset Bot configurations
  const BOT_PRESETS = [
    { name: 'Oma Grete (KI)', color: '#3b82f6', badgeColor: 'bg-blue-600' }, // Blue
    { name: 'Papa Thomas (KI)', color: '#ef4444', badgeColor: 'bg-red-600' }, // Red
    { name: 'Junior Leo (KI)', color: '#eab308', badgeColor: 'bg-yellow-500' }, // Yellow
    { name: 'Tante Lisa (KI)', color: '#10b981', badgeColor: 'bg-emerald-600' }, // Green
  ];

  // Board Geometry & Elements
  const [board, setBoard] = useState<{
    hexes: CatanHex[];
    vertices: CatanVertex[];
    edges: CatanEdge[];
    desertHexId: number;
  }>(() => generateCatanBoard());

  const [robberHexId, setRobberHexId] = useState<number>(() => board.desertHexId);

  // Players State
  const [players, setPlayers] = useState<CatanPlayerState[]>(() => {
    // Colors: Orange/Red for human, Blue, Yellow, Green for others
    const initialColors = ['#f97316', '#3b82f6', '#eab308', '#10b981'];
    const pList: CatanPlayerState[] = [];

    if (tableParticipants && tableParticipants.length > 0) {
      tableParticipants.slice(0, 4).forEach((part, idx) => {
        pList.push({
          id: part.id,
          name: part.name,
          color: initialColors[idx],
          badgeColor: ['bg-orange-500', 'bg-blue-500', 'bg-yellow-500', 'bg-emerald-500'][idx],
          avatar: part.avatar,
          isAi: part.isBot || false,
          resources: { wood: 0, brick: 0, wool: 0, wheat: 0, ore: 0 },
          settlements: [],
          cities: [],
          roads: [],
          devCards: { knight: 0, victoryPoint: 0, roadBuilding: 0, yearOfPlenty: 0, monopoly: 0 },
          playedKnights: 0,
          hasLongestRoad: false,
          hasLargestArmy: false,
          victoryPoints: 0,
        });
      });
    }

    // Fill remaining up to 4 players with bots if < 3
    while (pList.length < 4) {
      const botIdx = pList.length;
      const preset = BOT_PRESETS[botIdx];
      pList.push({
        id: `bot-catan-${botIdx + 1}`,
        name: preset.name,
        color: preset.color,
        badgeColor: preset.badgeColor,
        avatar: null,
        isAi: true,
        resources: { wood: 0, brick: 0, wool: 0, wheat: 0, ore: 0 },
        settlements: [],
        cities: [],
        roads: [],
        devCards: { knight: 0, victoryPoint: 0, roadBuilding: 0, yearOfPlenty: 0, monopoly: 0 },
        playedKnights: 0,
        hasLongestRoad: false,
        hasLargestArmy: false,
        victoryPoints: 0,
      });
    }

    return pList;
  });

  // Turn management
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [gamePhase, setGamePhase] = useState<CatanGamePhase>('SETUP_1');
  const [setupSubStep, setSetupSubStep] = useState<'settlement' | 'road'>('settlement');
  const [lastPlacedVertexId, setLastPlacedVertexId] = useState<number | null>(null);

  // Dice roll state
  const [dice, setDice] = useState<[number, number]>([3, 4]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [lastDiceSum, setLastDiceSum] = useState<number | null>(null);
  const [lastRollProducingHexIds, setLastRollProducingHexIds] = useState<number[]>([]);

  // Building & Selection mode
  const [activeBuildingMode, setActiveBuildingMode] = useState<'settlement' | 'city' | 'road' | 'robber' | null>('settlement');

  // Development Cards Deck
  const [devCardDeck, setDevCardDeck] = useState<DevCardType[]>(() => {
    return [...INITIAL_DEV_CARDS_DECK].sort(() => Math.random() - 0.5);
  });

  // UI Modals & Panels
  const [isTradeOpen, setIsTradeOpen] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isDevCardsOpen, setIsDevCardsOpen] = useState<boolean>(false);
  const [isRobberStealModalOpen, setIsRobberStealModalOpen] = useState<boolean>(false);
  const [robberVictims, setRobberVictims] = useState<CatanPlayerState[]>([]);
  const [isYearOfPlentyOpen, setIsYearOfPlentyOpen] = useState<boolean>(false);
  const [yearOfPlentySelection, setYearOfPlentySelection] = useState<[ResourceType, ResourceType]>(['wood', 'brick']);
  const [isMonopolyOpen, setIsMonopolyOpen] = useState<boolean>(false);
  const [winner, setWinner] = useState<CatanPlayerState | null>(null);

  // Action Log
  const [actionLog, setActionLog] = useState<CatanActionLogItem[]>([
    {
      id: 'init-1',
      text: 'Willkommen auf der Insel Catan! Startaufstellung Runde 1: Platziere deine 1. Siedlung.',
      time: 'Start',
      color: 'text-amber-300',
      icon: '🏝️',
    },
  ]);

  const activePlayer = players[activePlayerIndex];
  const isHumanTurn = activePlayer && !activePlayer.isAi && (activePlayer.id === currentUserId || (!tableParticipants?.some(p => p.id === currentUserId) && activePlayerIndex === 0));

  // Sync turn to room
  useEffect(() => {
    if (activePlayer && onActiveTurnChange) {
      onActiveTurnChange(activePlayer.id);
    }
  }, [activePlayerIndex, activePlayer?.id]);

  const addLog = (text: string, icon = '📜', color = 'text-slate-200') => {
    const item: CatanActionLogItem = {
      id: `log-${Date.now()}-${Math.random()}`,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      icon,
      color,
    };
    setActionLog((prev) => [item, ...prev.slice(0, 45)]);
  };

  // Helper: Count total resource cards in hand
  const getTotalCards = (res: ResourceCount) => {
    return res.wood + res.brick + res.wool + res.wheat + res.ore;
  };

  // Distance Rule check: vertex can only have settlement if NONE of its neighbor vertices have a settlement or city
  const satisfiesDistanceRule = (vertexId: number): boolean => {
    const vObj = board.vertices.find((v) => v.id === vertexId);
    if (!vObj) return false;

    // Check if this vertex already has a building
    for (const p of players) {
      if (p.settlements.includes(vertexId) || p.cities.includes(vertexId)) return false;
    }

    // Check all adjacent neighbor vertices
    for (const nId of vObj.neighborVertexIds) {
      for (const p of players) {
        if (p.settlements.includes(nId) || p.cities.includes(nId)) return false;
      }
    }

    return true;
  };

  // Road Connectivity check
  const satisfiesRoadConnectivity = (edgeId: string, player: CatanPlayerState): boolean => {
    const edgeObj = board.edges.find((e) => e.id === edgeId);
    if (!edgeObj) return false;

    // Must not be already taken
    for (const p of players) {
      if (p.roads.includes(edgeId)) return false;
    }

    // During setup, road must connect directly to the last placed settlement
    if ((gamePhase === 'SETUP_1' || gamePhase === 'SETUP_2') && lastPlacedVertexId !== null) {
      return edgeObj.v1 === lastPlacedVertexId || edgeObj.v2 === lastPlacedVertexId;
    }

    // During normal game, must connect to at least one of player's roads or settlements/cities
    const hasConnectingBuilding =
      player.settlements.includes(edgeObj.v1) ||
      player.settlements.includes(edgeObj.v2) ||
      player.cities.includes(edgeObj.v1) ||
      player.cities.includes(edgeObj.v2);

    if (hasConnectingBuilding) return true;

    // Check connecting own roads
    const hasConnectingRoad = player.roads.some((rId) => {
      const otherEdge = board.edges.find((e) => e.id === rId);
      if (!otherEdge) return false;
      return (
        otherEdge.v1 === edgeObj.v1 ||
        otherEdge.v2 === edgeObj.v1 ||
        otherEdge.v1 === edgeObj.v2 ||
        otherEdge.v2 === edgeObj.v2
      );
    });

    return hasConnectingRoad;
  };

  // Settlement Connectivity check (during main game must connect to own road)
  const satisfiesSettlementConnectivity = (vertexId: number, player: CatanPlayerState): boolean => {
    if (gamePhase === 'SETUP_1' || gamePhase === 'SETUP_2') return true;
    const vObj = board.vertices.find((v) => v.id === vertexId);
    if (!vObj) return false;

    return vObj.adjacentEdgeIds.some((edgeId) => player.roads.includes(edgeId));
  };

  // Harbor types owned by a player
  const getPlayerHarborTypes = (player: CatanPlayerState): ('generic' | ResourceType)[] => {
    const allBuildings = [...player.settlements, ...player.cities];
    const harbors: ('generic' | ResourceType)[] = [];
    allBuildings.forEach((vId) => {
      const v = board.vertices.find((vert) => vert.id === vId);
      if (v?.harbor && !harbors.includes(v.harbor.type)) {
        harbors.push(v.harbor.type);
      }
    });
    return harbors;
  };

  // Highlighted Target Computations
  const getHighlightedVertexIds = (): number[] => {
    if (gamePhase === 'SETUP_1' || gamePhase === 'SETUP_2') {
      if (setupSubStep === 'settlement') {
        return board.vertices.filter((v) => satisfiesDistanceRule(v.id)).map((v) => v.id);
      }
      return [];
    }

    if (gamePhase === 'MAIN_ACTION') {
      if (activeBuildingMode === 'settlement') {
        return board.vertices
          .filter((v) => satisfiesDistanceRule(v.id))
          .filter((v) => satisfiesSettlementConnectivity(v.id, activePlayer))
          .map((v) => v.id);
      }
      if (activeBuildingMode === 'city') {
        return activePlayer.settlements;
      }
    }
    return [];
  };

  const getHighlightedEdgeIds = (): string[] => {
    if (gamePhase === 'SETUP_1' || gamePhase === 'SETUP_2') {
      if (setupSubStep === 'road' && lastPlacedVertexId !== null) {
        const v = board.vertices.find((vert) => vert.id === lastPlacedVertexId);
        if (!v) return [];
        return v.adjacentEdgeIds.filter((eId) => !players.some((p) => p.roads.includes(eId)));
      }
      return [];
    }

    if (gamePhase === 'MAIN_ACTION' && activeBuildingMode === 'road') {
      return board.edges
        .filter((e) => satisfiesRoadConnectivity(e.id, activePlayer))
        .map((e) => e.id);
    }

    return [];
  };

  const getHighlightedHexIds = (): number[] => {
    if (gamePhase === 'ROBBER_MOVE' || (gamePhase === 'MAIN_ACTION' && activeBuildingMode === 'robber')) {
      return board.hexes.filter((h) => h.id !== robberHexId).map((h) => h.id);
    }
    return [];
  };

  // Calculate Longest Road Length for a player (DFS on player's road graph)
  const calculateLongestRoad = (player: CatanPlayerState): number => {
    if (player.roads.length < 5) return player.roads.length;
    // Graph representation
    const adj = new Map<number, string[]>();
    player.roads.forEach((rId) => {
      const e = board.edges.find((edge) => edge.id === rId);
      if (!e) return;
      if (!adj.has(e.v1)) adj.set(e.v1, []);
      if (!adj.has(e.v2)) adj.set(e.v2, []);
      adj.get(e.v1)!.push(rId);
      adj.get(e.v2)!.push(rId);
    });

    let maxLen = 0;

    const dfs = (currV: number, visitedEdges: Set<string>, currentLen: number) => {
      maxLen = Math.max(maxLen, currentLen);
      const edgesFromHere = adj.get(currV) || [];
      for (const eId of edgesFromHere) {
        if (!visitedEdges.has(eId)) {
          const edge = board.edges.find((e) => e.id === eId);
          if (!edge) continue;
          const nextV = edge.v1 === currV ? edge.v2 : edge.v1;
          visitedEdges.add(eId);
          dfs(nextV, visitedEdges, currentLen + 1);
          visitedEdges.delete(eId);
        }
      }
    };

    adj.forEach((_, startV) => {
      dfs(startV, new Set<string>(), 0);
    });

    return maxLen;
  };

  // Update Special Cards: Longest Road & Largest Army, and check Victory
  const checkSpecialCardsAndVictory = (currentPlayers: CatanPlayerState[]) => {
    const updated = currentPlayers.map((p) => ({ ...p }));

    // 1. Longest Road check (minimum 5 roads)
    let longestLen = 4;
    let longestPlayerId: string | null = null;
    const currentHolder = updated.find((p) => p.hasLongestRoad);

    updated.forEach((p) => {
      const len = calculateLongestRoad(p);
      if (len >= 5) {
        if (currentHolder && p.id === currentHolder.id) {
          if (len >= longestLen) {
            longestLen = len;
            longestPlayerId = p.id;
          }
        } else if (len > longestLen) {
          longestLen = len;
          longestPlayerId = p.id;
        }
      }
    });

    updated.forEach((p) => {
      const had = p.hasLongestRoad;
      const hasNow = p.id === longestPlayerId;
      p.hasLongestRoad = hasNow;
      if (!had && hasNow) {
        sound.playReward();
        addLog(`🏆 ${p.name} übernimmt die Längste Handelsstraße (2 Siegpunkte)!`, '🛣️', 'text-amber-400');
      }
    });

    // 2. Largest Army check (minimum 3 played knights)
    let maxKnights = 2;
    let armyPlayerId: string | null = null;
    const armyHolder = updated.find((p) => p.hasLargestArmy);

    updated.forEach((p) => {
      if (p.playedKnights >= 3) {
        if (armyHolder && p.id === armyHolder.id) {
          if (p.playedKnights >= maxKnights) {
            maxKnights = p.playedKnights;
            armyPlayerId = p.id;
          }
        } else if (p.playedKnights > maxKnights) {
          maxKnights = p.playedKnights;
          armyPlayerId = p.id;
        }
      }
    });

    updated.forEach((p) => {
      const had = p.hasLargestArmy;
      const hasNow = p.id === armyPlayerId;
      p.hasLargestArmy = hasNow;
      if (!had && hasNow) {
        sound.playReward();
        addLog(`⚔️ ${p.name} erobert die Größte Rittermacht (2 Siegpunkte)!`, '⚔️', 'text-amber-400');
      }
    });

    // 3. Victory Points sum calculation
    updated.forEach((p) => {
      let vp = 0;
      vp += p.settlements.length * 1; // 1 VP per settlement
      vp += p.cities.length * 2; // 2 VP per city
      if (p.hasLongestRoad) vp += 2;
      if (p.hasLargestArmy) vp += 2;
      vp += p.devCards.victoryPoint; // 1 VP per victory point card
      p.victoryPoints = vp;
    });

    // 4. Win condition (10 Victory Points)
    const victor = updated.find((p) => p.victoryPoints >= 10);
    if (victor && gamePhase !== 'GAME_OVER') {
      setWinner(victor);
      setGamePhase('GAME_OVER');
      sound.playVictory();
      confetti({ particleCount: 160, spread: 80 });
      addLog(`🎉🏆 ${victor.name} hat mit ${victor.victoryPoints} Siegpunkten die Insel Catan siegreich besiedelt!`, '👑', 'text-amber-300');
      if (onGameEnd) onGameEnd(victor.name);
    }

    return updated;
  };

  // Handle Vertex Click (Settlement or City building)
  const handleVertexClick = (vertexId: number) => {
    if (!isHumanTurn && gamePhase !== 'SETUP_1' && gamePhase !== 'SETUP_2') return;

    // SETUP ROUND 1 & 2 SETTLEMENT
    if ((gamePhase === 'SETUP_1' || gamePhase === 'SETUP_2') && setupSubStep === 'settlement') {
      if (!satisfiesDistanceRule(vertexId)) {
        sound.playError();
        return;
      }

      sound.playClick();
      const updatedPlayers = [...players];
      const p = updatedPlayers[activePlayerIndex];
      p.settlements.push(vertexId);

      // In SETUP_2, award initial starting resources for each adjacent hex
      if (gamePhase === 'SETUP_2') {
        const vObj = board.vertices.find((vert) => vert.id === vertexId);
        if (vObj) {
          const startingRes: ResourceType[] = [];
          vObj.adjacentHexIds.forEach((hId) => {
            const hex = board.hexes.find((h) => h.id === hId);
            if (hex && hex.resource) {
              p.resources[hex.resource] += 1;
              startingRes.push(hex.resource);
            }
          });
          if (startingRes.length > 0) {
            addLog(`${p.name} erhält Startrohstoffe: ${startingRes.join(', ')}`, '🌾', 'text-emerald-400');
          }
        }
      }

      setLastPlacedVertexId(vertexId);
      setSetupSubStep('road');
      setActiveBuildingMode('road');
      setPlayers(checkSpecialCardsAndVictory(updatedPlayers));
      addLog(`${p.name} baut eine Siedlung. Platziere nun deine Straße.`, '🏠');
      return;
    }

    // MAIN ACTION - SETTLEMENT
    if (gamePhase === 'MAIN_ACTION' && activeBuildingMode === 'settlement') {
      const cost = BUILDING_COSTS.settlement;
      const canAfford =
        activePlayer.resources.wood >= (cost.wood || 0) &&
        activePlayer.resources.brick >= (cost.brick || 0) &&
        activePlayer.resources.wool >= (cost.wool || 0) &&
        activePlayer.resources.wheat >= (cost.wheat || 0);

      if (!canAfford) {
        sound.playError();
        addLog('Nicht genügend Rohstoffe für eine Siedlung (1 Holz, 1 Lehm, 1 Wolle, 1 Getreide).', '⚠️', 'text-rose-400');
        return;
      }

      if (activePlayer.settlements.length >= 5) {
        sound.playError();
        addLog('Maximal 5 Siedlungen erlaubt. Baue Siedlungen zu Städten aus!', '⚠️', 'text-amber-400');
        return;
      }

      if (!satisfiesDistanceRule(vertexId) || !satisfiesSettlementConnectivity(vertexId, activePlayer)) {
        sound.playError();
        return;
      }

      sound.playReward();
      const updated = [...players];
      const p = updated[activePlayerIndex];
      p.resources.wood -= 1;
      p.resources.brick -= 1;
      p.resources.wool -= 1;
      p.resources.wheat -= 1;
      p.settlements.push(vertexId);

      setActiveBuildingMode(null);
      setPlayers(checkSpecialCardsAndVictory(updated));
      addLog(`${p.name} baut eine neue Siedlung (+1 Siegpunkt)!`, '🏠', 'text-emerald-400');
      return;
    }

    // MAIN ACTION - CITY UPGRADE
    if (gamePhase === 'MAIN_ACTION' && activeBuildingMode === 'city') {
      const cost = BUILDING_COSTS.city;
      const canAfford =
        activePlayer.resources.wheat >= (cost.wheat || 0) &&
        activePlayer.resources.ore >= (cost.ore || 0);

      if (!canAfford) {
        sound.playError();
        addLog('Nicht genügend Rohstoffe für eine Stadt (2 Getreide, 3 Erz).', '⚠️', 'text-rose-400');
        return;
      }

      if (activePlayer.cities.length >= 4) {
        sound.playError();
        addLog('Maximal 4 Städte erlaubt!', '⚠️', 'text-amber-400');
        return;
      }

      if (!activePlayer.settlements.includes(vertexId)) {
        sound.playError();
        addLog('Wähle eine deiner vorhandenen Siedlungen zum Stadtausbau.', '⚠️');
        return;
      }

      sound.playReward();
      const updated = [...players];
      const p = updated[activePlayerIndex];
      p.resources.wheat -= 2;
      p.resources.ore -= 3;
      p.settlements = p.settlements.filter((id) => id !== vertexId);
      p.cities.push(vertexId);

      setActiveBuildingMode(null);
      setPlayers(checkSpecialCardsAndVictory(updated));
      addLog(`${p.name} baut eine Stadt (+2 Siegpunkte, 2x Ertrag)!`, '🏰', 'text-amber-300');
      return;
    }
  };

  // Handle Edge Click (Road building)
  const handleEdgeClick = (edgeId: string) => {
    if (!isHumanTurn && gamePhase !== 'SETUP_1' && gamePhase !== 'SETUP_2') return;

    // SETUP ROUND 1 & 2 ROAD
    if ((gamePhase === 'SETUP_1' || gamePhase === 'SETUP_2') && setupSubStep === 'road') {
      if (!satisfiesRoadConnectivity(edgeId, activePlayer)) {
        sound.playError();
        return;
      }

      sound.playClick();
      const updatedPlayers = [...players];
      const p = updatedPlayers[activePlayerIndex];
      p.roads.push(edgeId);

      setLastPlacedVertexId(null);
      addLog(`${p.name} baut eine Straße.`, '🛣️');

      // Setup phase sequencing
      if (gamePhase === 'SETUP_1') {
        if (activePlayerIndex < players.length - 1) {
          // Next player in setup 1
          setActivePlayerIndex(activePlayerIndex + 1);
          setSetupSubStep('settlement');
          setActiveBuildingMode('settlement');
        } else {
          // Reached last player: start setup 2 in reverse order!
          setGamePhase('SETUP_2');
          setSetupSubStep('settlement');
          setActiveBuildingMode('settlement');
          addLog('Startaufstellung Runde 2 (rückwärts): Zweite Siedlung mit Startrohstoffen!', '🌾', 'text-amber-300');
        }
      } else if (gamePhase === 'SETUP_2') {
        if (activePlayerIndex > 0) {
          // Previous player in reverse setup 2
          setActivePlayerIndex(activePlayerIndex - 1);
          setSetupSubStep('settlement');
          setActiveBuildingMode('settlement');
        } else {
          // Setup finished! Start regular game from player 0
          setGamePhase('ROLL');
          setSetupSubStep('settlement');
          setActiveBuildingMode(null);
          setActivePlayerIndex(0);
          sound.playReward();
          addLog('Startphase abgeschlossen! Das Spiel beginnt: Würfle zum Start!', '🎲', 'text-emerald-400');
        }
      }

      setPlayers(checkSpecialCardsAndVictory(updatedPlayers));
      return;
    }

    // MAIN ACTION - ROAD
    if (gamePhase === 'MAIN_ACTION' && activeBuildingMode === 'road') {
      const cost = BUILDING_COSTS.road;
      const canAfford =
        activePlayer.resources.wood >= (cost.wood || 0) &&
        activePlayer.resources.brick >= (cost.brick || 0);

      if (!canAfford) {
        sound.playError();
        addLog('Nicht genügend Rohstoffe für eine Straße (1 Holz, 1 Lehm).', '⚠️', 'text-rose-400');
        return;
      }

      if (activePlayer.roads.length >= 15) {
        sound.playError();
        addLog('Maximal 15 Straßen erlaubt!', '⚠️', 'text-amber-400');
        return;
      }

      if (!satisfiesRoadConnectivity(edgeId, activePlayer)) {
        sound.playError();
        return;
      }

      sound.playReward();
      const updated = [...players];
      const p = updated[activePlayerIndex];
      p.resources.wood -= 1;
      p.resources.brick -= 1;
      p.roads.push(edgeId);

      setActiveBuildingMode(null);
      setPlayers(checkSpecialCardsAndVictory(updated));
      addLog(`${p.name} baut eine Straße.`, '🛣️');
      return;
    }
  };

  // Roll Dice Action
  const handleRollDice = () => {
    if (gamePhase !== 'ROLL' || isRolling) return;
    setIsRolling(true);
    sound.playDiceRoll();

    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const sum = d1 + d2;
      setDice([d1, d2]);
      setLastDiceSum(sum);
      setIsRolling(false);

      addLog(`🎲 ${activePlayer.name} würfelt eine ${sum} (${d1} + ${d2})!`, '🎲', 'text-amber-300');

      if (sum === 7) {
        // 7 Rolled: Robber strike!
        sound.playError();
        addLog('⚠️ Eine 7 gewürfelt! Der Räuber schlägt zu!', '🦹', 'text-rose-400');

        // Check cards over 7: discard half
        const updatedPlayers = players.map((p) => {
          const totalCards = getTotalCards(p.resources);
          if (totalCards > 7) {
            const discardCount = Math.floor(totalCards / 2);
            // Discard randomly from AI or player
            let remainingToDiscard = discardCount;
            const newRes = { ...p.resources };
            const resKeys: ResourceType[] = ['wood', 'brick', 'wool', 'wheat', 'ore'];
            while (remainingToDiscard > 0) {
              const availableKeys = resKeys.filter((k) => newRes[k] > 0);
              if (availableKeys.length === 0) break;
              const pick = availableKeys[Math.floor(Math.random() * availableKeys.length)];
              newRes[pick] -= 1;
              remainingToDiscard--;
            }
            addLog(`${p.name} hatte ${totalCards} Karten und muss ${discardCount} Rohstoffe abgeben.`, '📉', 'text-rose-300');
            return { ...p, resources: newRes };
          }
          return p;
        });

        setPlayers(updatedPlayers);
        setGamePhase('ROBBER_MOVE');
        setActiveBuildingMode('robber');
      } else {
        // Regular Resource Production
        const producingHexes = board.hexes.filter((h) => h.number === sum && h.id !== robberHexId);
        setLastRollProducingHexIds(producingHexes.map((h) => h.id));

        const updated = players.map((p) => ({ ...p, resources: { ...p.resources } }));
        let anyProduced = false;

        producingHexes.forEach((hex) => {
          if (!hex.resource) return;
          const res = hex.resource;

          hex.vertexIds.forEach((vId) => {
            updated.forEach((p) => {
              if (p.settlements.includes(vId)) {
                p.resources[res] += 1;
                anyProduced = true;
                addLog(`+1 ${RESOURCE_COLORS[res].labelDe} für ${p.name} (Siedlung)`, RESOURCE_COLORS[res].icon, 'text-emerald-400');
              } else if (p.cities.includes(vId)) {
                p.resources[res] += 2;
                anyProduced = true;
                addLog(`+2 ${RESOURCE_COLORS[res].labelDe} für ${p.name} (Stadt)`, RESOURCE_COLORS[res].icon, 'text-emerald-400');
              }
            });
          });
        });

        if (!anyProduced) {
          addLog(`Keine Siedlungen an den Feldern mit der Zahl ${sum}.`, 'ℹ️', 'text-slate-400');
        } else {
          sound.playReward();
        }

        setPlayers(updated);
        setGamePhase('MAIN_ACTION');
        setActiveBuildingMode(null);
      }
    }, 600);
  };

  // Move Robber to new hex
  const handleHexClick = (hexId: number) => {
    if (gamePhase !== 'ROBBER_MOVE' && !(gamePhase === 'MAIN_ACTION' && activeBuildingMode === 'robber')) return;
    if (hexId === robberHexId) {
      sound.playError();
      return;
    }

    sound.playClick();
    setRobberHexId(hexId);
    const targetHex = board.hexes.find((h) => h.id === hexId);

    // Identify victim candidates
    const candidateVictims: CatanPlayerState[] = [];
    if (targetHex) {
      targetHex.vertexIds.forEach((vId) => {
        players.forEach((p) => {
          if (p.id !== activePlayer.id && (p.settlements.includes(vId) || p.cities.includes(vId))) {
            if (!candidateVictims.some((v) => v.id === p.id) && getTotalCards(p.resources) > 0) {
              candidateVictims.push(p);
            }
          }
        });
      });
    }

    addLog(`${activePlayer.name} versetzt den Räuber auf Feld #${hexId} (${targetHex?.terrain})`, '🦹');

    if (candidateVictims.length > 0) {
      if (activePlayer.isAi) {
        // AI steals from candidate with most cards or human
        const victim = candidateVictims.sort((a, b) => getTotalCards(b.resources) - getTotalCards(a.resources))[0];
        executeRobberSteal(victim.id);
      } else {
        // Human player selects victim
        setRobberVictims(candidateVictims);
        setIsRobberStealModalOpen(true);
      }
    } else {
      addLog('Kein Mitspieler mit Rohstoffen an diesem Feld zum Ausrauben vorhanden.', 'ℹ️');
      setGamePhase('MAIN_ACTION');
      setActiveBuildingMode(null);
    }
  };

  // Rob 1 random card from selected victim
  const executeRobberSteal = (victimId: string) => {
    const updated = players.map((p) => ({ ...p, resources: { ...p.resources } }));
    const thief = updated[activePlayerIndex];
    const victim = updated.find((p) => p.id === victimId);

    if (victim && getTotalCards(victim.resources) > 0) {
      const availableRes: ResourceType[] = [];
      (Object.keys(victim.resources) as ResourceType[]).forEach((res) => {
        for (let i = 0; i < victim.resources[res]; i++) availableRes.push(res);
      });

      if (availableRes.length > 0) {
        const stolenRes = availableRes[Math.floor(Math.random() * availableRes.length)];
        victim.resources[stolenRes] -= 1;
        thief.resources[stolenRes] += 1;
        sound.playReward();
        addLog(`🦹 ${thief.name} stiehlt 1 Rohstoff von ${victim.name}!`, '💰', 'text-amber-300');
      }
    }

    setPlayers(updated);
    setIsRobberStealModalOpen(false);
    setGamePhase('MAIN_ACTION');
    setActiveBuildingMode(null);
  };

  // Buy Development Card
  const handleBuyDevCard = () => {
    if (gamePhase !== 'MAIN_ACTION' || devCardDeck.length === 0) return;
    const cost = BUILDING_COSTS.devCard;
    const canAfford =
      activePlayer.resources.wool >= (cost.wool || 0) &&
      activePlayer.resources.wheat >= (cost.wheat || 0) &&
      activePlayer.resources.ore >= (cost.ore || 0);

    if (!canAfford) {
      sound.playError();
      addLog('Nicht genügend Rohstoffe für eine Entwicklungskarte (1 Wolle, 1 Getreide, 1 Erz).', '⚠️', 'text-rose-400');
      return;
    }

    sound.playReward();
    const [card, ...restDeck] = devCardDeck;
    setDevCardDeck(restDeck);

    const updated = [...players];
    const p = updated[activePlayerIndex];
    p.resources.wool -= 1;
    p.resources.wheat -= 1;
    p.resources.ore -= 1;
    p.devCards[card] += 1;

    addLog(`${p.name} kauft eine verdeckte Entwicklungskarte! (${restDeck.length} übrig)`, '📜', 'text-purple-300');
    setPlayers(checkSpecialCardsAndVictory(updated));
  };

  // Play Development Card
  const handlePlayDevCard = (type: DevCardType) => {
    if (gamePhase !== 'MAIN_ACTION' || activePlayer.devCards[type] <= 0) return;

    sound.playReward();
    const updated = [...players];
    const p = updated[activePlayerIndex];
    p.devCards[type] -= 1;

    if (type === 'knight') {
      p.playedKnights += 1;
      addLog(`⚔️ ${p.name} spielt einen Ritter aus! Versetze den Räuber.`, '⚔️', 'text-amber-400');
      setActiveBuildingMode('robber');
    } else if (type === 'yearOfPlenty') {
      setIsYearOfPlentyOpen(true);
      addLog(`🌾 ${p.name} spielt Erfindung / Jahr des Überflusses aus!`, '🌾', 'text-amber-300');
    } else if (type === 'monopoly') {
      setIsMonopolyOpen(true);
      addLog(`💎 ${p.name} spielt Monopol aus!`, '💎', 'text-amber-300');
    } else if (type === 'roadBuilding') {
      addLog(`🛣️ ${p.name} spielt Straßenbau aus (2 kostenlose Straßen)!`, '🛣️', 'text-amber-300');
      p.resources.wood += 2;
      p.resources.brick += 2;
      setActiveBuildingMode('road');
    }

    setPlayers(checkSpecialCardsAndVictory(updated));
    setIsDevCardsOpen(false);
  };

  // Year of Plenty confirm
  const handleConfirmYearOfPlenty = () => {
    const [res1, res2] = yearOfPlentySelection;
    const updated = [...players];
    const p = updated[activePlayerIndex];
    p.resources[res1] += 1;
    p.resources[res2] += 1;
    sound.playReward();
    addLog(`${p.name} nimmt +1 ${RESOURCE_COLORS[res1].labelDe} und +1 ${RESOURCE_COLORS[res2].labelDe} aus der Bank.`, '🌾', 'text-emerald-400');
    setPlayers(updated);
    setIsYearOfPlentyOpen(false);
  };

  // Monopoly confirm
  const handleConfirmMonopoly = (chosenRes: ResourceType) => {
    let stolenTotal = 0;
    const updated = players.map((p, idx) => {
      if (idx !== activePlayerIndex) {
        const amt = p.resources[chosenRes];
        stolenTotal += amt;
        return {
          ...p,
          resources: { ...p.resources, [chosenRes]: 0 },
        };
      }
      return p;
    });

    updated[activePlayerIndex].resources[chosenRes] += stolenTotal;
    sound.playReward();
    addLog(`👑 Monopol auf ${RESOURCE_COLORS[chosenRes].labelDe}! ${activePlayer.name} nimmt ${stolenTotal} Rohstoffe von allen Mitspielern!`, '💎', 'text-amber-400');
    setPlayers(updated);
    setIsMonopolyOpen(false);
  };

  // Bank Trade execution
  const handleExecuteBankTrade = (giveRes: ResourceType, giveAmt: number, getRes: ResourceType) => {
    if (activePlayer.resources[giveRes] < giveAmt) {
      sound.playError();
      return;
    }
    const updated = [...players];
    const p = updated[activePlayerIndex];
    p.resources[giveRes] -= giveAmt;
    p.resources[getRes] += 1;
    addLog(`${p.name} tauscht ${giveAmt}x ${RESOURCE_COLORS[giveRes].labelDe} gegen 1x ${RESOURCE_COLORS[getRes].labelDe}`, '⛵');
    setPlayers(updated);
  };

  // Domestic Trade proposal
  const handleProposeDomesticTrade = (
    targetPlayerId: string,
    offer: Partial<ResourceCount>,
    request: Partial<ResourceCount>
  ): { accepted: boolean; message: string } => {
    const target = players.find((p) => p.id === targetPlayerId);
    if (!target) return { accepted: false, message: 'Spieler nicht gefunden.' };

    // Check if target has requested resources
    const targetHasResources = (Object.keys(request) as ResourceType[]).every(
      (res) => (target.resources[res] || 0) >= (request[res] || 0)
    );

    if (!targetHasResources) {
      return { accepted: false, message: `${target.name} besitzt die geforderten Rohstoffe leider nicht.` };
    }

    // AI trade evaluation: AI accepts if offer is fair or advantageous
    const offerTotal = Object.values(offer).reduce((a, b) => (a || 0) + (b || 0), 0);
    const requestTotal = Object.values(request).reduce((a, b) => (a || 0) + (b || 0), 0);

    const willAccept = target.isAi ? offerTotal >= requestTotal : true;

    if (willAccept) {
      const updated = players.map((p) => {
        const copy = { ...p, resources: { ...p.resources } };
        if (p.id === activePlayer.id) {
          (Object.keys(offer) as ResourceType[]).forEach((r) => (copy.resources[r] -= offer[r] || 0));
          (Object.keys(request) as ResourceType[]).forEach((r) => (copy.resources[r] += request[r] || 0));
        } else if (p.id === targetPlayerId) {
          (Object.keys(offer) as ResourceType[]).forEach((r) => (copy.resources[r] += offer[r] || 0));
          (Object.keys(request) as ResourceType[]).forEach((r) => (copy.resources[r] -= request[r] || 0));
        }
        return copy;
      });

      setPlayers(updated);
      sound.playReward();
      addLog(`🤝 Handel vereinbart zwischen ${activePlayer.name} und ${target.name}!`, '🤝', 'text-emerald-400');
      return { accepted: true, message: `Deal angenommen von ${target.name}!` };
    }

    return { accepted: false, message: `${target.name} lehnt dieses Angebot ab.` };
  };

  // End Turn
  const handleEndTurn = () => {
    if (gamePhase !== 'MAIN_ACTION' && gamePhase !== 'ROLL') return;
    sound.playClick();
    setActiveBuildingMode(null);
    setLastRollProducingHexIds([]);

    const nextIdx = (activePlayerIndex + 1) % players.length;
    setActivePlayerIndex(nextIdx);
    setGamePhase('ROLL');
  };

  // AI Turn Automator
  useEffect(() => {
    if (gamePhase === 'GAME_OVER') return;
    if (!activePlayer || !activePlayer.isAi) return;

    const timer = setTimeout(() => {
      // 1. SETUP ROUND 1 & 2 FOR AI
      if (gamePhase === 'SETUP_1' || gamePhase === 'SETUP_2') {
        if (setupSubStep === 'settlement') {
          // AI picks best legal vertex by sum of dice probability pips
          const legalVertices = board.vertices.filter((v) => satisfiesDistanceRule(v.id));
          if (legalVertices.length === 0) return;

          legalVertices.sort((a, b) => {
            const pipsA = a.adjacentHexIds.reduce((sum, hId) => sum + (board.hexes.find((h) => h.id === hId)?.pips || 0), 0);
            const pipsB = b.adjacentHexIds.reduce((sum, hId) => sum + (board.hexes.find((h) => h.id === hId)?.pips || 0), 0);
            return pipsB - pipsA;
          });

          const chosen = legalVertices[0];
          handleVertexClick(chosen.id);
        } else if (setupSubStep === 'road' && lastPlacedVertexId !== null) {
          const v = board.vertices.find((vert) => vert.id === lastPlacedVertexId);
          if (!v) return;
          const openEdges = v.adjacentEdgeIds.filter((eId) => !players.some((p) => p.roads.includes(eId)));
          if (openEdges.length > 0) {
            handleEdgeClick(openEdges[0]);
          }
        }
        return;
      }

      // 2. REGULAR TURN FOR AI
      if (gamePhase === 'ROLL') {
        handleRollDice();
        return;
      }

      if (gamePhase === 'ROBBER_MOVE') {
        // AI moves robber to a hex owned by human or player with highest VP
        const nonDesert = board.hexes.filter((h) => h.id !== robberHexId && h.terrain !== 'desert');
        const target = nonDesert.sort((a, b) => b.pips - a.pips)[0];
        if (target) {
          handleHexClick(target.id);
        }
        return;
      }

      if (gamePhase === 'MAIN_ACTION') {
        const p = activePlayer;
        let didAction = false;

        // Try to upgrade to City
        if (p.settlements.length > 0 && p.resources.wheat >= 2 && p.resources.ore >= 3 && p.cities.length < 4) {
          const targetV = p.settlements[0];
          const updated = [...players];
          const playerObj = updated[activePlayerIndex];
          playerObj.resources.wheat -= 2;
          playerObj.resources.ore -= 3;
          playerObj.settlements = playerObj.settlements.filter((id) => id !== targetV);
          playerObj.cities.push(targetV);
          setPlayers(checkSpecialCardsAndVictory(updated));
          addLog(`🏰 ${p.name} baut eine Stadt!`, '🏰', 'text-amber-300');
          didAction = true;
        }
        // Try to build Settlement
        else if (
          p.resources.wood >= 1 &&
          p.resources.brick >= 1 &&
          p.resources.wool >= 1 &&
          p.resources.wheat >= 1 &&
          p.settlements.length < 5
        ) {
          const validV = board.vertices.find(
            (v) => satisfiesDistanceRule(v.id) && satisfiesSettlementConnectivity(v.id, p)
          );
          if (validV) {
            const updated = [...players];
            const playerObj = updated[activePlayerIndex];
            playerObj.resources.wood -= 1;
            playerObj.resources.brick -= 1;
            playerObj.resources.wool -= 1;
            playerObj.resources.wheat -= 1;
            playerObj.settlements.push(validV.id);
            setPlayers(checkSpecialCardsAndVictory(updated));
            addLog(`🏠 ${p.name} baut eine Siedlung!`, '🏠', 'text-emerald-400');
            didAction = true;
          }
        }
        // Try to build Road
        else if (p.resources.wood >= 1 && p.resources.brick >= 1 && p.roads.length < 15) {
          const validE = board.edges.find((e) => satisfiesRoadConnectivity(e.id, p));
          if (validE) {
            const updated = [...players];
            const playerObj = updated[activePlayerIndex];
            playerObj.resources.wood -= 1;
            playerObj.resources.brick -= 1;
            playerObj.roads.push(validE.id);
            setPlayers(checkSpecialCardsAndVictory(updated));
            addLog(`🛣️ ${p.name} baut eine Straße!`, '🛣️');
            didAction = true;
          }
        }
        // Try to buy Dev Card
        else if (
          devCardDeck.length > 0 &&
          p.resources.wool >= 1 &&
          p.resources.wheat >= 1 &&
          p.resources.ore >= 1
        ) {
          handleBuyDevCard();
          didAction = true;
        }

        // Smart Bank trade if AI has 4 of anything
        if (!didAction) {
          const resKeys: ResourceType[] = ['wood', 'brick', 'wool', 'wheat', 'ore'];
          const surplusRes = resKeys.find((r) => p.resources[r] >= 4);
          if (surplusRes) {
            const neededRes = resKeys.find((r) => p.resources[r] === 0) || 'wheat';
            handleExecuteBankTrade(surplusRes, 4, neededRes);
          }
        }

        // Finish AI Turn
        setTimeout(() => {
          handleEndTurn();
        }, 600);
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [activePlayerIndex, gamePhase, setupSubStep, isRolling, activePlayer?.isAi]);

  // Restart Game
  const handleRestart = () => {
    sound.playClick();
    const newBoard = generateCatanBoard();
    setBoard(newBoard);
    setRobberHexId(newBoard.desertHexId);
    setDevCardDeck([...INITIAL_DEV_CARDS_DECK].sort(() => Math.random() - 0.5));
    setActivePlayerIndex(0);
    setGamePhase('SETUP_1');
    setSetupSubStep('settlement');
    setActiveBuildingMode('settlement');
    setWinner(null);
    setLastPlacedVertexId(null);
    setLastDiceSum(null);
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        resources: { wood: 0, brick: 0, wool: 0, wheat: 0, ore: 0 },
        settlements: [],
        cities: [],
        roads: [],
        devCards: { knight: 0, victoryPoint: 0, roadBuilding: 0, yearOfPlenty: 0, monopoly: 0 },
        playedKnights: 0,
        hasLongestRoad: false,
        hasLargestArmy: false,
        victoryPoints: 0,
      }))
    );
    setActionLog([
      {
        id: `init-${Date.now()}`,
        text: 'Neues Spiel gestartet! Startaufstellung Runde 1: Platziere deine 1. Siedlung.',
        time: 'Start',
        color: 'text-amber-300',
        icon: '🏝️',
      },
    ]);
  };

  const currentHarbors = activePlayer ? getPlayerHarborTypes(activePlayer) : [];

  return (
    <div className="relative w-full max-w-7xl mx-auto flex flex-col gap-4 text-white">
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
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-lg">
            <h3 className="text-xs font-black tracking-wider uppercase text-slate-400 mb-2 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Siegpunkte & Siedler
            </h3>
            <div className="flex flex-col gap-2">
              {players.map((p, idx) => {
                const isActive = idx === activePlayerIndex;
                const totalCards = getTotalCards(p.resources);
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
        <div className="lg:col-span-6 flex flex-col items-center">
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
        <div className="lg:col-span-3 flex flex-col gap-3">
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
                    <span>Stadt ausbauen (+2 VP)</span>
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
              Mein Rohstoff-Inventar ({players[0].name})
            </span>
            <span className="text-xs font-mono text-slate-400">
              Gesamt: {getTotalCards(players[0].resources)} Karten
            </span>
          </div>

          <div className="grid grid-cols-5 sm:flex sm:items-center sm:justify-start gap-2 overflow-x-auto pb-1">
            <ResourceCardBadge type="wood" count={players[0].resources.wood} size="md" />
            <ResourceCardBadge type="brick" count={players[0].resources.brick} size="md" />
            <ResourceCardBadge type="wool" count={players[0].resources.wool} size="md" />
            <ResourceCardBadge type="wheat" count={players[0].resources.wheat} size="md" />
            <ResourceCardBadge type="ore" count={players[0].resources.ore} size="md" />
          </div>
        </div>
      )}

      {/* 4. MODALS */}

      {/* Trade Modal */}
      <CatanTradeModal
        isOpen={isTradeOpen}
        onClose={() => setIsTradeOpen(false)}
        currentPlayer={activePlayer}
        otherPlayers={players.filter((p) => p.id !== activePlayer.id)}
        playerHarborTypes={currentHarbors}
        onExecuteBankTrade={handleExecuteBankTrade}
        onProposeDomesticTrade={handleProposeDomesticTrade}
      />

      {/* Development Cards Modal */}
      {isDevCardsOpen && (
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
                  disabled={activePlayer.devCards.knight <= 0 || gamePhase !== 'MAIN_ACTION'}
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
                  disabled={activePlayer.devCards.roadBuilding <= 0 || gamePhase !== 'MAIN_ACTION'}
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
                  disabled={activePlayer.devCards.yearOfPlenty <= 0 || gamePhase !== 'MAIN_ACTION'}
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
                  disabled={activePlayer.devCards.monopoly <= 0 || gamePhase !== 'MAIN_ACTION'}
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
                  <span className="text-amber-300 font-mono">{getTotalCards(v.resources)} Karten</span>
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
