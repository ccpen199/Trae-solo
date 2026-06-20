import { Router, Request, Response } from 'express';
import { z } from 'zod';
import type { ExportSize } from '../../../shared/types';
import { mockModelCardTemplates, mockExportOptions, mockBackgroundPresets, createInitialCanvasElements } from '../data/mockData';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const generateSchema = z.object({
  templateId: z.string().optional(),
  artistProfileId: z.string(),
  customizations: z.record(z.any()).default({}),
});

const removeBgSchema = z.object({
  imageUrl: z.string().url(),
  artistProfileId: z.string(),
});

const exportSchema = z.object({
  templateId: z.string().optional(),
  artistProfileId: z.string(),
  size: z.enum(['instagram-square', 'tiktok-story', 'letter', 'a4', 'custom']),
  customWidth: z.number().optional(),
  customHeight: z.number().optional(),
  elements: z.array(z.any()).optional(),
});

router.get('/templates', (_req: Request, res: Response): void => {
  try {
    res.status(200).json({
      success: true,
      data: mockModelCardTemplates,
      total: mockModelCardTemplates.length,
    });
  } catch (error) {
    res.status(500).json({ error: '获取模板列表失败', code: 'SERVER_ERROR' });
  }
});

router.get('/templates/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const template = mockModelCardTemplates.find(t => t.id === id);

    if (!template) {
      res.status(404).json({ error: '模板不存在', code: 'NOT_FOUND' });
      return;
    }

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    res.status(500).json({ error: '获取模板详情失败', code: 'SERVER_ERROR' });
  }
});

router.post('/generate', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const validated = generateSchema.parse(req.body);

    const template = validated.templateId
      ? mockModelCardTemplates.find(t => t.id === validated.templateId)
      : mockModelCardTemplates[0];

    if (!template) {
      res.status(404).json({ error: '模板不存在', code: 'NOT_FOUND' });
      return;
    }

    const elements = createInitialCanvasElements(template.id);

    const generatedCard = {
      id: `card-${Date.now()}`,
      templateId: template.id,
      artistProfileId: validated.artistProfileId,
      width: template.width,
      height: template.height,
      elements,
      customizations: validated.customizations,
      previewUrl: template.thumbnailUrl,
      createdAt: new Date(),
    };

    res.status(200).json({
      success: true,
      data: generatedCard,
      message: '模卡生成成功',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: '输入验证失败',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
      return;
    }
    res.status(500).json({ error: '模卡生成失败', code: 'SERVER_ERROR' });
  }
});

router.post('/remove-bg', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const validated = removeBgSchema.parse(req.body);

    const simulatedResult = {
      originalUrl: validated.imageUrl,
      processedUrl: validated.imageUrl,
      backgroundColor: 'transparent',
      processingTime: 1200,
      quality: 'high',
    };

    res.status(200).json({
      success: true,
      data: simulatedResult,
      message: '背景移除成功（模拟）',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: '输入验证失败',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
      return;
    }
    res.status(500).json({ error: '背景移除失败', code: 'SERVER_ERROR' });
  }
});

router.post('/export', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const validated = exportSchema.parse(req.body);

    const exportOption = mockExportOptions.find(e => e.id === validated.size);
    let width = exportOption?.width || 1080;
    let height = exportOption?.height || 1920;

    if (validated.size === 'custom' && validated.customWidth && validated.customHeight) {
      width = validated.customWidth;
      height = validated.customHeight;
    }

    const elements = validated.elements || createInitialCanvasElements(validated.templateId);

    const exportResult = {
      id: `export-${Date.now()}`,
      size: validated.size as ExportSize,
      width,
      height,
      elements,
      downloadUrl: `https://example.com/exports/model-card-${Date.now()}.png`,
      fileSize: Math.floor(Math.random() * 5000 + 1000),
      format: 'png',
      exportedAt: new Date(),
    };

    res.status(200).json({
      success: true,
      data: exportResult,
      message: '模卡导出成功',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: '输入验证失败',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
      return;
    }
    res.status(500).json({ error: '模卡导出失败', code: 'SERVER_ERROR' });
  }
});

router.get('/export-options', (_req: Request, res: Response): void => {
  try {
    res.status(200).json({
      success: true,
      data: mockExportOptions,
    });
  } catch (error) {
    res.status(500).json({ error: '获取导出选项失败', code: 'SERVER_ERROR' });
  }
});

router.get('/background-presets', (_req: Request, res: Response): void => {
  try {
    const category = _req.query.category as string | undefined;
    let data = mockBackgroundPresets;

    if (category) {
      data = data.filter(p => p.category === category);
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({ error: '获取背景预设失败', code: 'SERVER_ERROR' });
  }
});

export default router;
