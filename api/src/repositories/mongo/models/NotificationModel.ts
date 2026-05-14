import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true, index: true },
  title: { type: String, required: true },
  created: { type: Date, required: true },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    required: true,
  },
  seen: { type: Boolean, default: false },
  recipientId: { type: Number, required: true, index: true },
});

export const NotificationModel = mongoose.model(
  "Notification",
  NotificationSchema,
);
