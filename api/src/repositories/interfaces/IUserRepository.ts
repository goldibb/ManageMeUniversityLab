import type { User, UserRole } from "../../types";

export interface IUserRepository {
  findOrCreateUser(payload: {
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<{ user: User; isNew: boolean }>;
  getUserById(id: number): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  updateUserRole(id: number, role: UserRole): Promise<User | undefined>;
  setUserBlocked(id: number, blocked: boolean): Promise<User | undefined>;
  updateUserActiveProject(
    id: number,
    projectId: number | null,
  ): Promise<User | undefined>;
  getAdminIds(): Promise<number[]>;
}
