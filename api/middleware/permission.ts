import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { error } from '../utils/response.js';

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(error('未登录'));
      return;
    }
    
    if (!roles.includes(req.user.role)) {
      res.status(403).json(error('权限不足'));
      return;
    }
    
    next();
  };
}

export function canAccessSchool(schoolId: number | undefined, req: AuthRequest): boolean {
  if (!req.user) return false;
  if (req.user.role === 'city_admin') return true;
  if (req.user.role === 'school_admin' && req.user.schoolId === schoolId) return true;
  return false;
}

export function getAccessibleSchoolIds(req: AuthRequest): number[] | undefined {
  if (!req.user) return [];
  if (req.user.role === 'city_admin') return undefined;
  if (req.user.role === 'school_admin' && req.user.schoolId) return [req.user.schoolId];
  return [];
}
