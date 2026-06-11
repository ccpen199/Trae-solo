import { Router, Request, Response } from 'express';
import talentService from '../services/talent.service.js';
import authMiddleware from '../middleware/auth.middleware.js';
import auditMiddleware from '../middleware/audit.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';
import { TalentLevel } from '../../shared/types.js';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const result = await talentService.getTalentList({
    page: Number(req.query.page) || 1,
    pageSize: Number(req.query.pageSize) || 10,
    skill: req.query.skill as string,
    level: req.query.level as TalentLevel,
    verified: req.query.verified === 'true' ? true : req.query.verified === 'false' ? false : undefined,
  });
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  const result = await talentService.getTalentById(Number(req.params.id));
  if (!result.success) return res.status(404).json(result);
  res.json(result);
});

router.get('/matching/:taskId', authMiddleware, async (req: Request, res: Response) => {
  const result = await talentService.getMatchingTalents(Number(req.params.taskId));
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

router.post('/:id/verify', authMiddleware, requireAdmin, auditMiddleware('verify_talent', 'talent'), async (req: Request, res: Response) => {
  const { verified, level } = req.body;
  const result = await talentService.verifyTalent(
    Number(req.params.id),
    verified,
    level,
    req.user!.id
  );
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

export default router;
