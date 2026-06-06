import {
  BookOpen,
  Brain,
  Cable,
  Calculator,
  Crosshair,
  Crown,
  FileText,
  FolderOpen,
  Globe,
  ScrollText,
  SlidersHorizontal,
  Terminal,
} from 'lucide-react';

const SW = 1.5;

export const APP_ICONS: Record<string, React.ReactNode> = {
  'notepad':       <FileText          strokeWidth={SW} />,
  'calculator':    <Calculator        strokeWidth={SW} />,
  'files':         <FolderOpen        strokeWidth={SW} />,
  'aptitude-test': <Crosshair         strokeWidth={SW} />,
  'manifesto':     <ScrollText        strokeWidth={SW} />,
  'settings':      <SlidersHorizontal strokeWidth={SW} />,
  'fear-sim':      <Brain             strokeWidth={SW} />,
  'chess':         <Crown             strokeWidth={SW} />,
  'terminal':      <Terminal          strokeWidth={SW} />,
  'dictionary':    <BookOpen          strokeWidth={SW} />,
  'browser':       <Globe             strokeWidth={SW} />,
  'zipline':       <Cable             strokeWidth={SW} />,
};

export const APP_ICON_BG: Record<string, string> = {
  'notepad':       'linear-gradient(135deg, #1d4ed8, #60a5fa)',
  'calculator':    'linear-gradient(135deg, #4f46e5, #818cf8)',
  'files':         'linear-gradient(135deg, #b45309, #fbbf24)',
  'aptitude-test': 'linear-gradient(135deg, #991b1b, #f87171)',
  'manifesto':     'linear-gradient(135deg, #5b21b6, #c084fc)',
  'settings':      'linear-gradient(135deg, #1e293b, #64748b)',
  'fear-sim':      'linear-gradient(135deg, #7f1d1d, #dc2626)',
  'chess':         'linear-gradient(135deg, #0f172a, #475569)',
  'terminal':      'linear-gradient(135deg, #064e3b, #34d399)',
  'dictionary':    'linear-gradient(135deg, #0c4a6e, #38bdf8)',
  'browser':       'linear-gradient(135deg, #1e3a8a, #93c5fd)',
  'zipline':       'linear-gradient(135deg, #7c2d12, #fb923c)',
};
