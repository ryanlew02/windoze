import { useState, useRef } from 'react';
import { useFsStore, type FsNode } from '../../store/useFsStore';
import styles from './Notepad.module.css';

interface FileRef { path: string[]; name: string }

function findFileContent(nodes: Record<string, FsNode>, folderPath: string[], fileName: string): string {
  if (folderPath.length === 0) {
    const node = nodes[fileName];
    return node?.type === 'file' ? node.content : '';
  }
  const folder = nodes[folderPath[0]];
  if (!folder || folder.type !== 'folder') return '';
  return findFileContent(folder.children, folderPath.slice(1), fileName);
}

function collectTxtFiles(nodes: Record<string, FsNode>, path: string[] = []): (FileRef & { content: string })[] {
  const out: (FileRef & { content: string })[] = [];
  for (const n of Object.values(nodes)) {
    if (n.type === 'file' && n.name.endsWith('.txt')) {
      out.push({ path, name: n.name, content: n.content });
    }
    if (n.type === 'folder') {
      out.push(...collectTxtFiles(n.children, [...path, n.name]));
    }
  }
  return out;
}

function collectFolders(nodes: Record<string, FsNode>, path: string[] = []): string[][] {
  const out: string[][] = [path];
  for (const n of Object.values(nodes)) {
    if (n.type === 'folder' && n.children) {
      out.push(...collectFolders(n.children, [...path, n.name]));
    }
  }
  return out;
}

interface NotepadProps {
  filePath?: string[];
  fileName?: string;
}

