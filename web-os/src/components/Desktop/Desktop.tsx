import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useWindowStore } from '../../store/useWindowStore';
import { useIconStore } from '../../store/useIconStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useDesktopItemStore, type DesktopItem } from '../../store/useDesktopItemStore';
import { useViewStore, VIEW_CONFIG, type ViewScale } from '../../store/useViewStore';
import { useFsStore } from '../../store/useFsStore';
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

const COLS         = 2;
const DEFAULT_GRID = 96; // default positions are always in normal-scale pixels
const GRID_PAD_X   = 12; // left inset so icons don't sit flush with the screen edge
const GRID_PAD_Y   = 12; // top inset

/**
 * Finds the first unoccupied grid cell by scanning left-to-right, top-to-bottom.
 * Takes the current app icon snapped positions and desktop item positions as input.
 */
function findFreeDesktopPos(
  appPositions: { x: number; y: number }[],
  itemPositions: { x: number; y: number }[],
): { x: number; y: number } {
  const snap = (v: number) => Math.round((v - GRID_PAD_X) / DEFAULT_GRID) * DEFAULT_GRID + GRID_PAD_X;
  const occupied = new Set<string>();
  appPositions.forEach((p)  => occupied.add(`${snap(p.x)},${snap(p.y)}`));
  itemPositions.forEach((p) => occupied.add(`${snap(p.x)},${snap(p.y)}`));
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 20; col++) {
      const x = GRID_PAD_X + col * DEFAULT_GRID;
      const y = GRID_PAD_Y + row * DEFAULT_GRID;
      const key = `${snap(x)},${snap(y)}`;
      if (!occupied.has(key)) return { x, y };
    }
  }
  return { x: GRID_PAD_X, y: GRID_PAD_Y };
}

const factionBg: Record<string, string> = {
  dauntless: dauntlessBg, erudite: eruditeBg, amity: amityBg,
  abnegation: abnegationBg, candor: candorBg, divergent: divergentBg,
};

interface Rect { x: number; y: number; w: number; h: number }

function normalizeRect(ax: number, ay: number, bx: number, by: number): Rect {
  return { x: Math.min(ax, bx), y: Math.min(ay, by), w: Math.abs(bx - ax), h: Math.abs(by - ay) };
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
  onDragStart: () => void;
}

