import styles from './AppIcon.module.css';
import type { AppDefinition } from '../../types';

interface Props {
  app: AppDefinition;
  onClick: () => void;
}

export function AppIcon({ app, onClick }: Props) {
  return (
    <button className={styles.icon} onDoubleClick={onClick} title={app.title}>
      <span className={styles.emoji}>{app.icon}</span>
      <span className={styles.label}>{app.title}</span>
    </button>
  );
}
