import { Router, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest, roleMiddleware, auditMiddleware } from '../middleware';
import { logger } from '../lib/logger';
import { UserRole, CampaignStatus, SendStatus } from '@prisma/client';
import { templateDynamicEngine } from '../engines/template-dynamic.engine';
import { analyticsTrackerEngine } from '../engines/analytics-tracker.engine';
import { deliverabilityOptEngine } from '../engines/deliverability-opt.engine';
import { mailService } from '../services/mail.service';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(authMiddleware);

router.post(
  '/campaign/:campaignId/start',
  roleMiddleware(UserRole.ADMIN, UserRole.MARKETING_OPERATOR),
  [param('campaignId').isUUID().withMessage('无效的活动ID')],
  auditMiddleware('START_CAMPAIGN', 'Campaign'),
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }
      
      const { campaignId } = req.params;
      
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          template: true,
          audience: {
            include: {
              members: {
                where: { isSubscribed: true },
              },
            },
          },
        },
      });
      
      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: '活动不存在',
        });
      }
      
      if (campaign.status !== CampaignStatus.REVIEW_APPROVED) {
        return res.status(400).json({
          success: false,
          error: `活动状态为 ${campaign.status}，需要先通过审核`,
        });
      }
      
      if (!campaign.template) {
        return res.status(400).json({
          success: false,
          error: '活动未关联模板',
        });
      }
      
      if (!campaign.audience) {
        return res.status(400).json({
          success: false,
          error: '活动未关联受众',
        });
      }
      
      const members = campaign.audience.members;
      
      if (members.length === 0) {
        return res.status(400).json({
          success: false,
          error: '受众中没有可发送的成员',
        });
      }
      
      const maxPerBatch = config.batch.maxPerBatch;
      const totalBatches = Math.ceil(members.length / maxPerBatch);
      
      const batches: Array<{ members: typeof members; batchNumber: number }> = [];
      for (let i = 0; i < totalBatches; i++) {
        const batchMembers = members.slice(i * maxPerBatch, (i + 1) * maxPerBatch);
        batches.push({ members: batchMembers, batchNumber: i + 1 });
      }
      
      await prisma.$transaction(async (tx) => {
        await tx.campaign.update({
          where: { id: campaignId },
          data: {
            status: CampaignStatus.PENDING_SEND,
            startedAt: new Date(),
          },
        });
        
        for (const batch of batches) {
          await tx.sendBatch.create({
            data: {
              campaignId,
              audienceId: campaign.audience!.id,
              batchNumber: batch.batchNumber,
              totalEmails: batch.members.length,
              sentEmails: 0,
              failedEmails: 0,
              status: 'PENDING',
              config: {
                maxPerBatch,
                concurrentSends: config.batch.concurrentSends,
              } as unknown as Record<string, unknown>,
            },
          });
        }
      });
      
      logger.info(`Campaign ${campaignId} started by ${req.user?.email}. ${members.length} emails queued in ${totalBatches} batches.`);
      
      res.json({
        success: true,
        data: {
          campaignId,
          status: CampaignStatus.PENDING_SEND,
          totalEmails: members.length,
          totalBatches,
          maxPerBatch,
        },
      });
    } catch (error) {
      logger.error('Start campaign error:', error);
      res.status(500).json({
        success: false,
        error: '启动活动失败',
      });
    }
  }
);

