import { useState, useEffect, useRef } from 'react';
import { useWindowStore } from '../../store/useWindowStore';
import { useAppStore } from '../../store/useAppStore';
import { usePinnedStore } from '../../store/usePinnedStore';
import { StartMenu } from '../StartMenu/StartMenu';
import { SearchPanel } from '../SearchPanel/SearchPanel';
import { FactionPicker } from '../FactionPicker/FactionPicker';
import { FactionBroadcast } from '../FactionBroadcast/FactionBroadcast';
import styles from './Taskbar.module.css';

interface CtxState {
  kind: 'window' | 'pinned';
  winId: string;
  appId: string;
  x: number;
}

export function Taskbar() {
  const [startOpen, setStartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const [ctx, setCtx] = useState<CtxState | null>(null);

  const windows = useWindowStore((s) => s.windows);
  const { focusWindow, minimizeWindow, closeWindow, openWindow } = useWindowStore();
  const apps = useAppStore((s) => s.apps);
  const { pinnedIds, pin, unpin } = usePinnedStore();

  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setStartOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      setCtx(null);
    }
    document.addEventListener('mousedown', handleMouseDown, true);
    return () => document.removeEventListener('mousedown', handleMouseDown, true);
  }, []);

  function handleTaskClick(winId: string, isMinimized: boolean, isFocused: boolean) {
    if (isFocused && !isMinimized) {
      minimizeWindow(winId);
    } else {
      focusWindow(winId);
    }
  }

  function openCtx(e: React.MouseEvent, state: Omit<CtxState, 'x'>) {
    e.preventDefault();
    e.stopPropagation();
    setCtx({ ...state, x: Math.min(e.clientX, window.innerWidth - 192) });
  }

  function launchApp(appId: string) {
    const app = apps.find((a) => a.id === appId);
    if (!app) return;
    openWindow({
      id: `${appId}-${Date.now()}`,
      appId: app.id,
      title: app.title,
      icon: app.icon,
      x: 80 + Math.random() * 120,
      y: 60 + Math.random() * 80,
      width: app.defaultWidth ?? 500,
      height: app.defaultHeight ?? 380,
      isMinimized: false,
      isMaximized: false,
    });
  }

  const runningAppIds = new Set(windows.map((w) => w.appId));
  const pinnedOnly = pinnedIds
    .filter((id) => !runningAppIds.has(id))
    .map((id) => apps.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  return (
    <div className={styles.taskbar}>
      <div ref={menuRef}>
        {startOpen && <StartMenu onClose={() => setStartOpen(false)} />}
        <button
          className={`${styles.startBtn} ${startOpen ? styles.active : ''}`}
          onClick={() => { setStartOpen((v) => !v); setSearchOpen(false); }}
          title="DivergeOS"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="8.2" stroke="currentColor" strokeWidth="1.3" opacity="0.55"/>
            <path
              d="M10 15 L10 10 L6 6 M10 10 L14 6 M10 10 L10 5.2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div ref={searchRef} className={styles.searchWrapper}>
        {searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} />}
        <button
          className={`${styles.searchBtn} ${searchOpen ? styles.active : ''}`}
          onClick={() => { setSearchOpen((v) => !v); setStartOpen(false); }}
          title="Search"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11 L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className={styles.taskList}>
        {pinnedOnly.map((app) => (
          <button
            key={`pin-${app.id}`}
            className={styles.taskPinned}
            onClick={() => launchApp(app.id)}
            onContextMenu={(e) => openCtx(e, { kind: 'pinned', winId: '', appId: app.id })}
            title={app.title}
          >
            <span>{app.icon}</span>
            <span className={styles.taskTitle}>{app.title}</span>
          </button>
        ))}

        {windows.map((w) => (
          <button
            key={w.id}
            className={`${styles.task} ${w.isFocused && !w.isMinimized ? styles.taskFocused : ''}`}
            onClick={() => handleTaskClick(w.id, w.isMinimized, w.isFocused)}
            onContextMenu={(e) => openCtx(e, { kind: 'window', winId: w.id, appId: w.appId })}
            title={w.title}
          >
            <span>{w.icon}</span>
            <span className={styles.taskTitle}>{w.title}</span>
            {pinnedIds.includes(w.appId) && <span className={styles.pinDot} />}
          </button>
        ))}
      </div>

      <FactionBroadcast />

      <FactionPicker />

      <div className={styles.clock}>
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>

      {ctx && (
        <div
          className={styles.ctxMenu}
          style={{ left: ctx.x }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {ctx.kind === 'window' ? (
            <>
              <button
                className={styles.ctxItem}
                onClick={() => { minimizeWindow(ctx.winId); setCtx(null); }}
              >
                Minimize
              </button>
              <button
                className={styles.ctxItem}
                onClick={() => { closeWindow(ctx.winId); setCtx(null); }}
              >
                Close
              </button>
              <div className={styles.ctxSep} />
              {pinnedIds.includes(ctx.appId) ? (
                <button
                  className={styles.ctxItem}
                  onClick={() => { unpin(ctx.appId); setCtx(null); }}
                >
                  Unpin from Taskbar
                </button>
              ) : (
                <button
                  className={styles.ctxItem}
                  onClick={() => { pin(ctx.appId); setCtx(null); }}
                >
                  Pin to Taskbar
                </button>
              )}
            </>
          ) : (
            <>
              <button
                className={styles.ctxItem}
                onClick={() => { launchApp(ctx.appId); setCtx(null); }}
              >
                Open
              </button>
              <div className={styles.ctxSep} />
              <button
                className={styles.ctxItem}
                onClick={() => { unpin(ctx.appId); setCtx(null); }}
              >
                Unpin from Taskbar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
