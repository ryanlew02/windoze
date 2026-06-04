import { create } from 'zustand';

const DEFAULT_PASSWORD = 'insurgent';
const getPassword = () => localStorage.getItem('os-password') ?? DEFAULT_PASSWORD;

interface LockStore {
  isLocked: boolean;
  lock: () => void;
  unlock: () => void;
  checkPassword: (input: string) => boolean;
  changePassword: (current: string, next: string) => boolean;
}

export const useLockStore = create<LockStore>(() => ({
  isLocked: true,
  lock:   () => useLockStore.setState({ isLocked: true }),
  unlock: () => useLockStore.setState({ isLocked: false }),
  checkPassword: (input) => input === getPassword(),
  changePassword: (current, next) => {
    if (current !== getPassword()) return false;
    localStorage.setItem('os-password', next);
    return true;
  },
}));
