const express = require('express');
const { db } = require('../database/init');
const { authenticate, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', (req, res) => {
  const user = req.user;
  let feedbacks = [];

  if (user.role === 'guardian') {
    feedbacks = db.prepare(`
      SELECT f.*, u.name as author_name, a.name as assigned_name
      FROM feedbacks f
      JOIN users u ON f.author_id = u.id
      LEFT JOIN users a ON f.assigned_to = a.id
      WHERE f.author_id = ?
      ORDER BY f.created_at DESC
    `).all(user.id);
  } else if (user.role === 'teacher') {
    feedbacks = db.prepare(`
      SELECT f.*, u.name as author_name, a.name as assigned_name
      FROM feedbacks f
      JOIN users u ON f.author_id = u.id
      LEFT JOIN users a ON f.assigned_to = a.id
      WHERE f.assigned_to = ? OR f.escalated_to = ?
      ORDER BY f.created_at DESC
    `).all(user.id, user.id);
  } else if (user.role === 'admin') {
    feedbacks = db.prepare(`
      SELECT f.*, u.name as author_name, a.name as assigned_name, e.name as escalated_name
      FROM feedbacks f
      JOIN users u ON f.author_id = u.id
      LEFT JOIN users a ON f.assigned_to = a.id
      LEFT JOIN users e ON f.escalated_to = e.id
      ORDER BY f.created_at DESC
    `).all();
  }

  for (const f of feedbacks) {
    f.reply_count = db.prepare('SELECT COUNT(*) as count FROM feedback_replies WHERE feedback_id = ?').get(f.id).count;
  }

  res.json(feedbacks);
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const user = req.user;

  let feedback;
  if (user.role === 'guardian') {
    feedback = db.prepare(`
      SELECT f.*, u.name as author_name, a.name as assigned_name
      FROM feedbacks f
      JOIN users u ON f.author_id = u.id
      LEFT JOIN users a ON f.assigned_to = a.id
      WHERE f.id = ? AND f.author_id = ?
    `).get(id, user.id);
  } else {
    feedback = db.prepare(`
      SELECT f.*, u.name as author_name, u.phone as author_phone,
        a.name as assigned_name, e.name as escalated_name
      FROM feedbacks f
      JOIN users u ON f.author_id = u.id
      LEFT JOIN users a ON f.assigned_to = a.id
      LEFT JOIN users e ON f.escalated_to = e.id
      WHERE f.id = ?
    `).get(id);
  }

  if (!feedback) {
    return res.status(404).json({ error: '反馈不存在' });
  }

  feedback.replies = db.prepare(`
    SELECT r.*, u.name as author_name, u.role as author_role
    FROM feedback_replies r
    JOIN users u ON r.author_id = u.id
    WHERE r.feedback_id = ?
    ORDER BY r.created_at ASC
  `).all(id);

  res.json(feedback);
});

router.post('/', (req, res) => {
  const { title, content, category, priority } = req.body;
  const user = req.user;

  if (!title || !content || !category) {
    return res.status(400).json({ error: '标题、内容和分类不能为空' });
  }

  let assignedTo = null;
  if (user.role === 'guardian') {
    const classTeacher = db.prepare(`
      SELECT DISTINCT c.head_teacher_id
      FROM guardians g
      JOIN students s ON g.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      WHERE g.user_id = ?
      LIMIT 1
    `).get(user.id);
    assignedTo = classTeacher ? classTeacher.head_teacher_id : null;
  }

  const result = db.prepare(`
    INSERT INTO feedbacks (title, content, author_id, category, priority, status, assigned_to)
    VALUES (?, ?, ?, ?, ?, 'open', ?)
  `).run(title, content, user.id, category, priority || 'normal', assignedTo);

  if (assignedTo) {
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, content, related_type, related_id)
      VALUES (?, 'feedback', ?, ?, 'feedback', ?)
    `).run(assignedTo, '新的家长反馈', `收到新的反馈：${title}`, result.lastInsertRowid);
  }

  res.json({ id: result.lastInsertRowid, message: '反馈已提交' });
});

router.post('/:id/reply', (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const user = req.user;

  if (!content) {
    return res.status(400).json({ error: '回复内容不能为空' });
  }

  const feedback = db.prepare('SELECT * FROM feedbacks WHERE id = ?').get(id);
  if (!feedback) {
    return res.status(404).json({ error: '反馈不存在' });
  }

  if (user.role === 'guardian' && feedback.author_id !== user.id) {
    return res.status(403).json({ error: '无权限回复此反馈' });
  }

  db.prepare(`
    INSERT INTO feedback_replies (feedback_id, author_id, content)
    VALUES (?, ?, ?)
  `).run(id, user.id, content);

  db.prepare(`
    UPDATE feedbacks SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(id);

  const notifyUserId = user.id === feedback.author_id 
    ? (feedback.escalated_to || feedback.assigned_to)
    : feedback.author_id;

  if (notifyUserId) {
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, content, related_type, related_id)
      VALUES (?, 'feedback_reply', ?, ?, 'feedback', ?)
    `).run(notifyUserId, '反馈有新回复', `反馈"${feedback.title}"有新的回复`, id);
  }

  res.json({ message: '回复成功' });
});

router.post('/:id/escalate', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const user = req.user;

  const feedback = db.prepare('SELECT * FROM feedbacks WHERE id = ?').get(id);
  if (!feedback) {
    return res.status(404).json({ error: '反馈不存在' });
  }

  const canEscalate = 
    (user.role === 'teacher' && feedback.assigned_to === user.id) ||
    (user.role === 'guardian' && feedback.author_id === user.id);

  if (!canEscalate) {
    return res.status(403).json({ error: '无权限升级此反馈' });
  }

  if (feedback.escalated) {
    return res.status(400).json({ error: '反馈已升级' });
  }

  const admin = db.prepare(`
    SELECT id FROM users 
    WHERE role = 'admin' AND school_id = (SELECT school_id FROM users WHERE id = ?)
    LIMIT 1
  `).get(user.id);

  if (!admin) {
    return res.status(500).json({ error: '找不到管理员' });
  }

  db.prepare(`
    UPDATE feedbacks 
    SET escalated = 1, escalated_to = ?, escalated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(admin.id, id);

  db.prepare(`
    INSERT INTO notifications (user_id, type, title, content, related_type, related_id)
    VALUES (?, 'feedback_escalated', ?, ?, 'feedback', ?)
  `).run(admin.id, '反馈已升级', `反馈"${feedback.title}"已升级，请处理：${reason || ''}`, id);

  res.json({ message: '反馈已升级给学校管理员' });
});

router.put('/:id/status', requireRoles('teacher', 'admin'), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const feedback = db.prepare('SELECT * FROM feedbacks WHERE id = ?').get(id);
  if (!feedback) {
    return res.status(404).json({ error: '反馈不存在' });
  }

  db.prepare(`
    UPDATE feedbacks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(status, id);

  db.prepare(`
    INSERT INTO notifications (user_id, type, title, content, related_type, related_id)
    VALUES (?, 'feedback_status', ?, ?, 'feedback', ?)
  `).run(feedback.author_id, '反馈状态更新', `您的反馈"${feedback.title}"状态已更新为${status}`, id);

  res.json({ message: '状态已更新' });
});

module.exports = router;
