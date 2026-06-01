import { Router, Response } from 'express';
import { db, rowToAlert } from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const status = req.query.status as string;
  const severity = req.query.severity as string;
  const assigneeId = parseInt(req.query.assigneeId as string);
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (status) {
    whereClause += ' AND a.status = ?';
    params.push(status);
  }

  if (severity) {
    whereClause += ' AND a.severity = ?';
    params.push(severity);
  }

  if (assigneeId) {
    whereClause += ' AND a.assignee_id = ?';
    params.push(assigneeId);
  }

  params.push(pageSize, offset);

  const rows = db.prepare(`
    SELECT a.*, u.username as assignee_name
    FROM alerts a
    LEFT JOIN users u ON a.assignee_id = u.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params) as any[];

  const countParams = params.slice(0, -2);
  const totalRow = db.prepare(`
    SELECT COUNT(*) as count FROM alerts a
    ${whereClause}
  `).get(...countParams) as { count: number };

  const items = rows.map(row => ({
    ...rowToAlert(row),
    assigneeName: row.assignee_name
  }));

  res.json({ items, total: totalRow.count, page, pageSize });
});

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);

  const row = db.prepare(`
    SELECT a.*, u.username as assignee_name
    FROM alerts a
    LEFT JOIN users u ON a.assignee_id = u.id
    WHERE a.id = ?
  `).get(id) as any;

  if (!row) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }

  const alert = {
    ...rowToAlert(row),
    assigneeName: row.assignee_name
  };

  res.json(alert);
});

router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { status, assigneeId, title, content, suggestedAction, closeCriteria } = req.body;

  const existingRow = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id) as any;
  if (!existingRow) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }

  const oldAlert = rowToAlert(existingRow);

  let closedAt = existingRow.closed_at;
  if (status === 'closed' && existingRow.status !== 'closed') {
    closedAt = new Date().toISOString();
  } else if (status !== 'closed') {
    closedAt = null;
  }

  db.prepare(`
    UPDATE alerts
    SET status = COALESCE(?, status),
        assignee_id = COALESCE(?, assignee_id),
        title = COALESCE(?, title),
        content = COALESCE(?, content),
        suggested_action = COALESCE(?, suggested_action),
        close_criteria = COALESCE(?, close_criteria),
        closed_at = ?
    WHERE id = ?
  `).run(status, assigneeId, title, content, suggestedAction, closeCriteria, closedAt, id);

  const updatedRow = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id) as any;
  const newAlert = rowToAlert(updatedRow);

  logAudit(req.user!.id, 'update', 'alert', id, JSON.stringify(oldAlert), JSON.stringify(newAlert));
  res.json(newAlert);
});

router.post('/batch-process', authMiddleware, (req: AuthRequest, res: Response) => {
  const { ids, action, status, assigneeId } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'Array of alert ids is required' });
    return;
  }

  const processed: number[] = [];
  const failed: number[] = [];

  for (const id of ids) {
    try {
      const existingRow = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id) as any;
      if (!existingRow) {
        failed.push(id);
        continue;
      }

      const oldAlert = rowToAlert(existingRow);
      let closedAt = existingRow.closed_at;

      if (status === 'closed' && existingRow.status !== 'closed') {
        closedAt = new Date().toISOString();
      } else if (status && status !== 'closed') {
        closedAt = null;
      }

      db.prepare(`
        UPDATE alerts
        SET status = COALESCE(?, status),
            assignee_id = COALESCE(?, assignee_id),
            closed_at = COALESCE(?, closed_at)
        WHERE id = ?
      `).run(status, assigneeId, closedAt, id);

      const updatedRow = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id) as any;
      const newAlert = rowToAlert(updatedRow);

      logAudit(req.user!.id, `batch_${action || 'update'}`, 'alert', id, JSON.stringify(oldAlert), JSON.stringify(newAlert));
      processed.push(id);
    } catch (err) {
      failed.push(id);
    }
  }

  res.json({ processed, failed, total: ids.length });
});

export default router;
