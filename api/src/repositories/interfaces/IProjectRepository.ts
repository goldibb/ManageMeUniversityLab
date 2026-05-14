import type { Project } from "../../types";

export interface IProjectRepository {
  listProjects(): Promise<Project[]>;
  createProject(name: string): Promise<Project>;
  updateProject(id: number, name: string): Promise<Project | null>;
  deleteProject(id: number): Promise<boolean>;
}
