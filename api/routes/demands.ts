import { Router, type Response } from 'express';
import db from '../db.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { status, industry, region, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (status) {
      whereClause += ' AND d.status = ?';
      params.push(status);
    }
    if (industry) {
      whereClause += ' AND d.industry = ?';
      params.push(industry);
    }
    if (region) {
      whereClause += ' AND d.region LIKE ?';
      params.push(`%${region}%`);
    }

    const demands = db.prepare(`
      SELECT d.*, u.username as creator_name, u.real_name
      FROM demands d
      LEFT JOIN users u ON d.user_id = u.id
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset);

    const { total } = db.prepare(`
      SELECT COUNT(*) as total FROM demands d ${whereClause}
    `).get(...params) as { total: number };

    res.json({
      success: true,
      data: {
        list: demands,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error('获取需求列表错误:', error);
    res.status(500).json({ success: false, error: '获取需求列表失败' });
  }
});

router.get('/my', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE d.user_id = ?';
    const params: any[] = [req.user!.id];

    if (status) {
      whereClause += ' AND d.status = ?';
      params.push(status);
    }

    const demands = db.prepare(`
      SELECT d.*
      FROM demands d
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset);

    const { total } = db.prepare(`
      SELECT COUNT(*) as total FROM demands d ${whereClause}
    `).get(...params) as { total: number };

    res.json({
      success: true,
      data: {
        list: demands,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error('获取我的需求错误:', error);
    res.status(500).json({ success: false, error: '获取我的需求失败' });
  }
});

router.get('/:id', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const demand = db.prepare(`
      SELECT d.*, u.username as creator_name, u.real_name, u.email, u.phone
      FROM demands d
      LEFT JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `).get(id);

    if (!demand) {
      res.status(404).json({ success: false, error: '需求不存在' });
      return;
    }

    db.prepare('UPDATE demands SET view_count = view_count + 1 WHERE id = ?').run(id);

    const quotes = db.prepare(`
      SELECT q.*, e.name as enterprise_name, u.real_name as contact_person
      FROM quotes q
      LEFT JOIN enterprises e ON q.enterprise_id = e.id
      LEFT JOIN users u ON q.user_id = u.id
      WHERE q.demand_id = ?
    `).all(id);

    res.json({
      success: true,
      data: {
        demand,
        quotes,
      },
    });
  } catch (error) {
    console.error('获取需求详情错误:', error);
    res.status(500).json({ success: false, error: '获取需求详情失败' });
  }
});

router.post('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { title, description, industry, process, quantity, unit, budget_min, budget_max, region, delivery_date, attachments } = req.body;

    if (!title || !description) {
      res.status(400).json({ success: false, error: '标题和描述不能为空' });
      return;
    }

    const result = db.prepare(`
      INSERT INTO demands (user_id, title, description, industry, process, quantity, unit, budget_min, budget_max, region, delivery_date, attachments, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `).run(
      req.user!.id,
      title,
      description,
      industry || null,
      process || null,
      quantity || null,
      unit || null,
      budget_min || null,
      budget_max || null,
      region || null,
      delivery_date || null,
      attachments ? JSON.stringify(attachments) : null
    );

    res.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        message: '需求创建成功',
      },
    });
  } catch (error) {
    console.error('创建需求错误:', error);
    res.status(500).json({ success: false, error: '创建需求失败' });
  }
});

router.put('/:id', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, industry, process, quantity, unit, budget_min, budget_max, region, delivery_date, attachments, status } = req.body;

    const demand = db.prepare('SELECT * FROM demands WHERE id = ?').get(id) as any;
    if (!demand) {
      res.status(404).json({ success: false, error: '需求不存在' });
      return;
    }

    if (demand.user_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '无权修改此需求' });
      return;
    }

    db.prepare(`
      UPDATE demands SET
        title = ?, description = ?, industry = ?, process = ?,
        quantity = ?, unit = ?, budget_min = ?, budget_max = ?,
        region = ?, delivery_date = ?, attachments = ?, status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title || demand.title,
      description || demand.description,
      industry || demand.industry,
      process || demand.process,
      quantity || demand.quantity,
      unit || demand.unit,
      budget_min || demand.budget_min,
      budget_max || demand.budget_max,
      region || demand.region,
      delivery_date || demand.delivery_date,
      attachments ? JSON.stringify(attachments) : demand.attachments,
      status || demand.status,
      id
    );

    res.json({ success: true, message: '需求更新成功' });
  } catch (error) {
    console.error('更新需求错误:', error);
    res.status(500).json({ success: false, error: '更新需求失败' });
  }
});

router.post('/:id/publish', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const demand = db.prepare('SELECT * FROM demands WHERE id = ?').get(id) as any;

    if (!demand) {
      res.status(404).json({ success: false, error: '需求不存在' });
      return;
    }

    if (demand.user_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '无权发布此需求' });
      return;
    }

    db.prepare('UPDATE demands SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('published', id);

    res.json({ success: true, message: '需求发布成功' });
  } catch (error) {
    console.error('发布需求错误:', error);
    res.status(500).json({ success: false, error: '发布需求失败' });
  }
});

router.delete('/:id', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const demand = db.prepare('SELECT * FROM demands WHERE id = ?').get(id) as any;

    if (!demand) {
      res.status(404).json({ success: false, error: '需求不存在' });
      return;
    }

    if (demand.user_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '无权删除此需求' });
      return;
    }

    db.prepare('DELETE FROM demands WHERE id = ?').run(id);

    res.json({ success: true, message: '需求删除成功' });
  } catch (error) {
    console.error('删除需求错误:', error);
    res.status(500).json({ success: false, error: '删除需求失败' });
  }
});

export default router;
