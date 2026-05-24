import express from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logOperation } from '../middleware/operationLog';
import { parseJSON, stringifyJSON } from '../utils';

const router = express.Router();

router.use(authMiddleware());

router.get('/', (req: AuthRequest, res) => {
  const { status, severity, page = 1, page_size = 20 } = req.query;
  
  let sql = `
    SELECT a.*, u.name as acknowledged_by_name
    FROM alerts a
    LEFT JOIN users u ON a.acknowledged_by = u.id
    WHERE a.user_id = ?
  `;
  const params: any[] = [req.user!.id];
  
  if (status) {
    sql += ' AND a.status = ?';
    params.push(status);
  }
  
  if (severity) {
    sql += ' AND a.severity = ?';
    params.push(severity);
  }
  
  const countSql = `SELECT COUNT(*) as total FROM (${sql})`;
  const countStmt = db.prepare(countSql);
  const { total } = countStmt.get(...params) as { total: number };
  
  sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size as string), (parseInt(page as string) - 1) * parseInt(page_size as string));
  
  const stmt = db.prepare(sql);
  const alerts = stmt.all(...params).map((a: any) => ({
    ...a,
    related_data: parseJSON(a.related_data)
  }));
  
  res.json({
    success: true,
    data: {
      list: alerts,
      total,
      page: parseInt(page as string),
      page_size: parseInt(page_size as string)
    }
  });
});

router.get('/unread-count', (req: AuthRequest, res) => {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count, severity
    FROM alerts 
    WHERE user_id = ? AND status = 'pending'
    GROUP BY severity
  `);
  
  const result = stmt.all(req.user!.id);
  
  const counts: Record<string, number> = { total: 0, low: 0, medium: 0, high: 0, critical: 0 };
  
  for (const row of result as any[]) {
    counts[row.severity] = row.count;
    counts.total += row.count;
  }
  
  res.json({ success: true, data: counts });
});

router.post(
  '/:id/acknowledge',
  logOperation('alert_acknowledge', 'alerts', (req) => parseInt(req.params.id)),
  (req: AuthRequest, res) => {
    const { status = 'acknowledged', notes } = req.body;
    
    const alertStmt = db.prepare('SELECT * FROM alerts WHERE id = ? AND user_id = ?');
    const alert = alertStmt.get(req.params.id, req.user!.id) as any;
    
    if (!alert) {
      return res.status(404).json({ error: '提醒不存在' });
    }

    const validStatuses = ['acknowledged', 'confirmed', 'resolved', 'ignored'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: '无效的状态' });
    }

    if (alert.requires_confirmation && status !== 'confirmed' && status !== 'resolved') {
      return res.status(400).json({ error: '该提醒需要明确确认，请选择 confirmed 或 resolved' });
    }

    if (alert.contact_emergency && !alert.emergency_contacted_at && status === 'confirmed') {
      const emergencyContact = parseJSON(alert.related_data)?.emergency_contact;
      
      const updateStmt = db.prepare(`
        UPDATE alerts 
        SET emergency_contacted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updateStmt.run(req.params.id);
    }

    const stmt = db.prepare(`
      UPDATE alerts 
      SET status = ?, acknowledged_by = ?, acknowledged_at = CURRENT_TIMESTAMP, 
          resolution_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(status, req.user!.id, notes || null, req.params.id);

    res.json({ success: true, message: '提醒已处理' });
  }
);

router.post(
  '/:id/contact-emergency',
  logOperation('alert_emergency', 'alerts', (req) => parseInt(req.params.id)),
  (req: AuthRequest, res) => {
    const alertStmt = db.prepare('SELECT * FROM alerts WHERE id = ? AND user_id = ?');
    const alert = alertStmt.get(req.params.id, req.user!.id) as any;
    
    if (!alert) {
      return res.status(404).json({ error: '提醒不存在' });
    }

    if (alert.severity !== 'critical' && alert.severity !== 'high') {
      return res.status(400).json({ error: '只有高危或严重提醒才能联系紧急联系人' });
    }

    const userStmt = db.prepare('SELECT emergency_contact FROM users WHERE id = ?');
    const user = userStmt.get(req.user!.id) as any;
    
    if (!user?.emergency_contact) {
      return res.status(400).json({ error: '未设置紧急联系人' });
    }

    const stmt = db.prepare(`
      UPDATE alerts 
      SET contact_emergency = 1, emergency_contacted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(req.params.id);

    res.json({
      success: true,
      data: {
        message: '已通知紧急联系人',
        emergency_contact: user.emergency_contact
      }
    });
  }
);

router.get('/types', (req: AuthRequest, res) => {
  const types = [
    { type: 'heart_rate_anomaly', name: '心率异常', default_severity: 'high' },
    { type: 'overtraining', name: '过度训练', default_severity: 'high' },
    { type: 'missed_plan', name: '未完成计划', default_severity: 'low' },
    { type: 'device_disconnect', name: '设备断连', default_severity: 'medium' },
    { type: 'track_drift', name: '轨迹漂移', default_severity: 'medium' },
    { type: 'data_duplicate', name: '数据重复', default_severity: 'low' },
    { type: 'privacy_revoked', name: '隐私撤权', default_severity: 'medium' },
    { type: 'high_risk', name: '高风险提醒', default_severity: 'critical' }
  ];
  
  res.json({ success: true, data: types });
});

export default router;
