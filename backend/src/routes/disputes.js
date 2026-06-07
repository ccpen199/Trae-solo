import { Router } from 'express';
import { getDb } from '../db/init.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const status = req.query.status || '';
    const userId = req.query.userId || '';
    const offset = (page - 1) * pageSize;

    let where = 'WHERE 1=1';
    const params = [];

    if (status) {
      where += ' AND d.status = ?';
      params.push(status);
    }
    if (userId) {
      where += ' AND d.user_id = ?';
      params.push(userId);
    }

    const total = db.prepare(`SELECT COUNT(*) AS count FROM disputes d ${where}`).get(...params).count;
    const list = db.prepare(`
      SELECT d.*, u.username, u.real_name, e.type AS exception_type
      FROM disputes d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN exception_events e ON d.exception_event_id = e.id
      ${where}
      ORDER BY d.id DESC LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    res.json({ list, total, page, pageSize });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const dispute = db.prepare(`
      SELECT d.*, u.username, u.real_name, u.phone, e.type AS exception_type, e.description AS exception_description, e.status AS exception_status
      FROM disputes d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN exception_events e ON d.exception_event_id = e.id
      WHERE d.id = ?
    `).get(req.params.id);
    if (!dispute) {
      return res.status(404).json({ error: '申诉不存在' });
    }

    let evidenceUrls = [];
    if (dispute.evidence_urls) {
      try {
        evidenceUrls = JSON.parse(dispute.evidence_urls);
      } catch {
        evidenceUrls = [];
      }
    }

    res.json({ ...dispute, evidence_urls_parsed: evidenceUrls });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { exception_event_id, description, evidence_urls } = req.body;

    if (!description) {
      return res.status(400).json({ error: '申诉描述不能为空' });
    }

    const evidenceStr = evidence_urls ? JSON.stringify(evidence_urls) : null;

    const result = db.prepare(`
      INSERT INTO disputes (user_id, exception_event_id, description, evidence_urls)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, exception_event_id || null, description, evidenceStr);

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'create_dispute', 'dispute', result.lastInsertRowid, JSON.stringify({ exception_event_id }), req.ip);

    res.status(201).json({ id: result.lastInsertRowid, message: '申诉提交成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(req.params.id);
    if (!dispute) {
      return res.status(404).json({ error: '申诉不存在' });
    }

    const { status, result: disputeResult } = req.body;
    db.prepare(`
      UPDATE disputes SET status = ?, result = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      status !== undefined ? status : dispute.status,
      disputeResult !== undefined ? disputeResult : dispute.result,
      req.params.id
    );

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'update_dispute', 'dispute', parseInt(req.params.id), JSON.stringify(req.body), req.ip);

    res.json({ message: '申诉更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
