import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './FearSimulation.module.css';

const DURATION = 6;

/* ── Fear definitions ─────────────────────────────────────────── */

type Mechanic = 'chase' | 'mash' | 'targets' | 'choice' | 'shrink' | 'type' | 'flash';

interface Fear {
  id: string;
  symbol: string;
  name: string;
  description: string;
  mechanic: Mechanic;
  action?: string;
  falseAction?: string;
  mashCount?: number;
  targetCount?: number;
  typeWord?: string;
}

const FEARS: Fear[] = [
  {
    id: 'fire',
    symbol: '🔥',
    name: 'FIRE',
    description: 'The flames close in from every side. You cannot stop. You cannot go back. The only way out is through.',
    mechanic: 'chase',
    action: 'WALK THROUGH',
  },
  {
    id: 'burial',
    symbol: '⬛',
    name: 'BURIAL',
    description: 'The ceiling lowers. The walls press inward. Every second you do not fight, you lose more space.',
    mechanic: 'mash',
    action: 'PUSH BACK',
    mashCount: 20,
  },
  {
    id: 'crows',
    symbol: '🐦',
    name: 'CROWS',
    description: 'They are everywhere. Wings and beaks and claws. You cannot outrun them. Strike before they reach you.',
    mechanic: 'targets',
    action: 'STRIKE',
    targetCount: 9,
  },
  {
    id: 'execution',
    symbol: '🔫',
    name: 'EXECUTION',
    description: 'A weapon is placed in your hand. They tell you it is necessary. They will keep telling you until you do it.',
    mechanic: 'choice',
    action: 'REFUSE',
    falseAction: 'PULL THE TRIGGER',
  },
  {
    id: 'drowning',
    symbol: '🌊',
    name: 'DROWNING',
    description: 'The surface recedes. Your lungs have already begun to negotiate. Your only chance is shrinking by the second.',
    mechanic: 'shrink',
    action: 'PUSH UP',
  },
  {
    id: 'serum',
    symbol: '💉',
    name: 'CONTROL',
    description: 'Your thoughts slow. Your will bends. Something else is beginning to make your decisions. Prove it wrong.',
    mechanic: 'type',
    typeWord: 'FACTIONLESS',
  },
  {
    id: 'exposure',
    symbol: '👁',
    name: 'EXPOSURE',
    description: 'They are coming. They know what you are. Your window to escape is a fraction of a second. Do not miss it.',
    mechanic: 'flash',
    action: 'DISAPPEAR',
  },
];

const TITLES = [
  { min: 7, title: 'DIVERGENT',          sub: 'Fear cannot be simulated in the truly free mind. You are the anomaly.' },
  { min: 6, title: 'DAUNTLESS',          sub: 'You are nearly without fear. That is the most dangerous thing to be.' },
  { min: 4, title: 'DAUNTLESS INITIATE', sub: 'Courage was your first instinct. Hold onto that.' },
  { min: 2, title: 'TRANSFER',           sub: 'You are still learning to face what terrifies you. Keep going.' },
  { min: 1, title: 'STIFF',              sub: 'Your fears have the upper hand today. Come back when you are ready.' },
  { min: 0, title: 'FACTIONLESS',        sub: 'You could not face a single fear. That is not something we can fix for you.' },
];

type Phase   = 'intro' | 'fear' | 'transition' | 'result';
type Outcome = 'conquered' | 'failed';

/* ── Mechanic props ───────────────────────────────────────────── */

interface ChallengeProps {
  fear: Fear;
  timerKey: number;
  onConquer: () => void;
  onFail: () => void;
}

/* ── CHASE: button runs away ──────────────────────────────────── */
function ChaseChallenge({ fear, onConquer }: ChallengeProps) {
  const [pos, setPos] = useState({ x: 45, y: 45 });

  useEffect(() => {
    const id = setInterval(() => {
      setPos({ x: 8 + Math.random() * 78, y: 8 + Math.random() * 78 });
    }, 650);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.chaseArea}>
      <button
        className={styles.chaseBtn}
        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        onClick={onConquer}
      >
        {fear.action}
      </button>
      <p className={styles.mechanicHint}>The exit keeps moving. Find it.</p>
    </div>
  );
}

