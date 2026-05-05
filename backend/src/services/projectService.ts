import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Project } from "../models/Project";
import { Module } from "../models/Module";
import { UserRole } from "../utils/enums";

export class ProjectService {
  private projectRepository: Repository<Project>;
  private moduleRepository: Repository<Module>;

  constructor() {
    this.projectRepository = AppDataSource.getRepository(Project);
    this.moduleRepository = AppDataSource.getRepository(Module);
  }

  async createProject(
    name: string,
    code: string,
    description?: string,
    sortOrder?: number
  ): Promise<Project> {
    const existingProject = await this.projectRepository.findOne({
      where: { code },
    });

    if (existingProject) {
      throw new Error("Project with this code already exists");
    }

    const maxSortOrder = await this.projectRepository
      .createQueryBuilder("project")
      .select("MAX(project.sortOrder)", "max")
      .getRawOne();

    const newSortOrder = sortOrder ?? (maxSortOrder?.max ? parseInt(maxSortOrder.max) + 1 : 0);

    const project = this.projectRepository.create({
      name,
      code,
      description,
      sortOrder: newSortOrder,
    });

    return this.projectRepository.save(project);
  }

  async getAllProjects(options?: {
    skip?: number;
    take?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{ projects: Project[]; total: number }> {
    const qb = this.projectRepository.createQueryBuilder("project");

    if (options?.search) {
      qb.andWhere(
        "(project.name LIKE :search OR project.code LIKE :search OR project.description LIKE :search)",
        { search: `%${options.search}%` }
      );
    }

    if (options?.isActive !== undefined) {
      qb.andWhere("project.isActive = :isActive", { isActive: options.isActive });
    }

    qb.orderBy("project.sortOrder", "ASC").addOrderBy("project.createdAt", "DESC");

    if (options?.skip !== undefined) {
      qb.skip(options.skip);
    }

    if (options?.take !== undefined) {
      qb.take(options.take);
    }

    const [projects, total] = await qb.getManyAndCount();

    return { projects, total };
  }

  async getProjectById(projectId: string): Promise<Project | null> {
    return this.projectRepository.findOne({
      where: { id: projectId },
      relations: ["modules", "requirements", "versions", "users", "groups"],
    });
  }

  async updateProject(
    projectId: string,
    updates: Partial<Pick<Project, "name" | "code" | "description" | "isActive" | "sortOrder">>
  ): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    if (updates.code && updates.code !== project.code) {
      const existingProject = await this.projectRepository.findOne({
        where: { code: updates.code },
      });

      if (existingProject) {
        throw new Error("Project with this code already exists");
      }
    }

    Object.assign(project, updates);

    return this.projectRepository.save(project);
  }

  async deleteProject(projectId: string): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ["modules", "bugs", "requirements", "versions"],
    });

    if (!project) {
      throw new Error("Project not found");
    }

    if (project.bugs && project.bugs.length > 0) {
      throw new Error("Cannot delete project with existing bugs");
    }

    await this.projectRepository.remove(project);
  }

  async reorderProjects(projectIds: string[]): Promise<Project[]> {
    const projects = await this.projectRepository
      .createQueryBuilder("project")
      .where("project.id IN (:...ids)", { ids: projectIds })
      .getMany();

    if (projects.length !== projectIds.length) {
      throw new Error("Some projects not found");
    }

    const updatedProjects: Project[] = [];

    for (let i = 0; i < projectIds.length; i++) {
      const project = projects.find((p) => p.id === projectIds[i]);
      if (project) {
        project.sortOrder = i;
        updatedProjects.push(await this.projectRepository.save(project));
      }
    }

    return updatedProjects;
  }

  async getProjectTree(projectId: string): Promise<any> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ["modules"],
    });

    if (!project) {
      throw new Error("Project not found");
    }

    const modules = await this.moduleRepository.find({
      where: { projectId },
      relations: ["children", "bugs"],
      order: { sortOrder: "ASC" },
    });

    const buildModuleTree = (parentId: string | null): any[] => {
      return modules
        .filter((m) => m.parentId === parentId)
        .map((module) => ({
          id: module.id,
          name: module.name,
          code: module.code,
          type: "module",
          sortOrder: module.sortOrder,
          bugCount: module.bugs?.length || 0,
          children: buildModuleTree(module.id),
        }));
    };

    return {
      id: project.id,
      name: project.name,
      code: project.code,
      type: "project",
      description: project.description,
      isActive: project.isActive,
      children: buildModuleTree(null),
    };
  }

  async checkProjectAccess(
    userId: string,
    projectId: string,
    userRole: UserRole
  ): Promise<boolean> {
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    const project = await this.projectRepository
      .createQueryBuilder("project")
      .leftJoinAndSelect("project.users", "user")
      .leftJoinAndSelect("project.groups", "group")
      .leftJoinAndSelect("group.users", "groupUser")
      .where("project.id = :projectId", { projectId })
      .getOne();

    if (!project) {
      return false;
    }

    const hasDirectAccess = project.users?.some((u: any) => u.id === userId);
    if (hasDirectAccess) return true;

    const hasGroupAccess = project.groups?.some((group: any) =>
      group.users?.some((u: any) => u.id === userId)
    );

    return hasGroupAccess || false;
  }
}

export const projectService = new ProjectService();
