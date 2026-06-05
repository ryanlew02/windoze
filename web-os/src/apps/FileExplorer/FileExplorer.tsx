import { useEffect, useRef, useState } from 'react';
import { useFsStore, type FsNode } from '../../store/useFsStore';
import styles from './FileExplorer.module.css';

type Creating = { type: 'folder' | 'file' };
type ContextMenu = { x: number; y: number; node: FsNode };

export function FileExplorerApp() {
  const { root, createNode, deleteNode, renameNode } = useFsStore();
  const [path, setPath]           = useState<string[]>([]);
  const [creating, setCreating]   = useState<Creating | null>(null);
  const [newName, setNewName]     = useState('');
  const [menu, setMenu]           = useState<ContextMenu | null>(null);
  const [renaming, setRenaming]   = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creating || renaming) inputRef.current?.focus();
  }, [creating, renaming]);

  function getCurrent(): FsNode[] {
    let nodes = root;
    for (const seg of path) {
      const folder = nodes.find((n) => n.name === seg && n.type === 'folder');
      if (!folder?.children) return [];
      nodes = folder.children;
    }
    return nodes;
  }

  function closeMenu() { setMenu(null); }

  function up() {
    setPath((p) => p.slice(0, -1));
    closeMenu();
  }

  function startCreate(type: 'folder' | 'file') {
    setCreating({ type });
    setNewName('');
    setRenaming(null);
    closeMenu();
  }

  function confirmCreate() {
    const name = newName.trim();
    if (name) createNode(path, name, creating!.type);
    setCreating(null);
    setNewName('');
  }

  function startRename(node: FsNode) {
    setRenaming(node.name);
    setRenameName(node.name);
    setCreating(null);
    closeMenu();
  }

  function confirmRename() {
    const name = renameName.trim();
    if (name && renaming) renameNode(path, renaming, name);
    setRenaming(null);
  }

  function handleContextMenu(e: React.MouseEvent, node: FsNode) {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, node });
  }

  const current    = getCurrent();
  const breadcrumb = ['Home', ...path].join(' › ');

  return (
    <div className={styles.explorer} onClick={closeMenu}>
      <div className={styles.toolbar}>
        <button className={styles.toolBtn} onClick={up} disabled={path.length === 0}>←</button>
        <span className={styles.breadcrumb}>{breadcrumb}</span>
        <div className={styles.spacer} />
        <button className={styles.toolBtn} onClick={() => startCreate('folder')}>+ Folder</button>
        <button className={styles.toolBtn} onClick={() => startCreate('file')}>+ File</button>
      </div>

      <div className={styles.fileList}>
        {current.map((node) =>
          renaming === node.name ? (
            <div key={node.id} className={`${styles.item} ${styles.itemEditing}`}>
              <span className={styles.itemIcon}>{node.type === 'folder' ? '📁' : '📄'}</span>
              <input
                ref={inputRef}
                className={styles.nameInput}
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                onBlur={confirmRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmRename();
                  if (e.key === 'Escape') setRenaming(null);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : (
            <button
              key={node.id}
              className={styles.item}
              onDoubleClick={() => node.type === 'folder' && setPath([...path, node.name])}
              onContextMenu={(e) => handleContextMenu(e, node)}
            >
              <span className={styles.itemIcon}>{node.type === 'folder' ? '📁' : '📄'}</span>
              <span className={styles.itemName}>{node.name}</span>
            </button>
          ),
        )}

        {creating && (
          <div className={`${styles.item} ${styles.itemEditing}`}>
            <span className={styles.itemIcon}>{creating.type === 'folder' ? '📁' : '📄'}</span>
            <input
              ref={inputRef}
              className={styles.nameInput}
              value={newName}
              placeholder={creating.type === 'folder' ? 'Folder name' : 'File name'}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={confirmCreate}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmCreate();
                if (e.key === 'Escape') setCreating(null);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {current.length === 0 && !creating && (
          <span className={styles.empty}>Empty folder</span>
        )}
      </div>

      {menu && (
        <div
          className={styles.contextMenu}
          style={{ left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className={styles.menuItem} onClick={() => startRename(menu.node)}>Rename</button>
          <button className={styles.menuItem} onClick={() => { deleteNode(path, menu.node.name); closeMenu(); }}>Delete</button>
        </div>
      )}
    </div>
  );
}
