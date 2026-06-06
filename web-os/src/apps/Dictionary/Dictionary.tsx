import { useState, useMemo } from 'react';
import styles from './Dictionary.module.css';

interface Entry {
  term: string;
  definition: string;
}

const ENTRIES: Entry[] = [
  {
    term: 'Abnegation',
    definition:
      'One of the five factions, founded on the virtue of selflessness. Members wear plain grey clothing and are expected to suppress all self-interest. They serve as the city\'s governing body, distributing food and aid to the factionless.',
  },
  {
    term: 'Allegiant',
    definition:
      'A resistance group loyal to the original faction system established by the city\'s founders. They believe the founders\' mission must be fulfilled and oppose any attempt to dismantle the factions from within.',
  },
  {
    term: 'Amity',
    definition:
      'One of the five factions, founded on the virtue of kindness and peacefulness. Members live on agricultural compounds outside the city, farming the land that feeds all factions. They wear red and yellow and resolve conflict through a mediation process.',
  },
  {
    term: 'Aptitude Test',
    definition:
      'A serum-induced simulation administered to all sixteen-year-olds to assess which faction their personality is best suited for. Results suggest but do not determine faction choice — the final decision belongs entirely to the individual.',
  },
  {
    term: 'Bureau of Genetic Welfare',
    definition:
      'A government organization operating outside the city fence that oversees the faction experiment. They classify citizens as Genetically Pure (GP) or Genetically Damaged (GD) based on the outcomes of historical genetic manipulation, and monitor the city from afar.',
  },
  {
    term: 'Candor',
    definition:
      'One of the five factions, founded on the virtue of honesty. Members believe that dishonesty is the root of all conflict and practice radical transparency. They wear black and white, and their headquarters is located in the former Hall of Justice.',
  },
  {
    term: 'Chasm',
    definition:
      'A deep underground ravine running through the Dauntless compound. It serves as a constant symbol of the ever-present risk of death and the cost of recklessness. Initiates are warned to stay away from its edge — falls are rarely survived.',
  },
  {
    term: 'Choosing Ceremony',
    definition:
      'The annual public event at which sixteen-year-olds select the faction they will belong to for the rest of their lives. Each faction is represented by a bowl containing a symbolic substance: earth for Amity, water for Erudite, grey stones for Abnegation, lit coals for Dauntless, and glass for Candor.',
  },
  {
    term: 'Dauntless',
    definition:
      'One of the five factions, founded on the virtue of bravery. Members serve as the city\'s soldiers, guards, and police force. They wear black, are known for physical feats and train jumping, and maintain a culture of fearlessness — sometimes at reckless extremes.',
  },
  {
    term: 'Divergent',
    definition:
      'An individual whose aptitude test yields results pointing to more than one faction, rendering the result inconclusive. Divergents cannot be fully controlled by serums and can consciously manipulate simulations, making them a perceived threat to those who rely on serum-based control.',
  },
  {
    term: 'Erudite',
    definition:
      'One of the five factions, founded on the virtue of intelligence. Members wear blue and dedicate their lives to the acquisition and application of knowledge. They develop the serums used in aptitude tests and simulations, and produce most of the city\'s technology and record-keeping.',
  },
  {
    term: 'Faction',
    definition:
      'One of the five social divisions that organize the city\'s population, each built around a single core virtue: Abnegation (selflessness), Amity (kindness), Candor (honesty), Dauntless (bravery), and Erudite (intelligence). Citizens are expected to devote their entire lives to their faction\'s values.',
  },
  {
    term: 'Faction before blood',
    definition:
      'The city\'s central social maxim, declaring that loyalty to one\'s faction supersedes loyalty to one\'s family. It is spoken — implicitly or aloud — whenever an initiate chooses a different faction from the one they were raised in, severing family ties in the process.',
  },
  {
    term: 'Factionless',
    definition:
      'Citizens who have failed initiation, abandoned their faction, or been expelled. They live in poverty on the outskirts of the city, performing the lowest-wage labor. They receive aid from Abnegation and are largely invisible to the rest of society, forming a growing underclass.',
  },
  {
    term: 'Fear Landscape',
    definition:
      'A simulation used in the final stage of Dauntless initiation that simultaneously projects all of an individual\'s fears. Initiates must confront and move through each fear while the simulation is active. A smaller number of fears is generally regarded as a mark of courage.',
  },
  {
    term: 'Genetically Damaged (GD)',
    definition:
      'A classification used by the Bureau of Genetic Welfare for individuals whose genes are considered altered or "damaged" as a result of the Purity War — a historical conflict caused by attempts to engineer out undesirable human traits. GDs have lower social status within the Bureau.',
  },
  {
    term: 'Genetically Pure (GP)',
    definition:
      'A classification used by the Bureau of Genetic Welfare for individuals whose genes have not been altered and are considered intact. GPs are afforded more privilege and status within the Bureau\'s compound, a distinction that causes significant tension.',
  },
  {
    term: 'Hub',
    definition:
      'The skyscraper at the center of the city that serves as Dauntless headquarters. Members ride zip lines from its roof and jump from passing trains to reach it. The building is a landmark of Dauntless culture and a symbol of their indifference to danger.',
  },
  {
    term: 'Initiation',
    definition:
      'The multi-stage process through which new faction members earn full membership. Each faction\'s initiation is designed to test and reinforce the core virtue the faction is built around. Failure to complete initiation results in becoming factionless.',
  },
  {
    term: 'Manifesto',
    definition:
      'A founding document that articulates the core beliefs and values of a faction, written by its founders. Each faction has its own manifesto that members are expected to internalize. Manifestos are often posted publicly and recited at ceremonies.',
  },
  {
    term: 'Pit',
    definition:
      'The central gathering space within the Dauntless underground compound — a large cavern containing a marketplace, training areas, a dining hall, and social spaces carved into the rock. It serves as the heart of daily Dauntless life.',
  },
  {
    term: 'Purity War',
    definition:
      'A historical conflict that preceded the faction system, triggered by attempts to genetically engineer human populations to remove traits considered undesirable — such as cowardice, dishonesty, and selfishness. The war caused widespread devastation and led to the creation of the faction experiment as a corrective measure.',
  },
  {
    term: 'Serum',
    definition:
      'A chemical compound developed primarily by Erudite that can be injected or inhaled to induce simulations, alter emotions, or override voluntary behavior. Different formulations serve different purposes — from aptitude testing to battlefield mind control. Divergents are often fully or partially resistant to their effects.',
  },
  {
    term: 'Simulation',
    definition:
      'A drug-induced hallucination generated by Erudite serums in which participants experience a reality indistinguishable from the actual world. Used in aptitude tests, Dauntless initiation, and — when weaponized — as a mechanism for mass behavioral control.',
  },
  {
    term: 'Stiff',
    definition:
      'A derogatory slang term used within Dauntless to refer to transfers from Abnegation, referencing the faction\'s rigid, self-denying lifestyle. Transfers from Abnegation are frequent targets of mockery during initiation for their unfamiliarity with Dauntless culture.',
  },
  {
    term: 'Transfer',
    definition:
      'An initiate who has left their birth faction to join a new one at the Choosing Ceremony, as opposed to a Dauntless-born member who grew up within the faction. Transfers must complete the same initiation as born members but often face additional cultural barriers and suspicion.',
  },
  {
    term: 'Truth Serum',
    definition:
      'A serum developed and used primarily by Candor to compel honest testimony during legal proceedings and interrogations. It removes the psychological barrier against dishonesty, making deception nearly impossible under its influence — though Divergents can sometimes resist or suppress its effects.',
  },
  {
    term: 'Zip Line',
    definition:
      'A high-speed descent line running from the roof of the Hub to the streets of the city far below. Riding it is a celebrated Dauntless tradition and a symbolic act of fearlessness, often one of the first experiences offered to initiates entering Dauntless culture.',
  },
];

