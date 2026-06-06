import { useMemo, useState, useEffect } from 'react';
import { factions, type FactionId } from '../../themes/factions';
import { useThemeStore } from '../../store/useThemeStore';
import { useWindowStore } from '../../store/useWindowStore';
import styles from './AptitudeTest.module.css';

interface Answer {
  text: string;
  faction: FactionId;
}
interface Question {
  text: string;
  answers: Answer[];
}

const QUESTIONS: Question[] = [
  {
    text: 'A fire breaks out in a crowded building. What do you do?',
    answers: [
      { text: 'Rush in and pull people to safety — hesitation costs lives.', faction: 'dauntless' },
      { text: 'Calculate the safest route and direct the crowd systematically.', faction: 'erudite' },
      { text: 'Stay calm and help reassure the panicking people around you.', faction: 'amity' },
      { text: 'Make sure every last person gets out before you do.', faction: 'abnegation' },
      { text: 'Shout exactly how dangerous it is so people can decide for themselves.', faction: 'candor' },
    ],
  },
  {
    text: 'You discover your closest friend has been lying to you. What do you do?',
    answers: [
      { text: 'Confront them directly, no matter how uncomfortable it gets.', faction: 'dauntless' },
      { text: 'Analyze their motive — there must be a logical reason behind it.', faction: 'erudite' },
      { text: 'Try to understand their feelings before reacting.', faction: 'amity' },
      { text: 'Set aside your own hurt and ask what they needed from you.', faction: 'abnegation' },
      { text: 'Tell them plainly how their lie made you feel — no softening it.', faction: 'candor' },
    ],
  },
  {
    text: 'If you could master one thing, what would it be?',
    answers: [
      { text: 'Combat and physical endurance.', faction: 'dauntless' },
      { text: 'Every field of knowledge available to humanity.', faction: 'erudite' },
      { text: 'The art of bringing divided people together.', faction: 'amity' },
      { text: 'Living without needing anything for yourself.', faction: 'abnegation' },
      { text: 'Reading people so precisely you always know the truth.', faction: 'candor' },
    ],
  },
  {
    text: 'Your city is under threat. What role do you take?',
    answers: [
      { text: 'Fight on the front lines — that is where it matters.', faction: 'dauntless' },
      { text: 'Devise the strategy. Brute force without intelligence is wasted.', faction: 'erudite' },
      { text: 'Negotiate a peaceful resolution before a single shot is fired.', faction: 'amity' },
      { text: 'Shield others with your own body if that is what it takes.', faction: 'abnegation' },
      { text: 'Expose the full truth about the threat to everyone immediately.', faction: 'candor' },
    ],
  },
  {
    text: 'What do people most often misunderstand about you?',
    answers: [
      { text: 'They call it recklessness. You call it not letting fear win.', faction: 'dauntless' },
      { text: 'They think you are cold. You just trust facts over feelings.', faction: 'erudite' },
      { text: 'They think you are naive. You just refuse to stop hoping.', faction: 'amity' },
      { text: 'They think you have no ambition. You just do not need the credit.', faction: 'abnegation' },
      { text: 'They think you are cruel. You just refuse to lie to spare feelings.', faction: 'candor' },
    ],
  },
];

const FACTION_DESCRIPTIONS: Record<FactionId, string> = {
  dauntless:  'Brave. Loyal. Fearless in the face of danger. You act when others hesitate, and you would rather face the worst than live in comfortable safety.',
  erudite:    'Intelligent. Analytical. Driven by an unquenchable need to understand. You believe knowledge is the only weapon that truly matters.',
  amity:      'Peaceful. Compassionate. Devoted to harmony above all. The world is fractured — and you are one of the few who still believes it can be healed.',
  abnegation: 'Selfless. Humble. Invisible. Your strength is the kind that asks for nothing in return, and that makes it the rarest kind of all.',
  candor:     'Honest. Direct. Incorruptible. The truth, no matter how sharp, is your compass — and you would rather wound someone with it than comfort them with a lie.',
  divergent:  'You belong to no single faction — because you belong to all of them. In a world that demands conformity, you are the anomaly. They will call it a threat. You will call it freedom.',
};

