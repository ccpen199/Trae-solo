import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../database/data-source";
import { AuditLog, AuditAction } from "../entities/AuditLog";
import { AuthRequest } from "./auth";

export const auditLog = async (
  action: AuditAction,
  req: AuthRequest,
  targetId?: number,
  targetType?: string,
  oldValue?: Record<string, any>,
  newValue?: Record<string, any>,
  description?: string
): Promise<void> => {
  try {
    const auditRepository = AppDataSource.getRepository(AuditLog);

    const audit = auditRepository.create({
      action,
      userId: req.user?.id,
      userName: req.user?.name,
      targetId,
      targetType,
      oldValue,
      newValue,
      description,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
      isSensitive: ["position_publish", "candidate_stage_change", "approval_approve", "approval_reject", "ai_screening"].includes(action),
    });

    await auditRepository.save(audit);
  } catch (error) {
    console.error("Audit log error:", error);
  }
};

export const auditMiddleware = (action: AuditAction, targetType?: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const originalSend = res.send;
    let responseBody: any;

    res.send = function (body: any) {
      responseBody = body;
      return originalSend.call(this, body);
    };

    res.on("finish", async () => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          let targetId: number | undefined;
          let newValue: Record<string, any> | undefined;

          if (responseBody && typeof responseBody === "string") {
            try {
              const parsed = JSON.parse(responseBody);
              if (parsed.id) {
                targetId = parsed.id;
                newValue = parsed;
              } else if (parsed.data && parsed.data.id) {
                targetId = parsed.data.id;
                newValue = parsed.data;
              }
            } catch {
              // ignore
            }
          } else if (responseBody && responseBody.id) {
            targetId = responseBody.id;
            newValue = responseBody;
          }

          if (!targetId && req.params.id) {
            targetId = parseInt(req.params.id);
          }

          await auditLog(
            action,
            req,
            targetId,
            targetType,
            undefined,
            newValue,
            `${req.method} ${req.path}`
          );
        }
      } catch (error) {
        console.error("Audit middleware error:", error);
      }
    });

    next();
  };
};
