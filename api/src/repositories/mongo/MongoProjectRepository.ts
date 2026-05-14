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

  async updateProject(id: number, name: string): Promise<Project | null> {
    const doc = await ProjectModel.findOneAndUpdate(
      { id },
      { name: name.trim() },
      { new: true },
    ).lean();
    if (!doc) return null;
    return toProject(doc);
  }

  async deleteProject(id: number): Promise<boolean> {
    const result = await ProjectModel.deleteOne({ id });
    return result.deletedCount > 0;
  }
}
