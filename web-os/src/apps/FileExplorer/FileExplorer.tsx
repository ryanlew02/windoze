import { useState } from 'react';
import styles from './FileExplorer.module.css';

interface FsNode {
  name: string;
  type: 'folder' | 'file';
  children?: FsNode[];
}

const FS: FsNode[] = [
  {
    name: 'Documents', type: 'folder', children: [
      { name: 'resume.pdf', type: 'file' },
      { name: 'notes.txt', type: 'file' },
    ],
  },
  {
    name: 'Pictures', type: 'folder', children: [
      { name: 'photo.png', type: 'file' },
    ],
  },
  { name: 'readme.md', type: 'file' },
];

export function FileExplorerApp() {
  const [path, setPath] = useState<string[]>([]);

  function getCurrent(): FsNode[] {
    let nodes = FS;
    for (const seg of path) {
      const folder = nodes.find((n) => n.name === seg && n.type === 'folder');
      if (!folder?.children) return [];
      nodes = folder.children;
    }
    return nodes;
  }

  function enter(node: FsNode) {
    if (node.type === 'folder') setPath([...path, node.name]);
  }

  function up() {
    setPath(path.slice(0, -1));
  }

  const current = getCurrent();
  const breadcrumb = ['Home', ...path].join(' › ');

  return (
    <div className={styles.explorer}>
      <div className={styles.toolbar}>
        <button className={styles.toolBtn} onClick={up} disabled={path.length === 0}>←</button>
        <span className={styles.breadcrumb}>{breadcrumb}</span>
      </div>
      <div className={styles.fileList}>
        {current.map((node) => (
          <button
            key={node.name}
            className={styles.item}
            onDoubleClick={() => enter(node)}
          >
            <span className={styles.itemIcon}>{node.type === 'folder' ? '📁' : '📄'}</span>
            <span className={styles.itemName}>{node.name}</span>
          </button>
        ))}
        {current.length === 0 && <span className={styles.empty}>Empty folder</span>}
      </div>
    </div>
  );
}
