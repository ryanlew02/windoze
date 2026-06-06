import { create } from 'zustand';
import { type FactionId, factions } from '../themes/factions';
import { useNotificationStore } from './useNotificationStore';

const THEME_KEY  = 'os-faction';
const savedId    = (localStorage.getItem(THEME_KEY) as FactionId | null) ?? 'erudite';
const initFaction = factions.find((f) => f.id === savedId) ?? factions[0];

// Apply vars immediately at module load so the correct theme is present
// before React renders anything — prevents any colour flash on startup.
Object.entries(initFaction.vars).forEach(([k, v]) => {
  document.documentElement.style.setProperty(k, v);
});

interface ThemeState {
  factionId: FactionId;
  setFaction: (id: FactionId) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  factionId: savedId,
  setFaction: (id) => {
    localStorage.setItem(THEME_KEY, id);
    set({ factionId: id });
    const faction = factions.find((f) => f.id === id);
    if (faction) {
      useNotificationStore.getState().push({
        icon:    faction.symbol,
        title:   'FACTION CHANGED',
        message: `Allegiance sworn to ${faction.name}.`,
      });
    }
  },
}));
