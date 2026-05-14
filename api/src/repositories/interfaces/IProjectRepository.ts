import type { Project } from "../../types";

export interface IProjectRepository {
  listProjects(): Promise<Project[]>;
  createProject(name: string): Promise<Project>;
}
