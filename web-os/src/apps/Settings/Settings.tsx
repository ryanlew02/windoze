import { useState } from 'react';
import { useLockStore } from '../../store/useLockStore';
import { useThemeStore } from '../../store/useThemeStore';
import { factions } from '../../themes/factions';
import styles from './Settings.module.css';

type Section = 'security' | 'appearance';

export function SettingsApp() {
  const [section, setSection] = useState<Section>('security');

  const changePassword                  = useLockStore((s) => s.changePassword);
  const { factionId, setFaction }       = useThemeStore();

  const [current, setCurrent]   = useState('');
  const [next, setNext]         = useState('');
  const [confirm, setConfirm]   = useState('');
  const [status, setStatus]     = useState<'idle' | 'success' | 'wrong' | 'mismatch' | 'empty'>('idle');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!current || !next || !confirm) { setStatus('empty');    return; }
    if (next !== confirm)              { setStatus('mismatch'); return; }
    const ok = changePassword(current, next);
    if (ok) {
      setStatus('success');
      setCurrent(''); setNext(''); setConfirm('');
    } else {
      setStatus('wrong');
      setCurrent('');
    }
    setTimeout(() => setStatus('idle'), 3000);
  }

  const messages: Record<typeof status, string> = {
    idle:     '',
    success:  '✓ Access code updated.',
    wrong:    '✕ Current code is incorrect.',
    mismatch: '✕ New codes do not match.',
    empty:    '✕ All fields are required.',
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <button
          className={`${styles.navItem} ${section === 'security'   ? styles.navActive : ''}`}
          onClick={() => setSection('security')}
        >
          <span>🔒</span> Security
        </button>
        <button
          className={`${styles.navItem} ${section === 'appearance' ? styles.navActive : ''}`}
          onClick={() => setSection('appearance')}
        >
          <span>🎨</span> Appearance
        </button>
      </div>

      <div className={styles.content}>

        {section === 'security' && (
          <>
            <h2 className={styles.sectionTitle}>Security</h2>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>🔑</span>
                <div>
                  <p className={styles.cardTitle}>Change Access Code</p>
                  <p className={styles.cardSub}>Your code is stored locally on this device.</p>
                </div>
              </div>

              <form className={styles.form} onSubmit={handleSubmit}>
                <label className={styles.label}>Current code</label>
                <input
                  type="password"
                  className={styles.input}
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter current code"
                />
                <label className={styles.label}>New code</label>
                <input
                  type="password"
                  className={styles.input}
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Enter new code"
                />
                <label className={styles.label}>Confirm new code</label>
                <input
                  type="password"
                  className={styles.input}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Repeat new code"
                />
                {status !== 'idle' && (
                  <p className={`${styles.msg} ${status === 'success' ? styles.msgOk : styles.msgErr}`}>
                    {messages[status]}
                  </p>
                )}
                <button type="submit" className={styles.btn}>Update Code</button>
              </form>
            </div>

            <div className={styles.hint}>
              <span className={styles.hintIcon}>ⓘ</span>
              Default code is <code className={styles.code}>insurgent</code>. Resetting local storage restores it.
            </div>
          </>
        )}

        {section === 'appearance' && (
          <>
            <h2 className={styles.sectionTitle}>Appearance</h2>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>🏳</span>
                <div>
                  <p className={styles.cardTitle}>Faction Theme</p>
                  <p className={styles.cardSub}>Choose the faction that defines your desktop.</p>
                </div>
              </div>

              <div className={styles.themeGrid}>
                {factions.map((f) => (
                  <button
                    key={f.id}
                    className={`${styles.themeCard} ${f.id === factionId ? styles.themeActive : ''}`}
                    style={{ '--f-color': f.color } as React.CSSProperties}
                    onClick={() => setFaction(f.id)}
                  >
                    <span className={styles.themeSymbol}>{f.symbol}</span>
                    <span className={styles.themeName}>{f.name}</span>
                    {f.id === factionId && <span className={styles.themeCheck}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
