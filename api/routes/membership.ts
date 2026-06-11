import { Router } from 'express';
import type { DbInstance } from '../db-type';

const router = Router();
const CURRENT_USER_ID = 'u1';

const svipBenefits = [
  { id: 'b1', name: '专属客服通道', description: '7×24小时SVIP专属客服，优先响应', icon: 'headphones', active: true },
  { id: 'b2', name: '运费8折优惠', description: '所有寄送服务享受8折优惠', icon: 'percent', active: true },
  { id: 'b3', name: '免费包装服务', description: '标准包装免费，特殊包装5折', icon: 'package', active: true },
  { id: 'b4', name: '优先取件', description: '预约取件2小时内上门', icon: 'clock', active: true },
  { id: 'b5', name: '积分双倍', description: '每笔订单积分翻倍累计', icon: 'star', active: true },
  { id: 'b6', name: '免费保价', description: '单笔最高5000元保价免费', icon: 'shield', active: true },
  { id: 'b7', name: '专属活动', description: 'SVIP会员专属优惠活动与礼品', icon: 'gift', active: true },
  { id: 'b8', name: '免费改地址', description: '派送中可免费修改收件地址1次', icon: 'map-pin', active: true },
];

function parseDetail(detail: string): Record<string, string> {
  const result: Record<string, string> = {};
  const parts = detail.split(' | ');
  for (const part of parts) {
    const colonIdx = part.indexOf(': ');
    if (colonIdx > -1) {
      const key = part.slice(0, colonIdx).trim();
      const value = part.slice(colonIdx + 2).trim();
      result[key] = value;
    }
  }
  return result;
}

const actionLabelMap: Record<string, string> = {
  svip_grant: 'SVIP授予',
  svip_upgrade: '等级升级',
  svip_renew: 'SVIP续费',
  svip_revoke: 'SVIP撤销',
  points_adjust: '积分调整',
  points_expire: '积分过期',
  benefit_grant: '权益发放',
  review: '复核操作',
  create: '创建',
  update: '更新',
  assign: '分派',
  login: '登录',
};

function mapAuditLog(row: any) {
  const parsed = parseDetail(row.detail);
  return {
    id: row.id,
    userId: row.user_id,
    operator: row.operator,
    action: row.action,
    actionLabel: actionLabelMap[row.action] || row.action,
    target: row.target,
    detail: row.detail,
    parsed,
    createdAt: row.created_at,
  };
}

router.get('/info', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const row = db.prepare('SELECT * FROM membership_info WHERE user_id = ?').get(CURRENT_USER_ID) as any;
    if (!row) {
      res.json({
        id: '',
        userId: CURRENT_USER_ID,
        points: 0,
        level: 'normal',
        svipLevel: 0,
        svipExpiry: undefined,
        totalEarned: 0,
        totalUsed: 0,
        totalExpired: 0,
        svipSource: undefined,
        svipGrantedAt: undefined,
        svipGrantedBy: undefined,
      });
      return;
    }
    const svipLevel = row.svip_level ?? (row.level === 'svip' ? 2 : row.level === 'gold' ? 1 : 0);
    res.json({
      id: row.id,
      userId: row.user_id,
      points: row.points,
      level: row.level,
      svipLevel,
      svipExpiry: row.svip_expiry || undefined,
      totalEarned: row.total_earned,
      totalUsed: row.total_used,
      totalExpired: row.total_expired,
      svipSource: row.svip_source || (row.level === 'svip' ? 'upgrade' : undefined),
      svipGrantedAt: row.svip_granted_at || undefined,
      svipGrantedBy: row.svip_granted_by || (row.level === 'svip' ? '系统自动' : undefined),
    });
  } catch (error) {
    console.error('Failed to fetch membership info:', error);
    res.status(500).json({ error: 'Failed to fetch membership info' });
  }
});

router.get('/points', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const rows = db.prepare('SELECT * FROM points_records WHERE user_id = ? ORDER BY created_at DESC').all(CURRENT_USER_ID) as any[];
    res.json({
      records: rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        type: r.type,
        amount: r.amount,
        description: r.description,
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch points records:', error);
    res.status(500).json({ error: 'Failed to fetch points records' });
  }
});

