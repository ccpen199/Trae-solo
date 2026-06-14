import { Request, Response, NextFunction } from "express";
import encryptionService from "../services/encryptionService";
import logger from "../utils/logger";

interface EncryptionFields {
  [key: string]: string[];
}

const defaultEncryptedFields: EncryptionFields = {
  "/api/auth/register": ["idCard"],
  "/api/bookings": ["checkupPerson"],
  "/api/insurance/orders": ["applicant", "insured"],
};

export const encryptionMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const path = req.route?.path || req.baseUrl + req.path;
  const fields = defaultEncryptedFields[path];

  if (fields && req.body) {
    for (const field of fields) {
      if (req.body[field]) {
        try {
          if (typeof req.body[field] === "object") {
            req.body[`${field}Encrypted`] = encryptionService.encryptObject(req.body[field]);
          } else {
            req.body[`${field}Encrypted`] = encryptionService.encrypt(req.body[field]);
          }
          delete req.body[field];
        } catch (error) {
          logger.error("字段加密失败", { field, error });
        }
      }
    }
  }

  next();
};

export const decryptResponse = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const originalSend = res.send;

  res.send = function (data: unknown) {
    try {
      if (typeof data === "string") {
        const parsed = JSON.parse(data);
        if (parsed.success && parsed.data) {
          const decryptedData = decryptSensitiveData(parsed.data);
          return originalSend.call(this, JSON.stringify({ ...parsed, data: decryptedData }));
        }
      }
    } catch (error) {
      logger.debug("响应数据解密失败", { error });
    }
    return originalSend.call(this, data);
  };

  next();
};

const decryptSensitiveData = (data: unknown): unknown => {
  if (Array.isArray(data)) {
    return data.map(decryptSensitiveData);
  }

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (key.endsWith("Encrypted") && typeof value === "string") {
        const originalKey = key.replace("Encrypted", "");
        try {
          result[originalKey] = encryptionService.decrypt(value);
          try {
            result[originalKey] = JSON.parse(result[originalKey] as string);
          } catch {
            // 不是JSON，保留字符串
          }
        } catch (error) {
          result[key] = value;
        }
      } else {
        result[key] = decryptSensitiveData(value);
      }
    }

    return result;
  }

  return data;
};
