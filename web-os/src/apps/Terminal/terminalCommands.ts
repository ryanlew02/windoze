import type { FsNode } from '../../store/useFsStore';
import { resolvePath, formatPath, getFolderAt, getNodeAt, isFolder } from './terminalFs';

// ── Types ─────────────────────────────────────────────────────────────────────

export type LineType = 'output' | 'error' | 'success' | 'input' | 'dir';

export interface TerminalLine {
  id: string;
  type: LineType;
  /** Raw text content. */
  text: string;
}

/** Actions that mutate the shared filesystem store. */
export interface FsActions {
  createNode: (path: string[], name: string, type: 'folder' | 'file') => void;
  deleteNode: (path: string[], name: string) => void;
  writeFile:  (path: string[], name: string, content: string) => void;
}

/** Everything a command needs to execute. */
export interface CmdContext {
  root:         Record<string, FsNode>;
  cwd:          string[];
  actions:      FsActions;
  /** Opens an OS app by alias; returns a display message. */
  openApp:      (alias: string) => string;
  /** Opens a file in Notepad; returns a display message. */
  openFile:     (path: string[], name: string) => string;
  /** App titles shown as icons on the desktop. */
  desktopApps?: string[];
}

export interface CmdResult {
  lines:   TerminalLine[];
  newCwd?: string[];   // set when cd changes directory
  clear?:  boolean;    // set by the `clear` command
}

// ── Internal helpers ──────────────────────────────────────────────────────────

let _id = 0;
const uid = () => String(++_id);

const out  = (text: string): TerminalLine => ({ id: uid(), type: 'output',  text });
const err  = (text: string): TerminalLine => ({ id: uid(), type: 'error',   text });
const dir  = (text: string): TerminalLine => ({ id: uid(), type: 'dir',     text });
const ok   = (text: string): TerminalLine => ({ id: uid(), type: 'success', text });

/** Split raw input into { cmd, args }. Handles multiple spaces. */
function parse(raw: string): { cmd: string; args: string[] } {
  const parts = raw.trim().split(/\s+/);
  return { cmd: (parts[0] ?? '').toLowerCase(), args: parts.slice(1) };
}

// ── Command implementations ───────────────────────────────────────────────────

function cmdHelp(): CmdResult {
  return {
    lines: [
      out('Available commands:'),
      out('  help              Show this message'),
      out('  clear             Clear the terminal'),
      out('  pwd               Print working directory'),
      out('  ls                List directory contents'),
      out('  cd <path>         Change directory  (cd .., cd /, cd ~)'),
      out('  mkdir <name>      Create a directory'),
      out('  touch <name>      Create an empty file'),
      out('  cat <file>        Print file contents'),
      out('  rm <file>         Delete a file'),
      out('  rmdir <dir>       Delete an empty directory'),
      out('  echo <text>       Print text'),
      out('  echo <t> > <f>    Write text to a file'),
      out('  date              Print current date and time'),
      out('  whoami            Print current user'),
      out('  open <app>        Open an OS application'),
      out('  edit <file>       Open a text file in Notepad'),
    ],
  };
}

function cmdPwd(cwd: string[]): CmdResult {
  return { lines: [out(formatPath(cwd) || '/')] };
}

