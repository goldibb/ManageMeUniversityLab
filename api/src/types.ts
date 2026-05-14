export interface Project {
  id: number;
  name: string;
}

export interface Notification {
  id: number;
  title: string;
  created: Date;
  priority: TaskPriority;
  seen: boolean;
  recipientId: number;
}

export interface CurrentUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  activeProjectId: number | null;
  role: UserRole;
  blocked: boolean;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  activeProjectId: number | null;
  role: UserRole;
  blocked: boolean;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  activeProjectId: number | null;
  role: UserRole;
  email: string;
  blocked: boolean;
}

export type UserRole = "admin" | "devops" | "developer" | "guest";

export type StoryPriority = "low" | "medium" | "high";

export type StoryState = "todo" | "doing" | "done";

export interface Story {
  id: number;
  name: string;
  description: string;
  priority: StoryPriority;
  projectId: number;
  createdAt: string;
  state: StoryState;
  ownerId: number;
}

export type TaskPriority = "low" | "medium" | "high";

export type TaskState = "todo" | "doing" | "done";

export interface Task {
  id: number;
  name: string;
  description: string;
  priority: TaskPriority;
  storyId: number;
  estimatedTime: number; // przewidywane roboczogodziny
  actualTime: number | null; // zrealizowane roboczogodziny
  state: TaskState;
  createdAt: string;
  startDate: string | null;
  endDate: string | null;
  assignedUserId: number | null;
}
