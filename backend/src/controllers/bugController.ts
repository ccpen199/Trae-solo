import { Request, Response } from "express";
import { bugService } from "../services/bugService";
import { successResponse, errorResponse, paginatedResponse } from "../utils/response";
import { BugStatus, BugSeverity, BugPriority } from "../utils/enums";

export const createBug = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json(errorResponse("Authentication required", "AUTH_REQUIRED"));
    }

    const {
      projectId,
      title,
      description,
      moduleId,
      requirementId,
      versionId,
      assigneeId,
      severity,
      priority,
      stepsToReproduce,
      expectedResult,
      actualResult,
      environment,
      attachments,
    } = req.body;

    if (!projectId || !title || !description) {
      return res
        .status(400)
        .json(errorResponse("Project ID, title and description are required", "VALIDATION_ERROR"));
    }

    const bug = await bugService.createBug(
      projectId,
      title,
      description,
      req.user.userId,
      {
        moduleId,
        requirementId,
        versionId,
        assigneeId,
        severity,
        priority,
        stepsToReproduce,
        expectedResult,
        actualResult,
        environment,
        attachments,
      }
    );

    res
      .status(201)
      .json(successResponse(bug, "Bug created successfully"));
  } catch (error: any) {
    res
      .status(400)
      .json(errorResponse(error.message || "Failed to create bug", "BUG_CREATE_FAILED"));
  }
};

export const getBugs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const skip = (page - 1) * pageSize;

    const options = {
      projectId: req.query.projectId as string,
      moduleId: req.query.moduleId as string,
      requirementId: req.query.requirementId as string,
      versionId: req.query.versionId as string,
      status: req.query.status as BugStatus,
      severity: req.query.severity as BugSeverity,
      priority: req.query.priority as BugPriority,
      assigneeId: req.query.assigneeId as string,
      reporterId: req.query.reporterId as string,
      isPublished: req.query.isPublished !== undefined
        ? req.query.isPublished === "true"
        : undefined,
      search: req.query.search as string,
      skip,
      take: pageSize,
      sortBy: req.query.sortBy as string,
      sortOrder: (req.query.sortOrder as "ASC" | "DESC") || "DESC",
    };

    const result = await bugService.getBugs(options);

    res.json(paginatedResponse(result.bugs, page, pageSize, result.total));
  } catch (error: any) {
    res
      .status(500)
      .json(errorResponse(error.message || "Failed to get bugs", "INTERNAL_ERROR"));
  }
};

export const getBugById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const bug = await bugService.getBugById(id);

    if (!bug) {
      return res
        .status(404)
        .json(errorResponse("Bug not found", "BUG_NOT_FOUND"));
    }

    res.json(successResponse(bug, "Bug retrieved successfully"));
  } catch (error: any) {
    res
      .status(500)
      .json(errorResponse(error.message || "Failed to get bug", "INTERNAL_ERROR"));
  }
};

export const updateBug = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json(errorResponse("Authentication required", "AUTH_REQUIRED"));
    }

    const { id } = req.params;
    const {
      title,
      description,
      moduleId,
      requirementId,
      versionId,
      assigneeId,
      severity,
      priority,
      stepsToReproduce,
      expectedResult,
      actualResult,
      environment,
      attachments,
    } = req.body;

    const bug = await bugService.updateBug(
      id,
      {
        title,
        description,
        moduleId,
        requirementId,
        versionId,
        assigneeId,
        severity,
        priority,
        stepsToReproduce,
        expectedResult,
        actualResult,
        environment,
        attachments,
      },
      req.user.userId
    );

    res.json(successResponse(bug, "Bug updated successfully"));
  } catch (error: any) {
    res
      .status(400)
      .json(errorResponse(error.message || "Failed to update bug", "BUG_UPDATE_FAILED"));
  }
};

export const updateBugStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json(errorResponse("Authentication required", "AUTH_REQUIRED"));
    }

    const { id } = req.params;
    const { status, comment } = req.body;

    if (!status) {
      return res
        .status(400)
        .json(errorResponse("Status is required", "VALIDATION_ERROR"));
    }

    const bug = await bugService.updateBugStatus(
      id,
      status,
      req.user.userId,
      comment
    );

    res.json(successResponse(bug, "Bug status updated successfully"));
  } catch (error: any) {
    res
      .status(400)
      .json(errorResponse(error.message || "Failed to update bug status", "BUG_STATUS_UPDATE_FAILED"));
  }
};

export const publishBugs = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json(errorResponse("Authentication required", "AUTH_REQUIRED"));
    }

    const { bugIds } = req.body;

    if (!Array.isArray(bugIds) || bugIds.length === 0) {
      return res
        .status(400)
        .json(errorResponse("Bug IDs array is required", "VALIDATION_ERROR"));
    }

    const bugs = await bugService.publishBugs(bugIds, req.user.userId);

    res.json(successResponse(bugs, "Bugs published successfully"));
  } catch (error: any) {
    res
      .status(400)
      .json(errorResponse(error.message || "Failed to publish bugs", "BUG_PUBLISH_FAILED"));
  }
};

export const deleteBug = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json(errorResponse("Authentication required", "AUTH_REQUIRED"));
    }

    const { id } = req.params;

    await bugService.deleteBug(id, req.user.userId);

    res.json(successResponse(null, "Bug deleted successfully"));
  } catch (error: any) {
    res
      .status(400)
      .json(errorResponse(error.message || "Failed to delete bug", "BUG_DELETE_FAILED"));
  }
};

export const assignBug = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json(errorResponse("Authentication required", "AUTH_REQUIRED"));
    }

    const { id } = req.params;
    const { assigneeId } = req.body;

    if (!assigneeId) {
      return res
        .status(400)
        .json(errorResponse("Assignee ID is required", "VALIDATION_ERROR"));
    }

    const bug = await bugService.assignBug(id, assigneeId, req.user.userId);

    res.json(successResponse(bug, "Bug assigned successfully"));
  } catch (error: any) {
    res
      .status(400)
      .json(errorResponse(error.message || "Failed to assign bug", "BUG_ASSIGN_FAILED"));
  }
};

export const getBugHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const history = await bugService.getBugHistory(id);

    res.json(successResponse(history, "Bug history retrieved successfully"));
  } catch (error: any) {
    res
      .status(500)
      .json(errorResponse(error.message || "Failed to get bug history", "INTERNAL_ERROR"));
  }
};

export const getAllowedTransitions = async (req: Request, res: Response) => {
  try {
    const { status } = req.params;

    if (!status) {
      return res
        .status(400)
        .json(errorResponse("Status is required", "VALIDATION_ERROR"));
    }

    const transitions = bugService.getAllowedTransitions(status as BugStatus);

    res.json(successResponse({ status, transitions }, "Allowed transitions retrieved successfully"));
  } catch (error: any) {
    res
      .status(500)
      .json(errorResponse(error.message || "Failed to get transitions", "INTERNAL_ERROR"));
  }
};
