export type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
export type Color = 'white' | 'black';
export type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate';

export interface Piece { type: PieceType; color: Color }
export type Square = Piece | null;
export type Board  = Square[][];

export interface GameState {
  board: Board;
  turn: Color;
  castling: { wK: boolean; wQ: boolean; bK: boolean; bQ: boolean };
  enPassant: [number, number] | null;
  status: GameStatus;
  // position key → how many times it has occurred; drives repetition detection
  posHistory: Record<string, number>;
}

// ─── helpers ───────────────────────────────────────────────────────────────

export function opp(c: Color): Color { return c === 'white' ? 'black' : 'white'; }

function inBounds(r: number, c: number): boolean { return r >= 0 && r < 8 && c >= 0 && c < 8; }

function cloneBoard(b: Board): Board { return b.map(row => row.map(sq => sq ? { ...sq } : null)); }

// Compact key encoding board + side-to-move + castling rights + en-passant target.
// Two states with the same key are identical for repetition purposes.
function positionKey(
  board: Board,
  turn: Color,
  castling: GameState['castling'],
  enPassant: [number, number] | null,
): string {
  const b = board.flat().map(sq => sq ? `${sq.color[0]}${sq.type}` : '__').join('');
  const c = `${+castling.wK}${+castling.wQ}${+castling.bK}${+castling.bQ}`;
  const ep = enPassant ? `${enPassant[0]}${enPassant[1]}` : '--';
  return `${b}|${turn[0]}|${c}|${ep}`;
}

// ─── attack map (used for check detection — no castling/en-passant needed) ──

function getAttacks(board: Board, r: number, c: number): [number, number][] {
  const piece = board[r][c];
  if (!piece) return [];
  const { type, color } = piece;
  const out: [number, number][] = [];

  const add   = (dr: number, dc: number) => { if (inBounds(r+dr, c+dc)) out.push([r+dr, c+dc]); };
  const slide = (dr: number, dc: number) => {
    let nr = r+dr, nc = c+dc;
    while (inBounds(nr, nc)) { out.push([nr, nc]); if (board[nr][nc]) break; nr+=dr; nc+=dc; }
  };

  switch (type) {
    case 'P': { const d = color === 'white' ? -1 : 1; add(d,-1); add(d,1); break; }
    case 'N': for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) add(dr,dc); break;
    case 'B': for (const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) slide(dr,dc); break;
    case 'R': for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) slide(dr,dc); break;
    case 'Q': for (const [dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) slide(dr,dc); break;
    case 'K': for (const [dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) add(dr,dc); break;
  }
  return out;
}

export function isAttacked(board: Board, r: number, c: number, byColor: Color): boolean {
  for (let br = 0; br < 8; br++)
    for (let bc = 0; bc < 8; bc++)
      if (board[br][bc]?.color === byColor && getAttacks(board, br, bc).some(([ar,ac]) => ar===r && ac===c))
        return true;
  return false;
}

function findKing(board: Board, color: Color): [number, number] {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]?.type === 'K' && board[r][c]?.color === color) return [r, c];
  return [-1, -1];
}

function inCheck(board: Board, color: Color): boolean {
  const [kr, kc] = findKing(board, color);
  return isAttacked(board, kr, kc, opp(color));
}

// ─── board mutation ─────────────────────────────────────────────────────────

export function applyMoveToBoard(
  board: Board,
  from: [number, number],
  to:   [number, number],
  enPassant: [number, number] | null,
  promoteTo: PieceType = 'Q',
): Board {
  const b = cloneBoard(board);
  const [fr, fc] = from;
  const [tr, tc] = to;
  const piece = b[fr][fc]!;

  const promoting = piece.type === 'P' && (tr === 0 || tr === 7);
  b[tr][tc] = promoting ? { type: promoteTo, color: piece.color } : { ...piece };
  b[fr][fc] = null;

  // castling — also move the rook
  if (piece.type === 'K' && Math.abs(tc - fc) === 2) {
    if (tc === 6) { b[tr][5] = b[tr][7]; b[tr][7] = null; }
    else          { b[tr][3] = b[tr][0]; b[tr][0] = null; }
  }

  // en passant — remove the captured pawn (same row as mover, destination column)
  if (piece.type === 'P' && enPassant && tr === enPassant[0] && tc === enPassant[1] && !board[tr][tc]) {
    b[fr][tc] = null;
  }

  return b;
}

// ─── legal move generation ──────────────────────────────────────────────────

function pseudoMoves(state: GameState, fr: number, fc: number): [number, number][] {
  const { board, castling, enPassant } = state;
  const piece = board[fr][fc];
  if (!piece) return [];
  const { type, color } = piece;
  const out: [number, number][] = [];

  const push  = (r: number, c: number) => { if (inBounds(r,c) && board[r][c]?.color !== color) out.push([r,c]); };
  const slide = (dr: number, dc: number) => {
    let r = fr+dr, c = fc+dc;
    while (inBounds(r,c)) {
      if (board[r][c]) { if (board[r][c]!.color !== color) out.push([r,c]); break; }
      out.push([r,c]); r+=dr; c+=dc;
    }
  };

  switch (type) {
    case 'P': {
      const dir      = color === 'white' ? -1 : 1;
      const startRow = color === 'white' ? 6 : 1;
      if (inBounds(fr+dir, fc) && !board[fr+dir][fc]) {
        out.push([fr+dir, fc]);
        if (fr === startRow && !board[fr+2*dir][fc]) out.push([fr+2*dir, fc]);
      }
      for (const dc of [-1, 1]) {
        const r = fr+dir, c = fc+dc;
        if (!inBounds(r,c)) continue;
        if (board[r][c]?.color === opp(color)) out.push([r,c]);
        if (enPassant && r === enPassant[0] && c === enPassant[1]) out.push([r,c]);
      }
      break;
    }
    case 'N': for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) push(fr+dr, fc+dc); break;
    case 'B': for (const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) slide(dr,dc); break;
    case 'R': for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) slide(dr,dc); break;
    case 'Q': for (const [dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) slide(dr,dc); break;
    case 'K': {
      for (const [dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) push(fr+dr, fc+dc);
      const base = color === 'white' ? 7 : 0;
      if (fr === base && fc === 4) {
        const ks = color === 'white' ? castling.wK : castling.bK;
        const qs = color === 'white' ? castling.wQ : castling.bQ;
        if (ks && !board[base][5] && !board[base][6] && board[base][7]?.type === 'R' && board[base][7]?.color === color)
          out.push([base, 6]);
        if (qs && !board[base][1] && !board[base][2] && !board[base][3] && board[base][0]?.type === 'R' && board[base][0]?.color === color)
          out.push([base, 2]);
      }
      break;
    }
  }
  return out;
}

