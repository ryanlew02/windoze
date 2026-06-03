import { useCallback } from 'react';
import { useWindowStore } from '../../store/useWindowStore';
import { useDraggable } from '../../hooks/useDraggable';
import type { WindowState } from '../../types';
import styles from './Window.module.css';

interface Props {
  win: WindowState;
  children: React.ReactNode;
}

export function Window({ win, children }: Props) {
  const { closeWindow, focusWindow, minimizeWindow, toggleMaximize, moveWindow } =
    useWindowStore();

  const handleMove = useCallback(
    (x: number, y: number) => moveWindow(win.id, x, y),
    [win.id, moveWindow]
  );

  const { onMouseDown } = useDraggable(handleMove);

  if (win.isMinimized) return null;

  const style = win.isMaximized
    ? { top: 0, left: 0, width: '100%', height: '100%', zIndex: win.zIndex }
    : { top: win.y, left: win.x, width: win.width, height: win.height, zIndex: win.zIndex };

  return (
    <div
      className={`${styles.window} ${win.isFocused ? styles.focused : ''}`}
      style={style}
      onMouseDown={() => focusWindow(win.id)}
    >
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
          <button className={styles.close} onClick={() => closeWindow(win.id)} title="Close">✕</button>
        </div>
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
