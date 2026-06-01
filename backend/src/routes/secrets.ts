import { Router, Response } from 'express';
import { db, rowToSecretKey } from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.get('/applications/:id/secrets', authMiddleware, (req: AuthRequest, res: Response) => {
  const appId = parseInt(req.params.id);

  const rows = db.prepare(`
    SELECT * FROM secret_keys
    WHERE app_id = ?
    ORDER BY created_at DESC
  `).all(appId) as any[];

  const items = rows.map(rowToSecretKey);
  res.json({ items, total: items.length });
});

router.post('/applications/:id/secrets', authMiddleware, (req: AuthRequest, res: Response) => {
  const appId = parseInt(req.params.id);
  const { name, type, encryptedValue, expiresAt } = req.body;

  if (!name || !type || !encryptedValue) {
    res.status(400).json({ error: 'Name, type, and encryptedValue are required' });
    return;
  }

  const appExists = db.prepare('SELECT id FROM applications WHERE id = ?').get(appId);
  if (!appExists) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO secret_keys (app_id, name, type, encrypted_value, expires_at, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `).run(appId, name, type, encryptedValue, expiresAt || null);

  const secretId = result.lastInsertRowid as number;
  const row = db.prepare('SELECT * FROM secret_keys WHERE id = ?').get(secretId) as any;
  const secret = rowToSecretKey(row);

  logAudit(req.user!.id, 'create', 'secret', secretId, null, JSON.stringify({ ...secret, encryptedValue: '***' }));
  res.json(secret);
});

router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { name, type, encryptedValue, expiresAt, status } = req.body;

  const existingRow = db.prepare('SELECT * FROM secret_keys WHERE id = ?').get(id) as any;
  if (!existingRow) {
    res.status(404).json({ error: 'Secret not found' });
    return;
  }

  const oldSecret = rowToSecretKey(existingRow);

  db.prepare(`
    UPDATE secret_keys
    SET name = COALESCE(?, name),
        type = COALESCE(?, type),
        encrypted_value = COALESCE(?, encrypted_value),
        expires_at = COALESCE(?, expires_at),
        status = COALESCE(?, status)
    WHERE id = ?
  `).run(name, type, encryptedValue, expiresAt, status, id);

  const updatedRow = db.prepare('SELECT * FROM secret_keys WHERE id = ?').get(id) as any;
  const newSecret = rowToSecretKey(updatedRow);

  logAudit(req.user!.id, 'update', 'secret', id,
    JSON.stringify({ ...oldSecret, encryptedValue: '***' }),
    JSON.stringify({ ...newSecret, encryptedValue: '***' })
  );
  res.json(newSecret);
});

router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);

  const existingRow = db.prepare('SELECT * FROM secret_keys WHERE id = ?').get(id) as any;
  if (!existingRow) {
    res.status(404).json({ error: 'Secret not found' });
    return;
  }

  const oldSecret = rowToSecretKey(existingRow);

  db.prepare('DELETE FROM secret_keys WHERE id = ?').run(id);
  logAudit(req.user!.id, 'delete', 'secret', id,
    JSON.stringify({ ...oldSecret, encryptedValue: '***' }),
    null
  );

  res.json({ message: 'Secret deleted successfully' });
});

export default router;
