const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/participation/:planId', authenticateToken, (req, res) => {
  const planId = req.params.planId;

  const memberStats = db.prepare(`
    SELECT 
      u.id,
      u.name,
      pm.role,
      pm.joined_at,
      (SELECT COUNT(*) FROM reading_progress rp WHERE rp.plan_id = pm.plan_id AND rp.user_id = u.id AND rp.status = 'completed') as completed_chapters,
      (SELECT COUNT(*) FROM notes n WHERE n.plan_id = pm.plan_id AND n.user_id = u.id) as note_count,
      (SELECT COUNT(*) FROM check_ins ci WHERE ci.plan_id = pm.plan_id AND ci.user_id = u.id) as checkin_count,
      (SELECT COUNT(*) FROM discussion_topics dt WHERE dt.plan_id = pm.plan_id AND dt.author_id = u.id) as topic_count,
      (SELECT COUNT(*) FROM discussion_comments dc JOIN discussion_topics dt ON dc.topic_id = dt.id WHERE dt.plan_id = pm.plan_id AND dc.author_id = u.id) as comment_count,
      (SELECT COUNT(*) FROM activity_attendees aa JOIN activities a ON aa.activity_id = a.id WHERE a.plan_id = pm.plan_id AND aa.user_id = u.id) as activity_count
    FROM plan_members pm
    JOIN users u ON pm.user_id = u.id
    WHERE pm.plan_id = ?
    ORDER BY (completed_chapters + note_count + checkin_count + topic_count + comment_count) DESC
  `).all(planId);

  const totalChapters = db.prepare('SELECT COUNT(*) as count FROM chapters WHERE plan_id = ?').get(planId).count;

  res.json({ member_stats: memberStats, total_chapters: totalChapters });
});

router.get('/chapter-progress/:planId', authenticateToken, (req, res) => {
  const planId = req.params.planId;

  const chapterStats = db.prepare(`
    SELECT 
      c.id,
      c.chapter_number,
      c.title,
      c.scheduled_date,
      (SELECT COUNT(*) FROM reading_progress rp WHERE rp.chapter_id = c.id AND rp.status = 'completed') as completed_count,
      (SELECT COUNT(*) FROM plan_members pm WHERE pm.plan_id = c.plan_id) as total_members,
      (SELECT COUNT(*) FROM notes n WHERE n.chapter_id = c.id) as note_count,
      (SELECT COUNT(*) FROM check_ins ci WHERE ci.chapter_id = c.id) as checkin_count
    FROM chapters c
    WHERE c.plan_id = ?
    ORDER BY c.chapter_number
  `).all(planId);

  res.json({ chapter_stats: chapterStats });
});

router.get('/hot-topics/:planId', authenticateToken, (req, res) => {
  const planId = req.params.planId;

  const hotTopics = db.prepare(`
    SELECT 
      dt.id,
      dt.title,
      dt.view_count,
      dt.created_at,
      u.name as author_name,
      (SELECT COUNT(*) FROM discussion_comments WHERE topic_id = dt.id) as comment_count,
      (SELECT COUNT(*) FROM votes WHERE topic_id = dt.id) as vote_count
    FROM discussion_topics dt
    JOIN users u ON dt.author_id = u.id
    WHERE dt.plan_id = ?
    ORDER BY (comment_count * 2 + vote_count + view_count / 10) DESC
    LIMIT 10
  `).all(planId);

  res.json({ hot_topics: hotTopics });
});

router.get('/absence-alerts/:planId', authenticateToken, requireRole('admin', 'host'), (req, res) => {
  const planId = req.params.planId;

  const absentMembers = db.prepare(`
    SELECT *
    FROM (
      SELECT 
        u.id,
        u.name,
        u.email,
        pm.joined_at,
        (SELECT MAX(created_at) FROM check_ins ci WHERE ci.plan_id = pm.plan_id AND ci.user_id = u.id) as last_checkin,
        (SELECT MAX(created_at) FROM notes n WHERE n.plan_id = pm.plan_id AND n.user_id = u.id) as last_note,
        (SELECT COUNT(*) FROM chapters c WHERE c.plan_id = pm.plan_id 
          AND c.scheduled_date < DATE('now') 
          AND NOT EXISTS (SELECT 1 FROM reading_progress rp WHERE rp.chapter_id = c.id AND rp.user_id = u.id AND rp.status = 'completed')) as missed_chapters
      FROM plan_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.plan_id = ?
    )
    WHERE missed_chapters > 0
    ORDER BY missed_chapters DESC
  `).all(planId);

  res.json({ absent_members: absentMembers });
});

