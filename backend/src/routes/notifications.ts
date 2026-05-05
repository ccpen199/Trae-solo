import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { authenticateJwt } from '../middleware/auth';
import { AuditService, AuditAction } from '../services/auditService';
import { EventType } from '@prisma/client';
import crypto from 'crypto';

const router = Router();

router.post('/webhooks', authenticateJwt, asyncHandler(
  async (req: Request, res: Response) => {
    const { applicationId, eventTypes, endpointUrl } = req.body;

    if (!applicationId || !eventTypes || !endpointUrl) {
      throw ApiError.badRequest('applicationId、eventTypes和endpointUrl为必填项');
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

    const secretKey = crypto.randomBytes(32).toString('hex');

    const webhook = await prisma.webhookSubscription.create({
      data: {
        applicationId,
        eventTypes,
        endpointUrl,
        secretKey,
        isActive: true
      }
    });

    await AuditService.logFromRequest(req, AuditAction.WEBHOOK_CREATE, {
      targetType: 'WebhookSubscription',
      targetId: webhook.id,
      applicationId,
      developerId: req.developer!.id,
      operatorType: 'developer',
      operatorId: req.developer!.id,
      details: { eventTypes, endpointUrl }
    });

    res.json({
      success: true,
      data: {
        webhook: {
          id: webhook.id,
          eventTypes: webhook.eventTypes,
          endpointUrl: webhook.endpointUrl,
          secretKey: webhook.secretKey,
          isActive: webhook.isActive,
          createdAt: webhook.createdAt
        }
      }
    });
  }
));

router.get('/webhooks', authenticateJwt, asyncHandler(
  async (req: Request, res: Response) => {
    const { applicationId } = req.query;

    const where: Record<string, unknown> = {};
    if (applicationId) {
      const app = await prisma.application.findUnique({
        where: { id: applicationId as string }
      });
      if (!app || app.developerId !== req.developer!.id) {
        throw ApiError.forbidden('无权访问此应用的Webhook');
      }
      where.applicationId = applicationId;
    } else {
      const userApps = await prisma.application.findMany({
        where: { developerId: req.developer!.id },
        select: { id: true }
      });
      where.applicationId = { in: userApps.map(a => a.id) };
    }

    const webhooks = await prisma.webhookSubscription.findMany({
      where,
      include: {
        application: {
          select: { id: true, name: true, appKey: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: {
        webhooks: webhooks.map(wh => ({
          id: wh.id,
          eventTypes: wh.eventTypes,
          endpointUrl: wh.endpointUrl,
          isActive: wh.isActive,
          lastTriggeredAt: wh.lastTriggeredAt,
          createdAt: wh.createdAt,
          application: wh.application
        }))
      }
    });
  }
));

router.put('/webhooks/:id', authenticateJwt, asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const { eventTypes, endpointUrl, isActive } = req.body;

    const webhook = await prisma.webhookSubscription.findUnique({
      where: { id: req.params.id },
      include: {
        application: {
          select: { developerId: true }
        }
      }
    });

    if (!webhook) {
      throw ApiError.notFound('Webhook订阅不存在');
    }

    if (webhook.application?.developerId !== req.developer!.id) {
      throw ApiError.forbidden('无权修改此Webhook');
    }

    const updatedWebhook = await prisma.webhookSubscription.update({
      where: { id: req.params.id },
      data: {
        eventTypes: eventTypes || webhook.eventTypes,
        endpointUrl: endpointUrl !== undefined ? endpointUrl : webhook.endpointUrl,
        isActive: isActive !== undefined ? isActive : webhook.isActive
      }
    });

    await AuditService.logFromRequest(req, AuditAction.WEBHOOK_UPDATE, {
      targetType: 'WebhookSubscription',
      targetId: updatedWebhook.id,
      applicationId: updatedWebhook.applicationId,
      developerId: req.developer!.id,
      operatorType: 'developer',
      operatorId: req.developer!.id
    });

    res.json({
      success: true,
      data: {
        webhook: {
          id: updatedWebhook.id,
          eventTypes: updatedWebhook.eventTypes,
          endpointUrl: updatedWebhook.endpointUrl,
          isActive: updatedWebhook.isActive
        }
      }
    });
  }
));

router.delete('/webhooks/:id', authenticateJwt, asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const webhook = await prisma.webhookSubscription.findUnique({
      where: { id: req.params.id },
      include: {
        application: {
          select: { developerId: true }
        }
      }
    });

    if (!webhook) {
      throw ApiError.notFound('Webhook订阅不存在');
    }

    if (webhook.application?.developerId !== req.developer!.id) {
      throw ApiError.forbidden('无权删除此Webhook');
    }

    await prisma.webhookSubscription.delete({
      where: { id: req.params.id }
    });

    await AuditService.logFromRequest(req, AuditAction.WEBHOOK_DELETE, {
      targetType: 'WebhookSubscription',
      targetId: req.params.id,
      applicationId: webhook.applicationId,
      developerId: req.developer!.id,
      operatorType: 'developer',
      operatorId: req.developer!.id
    });

    res.json({
      success: true,
      data: { message: 'Webhook订阅已删除' }
    });
  }
));

router.get('/events', authenticateJwt, asyncHandler(
  async (req: Request, res: Response) => {
    const { page = '1', pageSize = '20', applicationId, eventType } = req.query;
    const skip = (parseInt(page as string, 10) - 1) * parseInt(pageSize as string, 10);
    const take = parseInt(pageSize as string, 10);

    const where: Record<string, unknown> = {
      developerId: req.developer!.id
    };

    if (applicationId) {
      where.applicationId = applicationId;
    }

    if (eventType) {
      where.eventType = eventType;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        notifications: notifications.map(n => ({
          id: n.id,
          eventType: n.eventType,
          applicationId: n.applicationId,
          payload: n.payload,
          status: n.status,
          sentAt: n.sentAt,
          failedAt: n.failedAt,
          retryCount: n.retryCount,
          createdAt: n.createdAt
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

export { router as notificationsRouter };
