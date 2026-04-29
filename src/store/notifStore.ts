// src/store/notifStore.ts
import { create } from "zustand";

export interface AppNotif {
  id:        string;
  type:      string;
  title:     string;
  body:      string;
  unread:    boolean;
  icon:      string;
  timestamp: string;
}

interface NotifStore {
  notifs:      AppNotif[];
  unread:      number;
  setNotifs:   (notifs: AppNotif[]) => void;
  addNotif:    (notif: AppNotif)    => void;
  markAllRead: ()                   => void;
}

export const useNotifStore = create<NotifStore>((set) => ({
  notifs:  [],
  unread:  0,

  setNotifs: (notifs) =>
    set({ notifs, unread: notifs.filter(n => n.unread).length }),

  addNotif: (notif) =>
    set((s) => ({
      notifs: [notif, ...s.notifs].slice(0, 50),
      unread: s.unread + (notif.unread ? 1 : 0),
    })),

  markAllRead: () =>
    set((s) => ({
      notifs: s.notifs.map(n => ({ ...n, unread: false })),
      unread: 0,
    })),
}));
