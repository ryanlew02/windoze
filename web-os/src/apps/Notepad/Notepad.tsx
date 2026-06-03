import { useState } from 'react';
import styles from './Notepad.module.css';

export function NotepadApp() {
  const [text, setText] = useState('');

  return (
    <div className={styles.notepad}>
      <textarea
        className={styles.editor}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Start typing..."
        spellCheck={false}
      />
    </div>
  );
}