router.post(
  '/batch/:batchId/send',
  roleMiddleware(UserRole.ADMIN, UserRole.MARKETING_OPERATOR),
  [param('batchId').isUUID().withMessage('无效的批次ID')],
  auditMiddleware('SEND_BATCH', 'SendBatch'),
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }
      
      const { batchId } = req.params;
      
      const batch = await prisma.sendBatch.findUnique({
        where: { id: batchId },
        include: {
          campaign: {
            include: {
              template: true,
            },
          },
          audience: {
            include: {
              members: {
                where: { isSubscribed: true },
              },
            },
          },
        },
      });
      
      if (!batch) {
        return res.status(404).json({
          success: false,
          error: '批次不存在',
        });
      }
      
      if (batch.status === 'SENDING') {
        return res.status(400).json({
          success: false,
          error: '批次正在发送中',
        });
      }
      
      if (batch.status === 'COMPLETED') {
        return res.status(400).json({
          success: false,
          error: '批次已发送完成',
        });
      }
      
      if (!batch.campaign?.template) {
        return res.status(400).json({
          success: false,
          error: '活动未关联模板',
        });
      }
      
      const members = batch.audience?.members || [];
      
      if (members.length === 0) {
        return res.status(400).json({
          success: false,
          error: '批次中没有可发送的成员',
        });
      }
      
      await prisma.sendBatch.update({
        where: { id: batchId },
        data: {
          status: 'SENDING',
          startedAt: new Date(),
        },
      });
      
      let sentCount = 0;
      let failedCount = 0;
      const sendResults: Array<{ email: string; success: boolean; trackingId?: string; error?: string }> = [];
      
      const template = batch.campaign.template;
      const campaign = batch.campaign;
      
      for (const member of members) {
        const trackingId = `trk_${uuidv4().replace(/-/g, '')}`;
        
        try {
          const optResult = await deliverabilityOptEngine.optimizeSend(
            campaign.id,
            member.id,
            member.email
          );
          
          if (!optResult.shouldSend) {
            failedCount++;
            sendResults.push({
              email: member.email,
              success: false,
              error: optResult.reason,
            });
            
            await prisma.sendLog.create({
              data: {
                batchId,
                memberId: member.id,
                campaignId: campaign.id,
                email: member.email,
                subject: campaign.subject || template.subject,
                trackingId,
                status: SendStatus.FAILED,
                errorMessage: optResult.reason,
              },
            });
            
            continue;
          }
          
          const context = {
            member: {
              email: member.email,
              name: member.name,
              firstName: member.firstName,
              lastName: member.lastName,
              phone: member.phone,
              company: member.company,
              position: member.position,
              country: member.country,
              city: member.city,
              tags: member.tags as string[] | undefined,
              profileData: member.profileData as Record<string, unknown> | undefined,
              customFields: member.customFields as Record<string, unknown> | undefined,
            },
            campaign: {
              id: campaign.id,
              name: campaign.name,
              subject: campaign.subject || template.subject,
            },
            template: {
              id: template.id,
              name: template.name,
            },
            tracking: {
              trackingId,
            },
          };
          
          const renderResult = templateDynamicEngine.renderContent(
            template.htmlContent,
            template.textContent || '',
            campaign.subject || template.subject,
            context
          );
          
          if (!renderResult.success) {
            failedCount++;
            sendResults.push({
              email: member.email,
              success: false,
              error: renderResult.errors?.join('; '),
            });
            
            await prisma.sendLog.create({
              data: {
                batchId,
                memberId: member.id,
                campaignId: campaign.id,
                email: member.email,
                subject: renderResult.subject,
                trackingId,
                status: SendStatus.FAILED,
                errorMessage: renderResult.errors?.join('; '),
              },
            });
            
            continue;
          }
          
          let htmlContent = renderResult.html;
          let clickTrackingUrls: Record<string, string> = {};
          let openTrackingUrl: string | undefined;
          
          if (campaign.enableTracking) {
            const trackingResult = templateDynamicEngine.injectTracking(
              renderResult.html,
              config.tracking.baseUrl,
              trackingId
            );
            htmlContent = trackingResult.html;
            openTrackingUrl = trackingResult.openTrackingUrl;
            clickTrackingUrls = trackingResult.clickUrls;
          }
          
          const emailResult = await mailService.sendMail({
            to: member.email,
            subject: renderResult.subject,
            html: htmlContent,
            text: renderResult.text,
            from: campaign.fromEmail || config.smtp.from,
            replyTo: campaign.replyTo,
            headers: {
              'X-Email-Marketing-Tracking-ID': trackingId,
              'X-Campaign-ID': campaign.id,
              'X-Batch-ID': batchId,
            },
          });
          
          if (emailResult.success) {
            sentCount++;
            sendResults.push({
              email: member.email,
              success: true,
              trackingId,
            });
            
            await prisma.sendLog.create({
              data: {
                batchId,
                memberId: member.id,
                campaignId: campaign.id,
                senderId: req.user?.id,
                email: member.email,
                subject: renderResult.subject,
                trackingId,
                status: SendStatus.SENT,
                sentAt: new Date(),
                openTrackingPixel: openTrackingUrl,
                clickTrackingLinks: clickTrackingUrls as unknown as Record<string, unknown>,
              },
            });
          } else {
            failedCount++;
            sendResults.push({
              email: member.email,
              success: false,
              error: emailResult.error,
            });
            
            await prisma.sendLog.create({
              data: {
                batchId,
                memberId: member.id,
                campaignId: campaign.id,
                email: member.email,
                subject: renderResult.subject,
                trackingId,
                status: SendStatus.FAILED,
                errorMessage: emailResult.error,
              },
            });
          }
        } catch (error) {
          failedCount++;
          const errorMessage = error instanceof Error ? error.message : '未知错误';
          sendResults.push({
            email: member.email,
            success: false,
            error: errorMessage,
          });
          
          logger.error(`Failed to send email to ${member.email}:`, error);
        }
      }
      
      const allCompleted = sentCount + failedCount === members.length;
      const batchStatus = allCompleted ? 'COMPLETED' : 'PARTIAL';
      
      await prisma.$transaction(async (tx) => {
        await tx.sendBatch.update({
          where: { id: batchId },
          data: {
            status: batchStatus,
            sentEmails: sentCount,
            failedEmails: failedCount,
            completedAt: allCompleted ? new Date() : undefined,
          },
        });
        
        const campaignBatches = await tx.sendBatch.findMany({
          where: { campaignId: batch.campaignId },
        });
        
        const allBatchesCompleted = campaignBatches.every(b => b.status === 'COMPLETED');
        
        if (allBatchesCompleted) {
          await tx.campaign.update({
            where: { id: batch.campaignId },
            data: {
              status: CampaignStatus.COMPLETED,
              completedAt: new Date(),
            },
          });
        }
      });
      
      logger.info(`Batch ${batchId} processed: ${sentCount} sent, ${failedCount} failed by ${req.user?.email}`);
      
      res.json({
        success: true,
        data: {
          batchId,
          status: batchStatus,
          totalEmails: members.length,
          sentCount,
          failedCount,
          results: sendResults.slice(0, 50),
          totalResults: sendResults.length,
        },
      });
    } catch (error) {
      logger.error('Send batch error:', error);
      res.status(500).json({
        success: false,
        error: '发送批次失败',
      });
    }
  }
);

