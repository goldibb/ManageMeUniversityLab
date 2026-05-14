import type { Notification, TaskPriority } from "../../types";
import type { INotificationRepository } from "../interfaces/INotificationRepository";
import { NotificationModel } from "./models/NotificationModel";
import { getNextSequence } from "./models/CounterModel";

function toNotification(doc: any): Notification {
  return {
    id: doc.id,
    title: doc.title,
    created: doc.created,
    priority: doc.priority,
    seen: doc.seen,
    recipientId: doc.recipientId,
  };
}

export class MongoNotificationRepository
  implements INotificationRepository
{
  async listNotificationForUser(userId: number): Promise<Notification[]> {
    const docs = await NotificationModel.find({ recipientId: userId })
      .sort({ created: -1 })
      .lean();
    return docs.map(toNotification);
  }

  async countNotReadNotifications(userId: number): Promise<number> {
    return NotificationModel.countDocuments({
      recipientId: userId,
      seen: false,
    });
  }

  async getNotificationById(
    id: number,
  ): Promise<Notification | undefined> {
    const doc = await NotificationModel.findOne({ id }).lean();
    return doc ? toNotification(doc) : undefined;
  }

  async markNotificationAsRead(
    id: number,
  ): Promise<Notification | undefined> {
    const doc = await NotificationModel.findOneAndUpdate(
      { id },
      { seen: true },
      { new: true },
    ).lean();
    return doc ? toNotification(doc) : undefined;
  }

  async createNotification(payload: {
    title: string;
    priority: TaskPriority;
    recipientId: number;
  }): Promise<Notification> {
    const id = await getNextSequence("notification");
    const doc = await NotificationModel.create({
      id,
      title: payload.title.trim(),
      created: new Date(),
      priority: payload.priority,
      seen: false,
      recipientId: payload.recipientId,
    });
    return toNotification(doc);
  }
}
