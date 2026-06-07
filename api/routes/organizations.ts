import { Router, type Response } from 'express';
import db from '../db.js';
import { requireAuth, getClientIp, type AuthRequest } from '../middleware.js';
import { logAudit } from '../audit.js';
import type { Organization } from '../types.js';

const router = Router();

function buildTree(nodes: any[], parentId: number | null = null): any[] {
  return nodes
    .filter(n => n.parent_id === parentId)
    .map(n => ({
      ...n,
      children: buildTree(nodes, n.id),
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
}

router.get('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const list = db.prepare('SELECT * FROM organizations ORDER BY sort_order').all() as Organization[];
  const tree = buildTree(list, null);
  res.json({ success: true, tree, list });
});

router.post('/', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { name, type, parentId } = req.body;
    if (!name || !type) {
      res.status(400).json({ success: false, error: '缺少必要字段' });
      return;
    }
    const info = db.prepare(`
      INSERT INTO organizations (name, type, parent_id, sort_order)
      VALUES (?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM organizations WHERE parent_id IS ? OR parent_id = ?))
    `).run(name, type, parentId || null, parentId || null, parentId || null);

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: 'create',
        resourceType: 'organization',
        resourceId: info.lastInsertRowid as number,
        ipAddress: getClientIp(req),
        detail: `添加组织节点: ${name} (${type})`,
      });
    }
    res.json({ success: true, node: db.prepare('SELECT * FROM organizations WHERE id = ?').get(info.lastInsertRowid) });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const { name } = req.body;
  const existing = db.prepare('SELECT * FROM organizations WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ success: false, error: '组织不存在' });
    return;
  }
  db.prepare("UPDATE organizations SET name = ?, updated_at = datetime('now') WHERE id = ?").run(name, id);
  if (req.user) {
    logAudit({
      userId: req.user.id,
      action: 'update',
      resourceType: 'organization',
      resourceId: id,
      ipAddress: getClientIp(req),
      detail: `更新组织: ${name}`,
    });
  }
  res.json({ success: true, node: db.prepare('SELECT * FROM organizations WHERE id = ?').get(id) });
});

router.delete('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const existing = db.prepare('SELECT * FROM organizations WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ success: false, error: '组织不存在' });
    return;
  }
  db.prepare('DELETE FROM organizations WHERE id = ?').run(id);
  if (req.user) {
    logAudit({
      userId: req.user.id,
      action: 'delete',
      resourceType: 'organization',
      resourceId: id,
      ipAddress: getClientIp(req),
      detail: `删除组织: ${existing.name}`,
    });
  }
  res.json({ success: true });
});

router.get('/:id/devices', requireAuth, (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const devices = db.prepare('SELECT * FROM devices WHERE org_id = ?').all(id);
  res.json({ success: true, devices });
});

export default router;
