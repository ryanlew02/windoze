import { useEffect, useState } from 'react';
import styles from './BootScreen.module.css';

const BOOT_MS = 3400;
const FADE_MS = 700;

const LOG_LINES = [
  'Initializing system core...',
  'Loading faction protocols...',
  'Verifying allegiance records...',
  'Establishing secure uplink...',
];

const LOG_DELAYS = ['0.9s', '1.3s', '1.7s', '2.1s'];

interface Props { onDone: () => void }

export function BootScreen({ onDone }: Props) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), BOOT_MS);
    const doneTimer = setTimeout(onDone, BOOT_MS + FADE_MS);
    return () => { clearTimeout(exitTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  return (
    <div className={`${styles.screen} ${exiting ? styles.exiting : ''}`}>
      <div className={styles.scanlines} />

      <div className={styles.content}>
        <div className={styles.symbol}>◈</div>
        <h1 className={styles.title}>DIVERGE OS</h1>
        <p className={styles.subtitle}>FACTION ACCESS TERMINAL</p>

        <div className={styles.divider} />

        <div className={styles.log}>
          {LOG_LINES.map((line, i) => (
            <p
              key={i}
              className={styles.logLine}
              style={{ '--d': LOG_DELAYS[i] } as React.CSSProperties}
            >
              <span className={styles.prompt}>&gt;</span>{line}
            </p>
          ))}
        </div>

        <div className={styles.progressWrap}>
          <div className={styles.progressBar} />
        </div>

        <p className={styles.ready}>SYSTEM READY — WELCOME, CITIZEN.</p>
      </div>
    </div>
  );
}
