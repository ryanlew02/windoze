import styles from './AppIcon.module.css';
import type { AppDefinition } from '../../types/index';

interface Props {
  app: AppDefinition;
  onClick: () => void;
  selected?: boolean;
}

export function AppIcon({ app, onClick, selected }: Props) {
  return (
    <button
      className={`${styles.icon} ${selected ? styles.selected : ''}`}
      onDoubleClick={onClick}
      title={app.title}
    >
      <span className={styles.tile} style={{ background: app.iconBg }}>
        <span className={styles.emoji}>{app.icon}</span>
      </span>
      <span className={styles.label}>{app.title}</span>
    </button>
  );
}
