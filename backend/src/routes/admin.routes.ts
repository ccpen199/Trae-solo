import { Router, Response } from 'express';
import { authMiddleware, AuthRequest, roleMiddleware, auditMiddleware } from '../middleware';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { UserRole } from '@prisma/client';
import redis from '../lib/redis';
import { analyticsTrackerEngine } from '../engines/analytics-tracker.engine';
import { deliverabilityOptEngine } from '../engines/deliverability-opt.engine';

const router = Router();

router.get('/health', async (_req: AuthRequest, res: Response) => {
  try {
    const checks = {
      server: { status: 'ok', timestamp: new Date().toISOString() },
      database: { status: 'unknown' },
      redis: { status: 'unknown' },
    };
    
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database.status = 'ok';
    } catch {
      checks.database.status = 'error';
    }
    
    try {
      await redis.ping();
      checks.redis.status = 'ok';
    } catch {
      checks.redis.status = 'error';
    }
    
    const allOk = checks.database.status === 'ok' && checks.redis.status === 'ok';
    
    res.status(allOk ? 200 : 503).json({
      success: allOk,
      checks,
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: '健康检查失败',
    });
  }
});

router.use(authMiddleware);

router.get(
  '/dashboard',
  auditMiddleware('GET_DASHBOARD', 'System'),
  async (_req: AuthRequest, res: Response) => {
    try {
      const [
        totalCampaigns,
        activeCampaigns,
        totalAudiences,
        totalMembers,
        totalTemplates,
        totalSent,
        totalDelivered,
        totalOpened,
        totalClicked,
        recentAlerts,
        recentCampaigns,
      ] = await Promise.all([
        prisma.campaign.count(),
        prisma.campaign.count({ where: { status: { in: ['SENDING', 'PENDING_SEND'] } } }),
        prisma.audience.count(),
        prisma.audienceMember.count(),
        prisma.template.count(),
        prisma.sendLog.count(),
        prisma.sendLog.count({ where: { status: { in: ['DELIVERED', 'OPENED', 'CLICKED'] } } }),
        prisma.sendLog.count({ where: { openedAt: { not: null } } }),
        prisma.clickLog.count(),
        prisma.alert.findMany({
          where: { isAcknowledged: false },
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.campaign.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            creator: { select: { name: true } },
            _count: { select: { sendBatches: true } },
          },
        }),
      ]);
      
      const dashboardData = {
        summary: {
          totalCampaigns,
          activeCampaigns,
          totalAudiences,
          totalMembers,
          totalTemplates,
        },
        stats: {
          totalSent,
          totalDelivered,
          totalOpened,
          totalClicked,
          deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
          openRate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
          clickRate: totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0,
        },
        recentAlerts,
        recentCampaigns,
      };
      
      res.json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      logger.error('Get dashboard error:', error);
      res.status(500).json({
        success: false,
        error: '获取仪表板数据失败',
      });
    }
  }
);

router.get(
  '/alerts',
  roleMiddleware(UserRole.ADMIN, UserRole.MARKETING_OPERATOR),
  auditMiddleware('LIST_ALERTS', 'Alert'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, severity, isAcknowledged, type } = req.query;
      
      const where: Record<string, unknown> = {};
      
      if (severity && typeof severity === 'string') {
        where.severity = severity;
      }
      
      if (typeof isAcknowledged === 'string') {
        where.isAcknowledged = isAcknowledged === 'true';
      }
      
      if (type && typeof type === 'string') {
        where.type = type;
      }
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const [alerts, total] = await Promise.all([
        prisma.alert.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.alert.count({ where }),
      ]);
      
      res.json({
        success: true,
        data: {
          alerts,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logger.error('List alerts error:', error);
      res.status(500).json({
        success: false,
        error: '获取告警列表失败',
      });
    }
  }
);

router.post(
  '/alerts/:id/acknowledge',
  roleMiddleware(UserRole.ADMIN, UserRole.MARKETING_OPERATOR),
  auditMiddleware('ACKNOWLEDGE_ALERT', 'Alert'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const alert = await prisma.alert.findUnique({
        where: { id },
      });
      
      if (!alert) {
        return res.status(404).json({
          success: false,
          error: '告警不存在',
        });
      }
      
      const updatedAlert = await prisma.alert.update({
        where: { id },
        data: {
          isAcknowledged: true,
          acknowledgedBy: req.user!.id,
          acknowledgedAt: new Date(),
        },
      });
      
      logger.info(`Alert ${id} acknowledged by ${req.user?.email}`);
      
      res.json({
        success: true,
        data: updatedAlert,
      });
    } catch (error) {
      logger.error('Acknowledge alert error:', error);
      res.status(500).json({
        success: false,
        error: '确认告警失败',
      });
    }
  }
);

router.get(
  '/audit-logs',
  roleMiddleware(UserRole.ADMIN),
  auditMiddleware('LIST_AUDIT_LOGS', 'AuditLog'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, action, entityType, entityId, userId, startDate, endDate } = req.query;
      
      const where: Record<string, unknown> = {};
      
      if (action && typeof action === 'string') {
        where.action = action;
      }
      
      if (entityType && typeof entityType === 'string') {
        where.entityType = entityType;
      }
      
      if (entityId && typeof entityId === 'string') {
        where.entityId = entityId;
      }
      
      if (userId && typeof userId === 'string') {
        where.userId = userId;
      }
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate && typeof startDate === 'string') {
          (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
        }
        if (endDate && typeof endDate === 'string') {
          (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
        }
      }
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        }),
        prisma.auditLog.count({ where }),
      ]);
      
      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logger.error('List audit logs error:', error);
      res.status(500).json({
        success: false,
        error: '获取审计日志失败',
      });
    }
  }
);

