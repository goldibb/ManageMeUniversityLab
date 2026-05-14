import jwt from "jsonwebtoken";
import type { User } from "./types";
import { JWT_SECRET } from "./config";

export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      blocked: user.blocked,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}
