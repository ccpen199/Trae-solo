import { Router, type Response } from 'express';
import { authenticateToken, requirePermission, successResponse, errorResponse, type AuthRequest } from '../middleware/auth';
import { contentService, type CreateContentData, type UpdateContentData } from '../services/ContentService';
import { auditWorkflowService } from '../services/AuditWorkflowService';
import type { ContentType, ContentStatus, WatermarkConfig } from '../../shared/types';

const router = Router();

router.get('/', 
  authenticateToken, 
  requirePermission('content:read'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { 
        page = 1, 
        pageSize = 10, 
        status, 
        type, 
        category, 
        region, 
        authorId, 
        keyword 
      } = req.query;

      const result = await contentService.getContentList({
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        status: status as ContentStatus,
        type: type as ContentType,
        category: category as string,
        region: region as string,
        authorId: authorId as string,
        keyword: keyword as string,
      });

      successResponse(res, result, '获取内容列表成功');
    } catch (error) {
      errorResponse(res, 500, error instanceof Error ? error.message : '获取内容列表失败');
    }
  }
);

router.get('/:id',
  authenticateToken,
  requirePermission('content:read'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const content = await contentService.getContentById(id);
      
      if (!content) {
        errorResponse(res, 404, '内容不存在');
        return;
      }

      successResponse(res, content, '获取内容详情成功');
    } catch (error) {
      errorResponse(res, 500, error instanceof Error ? error.message : '获取内容详情失败');
    }
  }
);

router.post('/',
  authenticateToken,
  requirePermission('content:create'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        title,
        type,
        summary,
        content,
        coverImage,
        tags,
        category,
        region,
        copyright,
        watermark,
        scheduledPublishAt,
      } = req.body;

      if (!req.user) {
        errorResponse(res, 401, '用户未登录');
        return;
      }

      if (!title || !type || !summary || !content || !coverImage || !category || !region) {
        errorResponse(res, 400, '缺少必填字段');
        return;
      }

      const data: CreateContentData = {
        title,
        type,
        authorId: req.user.id,
        authorName: req.user.realName,
        summary,
        content,
        coverImage,
        tags: tags || [],
        category,
        region,
        copyright,
        watermark,
        scheduledPublishAt,
      };

      const newContent = await contentService.createContent(data);
      res.status(201).json({ code: 201, message: '创建内容成功', data: newContent, timestamp: Date.now() });
    } catch (error) {
      errorResponse(res, 500, error instanceof Error ? error.message : '创建内容失败');
    }
  }
);

router.put('/:id',
  authenticateToken,
  requirePermission('content:update'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdateContentData = req.body;

      const updatedContent = await contentService.updateContent(id, updateData);
      
      if (!updatedContent) {
        errorResponse(res, 404, '内容不存在');
        return;
      }

      successResponse(res, updatedContent, '更新内容成功');
    } catch (error) {
      errorResponse(res, 400, error instanceof Error ? error.message : '更新内容失败');
    }
  }
);

router.delete('/:id',
  authenticateToken,
  requirePermission('content:delete'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await contentService.deleteContent(id);
      
      if (!deleted) {
        errorResponse(res, 404, '内容不存在');
        return;
      }

      successResponse(res, null, '删除内容成功');
    } catch (error) {
      errorResponse(res, 400, error instanceof Error ? error.message : '删除内容失败');
    }
  }
);

router.post('/:id/submit-audit',
  authenticateToken,
  requirePermission('content:submit'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!req.user) {
        errorResponse(res, 401, '用户未登录');
        return;
      }

      const content = await contentService.submitForAudit(id);
      
      if (!content) {
        errorResponse(res, 404, '内容不存在');
        return;
      }

      await auditWorkflowService.recordSubmission(id, req.user.id, req.user.realName);

      successResponse(res, content, '提交审核成功');
    } catch (error) {
      errorResponse(res, 400, error instanceof Error ? error.message : '提交审核失败');
    }
  }
);

router.post('/:id/publish',
  authenticateToken,
  requirePermission('content:publish'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const content = await contentService.publishContent(id);
      
      if (!content) {
        errorResponse(res, 404, '内容不存在');
        return;
      }

      successResponse(res, content, '发布内容成功');
    } catch (error) {
      errorResponse(res, 400, error instanceof Error ? error.message : '发布内容失败');
    }
  }
);

router.post('/:id/offline',
  authenticateToken,
  requirePermission('content:offline'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        errorResponse(res, 400, '请提供下架原因');
        return;
      }

      const content = await contentService.offlineContent(id, reason);
      
      if (!content) {
        errorResponse(res, 404, '内容不存在');
        return;
      }

      successResponse(res, content, '下架内容成功');
    } catch (error) {
      errorResponse(res, 400, error instanceof Error ? error.message : '下架内容失败');
    }
  }
);

router.post('/:id/security-check',
  authenticateToken,
  requirePermission('content:read'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { content, type, mediaUrls } = req.body;

      if (!content || !type) {
        errorResponse(res, 400, '缺少内容或类型');
        return;
      }

      const result = await contentService.checkContentSecurity({
        contentId: id,
        content,
        type,
        mediaUrls,
      });

      successResponse(res, result, '内容安全检测完成');
    } catch (error) {
      errorResponse(res, 500, error instanceof Error ? error.message : '内容安全检测失败');
    }
  }
);

router.post('/:id/watermark',
  authenticateToken,
  requirePermission('content:update'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const watermarkConfig = req.body as WatermarkConfig;

      if (!watermarkConfig.type || !watermarkConfig.position || watermarkConfig.opacity === undefined) {
        errorResponse(res, 400, '水印配置不完整');
        return;
      }

      const result = await contentService.processWatermark(id, watermarkConfig);
      
      if (!result.success) {
        errorResponse(res, 400, result.message);
        return;
      }

      successResponse(res, result, '水印处理成功');
    } catch (error) {
      errorResponse(res, 500, error instanceof Error ? error.message : '水印处理失败');
    }
  }
);

router.post('/:id/like',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const success = await contentService.likeContent(id);
      
      if (!success) {
        errorResponse(res, 404, '内容不存在');
        return;
      }

      successResponse(res, null, '点赞成功');
    } catch (error) {
      errorResponse(res, 500, error instanceof Error ? error.message : '点赞失败');
    }
  }
);

router.post('/:id/share',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const success = await contentService.shareContent(id);
      
      if (!success) {
        errorResponse(res, 404, '内容不存在');
        return;
      }

      successResponse(res, null, '分享成功');
    } catch (error) {
      errorResponse(res, 500, error instanceof Error ? error.message : '分享失败');
    }
  }
);

export default router;
