import { lazy } from 'react';
import { create } from 'zustand';
import type { AppDefinition } from '../types';

const NotepadApp       = lazy(() => import('../apps/Notepad/Notepad').then(m => ({ default: m.NotepadApp })));
const CalculatorApp    = lazy(() => import('../apps/Calculator/Calculator').then(m => ({ default: m.CalculatorApp })));
const FileExplorerApp  = lazy(() => import('../apps/FileExplorer/FileExplorer').then(m => ({ default: m.FileExplorerApp })));
const AptitudeTestApp  = lazy(() => import('../apps/AptitudeTest/AptitudeTest').then(m => ({ default: m.AptitudeTestApp })));
const ManifestoApp     = lazy(() => import('../apps/Manifesto/Manifesto').then(m => ({ default: m.ManifestoApp })));
const SettingsApp      = lazy(() => import('../apps/Settings/Settings').then(m => ({ default: m.SettingsApp })));
const FearSimulationApp = lazy(() => import('../apps/FearSimulation/FearSimulation').then(m => ({ default: m.FearSimulationApp })));
const ChessApp         = lazy(() => import('../apps/Chess/Chess').then(m => ({ default: m.ChessApp })));
const TerminalApp      = lazy(() => import('../apps/Terminal/Terminal').then(m => ({ default: m.TerminalApp })));
const DictionaryApp    = lazy(() => import('../apps/Dictionary/Dictionary').then(m => ({ default: m.DictionaryApp })));
const BrowserApp       = lazy(() => import('../apps/Browser/Browser').then(m => ({ default: m.BrowserApp })));
const ZiplineApp       = lazy(() => import('../apps/Zipline/Zipline').then(m => ({ default: m.ZiplineApp })));

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
    { id: 'chess',         title: 'Chess',           icon: '♞',  component: ChessApp,         defaultWidth: 520, defaultHeight: 580 },
    { id: 'terminal',      title: 'Terminal',        icon: '>_', component: TerminalApp,       defaultWidth: 620, defaultHeight: 460 },
    { id: 'dictionary',    title: 'Dictionary',      icon: '📖', component: DictionaryApp,     defaultWidth: 640, defaultHeight: 520 },
    { id: 'browser',       title: 'Browser',         icon: '🌐', component: BrowserApp,        defaultWidth: 900, defaultHeight: 640 },
    { id: 'zipline',       title: 'Zip Line',        icon: '🚠', component: ZiplineApp,        defaultWidth: 720, defaultHeight: 500 },
  ],
}));
