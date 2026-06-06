import { useState, KeyboardEvent } from 'react';
import styles from './Browser.module.css';

const DISCLAIMER_KEY = 'browser-disclaimer-dismissed';

const BOOKMARKS = [
  { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Main_Page' },
  { label: 'Gutenberg',   url: 'https://www.gutenberg.org' },
  { label: 'Archive',   url: 'https://archive.org' },
];

type Status = 'idle' | 'loading' | 'blocked' | 'error';

export function BrowserApp() {
  const [input, setInput]     = useState('');
  const [src, setSrc]         = useState('');
  const [status, setStatus]   = useState<Status>('idle');
  const [history, setHistory]       = useState<string[]>([]);
  const [histIdx, setHistIdx]       = useState(-1);
  const [showDisclaimer, setShowDisclaimer] = useState(
    () => localStorage.getItem(DISCLAIMER_KEY) !== 'true',
  );
  function dismissDisclaimer() {
    localStorage.setItem(DISCLAIMER_KEY, 'true');
    setShowDisclaimer(false);
  }

  function normalise(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (/^[\w-]+\.[\w.-]+(\/|$)/.test(trimmed)) return `https://${trimmed}`;
    return `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(trimmed)}`;
  }

  function navigate(url: string) {
    if (!url) return;
    setStatus('loading');
    setSrc(url);
    setInput(url);
    setHistory((prev) => {
      const trimmed = prev.slice(0, histIdx + 1);
      const next    = [...trimmed, url];
      setHistIdx(next.length - 1);
      return next;
    });
  }

  function go() {
    const url = normalise(input);
    if (url) navigate(url);
  }

  function goBack() {
    if (histIdx <= 0) return;
    const newIdx = histIdx - 1;
    setHistIdx(newIdx);
    const url = history[newIdx];
    setSrc(url);
    setInput(url);
    setStatus('loading');
  }

  function goForward() {
    if (histIdx >= history.length - 1) return;
    const newIdx = histIdx + 1;
    setHistIdx(newIdx);
    const url = history[newIdx];
    setSrc(url);
    setInput(url);
    setStatus('loading');
  }

  function reload() {
    if (!src) return;
    const current = src;
    setSrc('');
    setStatus('loading');
    setTimeout(() => setSrc(current), 50);
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') go();
  }

  function handleLoad() {
    setStatus('idle');
  }

  function handleError() {
    setStatus('error');
  }

  const canBack    = histIdx > 0;
  const canForward = histIdx < history.length - 1;

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button
          className={styles.navBtn}
          onClick={goBack}
          disabled={!canBack}
          title="Back"
        >
          ‹
        </button>
        <button
          className={styles.navBtn}
          onClick={goForward}
          disabled={!canForward}
          title="Forward"
        >
          ›
        </button>
        <button
          className={styles.navBtn}
          onClick={reload}
          disabled={!src}
          title="Reload"
        >
          ↺
        </button>

        <div className={styles.urlBarWrap}>
          {status === 'loading' && <span className={styles.spinner} />}
          <input
            className={styles.urlBar}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Enter URL or search…"
            spellCheck={false}
          />
        </div>

        <button className={styles.goBtn} onClick={go}>Go</button>
      </div>

      {/* Bookmarks bar */}
      <div className={styles.bookmarksBar}>
        {BOOKMARKS.map((bm) => (
          <button
            key={bm.url}
            className={styles.bookmark}
            onClick={() => navigate(bm.url)}
          >
            {bm.label}
          </button>
        ))}
      </div>

      {/* First-run disclaimer */}
      {showDisclaimer && (
        <div className={styles.disclaimerOverlay}>
          <div className={styles.disclaimerCard}>
            <div className={styles.disclaimerIcon}>🌐</div>
            <h2 className={styles.disclaimerTitle}>Browser Limitations</h2>
            <p className={styles.disclaimerBody}>
              This browser runs inside an iframe, which means most major websites
              — Google, YouTube, Reddit, social media — will refuse to load.
              They block embedding by design.
            </p>
            <p className={styles.disclaimerBody}>
              Sites that <strong>do</strong> work include Wikipedia, MDN Docs,
              and Archive.org. These are pre-loaded in the bookmarks bar for you.
            </p>
            <button className={styles.disclaimerBtn} onClick={dismissDisclaimer}>
              Got it — don't show again
            </button>
          </div>
        </div>
      )}

      {/* Viewport */}
      <div className={styles.viewport}>
        {status === 'idle' && !src && (
          <div className={styles.startPage}>
            <div className={styles.startIcon}>🌐</div>
            <p className={styles.startTitle}>Browser</p>
            <p className={styles.startSub}>Enter a URL or search above to get started.</p>
            <p className={styles.startNote}>
              Note: many sites block embedding. Wikipedia, MDN, and Archive.org work well.
            </p>
          </div>
        )}

        {status === 'blocked' && (
          <div className={styles.blocked}>
            <div className={styles.blockedIcon}>🚫</div>
            <p className={styles.blockedTitle}>Site blocked embedding</p>
            <p className={styles.blockedSub}>{src}</p>
            <p className={styles.blockedNote}>
              This site uses X-Frame-Options or CSP to prevent iframe loading.
              Try Wikipedia, MDN, or Archive.org instead.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className={styles.blocked}>
            <div className={styles.blockedIcon}>⚠️</div>
            <p className={styles.blockedTitle}>Could not load page</p>
            <p className={styles.blockedSub}>{src}</p>
          </div>
        )}

        {src && status !== 'blocked' && (
          <iframe
            className={styles.iframe}
            src={src}
            title="browser"
            onLoad={handleLoad}
            onError={handleError}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        )}
      </div>
    </div>
  );
}
