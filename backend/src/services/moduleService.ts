import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Module } from "../models/Module";
import { Bug } from "../models/Bug";

export class ModuleService {
  private moduleRepository: Repository<Module>;
  private bugRepository: Repository<Bug>;

  constructor() {
    this.moduleRepository = AppDataSource.getRepository(Module);
    this.bugRepository = AppDataSource.getRepository(Bug);
  }

  async createModule(
    projectId: string,
    name: string,
    code?: string,
    description?: string,
    parentId?: string,
    sortOrder?: number
  ): Promise<Module> {
    if (parentId) {
      const parentModule = await this.moduleRepository.findOne({
        where: { id: parentId, projectId },
      });

      if (!parentModule) {
        throw new Error("Parent module not found");
      }
    }

    const maxSortOrder = await this.moduleRepository
      .createQueryBuilder("module")
      .select("MAX(module.sortOrder)", "max")
      .where("module.projectId = :projectId", { projectId })
      .andWhere("module.parentId = :parentId OR (module.parentId IS NULL AND :parentId IS NULL)", {
        parentId: parentId || null,
      })
      .getRawOne();

    const newSortOrder = sortOrder ?? (maxSortOrder?.max ? parseInt(maxSortOrder.max) + 1 : 0);

    const moduleData = {
      projectId,
      name,
      code,
      description,
      parentId: parentId || null,
      sortOrder: newSortOrder,
    } as any;

    const module = this.moduleRepository.create(moduleData);

    return this.moduleRepository.save(module) as Promise<Module>;
  }

  async getModulesByProject(
    projectId: string,
    options?: {
      parentId?: string | null;
      includeChildren?: boolean;
    }
  ): Promise<Module[]> {
    const qb = this.moduleRepository.createQueryBuilder("module");

    qb.where("module.projectId = :projectId", { projectId });

    if (options?.parentId !== undefined) {
      if (options.parentId === null) {
        qb.andWhere("module.parentId IS NULL");
      } else {
        qb.andWhere("module.parentId = :parentId", { parentId: options.parentId });
      }
    }

    qb.orderBy("module.sortOrder", "ASC");

    if (options?.includeChildren) {
      qb.leftJoinAndSelect("module.children", "children")
        .leftJoinAndSelect("children.children", "grandchildren");
    }

    return qb.getMany();
  }

  async getModuleById(moduleId: string): Promise<Module | null> {
    return this.moduleRepository.findOne({
      where: { id: moduleId },
      relations: ["project", "parent", "children", "bugs"],
    });
  }

  async updateModule(
    moduleId: string,
    updates: Partial<Pick<Module, "name" | "code" | "description" | "parentId" | "sortOrder">>
  ): Promise<Module> {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId },
    });

    if (!module) {
      throw new Error("Module not found");
    }

    if (updates.parentId) {
      if (updates.parentId === moduleId) {
        throw new Error("Cannot set parent to self");
      }

      const parentModule = await this.moduleRepository.findOne({
        where: { id: updates.parentId, projectId: module.projectId },
      });

      if (!parentModule) {
        throw new Error("Parent module not found");
      }

      const isDescendant = await this.isDescendant(moduleId, updates.parentId);
      if (isDescendant) {
        throw new Error("Cannot move module to a descendant");
      }
    }

    Object.assign(module, updates);

    return this.moduleRepository.save(module);
  }

  private async isDescendant(parentId: string, childId: string): Promise<boolean> {
    const module = await this.moduleRepository.findOne({
      where: { id: childId },
    });

    if (!module) return false;
    if (module.parentId === parentId) return true;
    if (module.parentId) return this.isDescendant(parentId, module.parentId);

    return false;
  }

  async deleteModule(moduleId: string): Promise<void> {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId },
      relations: ["children", "bugs"],
    });

    if (!module) {
      throw new Error("Module not found");
    }

    const bugCount = await this.bugRepository.count({
      where: { moduleId },
    });

    if (bugCount > 0) {
      throw new Error("Cannot delete module with existing bugs");
    }

    if (module.children && module.children.length > 0) {
      throw new Error("Cannot delete module with child modules");
    }

    await this.moduleRepository.remove(module);
  }

  async reorderModules(moduleIds: string[], parentId?: string | null): Promise<Module[]> {
    const modules = await this.moduleRepository
      .createQueryBuilder("module")
      .where("module.id IN (:...ids)", { ids: moduleIds })
      .getMany();

    if (modules.length !== moduleIds.length) {
      throw new Error("Some modules not found");
    }

    const updatedModules: Module[] = [];

    for (let i = 0; i < moduleIds.length; i++) {
      const module = modules.find((m) => m.id === moduleIds[i]);
      if (module) {
        module.sortOrder = i;
        updatedModules.push(await this.moduleRepository.save(module));
      }
    }

    return updatedModules;
  }

  async moveModule(
    moduleId: string,
    newParentId: string | null,
    newProjectId?: string
  ): Promise<Module> {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId },
    });

    if (!module) {
      throw new Error("Module not found");
    }

    if (newParentId) {
      if (newParentId === moduleId) {
        throw new Error("Cannot set parent to self");
      }

      const isDescendant = await this.isDescendant(moduleId, newParentId);
      if (isDescendant) {
        throw new Error("Cannot move module to a descendant");
      }
    }

    if (newProjectId) {
      module.projectId = newProjectId;
      (module as any).parentId = null;
    } else if (newParentId !== undefined) {
      (module as any).parentId = newParentId || null;
    }

    return this.moduleRepository.save(module);
  }

  async getModuleTree(projectId: string): Promise<any[]> {
    const modules = await this.moduleRepository.find({
      where: { projectId },
      relations: ["children", "bugs"],
      order: { sortOrder: "ASC" },
    });

    const buildTree = (parentId: string | null): any[] => {
      return modules
        .filter((m) => m.parentId === parentId)
        .map((module) => ({
          id: module.id,
          name: module.name,
          code: module.code,
          type: "module",
          sortOrder: module.sortOrder,
          bugCount: module.bugs?.length || 0,
          children: buildTree(module.id),
        }));
    };

    return buildTree(null);
  }
}

export const moduleService = new ModuleService();