router.get('/retention/:planId', authenticateToken, requireRole('admin', 'host'), (req, res) => {
  const planId = req.params.planId;

  const plan = db.prepare('SELECT start_date, end_date FROM book_plans WHERE id = ?').get(planId);
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  const weeklyStats = db.prepare(`
    SELECT 
      DATE(ci.created_at, 'weekday 0', '-6 days') as week_start,
      COUNT(DISTINCT ci.user_id) as active_users,
      COUNT(*) as total_checkins
    FROM check_ins ci
    WHERE ci.plan_id = ?
    GROUP BY week_start
    ORDER BY week_start
  `).all(planId);

  const totalMembers = db.prepare('SELECT COUNT(*) as count FROM plan_members WHERE plan_id = ?').get(planId).count;

  res.json({
    plan_dates: { start: plan.start_date, end: plan.end_date },
    total_members: totalMembers,
    weekly_stats: weeklyStats
  });
});

router.get('/overview', authenticateToken, requireRole('admin', 'host'), (req, res) => {
  const totalPlans = db.prepare('SELECT COUNT(*) as count FROM book_plans').get().count;
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const totalNotes = db.prepare('SELECT COUNT(*) as count FROM notes').get().count;
  const totalTopics = db.prepare('SELECT COUNT(*) as count FROM discussion_topics').get().count;
  const totalActivities = db.prepare('SELECT COUNT(*) as count FROM activities').get().count;
  const totalCheckins = db.prepare('SELECT COUNT(*) as count FROM check_ins').get().count;

  const recentActivity = db.prepare(`
    SELECT 
      ra.type,
      ra.created_at,
      ra.user_id,
      ra.plan_id,
      ra.chapter_id,
      u.name as user_name,
      c.title as chapter_title
    FROM (
      SELECT 'checkin' as type, created_at, user_id, plan_id, chapter_id FROM check_ins
      UNION ALL
      SELECT 'note' as type, created_at, user_id, plan_id, chapter_id FROM notes
      UNION ALL
      SELECT 'topic' as type, created_at, author_id as user_id, plan_id, chapter_id FROM discussion_topics
    ) ra
    JOIN users u ON ra.user_id = u.id
    LEFT JOIN chapters c ON ra.chapter_id = c.id
    ORDER BY ra.created_at DESC
    LIMIT 10
  `).all();

  const absentMembers = db.prepare(`
    SELECT *
    FROM (
      SELECT 
        u.id,
        u.name,
        u.email,
        pm.role,
        pm.joined_at,
        (SELECT MAX(created_at) FROM check_ins ci WHERE ci.plan_id = pm.plan_id AND ci.user_id = u.id) as last_checkin,
        (SELECT MAX(created_at) FROM notes n WHERE n.plan_id = pm.plan_id AND n.user_id = u.id) as last_note,
        (SELECT COUNT(*) FROM chapters c WHERE c.plan_id = pm.plan_id 
          AND c.scheduled_date < DATE('now') 
          AND NOT EXISTS (SELECT 1 FROM reading_progress rp WHERE rp.chapter_id = c.id AND rp.user_id = u.id AND rp.status = 'completed')) as missed_chapters,
        (SELECT COUNT(*) FROM reading_progress rp WHERE rp.plan_id = pm.plan_id AND rp.user_id = u.id AND rp.status = 'completed') as completed_chapters,
        (SELECT COUNT(*) FROM chapters c WHERE c.plan_id = pm.plan_id) as total_chapters
      FROM plan_members pm
      JOIN users u ON pm.user_id = u.id
      JOIN book_plans bp ON pm.plan_id = bp.id
      WHERE bp.status = 'active'
    )
    WHERE missed_chapters > 0
    ORDER BY missed_chapters DESC
    LIMIT 5
  `).all();

  res.json({
    overview: {
      total_plans: totalPlans,
      total_users: totalUsers,
      total_notes: totalNotes,
      total_topics: totalTopics,
      total_activities: totalActivities,
      total_checkins: totalCheckins
    },
    recent_activity: recentActivity,
    absent_members: absentMembers
  });
});

module.exports = router;
