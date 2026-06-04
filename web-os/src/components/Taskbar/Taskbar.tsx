import { useState, useEffect, useRef } from 'react';
import { useWindowStore } from '../../store/useWindowStore';
import { StartMenu } from '../StartMenu/StartMenu';
import { FactionPicker } from '../FactionPicker/FactionPicker';
import styles from './Taskbar.module.css';

export function Taskbar() {
  const [startOpen, setStartOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const windows = useWindowStore((s) => s.windows);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setStartOpen(false);
      }
    }
    if (startOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [startOpen]);

  function handleTaskClick(winId: string, isMinimized: boolean, isFocused: boolean) {
    if (isFocused && !isMinimized) {
      minimizeWindow(winId);
    } else {
      focusWindow(winId);
    }
  }

  return (
    <div className={styles.taskbar}>
      <div ref={menuRef}>
        {startOpen && <StartMenu onClose={() => setStartOpen(false)} />}
        <button
          className={`${styles.startBtn} ${startOpen ? styles.active : ''}`}
          onClick={() => setStartOpen((v) => !v)}
        >
          ⊞
        </button>
      </div>

      <div className={styles.taskList}>
        {windows.map((w) => (
          <button
            key={w.id}
            className={`${styles.task} ${w.isFocused && !w.isMinimized ? styles.taskFocused : ''}`}
            onClick={() => handleTaskClick(w.id, w.isMinimized, w.isFocused)}
            title={w.title}
          >
            <span>{w.icon}</span>
            <span className={styles.taskTitle}>{w.title}</span>
          </button>
        ))}
      </div>

      <FactionPicker />

      <div className={styles.clock}>
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}
