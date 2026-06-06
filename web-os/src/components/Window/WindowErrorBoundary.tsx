import { Component, type ReactNode } from 'react';
import styles from './Window.module.css';

interface Props { children: ReactNode }
interface State { error: Error | null }

export class WindowErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className={styles.errorState}>
          <span className={styles.errorIcon}>⚠</span>
          <p className={styles.errorMsg}>Application crashed</p>
          <p className={styles.errorDetail}>{this.state.error.message}</p>
          <button
            className={styles.errorRetry}
            onClick={() => this.setState({ error: null })}
          >
            Restart App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
