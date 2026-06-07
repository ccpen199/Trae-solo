import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req: AuthenticatedRequest, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.pageSize || req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status as string | undefined;

    const params: unknown[] = [];
    const whereClause = status ? 'WHERE mo.status = ?' : '';
    if (status) params.push(status);

    const total = (db.prepare(`SELECT COUNT(*) as count FROM material_orders mo ${whereClause}`).get(...params) as any).count;
    const orders = db.prepare(
      `SELECT mo.*, m.name as material_name, m.brand as material_brand, p.title as project_title
       FROM material_orders mo
       JOIN materials m ON mo.material_id = m.id
       JOIN projects p ON mo.project_id = p.id
       ${whereClause}
       ORDER BY mo.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    res.json({ success: true, data: { list: orders, total, page, limit, pageSize: limit } });
  } catch {
    res.status(500).json({ success: false, error: '获取订单列表失败' });
  }
});

router.post('/', (req: AuthenticatedRequest, res) => {
  try {
    const { material_id, project_id, quantity } = req.body;
    if (!material_id || !project_id || !quantity) {
      return res.status(400).json({ success: false, error: '材料ID、项目ID和数量不能为空' });
    }

    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(material_id) as any;
    if (!material) return res.status(404).json({ success: false, error: '材料不存在' });
    if (Number(material.stock) < Number(quantity)) {
      return res.status(400).json({ success: false, error: `库存不足，当前库存: ${material.stock}` });
    }

    const totalPrice = Number(material.unit_price) * Number(quantity);
    const result = db.prepare(
      'INSERT INTO material_orders (material_id, project_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)'
    ).run(material_id, project_id, quantity, material.unit_price, totalPrice);
    db.prepare("UPDATE materials SET stock = stock - ?, updated_at = datetime('now') WHERE id = ?").run(quantity, material_id);

    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
  } catch {
    res.status(500).json({ success: false, error: '创建材料订单失败' });
  }
});

function updateOrder(req: AuthenticatedRequest, res: any) {
  try {
    const { status, logistics_info } = req.body;
    const order = db.prepare('SELECT * FROM material_orders WHERE id = ?').get(req.params.id) as any;
    if (!order) return res.status(404).json({ success: false, error: '订单不存在' });

    const nextStatus = status ?? order.status;
    if (nextStatus === 'returned' && order.status !== 'returned') {
      db.prepare("UPDATE materials SET stock = stock + ?, updated_at = datetime('now') WHERE id = ?").run(order.quantity, order.material_id);
    }

    db.prepare(
      "UPDATE material_orders SET status = ?, logistics_info = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(nextStatus, logistics_info ?? order.logistics_info, req.params.id);

    res.json({ success: true, data: { id: req.params.id, status: nextStatus } });
  } catch {
    res.status(500).json({ success: false, error: '更新订单失败' });
  }
}

router.put('/:id', updateOrder);
router.patch('/:id', updateOrder);
router.put('/:id/return', (req: AuthenticatedRequest, res) => {
  req.body = { ...req.body, status: 'returned' };
  updateOrder(req, res);
});
router.patch('/:id/return', (req: AuthenticatedRequest, res) => {
  req.body = { ...req.body, status: 'returned' };
  updateOrder(req, res);
});

export default router;
