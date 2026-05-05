import { Request, Response, NextFunction } from "express";
import { verifyToken, getTokenFromHeader, JwtPayload } from "../utils/jwt";
import { errorResponse } from "../utils/response";
import { UserRole } from "../utils/enums";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = getTokenFromHeader(req.headers.authorization);

  if (!token) {
    return res
      .status(401)
      .json(errorResponse("Authentication required", "AUTH_REQUIRED"));
  }

  const payload = verifyToken(token);

  if (!payload) {
    return res
      .status(401)
      .json(errorResponse("Invalid or expired token", "INVALID_TOKEN"));
  }

  req.user = payload;
  next();
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(401)
        .json(errorResponse("Authentication required", "AUTH_REQUIRED"));
    }

    const userRole = req.user.role as UserRole;

    if (!roles.includes(userRole) && userRole !== UserRole.ADMIN) {
      return res
        .status(403)
        .json(
          errorResponse(
            "Insufficient permissions",
            "INSUFFICIENT_PERMISSIONS"
          )
        );
    }

    next();
  };
};

export const optionalAuthenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = getTokenFromHeader(req.headers.authorization);

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
};