function DraggableIcon({
  app, label, x, y, selected, renaming, renameValue, renameRef,
  onMove, onDrop, onSelect, onLaunch, onContextMenu,
  onRenameChange, onRenameConfirm, onRenameCancel, onDragStart,
}: DraggableIconProps) {
  const { onMouseDown } = useDraggable(onMove, onDrop);
  return (
    <div
      className={styles.iconWrapper}
      style={{ left: x, top: y }}
      onMouseDown={(e) => { e.stopPropagation(); onDragStart(); onMouseDown(e, x, y); }}
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
  onOpen?: () => void;
  onDragStart: () => void;
}

function DraggableDesktopItem({
  item, renaming, renameValue, renameRef,
  onMove, onDrop, onContextMenu,
  onRenameChange, onRenameConfirm, onRenameCancel, onOpen, onDragStart,
}: DraggableDesktopItemProps) {
  const { onMouseDown } = useDraggable(onMove, onDrop);
  const icon = item.type === 'folder' ? '📁' : (item.fsPath !== undefined ? '📄' : '🗂️');
  return (
    <div
      className={styles.iconWrapper}
      style={{ left: item.x, top: item.y }}
      onMouseDown={(e) => { e.stopPropagation(); onDragStart(); onMouseDown(e, item.x, item.y); }}
      onDoubleClick={onOpen}
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

const VIEW_LABELS: Record<ViewScale, string> = {
  small:  'Small',
  normal: 'Normal',
  large:  'Large',
};

export function Desktop() {
  const apps                              = useAppStore((s) => s.apps);
  const sortedApps = useMemo(
    () => [...apps].sort((a, b) => a.title.localeCompare(b.title)),
    [apps],
  );
  const { windows, openWindow }          = useWindowStore();
  const { positions, labels, setPosition, setLabel } = useIconStore();
  const factionId                         = useThemeStore((s) => s.factionId);
  const { items: desktopItems, addItem, removeItem, renameItem, moveItem } = useDesktopItemStore();
  const { root } = useFsStore();
  const { scale, setScale }               = useViewStore();

  const { iconW: ICON_W, iconH: ICON_H, windowScale } = VIEW_CONFIG[scale];
  // Snap to the padded grid so default positions (GRID_PAD + n*DEFAULT_GRID) don't jump on first drag
  const snap = (v: number) => Math.round((v - GRID_PAD_X) / DEFAULT_GRID) * DEFAULT_GRID + GRID_PAD_X;

  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
  const [marquee, setMarquee]           = useState<Rect | null>(null);
  const [desktopMenu, setDesktopMenu]   = useState<DesktopCtxMenu | null>(null);
  const [iconMenu, setIconMenu]         = useState<IconCtxMenu | null>(null);
  const [renaming, setRenaming]         = useState<Renaming | null>(null);
  const [viewSubmenuOpen, setViewSubmenuOpen] = useState(false);

  const desktopRef   = useRef<HTMLDivElement>(null);
  const marqueeStart = useRef<{ x: number; y: number } | null>(null);
  const renameRef    = useRef<HTMLInputElement>(null);
  const preDragPos   = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (renaming) renameRef.current?.focus();
  }, [renaming]);

  // Sync the Desktop fs folder ↔ desktop item icons.
  // Runs whenever the filesystem changes so files added via Terminal or
  // Notepad "Save As → Desktop" automatically appear as icons.
  useEffect(() => {
    const desktopNode = root['Desktop'];
    if (!desktopNode || desktopNode.type !== 'folder') return;

    // Read fresh state to avoid stale closure — prevents infinite loops
    const currentItems = useDesktopItemStore.getState().items;

    // App icon positions for collision detection
    const sorted = [...useAppStore.getState().apps].sort((a, b) => a.title.localeCompare(b.title));
    const appPositions = sorted.map((app, i) => {
      const saved = useIconStore.getState().positions[app.id];
      return saved ?? { x: GRID_PAD_X + (i % COLS) * DEFAULT_GRID, y: GRID_PAD_Y + Math.floor(i / COLS) * DEFAULT_GRID };
    });

    // Add a desktop icon for any file in Desktop/ that doesn't have one yet
    Object.values(desktopNode.children).forEach((node) => {
      if (node.type !== 'file') return;
      const exists = currentItems.some(
        (item) => item.fsPath?.join('/') === 'Desktop' && item.name === node.name,
      );
      if (!exists) {
        const itemPositions = useDesktopItemStore.getState().items.map((i) => ({ x: i.x, y: i.y }));
        const pos = findFreeDesktopPos(appPositions, itemPositions);
        addItem(node.name, 'file', pos.x, pos.y, ['Desktop']);
      }
    });

    // Remove icons whose backing file was deleted
    currentItems
      .filter((item) => item.fsPath?.join('/') === 'Desktop')
      .forEach((item) => {
        if (!desktopNode.children[item.name]) removeItem(item.id);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root]);

  function closeMenus() {
    setDesktopMenu(null);
    setIconMenu(null);
    setViewSubmenuOpen(false);
  }

  const cssZoom = () => parseFloat(getComputedStyle(document.documentElement).zoom) || 1;

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
        width:  (app.defaultWidth  ?? 520) * windowScale,
        height: (app.defaultHeight ?? 400) * windowScale,
        isMinimized: false,
        isMaximized: false,
      });
    },
    [apps, openWindow, windowScale],
  );

  function getPos(appId: string, index: number) {
    return positions[appId] ?? {
      x: GRID_PAD_X + (index % COLS) * DEFAULT_GRID,
      y: GRID_PAD_Y + Math.floor(index / COLS) * DEFAULT_GRID,
    };
  }

  function snapPos(x: number, y: number) {
    const w = desktopRef.current?.clientWidth  ?? Infinity;
    const h = desktopRef.current?.clientHeight ?? Infinity;
    return {
      x: Math.max(0, Math.min(snap(x), w - ICON_W)),
      y: Math.max(0, Math.min(snap(y), h - ICON_H)),
    };
  }

  function isOccupied(x: number, y: number, excludeId: string): boolean {
    for (let i = 0; i < sortedApps.length; i++) {
      const a = sortedApps[i];
      if (a.id === excludeId) continue;
      const p = getPos(a.id, i);
      if (snap(p.x) === x && snap(p.y) === y) return true;
    }
    for (const item of desktopItems) {
      if (item.id === excludeId) continue;
      if (snap(item.x) === x && snap(item.y) === y) return true;
    }
    return false;
  }

  function rectsIntersect(ix: number, iy: number, rx: number, ry: number, rw: number, rh: number) {
    return ix < rx + rw && ix + ICON_W > rx && iy < ry + rh && iy + ICON_H > ry;
  }

  function handleDesktopMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    if (e.target !== e.currentTarget) return;
    closeMenus();
    const z = cssZoom();
    const bounds = desktopRef.current!.getBoundingClientRect();
    const sx = (e.clientX - bounds.left) / z;
    const sy = (e.clientY - bounds.top) / z;
    marqueeStart.current = { x: sx, y: sy };
    setSelectedIds(new Set());
    setMarquee(null);

    function onMouseMove(ev: MouseEvent) {
      const start = marqueeStart.current!;
      const ex = (ev.clientX - bounds.left) / z;
      const ey = (ev.clientY - bounds.top) / z;
      const rect = normalizeRect(start.x, start.y, ex, ey);
      setMarquee(rect);
      const hit = new Set(
        sortedApps
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
    const z = cssZoom();
    setDesktopMenu({ x: e.clientX / z, y: e.clientY / z });
  }

  function handleIconContextMenu(e: React.MouseEvent, id: string, kind: 'app' | 'item', currentName: string) {
    closeMenus();
    const z = cssZoom();
    setIconMenu({ x: e.clientX / z, y: e.clientY / z, id, kind, currentName });
  }

  function startRename(id: string, kind: 'app' | 'item', currentName: string) {
    setRenaming({ id, kind, value: currentName });
    closeMenus();
  }

  function confirmRename() {
    if (!renaming) return;
    const name = renaming.value.trim();
    if (name) {
      if (renaming.kind === 'app') {
        setLabel(renaming.id, name);
      } else {
        const item = desktopItems.find((i) => i.id === renaming.id);
        if (item?.fsPath !== undefined) {
          useFsStore.getState().renameNode(item.fsPath, item.name, name);
        }
        renameItem(renaming.id, name);
      }
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
    setTimeout(() => {
      const { items } = useDesktopItemStore.getState();
      const last = items[items.length - 1];
      if (last) setRenaming({ id: last.id, kind: 'item', value: last.name });
    }, 0);
  }

  function createTextDocument() {
    if (!desktopMenu) return;
    const name = 'New Text Document.txt';
    const x = snap(desktopMenu.x);
    const y = snap(desktopMenu.y);
    useFsStore.getState().writeFile([], name, '');
    addItem(name, 'file', x, y, []);
    closeMenus();
    setTimeout(() => {
      const { items } = useDesktopItemStore.getState();
      const last = items[items.length - 1];
      if (last) setRenaming({ id: last.id, kind: 'item', value: last.name.replace(/\.txt$/, '') });
    }, 0);
  }

  function openDesktopFile(item: DesktopItem) {
    if (item.type !== 'file' || item.fsPath === undefined) return;
    const notepadApp = apps.find((a) => a.id === 'notepad');
    if (!notepadApp) return;
    const fileKey = [...item.fsPath, item.name].join('/');
    openWindow({
      id:     `notepad:${fileKey}-${Date.now()}`,
      appId:  `notepad:${fileKey}`,
      title:  item.name,
      icon:   '📄',
      x:      100 + Math.random() * 120,
      y:      60  + Math.random() * 80,
      width:  (notepadApp.defaultWidth  ?? 560) * windowScale,
      height: (notepadApp.defaultHeight ?? 420) * windowScale,
      isMinimized: false,
      isMaximized: false,
      componentProps: { filePath: item.fsPath, fileName: item.name },
    });
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
      {sortedApps.map((app, index) => {
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
            if (finalSnap) {
              const { x: sx, y: sy } = snapPos(tx, ty);
              setPosition(id, sx, sy);
            } else {
              setPosition(id, tx, ty);
            }
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
            onDragStart={() => { preDragPos.current = { x: pos.x, y: pos.y }; }}
            onMove={(x, y) => isGroupDrag ? moveGroup(x, y, false) : setPosition(app.id, x, y)}
            onDrop={(x, y) => {
              if (isGroupDrag) { moveGroup(x, y, true); return; }
              const p = snapPos(x, y);
              if (!isOccupied(p.x, p.y, app.id)) {
                setPosition(app.id, p.x, p.y);
              } else {
                const orig = snapPos(preDragPos.current.x, preDragPos.current.y);
                setPosition(app.id, orig.x, orig.y);
              }
            }}
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
            onDragStart={() => { preDragPos.current = { x: item.x, y: item.y }; }}
            onMove={(x, y) => moveItem(item.id, x, y)}
            onDrop={(x, y) => {
              const p = snapPos(x, y);
              if (!isOccupied(p.x, p.y, item.id)) {
                moveItem(item.id, p.x, p.y);
              } else {
                const orig = snapPos(preDragPos.current.x, preDragPos.current.y);
                moveItem(item.id, orig.x, orig.y);
              }
            }}
            onContextMenu={(e) => handleIconContextMenu(e, item.id, 'item', item.name)}
            onRenameChange={(v) => setRenaming((r) => r ? { ...r, value: v } : null)}
            onRenameConfirm={confirmRename}
            onRenameCancel={cancelRename}
            onOpen={() => openDesktopFile(item)}
          />
        );
      })}

      {windows.map((win) => {
        const app = apps.find((a) => a.id === win.appId || win.appId.startsWith(a.id + ':'));
        if (!app) return null;
        const AppComponent = app.component;
        return (
          <Window key={win.id} win={win}>
            <AppComponent {...(win.componentProps ?? {})} />
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
          <button className={styles.menuItem} onClick={createTextDocument}>📝 New Text Document</button>
          <button className={styles.menuItem} onClick={() => createDesktopItem('folder')}>📁 New Folder</button>
          <div className={styles.menuDivider} />
          <div
            className={styles.submenuWrapper}
            onMouseEnter={() => setViewSubmenuOpen(true)}
            onMouseLeave={() => setViewSubmenuOpen(false)}
          >
            <button className={styles.menuItem}>
              <span>View</span>
              <span className={styles.menuArrow}>▶</span>
            </button>
            {viewSubmenuOpen && (
              <div className={styles.submenu}>
                {(['small', 'normal', 'large'] as ViewScale[]).map((s) => (
                  <button
                    key={s}
                    className={`${styles.menuItem} ${scale === s ? styles.menuItemActive : ''}`}
                    onClick={() => { setScale(s); closeMenus(); }}
                  >
                    {VIEW_LABELS[s]}
                    {scale === s && <span className={styles.menuCheck}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
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
            <button
              className={styles.menuItem}
              onClick={() => {
                const item = desktopItems.find((i) => i.id === iconMenu.id);
                if (item?.fsPath !== undefined) {
                  useFsStore.getState().deleteNode(item.fsPath, item.name);
                }
                removeItem(iconMenu.id);
                closeMenus();
              }}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
