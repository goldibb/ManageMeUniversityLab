import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  activeProjectId: { type: Number, default: null },
  role: {
    type: String,
    enum: ["admin", "devops", "developer", "guest"],
    default: "guest",
  },
  blocked: { type: Boolean, default: false },
});

export const UserModel = mongoose.model("User", UserSchema);
