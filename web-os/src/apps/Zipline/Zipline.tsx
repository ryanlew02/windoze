import { useCallback, useEffect, useRef, useState } from 'react';
import { useNotificationStore } from '../../store/useNotificationStore';
import styles from './Zipline.module.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const LANES    = 3;
const PX_FRAC  = 0.13;   // player x position as fraction of canvas width
const BASE_SPD = 240;    // px/s starting speed
const SPD_RAMP = 20;     // px/s added per second of play
const OBS_W    = 22;     // obstacle width
const PAD_FRAC = 0.2;    // top/bottom padding as fraction of canvas height
const HS_KEY   = 'zipline-highscore';

type Phase = 'idle' | 'playing' | 'dead';

interface Obs   { id: number; lane: number; x: number }
interface SLine { x: number; y: number; len: number; spd: number; a: number }
interface Bldg  { x: number; w: number; h: number }

// ── Helpers ───────────────────────────────────────────────────────────────────

function laneY(h: number, lane: number): number {
  const pad = h * PAD_FRAC;
  return pad + (lane / (LANES - 1)) * (h - 2 * pad);
}

function makeSLines(count: number, w: number, h: number): SLine[] {
  return Array.from({ length: count }, () => ({
    x:   Math.random() * w,
    y:   Math.random() * h * 0.88,
    len: 20 + Math.random() * 70,
    spd: 160 + Math.random() * 280,
    a:   0.025 + Math.random() * 0.055,
  }));
}

