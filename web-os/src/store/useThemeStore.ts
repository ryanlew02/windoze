import { create } from 'zustand';
import { type FactionId } from '../themes/factions';

interface ThemeState {
  factionId: FactionId;
  setFaction: (id: FactionId) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  factionId: 'erudite',
  setFaction: (id) => set({ factionId: id }),
}));
