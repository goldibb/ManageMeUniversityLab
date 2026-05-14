import type { Project } from "./types";
import { listUsers } from "./authStore";

const projects: Project[] = [
  { id: 1, name: "Projekt Alpha" },
  { id: 2, name: "Projekt Beta" },
];

export function listProjects(): Project[] {
  return projects;
}

export function createProject(name: string): Project {
  const id =
    projects.length > 0 ? Math.max(...projects.map((p) => p.id)) + 1 : 1;
  const project: Project = { id, name: name.trim() };
  projects.push(project);
  return project;
}

export function getAdminIds(): number[] {
  return listUsers()
    .filter((u) => u.role === "admin")
    .map((u) => u.id);
}

export function setActiveProjectId(
  userId: number,
  projectId: number | null,
): boolean {
  if (projectId !== null && !projects.some((p) => p.id === projectId)) {
    throw new Error("Nieznany projekt");
  }
  const { updateUserActiveProject } = require("./authStore");
  const updated = updateUserActiveProject(userId, projectId);
  return !!updated;
}
