// Skip-Bo Card, Deck, and State Definitions based on 100% Official Rules

export type SkipBoValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'SKIP-BO';

export interface SkipBoCard {
  id: string;
  value: SkipBoValue;
  // If a SKIP-BO card is placed on a building pile, this records the number it is representing (1..12)
  assignedValue?: number;
}

export interface SkipBoPlayer {
  id: string;
  name: string;
  color: string;
  isAi: boolean;
  // Stockpile: all cards face down except top card. Target is to empty this pile!
  stockpile: SkipBoCard[];
  // Hand cards (refilled to 5 at turn start or when emptied during turn)
  hand: SkipBoCard[];
  // 4 personal discard piles (each has an array of cards, top card is at index 0 or length-1)
  discardPiles: SkipBoCard[][];
}

export interface BuildingPile {
  id: number;
  cards: SkipBoCard[]; // 1 to 12
  currentValue: number; // 0 if empty, 1..12
}

// Generate the official 162-card Skip-Bo deck:
// - 12 sets of numbers 1-12 (144 cards)
// - 18 "SKIP-BO" wild cards (jokers)
export const createOfficialDeck = (): SkipBoCard[] => {
  const deck: SkipBoCard[] = [];
  let idCounter = 1;

  // 144 number cards (12 copies of each number 1 to 12)
  for (let set = 0; set < 12; set++) {
    for (let num = 1; num <= 12; num++) {
      deck.push({
        id: `card_${idCounter++}_${num}`,
        value: num as SkipBoValue,
      });
    }
  }

  // 18 SKIP-BO wild cards
  for (let wild = 0; wild < 18; wild++) {
    deck.push({
      id: `card_${idCounter++}_skipbo`,
      value: 'SKIP-BO',
    });
  }

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};

// Check if a card can be placed on a building pile
export const canPlayOnBuildingPile = (card: SkipBoCard, pileCurrentValue: number): boolean => {
  if (pileCurrentValue === 0) {
    // Empty building pile must start with 1 or SKIP-BO
    return card.value === 1 || card.value === 'SKIP-BO';
  }

  if (pileCurrentValue >= 12) {
    return false; // Pile is already complete
  }

  const neededValue = pileCurrentValue + 1;
  return card.value === neededValue || card.value === 'SKIP-BO';
};

// Color theme for number cards
export const getSkipBoCardColor = (value: SkipBoValue): {
  bg: string;
  badge: string;
  border: string;
  text: string;
} => {
  if (value === 'SKIP-BO') {
    return {
      bg: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
      badge: '#ea580c',
      border: '#fef08a',
      text: '#ffffff',
    };
  }

  if (value >= 1 && value <= 4) {
    return {
      bg: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
      badge: '#0284c7',
      border: '#0369a1',
      text: '#ffffff',
    };
  }

  if (value >= 5 && value <= 8) {
    return {
      bg: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
      badge: '#16a34a',
      border: '#15803d',
      text: '#ffffff',
    };
  }

  // 9-12
  return {
    bg: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
    badge: '#dc2626',
    border: '#b91c1c',
    text: '#ffffff',
  };
};
