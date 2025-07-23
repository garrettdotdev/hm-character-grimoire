import { create } from 'zustand';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
  timestamp: number;
}

interface NotificationState {
  notifications: Notification[];
}

interface NotificationActions {
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  // Convenience methods
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>((set) => ({
  // State
  notifications: [],

  // Actions
  addNotification: (notification) => {
    const id = crypto.randomUUID();
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto-remove after duration
    if (notification.duration !== 0) {
      const duration = notification.duration || 5000;
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, duration);
    }
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },

  // Convenience methods
  showSuccess: (message, duration) => {
    set((state) => {
      state.addNotification({ message, type: 'success', duration });
      return state;
    });
  },

  showError: (message, duration) => {
    set((state) => {
      state.addNotification({ message, type: 'error', duration });
      return state;
    });
  },

  showWarning: (message, duration) => {
    set((state) => {
      state.addNotification({ message, type: 'warning', duration });
      return state;
    });
  },

  showInfo: (message, duration) => {
    set((state) => {
      state.addNotification({ message, type: 'info', duration });
      return state;
    });
  },
}));
