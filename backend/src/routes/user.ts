import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index';
import { asyncHandler, BadRequestError, NotFoundError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

router.get(
  '/',
  authMiddleware,
  requireRole('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count()
    ]);

    res.json({
      success: true,
      data: {
        users: users.map((u) => ({
          id: u.id,
          username: u.username,
          name: u.name,
          role: u.role,
          isActive: u.isActive,
          lastLoginAt: u.lastLoginAt,
          createdAt: u.createdAt
        })),
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  })
);

router.post(
  '/',
  authMiddleware,
  requireRole('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { username, password, name, role } = req.body;

    if (!username || !password || !name) {
      throw new BadRequestError('Username, password and name are required');
    }

    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      throw new BadRequestError('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: role || 'scheduler'
      }
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  })
);

router.put(
  '/:id',
  authMiddleware,
  requireRole('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, role, isActive, password } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updateData: any = { name, role, isActive };
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        role: updatedUser.role,
        isActive: updatedUser.isActive
      }
    });
  })
);

export default router;
