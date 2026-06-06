import styles from './MobileFallback.module.css';

export function MobileFallback() {
  return (
    <div className={styles.container}>
      <div className={styles.symbol}>✦</div>
      <h1 className={styles.title}>DivergeOS</h1>
      <p className={styles.message}>DivergeOS requires a desktop browser.</p>
      <p className={styles.sub}>Rotate your device or open on a wider screen.</p>
    </div>
  );
}
