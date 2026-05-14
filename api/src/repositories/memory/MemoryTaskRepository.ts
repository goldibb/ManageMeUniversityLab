import type { Task, TaskPriority, TaskState } from "../../types";
import type { ITaskRepository } from "../interfaces/ITaskRepository";
import type { IStoryRepository } from "../interfaces/IStoryRepository";

const tasks: Task[] = [];
let nextTaskId = 1;

export class MemoryTaskRepository implements ITaskRepository {
  private storyRepo?: IStoryRepository;

  setStoryRepo(repo: IStoryRepository) {
    this.storyRepo = repo;
  }

  async listTasksForStory(storyId: number): Promise<Task[]> {
    return tasks
      .filter((t) => t.storyId === storyId)
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  async getTaskById(id: number): Promise<Task | undefined> {
    const t = tasks.find((x) => x.id === id);
    return t ? { ...t } : undefined;
  }

  async createTask(payload: {
    name: string;
    description: string;
    priority: TaskPriority;
    storyId: number;
    estimatedTime: number;
    actualTime: number | null;
    state: TaskState;
    assignedUserId: number | null;
  }): Promise<Task | null> {
    const story = this.storyRepo
      ? await this.storyRepo.getStoryById(payload.storyId)
      : undefined;
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

    if (task.assignedUserId !== null && task.state === "todo") {
      task.state = "doing";
      task.startDate = now;
      if (story.state === "todo" && this.storyRepo) {
        await this.storyRepo.updateStory(story.id, { state: "doing" });
      }
    }

    return { ...task };
  }

  async updateTask(
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
  ): Promise<Task | null> {
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

    const gotUser = cur.assignedUserId !== null;
    if (!hadUser && gotUser && oldState === "todo") {
      cur.state = "doing";
      cur.startDate = now;
    }

    if (cur.state === "doing" && cur.startDate === null) {
      cur.startDate = now;
    }

    if (cur.state === "done" && cur.endDate === null) {
      cur.endDate = now;
    }

    const story = this.storyRepo
      ? await this.storyRepo.getStoryById(cur.storyId)
      : undefined;
    if (story && story.state === "todo" && cur.state === "doing") {
      await this.storyRepo?.updateStory(story.id, { state: "doing" });
    }

    if (cur.state === "done" && story) {
      const storyTasks = tasks.filter((t) => t.storyId === cur.storyId);
      const allDone =
        storyTasks.length > 0 && storyTasks.every((t) => t.state === "done");
      if (allDone) {
        await this.storyRepo?.updateStory(story.id, { state: "done" });
      }
    }

    return { ...cur };
  }

  async deleteTask(id: number): Promise<boolean> {
    const idx = tasks.findIndex((x) => x.id === id);
    if (idx === -1) return false;
    tasks.splice(idx, 1);
    return true;
  }
}
