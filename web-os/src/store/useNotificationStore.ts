import { create } from 'zustand';

export interface AppNotification {
  id: string;
  icon: string;
  title: string;
  message: string;
}

interface NotificationStore {
  items: AppNotification[];
  push: (n: Omit<AppNotification, 'id'>) => void;
  dismiss: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  items: [],
  push: (n) =>
    set((s) => ({
      items: [...s.items, { ...n, id: `notif-${Date.now()}-${Math.random()}` }],
    })),
  dismiss: (id) =>
    set((s) => ({ items: s.items.filter((n) => n.id !== id) })),
}));
