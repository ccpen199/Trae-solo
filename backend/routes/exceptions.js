import { Router } from 'express';
import db from '../db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const { status, type, order_id, engineer_id } = req.query;
  let sql = `
    SELECT e.*, wo.order_no, u.name as engineer_name
    FROM exceptions e
    LEFT JOIN work_orders wo ON e.order_id = wo.id
    LEFT JOIN users u ON e.engineer_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ' AND e.status = ?';
    params.push(status);
  }
  if (type) {
    sql += ' AND e.type = ?';
    params.push(type);
  }
  if (order_id) {
    sql += ' AND e.order_id = ?';
    params.push(order_id);
  }
  if (engineer_id) {
    sql += ' AND e.engineer_id = ?';
    params.push(engineer_id);
  }

  sql += ' ORDER BY e.created_at DESC';
  const exceptions = db.prepare(sql).all(...params);
  res.json(exceptions);
});

router.post('/', (req, res) => {
  const { order_id, engineer_id, type, description } = req.body;
  if (!order_id || !type) {
    return res.status(400).json({ error: '工单ID和异常类型不能为空' });
  }

  const validTypes = ['no_contact', 'wrong_address', 'out_of_stock', 'user_refuse', 'second_visit', 'other'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: '无效的异常类型' });
  }

  const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(order_id);
  if (!order) {
    return res.status(404).json({ error: '工单不存在' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO exceptions (order_id, engineer_id, type, description)
      VALUES (?, ?, ?, ?)
    `).run(order_id, engineer_id || req.user.id, type, description || null);

    const transaction2 = db.transaction(() => {
      if (order.status !== 'exception') {
        db.prepare("UPDATE work_orders SET status = 'exception', updated_at = datetime('now') WHERE id = ?").run(order_id);
      }
    });
    transaction2();

    const exception = db.prepare(`
      SELECT e.*, wo.order_no, u.name as engineer_name
      FROM exceptions e
      LEFT JOIN work_orders wo ON e.order_id = wo.id
      LEFT JOIN users u ON e.engineer_id = u.id
      WHERE e.id = ?
    `).get(result.lastInsertRowid);
    res.status(201).json(exception);
  } catch (err) {
    res.status(500).json({ error: '创建异常失败' });
  }
});

router.patch('/:id/handle', roleMiddleware(['dispatcher', 'service_agent']), (req, res) => {
  const { handling_result } = req.body;
  if (!handling_result) {
    return res.status(400).json({ error: '处理结果不能为空' });
  }

  const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(req.params.id);
  if (!exception) {
    return res.status(404).json({ error: '异常记录不存在' });
  }
  if (exception.status === 'resolved') {
    return res.status(400).json({ error: '该异常已处理' });
  }

  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE exceptions SET handling_result = ?, handler_id = ?, handled_at = datetime('now'), status = 'resolved'
      WHERE id = ?
    `).run(handling_result, req.user.id, req.params.id);

    const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(exception.order_id);
    if (order && order.status === 'exception') {
      const pendingDispatch = db.prepare("SELECT id FROM dispatch_records WHERE order_id = ? AND status = 'accepted'").get(exception.order_id);
      if (pendingDispatch) {
        db.prepare("UPDATE work_orders SET status = 'accepted', updated_at = datetime('now') WHERE id = ?").run(exception.order_id);
      } else {
        db.prepare("UPDATE work_orders SET status = 'pending', updated_at = datetime('now') WHERE id = ?").run(exception.order_id);
      }
    }
  });

  try {
    transaction();
    const updated = db.prepare(`
      SELECT e.*, wo.order_no, u.name as engineer_name
      FROM exceptions e
      LEFT JOIN work_orders wo ON e.order_id = wo.id
      LEFT JOIN users u ON e.engineer_id = u.id
      WHERE e.id = ?
    `).get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '处理异常失败' });
  }
});

export default router;