router.get(
  '/reputation',
  roleMiddleware(UserRole.ADMIN, UserRole.DATA_ANALYST),
  auditMiddleware('GET_REPUTATION_DETAILS', 'System'),
  async (_req: AuthRequest, res: Response) => {
    try {
      const reputation = await deliverabilityOptEngine.getSenderReputation();
      
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      
      const [
        totalSent,
        totalDelivered,
        totalBounced,
        totalUnsubscribed,
        totalSpam,
      ] = await Promise.all([
        prisma.sendLog.count({ where: { createdAt: { gte: last30Days } } }),
        prisma.sendLog.count({ where: { createdAt: { gte: last30Days }, status: { in: ['DELIVERED', 'OPENED', 'CLICKED'] } } }),
        prisma.sendLog.count({ where: { createdAt: { gte: last30Days }, status: 'BOUNCED' } }),
        prisma.sendLog.count({ where: { createdAt: { gte: last30Days }, status: 'UNSUBSCRIBED' } }),
        prisma.sendLog.count({ where: { createdAt: { gte: last30Days }, status: 'SPAM' } }),
      ]);
      
      const details = {
        ...reputation,
        last30Days: {
          totalSent,
          totalDelivered,
          totalBounced,
          totalUnsubscribed,
          totalSpam,
          bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
          unsubscribeRate: totalSent > 0 ? (totalUnsubscribed / totalSent) * 100 : 0,
          spamRate: totalSent > 0 ? (totalSpam / totalSent) * 100 : 0,
        },
      };
      
      res.json({
        success: true,
        data: details,
      });
    } catch (error) {
      logger.error('Get reputation details error:', error);
      res.status(500).json({
        success: false,
        error: '获取发件人声誉详情失败',
      });
    }
  }
);

router.post(
  '/roi-report/generate',
  roleMiddleware(UserRole.ADMIN, UserRole.DATA_ANALYST),
  auditMiddleware('GENERATE_ROI_REPORT', 'ROIReport'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { periodStart, periodEnd, campaignIds, audienceFilters, name, description } = req.body;
      
      const start = periodStart ? new Date(periodStart) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = periodEnd ? new Date(periodEnd) : new Date();
      
      const where: Record<string, unknown> = {
        createdAt: {
          gte: start,
          lte: end,
        },
      };
      
      if (campaignIds && Array.isArray(campaignIds) && campaignIds.length > 0) {
        where.campaignId = { in: campaignIds };
      }
      
      const [
        totalSent,
        totalDelivered,
        totalOpened,
        totalClicked,
        totalUnsubscribed,
        totalBounced,
        totalFailed,
        uniqueOpens,
        uniqueClicks,
      ] = await Promise.all([
        prisma.sendLog.count({ where }),
        prisma.sendLog.count({ where: { ...where, status: { in: ['DELIVERED', 'OPENED', 'CLICKED'] } } }),
        prisma.sendLog.count({ where: { ...where, openedAt: { not: null } } }),
        prisma.sendLog.count({ where: { ...where, clickedAt: { not: null } } }),
        prisma.sendLog.count({ where: { ...where, status: 'UNSUBSCRIBED' } }),
        prisma.sendLog.count({ where: { ...where, status: 'BOUNCED' } }),
        prisma.sendLog.count({ where: { ...where, status: 'FAILED' } }),
        prisma.clickLog.count({ where: { sendLog: where, isUnique: true } }),
        prisma.clickLog.count({ where: { sendLog: where, isUnique: true } }),
      ]);
      
      const metrics = {
        totalSent,
        totalDelivered,
        totalOpened,
        totalClicked,
        totalUnsubscribed,
        totalBounced,
        totalFailed,
        uniqueOpens,
        uniqueClicks,
        
        deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
        openRate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
        clickRate: totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0,
        clickToOpenRate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
        unsubscribeRate: totalDelivered > 0 ? (totalUnsubscribed / totalDelivered) * 100 : 0,
        bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
      };
      
      const report = await prisma.rOIReport.create({
        data: {
          name: name || `ROI报表 ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
          description,
          periodStart: start,
          periodEnd: end,
          campaignIds: campaignIds as unknown as Record<string, unknown>,
          audienceFilters: audienceFilters as unknown as Record<string, unknown>,
          totalSent,
          totalDelivered,
          totalOpened,
          totalClicked,
          totalUnsubscribes: totalUnsubscribed,
          totalBounces: totalBounced,
          metrics: metrics as unknown as Record<string, unknown>,
          breakdown: {
            byStatus: {
              sent: totalSent,
              delivered: totalDelivered,
              opened: totalOpened,
              clicked: totalClicked,
              unsubscribed: totalUnsubscribed,
              bounced: totalBounced,
              failed: totalFailed,
            },
          } as unknown as Record<string, unknown>,
        },
      });
      
      logger.info(`ROI report generated by ${req.user?.email}: ${report.id}`);
      
      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      logger.error('Generate ROI report error:', error);
      res.status(500).json({
        success: false,
        error: '生成ROI报表失败',
      });
    }
  }
);

router.get(
  '/roi-reports',
  roleMiddleware(UserRole.ADMIN, UserRole.DATA_ANALYST),
  auditMiddleware('LIST_ROI_REPORTS', 'ROIReport'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const [reports, total] = await Promise.all([
        prisma.rOIReport.findMany({
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.rOIReport.count(),
      ]);
      
      res.json({
        success: true,
        data: {
          reports,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logger.error('List ROI reports error:', error);
      res.status(500).json({
        success: false,
        error: '获取ROI报表列表失败',
      });
    }
  }
);

export default router;
