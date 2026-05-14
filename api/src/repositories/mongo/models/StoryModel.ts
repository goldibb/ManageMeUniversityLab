import mongoose from "mongoose";

const StorySchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    required: true,
  },
  projectId: { type: Number, required: true, index: true },
  createdAt: { type: String, required: true },
  state: {
    type: String,
    enum: ["todo", "doing", "done"],
    required: true,
  },
  ownerId: { type: Number, required: true },
});

export const StoryModel = mongoose.model("Story", StorySchema);
