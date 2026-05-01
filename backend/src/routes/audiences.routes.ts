import { Router, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest, roleMiddleware, auditMiddleware } from '../middleware';
import { logger } from '../lib/logger';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  auditMiddleware('LIST_AUDIENCES', 'Audience'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 20, search, isActive } = req.query;
      
      const where: Record<string, unknown> = {};
      
      if (typeof isActive === 'string') {
        where.isActive = isActive === 'true';
      }
      
      if (search && typeof search === 'string') {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const [audiences, total] = await Promise.all([
        prisma.audience.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { members: true, campaigns: true },
            },
          },
        }),
        prisma.audience.count({ where }),
      ]);
      
      res.json({
        success: true,
        data: {
          audiences,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logger.error('List audiences error:', error);
      res.status(500).json({
        success: false,
        error: '获取受众列表失败',
      });
    }
  }
);

router.get(
  '/:id',
  [param('id').isUUID().withMessage('无效的受众ID')],
  auditMiddleware('GET_AUDIENCE', 'Audience'),
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
      
      const audience = await prisma.audience.findUnique({
        where: { id },
        include: {
          campaigns: {
            select: { id: true, name: true, status: true },
          },
          _count: {
            select: { members: true },
          },
        },
      });
      
      if (!audience) {
        return res.status(404).json({
          success: false,
          error: '受众不存在',
        });
      }
      
      res.json({
        success: true,
        data: audience,
      });
    } catch (error) {
      logger.error('Get audience error:', error);
      res.status(500).json({
        success: false,
        error: '获取受众详情失败',
      });
    }
  }
);

router.get(
  '/:id/members',
  [param('id').isUUID().withMessage('无效的受众ID')],
  auditMiddleware('LIST_AUDIENCE_MEMBERS', 'Audience'),
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
      const { page = 1, limit = 50, search, isSubscribed } = req.query;
      
      const where: Record<string, unknown> = { audienceId: id };
      
      if (typeof isSubscribed === 'string') {
        where.isSubscribed = isSubscribed === 'true';
      }
      
      if (search && typeof search === 'string') {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const [members, total] = await Promise.all([
        prisma.audienceMember.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { sendLogs: true, clickLogs: true },
            },
          },
        }),
        prisma.audienceMember.count({ where }),
      ]);
      
      res.json({
        success: true,
        data: {
          members,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logger.error('List audience members error:', error);
      res.status(500).json({
        success: false,
        error: '获取受众成员列表失败',
      });
    }
  }
);

router.post(
  '/',
  roleMiddleware(UserRole.ADMIN, UserRole.MARKETING_OPERATOR),
  [body('name').notEmpty().withMessage('受众名称不能为空')],
  auditMiddleware('CREATE_AUDIENCE', 'Audience'),
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }
      
      const { name, description, filters } = req.body;
      
      const audience = await prisma.audience.create({
        data: {
          name,
          description,
          filters: filters as unknown as Record<string, unknown>,
          totalCount: 0,
          isActive: true,
        },
      });
      
      logger.info(`Audience created: ${name} by ${req.user?.email}`);
      
      res.status(201).json({
        success: true,
        data: audience,
      });
    } catch (error) {
      logger.error('Create audience error:', error);
      res.status(500).json({
        success: false,
        error: '创建受众失败',
      });
    }
  }
);

