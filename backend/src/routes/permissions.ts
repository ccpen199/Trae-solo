import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { authenticateJwt, authenticateAppKey } from '../middleware/auth';
import { PermissionService } from '../services/permissionService';
import { AuditService, AuditAction } from '../services/auditService';
import { ApiScope, RoleType } from '@prisma/client';

const router = Router();

router.get('/scopes', authenticateJwt, asyncHandler(
  async (req: Request, res: Response) => {
    const allScopes = PermissionService.getAllApiScopes();
    
    const scopeDescriptions: Record<ApiScope, string> = {
      [ApiScope.USER_READ]: '读取用户信息',
      [ApiScope.USER_WRITE]: '修改用户信息',
      [ApiScope.ORDER_READ]: '读取订单信息',
      [ApiScope.ORDER_WRITE]: '创建/修改订单',
      [ApiScope.PRODUCT_READ]: '读取商品信息',
      [ApiScope.PRODUCT_WRITE]: '创建/修改商品',
      [ApiScope.TRADE_READ]: '读取交易信息',
      [ApiScope.TRADE_WRITE]: '创建/修改交易',
      [ApiScope.LOGISTICS_READ]: '读取物流信息',
      [ApiScope.LOGISTICS_WRITE]: '创建/修改物流',
      [ApiScope.FINANCE_READ]: '读取财务信息',
      [ApiScope.FINANCE_WRITE]: '创建/修改财务',
      [ApiScope.MESSAGE_SEND]: '发送消息',
      [ApiScope.MESSAGE_RECEIVE]: '接收消息'
    };

    res.json({
      success: true,
      data: {
        scopes: allScopes.map(scope => ({
          name: scope,
          description: scopeDescriptions[scope] || scope
        }))
      }
    });
  }
));

router.get('/roles', authenticateJwt, asyncHandler(
  async (req: Request, res: Response) => {
    const allRoles = PermissionService.getAllRoleTypes();
    
    const roleDescriptions: Record<RoleType, string> = {
      [RoleType.BUYER]: '买家',
      [RoleType.SELLER]: '卖家',
      [RoleType.VIP_SELLER]: '高级卖家',
      [RoleType.MERCHANT_ADMIN]: '商户管理员',
      [RoleType.PLATFORM_ADMIN]: '平台管理员'
    };

    res.json({
      success: true,
      data: {
        roles: allRoles.map(role => ({
          type: role,
          name: roleDescriptions[role] || role,
          defaultScopes: PermissionService.getDefaultScopesForRole(role)
        }))
      }
    });
  }
));

router.post('/verify', authenticateJwt, asyncHandler(
  async (req: Request, res: Response) => {
    const { endpoint, method, userId, applicationId } = req.body;

    if (!endpoint || !method) {
      throw ApiError.badRequest('endpoint和method为必填项');
    }

    let appScopes: string[] = [];
    let appData: any = null;

    if (applicationId) {
      const application = await prisma.application.findUnique({
        where: {
          id: applicationId,
          developerId: req.developer!.id
        }
      });

      if (!application) {
        throw ApiError.notFound('应用不存在或无权访问');
      }

      appData = application;
      appScopes = (application as any).approvedScopes || [];
    } else {
      appScopes = PermissionService.getDefaultScopesForRole('SELLER');
    }

    const requiredScopes = PermissionService.getScopesForEndpoint(endpoint, method);

    let userScopes: string[] = [];
    if (userId && applicationId) {
      const grant = await prisma.userApiGrant.findFirst({
        where: {
          userId,
          applicationId,
          isActive: true
        }
      });
      userScopes = grant ? grant.grantedScopes : [];
    } else {
      userScopes = appScopes;
    }

    const result = PermissionService.canAccess(
      appScopes,
      userScopes,
      requiredScopes
    );

    res.json({
      success: true,
      data: {
        allowed: result.allowed,
        requiredScopes,
        appScopes,
        userScopes,
        missingScopes: result.missingScopes,
        application: appData ? {
          id: appData.id,
          name: appData.name,
          appKey: appData.appKey
        } : null
      }
    });
  }
));

router.post('/grant', authenticateJwt, asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, roleType, applicationId, grantedScopes } = req.body;

    if (!userId || !roleType || !applicationId) {
      throw ApiError.badRequest('userId、roleType和applicationId为必填项');
    }

    const application = await prisma.application.findUnique({
      where: {
        id: applicationId,
        developerId: req.developer!.id
      }
    });

    if (!application) {
      throw ApiError.notFound('应用不存在');
    }

    const role = await prisma.role.findUnique({
      where: { type: roleType as RoleType }
    });

    let roleId: string;
    if (role) {
      roleId = role.id;
    } else {
      const newRole = await prisma.role.create({
        data: {
          type: roleType as RoleType,
          name: roleType,
          defaultApiScopes: PermissionService.getDefaultScopesForRole(roleType as RoleType)
        }
      });
      roleId = newRole.id;
    }

    const existingGrant = await prisma.userApiGrant.findUnique({
      where: {
        userId_applicationId: {
          userId,
          applicationId
        }
      }
    });

    let grant;
    const scopesToGrant = grantedScopes || PermissionService.getDefaultScopesForRole(roleType as RoleType);

    if (existingGrant) {
      grant = await prisma.userApiGrant.update({
        where: { id: existingGrant.id },
        data: {
          roleId,
          grantedScopes: scopesToGrant,
          isActive: true,
          revokedAt: null
        }
      });
    } else {
      grant = await prisma.userApiGrant.create({
        data: {
          userId,
          roleId,
          applicationId,
          grantedScopes: scopesToGrant,
          isActive: true
        }
      });
    }

    await AuditService.logFromRequest(req, AuditAction.USER_GRANT, {
      targetType: 'UserApiGrant',
      targetId: grant.id,
      applicationId,
      developerId: req.developer!.id,
      operatorType: 'developer',
      operatorId: req.developer!.id,
      details: { userId, roleType, scopesToGrant }
    });

    res.json({
      success: true,
      data: {
        grant: {
          id: grant.id,
          userId: grant.userId,
          grantedScopes: grant.grantedScopes,
          isActive: grant.isActive
        }
      }
    });
  }
));

router.post('/revoke', authenticateJwt, asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, applicationId } = req.body;

    if (!userId || !applicationId) {
      throw ApiError.badRequest('userId和applicationId为必填项');
    }

    const grant = await prisma.userApiGrant.findUnique({
      where: {
        userId_applicationId: {
          userId,
          applicationId
        }
      }
    });

    if (!grant) {
      throw ApiError.notFound('授权记录不存在');
    }

    const revokedGrant = await prisma.userApiGrant.update({
      where: { id: grant.id },
      data: {
        isActive: false,
        revokedAt: new Date()
      }
    });

    await AuditService.logFromRequest(req, AuditAction.USER_REVOKE, {
      targetType: 'UserApiGrant',
      targetId: revokedGrant.id,
      applicationId,
      developerId: req.developer!.id,
      operatorType: 'developer',
      operatorId: req.developer!.id,
      details: { userId }
    });

    res.json({
      success: true,
      data: {
        grant: {
          id: revokedGrant.id,
          userId: revokedGrant.userId,
          isActive: revokedGrant.isActive
        }
      }
    });
  }
));

export { router as permissionsRouter };
