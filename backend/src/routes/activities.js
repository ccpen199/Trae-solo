const express = require('express');
const db = require('../database');
const { authMiddleware, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const { club_id, status } = req.query;
  let sql = `
    SELECT a.*, c.name as club_name, u.name as approver_name
    FROM activities a
    JOIN clubs c ON a.club_id = c.id
    LEFT JOIN users u ON a.approver_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (club_id) {
    sql += ' AND a.club_id = ?';
    params.push(club_id);
  }
  if (status) {
    sql += ' AND a.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY a.created_at DESC';
  
  const activities = db.prepare(sql).all(...params);
  res.json(activities);
});

router.get('/:id', authMiddleware, (req, res) => {
  const activity = db.prepare(`
    SELECT a.*, c.name as club_name, u.name as approver_name
    FROM activities a
    JOIN clubs c ON a.club_id = c.id
    LEFT JOIN users u ON a.approver_id = u.id
    WHERE a.id = ?
  `).get(req.params.id);
  
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }
  res.json(activity);
});

router.post('/', authMiddleware, (req, res) => {
  const { club_id, title, description, plan, location, start_time, end_time, budget, needs_approval } = req.body;
  
  const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(club_id);
  if (!club) {
    return res.status(404).json({ error: '社团不存在' });
  }
  
  if (!club.annual_review_passed) {
    return res.status(400).json({ error: '社团年审未通过，无法发布活动' });
  }
  
  const isLeader = db.prepare(`
    SELECT 1 FROM club_members 
    WHERE club_id = ? AND user_id = ? AND role = 'leader'
  `).get(club_id, req.user.id);
  
  const isAdmin = req.user.role === 'admin';
  
  if (!isLeader && !isAdmin) {
    return res.status(403).json({ error: '只有社团负责人可以创建活动' });
  }

  const status = needs_approval ? 'pending' : 'approved';

  const result = db.prepare(`
    INSERT INTO activities (club_id, title, description, plan, location, start_time, end_time, budget, needs_approval, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(club_id, title, description, plan, location, start_time, end_time, budget, needs_approval ? 1 : 0, status);

  res.json({ 
    id: result.lastInsertRowid, 
    message: needs_approval ? '活动已提交审批' : '活动创建成功' 
  });
});

router.put('/:id/approve', authMiddleware, requireRoles('teacher', 'admin'), (req, res) => {
  const { status, approval_note } = req.body;
  const activityId = req.params.id;
  
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(activityId);
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }

  db.prepare(`
    UPDATE activities 
    SET status = ?, approval_note = ?, approver_id = ?
    WHERE id = ?
  `).run(status, approval_note, req.user.id, activityId);

  res.json({ 
    message: status === 'approved' ? '活动审批通过' : '活动审批未通过' 
  });
});

router.put('/:id/status', authMiddleware, (req, res) => {
  const { status, summary, photos, actual_cost } = req.body;
  const activityId = req.params.id;
  
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(activityId);
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }
  
  const isLeader = db.prepare(`
    SELECT 1 FROM club_members 
    WHERE club_id = ? AND user_id = ? AND role = 'leader'
  `).get(activity.club_id, req.user.id);
  
  const isAdmin = req.user.role === 'admin';
  
  if (!isLeader && !isAdmin) {
    return res.status(403).json({ error: '权限不足' });
  }

  db.prepare(`
    UPDATE activities 
    SET status = ?, summary = ?, photos = ?, actual_cost = ?
    WHERE id = ?
  `).run(status, summary, photos, actual_cost, activityId);

  res.json({ message: '活动状态更新成功' });
});

router.post('/:id/signin', authMiddleware, (req, res) => {
  const activityId = req.params.id;
  
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(activityId);
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }
  
  if (activity.status !== 'ongoing') {
    return res.status(400).json({ error: '活动未开始' });
  }

  try {
    db.prepare(`
      INSERT INTO activity_signins (activity_id, user_id)
      VALUES (?, ?)
    `).run(activityId, req.user.id);
    
    res.json({ message: '签到成功' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: '您已经签到过了' });
    }
    throw err;
  }
});

router.get('/:id/signins', authMiddleware, (req, res) => {
  const signins = db.prepare(`
    SELECT as_.*, u.name, u.student_id
    FROM activity_signins as_
    JOIN users u ON as_.user_id = u.id
    WHERE as_.activity_id = ?
    ORDER BY as_.signin_time
  `).all(req.params.id);
  res.json(signins);
});

router.get('/my', authMiddleware, (req, res) => {
  const activities = db.prepare(`
    SELECT a.*, c.name as club_name
    FROM activities a
    JOIN clubs c ON a.club_id = c.id
    JOIN club_members cm ON c.id = cm.club_id
    WHERE cm.user_id = ? AND cm.status = 'active'
    ORDER BY a.created_at DESC
  `).all(req.user.id);
  res.json(activities);
});

module.exports = router;
