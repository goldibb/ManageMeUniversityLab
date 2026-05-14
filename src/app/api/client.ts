import type { CurrentUserDto, Project, User, UserRole } from "../types/project";
import type { CreateStoryInput, Story, UpdateStoryInput } from "../types/story";
import type { CreateTaskInput, Task, UpdateTaskInput } from "../types/task";
import type { Notification } from "../types/notification";

const BASE = "/api";

let authToken: string | null = localStorage.getItem("authToken");

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem("authToken", token);
  else localStorage.removeItem("authToken");
}

function getAuthHeaders(): Record<string, string> {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

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
  const res = await fetch(`${BASE}/projects`, { headers: getAuthHeaders() });
  const data = await parseJson<{ projects: Project[] }>(res);
  return data.projects;
}

export async function fetchCurrentUser(): Promise<CurrentUserDto> {
  const res = await fetch(`${BASE}/auth/me`, { headers: getAuthHeaders() });
  return parseJson(res);
}

export async function getUsers(): Promise<User[]> {
  const res = await fetch(`${BASE}/users`, { headers: getAuthHeaders() });
  const data = await parseJson<{ users: User[] }>(res);
  return data.users;
}

export async function patchActiveProject(
  projectId: number | null,
): Promise<CurrentUserDto> {
  const res = await fetch(`${BASE}/users/me/active-project`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ projectId }),
  });
  return parseJson(res);
}

export async function fetchStories(projectId: number): Promise<Story[]> {
  const res = await fetch(
    `${BASE}/stories?projectId=${encodeURIComponent(String(projectId))}`,
    { headers: getAuthHeaders() },
  );
  const data = await parseJson<{ stories: Story[] }>(res);
  return data.stories;
}

export async function fetchStory(id: number): Promise<Story> {
  const res = await fetch(`${BASE}/stories/${id}`, { headers: getAuthHeaders() });
  return parseJson(res);
}

export async function createStory(input: CreateStoryInput): Promise<Story> {
  const res = await fetch(`${BASE}/stories`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
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
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(patch),
  });
  return parseJson(res);
}

export async function deleteStory(id: number): Promise<void> {
  const res = await fetch(`${BASE}/stories/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  await ensureOk(res);
}

export async function fetchTasks(storyId: number): Promise<Task[]> {
  const res = await fetch(
    `${BASE}/tasks?storyId=${encodeURIComponent(String(storyId))}`,
    { headers: getAuthHeaders() },
  );
  const data = await parseJson<{ tasks: Task[] }>(res);
  return data.tasks;
}

export async function fetchTask(id: number): Promise<Task> {
  const res = await fetch(`${BASE}/tasks/${id}`, { headers: getAuthHeaders() });
  return parseJson(res);
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const res = await fetch(`${BASE}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
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
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(patch),
  });
  return parseJson(res);
}

export async function deleteTask(id: number): Promise<void> {
  const res = await fetch(`${BASE}/tasks/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  await ensureOk(res);
}

export async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetch(`${BASE}/notifications`, { headers: getAuthHeaders() });
  const data = await parseJson<{ notifications: Notification[] }>(res);
  return data.notifications;
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await fetch(`${BASE}/notifications/unread-count`, {
    headers: getAuthHeaders(),
  });
  const data = await parseJson<{ count: number }>(res);
  return data.count;
}

export async function fetchNotification(id: number): Promise<Notification> {
  const res = await fetch(`${BASE}/notifications/${id}`, {
    headers: getAuthHeaders(),
  });
  return parseJson(res);
}

export async function markNotificationAsRead(
  id: number,
): Promise<Notification> {
  const res = await fetch(`${BASE}/notifications/${id}/read`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
  return parseJson(res);
}

export async function createProject(name: string): Promise<Project> {
  const res = await fetch(`${BASE}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ name }),
  });
  return parseJson(res);
}

// ===== AUTH =====

export async function loginWithGoogle(
  credential: string,
): Promise<{ token: string; user: CurrentUserDto }> {
  const res = await fetch(`${BASE}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  const data = await parseJson<{ token: string; user: CurrentUserDto }>(res);
  setAuthToken(data.token);
  return data;
}

export async function loginWithPassword(payload: {
  email: string;
  password: string;
}): Promise<{ token: string; user: CurrentUserDto }> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJson<{ token: string; user: CurrentUserDto }>(res);
  setAuthToken(data.token);
  return data;
}

export async function register(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<{ token: string; user: CurrentUserDto }> {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJson<{ token: string; user: CurrentUserDto }>(res);
  setAuthToken(data.token);
  return data;
}

export async function logoutApi(): Promise<void> {
  const res = await fetch(`${BASE}/auth/logout`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  await ensureOk(res);
  setAuthToken(null);
}

export async function fetchAllUsers(): Promise<User[]> {
  const res = await fetch(`${BASE}/users`, { headers: getAuthHeaders() });
  const data = await parseJson<{ users: User[] }>(res);
  return data.users;
}

export async function updateUserRole(id: number, role: UserRole): Promise<User> {
  const res = await fetch(`${BASE}/users/${id}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ role }),
  });
  return parseJson(res);
}

export async function setUserBlocked(
  id: number,
  blocked: boolean,
): Promise<User> {
  const res = await fetch(`${BASE}/users/${id}/block`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ blocked }),
  });
  return parseJson(res);
}
