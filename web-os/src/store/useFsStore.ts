import { create } from 'zustand';

// ── Types ────────────────────────────────────────────────────────────────────

export type FsFile = {
  type: 'file';
  name: string;
  content: string;
};

// FsFolder references FsNode, which is defined below — TypeScript resolves
// recursive type aliases lazily so this is valid.
export interface FsFolder {
  type: 'folder';
  name: string;
  children: Record<string, FsNode>;
}

export type FsNode = FsFile | FsFolder;

// ── Immutable tree helper ─────────────────────────────────────────────────────

/**
 * Returns a new root with the folder at `path` replaced by `mutate(folder)`.
 * Does nothing if any segment along the path is missing or is a file.
 */
function withDirMutated(
  nodes: Record<string, FsNode>,
  path: string[],
  mutate: (nodes: Record<string, FsNode>) => Record<string, FsNode>,
): Record<string, FsNode> {
  if (path.length === 0) return mutate(nodes);
  const seg = path[0];
  const node = nodes[seg];
  if (!node || node.type !== 'folder') return nodes;
  return {
    ...nodes,
    [seg]: {
      ...node,
      children: withDirMutated(node.children, path.slice(1), mutate),
    },
  };
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface FsState {
  root: Record<string, FsNode>;

  /** Create a file or folder. Silently no-ops if the name already exists. */
  createNode: (path: string[], name: string, type: 'folder' | 'file') => void;

  /** Delete a node by name. */
  deleteNode: (path: string[], name: string) => void;

  /** Rename a node. No-ops if oldName doesn't exist or newName is taken. */
  renameNode: (path: string[], oldName: string, newName: string) => void;

  /** Create or overwrite a file with content. */
  writeFile: (path: string[], name: string, content: string) => void;
}

export const useFsStore = create<FsState>((set) => ({
  root: {
    Desktop: {
      type: 'folder',
      name: 'Desktop',
      children: {},
    },
    Documents: {
      type: 'folder',
      name: 'Documents',
      children: {
        'resume.pdf': { type: 'file', name: 'resume.pdf', content: '' },
        'notes.txt': {
          type: 'file',
          name: 'notes.txt',
          content: 'Welcome to Notepad!\n\nEdit this file or create a new one.',
        },
      },
    },
    Pictures: {
      type: 'folder',
      name: 'Pictures',
      children: {
        'photo.png': { type: 'file', name: 'photo.png', content: '' },
      },
    },
    Programs: {
      type: 'folder',
      name: 'Programs',
      children: {
        'Notepad.exe':       { type: 'file', name: 'Notepad.exe',       content: '' },
        'Calculator.exe':    { type: 'file', name: 'Calculator.exe',    content: '' },
        'Files.exe':         { type: 'file', name: 'Files.exe',         content: '' },
        'Terminal.exe':      { type: 'file', name: 'Terminal.exe',      content: '' },
        'Chess.exe':         { type: 'file', name: 'Chess.exe',         content: '' },
        'Settings.exe':      { type: 'file', name: 'Settings.exe',      content: '' },
        'Manifesto.exe':     { type: 'file', name: 'Manifesto.exe',     content: '' },
        'AptitudeTest.exe':  { type: 'file', name: 'AptitudeTest.exe',  content: '' },
        'FearSimulation.exe':{ type: 'file', name: 'FearSimulation.exe',content: '' },
        'Dictionary.exe':    { type: 'file', name: 'Dictionary.exe',    content: '' },
      },
    },
    'readme.md': { type: 'file', name: 'readme.md', content: '' },
  },

  createNode: (path, name, type) =>
    set((s) => ({
      root: withDirMutated(s.root, path, (nodes) => {
        if (nodes[name]) return nodes;
        return {
          ...nodes,
          [name]:
            type === 'folder'
              ? { type: 'folder', name, children: {} }
              : { type: 'file', name, content: '' },
        };
      }),
    })),

  deleteNode: (path, name) =>
    set((s) => ({
      root: withDirMutated(s.root, path, (nodes) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [name]: _removed, ...rest } = nodes;
        return rest;
      }),
    })),

  renameNode: (path, oldName, newName) =>
    set((s) => ({
      root: withDirMutated(s.root, path, (nodes) => {
        if (!nodes[oldName] || nodes[newName]) return nodes;
        const renamed = { ...nodes[oldName], name: newName };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [oldName]: _removed, ...rest } = nodes;
        return { ...rest, [newName]: renamed };
      }),
    })),

  writeFile: (path, name, content) =>
    set((s) => ({
      root: withDirMutated(s.root, path, (nodes) => {
        const existing = nodes[name];
        if (existing && existing.type === 'file') {
          return { ...nodes, [name]: { ...existing, content } };
        }
        return { ...nodes, [name]: { type: 'file', name, content } };
      }),
    })),
}));
