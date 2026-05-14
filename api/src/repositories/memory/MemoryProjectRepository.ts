import type { Project } from "../../types";
import type { IProjectRepository } from "../interfaces/IProjectRepository";

const projects: Project[] = [
  { id: 1, name: "Projekt Alpha" },
  { id: 2, name: "Projekt Beta" },
];

export class MemoryProjectRepository implements IProjectRepository {
  async listProjects(): Promise<Project[]> {
    return projects.slice();
  }

  async createProject(name: string): Promise<Project> {
    const id =
      projects.length > 0 ? Math.max(...projects.map((p) => p.id)) + 1 : 1;
    const project: Project = { id, name: name.trim() };
    projects.push(project);
    return project;
  }

  async updateProject(id: number, name: string): Promise<Project | null> {
    const project = projects.find((p) => p.id === id);
    if (!project) return null;
    project.name = name.trim();
    return project;
  }

  async deleteProject(id: number): Promise<boolean> {
    const idx = projects.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    projects.splice(idx, 1);
    return true;
  }

  getProjectsArray(): Project[] {
    return projects;
  }
}
