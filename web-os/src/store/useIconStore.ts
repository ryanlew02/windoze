import { create } from 'zustand';

interface IconStore {
  positions: Record<string, { x: number; y: number }>;
  labels: Record<string, string>;
  setPosition: (id: string, x: number, y: number) => void;
  setLabel: (id: string, label: string) => void;
  load: (positions: Record<string, { x: number; y: number }>, labels: Record<string, string>) => void;
  reset: () => void;
}

export const useIconStore = create<IconStore>((set) => ({
  positions: {},
  labels: {},
  setPosition: (id, x, y) =>
    set((s) => ({ positions: { ...s.positions, [id]: { x, y } } })),
  setLabel: (id, label) =>
    set((s) => ({ labels: { ...s.labels, [id]: label } })),
  load: (positions, labels) => set({ positions, labels }),
  reset: () => set({ positions: {}, labels: {} }),
}));
