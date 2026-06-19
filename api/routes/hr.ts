import { Router, type Request, type Response } from 'express';
import { TalentPoolService } from '../services/TalentPoolService.js';
import { WarningService } from '../services/WarningService.js';
import type { PotentialLevel, FollowUpType } from '../../shared/types/index.js';

const router = Router();

router.get('/talent-pool', (req: Request, res: Response) => {
  try {
    const { keyword, potential, status, page, pageSize } = req.query;
    const result = TalentPoolService.getList({
      keyword: keyword as string,
      potential: potential as PotentialLevel | 'all',
      status: status as any,
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/talent-pool/:id/tag', (req: Request, res: Response) => {
  try {
    const { level } = req.body as { level: PotentialLevel };
    if (!['S', 'A', 'B', 'C'].includes(level)) {
      return res.status(400).json({ success: false, error: 'Invalid potential level. Must be S, A, B, or C' });
    }
    const talent = TalentPoolService.tagPotential(req.params.id, level);
    if (!talent) {
      return res.status(404).json({ success: false, error: 'Talent not found' });
    }
    res.json({ success: true, data: talent });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/talent-pool/:id', (req: Request, res: Response) => {
  try {
    const talent = TalentPoolService.getById(req.params.id);
    if (!talent) {
      return res.status(404).json({ success: false, error: 'Talent not found' });
    }
    const followUps = TalentPoolService.getFollowUps(req.params.id);
    res.json({ success: true, data: { ...talent, followUps } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/follow-ups', (req: Request, res: Response) => {
  try {
    const { talentId, scheduledAt, type, note } = req.body as {
      talentId: string;
      scheduledAt: string;
      type: FollowUpType;
      note: string;
    };
    if (!talentId || !scheduledAt || !type) {
      return res.status(400).json({ success: false, error: 'talentId, scheduledAt, and type are required' });
    }
    if (!['call', 'email', 'interview', 'check-in'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid follow-up type' });
    }
    const reminder = TalentPoolService.createFollowUp({ talentId, scheduledAt, type, note: note || '' });
    res.json({ success: true, data: reminder });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/dashboard/stats', (req: Request, res: Response) => {
  try {
    const stats = TalentPoolService.getDashboardStats();
    const warningOverview = WarningService.getOverview();
    res.json({
      success: true,
      data: {
        talentPool: stats,
        warnings: warningOverview,
        quickActions: [
          { id: 'new-talents', label: '今日新增人才', value: 5, icon: 'Users' },
          { id: 'pending-interviews', label: '待安排面试', value: 8, icon: 'Calendar' },
          { id: 'offers', label: '待发Offer', value: 3, icon: 'Mail' },
          { id: 'warnings', label: '关键预警', value: warningOverview.criticalCount, icon: 'AlertTriangle' },
        ],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/warnings', (req: Request, res: Response) => {
  try {
    const { type, severity, page, pageSize } = req.query;
    const result = WarningService.getList({
      type: type as any,
      severity: severity as any,
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
