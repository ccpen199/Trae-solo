import { Router, type Response } from 'express';
import db from '../db.js';
import { authenticate, requireRoles, getClientIp, getUserAgent, type AuthRequest } from '../middleware.js';
import { logAudit } from '../audit.js';
import type { EtcAccountResponse, AccountStatus } from '../types.js';

const router = Router();

router.get('/', authenticate, requireRoles('admin', 'operation', 'fleet_admin', 'owner'), (req: AuthRequest, res: Response): void => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.page_size as string) || 20;
  const offset = (page - 1) * pageSize;
  const status = req.query.status as string | undefined;
  const userId = req.query.user_id as string | undefined;
  const keyword = req.query.keyword as string | undefined;

  let where = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (req.user?.role === 'owner') {
    where += ' AND a.user_id = ?';
    params.push(req.user.id);
  } else if (userId) {
    where += ' AND a.user_id = ?';
    params.push(parseInt(userId));
  }

  if (status) {
    where += ' AND a.status = ?';
    params.push(status);
  }
  if (keyword) {
    where += ' AND (a.account_no LIKE ? OR u.name LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM etc_accounts a
    INNER JOIN users u ON a.user_id = u.id
    ${where}
  `).get(...params) as { count: number };

  const list = db.prepare(`
    SELECT a.*, u.name as user_name
    FROM etc_accounts a
    INNER JOIN users u ON a.user_id = u.id
    ${where}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset) as EtcAccountResponse[];

  res.json({ success: true, data: list, total: total.count, page, page_size: pageSize });
});

router.get('/my', authenticate, requireRoles('owner', 'fleet_admin'), (req: AuthRequest, res: Response): void => {
  const account = db.prepare(`
    SELECT a.*, u.name as user_name
    FROM etc_accounts a
    INNER JOIN users u ON a.user_id = u.id
    WHERE a.user_id = ?
  `).get(req.user?.id || 0) as EtcAccountResponse | undefined;

  if (!account) {
    res.status(404).json({ success: false, error: '账户不存在' });
    return;
  }

  res.json({ success: true, data: account });
});

router.get('/:id', authenticate, requireRoles('admin', 'operation'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);

  const account = db.prepare(`
    SELECT a.*, u.name as user_name, u.phone as user_phone
    FROM etc_accounts a
    INNER JOIN users u ON a.user_id = u.id
    WHERE a.id = ?
  `).get(id) as EtcAccountResponse | undefined;

  if (!account) {
    res.status(404).json({ success: false, error: '账户不存在' });
    return;
  }

  res.json({ success: true, data: account });
});

router.post('/', authenticate, requireRoles('admin', 'operation'), (req: AuthRequest, res: Response): void => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      res.status(400).json({ success: false, error: '缺少用户ID' });
      return;
    }

    const existing = db.prepare('SELECT id FROM etc_accounts WHERE user_id = ?').get(user_id);
    if (existing) {
      res.status(400).json({ success: false, error: '该用户已有ETC账户' });
      return;
    }

    const accountNo = `ETC${new Date().getFullYear()}${Date.now().toString().slice(-10)}`;

    const info = db.prepare(`
      INSERT INTO etc_accounts (account_no, user_id, balance, status)
      VALUES (?, ?, 0, 'normal')
    `).run(accountNo, user_id);

    const accountId = Number(info.lastInsertRowid);

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: 'create',
        resourceType: 'etc_account',
        resourceId: accountId,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        detail: `创建ETC账户: ${accountNo}`,
      });
    }

    const account = db.prepare('SELECT * FROM etc_accounts WHERE id = ?').get(accountId) as EtcAccountResponse;
    res.json({ success: true, data: account });
  } catch (e: any) {
    console.error('[Account Error]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/:id/recharge', authenticate, requireRoles('admin', 'operation', 'owner'), (req: AuthRequest, res: Response): void => {
  try {
    const id = parseInt(req.params.id);
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: '请输入有效的充值金额' });
      return;
    }

    const existing = db.prepare('SELECT * FROM etc_accounts WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ success: false, error: '账户不存在' });
      return;
    }

    if (existing.status !== 'normal') {
      res.status(400).json({ success: false, error: '账户状态异常，无法充值' });
      return;
    }

    if (req.user?.role === 'owner' && existing.user_id !== req.user.id) {
      res.status(403).json({ success: false, error: '只能为自己的账户充值' });
      return;
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    db.prepare(`
      UPDATE etc_accounts
      SET balance = balance + ?,
          total_recharge = total_recharge + ?,
          last_recharge_at = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(amount, amount, now, id);

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: 'update',
        resourceType: 'etc_account',
        resourceId: id,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        detail: `ETC账户充值: ${existing.account_no}, 金额: ${amount}`,
      });
    }

    const account = db.prepare('SELECT * FROM etc_accounts WHERE id = ?').get(id) as EtcAccountResponse;
    res.json({ success: true, data: account });
  } catch (e: any) {
    console.error('[Account Error]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/:id/status', authenticate, requireRoles('admin', 'operation'), (req: AuthRequest, res: Response): void => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    const existing = db.prepare('SELECT * FROM etc_accounts WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ success: false, error: '账户不存在' });
      return;
    }

    db.prepare(`
      UPDATE etc_accounts
      SET status = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(status, id);

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: 'update',
        resourceType: 'etc_account',
        resourceId: id,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        detail: `更新ETC账户状态: ${existing.account_no} -> ${status}`,
      });
    }

    const account = db.prepare('SELECT * FROM etc_accounts WHERE id = ?').get(id) as EtcAccountResponse;
    res.json({ success: true, data: account });
  } catch (e: any) {
    console.error('[Account Error]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/options/statuses', authenticate, (req: AuthRequest, res: Response): void => {
  const statuses: AccountStatus[] = ['normal', 'frozen', 'disabled'];
  const options = statuses.map(s => ({
    value: s,
    label: s === 'normal' ? '正常' : s === 'frozen' ? '已冻结' : '已停用'
  }));
  res.json({ success: true, data: options });
});

export default router;
