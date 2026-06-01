const express = require('express');
const db = require('../database');
const { authMiddleware, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT c.*, 
           u1.name as leader_name, 
           u2.name as teacher_name
    FROM clubs c
    LEFT JOIN users u1 ON c.leader_id = u1.id
    LEFT JOIN users u2 ON c.teacher_id = u2.id
  `;
  const params = [];
  if (status) {
    sql += ' WHERE c.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY c.created_at DESC';
  
  const clubs = db.prepare(sql).all(...params);
  res.json(clubs);
});

router.get('/my', authMiddleware, (req, res) => {
  const clubs = db.prepare(`
    SELECT c.*, cm.role as member_role,
           u1.name as leader_name, 
           u2.name as teacher_name
    FROM clubs c
    JOIN club_members cm ON c.id = cm.club_id
    LEFT JOIN users u1 ON c.leader_id = u1.id
    LEFT JOIN users u2 ON c.teacher_id = u2.id
    WHERE cm.user_id = ? AND cm.status = 'active'
    ORDER BY c.created_at DESC
  `).all(req.user.id);
  res.json(clubs);
});

router.get('/:id', authMiddleware, (req, res) => {
  const club = db.prepare(`
    SELECT c.*, 
           u1.name as leader_name, 
           u2.name as teacher_name
    FROM clubs c
    LEFT JOIN users u1 ON c.leader_id = u1.id
    LEFT JOIN users u2 ON c.teacher_id = u2.id
    WHERE c.id = ?
  `).get(req.params.id);
  
  if (!club) {
    return res.status(404).json({ error: '社团不存在' });
  }
  res.json(club);
});

router.post('/', authMiddleware, requireRoles('student', 'admin'), (req, res) => {
  const { name, description, charter, activity_direction, teacher_id } = req.body;
  
  const existing = db.prepare('SELECT id FROM clubs WHERE name = ?').get(name);
  if (existing) {
    return res.status(400).json({ error: '社团名称已存在' });
  }

  const result = db.prepare(`
    INSERT INTO clubs (name, description, charter, activity_direction, leader_id, teacher_id, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `).run(name, description, charter, activity_direction, req.user.id, teacher_id);

  db.prepare(`
    INSERT INTO club_members (club_id, user_id, role)
    VALUES (?, ?, 'leader')
  `).run(result.lastInsertRowid, req.user.id);

  db.prepare(`
    INSERT INTO funds (club_id, balance)
    VALUES (?, 0)
  `).run(result.lastInsertRowid);

  res.json({ id: result.lastInsertRowid, message: '社团创建成功，等待审批' });
});

router.put('/:id/approve', authMiddleware, requireRoles('admin'), (req, res) => {
  const { status, note } = req.body;
  
  const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(req.params.id);
  if (!club) {
    return res.status(404).json({ error: '社团不存在' });
  }

  db.prepare(`
    UPDATE clubs 
    SET status = ?, approved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, req.params.id);

  res.json({ message: status === 'approved' ? '社团审批通过' : '社团审批未通过' });
});

router.get('/:id/members', authMiddleware, (req, res) => {
  const members = db.prepare(`
    SELECT cm.*, u.name, u.student_id, u.phone, u.email
    FROM club_members cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.club_id = ? AND cm.status = 'active'
    ORDER BY cm.role DESC, cm.join_date
  `).all(req.params.id);
  res.json(members);
});

