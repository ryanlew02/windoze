import { useEffect, useRef, useState } from 'react';
import { useNotificationStore, type AppNotification } from '../../store/useNotificationStore';
import { playNotification } from '../../audio/sounds';
import { playSound } from '../../store/useSoundStore';
import styles from './Notifications.module.css';

const DURATION = 3000;

function NotificationCard({ notif }: { notif: AppNotification }) {
  const dismiss = useNotificationStore((s) => s.dismiss);
  const [leaving, setLeaving] = useState(false);

  function close() {
    setLeaving(true);
    setTimeout(() => dismiss(notif.id), 280);
  }

  useEffect(() => {
    const t = setTimeout(close, DURATION);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notif.id]);

  return (
    <div className={`${styles.card} ${leaving ? styles.leaving : ''}`}>
      <div className={styles.header}>
        <span className={styles.icon}>{notif.icon}</span>
        <span className={styles.title}>{notif.title}</span>
        <button className={styles.close} onClick={close} aria-label="Dismiss">✕</button>
      </div>
      <p className={styles.message}>{notif.message}</p>
      <div className={styles.bar} style={{ animationDuration: `${DURATION}ms` }} />
    </div>
  );
}

export function Notifications() {
  const items   = useNotificationStore((s) => s.items);
  const prevLen = useRef(items.length);

  useEffect(() => {
    if (items.length > prevLen.current) playSound(playNotification);
    prevLen.current = items.length;
  }, [items.length]);

  return (
    <div className={styles.container}>
      {items.map((n) => (
        <NotificationCard key={n.id} notif={n} />
      ))}
    </div>
  );
}
