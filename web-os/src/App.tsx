import { useEffect } from 'react';
import { Desktop } from './components/Desktop/Desktop';
import { Taskbar } from './components/Taskbar/Taskbar';
import { LockScreen } from './components/LockScreen/LockScreen';
import { useThemeStore } from './store/useThemeStore';
import { useLockStore } from './store/useLockStore';
import { factions } from './themes/factions';

export default function App() {
  const factionId = useThemeStore((s) => s.factionId);
  const isLocked  = useLockStore((s) => s.isLocked);

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
      {isLocked && <LockScreen />}
    </>
  );
}
