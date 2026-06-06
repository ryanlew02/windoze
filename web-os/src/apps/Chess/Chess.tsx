import { useEffect, useState } from 'react';
import {
  makeInitialState, getLegalMoves, applyMove, opp,
  type GameState, type PieceType, type Board,
} from './chessLogic';
import { getBestMove, type Difficulty } from './chessEngine';
import { useNotificationStore } from '../../store/useNotificationStore';
import styles from './Chess.module.css';

const SYMBOLS: Record<'white' | 'black', Record<PieceType, string>> = {
  white: { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙' },
  black: { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' },
};

const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = ['8','7','6','5','4','3','2','1'];
const PROMO_PIECES: PieceType[] = ['Q','R','B','N'];

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'beginner',     label: 'Beginner'     },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'expert',       label: 'Expert'       },
];

// ─── material calculation ────────────────────────────────────────────────────

const PIECE_POINTS: Partial<Record<PieceType, number>> = { P: 1, N: 3, B: 3, R: 5, Q: 9 };
const STARTING: Record<PieceType, number> = { K: 1, Q: 1, R: 2, B: 2, N: 2, P: 8 };
const PIECE_ORDER: PieceType[] = ['Q', 'R', 'B', 'N', 'P'];

function computeMaterial(board: Board) {
  const on: Record<'white' | 'black', Partial<Record<PieceType, number>>> = { white: {}, black: {} };
  for (const row of board)
    for (const sq of row)
      if (sq) on[sq.color][sq.type] = (on[sq.color][sq.type] ?? 0) + 1;

  const capturedByWhite: Partial<Record<PieceType, number>> = {};
  const capturedByBlack: Partial<Record<PieceType, number>> = {};
  for (const t of PIECE_ORDER) {
    const bLost = STARTING[t] - (on.black[t] ?? 0);
    const wLost = STARTING[t] - (on.white[t] ?? 0);
    if (bLost > 0) capturedByWhite[t] = bLost;
    if (wLost > 0) capturedByBlack[t] = wLost;
  }

  const wTotal = PIECE_ORDER.reduce((s, t) => s + (on.white[t] ?? 0) * (PIECE_POINTS[t] ?? 0), 0);
  const bTotal = PIECE_ORDER.reduce((s, t) => s + (on.black[t] ?? 0) * (PIECE_POINTS[t] ?? 0), 0);

  return { capturedByWhite, capturedByBlack, advantage: wTotal - bTotal };
}

// ─── player bar ──────────────────────────────────────────────────────────────

function PlayerBar({
  captured, capturedColor, advantage,
}: {
  captured: Partial<Record<PieceType, number>>;
  capturedColor: 'white' | 'black';
  advantage: number;
}) {
  const pieces = PIECE_ORDER.flatMap(t => Array(captured[t] ?? 0).fill(t));
  return (
    <div className={styles.playerBar}>
      <div className={styles.capturedPieces}>
        {pieces.map((t, i) => (
          <span key={i} className={styles.capturedPiece}>
            {SYMBOLS[capturedColor][t as PieceType]}
          </span>
        ))}
      </div>
      {advantage > 0 && <span className={styles.advantageLabel}>+{advantage}</span>}
    </div>
  );
}

// ─── component ───────────────────────────────────────────────────────────────

interface PendingPromotion { from: [number,number]; to: [number,number] }

