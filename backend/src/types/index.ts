import { Request } from 'express';

interface UserPayload {
  id: number;
  username: string;
  role: string;
  name: string;
}

interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export { AuthenticatedRequest, UserPayload };
