import { Router, Response } from 'express';
import { db, rowToChangeOrder } from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const status = req.query.status as string;
  const type = req.query.type as string;
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (status) {
    whereClause += ' AND c.status = ?';
    params.push(status);
  }

  if (type) {
    whereClause += ' AND c.type = ?';
    params.push(type);
  }

  params.push(pageSize, offset);

  const rows = db.prepare(`
    SELECT c.*, u.username as operator_name
    FROM change_orders c
    LEFT JOIN users u ON c.operator_id = u.id
    ${whereClause}
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params) as any[];

  const countParams = params.slice(0, -2);
  const totalRow = db.prepare(`
    SELECT COUNT(*) as count FROM change_orders c
    ${whereClause}
  `).get(...countParams) as { count: number };

  const items = rows.map(row => ({
    ...rowToChangeOrder(row),
    operatorName: row.operator_name
  }));

  res.json({ items, total: totalRow.count, page, pageSize });
});

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { type, reason, affectedObjects, recoveryPath, oldValue, newValue } = req.body;

  if (!type || !reason) {
    res.status(400).json({ error: 'Type and reason are required' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO change_orders (type, status, operator_id, reason, affected_objects, recovery_path, old_value, new_value)
    VALUES (?, 'pending', ?, ?, ?, ?, ?, ?)
  `).run(type, req.user!.id, reason, affectedObjects || '', recoveryPath || '', oldValue || '', newValue || '');

  const changeId = result.lastInsertRowid as number;
  const row = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(changeId) as any;
  const change = rowToChangeOrder(row);

  logAudit(req.user!.id, 'create', 'change_order', changeId, null, JSON.stringify(change));
  res.json(change);
});

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);

  const row = db.prepare(`
    SELECT c.*, u.username as operator_name
    FROM change_orders c
    LEFT JOIN users u ON c.operator_id = u.id
    WHERE c.id = ?
  `).get(id) as any;

  if (!row) {
    res.status(404).json({ error: 'Change order not found' });
    return;
  }

  const change = {
    ...rowToChangeOrder(row),
    operatorName: row.operator_name
  };

  res.json(change);
});

router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { type, reason, affectedObjects, recoveryPath, oldValue, newValue } = req.body;

  const existingRow = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(id) as any;
  if (!existingRow) {
    res.status(404).json({ error: 'Change order not found' });
    return;
  }

  if (existingRow.status !== 'pending') {
    res.status(400).json({ error: 'Only pending change orders can be edited' });
    return;
  }

  const oldChange = rowToChangeOrder(existingRow);

  db.prepare(`
    UPDATE change_orders
    SET type = COALESCE(?, type),
        reason = COALESCE(?, reason),
        affected_objects = COALESCE(?, affected_objects),
        recovery_path = COALESCE(?, recovery_path),
        old_value = COALESCE(?, old_value),
        new_value = COALESCE(?, new_value)
    WHERE id = ?
  `).run(type, reason, affectedObjects, recoveryPath, oldValue, newValue, id);

  const updatedRow = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(id) as any;
  const newChange = rowToChangeOrder(updatedRow);

  logAudit(req.user!.id, 'update', 'change_order', id, JSON.stringify(oldChange), JSON.stringify(newChange));
  res.json(newChange);
});

router.post('/:id/approve', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);

  const existingRow = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(id) as any;
  if (!existingRow) {
    res.status(404).json({ error: 'Change order not found' });
    return;
  }

  if (existingRow.status !== 'pending') {
    res.status(400).json({ error: 'Only pending change orders can be approved' });
    return;
  }

  const oldChange = rowToChangeOrder(existingRow);

  db.prepare(`
    UPDATE change_orders
    SET status = 'approved'
    WHERE id = ?
  `).run(id);

  const updatedRow = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(id) as any;
  const newChange = rowToChangeOrder(updatedRow);

  logAudit(req.user!.id, 'approve', 'change_order', id, JSON.stringify(oldChange), JSON.stringify(newChange));
  res.json(newChange);
});

router.post('/:id/reject', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);

  const existingRow = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(id) as any;
  if (!existingRow) {
    res.status(404).json({ error: 'Change order not found' });
    return;
  }

  if (existingRow.status !== 'pending') {
    res.status(400).json({ error: 'Only pending change orders can be rejected' });
    return;
  }

  const oldChange = rowToChangeOrder(existingRow);

  db.prepare(`
    UPDATE change_orders
    SET status = 'rejected'
    WHERE id = ?
  `).run(id);

  const updatedRow = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(id) as any;
  const newChange = rowToChangeOrder(updatedRow);

  logAudit(req.user!.id, 'reject', 'change_order', id, JSON.stringify(oldChange), JSON.stringify(newChange));
  res.json(newChange);
});

router.post('/:id/execute', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);

  const existingRow = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(id) as any;
  if (!existingRow) {
    res.status(404).json({ error: 'Change order not found' });
    return;
  }

  if (existingRow.status !== 'approved') {
    res.status(400).json({ error: 'Only approved change orders can be executed' });
    return;
  }

  const oldChange = rowToChangeOrder(existingRow);
  const executedAt = new Date().toISOString();

  db.prepare(`
    UPDATE change_orders
    SET status = 'executed', executed_at = ?
    WHERE id = ?
  `).run(executedAt, id);

  const updatedRow = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(id) as any;
  const newChange = rowToChangeOrder(updatedRow);

  logAudit(req.user!.id, 'execute', 'change_order', id, JSON.stringify(oldChange), JSON.stringify(newChange));
  res.json(newChange);
});

router.post('/:id/rollback', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);

  const existingRow = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(id) as any;
  if (!existingRow) {
    res.status(404).json({ error: 'Change order not found' });
    return;
  }

  if (existingRow.status !== 'executed') {
    res.status(400).json({ error: 'Only executed change orders can be rolled back' });
    return;
  }

  const oldChange = rowToChangeOrder(existingRow);

  db.prepare(`
    UPDATE change_orders
    SET status = 'rolled_back'
    WHERE id = ?
  `).run(id);

  const updatedRow = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(id) as any;
  const newChange = rowToChangeOrder(updatedRow);

  logAudit(req.user!.id, 'rollback', 'change_order', id, JSON.stringify(oldChange), JSON.stringify(newChange));
  res.json(newChange);
});

export default router;