export function getLegalMoves(state: GameState, fr: number, fc: number): [number, number][] {
  const piece = state.board[fr][fc];
  if (!piece || piece.color !== state.turn) return [];

  return pseudoMoves(state, fr, fc).filter(([tr, tc]) => {
    if (piece.type === 'K' && Math.abs(tc - fc) === 2) {
      const base    = piece.color === 'white' ? 7 : 0;
      const passCol = tc === 6 ? 5 : 3;
      if (isAttacked(state.board, base, 4,       opp(piece.color))) return false;
      if (isAttacked(state.board, base, passCol,  opp(piece.color))) return false;
      const after = applyMoveToBoard(state.board, [fr,fc], [tr,tc], state.enPassant);
      return !isAttacked(after, base, tc, opp(piece.color));
    }
    const after = applyMoveToBoard(state.board, [fr,fc], [tr,tc], state.enPassant);
    return !inCheck(after, piece.color);
  });
}

// ─── full move application ──────────────────────────────────────────────────

export function applyMove(
  state: GameState,
  from: [number, number],
  to:   [number, number],
  promoteTo: PieceType = 'Q',
): GameState {
  const piece    = state.board[from[0]][from[1]]!;
  const newBoard = applyMoveToBoard(state.board, from, to, state.enPassant, promoteTo);
  const newTurn  = opp(state.turn);

  // en passant target
  const newEP: [number,number] | null =
    piece.type === 'P' && Math.abs(to[0] - from[0]) === 2
      ? [(from[0] + to[0]) / 2, from[1]]
      : null;

  // castling rights — fixed: use && not || so only the correct rook colour is checked
  const c = { ...state.castling };
  if (piece.type === 'K') {
    if (piece.color === 'white') { c.wK = false; c.wQ = false; }
    else                         { c.bK = false; c.bQ = false; }
  }
  if (piece.type === 'R' && piece.color === 'white') {
    if (from[0] === 7 && from[1] === 7) c.wK = false;
    if (from[0] === 7 && from[1] === 0) c.wQ = false;
  }
  if (piece.type === 'R' && piece.color === 'black') {
    if (from[0] === 0 && from[1] === 7) c.bK = false;
    if (from[0] === 0 && from[1] === 0) c.bQ = false;
  }
  // rook captured on its home square also forfeits rights
  if (to[0] === 7 && to[1] === 7) c.wK = false;
  if (to[0] === 7 && to[1] === 0) c.wQ = false;
  if (to[0] === 0 && to[1] === 7) c.bK = false;
  if (to[0] === 0 && to[1] === 0) c.bQ = false;

  // threefold-repetition tracking
  const key      = positionKey(newBoard, newTurn, c, newEP);
  const count    = (state.posHistory[key] ?? 0) + 1;
  const newPosHistory = count === (state.posHistory[key] ?? 0) + 1
    ? { ...state.posHistory, [key]: count }
    : state.posHistory;

  const nextState: GameState = {
    board: newBoard, turn: newTurn, castling: c,
    enPassant: newEP, status: 'playing',
    posHistory: { ...state.posHistory, [key]: count },
  };

  // determine status
  let status: GameStatus = 'playing';
  if (count >= 3) {
    status = 'stalemate'; // draw by threefold repetition
  } else {
    const hasLegal = hasAnyLegalMove(nextState);
    const kingHit  = inCheck(newBoard, newTurn);
    if (!hasLegal) status = kingHit ? 'checkmate' : 'stalemate';
    else if (kingHit) status = 'check';
  }

  return { ...nextState, status };
}

function hasAnyLegalMove(state: GameState): boolean {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (state.board[r][c]?.color === state.turn && getLegalMoves(state, r, c).length > 0)
        return true;
  return false;
}

// ─── initial state ──────────────────────────────────────────────────────────

export function makeInitialState(): GameState {
  const board: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const back: PieceType[] = ['R','N','B','Q','K','B','N','R'];
  for (let c = 0; c < 8; c++) {
    board[0][c] = { type: back[c], color: 'black' };
    board[1][c] = { type: 'P',     color: 'black' };
    board[6][c] = { type: 'P',     color: 'white' };
    board[7][c] = { type: back[c], color: 'white' };
  }
  const castling  = { wK: true, wQ: true, bK: true, bQ: true };
  const key       = positionKey(board, 'white', castling, null);
  return {
    board,
    turn: 'white',
    castling,
    enPassant: null,
    status: 'playing',
    posHistory: { [key]: 1 }, // seed with the starting position
  };
}
