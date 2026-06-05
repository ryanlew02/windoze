import { create } from 'zustand';

export interface DesktopItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  /** Folder path in useFsStore where this item's file lives. Undefined = not linked to fs. */
  fsPath?: string[];
  x: number;
  y: number;
}

interface DesktopItemState {
  items: DesktopItem[];
  addItem: (name: string, type: 'folder' | 'file', x: number, y: number, fsPath?: string[]) => void;
  removeItem: (id: string) => void;
  renameItem: (id: string, name: string) => void;
  moveItem: (id: string, x: number, y: number) => void;
  reset: () => void;
}

export const useDesktopItemStore = create<DesktopItemState>((set) => ({
  items: [],
  addItem: (name, type, x, y, fsPath?) =>
    set((s) => ({
      items: [
        ...s.items,
        { id: `${Date.now()}`, name, type, x, y, ...(fsPath !== undefined ? { fsPath } : {}) },
      ],
    })),
  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  renameItem: (id, name) =>
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, name } : i)) })),
  moveItem: (id, x, y) =>
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, x, y } : i)) })),
  reset: () => set({ items: [] }),
}));
