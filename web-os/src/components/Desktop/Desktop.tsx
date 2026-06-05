import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useWindowStore } from '../../store/useWindowStore';
import { useIconStore } from '../../store/useIconStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useDesktopItemStore, type DesktopItem } from '../../store/useDesktopItemStore';
import { useDraggable } from '../../hooks/useDraggable';
import { AppIcon } from '../AppIcon/AppIcon';
import { Window } from '../Window/Window';
import type { AppDefinition } from '../../types/index';
import dauntlessBg  from '../../assets/dauntless_bg.png';
import eruditeBg    from '../../assets/erudite_bg.png';
import amityBg      from '../../assets/amity_bg.png';
import abnegationBg from '../../assets/abnegation_bg.png';
import candorBg     from '../../assets/candor_bg.png';
import divergentBg  from '../../assets/divergent_bg.png';
import styles from './Desktop.module.css';

const GRID   = 96;
const ICON_W = 80;
const ICON_H = 80;
const snap   = (v: number) => Math.round(v / GRID) * GRID;

const factionBg: Record<string, string> = {
  dauntless: dauntlessBg, erudite: eruditeBg, amity: amityBg,
  abnegation: abnegationBg, candor: candorBg, divergent: divergentBg,
};

interface Rect { x: number; y: number; w: number; h: number }

function normalizeRect(ax: number, ay: number, bx: number, by: number): Rect {
  return { x: Math.min(ax, bx), y: Math.min(ay, by), w: Math.abs(bx - ax), h: Math.abs(by - ay) };
}

function rectsIntersect(ix: number, iy: number, rx: number, ry: number, rw: number, rh: number) {
  return ix < rx + rw && ix + ICON_W > rx && iy < ry + rh && iy + ICON_H > ry;
}

type DesktopCtxMenu = { x: number; y: number };
type IconCtxMenu    = { x: number; y: number; id: string; kind: 'app' | 'item'; currentName: string };
type Renaming       = { id: string; kind: 'app' | 'item'; value: string };

// --- App icon ---

interface DraggableIconProps {
  app: AppDefinition;
  label: string;
  x: number;
  y: number;
  selected: boolean;
  renaming: boolean;
  renameValue: string;
  renameRef: React.RefObject<HTMLInputElement | null>;
  onMove: (x: number, y: number) => void;
  onDrop: (x: number, y: number) => void;
  onSelect: () => void;
  onLaunch: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onRenameChange: (v: string) => void;
  onRenameConfirm: () => void;
  onRenameCancel: () => void;
}

function DraggableIcon({
  app, label, x, y, selected, renaming, renameValue, renameRef,
  onMove, onDrop, onSelect, onLaunch, onContextMenu,
  onRenameChange, onRenameConfirm, onRenameCancel,
}: DraggableIconProps) {
  const { onMouseDown } = useDraggable(onMove, onDrop);
  return (
    <div
      className={styles.iconWrapper}
      style={{ left: x, top: y }}
      onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, x, y); }}
      onClick={onSelect}
      onContextMenu={(e) => { e.stopPropagation(); e.preventDefault(); onContextMenu(e); }}
    >
      {renaming ? (
        <div className={styles.floatingIcon}>
          <span className={styles.floatingEmoji}>{app.icon}</span>
          <input
            ref={renameRef}
            className={styles.renameInput}
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            onBlur={onRenameConfirm}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRenameConfirm();
              if (e.key === 'Escape') onRenameCancel();
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : (
        <AppIcon app={{ ...app, title: label }} onClick={onLaunch} selected={selected} />
      )}
    </div>
  );
}

// --- Desktop item (user-created file/folder) ---

interface DraggableDesktopItemProps {
  item: DesktopItem;
  renaming: boolean;
  renameValue: string;
  renameRef: React.RefObject<HTMLInputElement | null>;
  onMove: (x: number, y: number) => void;
  onDrop: (x: number, y: number) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onRenameChange: (v: string) => void;
  onRenameConfirm: () => void;
  onRenameCancel: () => void;
}

function DraggableDesktopItem({
  item, renaming, renameValue, renameRef,
  onMove, onDrop, onContextMenu,
  onRenameChange, onRenameConfirm, onRenameCancel,
}: DraggableDesktopItemProps) {
  const { onMouseDown } = useDraggable(onMove, onDrop);
  const icon = item.type === 'folder' ? '📁' : '📄';
  return (
    <div
      className={styles.iconWrapper}
      style={{ left: item.x, top: item.y }}
      onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, item.x, item.y); }}
      onContextMenu={(e) => { e.stopPropagation(); e.preventDefault(); onContextMenu(e); }}
    >
      <div className={styles.floatingIcon}>
        <span className={styles.floatingEmoji}>{icon}</span>
        {renaming ? (
          <input
            ref={renameRef}
            className={styles.renameInput}
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            onBlur={onRenameConfirm}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRenameConfirm();
              if (e.key === 'Escape') onRenameCancel();
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={styles.floatingLabel}>{item.name}</span>
        )}
      </div>
    </div>
  );
}

// --- Desktop ---

