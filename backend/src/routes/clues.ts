import express from 'express';
import db from '../database';
import { authenticateToken, AuthRequest, requireSecurityLevel } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

function generateClueNo(): string {
  const date = new Date();
  const prefix = `XS${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const count = db.prepare('SELECT COUNT(*) as count FROM clues WHERE clue_no LIKE ?').get(`${prefix}%`) as any;
  return `${prefix}${String(count.count + 1).padStart(4, '0')}`;
}

router.get('/', (req: AuthRequest, res) => {
  const userLevel = req.user?.security_level || 1;
  const { status, category, keyword } = req.query;
  
  let sql = `
    SELECT c.*, u.real_name as creator_name,
           r.review_opinion, r.is_duplicate,
           d.responsible_unit, d.deadline, d.status as dispatch_status
    FROM clues c
    LEFT JOIN users u ON c.creator_id = u.id
    LEFT JOIN clue_reviews r ON c.id = r.clue_id
    LEFT JOIN dispatches d ON c.id = d.clue_id
    WHERE c.security_level <= ?
  `;
  const params: any[] = [userLevel];

  if (status) {
    sql += ' AND c.status = ?';
    params.push(status);
  }
  if (category) {
    sql += ' AND c.category = ?';
    params.push(category);
  }
  if (keyword) {
    sql += ' AND (c.title LIKE ? OR c.description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  sql += ' ORDER BY c.created_at DESC';
  
  const clues = db.prepare(sql).all(...params);
  res.json(clues);
});

router.get('/check-duplicate', (req: AuthRequest, res) => {
  const { title, involved_persons, location } = req.query;
  
  const sql = `
    SELECT id, clue_no, title, created_at
    FROM clues
    WHERE title LIKE ? OR involved_persons LIKE ? OR location LIKE ?
    LIMIT 5
  `;
  
  const duplicates = db.prepare(sql).all(
    `%${title}%`,
    `%${involved_persons}%`,
    `%${location}%`
  );
  
  res.json({ duplicates, count: duplicates.length });
});

router.get('/:id', (req: AuthRequest, res, next) => {
  const clue = db.prepare('SELECT * FROM clues WHERE id = ?').get(req.params.id) as any;
  
  if (!clue) {
    return res.status(404).json({ error: '线索不存在' });
  }
  
  if (req.user && clue.security_level > req.user.security_level) {
    return res.status(403).json({ error: '保密等级不足，无法访问此线索' });
  }
  
  next();
}, (req: AuthRequest, res) => {
  const clue = db.prepare(`
    SELECT c.*, u.real_name as creator_name
    FROM clues c
    LEFT JOIN users u ON c.creator_id = u.id
    WHERE c.id = ?
  `).get(req.params.id);

  const review = db.prepare(`
    SELECT r.*, u.real_name as reviewer_name
    FROM clue_reviews r
    LEFT JOIN users u ON r.reviewer_id = u.id
    WHERE r.clue_id = ?
    ORDER BY r.reviewed_at DESC LIMIT 1
  `).get(req.params.id);

  const dispatch = db.prepare(`
    SELECT d.*, u.real_name as dispatcher_name
    FROM dispatches d
    LEFT JOIN users u ON d.dispatcher_id = u.id
    WHERE d.clue_id = ?
    ORDER BY d.created_at DESC LIMIT 1
  `).get(req.params.id);

  let feedback = null;
  if (dispatch) {
    feedback = db.prepare(`
      SELECT f.*, u.real_name as feedbacker_name
      FROM feedbacks f
      LEFT JOIN users u ON f.feedbacker_id = u.id
      WHERE f.dispatch_id = ?
      ORDER BY f.created_at DESC LIMIT 1
    `).get((dispatch as any).id);
  }

  res.json({ clue, review, dispatch, feedback });
});

router.post('/', (req: AuthRequest, res) => {
  const {
    source_channel, title, description, involved_persons,
    location, occur_time, security_level, category, attachments
  } = req.body;

  if (!source_channel || !title) {
    return res.status(400).json({ error: '来源渠道和标题不能为空' });
  }

  const clue_no = generateClueNo();
  const result = db.prepare(`
    INSERT INTO clues (
      clue_no, source_channel, title, description, involved_persons,
      location, occur_time, security_level, category, attachments, creator_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    clue_no, source_channel, title, description, involved_persons,
    location, occur_time, security_level || 1, category,
    JSON.stringify(attachments || []), req.user?.id
  );

  res.json({ id: result.lastInsertRowid, clue_no });
});

