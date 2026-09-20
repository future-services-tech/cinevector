/** Store esterno (stesso pattern di cameraCoordsStore.ts) per il centro notifiche: deve essere richiamabile
 * anche fuori dall'albero React — in particolare dal QueryCache globale in main.tsx, istanziato prima che
 * qualunque Provider React monti. */

export type NotificationType = "success" | "error" | "info";

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  createdAt: number;
  read: boolean;
}

const MAX_NOTIFICATIONS = 30;
const DEDUPE_WINDOW_MS = 30_000;

let notifications: AppNotification[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function notificationsEnabled(): boolean {
  try {
    const raw = localStorage.getItem("cinevector-newweb:settings");
    if (!raw) return true;
    const parsed = JSON.parse(raw) as { notificationsEnabled?: boolean };
    return parsed.notificationsEnabled !== false;
  } catch {
    return true;
  }
}

export function pushNotification(type: NotificationType, message: string) {
  if (!notificationsEnabled()) return;

  const last = notifications[0];
  // Evita di spammare la stessa identica notifica (es. lo stesso errore ripetuto da un poll ogni 5-15s).
  if (last && last.type === type && last.message === message && Date.now() - last.createdAt < DEDUPE_WINDOW_MS) {
    return;
  }

  const entry: AppNotification = {
    id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    type,
    message,
    createdAt: Date.now(),
    read: false,
  };

  notifications = [entry, ...notifications].slice(0, MAX_NOTIFICATIONS);
  notify();
}

export function markAllRead() {
  if (notifications.every((n) => n.read)) return;
  notifications = notifications.map((n) => ({ ...n, read: true }));
  notify();
}

export function getNotifications(): AppNotification[] {
  return notifications;
}

export function getUnreadCount(): number {
  return notifications.filter((n) => !n.read).length;
}

export function subscribeNotifications(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
