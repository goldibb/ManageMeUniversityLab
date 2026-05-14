import type { Notification, TaskPriority } from "../../types";
import type { INotificationRepository } from "../interfaces/INotificationRepository";

const notifications: Notification[] = [];
let nextNotificationId = 1;

export class MemoryNotificationRepository
  implements INotificationRepository
{
  async listNotificationForUser(userId: number): Promise<Notification[]> {
    return notifications
      .filter((t) => t.recipientId === userId)
      .slice()
      .sort(
        (a, b) =>
          new Date(b.created).getTime() - new Date(a.created).getTime(),
      );
  }

  async countNotReadNotifications(userId: number): Promise<number> {
    return notifications.filter(
      (t) => t.seen == false && t.recipientId === userId,
    ).length;
  }

  async getNotificationById(
    id: number,
  ): Promise<Notification | undefined> {
    const t = notifications.find((x) => x.id === id);
    return t ? { ...t } : undefined;
  }

  async markNotificationAsRead(
    id: number,
  ): Promise<Notification | undefined> {
    const idx = notifications.findIndex((x) => x.id === id);
    if (idx === -1) return undefined;
    notifications[idx].seen = true;
    return { ...notifications[idx] };
  }

  async createNotification(payload: {
    title: string;
    priority: TaskPriority;
    recipientId: number;
  }): Promise<Notification> {
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
}
