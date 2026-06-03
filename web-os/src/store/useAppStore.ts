import { create } from 'zustand';
import type { AppDefinition } from '../types';
import { NotepadApp } from '../apps/Notepad/Notepad';
import { CalculatorApp } from '../apps/Calculator/Calculator';
import { FileExplorerApp } from '../apps/FileExplorer/FileExplorer';

interface AppStore {
  apps: AppDefinition[];
}

export const useAppStore = create<AppStore>(() => ({
  apps: [
    { id: 'notepad', title: 'Notepad', icon: '📝', component: NotepadApp },
    { id: 'calculator', title: 'Calculator', icon: '🧮', component: CalculatorApp },
    { id: 'files', title: 'Files', icon: '📁', component: FileExplorerApp },
  ],
}));
