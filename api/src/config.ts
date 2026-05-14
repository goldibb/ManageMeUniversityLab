export const JWT_SECRET =
  process.env.JWT_SECRET || "dev-secret-zmien-w-produkcji";
export const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID;
export const SUPER_ADMIN_EMAIL =
  process.env.SUPER_ADMIN_EMAIL || "igornejman13@gmail.com";

export const STORAGE_MODE = process.env.STORAGE_MODE || "memory"; // "memory" | "mongodb"
export const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://igornejman13_db_user:<db_password>@cluster0.bihgvqe.mongodb.net/?";
