import { Request } from 'express';
import { Role } from '@hospital/shared';

export interface UserPayload {
  userId: string;
  username: string;
  name: string;
  role: Role;
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user: UserPayload;
  requestId: string;
}
