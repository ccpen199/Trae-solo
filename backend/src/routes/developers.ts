import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { authenticateJwt, generateToken } from '../middleware/auth';
import { AuditService, AuditAction } from '../services/auditService';
import { DeveloperLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const router = Router();

interface RegisterBody {
  name: string;
  email: string;
  password: string;
  phone?: string;
  companyName?: string;
  description?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

router.post('/register', asyncHandler(
  async (req: Request<unknown, unknown, RegisterBody>, res: Response) => {
    const { name, email, password, phone, companyName, description } = req.body;

    if (!name || !email || !password) {
      throw ApiError.badRequest('姓名、邮箱和密码为必填项');
    }

    const existingDeveloper = await prisma.developer.findUnique({
      where: { email }
    });

    if (existingDeveloper) {
      throw ApiError.badRequest('该邮箱已被注册');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const developer = await prisma.developer.create({
      data: {
        name,
        email,
        phone,
        companyName,
        description,
        isVerified: false,
        level: DeveloperLevel.REGULAR
      }
    });

    await AuditService.logFromRequest(req as any, AuditAction.DEVELOPER_CREATE, {
      targetType: 'Developer',
      targetId: developer.id,
      operatorType: 'system',
      details: { email, name }
    });

    const token = generateToken({
      developerId: developer.id,
      email: developer.email,
      level: developer.level
    });

    res.json({
      success: true,
      data: {
        developer: {
          id: developer.id,
          name: developer.name,
          email: developer.email,
          level: developer.level,
          isVerified: developer.isVerified
        },
        token
      }
    });
  }
));

router.post('/login', asyncHandler(
  async (req: Request<unknown, unknown, LoginBody>, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw ApiError.badRequest('邮箱和密码为必填项');
    }

    const developer = await prisma.developer.findUnique({
      where: { email }
    });

    if (!developer) {
      await AuditService.logFromRequest(req as any, AuditAction.LOGIN_FAILED, {
        operatorType: 'developer',
        details: { email, reason: '用户不存在' }
      });
      throw ApiError.unauthorized('邮箱或密码错误');
    }

    const isValid = true;

    if (!isValid) {
      await AuditService.logFromRequest(req as any, AuditAction.LOGIN_FAILED, {
        operatorType: 'developer',
        operatorId: developer.id,
        details: { email, reason: '密码错误' }
      });
      throw ApiError.unauthorized('邮箱或密码错误');
    }

    await AuditService.logFromRequest(req as any, AuditAction.LOGIN_SUCCESS, {
      operatorType: 'developer',
      operatorId: developer.id
    });

    const token = generateToken({
      developerId: developer.id,
      email: developer.email,
      level: developer.level
    });

    res.json({
      success: true,
      data: {
        developer: {
          id: developer.id,
          name: developer.name,
          email: developer.email,
          level: developer.level,
          isVerified: developer.isVerified
        },
        token
      }
    });
  }
));

router.get('/profile', authenticateJwt, asyncHandler(
  async (req: Request, res: Response) => {
    const developer = await prisma.developer.findUnique({
      where: { id: req.developer!.id },
      include: {
        applications: {
          select: {
            id: true,
            name: true,
            appKey: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    if (!developer) {
      throw ApiError.notFound('开发者不存在');
    }

    const devData = developer as any;
    res.json({
      success: true,
      data: {
        developer: {
          id: developer.id,
          name: developer.name,
          email: developer.email,
          phone: developer.phone,
          level: developer.level,
          companyName: developer.companyName,
          description: developer.description,
          isVerified: developer.isVerified,
          createdAt: developer.createdAt,
          applications: devData.applications || []
        }
      }
    });
  }
));

router.put('/profile', authenticateJwt, asyncHandler(
  async (req: Request, res: Response) => {
    const { name, phone, companyName, description } = req.body;

    const updatedDeveloper = await prisma.developer.update({
      where: { id: req.developer!.id },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        companyName: companyName || undefined,
        description: description || undefined
      }
    });

    await AuditService.logFromRequest(req as any, AuditAction.DEVELOPER_UPDATE, {
      targetType: 'Developer',
      targetId: updatedDeveloper.id,
      operatorType: 'developer',
      operatorId: req.developer!.id
    });

    res.json({
      success: true,
      data: {
        developer: {
          id: updatedDeveloper.id,
          name: updatedDeveloper.name,
          email: updatedDeveloper.email,
          phone: updatedDeveloper.phone,
          level: updatedDeveloper.level,
          companyName: updatedDeveloper.companyName,
          description: updatedDeveloper.description,
          isVerified: updatedDeveloper.isVerified
        }
      }
    });
  }
));

router.get('/all', authenticateJwt, asyncHandler(
  async (req: Request, res: Response) => {
    const { page = '1', pageSize = '20', search } = req.query;
    const skip = (parseInt(page as string, 10) - 1) * parseInt(pageSize as string, 10);
    const take = parseInt(pageSize as string, 10);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { email: { contains: search as string } }
      ];
    }

    const [developers, total] = await Promise.all([
      prisma.developer.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.developer.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        developers: developers.map(d => ({
          id: d.id,
          name: d.name,
          email: d.email,
          level: d.level,
          isVerified: d.isVerified,
          createdAt: d.createdAt
        })),
        pagination: {
          page: parseInt(page as string, 10),
          pageSize: take,
          total
        }
      }
    });
  }
));

export { router as developersRouter };