/* ── MASH: click many times ───────────────────────────────────── */
function MashChallenge({ fear, onConquer }: ChallengeProps) {
  const target       = fear.mashCount ?? 20;
  const [count, setCount] = useState(0);
  const lastClickRef = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() - lastClickRef.current > 700) {
        setCount((c) => Math.max(0, c - 3));
      }
    }, 250);
    return () => clearInterval(id);
  }, []);

  function handleClick() {
    lastClickRef.current = Date.now();
    setCount((c) => {
      const next = c + 1;
      if (next >= target) onConquer();
      return next;
    });
  }

  const pct = Math.min((count / target) * 100, 100);

  return (
    <div className={styles.mashArea}>
      <div className={styles.mashTrack}>
        <div className={styles.mashBar} style={{ width: `${pct}%` }} />
      </div>
      <p className={styles.mashCount}>{count} / {target}</p>
      <button className={styles.mashBtn} onClick={handleClick}>{fear.action}</button>
    </div>
  );
}

/* ── TARGETS: click floating crows ───────────────────────────── */
interface Target { id: number; x: number; y: number }

function TargetsChallenge({ fear, onConquer }: ChallengeProps) {
  const needed    = fear.targetCount ?? 6;
  const [targets, setTargets] = useState<Target[]>([]);
  const hitRef    = useRef(0);
  const idCounter = useRef(0);

  useEffect(() => {
    function spawnOne() {
      const id = ++idCounter.current;
      setTargets((t) => [...t, { id, x: 8 + Math.random() * 80, y: 10 + Math.random() * 78 }]);
      setTimeout(() => setTargets((t) => t.filter((tgt) => tgt.id !== id)), 850);
    }
    spawnOne();
    const id = setInterval(spawnOne, 600);
    return () => clearInterval(id);
  }, []);

  function hit(id: number) {
    setTargets((t) => t.filter((tgt) => tgt.id !== id));
    hitRef.current++;
    if (hitRef.current >= needed) onConquer();
  }

  return (
    <div className={styles.targetsArea}>
      <p className={styles.targetScore}>{Math.min(hitRef.current, needed)} / {needed}</p>
      {targets.map((t) => (
        <button key={t.id} className={styles.targetBtn}
          style={{ left: `${t.x}%`, top: `${t.y}%` }}
          onClick={() => hit(t.id)}
        >🐦</button>
      ))}
    </div>
  );
}

/* ── CHOICE: two buttons that swap, one wrong ─────────────────── */
function ChoiceChallenge({ fear, onConquer, onFail }: ChallengeProps) {
  const [swapped, setSwapped] = useState(false);
  const [flash,   setFlash]   = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setSwapped((s) => !s);
      setFlash(true);
      setTimeout(() => setFlash(false), 90);
    }, 700);
    return () => clearInterval(id);
  }, []);

  const correct = (
    <button key="correct" className={styles.choiceCorrect} onClick={onConquer}>
      {fear.action}
    </button>
  );
  const wrong = (
    <button key="wrong" className={styles.choiceWrong} onClick={onFail}>
      {fear.falseAction}
    </button>
  );

  return (
    <div className={`${styles.choiceArea} ${flash ? styles.choiceFlash : ''}`}>
      <p className={styles.mechanicHint}>Choose carefully. They swap.</p>
      <div className={styles.choiceBtns}>
        {swapped ? [wrong, correct] : [correct, wrong]}
      </div>
    </div>
  );
}

/* ── SHRINK: button shrinks to nothing ───────────────────────── */
function ShrinkChallenge({ fear, timerKey, onConquer }: ChallengeProps) {
  return (
    <div className={styles.shrinkArea}>
      <p className={styles.mechanicHint}>Click it before it's gone.</p>
      <button
        key={timerKey}
        className={styles.shrinkBtn}
        style={{ '--shrink-dur': `${DURATION}s` } as React.CSSProperties}
        onClick={onConquer}
      >
        {fear.action}
      </button>
    </div>
  );
}