function cmdLs(root: Record<string, FsNode>, cwd: string[], args: string[], ctx: CmdContext): CmdResult {
  const target = args[0] ? resolvePath(cwd, args[0]) : cwd;
  const node   = target.length === 0 ? { type: 'folder' as const, name: '/', children: root } : getNodeAt(root, target);

  if (!node)           return { lines: [err(`ls: cannot access '${args[0]}': no such file or directory`)] };
  if (!isFolder(node)) return { lines: [err(`ls: '${args[0]}': not a directory`)] };

  const folder  = node.children;
  const entries = Object.values(folder);

  // When listing Desktop, also include app icons that aren't stored in the fs
  const isDesktop = target.length === 1 && target[0] === 'Desktop';
  const appLines: TerminalLine[] = isDesktop && ctx.desktopApps
    ? ctx.desktopApps
        .filter((name) => !folder[name])
        .sort((a, b) => a.localeCompare(b))
        .map((name) => out(name))
    : [];

  if (entries.length === 0 && appLines.length === 0) return { lines: [out('(empty)')] };

  // Folders first, then files — each group sorted alphabetically
  const sorted = [
    ...entries.filter(isFolder).sort((a, b) => a.name.localeCompare(b.name)),
    ...entries.filter((n) => !isFolder(n)).sort((a, b) => a.name.localeCompare(b.name)),
  ];

  return {
    lines: [
      ...sorted.map((n) => isFolder(n) ? dir(n.name + '/') : out(n.name)),
      ...appLines,
    ],
  };
}

function cmdCd(root: Record<string, FsNode>, cwd: string[], args: string[]): CmdResult {
  // No argument → go home (root)
  const target = args[0] ?? '~';
  const resolved = resolvePath(cwd, target);

  // Root is always valid
  if (resolved.length === 0) return { lines: [], newCwd: [] };

  const node = getNodeAt(root, resolved);
  if (!node)             return { lines: [err(`cd: ${target}: no such file or directory`)] };
  if (!isFolder(node))   return { lines: [err(`cd: ${target}: not a directory`)] };

  return { lines: [], newCwd: resolved };
}

function cmdMkdir(root: Record<string, FsNode>, cwd: string[], args: string[], actions: FsActions): CmdResult {
  const name = args[0];
  if (!name) return { lines: [err('mkdir: missing operand')] };
  if (name.includes('/')) return { lines: [err('mkdir: nested paths not supported — cd first')] };

  const folder = getFolderAt(root, cwd);
  if (!folder) return { lines: [err('mkdir: cannot access current directory')] };
  if (folder[name]) return { lines: [err(`mkdir: cannot create directory '${name}': already exists`)] };

  actions.createNode(cwd, name, 'folder');
  return { lines: [] };
}

function cmdTouch(root: Record<string, FsNode>, cwd: string[], args: string[], actions: FsActions): CmdResult {
  const name = args[0];
  if (!name) return { lines: [err('touch: missing operand')] };
  if (name.includes('/')) return { lines: [err('touch: nested paths not supported — cd first')] };

  const folder = getFolderAt(root, cwd);
  if (!folder) return { lines: [err('touch: cannot access current directory')] };
  if (folder[name]) return { lines: [err(`touch: '${name}': file already exists`)] };

  actions.createNode(cwd, name, 'file');
  return { lines: [ok(`created ${name}`)] };
}

function cmdCat(root: Record<string, FsNode>, cwd: string[], args: string[]): CmdResult {
  const name = args[0];
  if (!name) return { lines: [err('cat: missing operand')] };

  const resolved = resolvePath(cwd, name);
  const node     = getNodeAt(root, resolved);

  if (!node)           return { lines: [err(`cat: ${name}: no such file or directory`)] };
  if (isFolder(node))  return { lines: [err(`cat: ${name}: is a directory`)] };
  if (!node.content)   return { lines: [out('(empty file)')] };

  return { lines: node.content.split('\n').map(out) };
}

function cmdRm(root: Record<string, FsNode>, cwd: string[], args: string[], actions: FsActions): CmdResult {
  const name = args[0];
  if (!name) return { lines: [err('rm: missing operand')] };

  const folder = getFolderAt(root, cwd);
  if (!folder) return { lines: [err('rm: cannot access current directory')] };

  const node = folder[name];
  if (!node)          return { lines: [err(`rm: cannot remove '${name}': no such file or directory`)] };
  if (isFolder(node)) return { lines: [err(`rm: cannot remove '${name}': is a directory — use rmdir`)] };

  actions.deleteNode(cwd, name);
  return { lines: [] };
}

