import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true, index: true },
  name: { type: String, required: true },
});

export const ProjectModel = mongoose.model("Project", ProjectSchema);
