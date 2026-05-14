import type {
  Task,
  TaskPriority,
  TaskState,
} from "../../types";

export interface ITaskRepository {
  listTasksForStory(storyId: number): Promise<Task[]>;
  getTaskById(id: number): Promise<Task | undefined>;
  createTask(payload: {
    name: string;
    description: string;
    priority: TaskPriority;
    storyId: number;
    estimatedTime: number;
    actualTime: number | null;
    state: TaskState;
    assignedUserId: number | null;
  }): Promise<Task | null>;
  updateTask(
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
  ): Promise<Task | null>;
  deleteTask(id: number): Promise<boolean>;
}