function cmdRmdir(root: Record<string, FsNode>, cwd: string[], args: string[], actions: FsActions): CmdResult {
  const name = args[0];
  if (!name) return { lines: [err('rmdir: missing operand')] };

  const folder = getFolderAt(root, cwd);
  if (!folder) return { lines: [err('rmdir: cannot access current directory')] };

  const node = folder[name];
  if (!node)           return { lines: [err(`rmdir: '${name}': no such file or directory`)] };
  if (!isFolder(node)) return { lines: [err(`rmdir: '${name}': not a directory`)] };
  if (Object.keys(node.children).length > 0) {
    return { lines: [err(`rmdir: '${name}': directory not empty`)] };
  }

  actions.deleteNode(cwd, name);
  return { lines: [] };
}

function cmdEcho(_root: Record<string, FsNode>, cwd: string[], args: string[], actions: FsActions): CmdResult {
  // Detect redirect:  echo some text > filename
  const redirectIdx = args.indexOf('>');

  if (redirectIdx !== -1) {
    const text     = args.slice(0, redirectIdx).join(' ');
    const fileName = args[redirectIdx + 1];
    if (!fileName) return { lines: [err('echo: missing filename after \'>\'') ]};
    actions.writeFile(cwd, fileName, text);
    return { lines: [] };
  }

  return { lines: [out(args.join(' '))] };
}

function cmdDate(): CmdResult {
  return { lines: [out(new Date().toLocaleString())] };
}

function cmdEdit(root: Record<string, FsNode>, cwd: string[], args: string[], ctx: CmdContext): CmdResult {
  const target = args[0];
  if (!target) return { lines: [err('edit: missing filename')] };

  const resolved = resolvePath(cwd, target);
  if (resolved.length === 0) return { lines: [err('edit: cannot open root as a file')] };

  const node = getNodeAt(root, resolved);
  if (!node)           return { lines: [err(`edit: ${target}: no such file or directory`)] };
  if (isFolder(node))  return { lines: [err(`edit: ${target}: is a directory`)] };

  const dirPath  = resolved.slice(0, -1);
  const fileName = resolved[resolved.length - 1];
  const msg = ctx.openFile(dirPath, fileName);
  return { lines: [out(msg)] };
}

function cmdOpen(args: string[], ctx: CmdContext): CmdResult {
  const alias = args.join(' ').toLowerCase().trim();
  if (!alias) return { lines: [err('open: missing application name')] };
  const msg = ctx.openApp(alias);
  return { lines: [out(msg)] };
}

// ── Public entry point ────────────────────────────────────────────────────────

export function executeCommand(rawInput: string, ctx: CmdContext): CmdResult {
  const trimmed = rawInput.trim();
  if (!trimmed) return { lines: [] };

  const { cmd, args } = parse(trimmed);
  const { root, cwd, actions } = ctx;

  switch (cmd) {
    case 'help':    return cmdHelp();
    case 'clear':   return { lines: [], clear: true };
    case 'pwd':     return cmdPwd(cwd);
    case 'ls':      return cmdLs(root, cwd, args, ctx);
    case 'cd':      return cmdCd(root, cwd, args);
    case 'mkdir':   return cmdMkdir(root, cwd, args, actions);
    case 'touch':   return cmdTouch(root, cwd, args, actions);
    case 'cat':     return cmdCat(root, cwd, args);
    case 'rm':      return cmdRm(root, cwd, args, actions);
    case 'rmdir':   return cmdRmdir(root, cwd, args, actions);
    case 'echo':    return cmdEcho(root, cwd, args, actions);
    case 'date':    return cmdDate();
    case 'whoami':  return { lines: [out('Tobias Eaton')] };
    case 'edit':    return cmdEdit(root, cwd, args, ctx);
    case 'open':    return cmdOpen(args, ctx);
    default:
      return { lines: [err(`${cmd}: command not found`)] };
  }
}
