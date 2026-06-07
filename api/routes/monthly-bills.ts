import { Router, type Response } from 'express';
import db from '../db.js';
import { authenticate, requireRoles, scopeToOwn, getClientIp, getUserAgent, type AuthRequest } from '../middleware.js';
import { logAudit } from '../audit.js';
import type { MonthlyBillResponse, BillStatus } from '../types.js';

const router = Router();

router.get('/', authenticate, scopeToOwn('fleet_id', 'owner_id'), (req: AuthRequest, res: Response): void => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.page_size as string) || 20;
  const offset = (page - 1) * pageSize;
  const fleetId = req.query.fleet_id as string | undefined;
  const ownerId = req.query.owner_id as string | undefined;
  const status = req.query.status as string | undefined;
  const year = req.query.year as string | undefined;
  const month = req.query.month as string | undefined;
  const keyword = req.query.keyword as string | undefined;

  let where = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (fleetId) {
    where += ' AND b.fleet_id = ?';
    params.push(parseInt(fleetId));
  }
  if (ownerId) {
    where += ' AND b.owner_id = ?';
    params.push(parseInt(ownerId));
  }
  if (status) {
    where += ' AND b.status = ?';
    params.push(status);
  }
  if (year) {
    where += ' AND b.year = ?';
    params.push(parseInt(year));
  }
  if (month) {
    where += ' AND b.month = ?';
    params.push(parseInt(month));
  }
  if (keyword) {
    where += ' AND (v.plate_number LIKE ? OR b.bill_no LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM monthly_bills b
    INNER JOIN vehicles v ON b.vehicle_id = v.id
    ${where}
  `).get(...params) as { count: number };

  const list = db.prepare(`
    SELECT b.*,
           v.plate_number,
           u.name as owner_name,
           f.name as fleet_name
    FROM monthly_bills b
    INNER JOIN vehicles v ON b.vehicle_id = v.id
    LEFT JOIN users u ON b.owner_id = u.id
    LEFT JOIN fleets f ON b.fleet_id = f.id
    ${where}
    ORDER BY b.year DESC, b.month DESC, b.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset) as MonthlyBillResponse[];

  res.json({ success: true, data: list, total: total.count, page, page_size: pageSize });
});

router.get('/:id', authenticate, scopeToOwn('fleet_id', 'owner_id'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);

  const bill = db.prepare(`
    SELECT b.*,
           v.plate_number,
           v.vehicle_type,
           v.vehicle_class,
           u.name as owner_name,
           f.name as fleet_name
    FROM monthly_bills b
    INNER JOIN vehicles v ON b.vehicle_id = v.id
    LEFT JOIN users u ON b.owner_id = u.id
    LEFT JOIN fleets f ON b.fleet_id = f.id
    WHERE b.id = ?
  `).get(id) as MonthlyBillResponse | undefined;

  if (!bill) {
    res.status(404).json({ success: false, error: '月结单不存在' });
    return;
  }

  res.json({ success: true, data: bill });
});

router.get('/:id/records', authenticate, (req: AuthRequest, res: Response): void => {
  const billId = parseInt(req.params.id);
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.page_size as string) || 50;
  const offset = (page - 1) * pageSize;

  const bill = db.prepare('SELECT * FROM monthly_bills WHERE id = ?').get(billId);
  if (!bill) {
    res.status(404).json({ success: false, error: '月结单不存在' });
    return;
  }

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM toll_records
    WHERE vehicle_id = ? AND strftime('%Y', created_at) = ? AND strftime('%m', created_at) = ?
  `).get(bill.vehicle_id, String(bill.year).padStart(4, '0'), String(bill.month).padStart(2, '0')) as { count: number };

  const records = db.prepare(`
    SELECT * FROM toll_records
    WHERE vehicle_id = ? AND strftime('%Y', created_at) = ? AND strftime('%m', created_at) = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(bill.vehicle_id, String(bill.year).padStart(4, '0'), String(bill.month).padStart(2, '0'), pageSize, offset);

  res.json({ success: true, data: records, total: total.count, page, page_size: pageSize });
});

router.put('/:id/pay', authenticate, requireRoles('admin', 'operation', 'fleet_admin', 'owner'), (req: AuthRequest, res: Response): void => {
  try {
    const id = parseInt(req.params.id);

    const existing = db.prepare('SELECT * FROM monthly_bills WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ success: false, error: '月结单不存在' });
      return;
    }

    if (existing.status === 'paid') {
      res.status(400).json({ success: false, error: '月结单已支付' });
      return;
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    db.prepare(`
      UPDATE monthly_bills
      SET status = 'paid',
          paid_amount = total_amount,
          paid_at = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(now, id);

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: 'update',
        resourceType: 'monthly_bill',
        resourceId: id,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        detail: `支付月结单: ${existing.bill_no}, 金额: ${existing.total_amount}`,
      });
    }

    const bill = db.prepare('SELECT * FROM monthly_bills WHERE id = ?').get(id) as MonthlyBillResponse;
    res.json({ success: true, data: bill });
  } catch (e: any) {
    console.error('[Bill Error]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/:id/waive', authenticate, requireRoles('admin', 'operation'), (req: AuthRequest, res: Response): void => {
  try {
    const id = parseInt(req.params.id);
    const { remark } = req.body;

    const existing = db.prepare('SELECT * FROM monthly_bills WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ success: false, error: '月结单不存在' });
      return;
    }

    db.prepare(`
      UPDATE monthly_bills
      SET status = 'waived',
          paid_amount = 0,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(id);

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: 'update',
        resourceType: 'monthly_bill',
        resourceId: id,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        detail: `减免月结单: ${existing.bill_no}, 备注: ${remark || '无'}`,
      });
    }

    const bill = db.prepare('SELECT * FROM monthly_bills WHERE id = ?').get(id) as MonthlyBillResponse;
    res.json({ success: true, data: bill });
  } catch (e: any) {
    console.error('[Bill Error]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/options/statuses', authenticate, (req: AuthRequest, res: Response): void => {
  const statuses: BillStatus[] = ['unpaid', 'paid', 'overdue', 'waived'];
  const options = statuses.map(s => ({
    value: s,
    label: s === 'unpaid' ? '待支付' : s === 'paid' ? '已支付' : s === 'overdue' ? '已逾期' : '已减免'
  }));
  res.json({ success: true, data: options });
});

export default router;
