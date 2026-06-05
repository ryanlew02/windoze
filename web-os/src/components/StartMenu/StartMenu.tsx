import { useAppStore } from '../../store/useAppStore';
import { useWindowStore } from '../../store/useWindowStore';
import { useLockStore } from '../../store/useLockStore';
import styles from './StartMenu.module.css';

interface Props {
  onClose: () => void;
}

export function StartMenu({ onClose }: Props) {
  const apps = useAppStore((s) => s.apps);
  const openWindow = useWindowStore((s) => s.openWindow);

  function launch(appId: string) {
    const app = apps.find((a) => a.id === appId);
    if (!app) return;
    openWindow({
      id: `${appId}-${Date.now()}`,
      appId: app.id,
      title: app.title,
      icon: app.icon,
      x: 80,
      y: 60,
      width: 500,
      height: 380,
      isMinimized: false,
      isMaximized: false,
    });
    onClose();
  }

  const lock = useLockStore((s) => s.lock);

  return (
    <div className={styles.menu}>
      <div className={styles.header}>
        <span className={styles.osName}>DivergeOS</span>
      </div>
      <div className={styles.appList}>
        {apps.map((app) => (
          <button key={app.id} className={styles.appRow} onClick={() => launch(app.id)}>
            <span className={styles.appIcon}>{app.icon}</span>
            <span className={styles.appTitle}>{app.title}</span>
          </button>
        ))}
      </div>
      <div className={styles.footer}>
        <button className={styles.footerBtn} onClick={() => { lock(); onClose(); }}>🔒 Lock</button>
        <button className={styles.footerBtn} title="Power">⏻ Shut down</button>
      </div>
    </div>
  );
}
