// Rommé (Deutsches Rommé) card models, 110-card deck, and official 40-point rules

export type CardSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'joker';
export type CardRank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 'J' | 'Q' | 'K' | 'A' | 'JOKER';

export interface RommeCard {
  id: string;
  suit: CardSuit;
  rank: CardRank;
  points: number; // Card point value (2-9: face, 10/J/Q/K: 10, Ace: 1 or 11, Joker: 20)
  representedRank?: CardRank; // If Joker is used in a meld, what rank it represents
  representedSuit?: CardSuit; // If Joker is used in a meld, what suit it represents
}

export interface RommeMeld {
  id: string;
  type: 'set' | 'run';
  cards: RommeCard[];
  ownerId: string;
}

export interface RommePlayer {
  id: string;
  name: string;
  color: string;
  isAi: boolean;
  hand: RommeCard[];
  hasMadeInitialMeld: boolean; // Needs >= 40 points in first meld!
  totalMeldsPoints: number;
}

// Numerical rank index for runs: 2=2 ... 10=10, J=11, Q=12, K=13, Ace=1 or 14
export const RANK_VALUES: Record<CardRank, number> = {
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  'J': 11,
  'Q': 12,
  'K': 13,
  'A': 14,
  'JOKER': 0,
};

// Generate 110-card traditional Rommé deck (2 x 52 cards + 6 Jokers)
export const createRommeDeck = (): RommeCard[] => {
  const suits: CardSuit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: CardRank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A'];
  const deck: RommeCard[] = [];
  let idCount = 1;

  // 2 complete 52-card sets
  for (let pack = 1; pack <= 2; pack++) {
    for (const suit of suits) {
      for (const rank of ranks) {
        let pts = 10;
        if (typeof rank === 'number' && rank < 10) {
          pts = rank;
        } else if (rank === 'A') {
          pts = 11;
        }

        deck.push({
          id: `c_${idCount++}_p${pack}_${suit}_${rank}`,
          suit,
          rank,
          points: pts,
        });
      }
    }
  }

  // 6 Jokers (3 per deck)
  for (let j = 1; j <= 6; j++) {
    deck.push({
      id: `c_${idCount++}_joker_${j}`,
      suit: 'joker',
      rank: 'JOKER',
      points: 20, // 20 points at end of game or counts as represented card in meld
    });
  }

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const k = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[k]] = [deck[k], deck[i]];
  }

  return deck;
};

// Suit visual helpers
export const SUIT_SYMBOLS: Record<CardSuit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
  joker: '★',
};

export const SUIT_COLORS: Record<CardSuit, string> = {
  hearts: '#dc2626',
  diamonds: '#dc2626',
  clubs: '#0f172a',
  spades: '#0f172a',
  joker: '#f59e0b',
};

export const SUIT_GERMAN: Record<CardSuit, string> = {
  hearts: 'Herz',
  diamonds: 'Karo',
  clubs: 'Kreuz',
  spades: 'Pik',
  joker: 'Joker',
};

// --------------------------------------------------------------------------
// COMBINATION VALIDATORS (Sätze & Sequenzen)
// --------------------------------------------------------------------------

// 1. Satz (Set / Book): 3 or 4 cards of the SAME rank in DIFFERENT suits
export const isValidSet = (cards: RommeCard[]): boolean => {
  if (cards.length < 3 || cards.length > 4) return false;

  const naturals = cards.filter(c => c.rank !== 'JOKER');
  if (naturals.length < 1) return false;

  const targetRank = naturals[0].rank;
  if (!naturals.every(c => c.rank === targetRank)) return false;

  // Check unique suits among naturals
  const suits = naturals.map(c => c.suit);
  const uniqueSuits = new Set(suits);
  if (uniqueSuits.size !== suits.length) return false;

  // At least as many natural cards as jokers
  const jokers = cards.filter(c => c.rank === 'JOKER');
  if (jokers.length >= naturals.length + (cards.length === 3 ? 0 : 1)) {
    return false;
  }

  return true;
};

