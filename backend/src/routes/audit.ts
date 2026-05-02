import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import securityVault from '../engines/security-vault';

const ROLES = {
  ADMIN: 'ADMIN',
  CASHIER: 'CASHIER',
  FINANCIAL_MANAGER: 'FINANCIAL_MANAGER',
  CFO: 'CFO',
  AUDITOR: 'AUDITOR',
};

const router = Router();

router.get(
  '/',
  authMiddleware([ROLES.ADMIN, ROLES.AUDITOR, ROLES.CFO]),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        page = '1',
        pageSize = '20',
        userId,
        module,
        action,
        status,
        startDate,
        endDate,
        targetType,
        targetId,
      } = req.query;

      const where: any = {};
      if (userId) where.userId = userId as string;
      if (module) where.module = module as string;
      if (action) where.action = action as string;
      if (status) where.status = status as string;
      if (targetType) where.targetType = targetType as string;
      if (targetId) where.targetId = targetId as string;
      if (startDate) {
        where.createdAt = { ...where.createdAt, gte: new Date(startDate as string) };
      }
      if (endDate) {
        where.createdAt = { ...where.createdAt, lte: new Date(endDate as string) };
      }

      const pageNum = parseInt(page as string);
      const sizeNum = parseInt(pageSize as string);

      const [total, logs] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          include: {
            user: { select: { id: true, username: true, realName: true, role: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (pageNum - 1) * sizeNum,
          take: sizeNum,
        }),
      ]);

      res.json({
        success: true,
        data: {
          total,
          page: pageNum,
          pageSize: sizeNum,
          totalPages: Math.ceil(total / sizeNum),
          items: logs,
        },
      });
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ 
        success: false, 
        error: '获取审计日志失败' 
      });
    }
  }
);

router.get(
  '/stats',
  authMiddleware([ROLES.ADMIN, ROLES.AUDITOR, ROLES.CFO]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      const where: any = {};
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      const [total, countByStatus, countByAction, countByModule] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        prisma.auditLog.groupBy({
          by: ['action'],
          where,
          _count: true,
        }),
        prisma.auditLog.groupBy({
          by: ['module'],
          where,
          _count: true,
        }),
      ]);

      res.json({
        success: true,
        data: {
          total,
          byStatus: countByStatus.map((s) => ({
            status: s.status,
            count: s._count,
          })),
          byAction: countByAction.map((a) => ({
            action: a.action,
            count: a._count,
          })),
          byModule: countByModule.map((m) => ({
            module: m.module,
            count: m._count,
          })),
        },
      });
    } catch (error) {
      console.error('Get audit stats error:', error);
      res.status(500).json({ 
        success: false, 
        error: '获取审计统计失败' 
      });
    }
  }
);

router.get(
  '/:id',
  authMiddleware([ROLES.ADMIN, ROLES.AUDITOR, ROLES.CFO]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const log = await prisma.auditLog.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
              email: true,
            },
          },
        },
      });

      if (!log) {
        return res.status(404).json({ 
          success: false, 
          error: '审计日志不存在' 
        });
      }

      res.json({
        success: true,
        data: log,
      });
    } catch (error) {
      console.error('Get audit log error:', error);
      res.status(500).json({ 
        success: false, 
        error: '获取审计日志详情失败' 
      });
    }
  }
);

export default router;
