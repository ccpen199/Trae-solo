import { Router } from 'express';
import { getDB } from '../db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const { case_id, user_id, min_rating, max_rating, page = 1, pageSize = 20 } = req.query;
    const db = getDB();
    const conditions = [];
    const params = [];

    if (case_id) {
      conditions.push('e.case_id = ?');
      params.push(case_id);
    }
    if (user_id) {
      conditions.push('e.user_id = ?');
      params.push(user_id);
    }
    if (min_rating) {
      conditions.push('e.rating >= ?');
      params.push(parseInt(min_rating));
    }
    if (max_rating) {
      conditions.push('e.rating <= ?');
      params.push(parseInt(max_rating));
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const total = db.prepare(`SELECT COUNT(*) as cnt FROM evaluations e ${where}`).get(...params).cnt;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const list = db.prepare(`
      SELECT e.*, c.case_no, si.name as item_name
      FROM evaluations e
      LEFT JOIN cases c ON e.case_id = c.id
      LEFT JOIN service_items si ON c.item_id = si.id
      ${where}
      ORDER BY e.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize), offset);

    res.json({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { case_id, rating, speed_score, attitude_score, quality_score, content, is_anonymous } = req.body;

    if (!case_id || !rating) {
      return res.status(400).json({ error: '案件ID和评分不能为空' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: '评分须在1-5之间' });
    }

    const db = getDB();
    const caseData = db.prepare('SELECT * FROM cases WHERE id = ?').get(case_id);
    if (!caseData) {
      return res.status(404).json({ error: '办件不存在' });
    }

    if (caseData.status !== 'completed' && caseData.status !== 'archived') {
      return res.status(400).json({ error: '只有已办结的案件可以评价' });
    }

    const existing = db.prepare('SELECT id FROM evaluations WHERE case_id = ? AND user_id = ?').get(case_id, req.user.id);
    if (existing) {
      return res.status(409).json({ error: '已评价过该办件' });
    }

    const result = db.prepare(`
      INSERT INTO evaluations (case_id, user_id, rating, speed_score, attitude_score, quality_score, content, is_anonymous)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(case_id, req.user.id, rating,
      speed_score || null, attitude_score || null, quality_score || null,
      content || null, is_anonymous || 0);

    res.status(201).json({ id: result.lastInsertRowid, message: '评价提交成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/reply', roleMiddleware('admin', 'super_admin'), (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply) {
      return res.status(400).json({ error: '回复内容不能为空' });
    }

    const db = getDB();
    const evaluation = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ error: '评价不存在' });
    }

    db.prepare(`
      UPDATE evaluations SET reply = ?, replied_at = datetime('now','localtime') WHERE id = ?
    `).run(reply, req.params.id);

    res.json({ message: '回复成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
