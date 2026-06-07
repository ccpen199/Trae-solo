import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req: AuthenticatedRequest, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const status = req.query.status as string;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: any[] = [];

    if (status) {
      whereClause += ' WHERE p.status = ?';
      params.push(status);
    }

    const total = (db.prepare(`SELECT COUNT(*) as count FROM projects p${whereClause}`).get(...params) as any).count;
    const projects = db.prepare(
      `SELECT p.*, 
        o_user.name as owner_name,
        d_user.name as designer_name,
        c_user.name as company_name
       FROM projects p
       LEFT JOIN owners o ON p.owner_id = o.id
       LEFT JOIN users o_user ON o.user_id = o_user.id
       LEFT JOIN designers d ON p.designer_id = d.id
       LEFT JOIN users d_user ON d.user_id = d_user.id
       LEFT JOIN companies c ON p.company_id = c.id
       LEFT JOIN users c_user ON c.user_id = c_user.id${whereClause}
       ORDER BY p.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    res.json({ success: true, data: { list: projects, total, page, limit } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取项目列表失败' });
  }
});

router.post('/', (req: AuthenticatedRequest, res) => {
  try {
    const { title, owner_id, designer_id, company_id, start_date, end_date, address, total_budget, style_preference, budget_preference, area, house_type, contract_info, node_responsibles } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, error: '项目标题不能为空' });
    }

    const result = db.prepare(
      `INSERT INTO projects (title, owner_id, designer_id, company_id, start_date, end_date, address, total_budget, style_preference, budget_preference, area, house_type, contract_info, node_responsibles)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(title, owner_id || null, designer_id || null, company_id || null, start_date || null, end_date || null, address || null, total_budget || null, style_preference || null, budget_preference || null, area || null, house_type || null, contract_info || null, node_responsibles || null);

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建项目失败' });
  }
});

router.get('/:id', (req: AuthenticatedRequest, res) => {
  try {
    const project = db.prepare(
      `SELECT p.*, 
        o_user.name as owner_name,
        d_user.name as designer_name,
        c_user.name as company_name
       FROM projects p
       LEFT JOIN owners o ON p.owner_id = o.id
       LEFT JOIN users o_user ON o.user_id = o_user.id
       LEFT JOIN designers d ON p.designer_id = d.id
       LEFT JOIN users d_user ON d.user_id = d_user.id
       LEFT JOIN companies c ON p.company_id = c.id
       LEFT JOIN users c_user ON c.user_id = c_user.id
       WHERE p.id = ?`
    ).get(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, error: '项目不存在' });
    }
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取项目详情失败' });
  }
});

router.put('/:id', (req: AuthenticatedRequest, res) => {
  try {
    const { title, owner_id, designer_id, company_id, status, start_date, end_date, address, total_budget, style_preference, budget_preference, area, house_type, contract_info, node_responsibles } = req.body;
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as any;
    if (!project) {
      return res.status(404).json({ success: false, error: '项目不存在' });
    }

    db.prepare(
      `UPDATE projects SET title = ?, owner_id = ?, designer_id = ?, company_id = ?, status = ?, start_date = ?, end_date = ?, address = ?, total_budget = ?, style_preference = ?, budget_preference = ?, area = ?, house_type = ?, contract_info = ?, node_responsibles = ? WHERE id = ?`
    ).run(
      title ?? project.title,
      owner_id ?? project.owner_id,
      designer_id ?? project.designer_id,
      company_id ?? project.company_id,
      status ?? project.status,
      start_date ?? project.start_date,
      end_date ?? project.end_date,
      address ?? project.address,
      total_budget ?? project.total_budget,
      style_preference ?? project.style_preference,
      budget_preference ?? project.budget_preference,
      area ?? project.area,
      house_type ?? project.house_type,
      contract_info ?? project.contract_info,
      node_responsibles ?? project.node_responsibles,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新项目失败' });
  }
});

export default router;
