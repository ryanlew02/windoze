import { useState, useRef, useEffect, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useWindowStore } from '../../store/useWindowStore';
import { useFsStore } from '../../store/useFsStore';
import type { FsNode } from '../../store/useFsStore';
import styles from './SearchPanel.module.css';

interface Props {
  onClose: () => void;
}

interface FileResult {
  name: string;
  pathParts: string[];
  displayPath: string;
}

function collectFiles(nodes: Record<string, FsNode>, pathParts: string[]): FileResult[] {
  const results: FileResult[] = [];
  for (const [key, node] of Object.entries(nodes)) {
    if (node.type === 'file') {
      if (!key.endsWith('.exe')) {
        results.push({ name: node.name, pathParts, displayPath: [...pathParts, key].join(' / ') });
      }
    } else if (key !== 'Programs') {
      results.push(...collectFiles(node.children, [...pathParts, key]));
    }
  }
  return results;
}

export function SearchPanel({ onClose }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const apps = useAppStore((s) => s.apps);
  const openWindow = useWindowStore((s) => s.openWindow);
  const root = useFsStore((s) => s.root);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const q = query.trim().toLowerCase();

  const matchedApps = q
    ? apps.filter((a) => a.title.toLowerCase().includes(q))
    : apps;

  const allFiles = useMemo(() => collectFiles(root, []), [root]);
  const matchedFiles = q
    ? allFiles.filter((f) => f.name.toLowerCase().includes(q))
    : [];

  function launch(appId: string) {
    const app = apps.find((a) => a.id === appId);
    if (!app) return;
    openWindow({
      id: `${appId}-${Date.now()}`,
      appId: app.id,
      title: app.title,
      icon: app.icon,
      x: 80 + Math.random() * 120,
      y: 60 + Math.random() * 80,
      width: app.defaultWidth ?? 500,
      height: app.defaultHeight ?? 380,
      isMinimized: false,
      isMaximized: false,
    });
    onClose();
  }

  function openFile(file: FileResult) {
    const notepadApp = apps.find((a) => a.id === 'notepad');
    if (!notepadApp) return;
    const fileKey = [...file.pathParts, file.name].join('/');
    openWindow({
      id: `notepad:${fileKey}-${Date.now()}`,
      appId: `notepad:${fileKey}`,
      title: file.name,
      icon: '📄',
      x: 80 + Math.random() * 120,
      y: 60 + Math.random() * 80,
      width: notepadApp.defaultWidth ?? 560,
      height: notepadApp.defaultHeight ?? 420,
      isMinimized: false,
      isMaximized: false,
      componentProps: { filePath: file.pathParts, fileName: file.name },
    });
    onClose();
  }

  return (
    <div className={styles.panel}>
      <div className={styles.searchRow}>
        <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11 L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder="Search apps and files…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
        />
      </div>

      <div className={styles.results}>
        {matchedApps.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Apps</div>
            {matchedApps.slice(0, 6).map((app) => (
              <button key={app.id} className={styles.row} onClick={() => launch(app.id)}>
                <span className={styles.rowIcon}>{app.icon}</span>
                <span className={styles.rowTitle}>{app.title}</span>
              </button>
            ))}
          </div>
        )}

        {matchedFiles.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Files</div>
            {matchedFiles.slice(0, 8).map((f) => (
              <button key={f.displayPath} className={styles.fileRow} onClick={() => openFile(f)}>
                <span className={styles.rowIcon}>📄</span>
                <div className={styles.fileInfo}>
                  <span className={styles.rowTitle}>{f.name}</span>
                  <span className={styles.filePath}>{f.displayPath}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {q && matchedApps.length === 0 && matchedFiles.length === 0 && (
          <div className={styles.empty}>No results for "{query}"</div>
        )}
      </div>
    </div>
  );
}
