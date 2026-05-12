import type { Task, TaskPriority, TaskState } from "./types";
import { getStoryById, updateStory } from "./storiesStore";

const tasks: Task[] = [];
let nextTaskId = 1;

export function listTasksForStory(storyId: number): Task[] {
  return tasks
    .filter((t) => t.storyId === storyId)
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export function getTaskById(id: number): Task | undefined {
  const t = tasks.find((x) => x.id === id);
  return t ? { ...t } : undefined;
}

export function createTask(payload: {
  name: string;
  description: string;
  priority: TaskPriority;
  storyId: number;
  estimatedTime: number;
  actualTime: number | null;
  state: TaskState;
  assignedUserId: number | null;
}): Task | null {
  const story = getStoryById(payload.storyId);
  if (!story) return null;

  const now = new Date().toISOString();
  const task: Task = {
    id: nextTaskId++,
    name: payload.name.trim(),
    description: payload.description.trim(),
    priority: payload.priority,
    storyId: payload.storyId,
    estimatedTime: payload.estimatedTime,
    actualTime: payload.actualTime ?? null,
    state: payload.state,
    createdAt: now,
    startDate:
      payload.state === "doing" || payload.state === "done" ? now : null,
    endDate: payload.state === "done" ? now : null,
    assignedUserId: payload.assignedUserId,
  };
  tasks.push(task);

  // Jeśli od razu przypisany użytkownik i stan todo → zmień na doing
  if (task.assignedUserId !== null && task.state === "todo") {
    task.state = "doing";
    task.startDate = now;
    if (story.state === "todo") {
      updateStory(story.id, { state: "doing" });
    }
  }

  return { ...task };
}

export function updateTask(
  id: number,
  patch: Partial<
    Pick<
      Task,
      | "name"
      | "description"
      | "priority"
      | "estimatedTime"
      | "actualTime"
      | "state"
      | "assignedUserId"
    >
  >,
): Task | null {
  const idx = tasks.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  const cur = tasks[idx];
  const now = new Date().toISOString();

  const oldState = cur.state;
  const hadUser = cur.assignedUserId !== null;

  if (patch.name !== undefined) cur.name = patch.name.trim();
  if (patch.description !== undefined)
    cur.description = patch.description.trim();
  if (patch.priority !== undefined) cur.priority = patch.priority;
  if (patch.estimatedTime !== undefined)
    cur.estimatedTime = patch.estimatedTime;
  if (patch.actualTime !== undefined) cur.actualTime = patch.actualTime;
  if (patch.assignedUserId !== undefined)
    cur.assignedUserId = patch.assignedUserId;
  if (patch.state !== undefined) cur.state = patch.state;

  // Logika biznesowa:
  // 1. Przypisanie osoby (devops/developer) automatycznie zmienia stan z todo na doing + startDate
  const gotUser = cur.assignedUserId !== null;
  if (!hadUser && gotUser && oldState === "todo") {
    cur.state = "doing";
    cur.startDate = now;
  }

  // 2. Jeśli stan doing i brak startDate → uzupełnij
  if (cur.state === "doing" && cur.startDate === null) {
    cur.startDate = now;
  }

  // 3. Jeśli stan done → uzupełnij endDate
  if (cur.state === "done" && cur.endDate === null) {
    cur.endDate = now;
  }

  // 4. Jeśli przypisano użytkownika (lub zmieniono stan na doing) i story było todo → story doing
  const story = getStoryById(cur.storyId);
  if (story && story.state === "todo" && cur.state === "doing") {
    updateStory(story.id, { state: "doing" });
  }

  // 5. Jeśli stan done → sprawdź czy wszystkie taski w story są done
  if (cur.state === "done" && story) {
    const storyTasks = tasks.filter((t) => t.storyId === cur.storyId);
    const allDone =
      storyTasks.length > 0 && storyTasks.every((t) => t.state === "done");
    if (allDone) {
      updateStory(story.id, { state: "done" });
    }
  }

  return { ...cur };
}

export function deleteTask(id: number): boolean {
  const idx = tasks.findIndex((x) => x.id === id);
  if (idx === -1) return false;
  tasks.splice(idx, 1);
  return true;
}
