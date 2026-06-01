const express = require('express');
const db = require('../database');
const { authMiddleware, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', authMiddleware, (req, res) => {
  const clubCount = db.prepare('SELECT COUNT(*) as count FROM clubs WHERE status = ?').get('approved').count;
  const pendingClubs = db.prepare('SELECT COUNT(*) as count FROM clubs WHERE status = ?').get('pending').count;
  const studentCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('student').count;
  const activityCount = db.prepare('SELECT COUNT(*) as count FROM activities WHERE status = ?').get('approved').count;
  
  res.json({
    clubCount,
    pendingClubs,
    studentCount,
    activityCount
  });
});

router.get('/members-by-club', authMiddleware, (req, res) => {
  const stats = db.prepare(`
    SELECT c.id, c.name, c.member_count, c.max_members
    FROM clubs c
    WHERE c.status = 'approved'
    ORDER BY c.member_count DESC
  `).all();
  res.json(stats);
});

router.get('/activities-by-club', authMiddleware, (req, res) => {
  const stats = db.prepare(`
    SELECT c.id, c.name, COUNT(a.id) as activity_count
    FROM clubs c
    LEFT JOIN activities a ON c.id = a.club_id AND a.status = 'completed'
    WHERE c.status = 'approved'
    GROUP BY c.id
    ORDER BY activity_count DESC
  `).all();
  res.json(stats);
});

router.get('/funds-overview', authMiddleware, requireRoles('admin'), (req, res) => {
  const stats = db.prepare(`
    SELECT c.id, c.name, f.balance, f.total_income, f.total_expense
    FROM clubs c
    JOIN funds f ON c.id = f.club_id
    WHERE c.status = 'approved'
    ORDER BY f.balance DESC
  `).all();
  res.json(stats);
});

router.get('/my-stats', authMiddleware, (req, res) => {
  const myClubs = db.prepare(`
    SELECT COUNT(*) as count FROM club_members 
    WHERE user_id = ? AND status = 'active'
  `).get(req.user.id).count;
  
  const myActivities = db.prepare(`
    SELECT COUNT(DISTINCT a.id) as count 
    FROM activity_signins as_
    JOIN activities a ON as_.activity_id = a.id
    WHERE as_.user_id = ?
  `).get(req.user.id).count;
  
  const myApplications = db.prepare(`
    SELECT COUNT(*) as count FROM recruitment_applications 
    WHERE user_id = ?
  `).get(req.user.id).count;
  
  res.json({
    myClubs,
    myActivities,
    myApplications
  });
});

router.get('/users', authMiddleware, requireRoles('admin'), (req, res) => {
  const users = db.prepare(`
    SELECT id, username, name, role, student_id, phone, email, created_at
    FROM users
    ORDER BY created_at DESC
  `).all();
  res.json(users);
});

router.get('/teachers', authMiddleware, (req, res) => {
  const teachers = db.prepare(`
    SELECT id, name, email
    FROM users
    WHERE role = 'teacher'
    ORDER BY name
  `).all();
  res.json(teachers);
});

module.exports = router;
