import React, { useState, useEffect } from 'react';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import { RefreshCw, Trophy, Users, Bot, ArrowDown, Sparkles, Undo2, Palette, Shield, Wifi, Award } from 'lucide-react';
import { TABLE_BACKGROUNDS } from '../../services/gameImages';
import { RoomParticipant } from '../../types';
import { AvatarDisplay } from '../avatar/AvatarDisplay';
import { multiplayerService } from '../../services/multiplayerService';

interface ConnectFourProps {
  onGameEnd?: (winner: 'player' | 'opponent' | 'draw') => void;
  tableParticipants?: RoomParticipant[];
  currentUserId?: string;
  onActiveTurnChange?: (turnPlayerId: string) => void;
  roomCode?: string;
  isHost?: boolean;
}

const ROWS = 6;
const COLS = 7;

type CellValue = 1 | 2 | null; // 1 = P1, 2 = P2

interface MoveRecord {
  r: number;
  c: number;
  player: 1 | 2;
}

export const ConnectFour: React.FC<ConnectFourProps> = ({ 
  onGameEnd, 
  tableParticipants, 
  currentUserId,
  onActiveTurnChange,
  roomCode,
}) => {
  const p1 = tableParticipants?.[0];
  const p2 = tableParticipants?.[1];

  const p1Name = p1?.name || 'Spieler 1';
  const p2Name = p2?.name || (p2?.isBot ? 'Meister-KI' : 'Spieler 2');
  const isP2Bot = p2 ? !!p2.isBot : true;

  const isOnlineMultiplayer = Boolean(roomCode && p1 && p2 && !p2.isBot);
  const myPlayer: 1 | 2 | null = isOnlineMultiplayer
    ? currentUserId === p1?.id
      ? 1
      : currentUserId === p2?.id
      ? 2
      : null
    : null;

  // Board state
  const [board, setBoard] = useState<CellValue[][]>(() =>
    Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
  );
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [winner, setWinner] = useState<1 | 2 | 'draw' | null>(null);
  const [winningCells, setWinningCells] = useState<[number, number][]>([]);
  const [playMode, setPlayMode] = useState<'bot' | 'local2p' | 'online'>(() => 
    isOnlineMultiplayer ? 'online' : (isP2Bot ? 'bot' : 'local2p')
  );
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [isBotThinking, setIsBotThinking] = useState<boolean>(false);

  // New features: AI Difficulty, Theme, Move History for Undo, Match Series
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [theme, setTheme] = useState<'classic' | 'cyber' | 'wood'>('classic');
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [seriesTarget, setSeriesTarget] = useState<number>(3); // First to 3 wins

  useEffect(() => {
    if (isOnlineMultiplayer) {
      setPlayMode('online');
    } else if (p2) {
      setPlayMode(p2.isBot ? 'bot' : 'local2p');
    }
  }, [isOnlineMultiplayer, p2?.id, p2?.isBot]);

  useEffect(() => {
    if (onActiveTurnChange) {
      const activeId = currentPlayer === 1 ? (p1?.id || 'p1') : (p2?.id || 'p2');
      onActiveTurnChange(activeId);
    }
  }, [currentPlayer, p1?.id, p2?.id, onActiveTurnChange]);

  // Check victory condition
  const checkWin = (grid: CellValue[][]): { winner: 1 | 2 | null; cells: [number, number][] } => {
    // Horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const val = grid[r][c];
        if (val && val === grid[r][c+1] && val === grid[r][c+2] && val === grid[r][c+3]) {
          return { winner: val, cells: [[r, c], [r, c+1], [r, c+2], [r, c+3]] };
        }
      }
    }
    // Vertical
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r <= ROWS - 4; r++) {
        const val = grid[r][c];
        if (val && val === grid[r+1][c] && val === grid[r+2][c] && val === grid[r+3][c]) {
          return { winner: val, cells: [[r, c], [r+1, c], [r+2, c], [r+3, c]] };
        }
      }
    }
    // Diagonal down-right
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const val = grid[r][c];
        if (val && val === grid[r+1][c+1] && val === grid[r+2][c+2] && val === grid[r+3][c+3]) {
          return { winner: val, cells: [[r, c], [r+1, c+1], [r+2, c+2], [r+3, c+3]] };
        }
      }
    }
    // Diagonal down-left
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 3; c < COLS; c++) {
        const val = grid[r][c];
        if (val && val === grid[r+1][c-1] && val === grid[r+2][c-2] && val === grid[r+3][c-3]) {
          return { winner: val, cells: [[r, c], [r+1, c-1], [r+2, c-2], [r+3, c-3]] };
        }
      }
    }
    return { winner: null, cells: [] };
  };

  const isBoardFull = (grid: CellValue[][]) => {
    return grid[0].every((cell) => cell !== null);
  };

  // WebSocket Multiplayer synchronization
  useEffect(() => {
    if (!roomCode) return;

    const unsubscribe = multiplayerService.subscribeToGameActions((event) => {
      if (event.gameType !== 'connectfour' || event.roomCode !== roomCode) return;
      if (event.senderId === currentUserId) return;

      if (event.action === 'DROP_DISC') {
        const { col, player } = event.payload;
        applyDropToBoard(col, player);
      } else if (event.action === 'RESET') {
        sound.playClick();
        setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
        setCurrentPlayer(1);
        setWinner(null);
        setWinningCells([]);
        setHoverCol(null);
        setIsBotThinking(false);
        setMoveHistory([]);
      }
    });

    return () => unsubscribe();
  }, [roomCode, currentUserId, onGameEnd]);

  const applyDropToBoard = (col: number, playerNum: 1 | 2) => {
    setBoard((prev) => {
      let targetRow = -1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (!prev[r][col]) {
          targetRow = r;
          break;
        }
      }
      if (targetRow === -1) return prev;

      sound.playPieceDrop();
      const newBoard = prev.map((row) => [...row]);
      newBoard[targetRow][col] = playerNum;

      setMoveHistory((h) => [...h, { r: targetRow, c: col, player: playerNum }]);

      const winResult = checkWin(newBoard);
      if (winResult.winner) {
        setWinner(winResult.winner);
        setWinningCells(winResult.cells);
        if (winResult.winner === 1) {
          sound.playVictory();
          try { confetti({ particleCount: 110, spread: 80 }); } catch (e) {}
        } else {
          sound.playError();
        }
        setScores((s) => ({
          ...s,
          [winResult.winner === 1 ? 'p1' : 'p2']: s[winResult.winner === 1 ? 'p1' : 'p2'] + 1,
        }));
        if (onGameEnd) onGameEnd(winResult.winner === 1 ? 'player' : 'opponent');
      } else if (isBoardFull(newBoard)) {
        setWinner('draw');
        sound.playReward();
        if (onGameEnd) onGameEnd('draw');
      } else {
        setCurrentPlayer(playerNum === 1 ? 2 : 1);
      }

      return newBoard;
    });
  };

  const handleDropDisc = (col: number) => {
    if (winner || isBotThinking) return;

    if (isOnlineMultiplayer && myPlayer && currentPlayer !== myPlayer) {
      sound.playError();
      return;
    }

    let targetRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!board[r][col]) {
        targetRow = r;
        break;
      }
    }
    if (targetRow === -1) {
      sound.playError();
      return;
    }

    sound.playPieceDrop();

    const newBoard = board.map((row) => [...row]);
    newBoard[targetRow][col] = currentPlayer;
    setBoard(newBoard);
    setMoveHistory((h) => [...h, { r: targetRow, c: col, player: currentPlayer }]);

    if (roomCode) {
      multiplayerService.sendGameAction(roomCode, 'connectfour', 'DROP_DISC', {
        col,
        player: currentPlayer,
      }, currentUserId || 'p1');
    }

    const winResult = checkWin(newBoard);
    if (winResult.winner) {
      setWinner(winResult.winner);
      setWinningCells(winResult.cells);
      sound.playVictory();
      try { confetti({ particleCount: 120, spread: 80 }); } catch (e) {}
      setScores((prev) => ({
        ...prev,
        [winResult.winner === 1 ? 'p1' : 'p2']: prev[winResult.winner === 1 ? 'p1' : 'p2'] + 1,
      }));
      if (onGameEnd) onGameEnd(winResult.winner === 1 ? 'player' : 'opponent');
      return;
    }

    if (isBoardFull(newBoard)) {
      setWinner('draw');
      sound.playReward();
      if (onGameEnd) onGameEnd('draw');
      return;
    }

    const nextPlayer = currentPlayer === 1 ? 2 : 1;
    setCurrentPlayer(nextPlayer);

    // AI bot turn
    if (playMode === 'bot' && nextPlayer === 2) {
      setIsBotThinking(true);
      setTimeout(() => {
        executeBotMove(newBoard);
      }, 500);
    }
  };

  // Bot logic with difficulty
  const executeBotMove = (currentBoard: CellValue[][]) => {
    const validCols: number[] = [];
    for (let c = 0; c < COLS; c++) {
      if (!currentBoard[0][c]) validCols.push(c);
    }

    if (validCols.length === 0) {
      setIsBotThinking(false);
      return;
    }

    // 1. Easy mode: mostly random
    if (difficulty === 'easy' && Math.random() < 0.4) {
      const chosenCol = validCols[Math.floor(Math.random() * validCols.length)];
      dropBotInCol(chosenCol, currentBoard);
      return;
    }

    // 2. Win immediately if possible
    for (const c of validCols) {
      let r = -1;
      for (let row = ROWS - 1; row >= 0; row--) {
        if (!currentBoard[row][c]) { r = row; break; }
      }
      const test = currentBoard.map((row) => [...row]);
      test[r][c] = 2;
      if (checkWin(test).winner === 2) {
        dropBotInCol(c, currentBoard);
        return;
      }
    }

    // 3. Block opponent immediate win
    for (const c of validCols) {
      let r = -1;
      for (let row = ROWS - 1; row >= 0; row--) {
        if (!currentBoard[row][c]) { r = row; break; }
      }
      const test = currentBoard.map((row) => [...row]);
      test[r][c] = 1;
      if (checkWin(test).winner === 1) {
        dropBotInCol(c, currentBoard);
        return;
      }
    }

    // 4. Hard mode: Lookahead 2 moves to avoid giving opponent an instant win
    if (difficulty === 'hard') {
      const safeCols = validCols.filter((c) => {
        let r = -1;
        for (let row = ROWS - 1; row >= 0; row--) {
          if (!currentBoard[row][c]) { r = row; break; }
        }
        if (r - 1 >= 0) {
          const test = currentBoard.map((row) => [...row]);
          test[r][c] = 2;
          test[r - 1][c] = 1;
          if (checkWin(test).winner === 1) return false;
        }
        return true;
      });

      if (safeCols.length > 0) {
        // Prioritize center columns
        const sortedByCenter = [...safeCols].sort((a, b) => Math.abs(a - 3) - Math.abs(b - 3));
        dropBotInCol(sortedByCenter[0], currentBoard);
        return;
      }
    }

    // Default: Center weighted
    let chosenCol = validCols[Math.floor(Math.random() * validCols.length)];
    if (validCols.includes(3) && Math.random() < 0.65) {
      chosenCol = 3;
    }

    dropBotInCol(chosenCol, currentBoard);
  };

  const dropBotInCol = (col: number, currentBoard: CellValue[][]) => {
    let targetRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!currentBoard[r][col]) { targetRow = r; break; }
    }
    sound.playPieceDrop();
    const newBoard = currentBoard.map((r) => [...r]);
    newBoard[targetRow][col] = 2;
    setBoard(newBoard);
    setIsBotThinking(false);
    setMoveHistory((h) => [...h, { r: targetRow, c: col, player: 2 }]);

    const winResult = checkWin(newBoard);
    if (winResult.winner) {
      setWinner(winResult.winner);
      setWinningCells(winResult.cells);
      sound.playError();
      setScores((prev) => ({ ...prev, p2: prev.p2 + 1 }));
      if (onGameEnd) onGameEnd('opponent');
      return;
    }

    if (isBoardFull(newBoard)) {
      setWinner('draw');
      sound.playReward();
      if (onGameEnd) onGameEnd('draw');
      return;
    }

    setCurrentPlayer(1);
  };

  // Undo last move (in bot or local mode)
  const handleUndo = () => {
    if (moveHistory.length === 0 || isBotThinking) return;

    sound.playClick();
    const historyCopy = [...moveHistory];
    const stepsToUndo = playMode === 'bot' && historyCopy.length >= 2 ? 2 : 1;

    for (let i = 0; i < stepsToUndo; i++) {
      const last = historyCopy.pop();
      if (last) {
        board[last.r][last.c] = null;
      }
    }

    setBoard([...board.map((r) => [...r])]);
    setMoveHistory(historyCopy);
    setWinner(null);
    setWinningCells([]);
    setCurrentPlayer(playMode === 'bot' ? 1 : historyCopy.length % 2 === 0 ? 1 : 2);
  };

  const resetBoard = () => {
    sound.playClick();
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
    setCurrentPlayer(1);
    setWinner(null);
    setWinningCells([]);
    setHoverCol(null);
    setIsBotThinking(false);
    setMoveHistory([]);

    if (roomCode) {
      multiplayerService.sendGameAction(roomCode, 'connectfour', 'RESET', {}, currentUserId || 'p1');
    }
  };

  // Theme styling configurations
  const themeStyles = {
    classic: {
      rackGradient: 'from-blue-600 via-blue-700 to-blue-900 border-blue-400/60',
      p1Disc: 'radial-gradient(circle at 35% 30%, #ff4b72, #e11d48 65%, #881337 100%)',
      p2Disc: 'radial-gradient(circle at 35% 30%, #fef08a, #f59e0b 65%, #92400e 100%)',
      cellInset: 'bg-blue-950/90 border-blue-900',
      title: 'Klassisch Blau',
    },
    cyber: {
      rackGradient: 'from-purple-900 via-slate-900 to-indigo-950 border-cyan-400/50',
      p1Disc: 'radial-gradient(circle at 35% 30%, #67e8f9, #06b6d4 65%, #0e7490 100%)',
      p2Disc: 'radial-gradient(circle at 35% 30%, #f472b6, #ec4899 65%, #9d174d 100%)',
      cellInset: 'bg-slate-950 border-cyan-900/60',
      title: 'Cyber Neon',
    },
    wood: {
      rackGradient: 'from-amber-900 via-amber-950 to-stone-900 border-amber-600/50',
      p1Disc: 'radial-gradient(circle at 35% 30%, #fef08a, #d97706 65%, #78350f 100%)',
      p2Disc: 'radial-gradient(circle at 35% 30%, #cbd5e1, #64748b 65%, #1e293b 100%)',
      cellInset: 'bg-stone-950 border-amber-950',
      title: 'Edles Holz',
    },
  }[theme];

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none text-slate-100">
      
      {/* Header bar with Player badges and Scores */}
      <div className="w-full bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl mb-3 shadow-xl space-y-3">
        {/* Top bar with scores */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          {/* Player 1 */}
          <div className={`flex items-center gap-2.5 p-2 rounded-xl transition ${currentPlayer === 1 && !winner ? 'bg-rose-950/40 border border-rose-500/40 ring-1 ring-rose-500/50' : ''}`}>
            {p1?.avatar ? (
              <AvatarDisplay avatar={p1.avatar} size="sm" />
            ) : (
              <div
                className="w-6 h-6 rounded-full border border-red-300 shadow-md"
                style={{ background: themeStyles.p1Disc }}
              />
            )}
            <div>
              <div className="text-slate-200 font-bold flex items-center gap-1.5 text-xs">
                <span>{p1Name}</span>
                {currentPlayer === 1 && !winner && (
                  <span className="text-[9px] bg-rose-500 text-white px-1 rounded font-black animate-pulse">AM ZUG</span>
                )}
              </div>
              <div className="text-[11px] text-rose-400 font-mono font-bold">Siege: {scores.p1}</div>
            </div>
          </div>

          {/* Series badge */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Best of {seriesTarget}</span>
            <div className="text-base font-black font-mono text-amber-400">
              {scores.p1} : {scores.p2}
            </div>
          </div>

          {/* Player 2 */}
          <div className={`flex items-center gap-2.5 p-2 rounded-xl transition text-right ${currentPlayer === 2 && !winner ? 'bg-amber-950/40 border border-amber-500/40 ring-1 ring-amber-500/50' : ''}`}>
            <div>
              <div className="text-slate-200 font-bold flex items-center gap-1.5 text-xs justify-end">
                {currentPlayer === 2 && !winner && (
                  <span className="text-[9px] bg-amber-400 text-slate-950 px-1 rounded font-black animate-pulse">AM ZUG</span>
                )}
                <span>{p2Name}</span>
              </div>
              <div className="text-[11px] text-amber-400 font-mono font-bold">Siege: {scores.p2}</div>
            </div>
            {p2?.avatar ? (
              <AvatarDisplay avatar={p2.avatar} size="sm" />
            ) : (
              <div
                className="w-6 h-6 rounded-full border border-amber-200 shadow-md"
                style={{ background: themeStyles.p2Disc }}
              />
            )}
          </div>
        </div>

        {/* Sub-bar: Modes, Difficulty & Theme selection */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Modes */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => { sound.playClick(); setPlayMode('bot'); resetBoard(); }}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
                playMode === 'bot' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" /> KI-Duell
            </button>
            <button
              onClick={() => { sound.playClick(); setPlayMode('local2p'); resetBoard(); }}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
                playMode === 'local2p' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> 2P Tisch
            </button>
          </div>

          {/* Difficulty if Bot */}
          {playMode === 'bot' && (
            <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 px-1">KI:</span>
              {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setDifficulty(lvl)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize transition ${
                    difficulty === lvl ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl === 'easy' ? 'Leicht' : lvl === 'medium' ? 'Mittel' : 'Meister'}
                </button>
              ))}
            </div>
          )}

          {/* Theme selector */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <Palette className="w-3.5 h-3.5 text-amber-400 ml-1" />
            {(['classic', 'cyber', 'wood'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                  theme === t ? 'bg-slate-700 text-amber-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'classic' ? 'Blau' : t === 'cyber' ? 'Neon' : 'Holz'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Turn indicator & Winner Announcement */}
      <div className="mb-2 text-center">
        {winner ? (
          <div className="flex items-center gap-2 text-sm font-bold text-amber-300 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-400/40 animate-bounce">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>
              {winner === 'draw'
                ? 'Unentschieden! Tolle Partie!'
                : winner === 1
                ? `🏆 ${p1Name} gewinnt die Runde!`
                : `🏆 ${p2Name} gewinnt die Runde!`}
            </span>
          </div>
        ) : isBotThinking ? (
          <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-400/30">
            <Bot className="w-3.5 h-3.5 animate-spin" />
            <span>{p2Name} berechnet den optimalen Zug...</span>
          </div>
        ) : (
          <div className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
            <ArrowDown className="w-3.5 h-3.5 animate-bounce text-amber-400" />
            <span>Klicke auf eine Spalte, um deine Scheibe einzuwerfen</span>
          </div>
        )}
      </div>

      {/* 3D Vertical Game Rack Frame */}
      <div className="relative w-full rounded-3xl p-3 sm:p-5 shadow-2xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col items-center">
        <div className={`relative z-10 bg-gradient-to-b ${themeStyles.rackGradient} p-2 sm:p-4 rounded-2xl shadow-2xl border-2 w-full max-w-lg`}>
          
          {/* Metallic Top Bolts and Branding Badge */}
          <div className="flex justify-between items-center mb-2 px-1 sm:px-2">
            <div className="w-3 h-3 rounded-full bg-slate-200 border border-slate-500 shadow-inner flex items-center justify-center">
              <div className="w-1.5 h-0.5 bg-slate-600" />
            </div>
            <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-100 font-display flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" /> 4-IN-A-ROW CLASSIC
            </div>
            <div className="w-3 h-3 rounded-full bg-slate-200 border border-slate-500 shadow-inner flex items-center justify-center">
              <div className="w-1.5 h-0.5 bg-slate-600" />
            </div>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isWinningCell = winningCells.some(([wr, wc]) => wr === r && wc === c);

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleDropDisc(c)}
                    className={`aspect-square rounded-full flex items-center justify-center cursor-pointer relative ${themeStyles.cellInset} shadow-inner overflow-hidden border`}
                    style={{
                      boxShadow: 'inset 0 4px 6px -1px rgba(0, 0, 0, 0.9), inset 0 2px 4px -1px rgba(0, 0, 0, 0.6)'
                    }}
                  >
                    {/* 3D Tactile Acrylic Disc Piece */}
                    {cell ? (
                      <div
                        className={`w-full h-full rounded-full transition-transform flex items-center justify-center relative ${
                          isWinningCell ? 'animate-bounce ring-4 ring-white z-20' : ''
                        }`}
                        style={{
                          background: cell === 1 ? themeStyles.p1Disc : themeStyles.p2Disc,
                          boxShadow: '0 6px 10px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255, 255, 255, 0.7), inset 0 -3px 6px rgba(0, 0, 0, 0.4)',
                        }}
                      >
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white/30 flex items-center justify-center">
                          <span className="text-[10px] font-black text-white/70">★</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-950/70 shadow-inner" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Stand Feet */}
          <div className="mt-3 pt-2 border-t border-white/20 flex justify-between items-center px-4 text-[10px] text-slate-300 font-mono">
            <span>STABILER STANDFUSS</span>
            <div className="h-2 w-20 bg-slate-950 rounded-full border border-white/20" />
            <span>SCHIEBER-RESET</span>
          </div>
        </div>
      </div>

      {/* Action Footer: Undo and New Round */}
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={handleUndo}
          disabled={moveHistory.length === 0 || !!winner || isBotThinking}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow"
          title="Letzten Zug zurücknehmen"
        >
          <Undo2 className="w-3.5 h-3.5 text-sky-400" />
          <span>Zug zurück</span>
        </button>

        <button
          onClick={resetBoard}
          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Neue Runde</span>
        </button>
      </div>
    </div>
  );
};