const BASE_FACTIONS: FactionId[] = ['dauntless', 'erudite', 'amity', 'abnegation', 'candor'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Phase = 'intro' | 'question' | 'processing' | 'result';

export function AptitudeTestApp() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({
    dauntless: 0, erudite: 0, amity: 0, abnegation: 0, candor: 0,
  });
  const [result, setResult] = useState<FactionId | null>(null);
  const setFaction = useThemeStore((s) => s.setFaction);
  const windows = useWindowStore((s) => s.windows);
  const closeWindow = useWindowStore((s) => s.closeWindow);

  const shuffledQuestions = useMemo(
    () => QUESTIONS.map((q) => ({ ...q, answers: shuffle(q.answers) })),
    [],
  );

  useEffect(() => {
    if (phase !== 'processing') return;
    const id = setTimeout(() => {
      const topScore   = Math.max(...Object.values(scores));
      const topFactions = BASE_FACTIONS.filter((f) => scores[f] === topScore);
      const winner     = topFactions.length >= 2
        ? 'divergent'
        : topFactions[0];
      setResult(winner);
      setPhase('result');
    }, 2200);
    return () => clearTimeout(id);
  }, [phase, scores]);

  function handleAnswer(faction: FactionId) {
    const next = { ...scores, [faction]: scores[faction] + 1 };
    setScores(next);
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ((q) => q + 1);
    } else {
      setPhase('processing');
    }
  }

  function reset() {
    setPhase('intro');
    setCurrentQ(0);
    setScores({ dauntless: 0, erudite: 0, amity: 0, abnegation: 0, candor: 0  });
    setResult(null);
  }

  if (phase === 'intro') {
    return (
      <div className={styles.container}>
        <div className={styles.intro}>
          <div className={styles.introSymbol}>⬡</div>
          <h1 className={styles.introTitle}>APTITUDE TEST</h1>
          <p className={styles.introSub}>
            This test will determine the faction to which your character is best suited.
            Answer honestly. There are no wrong answers.
          </p>
          <p className={styles.introWarning}>
            Your theme will change based on the result.
          </p>
          <button className={styles.beginBtn} onClick={() => setPhase('question')}>
            BEGIN TEST
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'question') {
    const q = shuffledQuestions[currentQ];
    return (
      <div className={styles.container}>
        <div className={styles.progress}>
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`${styles.pip} ${i <= currentQ ? styles.pipFilled : ''}`}
            />
          ))}
        </div>
        <div className={styles.questionWrap}>
          <p className={styles.qNum}>Question {currentQ + 1} of {QUESTIONS.length}</p>
          <p className={styles.qText}>{q.text}</p>
          <div className={styles.answers}>
            {q.answers.map((a, i) => (
              <button key={i} className={styles.answerBtn} onClick={() => handleAnswer(a.faction)}>
                {a.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'processing') {
    return (
      <div className={styles.container}>
        <div className={styles.processing}>
          <div className={styles.spinner} />
          <p className={styles.processingText}>Analyzing results…</p>
        </div>
      </div>
    );
  }

  if (phase === 'result' && result) {
    const faction = factions.find((f) => f.id === result)!;
    return (
      <div className={styles.container}>
        <div className={styles.result}>
          <p className={styles.resultLabel}>YOUR APTITUDE RESULT</p>
          <div className={styles.resultSymbol}>{faction.symbol}</div>
          <h2 className={styles.resultName} style={{ color: faction.color }}>
            {faction.name.toUpperCase()}
          </h2>
          <p className={styles.resultDesc}>{FACTION_DESCRIPTIONS[result]}</p>
          <div className={styles.resultActions}>
            <button
              className={styles.acceptBtn}
              style={{ '--faction-color': faction.color } as React.CSSProperties}
              onClick={() => {
                setFaction(result);
                const win = windows.find((w) => w.appId === 'aptitude-test');
                if (win) closeWindow(win.id);
              }}
            >
              ACCEPT YOUR FACTION
            </button>
            <button className={styles.retakeBtn} onClick={reset}>
              Retake
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
