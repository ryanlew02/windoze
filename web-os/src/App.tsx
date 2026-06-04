import { useEffect } from 'react';
import { Desktop } from './components/Desktop/Desktop';
import { Taskbar } from './components/Taskbar/Taskbar';
import { useThemeStore } from './store/useThemeStore';
import { factions } from './themes/factions';

export default function App() {
  const factionId = useThemeStore((s) => s.factionId);

  useEffect(() => {
    const faction = factions.find((f) => f.id === factionId)!;
    const root = document.documentElement;
    Object.entries(faction.vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [factionId]);

  return (
    <>
      <Desktop />
      <Taskbar />
    </>
  );
}
