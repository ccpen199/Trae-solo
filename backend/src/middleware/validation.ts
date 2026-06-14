import { Request, Response, NextFunction } from "express";
import { z, ZodSchema, ZodIssue } from "zod";
import { error } from "../utils/response";
import logger from "../utils/logger";

export const validateBody = <T extends ZodSchema>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors = (err.issues as ZodIssue[]).map((e: ZodIssue) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        error(res, "VALIDATION_ERROR", "参数验证失败", errors, 400);
        return;
      }
      logger.error("参数验证错误", { error: err });
      error(res, "VALIDATION_ERROR", "参数验证失败", undefined, 400);
    }
  };
};

export const validateQuery = <T extends ZodSchema>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors = (err.issues as ZodIssue[]).map((e: ZodIssue) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        error(res, "VALIDATION_ERROR", "查询参数验证失败", errors, 400);
        return;
      }
      logger.error("查询参数验证错误", { error: err });
      error(res, "VALIDATION_ERROR", "查询参数验证失败", undefined, 400);
    }
  };
};

export const validateParams = <T extends ZodSchema>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.params);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors = (err.issues as ZodIssue[]).map((e: ZodIssue) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        error(res, "VALIDATION_ERROR", "路径参数验证失败", errors, 400);
        return;
      }
      logger.error("路径参数验证错误", { error: err });
      error(res, "VALIDATION_ERROR", "路径参数验证失败", undefined, 400);
    }
  };
};
