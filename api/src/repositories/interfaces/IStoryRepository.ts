import type {
  Story,
  StoryPriority,
  StoryState,
} from "../../types";

export interface IStoryRepository {
  listStoriesForProject(projectId: number): Promise<Story[]>;
  getStoryById(id: number): Promise<Story | undefined>;
  createStory(payload: {
    name: string;
    description: string;
    priority: StoryPriority;
    projectId: number;
    state: StoryState;
    ownerId: number;
  }): Promise<Story | null>;
  updateStory(
    id: number,
    patch: Partial<
      Pick<Story, "name" | "description" | "priority" | "state" | "ownerId">
    >,
  ): Promise<Story | null>;
  deleteStory(id: number): Promise<boolean>;
}
