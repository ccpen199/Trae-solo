import { Request, Response } from "express";
import { projectService } from "../services/projectService";
import { successResponse, errorResponse, paginatedResponse } from "../utils/response";
import { UserRole } from "../utils/enums";

export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      return res
        .status(400)
        .json(errorResponse("Name and code are required", "VALIDATION_ERROR"));
    }

    const project = await projectService.createProject(name, code, description);

    res
      .status(201)
      .json(successResponse(project, "Project created successfully"));
  } catch (error: any) {
    res
      .status(400)
      .json(errorResponse(error.message || "Failed to create project", "PROJECT_CREATE_FAILED"));
  }
};

export const getProjects = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const search = req.query.search as string | undefined;
    const isActive = req.query.isActive !== undefined
      ? req.query.isActive === "true"
      : undefined;

    const skip = (page - 1) * pageSize;

    const result = await projectService.getAllProjects({
      skip,
      take: pageSize,
      search,
      isActive,
    });

    res.json(paginatedResponse(result.projects, page, pageSize, result.total));
  } catch (error: any) {
    res
      .status(500)
      .json(errorResponse(error.message || "Failed to get projects", "INTERNAL_ERROR"));
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const project = await projectService.getProjectById(id);

    if (!project) {
      return res
        .status(404)
        .json(errorResponse("Project not found", "PROJECT_NOT_FOUND"));
    }

    res.json(successResponse(project, "Project retrieved successfully"));
  } catch (error: any) {
    res
      .status(500)
      .json(errorResponse(error.message || "Failed to get project", "INTERNAL_ERROR"));
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, description, isActive, sortOrder } = req.body;

    const project = await projectService.updateProject(id, {
      name,
      code,
      description,
      isActive,
      sortOrder,
    });

    res.json(successResponse(project, "Project updated successfully"));
  } catch (error: any) {
    res
      .status(400)
      .json(errorResponse(error.message || "Failed to update project", "PROJECT_UPDATE_FAILED"));
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await projectService.deleteProject(id);

    res.json(successResponse(null, "Project deleted successfully"));
  } catch (error: any) {
    res
      .status(400)
      .json(errorResponse(error.message || "Failed to delete project", "PROJECT_DELETE_FAILED"));
  }
};

export const reorderProjects = async (req: Request, res: Response) => {
  try {
    const { projectIds } = req.body;

    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return res
        .status(400)
        .json(errorResponse("Project IDs array is required", "VALIDATION_ERROR"));
    }

    const projects = await projectService.reorderProjects(projectIds);

    res.json(successResponse(projects, "Projects reordered successfully"));
  } catch (error: any) {
    res
      .status(400)
      .json(errorResponse(error.message || "Failed to reorder projects", "PROJECT_REORDER_FAILED"));
  }
};

export const getProjectTree = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const tree = await projectService.getProjectTree(id);

    res.json(successResponse(tree, "Project tree retrieved successfully"));
  } catch (error: any) {
    res
      .status(400)
      .json(errorResponse(error.message || "Failed to get project tree", "INTERNAL_ERROR"));
  }
};