function makeBuildings(totalW: number, h: number): Bldg[] {
  const out: Bldg[] = [];
  let x = 0;
  while (x < totalW) {
    const bw = 28 + Math.random() * 68;
    const bh = 28 + Math.random() * h * 0.42;
    out.push({ x, w: bw, h: bh });
    x += bw + 1 + Math.random() * 10;
  }
  return out;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ZiplineApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // All mutable game state lives in a ref so the animation loop never goes stale.
  const gs = useRef({
    phase:     'idle' as Phase,
    lane:      1,
    vy:        0,          // interpolated player y (visual)
    vyVel:     0,          // spring velocity for lane switching
    vyHistory: [] as number[],  // trail positions
    obstacles: [] as Obs[],
    slines:    [] as SLine[],
    buildings: [] as Bldg[],
    bgW:       0,          // total building strip width (2× canvas)
    bgOff:     0,          // current scroll offset
    score:     0,
    speed:     BASE_SPD,
    elapsed:   0,
    spawnTimer:1200,
    nextId:    0,
    hs:        parseInt(localStorage.getItem(HS_KEY) ?? '0'),
  });

  // Minimal React state — only what drives HTML overlay renders.
  const [phase, setPhase] = useState<Phase>('idle');
  const [score, setScore] = useState(0);
  const [hs,    setHs]    = useState(() => parseInt(localStorage.getItem(HS_KEY) ?? '0'));

  const rafId = useRef(0);
  const lastT = useRef(0);

  // ── World init ────────────────────────────────────────────────────────────

  function initWorld(w: number, h: number) {
    const s  = gs.current;
    const bw = w * 2;
    s.slines    = makeSLines(35, w, h);
    s.buildings = makeBuildings(bw, h);
    s.bgW       = bw;
    s.vy        = laneY(h, s.lane);
  }

  // ── Start / restart ───────────────────────────────────────────────────────

  function startGame() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const s  = gs.current;
    s.phase      = 'playing';
    s.lane       = 1;
    s.vy         = laneY(canvas.height, 1);
    s.vyVel      = 0;
    s.vyHistory  = [];
    s.obstacles  = [];
    s.score      = 0;
    s.speed      = BASE_SPD;
    s.elapsed    = 0;
    s.spawnTimer = 1200;
    s.nextId     = 0;
    lastT.current = 0;
    setPhase('playing');
    setScore(0);
  }

  // ── Input ─────────────────────────────────────────────────────────────────

  const handleKey = useCallback((e: KeyboardEvent) => {
    const s = gs.current;
    if (s.phase !== 'playing') {
      if (e.code === 'Space' || e.code === 'Enter') startGame();
      return;
    }
    if (e.code === 'ArrowUp'   || e.code === 'KeyW') {
      s.lane = Math.max(0, s.lane - 1);
      e.preventDefault();
    }
    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      s.lane = Math.min(LANES - 1, s.lane + 1);
      e.preventDefault();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const s = gs.current;
    if (s.phase !== 'playing') { startGame(); return; }
    const canvas = canvasRef.current!;
    const y = e.clientY - canvas.getBoundingClientRect().top;
    if (y < canvas.height / 2) s.lane = Math.max(0, s.lane - 1);
    else                       s.lane = Math.min(LANES - 1, s.lane + 1);
  }

  // ── Game loop ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const w   = canvas.offsetWidth  || 700;
      const h   = canvas.offsetHeight || 500;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      initWorld(w, h);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement ?? canvas);

    function spawnObs(w: number) {
      const s = gs.current;
      const lane = Math.floor(Math.random() * LANES);
      s.obstacles.push({ id: s.nextId++, lane, x: w + OBS_W });
      // After 10s, occasionally add a second obstacle staggered behind
      if (s.elapsed > 10 && Math.random() < 0.3) {
        const other = (lane + 1 + Math.floor(Math.random() * (LANES - 1))) % LANES;
        s.obstacles.push({
          id:   s.nextId++,
          lane: other,
          x:    w + OBS_W + 90 + Math.random() * 80,
        });
      }
    }

    function loop(ts: number) {
      if (!lastT.current) lastT.current = ts;
      const dt = Math.min((ts - lastT.current) / 1000, 0.05);
      lastT.current = ts;

      const s = gs.current;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      // ── Update ──────────────────────────────────────────────────────────
      if (s.phase === 'playing') {
        s.elapsed    += dt;
        s.speed       = BASE_SPD + SPD_RAMP * s.elapsed;
        s.score       = Math.floor(s.elapsed * 10);
        s.bgOff       = (s.bgOff + s.speed * 0.25 * dt) % s.bgW;

        // Spring-damper lane switch (slight overshoot and settle)
        const ty          = laneY(h, s.lane);
        const springForce = (ty - s.vy) * 360;
        const dampForce   = -s.vyVel * 22;
        s.vyVel += (springForce + dampForce) * dt;
        s.vy    += s.vyVel * dt;

        // Trail history (ring buffer, 5 frames)
        s.vyHistory.push(s.vy);
        if (s.vyHistory.length > 5) s.vyHistory.shift();

        // Speed lines drift
        for (const sl of s.slines) {
          sl.x -= sl.spd * dt;
          if (sl.x < -sl.len) sl.x = w + 10;
        }

        // Spawn
        s.spawnTimer -= dt * 1000;
        if (s.spawnTimer <= 0) {
          spawnObs(w);
          s.spawnTimer = Math.max(450, 1350 - s.elapsed * 22);
        }

        // Move & cull obstacles
        for (const o of s.obstacles) o.x -= s.speed * dt;
        s.obstacles = s.obstacles.filter(o => o.x > -OBS_W - 10);

        // Collision
        const laneGap = (h - 2 * h * PAD_FRAC) / (LANES - 1);
        for (const o of s.obstacles) {
          const oy = laneY(h, o.lane);
          if (
            Math.abs(o.x - w * PX_FRAC) < OBS_W / 2 + 7 &&
            Math.abs(oy - s.vy)         < laneGap * 0.42
          ) {
            s.phase = 'dead';
            if (s.score > s.hs) {
              s.hs = s.score;
              localStorage.setItem(HS_KEY, String(s.score));
              setHs(s.score);
              useNotificationStore.getState().push({
                icon:    '🚠',
                title:   'NEW BEST',
                message: `You survived ${s.score}m on the Zip Line.`,
              });
            }
            setPhase('dead');
            setScore(s.score);
            break;
          }
        }
      }

      // ── Draw ────────────────────────────────────────────────────────────

      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#02020a');
      sky.addColorStop(1, '#0c0812');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Scrolling city silhouette
      for (const b of s.buildings) {
        const bx = ((b.x - s.bgOff) % s.bgW + s.bgW) % s.bgW - 40;
        ctx.fillStyle = '#0c0c14';
        ctx.fillRect(bx, h - b.h, b.w, b.h);
        // Dim window grid
        ctx.fillStyle = 'rgba(220, 160, 60, 0.07)';
        for (let wy = h - b.h + 10; wy < h - 8; wy += 14) {
          for (let wx = bx + 5; wx < bx + b.w - 5; wx += 10) {
            ctx.fillRect(wx, wy, 5, 7);
          }
        }
      }

      // Speed lines (motion blur feel)
      if (s.phase === 'playing') {
        for (const sl of s.slines) {
          ctx.strokeStyle = `rgba(232,72,48,${sl.a})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(sl.x, sl.y);
          ctx.lineTo(sl.x + sl.len, sl.y);
          ctx.stroke();
        }
      }

      // Zipline cables
      for (let l = 0; l < LANES; l++) {
        const ly     = laneY(h, l);
        const active = s.phase !== 'idle' && l === s.lane;
        ctx.strokeStyle = active ? 'rgba(232,72,48,0.6)' : 'rgba(200,170,140,0.18)';
        ctx.lineWidth   = active ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(0, ly);
        ctx.lineTo(w, ly);
        ctx.stroke();
      }

      // Obstacles (structural pylons)
      const usable = h - 2 * h * PAD_FRAC;
      const obsH   = usable * 0.72;
      for (const o of s.obstacles) {
        const oy = laneY(h, o.lane);
        // Drop shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(o.x - OBS_W / 2 + 3, oy - obsH / 2 + 3, OBS_W, obsH);
        // Body
        ctx.fillStyle = '#202020';
        ctx.fillRect(o.x - OBS_W / 2, oy - obsH / 2, OBS_W, obsH);
        // Left highlight
        ctx.fillStyle = '#2e2e2e';
        ctx.fillRect(o.x - OBS_W / 2, oy - obsH / 2, 3, obsH);
        // Danger stripe at cable crossing
        ctx.fillStyle = 'rgba(232,72,48,0.9)';
        ctx.fillRect(o.x - OBS_W / 2, oy - 7, OBS_W, 14);
        // Secondary stripes
        ctx.fillStyle = 'rgba(232,72,48,0.35)';
        ctx.fillRect(o.x - OBS_W / 2, oy - obsH * 0.3 - 4, OBS_W, 8);
        ctx.fillRect(o.x - OBS_W / 2, oy + obsH * 0.3 - 4, OBS_W, 8);
        // Bolt studs
        ctx.fillStyle = '#444';
        ctx.beginPath(); ctx.arc(o.x, oy - 14, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(o.x, oy + 14, 3, 0, Math.PI * 2); ctx.fill();
      }

      // Player (only when game is started)
      if (s.phase !== 'idle') {
        const px   = w * PX_FRAC;
        const py   = s.vy;
        // Tilt angle: pivot from grip point, leans into direction of travel
        const tilt = Math.max(-0.22, Math.min(0.22, s.vyVel * 0.00020));

        // Motion trail — fading ghost bodies along previous positions
        if (s.vyHistory.length > 1) {
          for (let i = 0; i < s.vyHistory.length - 1; i++) {
            const hy    = s.vyHistory[i];
            const alpha = ((i + 1) / s.vyHistory.length) * 0.14;
            ctx.save();
            ctx.translate(px, hy);
            ctx.rotate(tilt);
            ctx.globalAlpha = alpha;
            // Simplified ghost: just body + head blob
            ctx.fillStyle = '#e84830';
            ctx.fillRect(-6, 12, 12, 16);
            ctx.beginPath();
            ctx.arc(0, 8, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.restore();
          }
        }

        // Player — pivot at grip so body swings from the handle
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(tilt);

        // Grip handle (stays at pivot, above player)
        ctx.fillStyle = '#aaa';
        ctx.fillRect(-10, -3, 20, 5);

        // Arms
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(-4, 2); ctx.lineTo(-4, 12); ctx.stroke();
        ctx.beginPath(); ctx.moveTo( 4, 2); ctx.lineTo( 4, 12); ctx.stroke();

        // Head
        ctx.fillStyle = '#d4b896';
        ctx.beginPath();
        ctx.arc(0, 8, 6.5, 0, Math.PI * 2);
        ctx.fill();

        // Body — Dauntless jacket with red stripe
        ctx.fillStyle = '#181818';
        ctx.fillRect(-7, 12, 14, 17);
        ctx.fillStyle = '#e84830';
        ctx.fillRect(-7, 12, 3, 17);

        // Legs — kick outward when swinging fast
        const kick = tilt * 10;
        ctx.strokeStyle = '#181818';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-3, 29); ctx.lineTo(-5 - kick, 41); ctx.stroke();
        ctx.beginPath(); ctx.moveTo( 3, 29); ctx.lineTo( 5 - kick, 41); ctx.stroke();
        // Boot tips
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-5 - kick, 41); ctx.lineTo(-9 - kick, 41); ctx.stroke();
        ctx.beginPath(); ctx.moveTo( 5 - kick, 41); ctx.lineTo( 9 - kick, 41); ctx.stroke();

        ctx.restore();
      }

      // Score HUD (in-canvas)
      if (s.phase === 'playing') {
        // Current distance — top right
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        roundRect(ctx, w - 142, 12, 130, 42, 6);
        ctx.fill();

        ctx.fillStyle = 'rgba(232,72,48,0.75)';
        ctx.font = '700 9px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('DISTANCE', w - 14, 30);

        ctx.fillStyle = '#f0ddd0';
        ctx.font = '700 18px monospace';
        ctx.fillText(`${s.score}m`, w - 14, 48);

        // Best — top left
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        roundRect(ctx, 12, 12, 120, 42, 6);
        ctx.fill();

        ctx.fillStyle = 'rgba(232,72,48,0.75)';
        ctx.font = '700 9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('YOUR BEST', 22, 30);

        ctx.fillStyle = '#f0ddd0';
        ctx.font = '700 18px monospace';
        ctx.fillText(`${s.hs}m`, 22, 48);

        ctx.textAlign = 'left';
      }

      rafId.current = requestAnimationFrame(loop);
    }

    rafId.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId.current);
      ro.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} onClick={handleClick} />

      {phase === 'idle' && (
        <div className={styles.overlay}>
          <p className={styles.title}>ZIP LINE</p>
          <p className={styles.sub}>Ride the Dauntless cable. Dodge the pylons.</p>
          <div className={styles.controls}>
            <span className={styles.key}>↑ / W</span><span className={styles.hint}>lane up</span>
            <span className={styles.key}>↓ / S</span><span className={styles.hint}>lane down</span>
          </div>
          {hs > 0 && <p className={styles.hiScore}>BEST &nbsp;{hs}m</p>}
          <p className={styles.prompt}>PRESS SPACE OR CLICK TO START</p>
        </div>
      )}

      {phase === 'dead' && (
        <div className={styles.overlay}>
          <p className={styles.dead}>YOU HIT A PYLON</p>
          <p className={styles.scoreDisplay}>{score}m</p>
          {score > 0 && score >= hs && <p className={styles.newBest}>NEW BEST</p>}
          <p className={styles.prompt}>PRESS SPACE OR CLICK TO RETRY</p>
        </div>
      )}
    </div>
  );
}
