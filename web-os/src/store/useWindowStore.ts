import { create } from 'zustand';
import type { WindowState } from '../types';

let zCounter = 100;

interface WindowStore {
  windows: WindowState[];
  openWindow: (win: Omit<WindowState, 'zIndex' | 'isFocused'>) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, width: number, height: number) => void;
  resizeMoveWindow: (id: string, x: number, y: number, width: number, height: number) => void;
}

export const useWindowStore = create<WindowStore>((set) => ({
  windows: [],

  openWindow: (win) =>
    set((state) => {
      const existing = state.windows.find((w) => w.appId === win.appId);
      if (existing) {
        return {
          windows: state.windows.map((w) =>
            w.id === existing.id
              ? { ...w, isMinimized: false, isFocused: true, zIndex: ++zCounter }
              : { ...w, isFocused: false }
          ),
        };
      }
      return {
        windows: [
          ...state.windows.map((w) => ({ ...w, isFocused: false })),
          { ...win, zIndex: ++zCounter, isFocused: true },
        ],
      };
    }),

  closeWindow: (id) =>
    set((state) => ({ windows: state.windows.filter((w) => w.id !== id) })),

  focusWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id
          ? { ...w, isFocused: true, isMinimized: false, zIndex: ++zCounter }
          : { ...w, isFocused: false }
      ),
    })),

  minimizeWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMinimized: true, isFocused: false } : w
      ),
    })),

  toggleMaximize: (id) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
      ),
    })),

  moveWindow: (id, x, y) =>
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
    })),

  resizeWindow: (id, width, height) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, width, height } : w
      ),
    })),

  resizeMoveWindow: (id, x, y, width, height) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, x, y, width, height } : w
      ),
    })),
}));
