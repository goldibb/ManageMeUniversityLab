import bcrypt from "bcryptjs";
import type { User, UserRole } from "../../types";
import type { IUserRepository } from "../interfaces/IUserRepository";
import type { INotificationRepository } from "../interfaces/INotificationRepository";
import { UserModel } from "./models/UserModel";
import { getNextSequence } from "./models/CounterModel";
import { SUPER_ADMIN_EMAIL } from "../../config";

function toUser(doc: any): User {
  return {
    id: doc.id,
    email: doc.email,
    firstName: doc.firstName,
    lastName: doc.lastName,
    activeProjectId: doc.activeProjectId ?? null,
    role: doc.role,
    blocked: doc.blocked,
  };
}

export class MongoUserRepository implements IUserRepository {
  private notificationRepo?: INotificationRepository;

  setNotificationRepo(repo: INotificationRepository) {
    this.notificationRepo = repo;
  }

  async findOrCreateUser(payload: {
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<{ user: User; isNew: boolean }> {
    const existing = await UserModel.findOne({ email: payload.email }).lean();
    if (existing) {
      return { user: toUser(existing), isNew: false };
    }

    const isSuperAdmin =
      payload.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    const role: UserRole = isSuperAdmin ? "admin" : "guest";

    const id = await getNextSequence("user");
    const doc = await UserModel.create({
      id,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      activeProjectId: null,
      role,
      blocked: false,
    });
    const user = toUser(doc);

    if (!isSuperAdmin && this.notificationRepo) {
      const admins = await UserModel.find({ role: "admin" }).lean();
      for (const admin of admins) {
        await this.notificationRepo.createNotification({
          title: `Nowe konto w systemie: ${user.firstName} ${user.lastName} (${user.email})`,
          priority: "high",
          recipientId: admin.id,
        });
      }
    }

    return { user, isNew: true };
  }

  async getUserById(id: number): Promise<User | undefined> {
    const doc = await UserModel.findOne({ id }).lean();
    return doc ? toUser(doc) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const doc = await UserModel.findOne({ email: email.toLowerCase() }).lean();
    return doc ? toUser(doc) : undefined;
  }

  async createUserWithPassword(payload: {
    email: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
  }): Promise<{ user: User; isNew: boolean }> {
    const existing = await UserModel.findOne({
      email: payload.email.toLowerCase(),
    }).lean();
    if (existing) {
      return { user: toUser(existing), isNew: false };
    }

    const isSuperAdmin =
      payload.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    const role: UserRole = isSuperAdmin ? "admin" : "guest";

    const id = await getNextSequence("user");
    const doc = await UserModel.create({
      id,
      email: payload.email.toLowerCase(),
      firstName: payload.firstName,
      lastName: payload.lastName,
      activeProjectId: null,
      role,
      blocked: false,
      passwordHash: payload.passwordHash,
    });
    const user = toUser(doc);

    if (!isSuperAdmin && this.notificationRepo) {
      const admins = await UserModel.find({ role: "admin" }).lean();
      for (const admin of admins) {
        await this.notificationRepo.createNotification({
          title: `Nowe konto w systemie: ${user.firstName} ${user.lastName} (${user.email})`,
          priority: "high",
          recipientId: admin.id,
        });
      }
    }

    return { user, isNew: true };
  }

  async listUsers(): Promise<User[]> {
    const docs = await UserModel.find().sort({ id: 1 }).lean();
    return docs.map(toUser);
  }

  async updateUserRole(id: number, role: UserRole): Promise<User | undefined> {
    const doc = await UserModel.findOneAndUpdate(
      { id },
      { role },
      { new: true },
    ).lean();
    return doc ? toUser(doc) : undefined;
  }

  async setUserBlocked(
    id: number,
    blocked: boolean,
  ): Promise<User | undefined> {
    const doc = await UserModel.findOneAndUpdate(
      { id },
      { blocked },
      { new: true },
    ).lean();
    return doc ? toUser(doc) : undefined;
  }

  async updateUserActiveProject(
    id: number,
    projectId: number | null,
  ): Promise<User | undefined> {
    const doc = await UserModel.findOneAndUpdate(
      { id },
      { activeProjectId: projectId },
      { new: true },
    ).lean();
    return doc ? toUser(doc) : undefined;
  }

  async getAdminIds(): Promise<number[]> {
    const docs = await UserModel.find({ role: "admin" }).lean();
    return docs.map((d) => d.id);
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    const doc = await UserModel.findOne({
      email: email.toLowerCase(),
    }).lean();
    if (!doc || !doc.passwordHash) return false;
    return bcrypt.compare(password, doc.passwordHash);
  }
}
