import type { CurrentUser, Project, User } from "./types";

const projects: Project[] = [
  { id: 1, name: "Projekt Alpha" },
  { id: 2, name: "Projekt Beta" },
];

const currentUser: CurrentUser = {
  id: 1,
  firstName: "Igor",
  lastName: "Nejman",
  activeProjectId: 1,
  role: "admin",
};

const userList: User[] = [
  {
    id: 2,
    firstName: "Maciek",
    lastName: "Śmieszny",
    activeProjectId: null,
    role: "developer",
  },
  {
    id: 3,
    firstName: "Mateusz",
    lastName: "Kręcik",
    activeProjectId: null,
    role: "devops",
  },
];

export function listProjects(): Project[] {
  return projects;
}

export function getCurrentUser(): CurrentUser {
  return { ...currentUser };
}

export function getUserList(): User[] {
  return userList;
}

export function setActiveProjectId(projectId: number | null): CurrentUser {
  if (projectId !== null && !projects.some((p) => p.id === projectId)) {
    throw new Error("Nieznany projekt");
  }
  currentUser.activeProjectId = projectId;
  return getCurrentUser();
}
