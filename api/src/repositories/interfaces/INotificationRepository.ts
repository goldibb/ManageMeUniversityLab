import type { Notification, TaskPriority } from "../../types";

export interface INotificationRepository {
  listNotificationForUser(userId: number): Promise<Notification[]>;
  countNotReadNotifications(userId: number): Promise<number>;
  getNotificationById(id: number): Promise<Notification | undefined>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  createNotification(payload: {
    title: string;
    priority: TaskPriority;
    recipientId: number;
  }): Promise<Notification>;
}
