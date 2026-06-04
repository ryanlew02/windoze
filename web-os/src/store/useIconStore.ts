import { create } from 'zustand';

interface IconStore {
  positions: Record<string, { x: number; y: number }>;
  setPosition: (id: string, x: number, y: number) => void;
}

export const useIconStore = create<IconStore>((set) => ({
  positions: {},
  setPosition: (id, x, y) =>
    set((s) => ({ positions: { ...s.positions, [id]: { x, y } } })),
}));
