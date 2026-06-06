import { lazy } from 'react';
import { create } from 'zustand';
import { APP_ICONS, APP_ICON_BG } from './appIcons';
import type { AppDefinition } from '../types';

const NotepadApp        = lazy(() => import('../apps/Notepad/Notepad').then(m => ({ default: m.NotepadApp })));
const CalculatorApp     = lazy(() => import('../apps/Calculator/Calculator').then(m => ({ default: m.CalculatorApp })));
const FileExplorerApp   = lazy(() => import('../apps/FileExplorer/FileExplorer').then(m => ({ default: m.FileExplorerApp })));
const AptitudeTestApp   = lazy(() => import('../apps/AptitudeTest/AptitudeTest').then(m => ({ default: m.AptitudeTestApp })));
const ManifestoApp      = lazy(() => import('../apps/Manifesto/Manifesto').then(m => ({ default: m.ManifestoApp })));
const SettingsApp       = lazy(() => import('../apps/Settings/Settings').then(m => ({ default: m.SettingsApp })));
const FearSimulationApp = lazy(() => import('../apps/FearSimulation/FearSimulation').then(m => ({ default: m.FearSimulationApp })));
const ChessApp          = lazy(() => import('../apps/Chess/Chess').then(m => ({ default: m.ChessApp })));
const TerminalApp       = lazy(() => import('../apps/Terminal/Terminal').then(m => ({ default: m.TerminalApp })));
const DictionaryApp     = lazy(() => import('../apps/Dictionary/Dictionary').then(m => ({ default: m.DictionaryApp })));
const BrowserApp        = lazy(() => import('../apps/Browser/Browser').then(m => ({ default: m.BrowserApp })));
const ZiplineApp        = lazy(() => import('../apps/Zipline/Zipline').then(m => ({ default: m.ZiplineApp })));

function app(
  id: string, title: string, component: AppDefinition['component'],
  opts?: { defaultWidth?: number; defaultHeight?: number },
): AppDefinition {
  return { id, title, icon: APP_ICONS[id], iconBg: APP_ICON_BG[id], component, ...opts };
}

interface AppStore {
  apps: AppDefinition[];
}

export const useAppStore = create<AppStore>(() => ({
  apps: [
    app('notepad',       'Notepad',        NotepadApp),
    app('calculator',    'Calculator',      CalculatorApp),
    app('files',         'Files',           FileExplorerApp),
    app('aptitude-test', 'Aptitude Test',   AptitudeTestApp),
    app('manifesto',     'Manifesto',       ManifestoApp),
    app('settings',      'Settings',        SettingsApp),
    app('fear-sim',      'Fear Simulation', FearSimulationApp),
    app('chess',         'Chess',           ChessApp,          { defaultWidth: 520, defaultHeight: 580 }),
    app('terminal',      'Terminal',        TerminalApp,       { defaultWidth: 620, defaultHeight: 460 }),
    app('dictionary',    'Dictionary',      DictionaryApp,     { defaultWidth: 640, defaultHeight: 520 }),
    app('browser',       'Browser',         BrowserApp,        { defaultWidth: 900, defaultHeight: 640 }),
    app('zipline',       'Zip Line',        ZiplineApp,        { defaultWidth: 720, defaultHeight: 500 }),
  ],
}));
