import { useState, useEffect } from 'react';
import styles from './FactionBroadcast.module.css';

const ANNOUNCEMENTS = [
  'Abnegation food distribution today at Sector 7 — all factionless welcome.',
  'Abnegation reminds citizens: selflessness is not weakness. It is the highest form of strength.',
  'Aid packages from Abnegation will be delivered to the factionless corridor at dusk.',
  'Erudite announces: the quarterly intelligence assessment results are now available.',
  'Erudite research bulletin: serum compound 7-B has entered final trials.',
  'Erudite reminds all citizens: ignorance is not innocence. Seek knowledge.',
  'New Erudite publication: "The Failure of Abnegation Leadership" — available at all distribution points.',
  'Dauntless training exercise in Sector 3 — civilians advised to clear the perimeter.',
  'Dauntless compound: initiates report to the Pit for rankings at 0600.',
  'Dauntless patrol units rotating to the outer fence. All clear reported.',
  'Dauntless zip line reopened following scheduled maintenance.',
  'Candor truth hearing scheduled for 14:00 — all testimony is binding.',
  'Candor reminds all factions: dishonesty is the origin of all conflict.',
  'Candor public record updated. All faction transfers logged and verified.',
  'Amity harvest festival begins at sundown — all factions welcome to attend.',
  'Amity reports record crop yields this season. Surplus distributed to all sectors.',
  'Choosing Ceremony preparations underway — all sixteen-year-olds report to registration.',
  'City transport: train routes 4 and 7 are operating on modified schedules today.',
  'Reminder: faction loyalty is not a suggestion. Faction before blood.',
  'The city fence perimeter is secure. No anomalies detected.',
  'Bureau of Genetic Welfare advisory: compliance monitoring is active in all sectors.',
  'Aptitude test results for this cycle are being processed. Results in 72 hours.',
  'All initiates: final rankings will be posted at the end of the week.',
  'Citywide curfew reminder: factionless corridors close at 22:00.',
  'Surveillance advisory: unusual activity detected near the outer sectors. Investigating.',
  'Security notice: an unregistered individual was observed near the Hub. Report any sightings.',
  'All citizens are reminded that faction reassignment requests are non-negotiable once filed.',
  'Amity peace committee meeting postponed indefinitely pending inter-faction review.',
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const DURATION = 16000;

export function FactionBroadcast() {
  const [queue, setQueue]   = useState<string[]>(() => shuffle(ANNOUNCEMENTS));
  const [idx, setIdx]       = useState(0);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((prev) => {
        const next = prev + 1;
        if (next >= queue.length) {
          setQueue(shuffle(ANNOUNCEMENTS));
          return 0;
        }
        return next;
      });
      setAnimKey((k) => k + 1);
    }, DURATION);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>BROADCAST</span>
      <div className={styles.ticker}>
        <span key={animKey} className={styles.text}>
          {queue[idx]}
        </span>
      </div>
    </div>
  );
}
