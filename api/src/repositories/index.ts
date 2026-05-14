import mongoose from "mongoose";
import { STORAGE_MODE, MONGODB_URI } from "../config";
import type { IProjectRepository } from "./interfaces/IProjectRepository";
import type { IUserRepository } from "./interfaces/IUserRepository";
import type { IStoryRepository } from "./interfaces/IStoryRepository";
import type { ITaskRepository } from "./interfaces/ITaskRepository";
import type { INotificationRepository } from "./interfaces/INotificationRepository";

import { MemoryProjectRepository } from "./memory/MemoryProjectRepository";
import { MemoryUserRepository } from "./memory/MemoryUserRepository";
import { MemoryStoryRepository } from "./memory/MemoryStoryRepository";
import { MemoryTaskRepository } from "./memory/MemoryTaskRepository";
import { MemoryNotificationRepository } from "./memory/MemoryNotificationRepository";

import { MongoProjectRepository } from "./mongo/MongoProjectRepository";
import { MongoUserRepository } from "./mongo/MongoUserRepository";
import { MongoStoryRepository } from "./mongo/MongoStoryRepository";
import { MongoTaskRepository } from "./mongo/MongoTaskRepository";
import { MongoNotificationRepository } from "./mongo/MongoNotificationRepository";

import { ProjectModel } from "./mongo/models/ProjectModel";
import { UserModel } from "./mongo/models/UserModel";
import { getNextSequence } from "./mongo/models/CounterModel";

export interface Repositories {
  projects: IProjectRepository;
  users: IUserRepository;
  stories: IStoryRepository;
  tasks: ITaskRepository;
  notifications: INotificationRepository;
}

let repos: Repositories | null = null;

export async function createRepositories(): Promise<Repositories> {
  if (repos) return repos;

  if (STORAGE_MODE === "mongodb") {
    await mongoose.connect(MONGODB_URI);
    console.log("[REPO] Connected to MongoDB");
  }

  if (STORAGE_MODE === "mongodb") {
    const projects = new MongoProjectRepository();
    const users = new MongoUserRepository();
    const stories = new MongoStoryRepository();
    const tasks = new MongoTaskRepository();
    const notifications = new MongoNotificationRepository();

    users.setNotificationRepo(notifications);
    stories.setProjectRepo(projects);
    tasks.setStoryRepo(stories);

    repos = { projects, users, stories, tasks, notifications };
    await seedIfNeeded();
    return repos;
  }

  const projects = new MemoryProjectRepository();
  const users = new MemoryUserRepository();
  const stories = new MemoryStoryRepository();
  const tasks = new MemoryTaskRepository();
  const notifications = new MemoryNotificationRepository();

  users.setNotificationRepo(notifications);
  stories.setProjectRepo(projects);
  tasks.setStoryRepo(stories);

  repos = { projects, users, stories, tasks, notifications };
  return repos;
}

export function getRepositories(): Repositories {
  if (!repos) {
    throw new Error("Repositories not initialized. Call createRepositories() first.");
  }
  return repos;
}

async function seedIfNeeded(): Promise<void> {
  if (STORAGE_MODE !== "mongodb") return;

  const projectCount = await ProjectModel.countDocuments();
  if (projectCount === 0) {
    const id1 = await getNextSequence("project");
    await ProjectModel.create({ id: id1, name: "Projekt Alpha" });
    const id2 = await getNextSequence("project");
    await ProjectModel.create({ id: id2, name: "Projekt Beta" });
    console.log("[SEED] Created default projects");
  }

  const userCount = await UserModel.countDocuments();
  if (userCount === 0) {
    console.log(
      "[SEED] No users found — super admin will be created on first login.",
    );
  }
}
