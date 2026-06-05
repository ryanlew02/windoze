import { create } from 'zustand';
import type { AppDefinition } from '../types';
import { NotepadApp } from '../apps/Notepad/Notepad';
import { CalculatorApp } from '../apps/Calculator/Calculator';
import { FileExplorerApp } from '../apps/FileExplorer/FileExplorer';
import { AptitudeTestApp } from '../apps/AptitudeTest/AptitudeTest';
import { ManifestoApp } from '../apps/Manifesto/Manifesto';
import { SettingsApp } from '../apps/Settings/Settings';
import { FearSimulationApp } from '../apps/FearSimulation/FearSimulation';
import { ChessApp } from '../apps/Chess/Chess';

interface AppStore {
  apps: AppDefinition[];
}

export const useAppStore = create<AppStore>(() => ({
  apps: [
    { id: 'notepad',       title: 'Notepad',        icon: '📝', component: NotepadApp },
    { id: 'calculator',    title: 'Calculator',      icon: '🔢', component: CalculatorApp },
    { id: 'files',         title: 'Files',           icon: '📁', component: FileExplorerApp },
    { id: 'aptitude-test', title: 'Aptitude Test',   icon: '🎯', component: AptitudeTestApp },
    { id: 'manifesto',     title: 'Manifesto',       icon: '📜', component: ManifestoApp },
    { id: 'settings',      title: 'Settings',        icon: '⚙️', component: SettingsApp },
    { id: 'fear-sim',      title: 'Fear Simulation', icon: '⚡', component: FearSimulationApp },
    { id: 'chess', title: 'Chess', icon: '♞', component: ChessApp, defaultWidth: 520, defaultHeight: 580 },
  ],
}));
