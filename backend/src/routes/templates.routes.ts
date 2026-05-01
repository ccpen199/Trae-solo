import { Router, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest, roleMiddleware, auditMiddleware } from '../middleware';
import { logger } from '../lib/logger';
import { UserRole } from '@prisma/client';
import { templateDynamicEngine } from '../engines/template-dynamic.engine';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  auditMiddleware('LIST_TEMPLATES', 'Template'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 20, category, search, isActive } = req.query;
      
      const where: Record<string, unknown> = {};
      
      if (category && typeof category === 'string') {
        where.category = category;
      }
      
      if (typeof isActive === 'string') {
        where.isActive = isActive === 'true';
      }
      
      if (search && typeof search === 'string') {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { subject: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const [templates, total] = await Promise.all([
        prisma.template.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { campaigns: true },
            },
          },
        }),
        prisma.template.count({ where }),
      ]);
      
      res.json({
        success: true,
        data: {
          templates,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logger.error('List templates error:', error);
      res.status(500).json({
        success: false,
        error: '获取模板列表失败',
      });
    }
  }
);

router.get(
  '/:id',
  [param('id').isUUID().withMessage('无效的模板ID')],
  auditMiddleware('GET_TEMPLATE', 'Template'),
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
      
      const template = await prisma.template.findUnique({
        where: { id },
      });
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: '模板不存在',
        });
      }
      
      const placeholders = templateDynamicEngine.extractPlaceholders(template.htmlContent);
      
      res.json({
        success: true,
        data: {
          ...template,
          extractedPlaceholders: placeholders,
        },
      });
    } catch (error) {
      logger.error('Get template error:', error);
      res.status(500).json({
        success: false,
        error: '获取模板详情失败',
      });
    }
  }
);

router.post(
  '/',
  roleMiddleware(UserRole.ADMIN, UserRole.COPYWRITER),
  [
    body('name').notEmpty().withMessage('模板名称不能为空'),
    body('subject').notEmpty().withMessage('邮件主题不能为空'),
    body('htmlContent').notEmpty().withMessage('HTML内容不能为空'),
  ],
  auditMiddleware('CREATE_TEMPLATE', 'Template'),
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
        category,
        subject,
        htmlContent,
        textContent,
        placeholders,
        variables,
        isPublic = false,
      } = req.body;
      
      const extractedPlaceholders = templateDynamicEngine.extractPlaceholders(htmlContent);
      
      const template = await prisma.template.create({
        data: {
          name,
          description,
          category,
          subject,
          htmlContent,
          textContent,
          placeholders: (placeholders || extractedPlaceholders) as unknown as Record<string, unknown>,
          variables: variables as unknown as Record<string, unknown>,
          isPublic,
          creatorId: req.user!.id,
        },
      });
      
      logger.info(`Template created: ${name} by ${req.user?.email}`);
      
      res.status(201).json({
        success: true,
        data: {
          ...template,
          extractedPlaceholders,
        },
      });
    } catch (error) {
      logger.error('Create template error:', error);
      res.status(500).json({
        success: false,
        error: '创建模板失败',
      });
    }
  }
);

router.post(
  '/:id/preview',
  [param('id').isUUID().withMessage('无效的模板ID')],
  auditMiddleware('PREVIEW_TEMPLATE', 'Template'),
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
      const { memberData, customData } = req.body;
      
      const template = await prisma.template.findUnique({
        where: { id },
      });
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: '模板不存在',
        });
      }
      
      const context = {
        member: memberData || {
          email: 'preview@example.com',
          name: '预览用户',
          firstName: '预览',
          lastName: '用户',
          company: '示例公司',
          position: '示例职位',
          tags: ['预览', '测试'],
        },
        campaign: {
          id: 'preview-campaign',
          name: '预览活动',
          subject: template.subject,
        },
        template: {
          id: template.id,
          name: template.name,
        },
        custom: customData || {},
      };
      
      const renderResult = templateDynamicEngine.renderContent(
        template.htmlContent,
        template.textContent || '',
        template.subject,
        context,
        template.placeholders as unknown as { name: string; type: string }[] | undefined
      );
      
      res.json({
        success: true,
        data: {
          renderedHtml: renderResult.html,
          renderedText: renderResult.text,
          renderedSubject: renderResult.subject,
          variablesUsed: renderResult.variablesUsed,
          missingVariables: renderResult.missingVariables,
          explanation: renderResult.explanation,
        },
      });
    } catch (error) {
      logger.error('Preview template error:', error);
      res.status(500).json({
        success: false,
        error: '预览模板失败',
      });
    }
  }
);

router.put(
  '/:id',
  roleMiddleware(UserRole.ADMIN, UserRole.COPYWRITER),
  [
    param('id').isUUID().withMessage('无效的模板ID'),
    body('name').optional().notEmpty().withMessage('模板名称不能为空'),
  ],
  auditMiddleware('UPDATE_TEMPLATE', 'Template'),
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
      
      const template = await prisma.template.findUnique({
        where: { id },
      });
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: '模板不存在',
        });
      }
      
      const {
        name,
        description,
        category,
        subject,
        htmlContent,
        textContent,
        placeholders,
        variables,
        isActive,
        isPublic,
      } = req.body;
      
      let extractedPlaceholders: string[] = [];
      if (htmlContent) {
        extractedPlaceholders = templateDynamicEngine.extractPlaceholders(htmlContent);
      }
      
      const updatedTemplate = await prisma.template.update({
        where: { id },
        data: {
          name,
          description,
          category,
          subject,
          htmlContent,
          textContent,
          placeholders: placeholders as unknown as Record<string, unknown>,
          variables: variables as unknown as Record<string, unknown>,
          isActive,
          isPublic,
        },
      });
      
      logger.info(`Template updated: ${id} by ${req.user?.email}`);
      
      res.json({
        success: true,
        data: {
          ...updatedTemplate,
          extractedPlaceholders: htmlContent ? extractedPlaceholders : undefined,
        },
      });
    } catch (error) {
      logger.error('Update template error:', error);
      res.status(500).json({
        success: false,
        error: '更新模板失败',
      });
    }
  }
);

router.delete(
  '/:id',
  roleMiddleware(UserRole.ADMIN),
  [param('id').isUUID().withMessage('无效的模板ID')],
  auditMiddleware('DELETE_TEMPLATE', 'Template'),
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
      
      const template = await prisma.template.findUnique({
        where: { id },
        include: {
          campaigns: { where: { status: { notIn: ['DRAFT', 'CANCELLED'] } } },
        },
      });
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: '模板不存在',
        });
      }
      
      if (template.campaigns.length > 0) {
        return res.status(400).json({
          success: false,
          error: `模板已被 ${template.campaigns.length} 个活动使用，无法删除`,
        });
      }
      
      await prisma.template.delete({
        where: { id },
      });
      
      logger.info(`Template deleted: ${id} by ${req.user?.email}`);
      
      res.json({
        success: true,
        data: { message: '模板已删除' },
      });
    } catch (error) {
      logger.error('Delete template error:', error);
      res.status(500).json({
        success: false,
        error: '删除模板失败',
      });
    }
  }
);

export default router;
