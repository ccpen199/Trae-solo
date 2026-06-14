import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { TEMPLATES, getTemplateById } from '../utils/templates';

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  const { industry } = req.query;
  let templates = TEMPLATES;
  
  if (industry && typeof industry === 'string') {
    templates = TEMPLATES.filter(t => t.industry === industry);
  }
  
  res.json({ templates });
});

router.get('/:id', authMiddleware, (req, res) => {
  const template = getTemplateById(req.params.id);
  
  if (!template) {
    return res.status(404).json({ error: '模板不存在' });
  }
  
  res.json({ template });
});

export default router;