router.post('/:id/members/:userId/remove', authMiddleware, (req, res) => {
  const clubId = req.params.id;
  const userId = req.params.userId;
  
  const isLeader = db.prepare(`
    SELECT 1 FROM club_members 
    WHERE club_id = ? AND user_id = ? AND role = 'leader'
  `).get(clubId, req.user.id);
  
  const isAdmin = req.user.role === 'admin';
  
  if (!isLeader && !isAdmin) {
    return res.status(403).json({ error: '权限不足' });
  }

  db.prepare(`
    UPDATE club_members 
    SET status = 'left', leave_date = CURRENT_TIMESTAMP
    WHERE club_id = ? AND user_id = ?
  `).run(clubId, userId);

  db.prepare(`
    UPDATE clubs SET member_count = member_count - 1 WHERE id = ?
  `).run(clubId);

  db.prepare(`
    INSERT INTO member_history (club_id, user_id, action, operator_id)
    VALUES (?, ?, 'remove', ?)
  `).run(clubId, userId, req.user.id);

  res.json({ message: '成员已移除' });
});

router.post('/:id/change-leader', authMiddleware, requireRoles('admin'), (req, res) => {
  const { new_leader_id } = req.body;
  const clubId = req.params.id;
  
  const club = db.prepare('SELECT leader_id FROM clubs WHERE id = ?').get(clubId);
  if (!club) {
    return res.status(404).json({ error: '社团不存在' });
  }

  db.prepare(`
    UPDATE club_members SET role = 'member' WHERE club_id = ? AND role = 'leader'
  `).run(clubId);

  db.prepare(`
    UPDATE club_members SET role = 'leader' WHERE club_id = ? AND user_id = ?
  `).run(clubId, new_leader_id);

  db.prepare(`
    UPDATE clubs SET leader_id = ? WHERE id = ?
  `).run(new_leader_id, clubId);

  db.prepare(`
    INSERT INTO member_history (club_id, user_id, action, old_role, new_role, operator_id)
    VALUES (?, ?, 'change_leader', 'member', 'leader', ?)
  `).run(clubId, new_leader_id, req.user.id);

  res.json({ message: '负责人更换成功' });
});

router.get('/:id/history', authMiddleware, (req, res) => {
  const history = db.prepare(`
    SELECT mh.*, u.name as user_name, op.name as operator_name
    FROM member_history mh
    JOIN users u ON mh.user_id = u.id
    LEFT JOIN users op ON mh.operator_id = op.id
    WHERE mh.club_id = ?
    ORDER BY mh.created_at DESC
  `).all(req.params.id);
  res.json(history);
});

router.post('/:id/annual-review', authMiddleware, (req, res) => {
  const { year, report } = req.body;
  const clubId = req.params.id;

  const existing = db.prepare(`
    SELECT id FROM annual_reviews WHERE club_id = ? AND year = ?
  `).get(clubId, year);
  
  if (existing) {
    return res.status(400).json({ error: '该年度年审已提交' });
  }

  db.prepare(`
    INSERT INTO annual_reviews (club_id, year, report)
    VALUES (?, ?, ?)
  `).run(clubId, year, report);

  res.json({ message: '年审提交成功' });
});

router.get('/:id/annual-reviews', authMiddleware, (req, res) => {
  const reviews = db.prepare(`
    SELECT ar.*, u.name as reviewer_name
    FROM annual_reviews ar
    LEFT JOIN users u ON ar.reviewer_id = u.id
    WHERE ar.club_id = ?
    ORDER BY ar.year DESC
  `).all(req.params.id);
  res.json(reviews);
});

router.put('/annual-reviews/:id/review', authMiddleware, requireRoles('admin'), (req, res) => {
  const { status, review_note } = req.body;
  const reviewId = req.params.id;

  const review = db.prepare('SELECT * FROM annual_reviews WHERE id = ?').get(reviewId);
  if (!review) {
    return res.status(404).json({ error: '年审记录不存在' });
  }

  db.prepare(`
    UPDATE annual_reviews 
    SET status = ?, review_note = ?, reviewer_id = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, review_note, req.user.id, reviewId);

  db.prepare(`
    UPDATE clubs SET annual_review_passed = ? WHERE id = ?
  `).run(status === 'passed' ? 1 : 0, review.club_id);

  res.json({ message: status === 'passed' ? '年审通过' : '年审未通过' });
});

module.exports = router;
