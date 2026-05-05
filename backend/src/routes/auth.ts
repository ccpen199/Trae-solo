import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { asyncHandler, BadRequestError, UnauthorizedError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new BadRequestError('Username and password are required');
    }

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User is inactive');
    }

    const jwtSecret = (process.env.JWT_SECRET as string) || 'order-scheduler-jwt-secret-key-2024';
    const expiresIn = (process.env.JWT_EXPIRES_IN as string) || '24h';

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      },
      jwtSecret as jwt.Secret,
      { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role
        }
      }
    });
  })
);

router.get(
  '/me',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json({
      success: true,
      data: req.user
    });
  })
);

router.post(
  '/logout',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  })
);

export default router;