export function NotepadApp({ filePath, fileName }: NotepadProps = {}) {
  const { root, writeFile } = useFsStore();

  const [text, setText]           = useState(() =>
    filePath && fileName ? findFileContent(useFsStore.getState().root, filePath, fileName) : '',
  );
  const [savedText, setSavedText] = useState(() =>
    filePath && fileName ? findFileContent(useFsStore.getState().root, filePath, fileName) : '',
  );
  const [fileRef, setFileRef]     = useState<FileRef | null>(
    filePath && fileName ? { path: filePath, name: fileName } : null,
  );
  const [dialog, setDialog]       = useState<'none' | 'open' | 'save-as'>('none');

  const [saveName, setSaveName]     = useState('');
  const [saveFolder, setSaveFolder] = useState<string[]>([]);
  const [openSel, setOpenSel]       = useState<(FileRef & { content: string }) | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursor, setCursor] = useState({ line: 1, col: 1 });

  const unsaved = text !== savedText;

  function trackCursor(e: React.SyntheticEvent<HTMLTextAreaElement>) {
    const ta = e.currentTarget;
    const before = ta.value.substring(0, ta.selectionStart);
    const lines = before.split('\n');
    setCursor({ line: lines.length, col: lines[lines.length - 1].length + 1 });
  }

  function handleNew() {
    setText('');
    setSavedText('');
    setFileRef(null);
  }

  function handleSave() {
    if (!fileRef) { openSaveAsDialog(); return; }
    writeFile(fileRef.path, fileRef.name, text);
    setSavedText(text);
  }

  function openSaveAsDialog() {
    setSaveName(fileRef?.name.replace(/\.txt$/, '') ?? '');
    setSaveFolder(fileRef?.path ?? []);
    setDialog('save-as');
  }

  function confirmSaveAs() {
    const raw = saveName.trim();
    if (!raw) return;
    const name = raw.endsWith('.txt') ? raw : `${raw}.txt`;
    writeFile(saveFolder, name, text);
    setFileRef({ path: saveFolder, name });
    setSavedText(text);
    setDialog('none');
  }

  function confirmOpen() {
    if (!openSel) return;
    setText(openSel.content);
    setSavedText(openSel.content);
    setFileRef({ path: openSel.path, name: openSel.name });
    setDialog('none');
    setOpenSel(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 's' && e.shiftKey) { e.preventDefault(); openSaveAsDialog(); return; }
      if (e.key === 's')               { e.preventDefault(); handleSave(); return; }
      if (e.key === 'o')               { e.preventDefault(); setOpenSel(null); setDialog('open'); return; }
      if (e.key === 'n')               { e.preventDefault(); handleNew(); return; }
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = text.substring(0, start) + '\t' + text.substring(end);
      setText(next);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 1; }, 0);
    }
  }

  const titleStr = fileRef ? [...fileRef.path, fileRef.name].join(' / ') : 'Untitled';
  const allFiles = collectTxtFiles(root);
  const allFolders = collectFolders(root);

  return (
    <div className={styles.notepad}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button className={styles.toolBtn} onClick={handleNew}>New</button>
        <button className={styles.toolBtn} onClick={() => { setOpenSel(null); setDialog('open'); }}>Open</button>
        <button className={styles.toolBtn} onClick={handleSave}>Save</button>
        <button className={styles.toolBtn} onClick={openSaveAsDialog}>Save As</button>
        <div className={styles.toolDivider} />
        <span className={styles.filePath}>
          {unsaved && <span className={styles.unsavedDot}>●</span>}
          {titleStr}
        </span>
      </div>

      {/* Editor */}
      <textarea
        ref={textareaRef}
        className={styles.editor}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onKeyUp={trackCursor}
        onClick={trackCursor}
        placeholder="Start typing..."
        spellCheck={false}
      />

      {/* Status bar */}
      <div className={styles.statusBar}>
        <span>Ln {cursor.line}, Col {cursor.col}</span>
        <div className={styles.statusSep} />
        <span>UTF-8</span>
        <div className={styles.statusSep} />
        <span>Plain Text</span>
      </div>

      {/* Open dialog */}
      {dialog === 'open' && (
        <div className={styles.overlay} onClick={() => setDialog('none')}>
          <div className={styles.dialogBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dialogTitle}>Open File</div>
            <div className={styles.dialogBody}>
              {allFiles.length === 0 ? (
                <p className={styles.emptyMsg}>No .txt files found in the file system.</p>
              ) : (
                <ul className={styles.fileList}>
                  {allFiles.map((f) => {
                    const key = [...f.path, f.name].join('/');
                    const isSelected = openSel && [...openSel.path, openSel.name].join('/') === key;
                    return (
                      <li
                        key={key}
                        className={`${styles.fileItem} ${isSelected ? styles.fileItemActive : ''}`}
                        onClick={() => setOpenSel(f)}
                        onDoubleClick={() => { setOpenSel(f); confirmOpen(); }}
                      >
                        <span className={styles.fileIcon}>📄</span>
                        <span className={styles.fileName}>{f.name}</span>
                        {f.path.length > 0 && (
                          <span className={styles.fileLoc}>{f.path.join(' / ')}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className={styles.dialogFooter}>
              <button className={styles.dialogBtn} onClick={() => setDialog('none')}>Cancel</button>
              <button
                className={`${styles.dialogBtn} ${styles.dialogBtnPrimary}`}
                onClick={confirmOpen}
                disabled={!openSel}
              >
                Open
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save As dialog */}
      {dialog === 'save-as' && (
        <div className={styles.overlay} onClick={() => setDialog('none')}>
          <div className={styles.dialogBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dialogTitle}>Save As</div>
            <div className={styles.dialogBody}>
              <div className={styles.saveField}>
                <label className={styles.saveLabel}>File name</label>
                <div className={styles.saveInputRow}>
                  <input
                    className={styles.saveInput}
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && confirmSaveAs()}
                    placeholder="filename"
                    autoFocus
                  />
                  <span className={styles.saveExt}>.txt</span>
                </div>
              </div>
              <div className={styles.saveField}>
                <label className={styles.saveLabel}>Location</label>
                <ul className={styles.folderList}>
                  {allFolders.map((fp) => {
                    const key = fp.join('/') || '__root__';
                    const isSelected = saveFolder.join('/') === fp.join('/');
                    return (
                      <li
                        key={key}
                        className={`${styles.folderItem} ${isSelected ? styles.folderItemActive : ''}`}
                        onClick={() => setSaveFolder(fp)}
                      >
                        {fp.length === 0 ? '📂 / (root)' : `📁 ${fp.join(' / ')}`}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            <div className={styles.dialogFooter}>
              <button className={styles.dialogBtn} onClick={() => setDialog('none')}>Cancel</button>
              <button
                className={`${styles.dialogBtn} ${styles.dialogBtnPrimary}`}
                onClick={confirmSaveAs}
                disabled={!saveName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
