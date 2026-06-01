import { Router, Response } from 'express';
import { db, rowToEnvironment } from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.get('/applications/:id/environments', authMiddleware, (req: AuthRequest, res: Response) => {
  const appId = parseInt(req.params.id);

  const rows = db.prepare(`
    SELECT * FROM environments
    WHERE app_id = ?
    ORDER BY type, created_at
  `).all(appId) as any[];

  const items = rows.map(rowToEnvironment);
  res.json({ items, total: items.length });
});

router.post('/applications/:id/environments', authMiddleware, (req: AuthRequest, res: Response) => {
  const appId = parseInt(req.params.id);
  const { name, type, config } = req.body;

  if (!name || !type) {
    res.status(400).json({ error: 'Name and type are required' });
    return;
  }

  const appExists = db.prepare('SELECT id FROM applications WHERE id = ?').get(appId);
  if (!appExists) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO environments (app_id, name, type, config, status)
    VALUES (?, ?, ?, ?, 'active')
  `).run(appId, name, type, config || '{}');

  const envId = result.lastInsertRowid as number;
  const row = db.prepare('SELECT * FROM environments WHERE id = ?').get(envId) as any;
  const env = rowToEnvironment(row);

  logAudit(req.user!.id, 'create', 'environment', envId, null, JSON.stringify(env));
  res.json(env);
});

router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { name, type, config, status } = req.body;

  const existingRow = db.prepare('SELECT * FROM environments WHERE id = ?').get(id) as any;
  if (!existingRow) {
    res.status(404).json({ error: 'Environment not found' });
    return;
  }

  const oldEnv = rowToEnvironment(existingRow);

  db.prepare(`
    UPDATE environments
    SET name = COALESCE(?, name),
        type = COALESCE(?, type),
        config = COALESCE(?, config),
        status = COALESCE(?, status)
    WHERE id = ?
  `).run(name, type, config, status, id);

  const updatedRow = db.prepare('SELECT * FROM environments WHERE id = ?').get(id) as any;
  const newEnv = rowToEnvironment(updatedRow);

  logAudit(req.user!.id, 'update', 'environment', id, JSON.stringify(oldEnv), JSON.stringify(newEnv));
  res.json(newEnv);
});

router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);

  const existingRow = db.prepare('SELECT * FROM environments WHERE id = ?').get(id) as any;
  if (!existingRow) {
    res.status(404).json({ error: 'Environment not found' });
    return;
  }

  const oldEnv = rowToEnvironment(existingRow);

  db.prepare('DELETE FROM environments WHERE id = ?').run(id);
  logAudit(req.user!.id, 'delete', 'environment', id, JSON.stringify(oldEnv), null);

  res.json({ message: 'Environment deleted successfully' });
});

export default router;