router.get(
  '/logs',
  roleMiddleware(UserRole.ADMIN, UserRole.DATA_ANALYST),
  auditMiddleware('LIST_SEND_LOGS', 'SendLog'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, campaignId, status, email, startDate, endDate } = req.query;
      
      const where: Record<string, unknown> = {};
      
      if (campaignId && typeof campaignId === 'string') {
        where.campaignId = campaignId;
      }
      
      if (status && typeof status === 'string') {
        where.status = status;
      }
      
      if (email && typeof email === 'string') {
        where.email = { contains: email, mode: 'insensitive' };
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
        prisma.sendLog.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            batch: { select: { batchNumber: true } },
            member: { select: { name: true, company: true } },
            clickLogs: { take: 5, orderBy: { createdAt: 'desc' } },
          },
        }),
        prisma.sendLog.count({ where }),
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
      logger.error('List send logs error:', error);
      res.status(500).json({
        success: false,
        error: '获取发送日志失败',
      });
    }
  }
);

router.get(
  '/logs/:id',
  roleMiddleware(UserRole.ADMIN, UserRole.DATA_ANALYST),
  [param('id').isUUID().withMessage('无效的日志ID')],
  auditMiddleware('GET_SEND_LOG', 'SendLog'),
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }
      
      const { id } = req.params;
      
      const log = await prisma.sendLog.findUnique({
        where: { id },
        include: {
          batch: true,
          member: true,
          campaign: {
            select: { id: true, name: true, status: true },
          },
          clickLogs: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      
      if (!log) {
        return res.status(404).json({
          success: false,
          error: '发送日志不存在',
        });
      }
      
      res.json({
        success: true,
        data: log,
      });
    } catch (error) {
      logger.error('Get send log error:', error);
      res.status(500).json({
        success: false,
        error: '获取发送日志失败',
      });
    }
  }
);

export default router;
