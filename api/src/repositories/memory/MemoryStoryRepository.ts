import type { Story, StoryPriority, StoryState } from "../../types";
import type { IStoryRepository } from "../interfaces/IStoryRepository";
import type { IProjectRepository } from "../interfaces/IProjectRepository";

const stories: Story[] = [];
let nextStoryId = 1;

export class MemoryStoryRepository implements IStoryRepository {
  private projectRepo?: IProjectRepository;

  setProjectRepo(repo: IProjectRepository) {
    this.projectRepo = repo;
  }

  async listStoriesForProject(projectId: number): Promise<Story[]> {
    return stories
      .filter((s) => s.projectId === projectId)
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  async getStoryById(id: number): Promise<Story | undefined> {
    const s = stories.find((x) => x.id === id);
    return s ? { ...s } : undefined;
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

    const story: Story = {
      id: nextStoryId++,
      name: payload.name.trim(),
      description: payload.description.trim(),
      priority: payload.priority,
      projectId: payload.projectId,
      createdAt: new Date().toISOString(),
      state: payload.state,
      ownerId: payload.ownerId,
    };
    stories.push(story);
    return { ...story };
  }

  async updateStory(
    id: number,
    patch: Partial<
      Pick<Story, "name" | "description" | "priority" | "state" | "ownerId">
    >,
  ): Promise<Story | null> {
    const idx = stories.findIndex((x) => x.id === id);
    if (idx === -1) return null;
    const cur = stories[idx];
    if (patch.name !== undefined) cur.name = patch.name.trim();
    if (patch.description !== undefined)
      cur.description = patch.description.trim();
    if (patch.priority !== undefined) cur.priority = patch.priority;
    if (patch.state !== undefined) cur.state = patch.state;
    if (patch.ownerId !== undefined) cur.ownerId = patch.ownerId;
    return { ...cur };
  }

  async deleteStory(id: number): Promise<boolean> {
    const idx = stories.findIndex((x) => x.id === id);
    if (idx === -1) return false;
    stories.splice(idx, 1);
    return true;
  }
}
