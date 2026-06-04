import { useCallback, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useWindowStore } from '../../store/useWindowStore';
import { useIconStore } from '../../store/useIconStore';
import { useDraggable } from '../../hooks/useDraggable';
import { AppIcon } from '../AppIcon/AppIcon';
import { Window } from '../Window/Window';
import type { AppDefinition } from '../../types/index';
import styles from './Desktop.module.css';

const GRID    = 96;
const ICON_W  = 80;
const ICON_H  = 80;
const snap    = (v: number) => Math.round(v / GRID) * GRID;

interface Rect { x: number; y: number; w: number; h: number }

function normalizeRect(ax: number, ay: number, bx: number, by: number): Rect {
  return { x: Math.min(ax, bx), y: Math.min(ay, by), w: Math.abs(bx - ax), h: Math.abs(by - ay) };
}

function rectsIntersect(ix: number, iy: number, rx: number, ry: number, rw: number, rh: number) {
  return ix < rx + rw && ix + ICON_W > rx && iy < ry + rh && iy + ICON_H > ry;
}

interface DraggableIconProps {
  app: AppDefinition;
  x: number;
  y: number;
  selected: boolean;
  onMove: (x: number, y: number) => void;
  onDrop: (x: number, y: number) => void;
  onSelect: () => void;
  onLaunch: () => void;
}

function DraggableIcon({ app, x, y, selected, onMove, onDrop, onSelect, onLaunch }: DraggableIconProps) {
  const { onMouseDown } = useDraggable(onMove, onDrop);
  return (
    <div
      className={styles.iconWrapper}
      style={{ left: x, top: y }}
      onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, x, y); }}
      onClick={onSelect}
    >
      <AppIcon app={app} onClick={onLaunch} selected={selected} />
    </div>
  );
}

export function Desktop() {
  const apps                    = useAppStore((s) => s.apps);
  const { windows, openWindow } = useWindowStore();
  const { positions, setPosition } = useIconStore();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [marquee, setMarquee]         = useState<Rect | null>(null);

  const desktopRef   = useRef<HTMLDivElement>(null);
  const marqueeStart = useRef<{ x: number; y: number } | null>(null);

  const launch = useCallback(
    (appId: string) => {
      const app = apps.find((a) => a.id === appId);
      if (!app) return;
      openWindow({
        id: `${appId}-${Date.now()}`,
        appId: app.id,
        title: app.title,
        icon: app.icon,
        x: 100 + Math.random() * 120,
        y: 60 + Math.random() * 80,
        width: 520,
        height: 400,
        isMinimized: false,
        isMaximized: false,
      });
    },
    [apps, openWindow],
  );

  function getPos(appId: string, index: number) {
    return positions[appId] ?? { x: 0, y: index * GRID };
  }

  function handleDesktopMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    const bounds = desktopRef.current!.getBoundingClientRect();
    const sx = e.clientX - bounds.left;
    const sy = e.clientY - bounds.top;
    marqueeStart.current = { x: sx, y: sy };
    setSelectedIds(new Set());
    setMarquee(null);

    function onMouseMove(ev: MouseEvent) {
      const start = marqueeStart.current!;
      const ex = ev.clientX - bounds.left;
      const ey = ev.clientY - bounds.top;
      const rect = normalizeRect(start.x, start.y, ex, ey);
      setMarquee(rect);
      const hit = new Set(
        apps
          .filter((app, i) => {
            const p = getPos(app.id, i);
            return rectsIntersect(p.x, p.y, rect.x, rect.y, rect.w, rect.h);
          })
          .map((a) => a.id),
      );
      setSelectedIds(hit);
    }

    function onMouseUp() {
      marqueeStart.current = null;
      setMarquee(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  return (
    <div
      ref={desktopRef}
      className={styles.desktop}
      onMouseDown={handleDesktopMouseDown}
    >
      {apps.map((app, index) => {
        const pos = getPos(app.id, index);
        const isGroupDrag = selectedIds.has(app.id) && selectedIds.size > 1;

        function moveGroup(nx: number, ny: number, finalSnap: boolean) {
          const dx = nx - pos.x;
          const dy = ny - pos.y;
          selectedIds.forEach((id) => {
            const i = apps.findIndex((a) => a.id === id);
            const p = getPos(id, i);
            const tx = p.x + dx;
            const ty = p.y + dy;
            setPosition(id, finalSnap ? snap(tx) : tx, finalSnap ? snap(ty) : ty);
          });
        }

        return (
          <DraggableIcon
            key={app.id}
            app={app}
            x={pos.x}
            y={pos.y}
            selected={selectedIds.has(app.id)}
            onMove={(x, y) => isGroupDrag ? moveGroup(x, y, false) : setPosition(app.id, x, y)}
            onDrop={(x, y) => isGroupDrag ? moveGroup(x, y, true)  : setPosition(app.id, snap(x), snap(y))}
            onSelect={() => setSelectedIds(new Set([app.id]))}
            onLaunch={() => launch(app.id)}
          />
        );
      })}

      {windows.map((win) => {
        const app = apps.find((a) => a.id === win.appId);
        if (!app) return null;
        const AppComponent = app.component;
        return (
          <Window key={win.id} win={win}>
            <AppComponent />
          </Window>
        );
      })}

      {marquee && marquee.w > 4 && marquee.h > 4 && (
        <div
          className={styles.marquee}
          style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }}
        />
      )}
    </div>
  );
}
