import { Router, Response } from 'express';
import { db, rowToVulnerability } from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;

  if (!status || !['open', 'fixed', 'ignored'].includes(status)) {
    res.status(400).json({ error: 'Valid status is required (open, fixed, ignored)' });
    return;
  }

  const existingRow = db.prepare('SELECT * FROM vulnerabilities WHERE id = ?').get(id) as any;
  if (!existingRow) {
    res.status(404).json({ error: 'Vulnerability not found' });
    return;
  }

  const oldVuln = rowToVulnerability(existingRow);

  db.prepare(`
    UPDATE vulnerabilities
    SET status = ?
    WHERE id = ?
  `).run(status, id);

  const updatedRow = db.prepare('SELECT * FROM vulnerabilities WHERE id = ?').get(id) as any;
  const newVuln = rowToVulnerability(updatedRow);

  logAudit(req.user!.id, 'update', 'vulnerability', id, JSON.stringify(oldVuln), JSON.stringify(newVuln));
  res.json(newVuln);
});

export default router;