router.post('/points/exchange', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const { points, item } = req.body;
    if (!points || !item) {
      res.status(400).json({ error: 'points and item are required' });
      return;
    }

    const membership = db.prepare('SELECT * FROM membership_info WHERE user_id = ?').get(CURRENT_USER_ID) as any;
    if (!membership || membership.points < points) {
      res.status(400).json({ error: 'Insufficient points' });
      return;
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const id = `pr${Date.now()}`;
    db.prepare(
      `INSERT INTO points_records (id, user_id, type, amount, description)
       VALUES (?, ?, 'use', ?, ?)`
    ).run(id, CURRENT_USER_ID, points, `兑换: ${item}`);

    db.prepare(
      `UPDATE membership_info SET points = points - ?, total_used = total_used + ? WHERE user_id = ?`
    ).run(points, points, CURRENT_USER_ID);

    const auditId = `al${Date.now()}`;
    let svipGranted: any = null;

    const svipTrialMatch = /SVIP.*体验卡.*?(\d+)\s*天|SVIP.*?(\d+)\s*天/.exec(item);
    const isSvipExchange = item.includes('SVIP');
    if (isSvipExchange) {
      const days = svipTrialMatch ? (parseInt(svipTrialMatch[1] || svipTrialMatch[2] || '7', 10)) : 7;
      const svipLevel = days >= 30 ? 2 : days >= 15 ? 1 : 1;
      const expiry = new Date(Date.now() + days * 86400 * 1000).toISOString().replace('T', ' ').slice(0, 19);

      db.prepare(
        `UPDATE membership_info SET
           level = 'svip',
           svip_level = COALESCE(?, svip_level),
           svip_expiry = ?,
           svip_source = 'activity',
           svip_granted_at = ?,
           svip_granted_by = '积分兑换中心'
         WHERE user_id = ?`
      ).run(svipLevel, expiry, now, CURRENT_USER_ID);

      svipGranted = { level: svipLevel, expiry, days, grantedBy: '积分兑换中心', source: 'activity' };

      db.prepare(
        `INSERT INTO audit_logs (id, user_id, operator, action, target, detail, created_at)
         VALUES (?, ?, ?, 'svip_grant', ?, ?, ?)`
      ).run(`al-svip-${Date.now()}`, CURRENT_USER_ID, '积分兑换中心',
        `membership/${CURRENT_USER_ID}`,
        `SVIP权益发放 | 来源:积分兑换 | 物品:${item} | SVIP等级:Lv.${svipLevel} | 有效期:${days}天(至 ${expiry}) | 发放人:积分兑换中心 | 复核人:系统自动 | 消耗积分:${points}`,
        now);
    }

    db.prepare(
      `INSERT INTO audit_logs (id, user_id, operator, action, target, detail, created_at)
       VALUES (?, ?, ?, 'points_exchange', ?, ?, ?)`
    ).run(auditId, CURRENT_USER_ID, '系统自动', `points/${item}`, `积分兑换: ${item} | 消耗积分: ${points} | 审核人: 系统自动 | ${svipGranted ? '同步发放SVIP权益' : ''}`, now);

    const updated = db.prepare('SELECT * FROM membership_info WHERE user_id = ?').get(CURRENT_USER_ID) as any;
    res.json({
      success: true,
      exchangedPoints: points,
      item,
      remainingPoints: updated.points,
      svipGranted,
      reviewLogs: svipGranted ? [
        { time: now, operator: '当前用户', action: 'submit', note: `提交兑换 ${item}` },
        { time: now, operator: '积分系统', action: 'approve', note: `积分校验通过，余额 ${updated.points} 分` },
        { time: now, operator: '权益中心', action: 'issue', note: svipGranted ? `SVIP Lv.${svipGranted.level} 权益已发放，有效期 ${svipGranted.days} 天` : '权益已发放至账户' },
        { time: now, operator: '系统自动', action: 'review', note: 'SVIP权益发放复核完成' },
      ] : undefined,
    });
  } catch (error) {
    console.error('Points exchange failed:', error);
    res.status(500).json({ error: 'Points exchange failed' });
  }
});

router.get('/svip/benefits', (req, res) => {
  try {
    res.json(svipBenefits);
  } catch (error) {
    console.error('Failed to fetch SVIP benefits:', error);
    res.status(500).json({ error: 'Failed to fetch SVIP benefits' });
  }
});

router.get('/audit-logs', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const { action, page = '1', limit = '20', type } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const params: unknown[] = [];
    let whereClauses = '';

    if (action) {
      whereClauses += ' WHERE action = ?';
      params.push(action as string);
    } else if (type === 'svip') {
      whereClauses += " WHERE action IN ('svip_grant', 'svip_upgrade', 'svip_renew', 'svip_revoke', 'benefit_grant', 'review')";
    } else if (type === 'points') {
      whereClauses += " WHERE action IN ('points_adjust', 'points_expire', 'points_exchange')";
    }

    const totalResult = db.prepare('SELECT COUNT(*) as total FROM audit_logs' + whereClauses).get(...params) as { total: number };
    const rows = db.prepare('SELECT * FROM audit_logs' + whereClauses + ' ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(...params, limitNum, offset) as any[];

    res.json({
      data: rows.map(mapAuditLog),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limitNum),
      },
    });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

router.get('/svip/audit-logs', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const whereClauses = " WHERE action IN ('svip_grant', 'svip_upgrade', 'svip_renew', 'svip_revoke', 'benefit_grant', 'review')";

    const totalResult = db.prepare('SELECT COUNT(*) as total FROM audit_logs' + whereClauses).get() as { total: number };
    const rows = db.prepare('SELECT * FROM audit_logs' + whereClauses + ' ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(limitNum, offset) as any[];

    res.json({
      data: rows.map(mapAuditLog),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limitNum),
      },
    });
  } catch (error) {
    console.error('Failed to fetch SVIP audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch SVIP audit logs' });
  }
});

export default router;
