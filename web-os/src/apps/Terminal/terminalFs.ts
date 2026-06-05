import type { FsNode, FsFolder } from '../../store/useFsStore';

// ── Path utilities ────────────────────────────────────────────────────────────

/**
 * Resolves a path string relative to cwd into an absolute path array.
 *
 * Special forms:
 *   ~  or  /  → root  ([])
 *   ..         → parent
 *   .          → current (no-op)
 *   foo/bar    → relative
 *   /foo/bar   → absolute
 */
export function resolvePath(cwd: string[], pathStr: string): string[] {
  if (pathStr === '~' || pathStr === '/') return [];

  let segments: string[];
  if (pathStr.startsWith('/')) {
    segments = pathStr.split('/').filter(Boolean);
  } else {
    segments = [...cwd, ...pathStr.split('/').filter(Boolean)];
  }

  const resolved: string[] = [];
  for (const seg of segments) {
    if (seg === '.') continue;
    if (seg === '..') { resolved.pop(); }
    else              { resolved.push(seg); }
  }
  return resolved;
}

/** Format a path array as a Unix-style string: [] → '/', ['a','b'] → '/a/b' */
export function formatPath(path: string[]): string {
  return '/' + path.join('/');
}

// ── Tree accessors ────────────────────────────────────────────────────────────

/**
 * Returns the Record<name, FsNode> at the given path, or null if the path
 * doesn't exist or points to a file.  [] returns the root record.
 */
export function getFolderAt(
  root: Record<string, FsNode>,
  path: string[],
): Record<string, FsNode> | null {
  let current: Record<string, FsNode> = root;
  for (const seg of path) {
    const node = current[seg];
    if (!node || node.type !== 'folder') return null;
    current = node.children;
  }
  return current;
}

/**
 * Returns the FsNode at the given absolute path array, or null if not found.
 * An empty path array corresponds to the root (which has no single FsNode), so
 * it also returns null — use getFolderAt([]) for the root's contents.
 */
export function getNodeAt(
  root: Record<string, FsNode>,
  path: string[],
): FsNode | null {
  if (path.length === 0) return null;
  const dir = getFolderAt(root, path.slice(0, -1));
  if (!dir) return null;
  return dir[path[path.length - 1]] ?? null;
}

/** Type guard — narrows FsNode to FsFolder. */
export function isFolder(node: FsNode): node is FsFolder {
  return node.type === 'folder';
}
