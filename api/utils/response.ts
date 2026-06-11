import type { Request, Response, NextFunction } from "express";
import { applyPrivacyFilter, type DataPrivacyConfig } from "./privacy.js";

export const defaultPrivacyConfig: DataPrivacyConfig = {
  encryptSensitiveFields: true,
  maskIdentifiers: true,
  enableKAnonymity: false,
  enableDifferentialPrivacy: false,
  kValue: 5,
  epsilon: 1.0,
};

export function dataPrivacyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.locals.privacyConfig = { ...defaultPrivacyConfig };
  next();
}

export function privacyFilterMiddleware(config: Partial<DataPrivacyConfig> = {}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.locals.privacyConfig = { ...defaultPrivacyConfig, ...config };
    next();
  };
}

export function transformResponseForPrivacy<T>(
  data: T,
  config: DataPrivacyConfig
): T {
  if (Array.isArray(data)) {
    return data.map((item) => applyPrivacyFilter(item, config)) as unknown as T;
  }
  return applyPrivacyFilter(data, config);
}

export function sendPrivacyAwareResponse<T>(res: Response, data: T, statusCode = 200): void {
  const config = (res.locals.privacyConfig as DataPrivacyConfig) || defaultPrivacyConfig;
  const transformed = transformResponseForPrivacy(data, config);
  res.status(statusCode).json({
    success: true,
    data: transformed,
  });
}
