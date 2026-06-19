import { Request, Response, NextFunction } from 'express';
import { error } from '../utils/response';
import { config } from '../config';

const ipRequestMap = new Map<string, { count: number; windowStart: number }>();
const deviceRequestMap = new Map<string, { count: number; windowStart: number }>();

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = (req.ip || req.headers['x-forwarded-for'] || '127.0.0.1') as string;
  const deviceId = req.headers['x-device-id'] as string || 'unknown';

  const now = Date.now();
  const windowMs = config.rateLimit.window * 1000;

  const ipData = ipRequestMap.get(ip) || { count: 0, windowStart: now };
  if (now - ipData.windowStart > windowMs) {
    ipData.count = 0;
    ipData.windowStart = now;
  }
  ipData.count++;
  ipRequestMap.set(ip, ipData);

  if (ipData.count > config.rateLimit.max * 2) {
    return res.status(429).json(error('请求过于频繁，请稍后再试', 429));
  }

  const deviceData = deviceRequestMap.get(deviceId) || { count: 0, windowStart: now };
  if (now - deviceData.windowStart > windowMs) {
    deviceData.count = 0;
    deviceData.windowStart = now;
  }
  deviceData.count++;
  deviceRequestMap.set(deviceId, deviceData);

  if (deviceData.count > config.rateLimit.max * 3) {
    return res.status(429).json(error('设备请求过于频繁', 429));
  }

  next();
}