router.post('/:id/review', (req: AuthRequest, res) => {
  const { related_case, historical_clues, risk_tags, review_opinion, evidence, is_duplicate, duplicate_clue_id } = req.body;

  db.prepare(`
    INSERT INTO clue_reviews (
      clue_id, related_case, historical_clues, risk_tags, review_opinion,
      evidence, reviewer_id, is_duplicate, duplicate_clue_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.params.id, related_case, JSON.stringify(historical_clues || []),
    JSON.stringify(risk_tags || []), review_opinion,
    JSON.stringify(evidence || []), req.user?.id, is_duplicate ? 1 : 0, duplicate_clue_id
  );

  const newStatus = is_duplicate ? 'duplicate' : 'reviewed';
  db.prepare('UPDATE clues SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, req.params.id);

  res.json({ success: true });
});

router.post('/:id/dispatch', (req: AuthRequest, res) => {
  const { responsible_unit, deadline, feedback_requirements, co_units } = req.body;

  if (!responsible_unit || !deadline) {
    return res.status(400).json({ error: '责任单位和办理时限不能为空' });
  }

  db.prepare(`
    INSERT INTO dispatches (
      clue_id, responsible_unit, deadline, feedback_requirements, co_units, dispatcher_id
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    req.params.id, responsible_unit, deadline, feedback_requirements,
    JSON.stringify(co_units || []), req.user?.id
  );

  db.prepare('UPDATE clues SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('dispatched', req.params.id);

  res.json({ success: true });
});

router.post('/:id/feedback', (req: AuthRequest, res) => {
  const dispatch = db.prepare('SELECT * FROM dispatches WHERE clue_id = ? ORDER BY id DESC LIMIT 1').get(req.params.id) as any;
  
  if (!dispatch) {
    return res.status(400).json({ error: '该线索尚未派发' });
  }

  const { check_result, measures_taken, evidence_attachments, closing_opinion, is_returned, return_reason } = req.body;

  db.prepare(`
    INSERT INTO feedbacks (
      dispatch_id, check_result, measures_taken, evidence_attachments,
      closing_opinion, is_returned, return_reason, feedbacker_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    dispatch.id, check_result, measures_taken,
    JSON.stringify(evidence_attachments || []), closing_opinion,
    is_returned ? 1 : 0, return_reason, req.user?.id
  );

  const newStatus = is_returned ? 'returned' : 'completed';
  db.prepare('UPDATE clues SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, req.params.id);

  res.json({ success: true });
});

router.get('/:id/history', (req: AuthRequest, res) => {
  const clue = db.prepare('SELECT * FROM clues WHERE id = ?').get(req.params.id) as any;
  if (!clue) {
    return res.status(404).json({ error: '线索不存在' });
  }

  const history = db.prepare(`
    SELECT 
      '创建' as action, created_at as time, 
      (SELECT real_name FROM users WHERE id = creator_id) as operator,
      description as content
    FROM clues WHERE id = ?
    UNION ALL
    SELECT 
      '研判' as action, reviewed_at as time,
      (SELECT real_name FROM users WHERE id = reviewer_id) as operator,
      review_opinion as content
    FROM clue_reviews WHERE clue_id = ?
    UNION ALL
    SELECT 
      '派发' as action, created_at as time,
      (SELECT real_name FROM users WHERE id = dispatcher_id) as operator,
      responsible_unit as content
    FROM dispatches WHERE clue_id = ?
    UNION ALL
    SELECT 
      '反馈' as action, f.created_at as time,
      (SELECT real_name FROM users WHERE id = f.feedbacker_id) as operator,
      CASE WHEN f.is_returned = 1 THEN '退回补充: ' || f.return_reason ELSE f.closing_opinion END as content
    FROM feedbacks f
    JOIN dispatches d ON f.dispatch_id = d.id
    WHERE d.clue_id = ?
    ORDER BY time
  `).all(req.params.id, req.params.id, req.params.id, req.params.id);

  res.json(history);
});

export default router;
