import { create } from 'zustand';
import { factions, type FactionId } from '../themes/factions';
import type { ViewScale } from './useViewStore';
import { useThemeStore } from './useThemeStore';
import { useViewStore } from './useViewStore';
import { usePinnedStore } from './usePinnedStore';
import { useIconStore } from './useIconStore';
import { useNotificationStore } from './useNotificationStore';

export interface ProfileData {
  name: string;
  factionId: FactionId;
  scale: ViewScale;
  pinnedIds: string[];
  iconPositions: Record<string, { x: number; y: number }>;
  iconLabels: Record<string, string>;
}

export type ProfileSlot = 'slot1' | 'slot2';

const LS_ACTIVE = 'diverge-active-profile';
const LS_SLOTS  = 'diverge-profile-slots';

function defaultSlots(): Record<ProfileSlot, ProfileData> {
  return {
    slot1: { name: 'Initiate',  factionId: 'erudite',   scale: 'normal', pinnedIds: [], iconPositions: {}, iconLabels: {} },
    slot2: { name: 'Divergent', factionId: 'divergent', scale: 'normal', pinnedIds: [], iconPositions: {}, iconLabels: {} },
  };
}

function loadSlots(): Record<ProfileSlot, ProfileData> {
  try {
    const raw = localStorage.getItem(LS_SLOTS);
    if (raw) return JSON.parse(raw) as Record<ProfileSlot, ProfileData>;
  } catch { /* ignore */ }
  return defaultSlots();
}

function captureCurrentState(name: string): ProfileData {
  return {
    name,
    factionId: useThemeStore.getState().factionId,
    scale:     useViewStore.getState().scale,
    pinnedIds: usePinnedStore.getState().pinnedIds,
    iconPositions: useIconStore.getState().positions,
    iconLabels:    useIconStore.getState().labels,
  };
}

function applyProfileData(data: ProfileData) {
  const faction = factions.find((f) => f.id === data.factionId);
  if (faction) {
    localStorage.setItem('os-faction', data.factionId);
    Object.entries(faction.vars).forEach(([k, v]) =>
      document.documentElement.style.setProperty(k, v),
    );
    useThemeStore.setState({ factionId: data.factionId });
  }
  useViewStore.getState().setScale(data.scale);
  usePinnedStore.getState().load(data.pinnedIds);
  useIconStore.getState().load(data.iconPositions, data.iconLabels);
}

interface ProfileStore {
  activeSlot: ProfileSlot;
  slots: Record<ProfileSlot, ProfileData>;
  switchProfile: (to: ProfileSlot) => void;
  saveCurrentProfile: () => void;
  renameProfile: (slot: ProfileSlot, name: string) => void;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  activeSlot: (localStorage.getItem(LS_ACTIVE) as ProfileSlot | null) ?? 'slot1',
  slots: loadSlots(),

  switchProfile: (to) => {
    const { activeSlot, slots } = get();
    if (to === activeSlot) return;

    const saved = captureCurrentState(slots[activeSlot].name);
    const newSlots: Record<ProfileSlot, ProfileData> = { ...slots, [activeSlot]: saved };

    applyProfileData(newSlots[to]);

    localStorage.setItem(LS_ACTIVE, to);
    localStorage.setItem(LS_SLOTS, JSON.stringify(newSlots));
    set({ activeSlot: to, slots: newSlots });

    useNotificationStore.getState().push({
      icon:    '👤',
      title:   'PROFILE SWITCHED',
      message: `Now operating as ${newSlots[to].name}.`,
    });
  },

  saveCurrentProfile: () => {
    const { activeSlot, slots } = get();
    const saved = captureCurrentState(slots[activeSlot].name);
    const newSlots: Record<ProfileSlot, ProfileData> = { ...slots, [activeSlot]: saved };
    localStorage.setItem(LS_SLOTS, JSON.stringify(newSlots));
    set({ slots: newSlots });
  },

  renameProfile: (slot, name) => {
    set((s) => {
      const newSlots = { ...s.slots, [slot]: { ...s.slots[slot], name } };
      localStorage.setItem(LS_SLOTS, JSON.stringify(newSlots));
      return { slots: newSlots };
    });
  },
}));
