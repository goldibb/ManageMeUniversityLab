import jwt from "jsonwebtoken";
import type { User, UserRole } from "./types";
import * as notificationStore from "./notificationStore";
import { JWT_SECRET, SUPER_ADMIN_EMAIL } from "./config";

const users: User[] = [];
let nextUserId = 1;

export function findOrCreateUser(payload: {
  email: string;
  firstName: string;
  lastName: string;
}): { user: User; isNew: boolean } {
  const existing = users.find((u) => u.email === payload.email);
  if (existing) {
    return { user: { ...existing }, isNew: false };
  }

  const isSuperAdmin =
    payload.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  const role: UserRole = isSuperAdmin ? "admin" : "guest";

  const user: User = {
    id: nextUserId++,
    email: payload.email,
    firstName: payload.firstName,
    lastName: payload.lastName,
    activeProjectId: null,
    role,
    blocked: false,
  };
  users.push(user);

  if (!isSuperAdmin) {
    const admins = users.filter((u) => u.role === "admin");
    admins.forEach((admin) => {
      notificationStore.createNotification({
        title: `Nowe konto w systemie: ${user.firstName} ${user.lastName} (${user.email})`,
        priority: "high",
        recipientId: admin.id,
      });
    });
  }

  return { user: { ...user }, isNew: true };
}

export function getUserById(id: number): User | undefined {
  const u = users.find((x) => x.id === id);
  return u ? { ...u } : undefined;
}

export function listUsers(): User[] {
  return users.map((u) => ({ ...u }));
}

export function updateUserRole(id: number, role: UserRole): User | undefined {
  const idx = users.findIndex((x) => x.id === id);
  if (idx === -1) return undefined;
  users[idx].role = role;
  return { ...users[idx] };
}

export function setUserBlocked(id: number, blocked: boolean): User | undefined {
  const idx = users.findIndex((x) => x.id === id);
  if (idx === -1) return undefined;
  users[idx].blocked = blocked;
  return { ...users[idx] };
}

export function updateUserActiveProject(
  id: number,
  projectId: number | null,
): User | undefined {
  const idx = users.findIndex((x) => x.id === id);
  if (idx === -1) return undefined;
  users[idx].activeProjectId = projectId;
  return { ...users[idx] };
}

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
