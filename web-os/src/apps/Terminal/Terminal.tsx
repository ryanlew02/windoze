import { useCallback, useEffect, useRef, useState } from 'react';
import { useFsStore } from '../../store/useFsStore';
import { useAppStore } from '../../store/useAppStore';
import { useWindowStore } from '../../store/useWindowStore';
import { useViewStore, VIEW_CONFIG } from '../../store/useViewStore';
import { executeCommand, type TerminalLine } from './terminalCommands';
import { formatPath, resolvePath, getFolderAt } from './terminalFs';
import styles from './Terminal.module.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const APP_ALIASES: Record<string, string> = {
  notepad:        'notepad',
  calculator:     'calculator',
  calc:           'calculator',
  files:          'files',
  explorer:       'files',
  settings:       'settings',
  chess:          'chess',
  terminal:       'terminal',
  aptitude:       'aptitude-test',
  manifesto:      'manifesto',
  fearsim:        'fear-sim',
  dictionary:     'dictionary',
  dict:           'dictionary',
};

const COMMANDS = [
  'help', 'clear', 'pwd', 'ls', 'cd', 'mkdir',
  'touch', 'cat', 'rm', 'rmdir', 'echo', 'date', 'whoami', 'open', 'edit',
];

const WELCOME: TerminalLine[] = [
  { id: 'w0', type: 'output', text: 'DivergeOS  ──  Terminal v1.0' },
  { id: 'w1', type: 'output', text: 'Type "help" for available commands.' },
  { id: 'w2', type: 'output', text: '' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Longest common prefix of an array of strings (case-sensitive). */
function commonPrefix(strs: string[]): string {
  if (strs.length === 0) return '';
  let prefix = strs[0];
  for (let i = 1; i < strs.length; i++) {
    while (!strs[i].startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
      if (!prefix) return '';
    }
  }
  return prefix;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TerminalApp() {
  const { createNode, deleteNode, writeFile } = useFsStore();
  const apps           = useAppStore((s) => s.apps);
  const { openWindow } = useWindowStore();
  const { scale }      = useViewStore();
  const { windowScale } = VIEW_CONFIG[scale];

  const [lines,   setLines]   = useState<TerminalLine[]>(WELCOME);
  const [input,   setInput]   = useState('');
  const [cwd,     setCwd]     = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [, setHistIdx] = useState(-1);

  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = outputRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const openApp = useCallback((alias: string): string => {
    const appId = APP_ALIASES[alias];
    if (!appId) return `open: '${alias}': application not found`;
    const app = apps.find((a) => a.id === appId);
    if (!app)  return `open: '${alias}': application not found`;
    openWindow({
      id:     `${appId}-${Date.now()}`,
      appId:  app.id,
      title:  app.title,
      icon:   app.icon,
      x:      100 + Math.random() * 120,
      y:      60  + Math.random() * 80,
      width:  (app.defaultWidth  ?? 520) * windowScale,
      height: (app.defaultHeight ?? 400) * windowScale,
      isMinimized: false,
      isMaximized: false,
    });
    return `Opening ${app.title}...`;
  }, [apps, openWindow, windowScale]);

  const openFile = useCallback((path: string[], name: string): string => {
    const notepadApp = apps.find((a) => a.id === 'notepad');
    if (!notepadApp) return `edit: notepad not found`;
    const fileKey = [...path, name].join('/');
    openWindow({
      id:     `notepad:${fileKey}-${Date.now()}`,
      appId:  `notepad:${fileKey}`,
      title:  name,
      icon:   '📄',
      x:      100 + Math.random() * 120,
      y:      60  + Math.random() * 80,
      width:  (notepadApp.defaultWidth  ?? 560) * windowScale,
      height: (notepadApp.defaultHeight ?? 420) * windowScale,
      isMinimized: false,
      isMaximized: false,
      componentProps: { filePath: path, fileName: name },
    });
    return `Opening ${name}...`;
  }, [apps, openWindow, windowScale]);

  // ── Submit ──────────────────────────────────────────────────────────────────

  function submit() {
    const trimmed = input.trim();
    if (trimmed) setHistory((h) => [trimmed, ...h].slice(0, 200));
    setHistIdx(-1);

    const promptLine: TerminalLine = {
      id:   `p-${Date.now()}-${Math.random()}`,
      type: 'input',
      text: `${formatPath(cwd) || '/'}$ ${trimmed}`,
    };

    const result = executeCommand(trimmed, {
      root:         useFsStore.getState().root,
      cwd,
      actions:      { createNode, deleteNode, writeFile },
      openApp,
      openFile,
      desktopApps:  apps.map((a) => a.title),
    });

    if (result.clear) {
      setLines([]);
    } else {
      setLines((prev) => [...prev, promptLine, ...result.lines]);
    }

    if (result.newCwd !== undefined) setCwd(result.newCwd);
    setInput('');
  }

  // ── Tab completion ──────────────────────────────────────────────────────────

  function tabComplete() {
    const val           = input;
    const trailingSpace = val.endsWith(' ');
    const tokens        = val.trim().split(/\s+/).filter(Boolean);

    if (tokens.length === 0) return;

    // ── 1. Complete the command name ──
    if (tokens.length === 1 && !trailingSpace) {
      const partial  = tokens[0].toLowerCase();
      const matches  = COMMANDS.filter((c) => c.startsWith(partial));
      applyCompletion(val, partial, matches);
      return;
    }

    // ── 2. Complete an argument ──
    const cmd     = tokens[0].toLowerCase();
    const partial = trailingSpace ? '' : tokens[tokens.length - 1];
    // baseInput = everything that stays before the completed token
    const baseInput = trailingSpace
      ? val
      : val.slice(0, val.lastIndexOf(partial));

    // App-name completion for `open`
    if (cmd === 'open') {
      const names   = Object.keys(APP_ALIASES);
      const matches = names.filter((n) => n.startsWith(partial.toLowerCase()));
      applyCompletion(baseInput, partial, matches);
      return;
    }

    // File / folder path completion for everything else
    const lastSlash  = partial.lastIndexOf('/');
    const dirPart    = lastSlash !== -1 ? partial.slice(0, lastSlash)      : '';
    const namePart   = lastSlash !== -1 ? partial.slice(lastSlash + 1)     : partial;
    const searchDir  = dirPart ? resolvePath(cwd, dirPart) : cwd;

    const folder = getFolderAt(useFsStore.getState().root, searchDir);
    if (!folder) return;

    // cd and rmdir only make sense to complete to folders
    const foldersOnly = cmd === 'cd' || cmd === 'rmdir';

    const matches = Object.values(folder)
      .filter((n) => !foldersOnly || n.type === 'folder')
      .filter((n) => n.name.toLowerCase().startsWith(namePart.toLowerCase()))
      .map((n) => {
        const fullName = n.name + (n.type === 'folder' ? '/' : '');
        // Re-attach the directory prefix so the completed text is a full path
        return dirPart ? dirPart + '/' + fullName : fullName;
      });

    applyCompletion(baseInput, partial, matches);
  }

  /**
   * Given a set of completion candidates, either:
   * - Complete unambiguously (one match, or a longer common prefix)
   * - Print all candidates to output when there's ambiguity with no prefix gain
   */
  function applyCompletion(base: string, partial: string, matches: string[]) {
    if (matches.length === 0) return;

    if (matches.length === 1) {
      const completed = matches[0];
      // Folders already end with '/'; files get a trailing space for convenience
      setInput(base + completed + (completed.endsWith('/') ? '' : ' '));
      return;
    }

    const cp = commonPrefix(matches);
    if (cp.length > partial.length) {
      // Common prefix is longer than what was typed — complete to it
      setInput(base + cp);
    } else {
      // Ambiguous — print candidates and leave input unchanged
      setLines((prev) => [
        ...prev,
        { id: `tab-${Date.now()}`, type: 'output' as const, text: matches.join('   ') },
      ]);
    }
  }

  // ── Key handler ─────────────────────────────────────────────────────────────

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Tab') {
      e.preventDefault();
      tabComplete();
      return;
    }

    if (e.key === 'Enter') {
      submit();
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHistIdx((i) => {
        const next = Math.min(i + 1, history.length - 1);
        if (history[next] !== undefined) setInput(history[next]);
        return next;
      });
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHistIdx((i) => {
        const next = i - 1;
        if (next < 0) { setInput(''); return -1; }
        if (history[next] !== undefined) setInput(history[next]);
        return next;
      });
      return;
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const prompt = `${formatPath(cwd) || '/'}$ `;

  return (
    <div className={styles.terminal} onClick={() => inputRef.current?.focus()}>
      <div ref={outputRef} className={styles.output}>
        {lines.map((ln) => (
          <div
            key={ln.id}
            className={
              ln.type === 'input'   ? styles.inputLine   :
              ln.type === 'error'   ? styles.errorLine   :
              ln.type === 'success' ? styles.successLine :
              ln.type === 'dir'     ? styles.dirLine     :
              styles.outputLine
            }
          >
            {ln.text || ' '}
          </div>
        ))}
      </div>

      <div className={styles.inputRow}>
        <span className={styles.promptLabel}>{prompt}</span>
        <input
          ref={inputRef}
          className={styles.inputField}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
