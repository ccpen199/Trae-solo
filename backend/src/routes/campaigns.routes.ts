import { Router, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest, roleMiddleware, auditMiddleware } from '../middleware';
import { logger } from '../lib/logger';
import { CampaignStatus, UserRole } from '@prisma/client';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  auditMiddleware('LIST_CAMPAIGNS', 'Campaign'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 20, status, search, creatorId } = req.query;
      
      const where: Record<string, unknown> = {};
      
      if (status && typeof status === 'string') {
        where.status = status;
      }
      
      if (search && typeof search === 'string') {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      if (creatorId && typeof creatorId === 'string') {
        where.creatorId = creatorId;
      }
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const [campaigns, total] = await Promise.all([
        prisma.campaign.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            creator: { select: { id: true, name: true, email: true } },
            template: { select: { id: true, name: true } },
            audience: { select: { id: true, name: true, totalCount: true } },
            reviews: { orderBy: { createdAt: 'desc' }, take: 1 },
            _count: {
              select: { sendBatches: true, journeys: true },
            },
          },
        }),
        prisma.campaign.count({ where }),
      ]);
      
      res.json({
        success: true,
        data: {
          campaigns,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logger.error('List campaigns error:', error);
      res.status(500).json({
        success: false,
        error: '获取活动列表失败',
      });
    }
  }
);

router.get(
  '/:id',
  [param('id').isUUID().withMessage('无效的活动ID')],
  auditMiddleware('GET_CAMPAIGN', 'Campaign'),
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
      
      const campaign = await prisma.campaign.findUnique({
        where: { id },
        include: {
          creator: { select: { id: true, name: true, email: true } },
          template: true,
          audience: {
            include: {
              _count: { select: { members: true } },
            },
          },
          reviews: {
            include: {
              reviewer: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
          sendBatches: {
            include: {
              _count: { select: { sendLogs: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
          journeys: {
            orderBy: { createdAt: 'desc' },
          },
          auditLogs: {
            take: 20,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      
      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: '活动不存在',
        });
      }
      
      res.json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      logger.error('Get campaign error:', error);
      res.status(500).json({
        success: false,
        error: '获取活动详情失败',
      });
    }
  }
);

router.post(
  '/',
  roleMiddleware(UserRole.ADMIN, UserRole.MARKETING_OPERATOR),
  [
    body('name').notEmpty().withMessage('活动名称不能为空'),
    body('templateId').optional().isUUID().withMessage('无效的模板ID'),
    body('audienceId').optional().isUUID().withMessage('无效的受众ID'),
  ],
  auditMiddleware('CREATE_CAMPAIGN', 'Campaign'),
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }
      
      const {
        name,
        description,
        templateId,
        audienceId,
        subject,
        fromName,
        fromEmail,
        replyTo,
        scheduledAt,
        tags,
        enableTracking = true,
        enableAbtesting = false,
        abTestConfig,
        priority = 0,
      } = req.body;
      
      if (templateId) {
        const template = await prisma.template.findUnique({
          where: { id: templateId },
        });
        if (!template) {
          return res.status(400).json({
            success: false,
            error: '模板不存在',
          });
        }
      }
      
      if (audienceId) {
        const audience = await prisma.audience.findUnique({
          where: { id: audienceId },
        });
        if (!audience) {
          return res.status(400).json({
            success: false,
            error: '受众不存在',
          });
        }
      }
      
      const campaign = await prisma.campaign.create({
        data: {
          name,
          description,
          templateId,
          audienceId,
          subject,
          fromName,
          fromEmail,
          replyTo,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
          status: CampaignStatus.DRAFT,
          tags: tags as unknown as Record<string, unknown>,
          enableTracking,
          enableAbtesting,
          abTestConfig: abTestConfig as unknown as Record<string, unknown>,
          priority,
          creatorId: req.user!.id,
        },
      });
      
      logger.info(`Campaign created: ${name} by ${req.user?.email}`);
      
      res.status(201).json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      logger.error('Create campaign error:', error);
      res.status(500).json({
        success: false,
        error: '创建活动失败',
      });
    }
  }
);

router.put(
  '/:id',
  roleMiddleware(UserRole.ADMIN, UserRole.MARKETING_OPERATOR),
  [
    param('id').isUUID().withMessage('无效的活动ID'),
    body('name').optional().notEmpty().withMessage('活动名称不能为空'),
  ],
  auditMiddleware('UPDATE_CAMPAIGN', 'Campaign'),
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
      
      const campaign = await prisma.campaign.findUnique({
        where: { id },
      });
      
      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: '活动不存在',
        });
      }
      
      const nonEditableStatuses = [
        CampaignStatus.SENDING,
        CampaignStatus.COMPLETED,
      ];
      
      if (nonEditableStatuses.includes(campaign.status)) {
        return res.status(400).json({
          success: false,
          error: `活动状态为 ${campaign.status}，无法编辑`,
        });
      }
      
      const {
        name,
        description,
        templateId,
        audienceId,
        subject,
        fromName,
        fromEmail,
        replyTo,
        scheduledAt,
        tags,
        enableTracking,
        enableAbtesting,
        abTestConfig,
        priority,
      } = req.body;
      
      const updatedCampaign = await prisma.campaign.update({
        where: { id },
        data: {
          name,
          description,
          templateId,
          audienceId,
          subject,
          fromName,
          fromEmail,
          replyTo,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
          tags: tags as unknown as Record<string, unknown>,
          enableTracking,
          enableAbtesting,
          abTestConfig: abTestConfig as unknown as Record<string, unknown>,
          priority,
        },
      });
      
      logger.info(`Campaign updated: ${id} by ${req.user?.email}`);
      
      res.json({
        success: true,
        data: updatedCampaign,
      });
    } catch (error) {
      logger.error('Update campaign error:', error);
      res.status(500).json({
        success: false,
        error: '更新活动失败',
      });
    }
  }
);

