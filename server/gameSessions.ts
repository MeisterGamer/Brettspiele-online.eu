import { 
  initialMahjong, 
  reduceMahjong, 
  chooseMahjongMove, 
  type MahjongState 
} from '../src/services/mahjongEngine';

export interface GameSession {
  id: string;
  gameType: string;
  roomCode: string;
  state: any;
  players: string[];
  currentTurn?: string;
  createdAt: number;
  updatedAt: number;
  status: 'waiting' | 'in_progress' | 'completed';
}

class GameSessionStore {
  private sessions: Map<string, GameSession> = new Map();

  public createSession(roomCode: string, gameType: string, playerIds: string[] = []): GameSession {
    let initialState: any = {};
    if (gameType === 'mahjong') {
      initialState = initialMahjong(1);
    } else {
      initialState = { turn: 0, moves: [] };
    }

    const session: GameSession = {
      id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      gameType,
      roomCode,
      state: initialState,
      players: playerIds,
      currentTurn: playerIds[0] || 'player',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'in_progress',
    };

    this.sessions.set(roomCode, session);
    return session;
  }

  public getSession(roomCode: string): GameSession | undefined {
    return this.sessions.get(roomCode);
  }

  public applyAction(roomCode: string, action: any, senderId: string): GameSession | null {
    let session = this.sessions.get(roomCode);
    if (!session) {
      session = this.createSession(roomCode, action?.gameType || 'mahjong', [senderId]);
    }

    if (session.gameType === 'mahjong') {
      session.state = reduceMahjong(session.state as MahjongState, action);
      if ((session.state as MahjongState).isVictory) {
        session.status = 'completed';
      }
    } else {
      session.state = {
        ...session.state,
        lastAction: action,
        updatedBy: senderId,
      };
    }

    session.updatedAt = Date.now();
    return session;
  }

  public triggerBotTurn(roomCode: string): { session: GameSession | null; move: any } {
    const session = this.sessions.get(roomCode);
    if (!session || session.status !== 'in_progress') {
      return { session: null, move: null };
    }

    if (session.gameType === 'mahjong') {
      const botMove = chooseMahjongMove(session.state as MahjongState);
      if (botMove) {
        session.state = reduceMahjong(session.state as MahjongState, {
          type: 'MATCH_PAIR',
          payload: { tileId1: botMove.tileId1, tileId2: botMove.tileId2 },
        });
        session.updatedAt = Date.now();
        return { session, move: botMove };
      }
    }

    return { session, move: null };
  }

  public removeSession(roomCode: string): boolean {
    return this.sessions.delete(roomCode);
  }
}

export const gameSessionStore = new GameSessionStore();
export const GameSessions = gameSessionStore;
export const gameSessions = gameSessionStore;

export const authoritativeEngines = {
  mahjong: {
    initial: initialMahjong,
    reduce: reduceMahjong,
    chooseMove: chooseMahjongMove,
  },
  'diamond-blast': {
    initial: () => ({ score: 0, movesLeft: 30, targets: [] }),
    reduce: (s: any, a: any) => ({ ...s, ...a.payload }),
    chooseMove: () => null,
  },
  'connect-four': {
    initial: () => ({ board: Array(6).fill(null).map(() => Array(7).fill(null)), turn: 'red' }),
    reduce: (s: any, a: any) => ({ ...s, lastMove: a.payload }),
    chooseMove: (s: any) => ({ col: Math.floor(Math.random() * 7) }),
  },
  chess: {
    initial: () => ({ fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', turn: 'w' }),
    reduce: (s: any, a: any) => ({ ...s, ...a.payload }),
    chooseMove: () => null,
  },
  checkers: {
    initial: () => ({ turn: 'red', pieces: [] }),
    reduce: (s: any, a: any) => ({ ...s, ...a.payload }),
    chooseMove: () => null,
  },
  catan: {
    initial: () => ({ phase: 'setup', currentTurn: 0 }),
    reduce: (s: any, a: any) => ({ ...s, ...a.payload }),
    chooseMove: () => null,
  },
  monopoly: {
    initial: () => ({ phase: 'roll', currentTurn: 0 }),
    reduce: (s: any, a: any) => ({ ...s, ...a.payload }),
    chooseMove: () => null,
  },
  ludo: {
    initial: () => ({ dice: 0, turn: 0 }),
    reduce: (s: any, a: any) => ({ ...s, ...a.payload }),
    chooseMove: () => null,
  },
  yatzy: {
    initial: () => ({ dice: [1, 1, 1, 1, 1], rollsLeft: 3 }),
    reduce: (s: any, a: any) => ({ ...s, ...a.payload }),
    chooseMove: () => null,
  },
};

export { 
  GameSessionStore, 
  initialMahjong, 
  reduceMahjong, 
  chooseMahjongMove, 
  type MahjongState 
};
export default gameSessionStore;

