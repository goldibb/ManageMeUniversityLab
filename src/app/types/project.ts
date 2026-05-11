export type UserRole = "admin" | "devops" | "developer";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface Project {
  id: number;
  name: string;
}

export interface CurrentUserDto {
  id: number;
  firstName: string;
  lastName: string;
  activeProjectId: number | null;
  role: UserRole;
}
