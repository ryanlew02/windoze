import { useAppStore } from '../../store/useAppStore';
import { useWindowStore } from '../../store/useWindowStore';
import { AppIcon } from '../AppIcon/AppIcon';
import { Window } from '../Window/Window';
import styles from './Desktop.module.css';

export function Desktop() {
  const apps = useAppStore((s) => s.apps);
  const { windows, openWindow } = useWindowStore();

  function launch(appId: string) {
    const app = apps.find((a) => a.id === appId);
    if (!app) return;
    openWindow({
      id: `${appId}-${Date.now()}`,
      appId: app.id,
      title: app.title,
      icon: app.icon,
      x: 100 + Math.random() * 120,
      y: 60 + Math.random() * 80,
      width: 520,
      height: 400,
      isMinimized: false,
      isMaximized: false,
    });
  }

  return (
    <div className={styles.desktop}>
      <div className={styles.icons}>
        {apps.map((app) => (
          <AppIcon key={app.id} app={app} onClick={() => launch(app.id)} />
        ))}
      </div>

      {windows.map((win) => {
        const app = apps.find((a) => a.id === win.appId);
        if (!app) return null;
        const AppComponent = app.component;
        return (
          <Window key={win.id} win={win}>
            <AppComponent />
          </Window>
        );
      })}
    </div>
  );
}
