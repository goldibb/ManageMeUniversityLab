export interface Project {
  id: number;
  name: string;
}

export interface CurrentUser {
  id: number;
  firstName: string;
  lastName: string;
  activeProjectId: number | null;
  role: UserRole;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  activeProjectId: number | null;
  role: UserRole;
}

export type UserRole = "admin" | "devops" | "developer";

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
  estimatedTime: number; // roboczogodziny
  state: TaskState;
  createdAt: string;
  startDate: string | null;
  endDate: string | null;
  assignedUserId: number | null;
}
