import { Router, Response } from 'express';
import { db, rowToAppVersion } from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.get('/applications/:id/versions', authMiddleware, (req: AuthRequest, res: Response) => {
  const appId = parseInt(req.params.id);

  const rows = db.prepare(`
    SELECT * FROM app_versions
    WHERE app_id = ?
    ORDER BY created_at DESC
  `).all(appId) as any[];

  const items = rows.map(rowToAppVersion);
  res.json({ items, total: items.length });
});

router.post('/applications/:id/versions', authMiddleware, (req: AuthRequest, res: Response) => {
  const appId = parseInt(req.params.id);
  const { version, branch, commitHash, dependencies } = req.body;

  if (!version) {
    res.status(400).json({ error: 'Version is required' });
    return;
  }

  const appExists = db.prepare('SELECT id FROM applications WHERE id = ?').get(appId);
  if (!appExists) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO app_versions (app_id, version, branch, commit_hash, dependencies)
    VALUES (?, ?, ?, ?, ?)
  `).run(appId, version, branch || '', commitHash || '', dependencies || '{}');

  const versionId = result.lastInsertRowid as number;
  const row = db.prepare('SELECT * FROM app_versions WHERE id = ?').get(versionId) as any;
  const appVersion = rowToAppVersion(row);

  logAudit(req.user!.id, 'create', 'version', versionId, null, JSON.stringify(appVersion));
  res.json(appVersion);
});

export default router;