ENTRIES.sort((a, b) => a.term.localeCompare(b.term));

function groupByLetter(entries: Entry[]): Map<string, Entry[]> {
  const map = new Map<string, Entry[]>();
  for (const e of entries) {
    const letter = e.term[0].toUpperCase();
    if (!map.has(letter)) map.set(letter, []);
    map.get(letter)!.push(e);
  }
  return map;
}

export function DictionaryApp() {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ENTRIES;
    return ENTRIES.filter(
      (e) =>
        e.term.toLowerCase().includes(q) ||
        e.definition.toLowerCase().includes(q),
    );
  }, [query]);

  // Auto-expand all entries when searching so results are immediately visible
  const displayExpanded = useMemo(() => {
    if (!query.trim()) return expanded;
    const all = new Set(filtered.map((e) => e.term));
    return all;
  }, [query, filtered, expanded]);

  const grouped = useMemo(() => groupByLetter(filtered), [filtered]);
  const letters = Array.from(grouped.keys()).sort();

  function toggle(term: string) {
    if (query.trim()) return; // search overrides manual toggle
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(term)) next.delete(term);
      else next.add(term);
      return next;
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>📖</span>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Divergent Dictionary</h1>
          <p className={styles.subtitle}>Terms &amp; Definitions from the Five Factions</p>
        </div>
      </div>

      <div className={styles.searchRow}>
        <input
          className={styles.search}
          type="text"
          placeholder="Search terms or definitions…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button className={styles.clearBtn} onClick={() => setQuery('')}>✕</button>
        )}
      </div>

      <div className={styles.list}>
        {letters.length === 0 ? (
          <p className={styles.empty}>No results for "{query}"</p>
        ) : (
          letters.map((letter) => (
            <div key={letter}>
              <div className={styles.letterHeading}>{letter}</div>
              {grouped.get(letter)!.map((entry) => {
                const isOpen = displayExpanded.has(entry.term);
                return (
                  <div
                    key={entry.term}
                    className={`${styles.entry} ${isOpen ? styles.entryOpen : ''}`}
                    onClick={() => toggle(entry.term)}
                  >
                    <div className={styles.termRow}>
                      <span className={styles.term}>{entry.term}</span>
                      <span className={styles.chevron}>{isOpen ? '▾' : '▸'}</span>
                    </div>
                    {isOpen && (
                      <div className={styles.definition}>{entry.definition}</div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
