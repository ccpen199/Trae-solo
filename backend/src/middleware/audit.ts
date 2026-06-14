import { Request, Response, NextFunction } from "express";
import auditService from "../services/auditService";
import encryptionService from "../services/encryptionService";
import logger from "../utils/logger";

interface AuditOptions {
  action: string;
  targetType: string;
  logRequest?: boolean;
  logResponse?: boolean;
}

export const auditMiddleware = (options: AuditOptions) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalSend = res.send;
    let responseData: unknown;

    res.send = function (data: unknown) {
      responseData = data;
      return originalSend.call(this, data);
    };

    const userId = req.user?.id;
    const ipAddress = (req.headers["x-forwarded-for"] as string) || req.ip || "";
    const userAgent = req.headers["user-agent"] || "";

    let requestDataEncrypted: string | undefined;
    let responseDataEncrypted: string | undefined;

    if (options.logRequest && Object.keys(req.body).length > 0) {
      try {
        requestDataEncrypted = encryptionService.encryptObject(req.body);
      } catch (error) {
        logger.warn("请求数据加密失败", { error });
      }
    }

    const logAudit = async () => {
      try {
        if (!userId) {
          return;
        }

        if (options.logResponse && responseData) {
          try {
            responseDataEncrypted = encryptionService.encrypt(
              typeof responseData === "string" ? responseData : JSON.stringify(responseData)
            );
          } catch (error) {
            logger.warn("响应数据加密失败", { error });
          }
        }

        await auditService.createLog({
          userId,
          action: options.action,
          targetType: options.targetType,
          targetId: req.params.id as string | undefined,
          ipAddress,
          userAgent,
          requestDataEncrypted,
          responseDataEncrypted,
        });
      } catch (error) {
        logger.error("创建审计日志失败", { error });
      }
    };

    res.on("finish", logAudit);

    next();
  };
};