router.post(
  '/:id/submit-review',
  roleMiddleware(UserRole.ADMIN, UserRole.MARKETING_OPERATOR),
  [param('id').isUUID().withMessage('无效的活动ID')],
  auditMiddleware('SUBMIT_REVIEW', 'Campaign'),
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
      
      const campaign = await prisma.campaign.findUnique({
        where: { id },
      });
      
      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: '活动不存在',
        });
      }
      
      if (campaign.status !== CampaignStatus.DRAFT) {
        return res.status(400).json({
          success: false,
          error: `活动状态为 ${campaign.status}，无法提交审核`,
        });
      }
      
      if (!campaign.templateId) {
        return res.status(400).json({
          success: false,
          error: '请先选择模板',
        });
      }
      
      if (!campaign.audienceId) {
        return res.status(400).json({
          success: false,
          error: '请先选择受众',
        });
      }
      
      const updatedCampaign = await prisma.$transaction(async (tx) => {
        const c = await tx.campaign.update({
          where: { id },
          data: {
            status: CampaignStatus.PENDING_REVIEW,
          },
        });
        
        await tx.review.create({
          data: {
            campaignId: id,
            status: 'PENDING',
          },
        });
        
        return c;
      });
      
      logger.info(`Campaign submitted for review: ${id} by ${req.user?.email}`);
      
      res.json({
        success: true,
        data: updatedCampaign,
      });
    } catch (error) {
      logger.error('Submit campaign for review error:', error);
      res.status(500).json({
        success: false,
        error: '提交审核失败',
      });
    }
  }
);

router.post(
  '/:id/review',
  roleMiddleware(UserRole.ADMIN, UserRole.MARKETING_OPERATOR),
  [
    param('id').isUUID().withMessage('无效的活动ID'),
    body('approved').isBoolean().withMessage('请提供审核结果'),
  ],
  auditMiddleware('REVIEW_CAMPAIGN', 'Campaign'),
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
      const { approved, comment, changesRequested } = req.body;
      
      const campaign = await prisma.campaign.findUnique({
        where: { id },
        include: { reviews: { where: { status: 'PENDING' } } },
      });
      
      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: '活动不存在',
        });
      }
      
      if (campaign.status !== CampaignStatus.PENDING_REVIEW) {
        return res.status(400).json({
          success: false,
          error: `活动状态为 ${campaign.status}，无法审核`,
        });
      }
      
      const pendingReview = campaign.reviews[0];
      
      if (!pendingReview) {
        return res.status(400).json({
          success: false,
          error: '没有待审核的记录',
        });
      }
      
      const updatedCampaign = await prisma.$transaction(async (tx) => {
        await tx.review.update({
          where: { id: pendingReview.id },
          data: {
            status: approved ? 'APPROVED' : 'REJECTED',
            reviewerId: req.user!.id,
            comment,
            changesRequested: changesRequested as unknown as Record<string, unknown>,
            reviewedAt: new Date(),
          },
        });
        
        return tx.campaign.update({
          where: { id },
          data: {
            status: approved ? CampaignStatus.REVIEW_APPROVED : CampaignStatus.REVIEW_REJECTED,
          },
        });
      });
      
      logger.info(`Campaign reviewed: ${id} by ${req.user?.email}, approved: ${approved}`);
      
      res.json({
        success: true,
        data: updatedCampaign,
      });
    } catch (error) {
      logger.error('Review campaign error:', error);
      res.status(500).json({
        success: false,
        error: '审核失败',
      });
    }
  }
);

router.delete(
  '/:id',
  roleMiddleware(UserRole.ADMIN),
  [param('id').isUUID().withMessage('无效的活动ID')],
  auditMiddleware('DELETE_CAMPAIGN', 'Campaign'),
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
      
      const campaign = await prisma.campaign.findUnique({
        where: { id },
      });
      
      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: '活动不存在',
        });
      }
      
      const activeStatuses = [
        CampaignStatus.SENDING,
        CampaignStatus.PENDING_SEND,
      ];
      
      if (activeStatuses.includes(campaign.status)) {
        return res.status(400).json({
          success: false,
          error: `活动状态为 ${campaign.status}，无法删除，请先暂停或取消`,
        });
      }
      
      await prisma.campaign.delete({
        where: { id },
      });
      
      logger.info(`Campaign deleted: ${id} by ${req.user?.email}`);
      
      res.json({
        success: true,
        data: { message: '活动已删除' },
      });
    } catch (error) {
      logger.error('Delete campaign error:', error);
      res.status(500).json({
        success: false,
        error: '删除活动失败',
      });
    }
  }
);

export default router;
