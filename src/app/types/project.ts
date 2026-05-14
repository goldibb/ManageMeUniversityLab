export type UserRole = "admin" | "devops" | "developer" | "guest";

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  blocked?: boolean;
}

export interface Project {
  id: number;
  name: string;
}

export interface CurrentUserDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  activeProjectId: number | null;
  role: UserRole;
  blocked?: boolean;
}
