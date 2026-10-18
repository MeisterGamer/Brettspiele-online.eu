export type Difficulty = 'easy' | 'normal' | 'hard';
export const pick = <T>(items: readonly T[]): T | undefined => items[Math.floor(Math.random() * items.length)];

/** Fisher–Yates: every permutation is equally likely; never mutate the source. */
export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const triples = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
export function ticResult(board: readonly (string | null)[]): string | null {
  for (const [a,b,c] of triples) if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  return board.every(Boolean) ? 'draw' : null;
}
export function chooseTicMove(board: readonly (string | null)[], difficulty: Difficulty = 'normal', symbol = 'O'): number | null {
  if (ticResult(board)) return null;
  const other = symbol === 'O' ? 'X' : 'O';
  const empty = [4,0,2,6,8,1,3,5,7].filter(i => !board[i]);
  if (difficulty === 'easy') return pick(empty) ?? null;
  for (const player of [symbol, other]) {
    const winning = empty.find(i => { const test = [...board]; test[i] = player; return ticResult(test) === player; });
    if (winning !== undefined) return winning;
  }
  if (difficulty === 'normal') return empty[0] ?? null;
  const search = (grid: (string | null)[], turn: string, depth: number): number => {
    const result = ticResult(grid);
    if (result) return result === symbol ? 10 - depth : result === 'draw' ? 0 : depth - 10;
    const values: number[] = [];
    for (const i of empty) if (!grid[i]) {
      grid[i] = turn;
      values.push(search(grid, turn === symbol ? other : symbol, depth + 1));
      grid[i] = null;
    }
    return turn === symbol ? Math.max(...values) : Math.min(...values);
  };
  return empty.reduce((best, i) => {
    const test = [...board]; test[i] = symbol;
    const score = search(test, other, 1);
    return score > best.score ? { index: i, score } : best;
  }, { index: empty[0], score: -Infinity }).index ?? null;
}

export type ConnectCell = 1 | 2 | null;
export function connectWinner(board: readonly (readonly ConnectCell[])[]): ConnectCell {
  for (let r=0;r<6;r++) for (let c=0;c<7;c++) {
    const v=board[r][c]; if (!v) continue;
    for (const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]) {
      if ([1,2,3].every(n => board[r+dr*n]?.[c+dc*n] === v)) return v;
    }
  }
  return null;
}
export function chooseConnectMove(board: readonly (readonly ConnectCell[])[], difficulty: Difficulty = 'normal', player: 1 | 2 = 2): number | null {
  if (connectWinner(board)) return null;
  const order = [3,2,4,1,5,0,6];
  const valid = order.filter(c => board[0][c] === null);
  if (!valid.length) return null;
  if (difficulty === 'easy') return pick(valid) ?? null;
  const opponent = player === 1 ? 2 : 1;
  const drop = (grid: readonly (readonly ConnectCell[])[], col: number, who: 1 | 2) => {
    const next = grid.map(row => [...row]);
    for (let r=5;r>=0;r--) if (next[r][col] === null) { next[r][col] = who; break; }
    return next;
  };
  const evaluate = (grid: readonly (readonly ConnectCell[])[]) => {
    let value = 0;
    for (let r=0;r<6;r++) {
      if (grid[r][3] === player) value += 6;
      if (grid[r][3] === opponent) value -= 6;
      for (let c=0;c<7;c++) for (const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]) {
        if (r+3*dr > 5 || c+3*dc < 0 || c+3*dc > 6) continue;
        const line = [0,1,2,3].map(n => grid[r+dr*n][c+dc*n]);
        const ours = line.filter(v => v === player).length;
        const theirs = line.filter(v => v === opponent).length;
        if (!theirs) value += [0,1,8,60,10000][ours];
        if (!ours) value -= [0,1,10,90,10000][theirs];
      }
    }
    return value;
  };
  const search = (grid: ConnectCell[][], depth: number, turn: 1 | 2, alpha: number, beta: number): number => {
    const win = connectWinner(grid);
    if (win) return win === player ? 100000 + depth : -100000 - depth;
    const cols = order.filter(c => grid[0][c] === null);
    if (!cols.length) return 0;
    if (!depth) return evaluate(grid);
    let best = turn === player ? -Infinity : Infinity;
    for (const col of cols) {
      const score = search(drop(grid,col,turn),depth-1,turn === player ? opponent : player,alpha,beta);
      if (turn === player) { best=Math.max(best,score); alpha=Math.max(alpha,best); }
      else { best=Math.min(best,score); beta=Math.min(beta,best); }
      if (beta<=alpha) break;
    }
    return best;
  };
  const depth = difficulty === 'hard' ? 5 : 3;
  let best = valid[0], value = -Infinity;
  for (const col of valid) {
    const score = search(drop(board,col,player),depth-1,opponent,-Infinity,Infinity);
    if (score > value) { value=score; best=col; }
  }
  return best;
}

/** Uses revealed hits/misses only, never the hidden fleet. */
export function chooseBattleshipShot(damage: readonly (readonly string[])[], difficulty: Difficulty): [number, number] | null {
  const cells: { at: [number,number]; score: number }[] = [];
  for (let r=0;r<damage.length;r++) for (let c=0;c<damage[r].length;c++) {
    if (damage[r][c] !== 'empty') continue;
    let score = (r+c)%2 === 0 ? 1 : 0;
    for (const [dr,dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      if (damage[r+dr]?.[c+dc] === 'hit') {
        score += 10;
        if (difficulty === 'hard' && damage[r+2*dr]?.[c+2*dc] === 'hit') score += 20;
      }
    }
    cells.push({ at:[r,c], score });
  }
  if (!cells.length) return null;
  if (difficulty === 'easy') return pick(cells)!.at;
  const best = Math.max(...cells.map(cell => cell.score));
  return pick(cells.filter(cell => cell.score === best))!.at;
}

export function chooseBoxLine(h: readonly (readonly boolean[])[], v: readonly (readonly boolean[])[], difficulty: Difficulty): { type: 'H' | 'V'; r: number; c: number } | null {
  const candidates: { type:'H'|'V'; r:number; c:number; score:number }[]=[];
  const size=v.length;
  const edges=(r:number,c:number) => Number(h[r][c])+Number(h[r+1][c])+Number(v[r][c])+Number(v[r][c+1]);
  const add=(type:'H'|'V',r:number,c:number) => {
    const boxes=type==='H' ? [[r-1,c],[r,c]] : [[r,c-1],[r,c]];
    let score=0;
    for (const [br,bc] of boxes) if (br>=0 && br<size && bc>=0 && bc<size) {
      const n=edges(br,bc);
      score += n===3 ? 100 : n===2 ? -20 : 0;
    }
    candidates.push({type,r,c,score});
  };
  h.forEach((row,r)=>row.forEach((used,c)=>{ if (!used) add('H',r,c); }));
  v.forEach((row,r)=>row.forEach((used,c)=>{ if (!used) add('V',r,c); }));
  if (!candidates.length) return null;
  const max=Math.max(...candidates.map(m=>m.score));
  return pick(difficulty==='easy' ? candidates : candidates.filter(m=>m.score===max))!;
}