export function Desktop() {
  const apps                              = useAppStore((s) => s.apps);
  const { windows, openWindow }          = useWindowStore();
  const { positions, labels, setPosition, setLabel } = useIconStore();
  const factionId                         = useThemeStore((s) => s.factionId);
  const { items: desktopItems, addItem, removeItem, renameItem, moveItem } = useDesktopItemStore();

  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
  const [marquee, setMarquee]           = useState<Rect | null>(null);
  const [desktopMenu, setDesktopMenu]   = useState<DesktopCtxMenu | null>(null);
  const [iconMenu, setIconMenu]         = useState<IconCtxMenu | null>(null);
  const [renaming, setRenaming]         = useState<Renaming | null>(null);

  const desktopRef  = useRef<HTMLDivElement>(null);
  const marqueeStart = useRef<{ x: number; y: number } | null>(null);
  const renameRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) renameRef.current?.focus();
  }, [renaming]);

  function closeMenus() { setDesktopMenu(null); setIconMenu(null); }

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
        width: app.defaultWidth ?? 520,
        height: app.defaultHeight ?? 400,
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
    if (e.button !== 0) return;
    if (e.target !== e.currentTarget) return;
    closeMenus();
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

  function handleDesktopContextMenu(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    closeMenus();
    setRenaming(null);
    setDesktopMenu({ x: e.clientX, y: e.clientY });
  }

  function handleIconContextMenu(e: React.MouseEvent, id: string, kind: 'app' | 'item', currentName: string) {
    closeMenus();
    setIconMenu({ x: e.clientX, y: e.clientY, id, kind, currentName });
  }

  function startRename(id: string, kind: 'app' | 'item', currentName: string) {
    setRenaming({ id, kind, value: currentName });
    closeMenus();
  }

  function confirmRename() {
    if (!renaming) return;
    const name = renaming.value.trim();
    if (name) {
      if (renaming.kind === 'app') setLabel(renaming.id, name);
      else renameItem(renaming.id, name);
    }
    setRenaming(null);
  }

  function cancelRename() { setRenaming(null); }

  function createDesktopItem(type: 'folder' | 'file') {
    if (!desktopMenu) return;
    const name = type === 'folder' ? 'New Folder' : 'New File';
    const x = snap(desktopMenu.x);
    const y = snap(desktopMenu.y);
    addItem(name, type, x, y);
    closeMenus();
    // immediately enter rename for the new item — find it after state settles
    // we'll trigger by matching the next item's id via a brief timeout
    setTimeout(() => {
      const { items } = useDesktopItemStore.getState();
      const last = items[items.length - 1];
      if (last) setRenaming({ id: last.id, kind: 'item', value: last.name });
    }, 0);
  }

  const bgImage = `url(${factionBg[factionId] ?? '/src/assets/chicagobackground.avif'})`;

  return (
    <div
      ref={desktopRef}
      className={styles.desktop}
      style={{ backgroundImage: bgImage }}
      onMouseDown={handleDesktopMouseDown}
      onContextMenu={handleDesktopContextMenu}
      onClick={() => { closeMenus(); }}
    >
      {apps.map((app, index) => {
        const pos         = getPos(app.id, index);
        const label       = labels[app.id] ?? app.title;
        const isRenaming  = renaming?.id === app.id && renaming.kind === 'app';
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
            label={label}
            x={pos.x}
            y={pos.y}
            selected={selectedIds.has(app.id)}
            renaming={!!isRenaming}
            renameValue={isRenaming ? renaming!.value : ''}
            renameRef={renameRef}
            onMove={(x, y) => isGroupDrag ? moveGroup(x, y, false) : setPosition(app.id, x, y)}
            onDrop={(x, y) => isGroupDrag ? moveGroup(x, y, true)  : setPosition(app.id, snap(x), snap(y))}
            onSelect={() => setSelectedIds(new Set([app.id]))}
            onLaunch={() => launch(app.id)}
            onContextMenu={(e) => handleIconContextMenu(e, app.id, 'app', label)}
            onRenameChange={(v) => setRenaming((r) => r ? { ...r, value: v } : null)}
            onRenameConfirm={confirmRename}
            onRenameCancel={cancelRename}
          />
        );
      })}

      {desktopItems.map((item) => {
        const isRenaming = renaming?.id === item.id && renaming.kind === 'item';
        return (
          <DraggableDesktopItem
            key={item.id}
            item={item}
            renaming={!!isRenaming}
            renameValue={isRenaming ? renaming!.value : ''}
            renameRef={renameRef}
            onMove={(x, y) => moveItem(item.id, x, y)}
            onDrop={(x, y) => moveItem(item.id, snap(x), snap(y))}
            onContextMenu={(e) => handleIconContextMenu(e, item.id, 'item', item.name)}
            onRenameChange={(v) => setRenaming((r) => r ? { ...r, value: v } : null)}
            onRenameConfirm={confirmRename}
            onRenameCancel={cancelRename}
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

      {desktopMenu && (
        <div
          className={styles.contextMenu}
          style={{ left: desktopMenu.x, top: desktopMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className={styles.menuItem} onClick={() => createDesktopItem('folder')}>📁 New Folder</button>
          <button className={styles.menuItem} onClick={() => createDesktopItem('file')}>📄 New File</button>
        </div>
      )}

      {iconMenu && (
        <div
          className={styles.contextMenu}
          style={{ left: iconMenu.x, top: iconMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className={styles.menuItem} onClick={() => startRename(iconMenu.id, iconMenu.kind, iconMenu.currentName)}>
            Rename
          </button>
          {iconMenu.kind === 'item' && (
            <button className={styles.menuItem} onClick={() => { removeItem(iconMenu.id); closeMenus(); }}>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
