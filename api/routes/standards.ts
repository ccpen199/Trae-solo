import { Router } from 'express';
import { standardService } from '../services/StandardService';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const categorySchema = z.object({
  code: z.string(),
  name: z.string(),
  icon: z.string(),
  color: z.string(),
  guidelines: z.string(),
  misconceptions: z.string().optional()
});

const itemSchema = z.object({
  name: z.string(),
  aliases: z.array(z.string()),
  categoryId: z.string(),
  requirements: z.string(),
  misconceptions: z.string().optional()
});

router.get('/cities', (req, res) => {
  const cities = standardService.getCities();
  res.json({ cities });
});

router.get('/:cityId', (req, res) => {
  const { cityId } = req.params;
  const standardPackage = standardService.getStandardPackage(cityId);
  if (!standardPackage) {
    res.status(404).json({ error: '城市标准不存在' });
    return;
  }
  res.json(standardPackage);
});

router.get('/:cityId/categories', (req, res) => {
  const { cityId } = req.params;
  const categories = standardService.getCategoriesByCity(cityId);
  res.json({ categories });
});

router.get('/categories/:categoryId/items', (req, res) => {
  const { categoryId } = req.params;
  const items = standardService.getItemsByCategory(categoryId);
  res.json({ items });
});

router.post('/:cityId/categories', authMiddleware, requireRole(['district_admin', 'municipal_admin']), (req: AuthRequest, res) => {
  const { cityId } = req.params;
  const parseResult = categorySchema.safeParse(req.body);
  
  if (!parseResult.success) {
    res.status(400).json({ error: '参数错误', details: parseResult.error.errors });
    return;
  }

  const category = standardService.createCategory(cityId, parseResult.data);
  res.json({ success: true, category });
});

router.put('/categories/:id', authMiddleware, requireRole(['district_admin', 'municipal_admin']), (req: AuthRequest, res) => {
  const { id } = req.params;
  const category = standardService.updateCategory(id, req.body);
  
  if (!category) {
    res.status(404).json({ error: '分类不存在' });
    return;
  }
  
  res.json({ success: true, category });
});

router.delete('/categories/:id', authMiddleware, requireRole(['district_admin', 'municipal_admin']), (req: AuthRequest, res) => {
  const { id } = req.params;
  const success = standardService.deleteCategory(id);
  res.json({ success });
});

router.post('/:cityId/items', authMiddleware, requireRole(['district_admin', 'municipal_admin']), (req: AuthRequest, res) => {
  const { cityId } = req.params;
  const parseResult = itemSchema.safeParse(req.body);
  
  if (!parseResult.success) {
    res.status(400).json({ error: '参数错误', details: parseResult.error.errors });
    return;
  }

  const item = standardService.createItem(cityId, parseResult.data);
  res.json({ success: true, item });
});

router.put('/items/:id', authMiddleware, requireRole(['district_admin', 'municipal_admin']), (req: AuthRequest, res) => {
  const { id } = req.params;
  const item = standardService.updateItem(id, req.body);
  
  if (!item) {
    res.status(404).json({ error: '条目不存在' });
    return;
  }
  
  res.json({ success: true, item });
});

router.delete('/items/:id', authMiddleware, requireRole(['district_admin', 'municipal_admin']), (req: AuthRequest, res) => {
  const { id } = req.params;
  const success = standardService.deleteItem(id);
  res.json({ success });
});

export default router;