/* ── TYPE: type the word ──────────────────────────────────────── */
function TypeChallenge({ fear, onConquer }: ChallengeProps) {
  const word = fear.typeWord ?? 'FACTIONLESS';
  const [val, setVal] = useState('');

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const upper = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
    setVal(upper);
    if (upper === word) onConquer();
  }

  return (
    <div className={styles.typeArea}>
      <div className={styles.typeWord}>
        {word.split('').map((ch, i) => (
          <span
            key={i}
            className={`${styles.typeLetter}
              ${i < val.length ? (val[i] === ch ? styles.typeCorrect : styles.typeWrong) : ''}`}
          >{ch}</span>
        ))}
      </div>
      <input
        className={styles.typeInput}
        value={val}
        onChange={onChange}
        maxLength={word.length}
        autoFocus
        autoComplete="off"
        spellCheck={false}
        placeholder="type here"
      />
    </div>
  );
}

/* ── FLASH: button only appears briefly ──────────────────────── */
function FlashChallenge({ fear, onConquer }: ChallengeProps) {
  const [visible, setVisible] = useState(false);
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    function cycle() {
      if (!activeRef.current) return;
      const showDelay = 2000 + Math.random() * 1500;
      setTimeout(() => {
        if (!activeRef.current) return;
        setVisible(true);
        setTimeout(() => {
          if (!activeRef.current) return;
          setVisible(false);
          cycle();
        }, 260);
      }, showDelay);
    }
    cycle();
    return () => { activeRef.current = false; };
  }, []);

  return (
    <div className={styles.flashArea}>
      {visible
        ? <button className={styles.flashBtn} onClick={() => { activeRef.current = false; onConquer(); }}>{fear.action}</button>
        : <p className={styles.flashWaiting}>· · ·</p>
      }
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────── */

export function FearSimulationApp() {
  const [phase,    setPhase]    = useState<Phase>('intro');
  const [idx,      setIdx]      = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [outcome,  setOutcome]  = useState<Outcome | null>(null);
  const [results,  setResults]  = useState<Outcome[]>([]);
  const [timerKey, setTimerKey] = useState(0);

  const resolvedRef = useRef(false);
  const resultsRef  = useRef<Outcome[]>([]);

  function startSimulation() {
    resolvedRef.current  = false;
    resultsRef.current   = [];
    setPhase('fear');
    setIdx(0);
    setTimeLeft(DURATION);
    setOutcome(null);
    setResults([]);
    setTimerKey((k) => k + 1);
  }

  const resolve = useCallback((result: Outcome) => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    setOutcome(result);

    const updated = [...resultsRef.current, result];
    resultsRef.current = updated;
    setResults(updated);

    setTimeout(() => {
      setIdx((i) => {
        const next = i + 1;
        if (next >= FEARS.length) {
          setPhase('result');
        } else {
          setPhase('transition');
          setTimeout(() => {
            resolvedRef.current = false;
            setTimeLeft(DURATION);
            setOutcome(null);
            setTimerKey((k) => k + 1);
            setPhase('fear');
          }, 700);
        }
        return next;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (phase !== 'fear') return;
    const failId = setTimeout(() => resolve('failed'), DURATION * 1000);
    const tickId = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => { clearTimeout(failId); clearInterval(tickId); };
  }, [phase, timerKey, resolve]);

  const score = results.filter((r) => r === 'conquered').length;
  const titleEntry = TITLES.find((t) => score >= t.min)!;

  /* Intro */
  if (phase === 'intro') return (
    <div className={styles.wrap}>
      <div className={styles.intro}>
        <p className={styles.introAlert}>⚠ DAUNTLESS INITIATION — CLASSIFIED PROTOCOL</p>
        <h1 className={styles.introTitle}>FEAR SIMULATION</h1>
        <p className={styles.introBody}>
          You will face {FEARS.length} simulated scenarios.<br />
          Each lasts {DURATION} seconds.<br />
          Every fear is different. Every mechanic changes.<br />
          Do not expect the same challenge twice.
        </p>
        <p className={styles.introWarning}>Results are recorded. Failure is permanent.</p>
        <button className={styles.startBtn} onClick={startSimulation}>ENTER SIMULATION</button>
      </div>
    </div>
  );

  /* Transition */
  if (phase === 'transition') return <div className={styles.wrap} />;

  /* Fear */
  if (phase === 'fear') {
    const fear = FEARS[idx % FEARS.length];
    const shaking = timeLeft <= 3 && !outcome;
    const challengeProps: ChallengeProps = { fear, timerKey, onConquer: () => resolve('conquered'), onFail: () => resolve('failed') };

    return (
      <div className={styles.wrap}>
        <div className={styles.timerTrack}>
          <div key={timerKey} className={`${styles.timerBar} ${timeLeft <= 3 ? styles.timerDanger : ''}`} />
        </div>

        <div className={styles.fearMeta}>
          <span className={styles.fearCount}>{(idx % FEARS.length) + 1} / {FEARS.length}</span>
          <span className={`${styles.timeNum} ${timeLeft <= 3 ? styles.timerDanger : ''}`}>{timeLeft}s</span>
        </div>

        <div className={`${styles.fearInfo} ${shaking ? styles.shake : ''} ${outcome === 'conquered' ? styles.flashGreen : outcome === 'failed' ? styles.flashRed : ''}`}>
          <span className={styles.fearSymbol}>{fear.symbol}</span>
          <h2 className={styles.fearName}>{fear.name}</h2>
          <p className={styles.fearDesc}>{fear.description}</p>
        </div>

        {outcome ? (
          <div className={`${styles.outcomeLabel} ${outcome === 'conquered' ? styles.outcomeCon : styles.outcomeFail}`}>
            {outcome === 'conquered' ? 'FEAR CONQUERED' : 'SIMULATION FAILED'}
          </div>
        ) : (
          <div className={styles.challengeArea}>
            {fear.mechanic === 'chase'   && <ChaseChallenge   {...challengeProps} />}
            {fear.mechanic === 'mash'    && <MashChallenge    {...challengeProps} />}
            {fear.mechanic === 'targets' && <TargetsChallenge {...challengeProps} />}
            {fear.mechanic === 'choice'  && <ChoiceChallenge  {...challengeProps} />}
            {fear.mechanic === 'shrink'  && <ShrinkChallenge  {...challengeProps} />}
            {fear.mechanic === 'type'    && <TypeChallenge    {...challengeProps} />}
            {fear.mechanic === 'flash'   && <FlashChallenge   {...challengeProps} />}
          </div>
        )}
      </div>
    );
  }

  /* Results */
  return (
    <div className={styles.wrap}>
      <div className={styles.results}>
        <p className={styles.resultsTag}>SIMULATION COMPLETE</p>
        <div className={styles.scoreRow}>
          <span className={styles.scoreBig}>{score}</span>
          <span className={styles.scoreOf}>/ {FEARS.length}</span>
        </div>
        <h2 className={styles.resultTitle}>{titleEntry.title}</h2>
        <p className={styles.resultSub}>{titleEntry.sub}</p>
        <div className={styles.fearList}>
          {FEARS.map((f, i) => (
            <div key={f.id} className={styles.fearRow}>
              <span className={styles.frSymbol}>{f.symbol}</span>
              <span className={styles.frName}>{f.name}</span>
              <span className={`${styles.frResult} ${results[i] === 'conquered' ? styles.con : styles.fail}`}>
                {results[i] === 'conquered' ? '✓ CONQUERED' : '✕ FAILED'}
              </span>
            </div>
          ))}
        </div>
        <button className={styles.againBtn} onClick={startSimulation}>RUN AGAIN</button>
      </div>
    </div>
  );
}
