import { create } from 'zustand';

export type ViewScale = 'small' | 'normal' | 'large';

export const VIEW_CONFIG = {
  small:  { zoom: 1.0,  grid: 80,  iconW: 64, iconH: 72,  windowScale: 0.8  },
  normal: { zoom: 1.25, grid: 96,  iconW: 80, iconH: 90,  windowScale: 1.0  },
  large:  { zoom: 1.5,  grid: 112, iconW: 96, iconH: 108, windowScale: 1.25 },
} as const;

const STORAGE_KEY = 'view-scale';

function applyZoom(scale: ViewScale) {
  document.documentElement.style.zoom = String(VIEW_CONFIG[scale].zoom);
}

const saved = (localStorage.getItem(STORAGE_KEY) as ViewScale | null) ?? 'normal';
applyZoom(saved);

interface ViewState {
  scale: ViewScale;
  setScale: (scale: ViewScale) => void;
}

export const useViewStore = create<ViewState>((set) => ({
  scale: saved,
  setScale: (scale) => {
    applyZoom(scale);
    localStorage.setItem(STORAGE_KEY, scale);
    set({ scale });
  },
}));
