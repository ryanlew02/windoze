import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SoundStore {
  enabled: boolean;
  toggle: () => void;
}

export const useSoundStore = create<SoundStore>()(
  persist(
    (set) => ({
      enabled: true,
      toggle: () => set((s) => ({ enabled: !s.enabled })),
    }),
    { name: 'diverge-sounds' },
  ),
);

export function playSound(fn: () => void) {
  if (useSoundStore.getState().enabled) fn();
}