export function ChessApp() {
  const [game, setGame]             = useState<GameState>(makeInitialState);
  const [selected, setSelected]     = useState<[number,number] | null>(null);
  const [moves, setMoves]           = useState<[number,number][]>([]);
  const [promo, setPromo]           = useState<PendingPromotion | null>(null);
  const [vsAI, setVsAI]             = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
  const [thinking, setThinking]     = useState(false);

  const over     = game.status === 'checkmate' || game.status === 'stalemate';
  const isAiTurn = vsAI && game.turn === 'black' && !over;

  const { capturedByWhite, capturedByBlack, advantage } = computeMaterial(game.board);

  useEffect(() => {
    if (!isAiTurn || promo) return;
    setThinking(true);
    const t = setTimeout(() => {
      const move = getBestMove(game, difficulty);
      if (move) setGame(applyMove(game, move.from, move.to));
      setThinking(false);
    }, 300);
    return () => { clearTimeout(t); setThinking(false); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, isAiTurn, difficulty]);

  useEffect(() => {
    if (game.status === 'checkmate' && winner === 'white') {
      useNotificationStore.getState().push({
        icon:    '♔',
        title:   'PLAYER WINS',
        message: 'White wins by checkmate.',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.status]);

  function selectSquare(row: number, col: number) {
    if (over || promo || isAiTurn || thinking) return;
    const piece = game.board[row][col];

    if (selected) {
      const isTarget = moves.some(([r,c]) => r === row && c === col);
      if (isTarget) {
        const mover = game.board[selected[0]][selected[1]]!;
        if (mover.type === 'P' && (row === 0 || row === 7)) {
          setPromo({ from: selected, to: [row, col] });
        } else {
          setGame(applyMove(game, selected, [row, col]));
        }
        setSelected(null); setMoves([]);
        return;
      }
      if (selected[0] === row && selected[1] === col) {
        setSelected(null); setMoves([]); return;
      }
    }

    if (piece?.color === game.turn) {
      setSelected([row, col]);
      setMoves(getLegalMoves(game, row, col));
    } else {
      setSelected(null); setMoves([]);
    }
  }

  function handlePromotion(pt: PieceType) {
    if (!promo) return;
    setGame(applyMove(game, promo.from, promo.to, pt));
    setPromo(null);
  }

  function handleNewGame() {
    setGame(makeInitialState());
    setSelected(null); setMoves([]); setPromo(null); setThinking(false);
  }

  function handleSetVsAI(val: boolean) {
    setVsAI(val); setSelected(null); setMoves([]);
  }

  const winner = opp(game.turn);

  return (
    <div className={styles.container}>

      {/* ── status bar ── */}
      <div className={styles.statusBar}>
        <span className={styles.turnLabel}>
          {game.status === 'checkmate'
            ? `${winner === 'white' ? 'White' : 'Black'} wins`
            : game.status === 'stalemate' ? 'Draw — stalemate'
            : thinking ? 'AI thinking…'
            : `${game.turn === 'white' ? 'White' : 'Black'} to move`}
        </span>
        {game.status === 'check' && <span className={styles.checkBadge}>CHECK</span>}
        <button className={styles.newGameBtn} onClick={handleNewGame}>New Game</button>
      </div>

      {/* ── mode + difficulty controls ── */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <button className={`${styles.modeBtn} ${!vsAI ? styles.modeBtnActive : ''}`} onClick={() => handleSetVsAI(false)}>2 Player</button>
          <button className={`${styles.modeBtn} ${vsAI  ? styles.modeBtnActive : ''}`} onClick={() => handleSetVsAI(true)}>vs AI</button>
        </div>
        <div className={`${styles.controlGroup} ${!vsAI ? styles.dimmed : ''}`}>
          {DIFFICULTIES.map(({ id, label }) => (
            <button
              key={id}
              className={`${styles.diffBtn} ${difficulty === id && vsAI ? styles.diffBtnActive : ''}`}
              onClick={() => { setDifficulty(id); if (!vsAI) setVsAI(true); }}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* ── board area ── */}
      <div className={styles.boardArea}>

        {/*
          boardWrap is a flex row: rank labels on the left, then .inner.
          .inner is the same square container as the original — height: 100%,
          aspect-ratio: 1. Player bars live INSIDE .inner so they don't affect
          the outer sizing logic that was already working.
          Rank labels have margin-top / height adjusted to align with the board
          portion only (skipping player-bar and file-label rows inside .inner).
        */}
        <div className={styles.boardWrap}>
          <div className={styles.ranks}>
            {RANKS.map(r => <span key={r} className={styles.rankLabel}>{r}</span>)}
          </div>
          <div className={styles.inner}>
            {/* black's bar — pieces white has lost (black captured) */}
            <PlayerBar
              captured={capturedByBlack}
              capturedColor="white"
              advantage={advantage < 0 ? Math.abs(advantage) : 0}
            />
            <div className={styles.board}>
              {game.board.map((rowArr, row) =>
                rowArr.map((piece, col) => {
                  const light     = (row + col) % 2 === 0;
                  const isSel     = selected?.[0] === row && selected?.[1] === col;
                  const isTarget  = moves.some(([r,c]) => r === row && c === col);
                  const isCapture = isTarget && !!piece;
                  const kingCheck = piece?.type === 'K' && piece.color === game.turn
                                    && (game.status === 'check' || game.status === 'checkmate');
                  return (
                    <div
                      key={`${row}-${col}`}
                      className={[
                        styles.square,
                        light     ? styles.light    : styles.dark,
                        isSel     ? styles.selected : '',
                        isTarget && !isCapture ? styles.legalDot  : '',
                        isCapture              ? styles.legalRing : '',
                        kingCheck              ? styles.inCheck   : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => selectSquare(row, col)}
                    >
                      {piece && (
                        <span className={`${styles.piece} ${piece.color === 'white' ? styles.wp : styles.bp}`}>
                          {SYMBOLS[piece.color][piece.type]}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <div className={styles.files}>
              {FILES.map(f => <span key={f} className={styles.fileLabel}>{f}</span>)}
            </div>
            {/* white's bar — pieces black has lost (white captured) */}
            <PlayerBar
              captured={capturedByWhite}
              capturedColor="black"
              advantage={advantage > 0 ? advantage : 0}
            />
          </div>
        </div>

        {/* promotion picker */}
        {promo && (
          <div className={styles.promoOverlay}>
            <div className={styles.promoBox}>
              <p className={styles.promoLabel}>Promote to:</p>
              <div className={styles.promoChoices}>
                {PROMO_PIECES.map(pt => (
                  <button key={pt} className={styles.promoBtn} onClick={() => handlePromotion(pt)}>
                    {SYMBOLS[game.turn][pt]}
                    <span className={styles.promoBtnLabel}>
                      {pt === 'Q' ? 'Queen' : pt === 'R' ? 'Rook' : pt === 'B' ? 'Bishop' : 'Knight'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* game over overlay */}
        {over && (
          <div className={styles.gameOverlay}>
            <p className={styles.overlayTitle}>
              {game.status === 'checkmate' ? 'CHECKMATE' : 'STALEMATE'}
            </p>
            <p className={styles.overlaySub}>
              {game.status === 'checkmate'
                ? `${winner === 'white' ? 'White' : 'Black'} wins!`
                : 'The game is a draw.'}
            </p>
            <button className={styles.overlayBtn} onClick={handleNewGame}>New Game</button>
          </div>
        )}
      </div>
    </div>
  );
}
