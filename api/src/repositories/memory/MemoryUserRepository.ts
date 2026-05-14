import bcrypt from "bcryptjs";
import type { User, UserRole } from "../../types";
import type { IUserRepository } from "../interfaces/IUserRepository";
import type { INotificationRepository } from "../interfaces/INotificationRepository";
import { SUPER_ADMIN_EMAIL } from "../../config";

const users: User[] = [];
let nextUserId = 1;

export class MemoryUserRepository implements IUserRepository {
  private notificationRepo?: INotificationRepository;

  setNotificationRepo(repo: INotificationRepository) {
    this.notificationRepo = repo;
  }

  async findOrCreateUser(payload: {
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<{ user: User; isNew: boolean }> {
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

    if (!isSuperAdmin && this.notificationRepo) {
      const admins = users.filter((u) => u.role === "admin");
      for (const admin of admins) {
        await this.notificationRepo.createNotification({
          title: `Nowe konto w systemie: ${user.firstName} ${user.lastName} (${user.email})`,
          priority: "high",
          recipientId: admin.id,
        });
      }
    }

    return { user: { ...user }, isNew: true };
  }

  async getUserById(id: number): Promise<User | undefined> {
    const u = users.find((x) => x.id === id);
    return u ? { ...u } : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const u = users.find(
      (x) => x.email.toLowerCase() === email.toLowerCase(),
    );
    return u ? { ...u } : undefined;
  }

  async createUserWithPassword(payload: {
    email: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
  }): Promise<{ user: User; isNew: boolean }> {
    const existing = users.find(
      (u) => u.email.toLowerCase() === payload.email.toLowerCase(),
    );
    if (existing) {
      return { user: { ...existing }, isNew: false };
    }

    const isSuperAdmin =
      payload.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    const role: UserRole = isSuperAdmin ? "admin" : "guest";

    const user: User = {
      id: nextUserId++,
      email: payload.email.toLowerCase(),
      firstName: payload.firstName,
      lastName: payload.lastName,
      activeProjectId: null,
      role,
      blocked: false,
    };
    users.push(user);

    // Store passwordHash separately since User type doesn't have it
    (user as any).passwordHash = payload.passwordHash;

    if (!isSuperAdmin && this.notificationRepo) {
      const admins = users.filter((u) => u.role === "admin");
      for (const admin of admins) {
        await this.notificationRepo.createNotification({
          title: `Nowe konto w systemie: ${user.firstName} ${user.lastName} (${user.email})`,
          priority: "high",
          recipientId: admin.id,
        });
      }
    }

    return { user: { ...user }, isNew: true };
  }

  async listUsers(): Promise<User[]> {
    return users.map((u) => ({ ...u }));
  }

  async updateUserRole(id: number, role: UserRole): Promise<User | undefined> {
    const idx = users.findIndex((x) => x.id === id);
    if (idx === -1) return undefined;
    users[idx].role = role;
    return { ...users[idx] };
  }

  async setUserBlocked(
    id: number,
    blocked: boolean,
  ): Promise<User | undefined> {
    const idx = users.findIndex((x) => x.id === id);
    if (idx === -1) return undefined;
    users[idx].blocked = blocked;
    return { ...users[idx] };
  }

  async updateUserActiveProject(
    id: number,
    projectId: number | null,
  ): Promise<User | undefined> {
    const idx = users.findIndex((x) => x.id === id);
    if (idx === -1) return undefined;
    users[idx].activeProjectId = projectId;
    return { ...users[idx] };
  }

  async getAdminIds(): Promise<number[]> {
    return users.filter((u) => u.role === "admin").map((u) => u.id);
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    const u = users.find(
      (x) => x.email.toLowerCase() === email.toLowerCase(),
    );
    if (!u || !(u as any).passwordHash) return false;
    return bcrypt.compare(password, (u as any).passwordHash);
  }
}
