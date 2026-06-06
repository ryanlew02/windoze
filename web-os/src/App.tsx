import { useEffect, useState } from 'react';
import { Desktop } from './components/Desktop/Desktop';
import { Taskbar } from './components/Taskbar/Taskbar';
import { LockScreen } from './components/LockScreen/LockScreen';
import { Notifications } from './components/Notifications/Notifications';
import { BootScreen } from './components/BootScreen/BootScreen';
import { MobileFallback } from './components/MobileFallback/MobileFallback';
import { useThemeStore } from './store/useThemeStore';
import { useLockStore } from './store/useLockStore';
import { useWindowStore } from './store/useWindowStore';
import { useProfileStore } from './store/useProfileStore';
import { useIconStore } from './store/useIconStore';
import { factions } from './themes/factions';

export default function App() {
  const factionId         = useThemeStore((s) => s.factionId);
  const isLocked          = useLockStore((s) => s.isLocked);
  const [booting, setBooting] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Apply saved icon positions from the active profile on mount
  // (useIconStore has no persistence of its own)
  useEffect(() => {
    const { slots, activeSlot } = useProfileStore.getState();
    const profile = slots[activeSlot];
    useIconStore.getState().load(profile.iconPositions, profile.iconLabels);
  }, []);

  useEffect(() => {
    const faction = factions.find((f) => f.id === factionId) ?? factions[0];
    const root = document.documentElement;
    Object.entries(faction.vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [factionId]);

  useEffect(() => {
    function clearSelection(e: MouseEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
        window.getSelection()?.removeAllRanges();
      }
    }
    document.addEventListener('mousedown', clearSelection);
    return () => document.removeEventListener('mousedown', clearSelection);
  }, []);

  useEffect(() => {
    function handleAltF4(e: KeyboardEvent) {
      if (e.altKey && e.key === 'F4') {
        e.preventDefault();
        const focused = useWindowStore.getState().windows.find((w) => w.isFocused && !w.isClosing);
        if (focused) useWindowStore.getState().closeWindow(focused.id);
      }
    }
    document.addEventListener('keydown', handleAltF4);
    return () => document.removeEventListener('keydown', handleAltF4);
  }, []);

  if (isMobile) return <MobileFallback />;

  return (
    <>
      <Desktop />
      <Taskbar />
      {isLocked && <LockScreen />}
      <Notifications />
      {booting && <BootScreen onDone={() => setBooting(false)} />}
    </>
  );
}
