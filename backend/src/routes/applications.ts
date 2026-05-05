import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { authenticateJwt } from '../middleware/auth';
import { AuditService, AuditAction } from '../services/auditService';
import { PermissionService } from '../services/permissionService';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { AppStatus, ApplicationType, ApiScope } from '@prisma/client';

const router = Router();

interface CreateAppBody {
  name: string;
  type: ApplicationType;
  description?: string;
  callbackUrl?: string;
  notifyUrl?: string;
  requestedScopes?: ApiScope[];
}

router.post('/', authenticateJwt, asyncHandler(
  async (req: Request<unknown, unknown, CreateAppBody>, res: Response) => {
    const { name, type, description, callbackUrl, notifyUrl, requestedScopes } = req.body;

    if (!name || !type) {
      throw ApiError.badRequest('应用名称和类型为必填项');
    }

    const developer = await prisma.developer.findUnique({
      where: { id: req.developer!.id }
    });

    if (!developer) {
      throw ApiError.notFound('开发者不存在');
    }

    const defaultScopes = PermissionService.getDefaultScopesForDeveloper(developer.level);
    const appKey = `TIP-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const appSecret = crypto.randomBytes(32).toString('hex');

    const application = await prisma.application.create({
      data: {
        name,
        appKey,
        appSecret,
        type,
        description,
        callbackUrl,
        notifyUrl,
        developerId: req.developer!.id,
        status: AppStatus.DRAFT,
        defaultScopes,
        approvedScopes: defaultScopes,
        requestedScopes: requestedScopes || [],
        isSandbox: true,
        rateLimitPerMin: 100,
        dailyLimit: 10000
      }
    });

    await prisma.apiKey.create({
      data: {
        key: appKey,
        applicationId: application.id,
        developerId: req.developer!.id,
        isActive: true
      }
    });

    await AuditService.logFromRequest(req as any, AuditAction.APP_CREATE, {
      targetType: 'Application',
      targetId: application.id,
      applicationId: application.id,
      developerId: req.developer!.id,
      operatorType: 'developer',
      operatorId: req.developer!.id,
      details: { name, type }
    });

    res.json({
      success: true,
      data: {
        application: {
          id: application.id,
          name: application.name,
          appKey: application.appKey,
          appSecret: application.appSecret,
          type: application.type,
          status: application.status,
          callbackUrl: application.callbackUrl,
          notifyUrl: application.notifyUrl,
          defaultScopes: application.defaultScopes,
          approvedScopes: application.approvedScopes,
          requestedScopes: application.requestedScopes,
          isSandbox: application.isSandbox,
          createdAt: application.createdAt
        }
      }
    });
  }
));

router.get('/', authenticateJwt, asyncHandler(
  async (req: Request, res: Response) => {
    const { page = '1', pageSize = '20', status } = req.query;
    const skip = (parseInt(page as string, 10) - 1) * parseInt(pageSize as string, 10);
    const take = parseInt(pageSize as string, 10);

    const where: Record<string, unknown> = {
      developerId: req.developer!.id
    };

    if (status) {
      where.status = status;
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          apiKeys: {
            where: { isActive: true },
            take: 1
          }
        }
      }),
      prisma.application.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        applications: applications.map(app => ({
          id: app.id,
          name: app.name,
          appKey: app.appKey,
          type: app.type,
          status: app.status,
          isSandbox: app.isSandbox,
          createdAt: app.createdAt,
          hasActiveKey: app.apiKeys.length > 0
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

router.get('/:id', authenticateJwt, asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const application = await prisma.application.findUnique({
      where: {
        id: req.params.id,
        developerId: req.developer!.id
      },
      include: {
        apiKeys: {
          where: { isActive: true }
        },
        developer: {
          select: {
            id: true,
            name: true,
            email: true,
            level: true
          }
        }
      }
    });

    if (!application) {
      throw ApiError.notFound('应用不存在');
    }

    res.json({
      success: true,
      data: {
        application: {
          id: application.id,
          name: application.name,
          appKey: application.appKey,
          appSecret: application.appSecret,
          type: application.type,
          description: application.description,
          status: application.status,
          callbackUrl: application.callbackUrl,
          notifyUrl: application.notifyUrl,
          defaultScopes: application.defaultScopes,
          approvedScopes: application.approvedScopes,
          requestedScopes: application.requestedScopes,
          rateLimitPerMin: application.rateLimitPerMin,
          dailyLimit: application.dailyLimit,
          isSandbox: application.isSandbox,
          approvedAt: application.approvedAt,
          suspendedAt: application.suspendedAt,
          createdAt: application.createdAt,
          updatedAt: application.updatedAt,
          apiKeys: application.apiKeys.map(k => ({
            id: k.id,
            key: k.key,
            isActive: k.isActive,
            lastUsedAt: k.lastUsedAt,
            createdAt: k.createdAt
          })),
          developer: application.developer
        }
      }
    });
  }
));

router.put('/:id', authenticateJwt, asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const { name, description, callbackUrl, notifyUrl, requestedScopes } = req.body;

    const application = await prisma.application.findUnique({
      where: {
        id: req.params.id,
        developerId: req.developer!.id
      }
    });

    if (!application) {
      throw ApiError.notFound('应用不存在');
    }

    const updatedApp = await prisma.application.update({
      where: { id: req.params.id },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        callbackUrl: callbackUrl !== undefined ? callbackUrl : undefined,
        notifyUrl: notifyUrl !== undefined ? notifyUrl : undefined,
        requestedScopes: requestedScopes || application.requestedScopes
      }
    });

    await AuditService.logFromRequest(req, AuditAction.APP_UPDATE, {
      targetType: 'Application',
      targetId: updatedApp.id,
      applicationId: updatedApp.id,
      developerId: req.developer!.id,
      operatorType: 'developer',
      operatorId: req.developer!.id
    });

    res.json({
      success: true,
      data: {
        application: {
          id: updatedApp.id,
          name: updatedApp.name,
          appKey: updatedApp.appKey,
          type: updatedApp.type,
          status: updatedApp.status
        }
      }
    });
  }
));

router.post('/:id/submit', authenticateJwt, asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const application = await prisma.application.findUnique({
      where: {
        id: req.params.id,
        developerId: req.developer!.id
      }
    });

    if (!application) {
      throw ApiError.notFound('应用不存在');
    }

    if (application.status !== AppStatus.DRAFT) {
      throw ApiError.badRequest('只有草稿状态的应用可以提交审核');
    }

    const updatedApp = await prisma.application.update({
      where: { id: req.params.id },
      data: {
        status: AppStatus.PENDING_REVIEW
      }
    });

    await AuditService.logFromRequest(req, AuditAction.APP_SUBMIT, {
      targetType: 'Application',
      targetId: updatedApp.id,
      applicationId: updatedApp.id,
      developerId: req.developer!.id,
      operatorType: 'developer',
      operatorId: req.developer!.id
    });

    res.json({
      success: true,
      data: {
        application: {
          id: updatedApp.id,
          name: updatedApp.name,
          status: updatedApp.status
        }
      }
    });
  }
));

router.post('/:id/rotate-key', authenticateJwt, asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const application = await prisma.application.findUnique({
      where: {
        id: req.params.id,
        developerId: req.developer!.id
      },
      include: {
        apiKeys: {
          where: { isActive: true }
        }
      }
    });

    if (!application) {
      throw ApiError.notFound('应用不存在');
    }

    const newAppKey = `TIP-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const newAppSecret = crypto.randomBytes(32).toString('hex');

    const tx = prisma as any;
    for (const oldKey of application.apiKeys) {
      await tx.apiKey.update({
        where: { id: oldKey.id },
        data: { isActive: false }
      });
    }

    await tx.application.update({
      where: { id: application.id },
      data: {
        appKey: newAppKey,
        appSecret: newAppSecret
      }
    });

    await tx.apiKey.create({
      data: {
        key: newAppKey,
        applicationId: application.id,
        developerId: req.developer!.id,
        isActive: true
      }
    });

    await AuditService.logFromRequest(req, AuditAction.API_KEY_ROTATE, {
      targetType: 'Application',
      targetId: application.id,
      applicationId: application.id,
      developerId: req.developer!.id,
      operatorType: 'developer',
      operatorId: req.developer!.id
    });

    res.json({
      success: true,
      data: {
        appKey: newAppKey,
        appSecret: newAppSecret
      }
    });
  }
));

export { router as applicationsRouter };
