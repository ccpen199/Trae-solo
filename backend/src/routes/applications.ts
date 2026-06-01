import { Router, Response } from 'express';
import { db, rowToApplication, rowToUser } from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { Application, TimelineEvent } from '../types.js';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const offset = (page - 1) * pageSize;

  const rows = db.prepare(`
    SELECT a.*, u.username as owner_name
    FROM applications a
    LEFT JOIN users u ON a.owner_id = u.id
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).all(pageSize, offset) as any[];

  const totalRow = db.prepare('SELECT COUNT(*) as count FROM applications').get() as { count: number };

  const items = rows.map(row => ({
    ...rowToApplication(row),
    ownerName: row.owner_name
  }));

  res.json({ items, total: totalRow.count, page, pageSize });
});

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { name, code, description, ownerId } = req.body;

  if (!name || !code) {
    res.status(400).json({ error: 'Name and code are required' });
    return;
  }

  const existing = db.prepare('SELECT id FROM applications WHERE code = ?').get(code);
  if (existing) {
    res.status(400).json({ error: 'Application code already exists' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO applications (name, code, description, owner_id, status)
    VALUES (?, ?, ?, ?, 'active')
  `).run(name, code, description || '', ownerId || req.user!.id);

  const appId = result.lastInsertRowid as number;
  const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(appId) as any;
  const app = rowToApplication(row);

  logAudit(req.user!.id, 'create', 'application', appId, null, JSON.stringify(app));
  res.json(app);
});

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);

  const row = db.prepare(`
    SELECT a.*, u.username as owner_name
    FROM applications a
    LEFT JOIN users u ON a.owner_id = u.id
    WHERE a.id = ?
  `).get(id) as any;

  if (!row) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  const app = {
    ...rowToApplication(row),
    ownerName: row.owner_name
  };

  res.json(app);
});

router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { name, code, description, ownerId, status } = req.body;

  const existingRow = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as any;
  if (!existingRow) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  const oldApp = rowToApplication(existingRow);

  if (code && code !== existingRow.code) {
    const codeExists = db.prepare('SELECT id FROM applications WHERE code = ? AND id != ?').get(code, id);
    if (codeExists) {
      res.status(400).json({ error: 'Application code already exists' });
      return;
    }
  }

  db.prepare(`
    UPDATE applications
    SET name = COALESCE(?, name),
        code = COALESCE(?, code),
        description = COALESCE(?, description),
        owner_id = COALESCE(?, owner_id),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, code, description, ownerId, status, id);

  const updatedRow = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as any;
  const newApp = rowToApplication(updatedRow);

  logAudit(req.user!.id, 'update', 'application', id, JSON.stringify(oldApp), JSON.stringify(newApp));
  res.json(newApp);
});

router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);

  const existingRow = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as any;
  if (!existingRow) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  const oldApp = rowToApplication(existingRow);

  db.prepare('DELETE FROM applications WHERE id = ?').run(id);
  logAudit(req.user!.id, 'delete', 'application', id, JSON.stringify(oldApp), null);

  res.json({ message: 'Application deleted successfully' });
});

router.get('/:id/timeline', authMiddleware, (req: AuthRequest, res: Response) => {
  const appId = parseInt(req.params.id);

  const events: TimelineEvent[] = [];

  const taskRows = db.prepare(`
    SELECT id, status, created_at
    FROM scan_tasks
    WHERE app_id = ?
    ORDER BY created_at DESC
    LIMIT 10
  `).all(appId) as any[];

  taskRows.forEach(row => {
    events.push({
      id: row.id,
      type: 'task',
      title: `扫描任务 #${row.id}`,
      description: `扫描任务状态: ${row.status}`,
      status: row.status,
      createdAt: row.created_at
    });
  });

  const changeRows = db.prepare(`
    SELECT id, type, status, reason, created_at
    FROM change_orders
    WHERE affected_objects LIKE ?
    ORDER BY created_at DESC
    LIMIT 10
  `).all(`%应用ID: ${appId}%`) as any[];

  changeRows.forEach(row => {
    events.push({
      id: row.id,
      type: 'change',
      title: `变更单 #${row.id}`,
      description: row.reason,
      status: row.status,
      createdAt: row.created_at
    });
  });

  const versionRows = db.prepare(`
    SELECT id, version, branch, created_at
    FROM app_versions
    WHERE app_id = ?
    ORDER BY created_at DESC
    LIMIT 10
  `).all(appId) as any[];

  versionRows.forEach(row => {
    events.push({
      id: row.id,
      type: 'version',
      title: `版本 ${row.version}`,
      description: `分支: ${row.branch}`,
      status: 'released',
      createdAt: row.created_at
    });
  });

  events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ items: events.slice(0, 20) });
});

export default router;
