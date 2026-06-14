import { Request } from 'express';
import { User } from '../../shared/types';
import type { UserPayload } from '../middleware/auth.js';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: number;
}

export interface RequestWithUser extends Request {
  user?: UserPayload;
}
