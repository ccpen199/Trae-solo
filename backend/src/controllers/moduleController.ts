import { Request, Response } from "express";
import { moduleService } from "../services/moduleService";
import { successResponse, errorResponse } from "../utils/response";

export const createModule = async (req: Request, res: Response) => {
  try {
    const { projectId, name, code, description, parentId } = req.body;

    if (!projectId || !name) {
      return res
        .status(400)
        .json(errorResponse("Project ID and name are required", "VALIDATION_ERROR"));
    }

    const module = await moduleService.createModule(
      projectId,
      name,
      code,
      description,
      parentId
    );

    res
      .status(201)
      .json(successResponse(module, "Module created successfully"));
  } catch (error: any) {
    res
      .status(400)
      .json(errorResponse(error.message || "Failed to create module", "MODULE_CREATE_FAILED"));
  }
};

export const getModules = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const parentId = req.query.parentId as string | undefined;
    const includeChildren = req.query.includeChildren === "true";

    if (!projectId) {
      return res
        .status(400)
        .json(errorResponse("Project ID is required", "VALIDATION_ERROR"));
    }

    const modules = await moduleService.getModulesByProject(projectId, {
      parentId: parentId === "null" ? null : parentId,
      includeChildren,
    });

    res.json(successResponse(modules, "Modules retrieved successfully"));
  } catch (error: any) {
    res
      .status(500)
      .json(errorResponse(error.message || "Failed to get modules", "INTERNAL_ERROR"));
  }
};

export const getModuleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const module = await moduleService.getModuleById(id);

    if (!module) {
      return res
        .status(404)
        .json(errorResponse("Module not found", "MODULE_NOT_FOUND"));
    }

    res.json(successResponse(module, "Module retrieved successfully"));
  } catch (error: any) {
    res
      .status(500)
      .json(errorResponse(error.message || "Failed to get module", "INTERNAL_ERROR"));
  }
};

export const updateModule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, description, parentId, sortOrder } = req.body;

    const module = await moduleService.updateModule(id, {
      name,
      code,
      description,
      parentId,
      sortOrder,
    });

    res.json(successResponse(module, "Module updated successfully"));
  } catch (error: any) {
    res
      .status(400)
      .json(errorResponse(error.message || "Failed to update module", "MODULE_UPDATE_FAILED"));
  }
};

export const deleteModule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await moduleService.deleteModule(id);

    res.json(successResponse(null, "Module deleted successfully"));
  } catch (error: any) {
    res
      .status(400)
      .json(errorResponse(error.message || "Failed to delete module", "MODULE_DELETE_FAILED"));
  }
};

export const reorderModules = async (req: Request, res: Response) => {
  try {
    const { moduleIds, parentId } = req.body;

    if (!Array.isArray(moduleIds) || moduleIds.length === 0) {
      return res
        .status(400)
        .json(errorResponse("Module IDs array is required", "VALIDATION_ERROR"));
    }

    const modules = await moduleService.reorderModules(
      moduleIds,
      parentId === "null" ? null : parentId
    );

    res.json(successResponse(modules, "Modules reordered successfully"));
  } catch (error: any) {
    res
      .status(400)
      .json(errorResponse(error.message || "Failed to reorder modules", "MODULE_REORDER_FAILED"));
  }
};

export const moveModule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newParentId, newProjectId } = req.body;

    const module = await moduleService.moveModule(
      id,
      newParentId === "null" ? null : newParentId,
      newProjectId
    );

    res.json(successResponse(module, "Module moved successfully"));
  } catch (error: any) {
    res
      .status(400)
      .json(errorResponse(error.message || "Failed to move module", "MODULE_MOVE_FAILED"));
  }
};

export const getModuleTree = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const tree = await moduleService.getModuleTree(projectId);

    res.json(successResponse(tree, "Module tree retrieved successfully"));
  } catch (error: any) {
    res
      .status(400)
      .json(errorResponse(error.message || "Failed to get module tree", "INTERNAL_ERROR"));
  }
};
