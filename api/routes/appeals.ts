import { Router, type Response } from 'express';
import db from '../db.js';
import { authenticate, requireRoles, scopeToOwn, getClientIp, getUserAgent, type AuthRequest } from '../middleware.js';
import { logAudit } from '../audit.js';
import type { AppealResponse, AppealStatus, AppealType } from '../types.js';

const router = Router();

router.get('/', authenticate, scopeToOwn('fleet_id', 'owner_id'), (req: AuthRequest, res: Response): void => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.page_size as string) || 20;
  const offset = (page - 1) * pageSize;
  const fleetId = req.query.fleet_id as string | undefined;
  const ownerId = req.query.owner_id as string | undefined;
  const status = req.query.status as string | undefined;
  const type = req.query.type as string | undefined;
  const keyword = req.query.keyword as string | undefined;

  let where = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (fleetId) {
    where += ' AND v.fleet_id = ?';
    params.push(parseInt(fleetId));
  }
  if (ownerId) {
    where += ' AND v.owner_id = ?';
    params.push(parseInt(ownerId));
  }
  if (status) {
    where += ' AND a.status = ?';
    params.push(status);
  }
  if (type) {
    where += ' AND a.type = ?';
    params.push(type);
  }
  if (keyword) {
    where += ' AND (a.title LIKE ? OR a.appeal_no LIKE ? OR v.plate_number LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM appeals a
    INNER JOIN toll_records t ON a.toll_record_id = t.id
    INNER JOIN vehicles v ON t.vehicle_id = v.id
    ${where}
  `).get(...params) as { count: number };

  const list = db.prepare(`
    SELECT a.*,
           t.record_no,
           t.paid_amount,
           v.plate_number,
           u.name as user_name,
           h.name as handler_name
    FROM appeals a
    INNER JOIN toll_records t ON a.toll_record_id = t.id
    INNER JOIN vehicles v ON t.vehicle_id = v.id
    INNER JOIN users u ON a.user_id = u.id
    LEFT JOIN users h ON a.handler_id = h.id
    ${where}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset) as AppealResponse[];

  res.json({ success: true, data: list, total: total.count, page, page_size: pageSize });
});

router.get('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);

  const appeal = db.prepare(`
    SELECT a.*,
           t.record_no,
           t.paid_amount,
           t.toll_station,
           t.created_at as record_time,
           v.plate_number,
           u.name as user_name,
           h.name as handler_name
    FROM appeals a
    INNER JOIN toll_records t ON a.toll_record_id = t.id
    INNER JOIN vehicles v ON t.vehicle_id = v.id
    INNER JOIN users u ON a.user_id = u.id
    LEFT JOIN users h ON a.handler_id = h.id
    WHERE a.id = ?
  `).get(id) as AppealResponse | undefined;

  if (!appeal) {
    res.status(404).json({ success: false, error: '申诉不存在' });
    return;
  }

  res.json({ success: true, data: appeal });
});

