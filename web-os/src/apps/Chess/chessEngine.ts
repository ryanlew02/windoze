import { getLegalMoves, applyMove, type GameState, type Board } from './chessLogic';

export type Difficulty = 'beginner' | 'intermediate' | 'expert' | 'impossible';

interface Move { from: [number, number]; to: [number, number] }

// ─── piece values ────────────────────────────────────────────────────────────

const VAL: Record<string, number> = {
  P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000,
};

// ─── piece-square tables (white POV: row 0 = rank 8, row 7 = rank 1) ────────

const PST: Record<string, number[][]> = {
  P: [
    [  0,  0,  0,  0,  0,  0,  0,  0],
    [ 50, 50, 50, 50, 50, 50, 50, 50],
    [ 10, 10, 20, 30, 30, 20, 10, 10],
    [  5,  5, 10, 25, 25, 10,  5,  5],
    [  0,  0,  0, 20, 20,  0,  0,  0],
    [  5, -5,-10,  0,  0,-10, -5,  5],
    [  5, 10, 10,-20,-20, 10, 10,  5],
    [  0,  0,  0,  0,  0,  0,  0,  0],
  ],
  N: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50],
  ],
  B: [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20],
  ],
  R: [
    [  0,  0,  0,  0,  0,  0,  0,  0],
    [  5, 10, 10, 10, 10, 10, 10,  5],
    [ -5,  0,  0,  0,  0,  0,  0, -5],
    [ -5,  0,  0,  0,  0,  0,  0, -5],
    [ -5,  0,  0,  0,  0,  0,  0, -5],
    [ -5,  0,  0,  0,  0,  0,  0, -5],
    [ -5,  0,  0,  0,  0,  0,  0, -5],
    [  0,  0,  0,  5,  5,  0,  0,  0],
  ],
  Q: [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [ -5,  0,  5,  5,  5,  5,  0, -5],
    [  0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20],
  ],
  K: [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [ 20, 20,  0,  0,  0,  0, 20, 20],
    [ 20, 30, 10,  0,  0, 10, 30, 20],
  ],
};

// ─── evaluation ─────────────────────────────────────────────────────────────

function evaluate(board: Board): number {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const pstRow = p.color === 'white' ? r : 7 - r;
      const positional = PST[p.type]?.[pstRow]?.[c] ?? 0;
      const val = VAL[p.type] + positional;
      score += p.color === 'white' ? val : -val;
    }
  }
  return score;
}

// ─── move helpers ────────────────────────────────────────────────────────────

function getAllMoves(state: GameState): Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (state.board[r][c]?.color === state.turn)
        for (const to of getLegalMoves(state, r, c))
          moves.push({ from: [r, c], to });
  return moves;
}

// MVV-LVA: sort captures first (highest-value victim × least-value attacker)
function orderMoves(board: Board, moves: Move[]): Move[] {
  return [...moves].sort((a, b) => {
    const va = board[a.to[0]][a.to[1]] ? VAL[board[a.to[0]][a.to[1]]!.type] : 0;
    const vb = board[b.to[0]][b.to[1]] ? VAL[board[b.to[0]][b.to[1]]!.type] : 0;
    return vb - va;
  });
}

// ─── minimax with alpha-beta pruning ────────────────────────────────────────

function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
): number {
  if (state.status === 'checkmate') return maximizing ? -100000 - depth : 100000 + depth;
  if (state.status === 'stalemate') return 0;
  if (depth === 0) return evaluate(state.board);

  const moves = orderMoves(state.board, getAllMoves(state));

  if (maximizing) {
    let best = -Infinity;
    for (const { from, to } of moves) {
      best = Math.max(best, minimax(applyMove(state, from, to), depth - 1, alpha, beta, false));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const { from, to } of moves) {
      best = Math.min(best, minimax(applyMove(state, from, to), depth - 1, alpha, beta, true));
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

// ─── public API ─────────────────────────────────────────────────────────────

const DEPTH: Record<Difficulty, number> = {
  beginner: 0, intermediate: 2, expert: 3, impossible: 4,
};

export function getBestMove(state: GameState, difficulty: Difficulty): Move | null {
  const moves = getAllMoves(state);
  if (moves.length === 0) return null;

  // Beginner: random
  if (difficulty === 'beginner') {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const depth       = DEPTH[difficulty];
  const maximizing  = state.turn === 'white';
  let bestScore     = maximizing ? -Infinity : Infinity;
  let bestMove      = moves[0];

  // Shuffle before ordering so equal-scored moves vary between games
  const ordered = orderMoves(state.board, [...moves].sort(() => Math.random() - 0.5));

  for (const move of ordered) {
    const score = minimax(applyMove(state, move.from, move.to), depth - 1, -Infinity, Infinity, !maximizing);
    if (maximizing ? score > bestScore : score < bestScore) {
      bestScore = score;
      bestMove  = move;
    }
  }

  return bestMove;
}
