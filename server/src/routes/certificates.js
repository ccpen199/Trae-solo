import { Router } from 'express';
import { getDB } from '../db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const { holder_id, cert_type, status, keyword, page = 1, pageSize = 20 } = req.query;
    const db = getDB();
    const conditions = [];
    const params = [];

    if (holder_id) {
      conditions.push('c.holder_id = ?');
      params.push(holder_id);
    }
    if (cert_type) {
      conditions.push('c.cert_type = ?');
      params.push(cert_type);
    }
    if (status) {
      conditions.push('c.status = ?');
      params.push(status);
    }
    if (keyword) {
      conditions.push('(c.name LIKE ? OR c.code LIKE ? OR c.holder_name LIKE ? OR c.holder_id_number LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const total = db.prepare(`SELECT COUNT(*) as cnt FROM certificates c ${where}`).get(...params).cnt;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const list = db.prepare(`
      SELECT c.* FROM certificates c ${where}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize), offset);

    res.json({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = getDB();
    const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(req.params.id);
    if (!cert) {
      return res.status(404).json({ error: '证照不存在' });
    }
    res.json(cert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', roleMiddleware('admin', 'operator', 'super_admin'), (req, res) => {
  try {
    const {
      name, code, cert_type, holder_id, holder_name, holder_id_number,
      issue_department, issue_date, expire_date, file_path, status
    } = req.body;

    if (!name || !code || !cert_type || !holder_name) {
      return res.status(400).json({ error: '名称、编码、类型和持有人不能为空' });
    }

    const db = getDB();
    const result = db.prepare(`
      INSERT INTO certificates (name, code, cert_type, holder_id, holder_name, holder_id_number, issue_department, issue_date, expire_date, file_path, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, code, cert_type, holder_id || null, holder_name, holder_id_number || null,
      issue_department || null, issue_date || null, expire_date || null, file_path || null, status || 'valid');

    res.status(201).json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: '证照编码已存在' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { status } = req.body;
    const db = getDB();
    const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(req.params.id);
    if (!cert) {
      return res.status(404).json({ error: '证照不存在' });
    }

    if (status && !['valid', 'expired', 'revoked', 'replacing'].includes(status)) {
      return res.status(400).json({ error: '无效的状态值' });
    }

    db.prepare(`
      UPDATE certificates SET status = COALESCE(?, status),
        expire_date = COALESCE(?, expire_date),
        file_path = COALESCE(?, file_path)
      WHERE id = ?
    `).run(status || null, req.body.expire_date || null, req.body.file_path || null, req.params.id);

    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
