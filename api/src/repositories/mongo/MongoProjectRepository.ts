import type { Project } from "../../types";
import type { IProjectRepository } from "../interfaces/IProjectRepository";
import { ProjectModel } from "./models/ProjectModel";
import { getNextSequence } from "./models/CounterModel";

function toProject(doc: any): Project {
  return {
    id: doc.id,
    name: doc.name,
  };
}

export class MongoProjectRepository implements IProjectRepository {
  async listProjects(): Promise<Project[]> {
    const docs = await ProjectModel.find().sort({ id: 1 }).lean();
    return docs.map(toProject);
  }

  async createProject(name: string): Promise<Project> {
    const id = await getNextSequence("project");
    const doc = await ProjectModel.create({ id, name: name.trim() });
    return toProject(doc);
  }
}
