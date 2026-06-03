import { useState } from 'react';
import styles from './Calculator.module.css';

const BUTTONS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
];

export function CalculatorApp() {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<string | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(false);

  function handleBtn(btn: string) {
    if (btn === 'C') { setDisplay('0'); setPrev(null); setOp(null); setFresh(false); return; }
    if (btn === '±') { setDisplay(String(-parseFloat(display))); return; }
    if (btn === '%') { setDisplay(String(parseFloat(display) / 100)); return; }

    if (['÷', '×', '−', '+'].includes(btn)) {
      setPrev(display);
      setOp(btn);
      setFresh(true);
      return;
    }

    if (btn === '=') {
      if (prev === null || op === null) return;
      const a = parseFloat(prev), b = parseFloat(display);
      const result = op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b;
      setDisplay(String(result));
      setPrev(null);
      setOp(null);
      setFresh(false);
      return;
    }

    if (btn === '.') {
      if (display.includes('.')) return;
      setDisplay(display + '.');
      return;
    }

    if (fresh || display === '0') {
      setDisplay(btn);
      setFresh(false);
    } else {
      setDisplay(display.length < 12 ? display + btn : display);
    }
  }

  return (
    <div className={styles.calc}>
      <div className={styles.display}>
        <span className={styles.opLabel}>{op ?? ''}</span>
        <span className={styles.value}>{display}</span>
      </div>
      <div className={styles.grid}>
        {BUTTONS.flat().map((btn, i) => (
          <button
            key={i}
            className={`${styles.btn} ${['÷','×','−','+','='].includes(btn) ? styles.op : ''} ${btn === '0' ? styles.wide : ''}`}
            onClick={() => handleBtn(btn)}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
}
