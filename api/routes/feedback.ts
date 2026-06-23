import { Router } from 'express';
import { feedbackService } from '../services/FeedbackService';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const feedbackSchema = z.object({
  itemName: z.string(),
  misjudgedCategoryId: z.string().optional(),
  correctCategoryId: z.string(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  district: z.string().optional(),
  street: z.string().optional(),
  userAgent: z.string().optional()
});

router.post('/', (req, res) => {
  const parseResult = feedbackSchema.safeParse(req.body);
  
  if (!parseResult.success) {
    res.status(400).json({ 
      success: false, 
      error: '参数错误', 
      details: parseResult.error.errors 
    });
    return;
  }

  const result = feedbackService.submitFeedback(parseResult.data);
  res.json(result);
});

router.get('/', authMiddleware, requireRole(['district_admin', 'municipal_admin']), (req: AuthRequest, res) => {
  const { limit, offset, cityId } = req.query;
  
  if (!cityId) {
    res.status(400).json({ error: '缺少 cityId 参数' });
    return;
  }

  const result = feedbackService.getFeedbackList(
    String(cityId),
    parseInt(String(limit || '100')),
    parseInt(String(offset || '0'))
  );

  res.json(result);
});

router.get('/:id', authMiddleware, requireRole(['district_admin', 'municipal_admin']), (req: AuthRequest, res) => {
  const { id } = req.params;
  const feedback = feedbackService.getFeedbackById(id);
  
  if (!feedback) {
    res.status(404).json({ error: '反馈记录不存在' });
    return;
  }

  res.json({ feedback });
});

export default router;
