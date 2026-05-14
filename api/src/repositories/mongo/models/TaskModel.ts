import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    required: true,
  },
  storyId: { type: Number, required: true, index: true },
  estimatedTime: { type: Number, required: true },
  actualTime: { type: Number, default: null },
  state: {
    type: String,
    enum: ["todo", "doing", "done"],
    required: true,
  },
  createdAt: { type: String, required: true },
  startDate: { type: String, default: null },
  endDate: { type: String, default: null },
  assignedUserId: { type: Number, default: null },
});

export const TaskModel = mongoose.model("Task", TaskSchema);
