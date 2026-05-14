import type { Notification, TaskPriority } from "./types";

const notifications: Notification[] = [];
let nextNotificationId = 1;

export function listNotificationForUser(userId: number): Notification[] {
  return notifications
    .filter((t) => t.recipientId === userId)
    .slice()
    .sort(
      (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime(),
    );
}

export function countNotReadNotifications(userId: number): number {
  return notifications.filter(
    (t) => t.seen == false && t.recipientId === userId,
  ).length;
}

export function getNotificationById(id: number): Notification | undefined {
  const t = notifications.find((x) => x.id === id);
  return t ? { ...t } : undefined;
}

export function markNotificationAsRead(id: number): Notification | undefined {
  const idx = notifications.findIndex((x) => x.id === id);
  if (idx === -1) return undefined;
  notifications[idx].seen = true;
  return { ...notifications[idx] };
}

export function createNotification(payload: {
  title: string;
  priority: TaskPriority;
  recipientId: number;
}): Notification {
  const now = new Date();
  const notification: Notification = {
    id: nextNotificationId++,
    title: payload.title.trim(),
    created: now,
    priority: payload.priority,
    seen: false,
    recipientId: payload.recipientId,
  };
  notifications.push(notification);

  return { ...notification };
}
