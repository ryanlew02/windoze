import { useEffect, useRef, useState } from 'react';
import { useLockStore } from '../../store/useLockStore';
import chicagoBg from '../../assets/chicagobackground.avif';
import styles from './LockScreen.module.css';

export function LockScreen() {
  const { unlock, checkPassword } = useLockStore();
  const [input, setInput]         = useState('');
  const [error, setError]         = useState(false);
  const [exiting, setExiting]     = useState(false);
  const [time, setTime]           = useState(new Date());
  const [showReset, setShowReset]           = useState(false);
  const [factoryConfirm, setFactoryConfirm] = useState(false);
  const inputRef                            = useRef<HTMLInputElement>(null);

  function handleFactoryReset() {
    if (!factoryConfirm) { setFactoryConfirm(true); return; }
    localStorage.clear();
    location.reload();
  }

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
      <div className={styles.bg} style={{ backgroundImage: `url(${chicagoBg})` }} />

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
            <p className={styles.resetTitle}>NO ACCESS?</p>
            <p className={styles.resetDesc}>
              If you've lost your access code, the only way back in is a factory reset.
              This will wipe all data and restore the OS to its default state.
            </p>
            <button
              className={`${styles.factoryBtn} ${factoryConfirm ? styles.factoryBtnConfirm : ''}`}
              onClick={handleFactoryReset}
              onBlur={() => setFactoryConfirm(false)}
            >
              {factoryConfirm ? '⚠ Confirm — this cannot be undone' : 'Factory Reset'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
