import { useEffect, useRef, useState } from 'react';
import { useLockStore } from '../../store/useLockStore';
import styles from './LockScreen.module.css';

export function LockScreen() {
  const { unlock, checkPassword } = useLockStore();
  const [input, setInput]         = useState('');
  const [error, setError]         = useState(false);
  const [exiting, setExiting]     = useState(false);
  const [time, setTime]           = useState(new Date());
  const [showReset, setShowReset] = useState(false);
  const inputRef                  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (checkPassword(input)) {
      setExiting(true);
      setTimeout(unlock, 600);
    } else {
      setError(true);
      setInput('');
      setTimeout(() => setError(false), 600);
    }
  }

  return (
    <div className={`${styles.screen} ${exiting ? styles.exit : ''}`}>
      <div className={styles.bg} />

      <div className={styles.panel}>
        <div className={styles.clock}>
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className={styles.date}>
          {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>

        <div className={styles.divider} />

        <p className={styles.label}>FACTION ACCESS TERMINAL</p>
        <p className={styles.sublabel}>Enter access code to continue</p>
        <p className={styles.hint}>Default code: insurgent</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            ref={inputRef}
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={`${styles.input} ${error ? styles.shake : ''}`}
            placeholder="access code"
            autoComplete="off"
            spellCheck={false}
          />
          {error && <p className={styles.error}>ACCESS DENIED</p>}
          <button type="submit" className={styles.btn}>AUTHENTICATE</button>
        </form>

        <button
          className={styles.forgotBtn}
          onClick={() => setShowReset((v) => !v)}
        >
          {showReset ? 'hide' : 'Forgot code?'}
        </button>

        {showReset && (
          <div className={styles.resetBox}>
            <p className={styles.resetTitle}>RESET TO DEFAULT</p>
            <ol className={styles.resetSteps}>
              <li>Press <kbd className={styles.kbd}>F12</kbd> to open DevTools</li>
              <li>Go to the <strong>Console</strong> tab</li>
              <li>Paste and run:<br />
                <code className={styles.code}>localStorage.removeItem('os-password')</code>
              </li>
              <li>Refresh the page <kbd className={styles.kbd}>F5</kbd></li>
              <li>Default code is <strong>insurgent</strong></li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
