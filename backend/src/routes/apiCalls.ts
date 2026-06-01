import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);
  
  const calls = db.prepare(`
    SELECT ac.*, dc.title as catalog_title, d.name as caller_department_name
    FROM api_calls ac
    LEFT JOIN data_catalogs dc ON ac.catalog_id = dc.id
    LEFT JOIN departments d ON ac.caller_department_id = d.id
    ORDER BY ac.call_time DESC
    LIMIT ? OFFSET ?
  `).all(parseInt(pageSize as string), offset);
  
  const total = db.prepare('SELECT COUNT(*) as count FROM api_calls').get() as { count: number };
  
  res.json({ data: calls, total: total.count, page: parseInt(page as string), pageSize: parseInt(pageSize as string) });
});

router.post('/', (req, res) => {
  const { catalog_id, caller_department_id, application_id, data_count, status, error_message } = req.body;
  
  let isAuthorized = true;
  let isExpired = false;
  
  if (application_id) {
    const application = db.prepare(`
      SELECT * FROM access_applications
      WHERE id = ? AND status = 'approved'
    `).get(application_id);
    
    if (!application) {
      isAuthorized = false;
    } else {
      const app = application as any;
      const today = new Date().toISOString().split('T')[0];
      if (app.end_date < today) {
        isExpired = true;
        isAuthorized = false;
      }
    }
  }
  
  const is_alert = !isAuthorized || status !== 'success' ? 1 : 0;
  
  try {
    const result = db.prepare(`
      INSERT INTO api_calls (catalog_id, caller_department_id, application_id, data_count, status, error_message, is_alert)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(catalog_id, caller_department_id, application_id, data_count, status, error_message, is_alert);
    
    const callId = result.lastInsertRowid as number;
    
    if (!isAuthorized) {
      db.prepare(`
        INSERT INTO security_alerts (type, api_call_id, description, severity)
        VALUES (?, ?, ?, ?)
      `).run(
        isExpired ? 'authorization_expired' : 'unauthorized_access',
        callId,
        isExpired ? '授权已过期' : '未授权调用接口',
        'high'
      );
    } else if (status !== 'success') {
      db.prepare(`
        INSERT INTO security_alerts (type, api_call_id, description, severity)
        VALUES (?, ?, ?, ?)
      `).run('api_failure', callId, error_message || '接口调用失败', 'medium');
    }
    
    res.json({ id: callId, is_authorized: isAuthorized, message: isAuthorized ? '调用记录已保存' : '未授权调用已记录' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/alerts', (req, res) => {
  const alerts = db.prepare(`
    SELECT sa.*, ac.call_time, dc.title as catalog_title, d.name as caller_department_name
    FROM security_alerts sa
    LEFT JOIN api_calls ac ON sa.api_call_id = ac.id
    LEFT JOIN data_catalogs dc ON ac.catalog_id = dc.id
    LEFT JOIN departments d ON ac.caller_department_id = d.id
    ORDER BY sa.created_at DESC
  `).all();
  res.json(alerts);
});

router.post('/alerts/:id/handle', (req, res) => {
  const { id } = req.params;
  const { handled_by } = req.body;
  
  try {
    db.prepare(`
      UPDATE security_alerts
      SET status = 'handled', handled_by = ?, handled_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(handled_by, id);
    
    res.json({ message: '告警已处理' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
