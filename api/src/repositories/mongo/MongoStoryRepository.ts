import type { Story, StoryPriority, StoryState } from "../../types";
import type { IStoryRepository } from "../interfaces/IStoryRepository";
import type { IProjectRepository } from "../interfaces/IProjectRepository";
import { StoryModel } from "./models/StoryModel";
import { getNextSequence } from "./models/CounterModel";

function toStory(doc: any): Story {
  return {
    id: doc.id,
    name: doc.name,
    description: doc.description,
    priority: doc.priority,
    projectId: doc.projectId,
    createdAt: doc.createdAt,
    state: doc.state,
    ownerId: doc.ownerId,
  };
}

export class MongoStoryRepository implements IStoryRepository {
  private projectRepo?: IProjectRepository;

  setProjectRepo(repo: IProjectRepository) {
    this.projectRepo = repo;
  }

  async listStoriesForProject(projectId: number): Promise<Story[]> {
    const docs = await StoryModel.find({ projectId })
      .sort({ createdAt: -1 })
      .lean();
    return docs.map(toStory);
  }

  async getStoryById(id: number): Promise<Story | undefined> {
    const doc = await StoryModel.findOne({ id }).lean();
    return doc ? toStory(doc) : undefined;
  }

  async createStory(payload: {
    name: string;
    description: string;
    priority: StoryPriority;
    projectId: number;
    state: StoryState;
    ownerId: number;
  }): Promise<Story | null> {
    const projects = this.projectRepo
      ? await this.projectRepo.listProjects()
      : [];
    if (!projects.some((p) => p.id === payload.projectId)) return null;

    const id = await getNextSequence("story");
    const doc = await StoryModel.create({
      id,
      name: payload.name.trim(),
      description: payload.description.trim(),
      priority: payload.priority,
      projectId: payload.projectId,
      createdAt: new Date().toISOString(),
      state: payload.state,
      ownerId: payload.ownerId,
    });
    return toStory(doc);
  }

  async updateStory(
    id: number,
    patch: Partial<
      Pick<Story, "name" | "description" | "priority" | "state" | "ownerId">
    >,
  ): Promise<Story | null> {
    const updates: any = {};
    if (patch.name !== undefined) updates.name = patch.name.trim();
    if (patch.description !== undefined)
      updates.description = patch.description.trim();
    if (patch.priority !== undefined) updates.priority = patch.priority;
    if (patch.state !== undefined) updates.state = patch.state;
    if (patch.ownerId !== undefined) updates.ownerId = patch.ownerId;

    const doc = await StoryModel.findOneAndUpdate({ id }, updates, {
      new: true,
    }).lean();
    return doc ? toStory(doc) : null;
  }

  async deleteStory(id: number): Promise<boolean> {
    const res = await StoryModel.deleteOne({ id });
    return res.deletedCount === 1;
  }
}
