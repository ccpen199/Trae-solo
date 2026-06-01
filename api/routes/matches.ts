import { Router, type Response } from 'express';
import db from '../db.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/demand/:demandId', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { demandId } = req.params;
    const demand = db.prepare('SELECT * FROM demands WHERE id = ?').get(demandId) as any;

    if (!demand) {
      res.status(404).json({ success: false, error: '需求不存在' });
      return;
    }

    const enterprises = db.prepare(`
      SELECT e.*, c.id as capability_id, c.name as capability_name, c.category, c.description as capability_desc
      FROM enterprises e
      LEFT JOIN capabilities c ON e.id = c.enterprise_id
      WHERE e.status = 'approved'
    `).all() as any[];

    const matches: any[] = [];
    for (const enterprise of enterprises) {
      let score = 0;
      const reasons: string[] = [];

      if (demand.industry && enterprise.industry === demand.industry) {
        score += 30;
        reasons.push('行业匹配');
      }

      if (demand.region && enterprise.region && enterprise.region.includes(demand.region.slice(0, 2))) {
        score += 20;
        reasons.push('地区相近');
      }

      if (enterprise.capability_name) {
        score += 20;
        reasons.push('具备相关生产能力');
      }

      if (enterprise.qualifications) {
        score += 15;
        reasons.push('具备资质认证');
      }

      if (score > 0) {
        const existing = db.prepare('SELECT id FROM matches WHERE demand_id = ? AND enterprise_id = ?').get(demandId, enterprise.id);
        if (!existing) {
          db.prepare(`
            INSERT INTO matches (demand_id, enterprise_id, match_score, match_reason, status, project_manager_id)
            VALUES (?, ?, ?, ?, 'pending', ?)
          `).run(demandId, enterprise.id, score, reasons.join(', '), null);
        }

        matches.push({
          enterprise_id: enterprise.id,
          enterprise_name: enterprise.name,
          score,
          reasons,
          industry: enterprise.industry,
          region: enterprise.region,
        });
      }
    }

    matches.sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      data: {
        matches: matches.slice(0, 10),
        total: matches.length,
      },
    });
  } catch (error) {
    console.error('智能匹配错误:', error);
    res.status(500).json({ success: false, error: '智能匹配失败' });
  }
});

router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (req.user!.role === 'supplier') {
      const enterprise = db.prepare('SELECT id FROM enterprises WHERE user_id = ?').get(req.user!.id) as any;
      if (enterprise) {
        whereClause += ' AND m.enterprise_id = ?';
        params.push(enterprise.id);
      }
    }

    if (status) {
      whereClause += ' AND m.status = ?';
      params.push(status);
    }

    const matches = db.prepare(`
      SELECT m.*, d.title as demand_title, d.industry, d.region as demand_region,
             e.name as enterprise_name, e.region as enterprise_region
      FROM matches m
      LEFT JOIN demands d ON m.demand_id = d.id
      LEFT JOIN enterprises e ON m.enterprise_id = e.id
      ${whereClause}
      ORDER BY m.match_score DESC, m.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset);

    const { total } = db.prepare(`
      SELECT COUNT(*) as total FROM matches m ${whereClause}
    `).get(...params) as { total: number };

    res.json({
      success: true,
      data: {
        list: matches,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error('获取匹配列表错误:', error);
    res.status(500).json({ success: false, error: '获取匹配列表失败' });
  }
});

router.post('/:id/assign', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { project_manager_id } = req.body;

    if (req.user!.role !== 'admin' && req.user!.role !== 'manager') {
      res.status(403).json({ success: false, error: '无权分配项目责任人' });
      return;
    }

    const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(id);
    if (!match) {
      res.status(404).json({ success: false, error: '匹配记录不存在' });
      return;
    }

    db.prepare('UPDATE matches SET project_manager_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      project_manager_id,
      'assigned',
      id
    );

    res.json({ success: true, message: '项目责任人分配成功' });
  } catch (error) {
    console.error('分配项目责任人错误:', error);
    res.status(500).json({ success: false, error: '分配项目责任人失败' });
  }
});

export default router;
