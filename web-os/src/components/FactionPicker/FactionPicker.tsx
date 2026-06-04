import { useEffect, useRef, useState } from 'react';
import { factions } from '../../themes/factions';
import { useThemeStore } from '../../store/useThemeStore';
import styles from './FactionPicker.module.css';

export function FactionPicker() {
  const [open, setOpen] = useState(false);
  const factionId = useThemeStore((s) => s.factionId);
  const setFaction = useThemeStore((s) => s.setFaction);
  const ref = useRef<HTMLDivElement>(null);
  const current = factions.find((f) => f.id === factionId)!;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className={styles.wrapper} ref={ref}>
      {open && (
        <div className={styles.popup}>
          {factions.map((f) => (
            <button
              key={f.id}
              className={`${styles.option} ${f.id === factionId ? styles.active : ''}`}
              onClick={() => { setFaction(f.id); setOpen(false); }}
            >
              <span className={styles.swatch} style={{ background: f.color }} />
              <span className={styles.symbol}>{f.symbol}</span>
              <span className={styles.name}>{f.name}</span>
            </button>
          ))}
        </div>
      )}
      <button
        className={`${styles.btn} ${open ? styles.btnOpen : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.btnSymbol}>{current.symbol}</span>
        <span className={styles.btnName}>{current.name}</span>
      </button>
    </div>
  );
}