// 2. Sequenz / Folge (Run): 3 or more consecutive cards of the SAME suit
export const isValidRun = (cards: RommeCard[]): boolean => {
  if (cards.length < 3) return false;

  const naturals = cards.filter(c => c.rank !== 'JOKER');
  if (naturals.length < 2) return false; // Needs at least 2 natural cards

  const targetSuit = naturals[0].suit;
  if (!naturals.every(c => c.suit === targetSuit)) return false;

  // Check if cards can be arranged in a valid consecutive sequence
  // Test both with Ace as Low (value 1) and Ace as High (value 14)
  const testSequence = (aceAsOne: boolean): boolean => {
    // Determine raw rank indices
    const indices: { card: RommeCard; val: number }[] = [];
    for (const c of cards) {
      if (c.rank === 'JOKER') {
        indices.push({ card: c, val: -1 });
      } else if (c.rank === 'A' && aceAsOne) {
        indices.push({ card: c, val: 1 });
      } else {
        indices.push({ card: c, val: RANK_VALUES[c.rank] });
      }
    }

    // Must be monotonic without duplicates among naturals
    const naturalVals = indices.filter(x => x.val !== -1).map(x => x.val).sort((a, b) => a - b);
    for (let i = 0; i < naturalVals.length - 1; i++) {
      if (naturalVals[i] === naturalVals[i + 1]) return false; // duplicate rank not allowed in run
    }

    const minVal = naturalVals[0];
    const maxVal = naturalVals[naturalVals.length - 1];
    const span = maxVal - minVal + 1;

    // The span cannot exceed the total number of cards in the run
    if (span > cards.length) return false;

    // Check if jokers suffice to fill any gaps
    const jokersCount = cards.length - naturals.length;
    const missingInSpan = span - naturals.length;
    return jokersCount >= missingInSpan;
  };

  return testSequence(true) || testSequence(false);
};

// Check if array of cards is a valid meld (either Satz or Sequenz)
export const validateMeld = (cards: RommeCard[]): { valid: boolean; type?: 'set' | 'run' } => {
  if (isValidSet(cards)) return { valid: true, type: 'set' };
  if (isValidRun(cards)) return { valid: true, type: 'run' };
  return { valid: false };
};

// Calculate points of a single meld for the 40-point initial meld check
export const calculateMeldPoints = (meld: RommeCard[]): number => {
  const isSet = isValidSet(meld);
  if (isSet) {
    const natural = meld.find(c => c.rank !== 'JOKER');
    if (!natural) return 0;
    const basePts = natural.points;
    return basePts * meld.length;
  }

  // It's a run: calculate points for each card (Joker takes point of represented rank)
  let sum = 0;
  for (const c of meld) {
    if (c.rank === 'JOKER') {
      sum += c.points > 0 ? (c.points === 20 ? 10 : c.points) : 10;
    } else {
      sum += c.points;
    }
  }
  return sum;
};

// Check if a single card can be appended to an existing table meld
export const canAddToTableMeld = (card: RommeCard, meld: RommeMeld): boolean => {
  const candidate = [...meld.cards, card];
  if (meld.type === 'set') {
    return isValidSet(candidate);
  }
  // Try inserting at front or back for runs
  return isValidRun([...meld.cards, card]) || isValidRun([card, ...meld.cards]);
};

// Check if a player's card can swap with a Joker in a table meld
export const canSwapJokerInMeld = (card: RommeCard, meld: RommeMeld): { canSwap: boolean; jokerIndex: number } => {
  if (card.rank === 'JOKER') return { canSwap: false, jokerIndex: -1 };

  const jokerIdx = meld.cards.findIndex(c => c.rank === 'JOKER');
  if (jokerIdx === -1) return { canSwap: false, jokerIndex: -1 };

  // Replace joker with candidate card and check validity
  const testCards = [...meld.cards];
  testCards[jokerIdx] = card;

  const valid = meld.type === 'set' ? isValidSet(testCards) : isValidRun(testCards);
  return { canSwap: valid, jokerIndex: jokerIdx };
};