router.post(
  '/:id/members/import',
  roleMiddleware(UserRole.ADMIN, UserRole.MARKETING_OPERATOR),
  [param('id').isUUID().withMessage('无效的受众ID')],
  auditMiddleware('IMPORT_AUDIENCE_MEMBERS', 'Audience'),
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
      const { members } = req.body;
      
      if (!Array.isArray(members) || members.length === 0) {
        return res.status(400).json({
          success: false,
          error: '请提供成员数据',
        });
      }
      
      const audience = await prisma.audience.findUnique({
        where: { id },
      });
      
      if (!audience) {
        return res.status(404).json({
          success: false,
          error: '受众不存在',
        });
      }
      
      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];
      
      for (const member of members) {
        if (!member.email) {
          skipped++;
          errors.push(`缺少邮箱: ${JSON.stringify(member)}`);
          continue;
        }
        
        try {
          await prisma.audienceMember.upsert({
            where: {
              audienceId_email: {
                audienceId: id,
                email: member.email,
              },
            },
            create: {
              audienceId: id,
              email: member.email,
              name: member.name,
              firstName: member.firstName,
              lastName: member.lastName,
              phone: member.phone,
              company: member.company,
              position: member.position,
              country: member.country,
              city: member.city,
              tags: member.tags as unknown as Record<string, unknown>,
              profileData: member.profileData as unknown as Record<string, unknown>,
              customFields: member.customFields as unknown as Record<string, unknown>,
              isSubscribed: member.isSubscribed !== false,
              subscribedAt: member.isSubscribed !== false ? new Date() : undefined,
            },
            update: {
              name: member.name,
              firstName: member.firstName,
              lastName: member.lastName,
              phone: member.phone,
              company: member.company,
              position: member.position,
              country: member.country,
              city: member.city,
              tags: member.tags as unknown as Record<string, unknown>,
              profileData: member.profileData as unknown as Record<string, unknown>,
              customFields: member.customFields as unknown as Record<string, unknown>,
            },
          });
          imported++;
        } catch (err) {
          skipped++;
          errors.push(`导入失败 ${member.email}: ${err instanceof Error ? err.message : '未知错误'}`);
        }
      }
      
      await prisma.audience.update({
        where: { id },
        data: {
          totalCount: { increment: imported },
        },
      });
      
      logger.info(`Imported ${imported} members, skipped ${skipped} to audience ${id} by ${req.user?.email}`);
      
      res.json({
        success: true,
        data: {
          imported,
          skipped,
          errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
        },
      });
    } catch (error) {
      logger.error('Import audience members error:', error);
      res.status(500).json({
        success: false,
        error: '导入成员失败',
      });
    }
  }
);

router.put(
  '/:id',
  roleMiddleware(UserRole.ADMIN, UserRole.MARKETING_OPERATOR),
  [
    param('id').isUUID().withMessage('无效的受众ID'),
    body('name').optional().notEmpty().withMessage('受众名称不能为空'),
  ],
  auditMiddleware('UPDATE_AUDIENCE', 'Audience'),
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
      
      const audience = await prisma.audience.findUnique({
        where: { id },
      });
      
      if (!audience) {
        return res.status(404).json({
          success: false,
          error: '受众不存在',
        });
      }
      
      const { name, description, filters, isActive } = req.body;
      
      const updatedAudience = await prisma.audience.update({
        where: { id },
        data: {
          name,
          description,
          filters: filters as unknown as Record<string, unknown>,
          isActive,
        },
      });
      
      logger.info(`Audience updated: ${id} by ${req.user?.email}`);
      
      res.json({
        success: true,
        data: updatedAudience,
      });
    } catch (error) {
      logger.error('Update audience error:', error);
      res.status(500).json({
        success: false,
        error: '更新受众失败',
      });
    }
  }
);

router.delete(
  '/:id',
  roleMiddleware(UserRole.ADMIN),
  [param('id').isUUID().withMessage('无效的受众ID')],
  auditMiddleware('DELETE_AUDIENCE', 'Audience'),
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
      
      const audience = await prisma.audience.findUnique({
        where: { id },
        include: {
          campaigns: { where: { status: { notIn: ['DRAFT', 'CANCELLED'] } } },
        },
      });
      
      if (!audience) {
        return res.status(404).json({
          success: false,
          error: '受众不存在',
        });
      }
      
      if (audience.campaigns.length > 0) {
        return res.status(400).json({
          success: false,
          error: `受众已被 ${audience.campaigns.length} 个活动使用，无法删除`,
        });
      }
      
      await prisma.$transaction(async (tx) => {
        await tx.audienceMember.deleteMany({
          where: { audienceId: id },
        });
        
        await tx.audience.delete({
          where: { id },
        });
      });
      
      logger.info(`Audience deleted: ${id} by ${req.user?.email}`);
      
      res.json({
        success: true,
        data: { message: '受众已删除' },
      });
    } catch (error) {
      logger.error('Delete audience error:', error);
      res.status(500).json({
        success: false,
        error: '删除受众失败',
      });
    }
  }
);

export default router;
