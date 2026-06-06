import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PinnedState {
  pinnedIds: string[];
  pin: (appId: string) => void;
  unpin: (appId: string) => void;
  load: (ids: string[]) => void;
  reset: () => void;
}

export const usePinnedStore = create<PinnedState>()(
  persist(
    (set) => ({
      pinnedIds: [],
      pin: (appId) =>
        set((s) => ({
          pinnedIds: s.pinnedIds.includes(appId) ? s.pinnedIds : [...s.pinnedIds, appId],
        })),
      unpin: (appId) =>
        set((s) => ({ pinnedIds: s.pinnedIds.filter((id) => id !== appId) })),
      load: (ids) => set({ pinnedIds: ids }),
      reset: () => set({ pinnedIds: [] }),
    }),
    { name: 'diverge-pinned' },
  ),
);
