import type { Task, TaskPriority, TaskState } from "../../types";
import type { ITaskRepository } from "../interfaces/ITaskRepository";
import type { IStoryRepository } from "../interfaces/IStoryRepository";
import { TaskModel } from "./models/TaskModel";
import { getNextSequence } from "./models/CounterModel";

function toTask(doc: any): Task {
  return {
    id: doc.id,
    name: doc.name,
    description: doc.description,
    priority: doc.priority,
    storyId: doc.storyId,
    estimatedTime: doc.estimatedTime,
    actualTime: doc.actualTime ?? null,
    state: doc.state,
    createdAt: doc.createdAt,
    startDate: doc.startDate ?? null,
    endDate: doc.endDate ?? null,
    assignedUserId: doc.assignedUserId ?? null,
  };
}

export class MongoTaskRepository implements ITaskRepository {
  private storyRepo?: IStoryRepository;

  setStoryRepo(repo: IStoryRepository) {
    this.storyRepo = repo;
  }

  async listTasksForStory(storyId: number): Promise<Task[]> {
    const docs = await TaskModel.find({ storyId })
      .sort({ createdAt: -1 })
      .lean();
    return docs.map(toTask);
  }

  async getTaskById(id: number): Promise<Task | undefined> {
    const doc = await TaskModel.findOne({ id }).lean();
    return doc ? toTask(doc) : undefined;
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
    const id = await getNextSequence("task");
    const doc = await TaskModel.create({
      id,
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
    });

    const task = toTask(doc);

    if (task.assignedUserId !== null && task.state === "todo") {
      task.state = "doing";
      task.startDate = now;
      await TaskModel.updateOne(
        { id: task.id },
        { state: "doing", startDate: now },
      );
      if (story.state === "todo" && this.storyRepo) {
        await this.storyRepo.updateStory(story.id, { state: "doing" });
      }
    }

    return task;
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
    const cur = await TaskModel.findOne({ id }).lean();
    if (!cur) return null;

    const now = new Date().toISOString();
    const updates: any = {};

    const oldState = cur.state;
    const hadUser = cur.assignedUserId !== null;

    if (patch.name !== undefined) updates.name = patch.name.trim();
    if (patch.description !== undefined)
      updates.description = patch.description.trim();
    if (patch.priority !== undefined) updates.priority = patch.priority;
    if (patch.estimatedTime !== undefined)
      updates.estimatedTime = patch.estimatedTime;
    if (patch.actualTime !== undefined) updates.actualTime = patch.actualTime;
    if (patch.assignedUserId !== undefined)
      updates.assignedUserId = patch.assignedUserId;
    if (patch.state !== undefined) updates.state = patch.state;

    // Business logic mirrors memory implementation
    const gotUser =
      updates.assignedUserId !== undefined
        ? updates.assignedUserId !== null
        : hadUser;
    const newAssignedUserId =
      updates.assignedUserId !== undefined
        ? updates.assignedUserId
        : cur.assignedUserId;
    const newState = updates.state ?? cur.state;

    if (!hadUser && gotUser && oldState === "todo") {
      updates.state = "doing";
      updates.startDate = now;
    }

    if ((updates.state ?? cur.state) === "doing" && !updates.startDate) {
      const willBeDoing = updates.state === "doing" || cur.state === "doing";
      if (willBeDoing && !cur.startDate) {
        updates.startDate = now;
      }
    }

    if ((updates.state ?? cur.state) === "done" && !updates.endDate) {
      if (!cur.endDate) {
        updates.endDate = now;
      }
    }

    const doc = await TaskModel.findOneAndUpdate({ id }, updates, {
      new: true,
    }).lean();
    if (!doc) return null;
    const task = toTask(doc);

    const story = this.storyRepo
      ? await this.storyRepo.getStoryById(task.storyId)
      : undefined;

    if (story && story.state === "todo" && task.state === "doing") {
      await this.storyRepo?.updateStory(story.id, { state: "doing" });
    }

    if (task.state === "done" && story) {
      const allTasks = await TaskModel.find({ storyId: task.storyId }).lean();
      const allDone =
        allTasks.length > 0 && allTasks.every((t) => t.state === "done");
      if (allDone) {
        await this.storyRepo?.updateStory(story.id, { state: "done" });
      }
    }

    return task;
  }

  async deleteTask(id: number): Promise<boolean> {
    const res = await TaskModel.deleteOne({ id });
    return res.deletedCount === 1;
  }
}
