import type { CurrentUserDto, Project, User } from "../types/project";
import type { CreateStoryInput, Story, UpdateStoryInput } from "../types/story";
import type { CreateTaskInput, Task, UpdateTaskInput } from "../types/task";
import type { Notification } from "../types/notification";

const BASE = "/api";

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body && typeof body.error === "string") message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

async function ensureOk(res: Response): Promise<void> {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body && typeof body.error === "string") message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${BASE}/projects`);
  const data = await parseJson<{ projects: Project[] }>(res);
  return data.projects;
}

export async function fetchCurrentUser(): Promise<CurrentUserDto> {
  const res = await fetch(`${BASE}/users/me`);
  return parseJson(res);
}

export async function getUsers(): Promise<User[]> {
  const res = await fetch(`${BASE}/users`);
  const data = await parseJson<{ users: User[] }>(res);
  return data.users;
}

export async function patchActiveProject(
  projectId: number | null,
): Promise<CurrentUserDto> {
  const res = await fetch(`${BASE}/users/me/active-project`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId }),
  });
  return parseJson(res);
}

export async function fetchStories(projectId: number): Promise<Story[]> {
  const res = await fetch(
    `${BASE}/stories?projectId=${encodeURIComponent(String(projectId))}`,
  );
  const data = await parseJson<{ stories: Story[] }>(res);
  return data.stories;
}

export async function fetchStory(id: number): Promise<Story> {
  const res = await fetch(`${BASE}/stories/${id}`);
  return parseJson(res);
}

export async function createStory(input: CreateStoryInput): Promise<Story> {
  const res = await fetch(`${BASE}/stories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson(res);
}

export async function updateStory(
  id: number,
  patch: UpdateStoryInput,
): Promise<Story> {
  const res = await fetch(`${BASE}/stories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return parseJson(res);
}

export async function deleteStory(id: number): Promise<void> {
  const res = await fetch(`${BASE}/stories/${id}`, { method: "DELETE" });
  await ensureOk(res);
}

export async function fetchTasks(storyId: number): Promise<Task[]> {
  const res = await fetch(
    `${BASE}/tasks?storyId=${encodeURIComponent(String(storyId))}`,
  );
  const data = await parseJson<{ tasks: Task[] }>(res);
  return data.tasks;
}

export async function fetchTask(id: number): Promise<Task> {
  const res = await fetch(`${BASE}/tasks/${id}`);
  return parseJson(res);
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const res = await fetch(`${BASE}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson(res);
}

export async function updateTask(
  id: number,
  patch: UpdateTaskInput,
): Promise<Task> {
  const res = await fetch(`${BASE}/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return parseJson(res);
}

export async function deleteTask(id: number): Promise<void> {
  const res = await fetch(`${BASE}/tasks/${id}`, { method: "DELETE" });
  await ensureOk(res);
}

export async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetch(`${BASE}/notifications`);
  const data = await parseJson<{ notifications: Notification[] }>(res);
  return data.notifications;
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await fetch(`${BASE}/notifications/unread-count`);
  const data = await parseJson<{ count: number }>(res);
  return data.count;
}

export async function fetchNotification(id: number): Promise<Notification> {
  const res = await fetch(`${BASE}/notifications/${id}`);
  return parseJson(res);
}

export async function markNotificationAsRead(id: number): Promise<Notification> {
  const res = await fetch(`${BASE}/notifications/${id}/read`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  return parseJson(res);
}

export async function createProject(name: string): Promise<Project> {
  const res = await fetch(`${BASE}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return parseJson(res);
}
