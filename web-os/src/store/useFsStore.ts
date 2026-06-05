import { create } from 'zustand';

export interface FsNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  children?: FsNode[];
}

function withDirMutated(
  nodes: FsNode[],
  path: string[],
  mutate: (nodes: FsNode[]) => FsNode[],
): FsNode[] {
  if (path.length === 0) return mutate(nodes);
  return nodes.map((n) =>
    n.name === path[0] && n.type === 'folder'
      ? { ...n, children: withDirMutated(n.children ?? [], path.slice(1), mutate) }
      : n,
  );
}

interface FsState {
  root: FsNode[];
  createNode: (path: string[], name: string, type: 'folder' | 'file') => void;
  deleteNode: (path: string[], name: string) => void;
  renameNode: (path: string[], oldName: string, newName: string) => void;
}

export const useFsStore = create<FsState>((set) => ({
  root: [
    {
      id: '1', name: 'Documents', type: 'folder', children: [
        { id: '2', name: 'resume.pdf', type: 'file' },
        { id: '3', name: 'notes.txt', type: 'file' },
      ],
    },
    {
      id: '4', name: 'Pictures', type: 'folder', children: [
        { id: '5', name: 'photo.png', type: 'file' },
      ],
    },
    { id: '6', name: 'readme.md', type: 'file' },
  ],

  createNode: (path, name, type) =>
    set((s) => ({
      root: withDirMutated(s.root, path, (nodes) => [
        ...nodes,
        { id: `${Date.now()}`, name, type, ...(type === 'folder' ? { children: [] } : {}) },
      ]),
    })),

  deleteNode: (path, name) =>
    set((s) => ({
      root: withDirMutated(s.root, path, (nodes) => nodes.filter((n) => n.name !== name)),
    })),

  renameNode: (path, oldName, newName) =>
    set((s) => ({
      root: withDirMutated(s.root, path, (nodes) =>
        nodes.map((n) => (n.name === oldName ? { ...n, name: newName } : n)),
      ),
    })),
}));