router.post('/', authenticate, requireRoles('admin', 'operation', 'fleet_admin', 'owner'), (req: AuthRequest, res: Response): void => {
  try {
    const { toll_record_id, type, title, description, claimed_amount } = req.body;

    if (!toll_record_id || !type || !title || !description) {
      res.status(400).json({ success: false, error: '缺少必要字段' });
      return;
    }

    const tollRecord = db.prepare('SELECT * FROM toll_records WHERE id = ?').get(toll_record_id);
    if (!tollRecord) {
      res.status(404).json({ success: false, error: '通行记录不存在' });
      return;
    }

    const appealNo = `APL${new Date().getFullYear()}${Date.now().toString().slice(-8)}`;
    const userId = req.user?.id || 1;

    const info = db.prepare(`
      INSERT INTO appeals (appeal_no, toll_record_id, user_id, type, title, description, status, claimed_amount)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(appealNo, toll_record_id, userId, type, title, description, claimed_amount || 0);

    const appealId = Number(info.lastInsertRowid);

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: 'create',
        resourceType: 'appeal',
        resourceId: appealId,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        detail: `创建申诉: ${appealNo}, 类型: ${type}`,
      });
    }

    const appeal = db.prepare('SELECT * FROM appeals WHERE id = ?').get(appealId) as AppealResponse;
    res.json({ success: true, data: appeal });
  } catch (e: any) {
    console.error('[Appeal Error]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/:id/review', authenticate, requireRoles('admin', 'operation'), (req: AuthRequest, res: Response): void => {
  try {
    const id = parseInt(req.params.id);

    const existing = db.prepare('SELECT * FROM appeals WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ success: false, error: '申诉不存在' });
      return;
    }

    if (existing.status !== 'pending') {
      res.status(400).json({ success: false, error: '申诉已处理，无法重复审核' });
      return;
    }

    db.prepare(`
      UPDATE appeals
      SET status = 'reviewing',
          handler_id = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(req.user?.id || 1, id);

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: 'update',
        resourceType: 'appeal',
        resourceId: id,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        detail: `开始审核申诉: ${existing.appeal_no}`,
      });
    }

    const appeal = db.prepare('SELECT * FROM appeals WHERE id = ?').get(id) as AppealResponse;
    res.json({ success: true, data: appeal });
  } catch (e: any) {
    console.error('[Appeal Error]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/:id/approve', authenticate, requireRoles('admin', 'operation'), (req: AuthRequest, res: Response): void => {
  try {
    const id = parseInt(req.params.id);
    const { refund_amount, handle_remark } = req.body;

    const existing = db.prepare('SELECT * FROM appeals WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ success: false, error: '申诉不存在' });
      return;
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    db.prepare(`
      UPDATE appeals
      SET status = 'approved',
          refund_amount = ?,
          handler_id = ?,
          handle_remark = ?,
          handled_at = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(refund_amount || existing.claimed_amount, req.user?.id || 1, handle_remark || null, now, id);

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: 'approve',
        resourceType: 'appeal',
        resourceId: id,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        detail: `通过申诉: ${existing.appeal_no}, 退款金额: ${refund_amount || existing.claimed_amount}`,
      });
    }

    const appeal = db.prepare('SELECT * FROM appeals WHERE id = ?').get(id) as AppealResponse;
    res.json({ success: true, data: appeal });
  } catch (e: any) {
    console.error('[Appeal Error]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/:id/reject', authenticate, requireRoles('admin', 'operation'), (req: AuthRequest, res: Response): void => {
  try {
    const id = parseInt(req.params.id);
    const { handle_remark } = req.body;

    const existing = db.prepare('SELECT * FROM appeals WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ success: false, error: '申诉不存在' });
      return;
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    db.prepare(`
      UPDATE appeals
      SET status = 'rejected',
          refund_amount = 0,
          handler_id = ?,
          handle_remark = ?,
          handled_at = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(req.user?.id || 1, handle_remark || null, now, id);

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: 'reject',
        resourceType: 'appeal',
        resourceId: id,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        detail: `驳回申诉: ${existing.appeal_no}`,
      });
    }

    const appeal = db.prepare('SELECT * FROM appeals WHERE id = ?').get(id) as AppealResponse;
    res.json({ success: true, data: appeal });
  } catch (e: any) {
    console.error('[Appeal Error]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/:id/close', authenticate, requireRoles('admin', 'operation'), (req: AuthRequest, res: Response): void => {
  try {
    const id = parseInt(req.params.id);
    const { refund_amount, handle_remark } = req.body;

    const existing = db.prepare('SELECT * FROM appeals WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ success: false, error: '申诉不存在' });
      return;
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    db.prepare(`
      UPDATE appeals
      SET status = 'closed',
          refund_amount = ?,
          handler_id = ?,
          handle_remark = ?,
          handled_at = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(refund_amount ?? null, req.user?.id || 1, handle_remark || null, now, id);

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: 'update',
        resourceType: 'appeal',
        resourceId: id,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        detail: `关闭申诉: ${existing.appeal_no}`,
      });
    }

    const appeal = db.prepare('SELECT * FROM appeals WHERE id = ?').get(id) as AppealResponse;
    res.json({ success: true, data: appeal });
  } catch (e: any) {
    console.error('[Appeal Error]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/options/statuses', authenticate, (req: AuthRequest, res: Response): void => {
  const statuses: AppealStatus[] = ['pending', 'reviewing', 'approved', 'rejected', 'closed'];
  const options = statuses.map(s => ({
    value: s,
    label: s === 'pending' ? '待处理' : s === 'reviewing' ? '审核中' : s === 'approved' ? '已通过' : s === 'rejected' ? '已驳回' : '已关闭'
  }));
  res.json({ success: true, data: options });
});

router.get('/options/types', authenticate, (req: AuthRequest, res: Response): void => {
  const types: AppealType[] = ['overcharge', 'wrong_vehicle', 'duplicate', 'other'];
  const options = types.map(t => ({
    value: t,
    label: t === 'overcharge' ? '多收费用' : t === 'wrong_vehicle' ? '车辆不符' : t === 'duplicate' ? '重复扣费' : '其他'
  }));
  res.json({ success: true, data: options });
});

export default router;
