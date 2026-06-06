import { useCallback } from 'react';
import { useWindowStore } from '../../store/useWindowStore';
import { useDraggable } from '../../hooks/useDraggable';
import { useResizable, type ResizeDir } from '../../hooks/useResizable';
import type { WindowState } from '../../types';
import { WindowErrorBoundary } from './WindowErrorBoundary';
import { playWindowClose } from '../../audio/sounds';
import { playSound } from '../../store/useSoundStore';
import styles from './Window.module.css';

interface Props {
  win: WindowState;
  children: React.ReactNode;
}

export function Window({ win, children }: Props) {
  const { closeWindow, removeWindow, focusWindow, minimizeWindow, toggleMaximize, moveWindow, resizeMoveWindow } =
    useWindowStore();

  const handleMove = useCallback(
    (x: number, y: number) => moveWindow(win.id, x, y),
    [win.id, moveWindow],
  );

  const handleResize = useCallback(
    (x: number, y: number, w: number, h: number) => resizeMoveWindow(win.id, x, y, w, h),
    [win.id, resizeMoveWindow],
  );

  const { onMouseDown } = useDraggable(handleMove);
  const { onMouseDown: onResizeMouseDown } = useResizable(handleResize);

  const dirs: ResizeDir[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

  if (win.isMinimized) return null;

  const style = win.isMaximized
    ? { top: 0, left: 0, width: '100%', height: '100%', zIndex: win.zIndex }
    : { top: win.y, left: win.x, width: win.width, height: win.height, zIndex: win.zIndex };

  const windowClass = [
    styles.window,
    win.isFocused ? styles.focused : '',
    win.appId === 'terminal' ? styles.transparent : '',
    win.isClosing ? styles.closing : styles.opening,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={windowClass}
      style={style}
      onMouseDown={() => focusWindow(win.id)}
      onAnimationEnd={() => {
        if (win.isClosing) removeWindow(win.id);
      }}
    >
      {!win.isMaximized && dirs.map((dir) => (
        <div
          key={dir}
          className={`${styles.handle} ${styles[`handle_${dir}`]}`}
          onMouseDown={(e) => onResizeMouseDown(e, dir, win.x, win.y, win.width, win.height)}
        />
      ))}
      <div
        className={styles.titlebar}
        onMouseDown={(e) => onMouseDown(e, win.x, win.y)}
        onDoubleClick={() => toggleMaximize(win.id)}
      >
        <span className={styles.icon}>{win.icon}</span>
        <span className={styles.title}>{win.title}</span>
        <div className={styles.controls}>
          <button onClick={() => minimizeWindow(win.id)} title="Minimize">─</button>
          <button onClick={() => toggleMaximize(win.id)} title="Maximize">
            {win.isMaximized ? '❐' : '□'}
          </button>
          <button className={styles.close} onClick={() => { playSound(playWindowClose); closeWindow(win.id); }} title="Close">✕</button>
        </div>
      </div>
      <div className={styles.content}>
        <WindowErrorBoundary>{children}</WindowErrorBoundary>
      </div>
    </div>
  );
}
