const express = require('express')
const router = express.Router()
const db = require('../db')

router.get('/:id', (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id)
  if (!student) return res.status(404).json({ error: '学生不存在' })
  res.json(student)
})

router.get('/:id/profile', (req, res) => {
  const studentId = req.params.id
  
  const masteryDetails = db.prepare(`
    SELECT sm.knowledge_point_id, kp.name as knowledge_point, sm.level, sm.source, sm.updated_at
    FROM student_mastery sm
    JOIN knowledge_points kp ON sm.knowledge_point_id = kp.id
    WHERE sm.student_id = ?
    ORDER BY sm.level ASC
  `).all(studentId)
  
  const masteryRate = masteryDetails.length > 0
    ? Math.round(masteryDetails.reduce((sum, m) => sum + m.level, 0) / masteryDetails.length * 100)
    : 0
  
  const weakPoints = masteryDetails.filter(m => m.level < 0.5).length
  
  const totalPractices = db.prepare(`
    SELECT COUNT(*) as count FROM feedback 
    WHERE student_id = ? AND action = 'complete'
  `).get(studentId).count
  
  const recentFeedback = db.prepare(`
    SELECT is_correct FROM feedback 
    WHERE student_id = ? AND action = 'complete' AND created_at >= datetime('now', '-7 days')
  `).all(studentId)
  
  const recentAccuracy = recentFeedback.length > 0
    ? recentFeedback.filter(f => f.is_correct).length / recentFeedback.length
    : 0
  
  const avgTimeRes = db.prepare(`
    SELECT AVG(time_spent) as avg_time FROM feedback 
    WHERE student_id = ? AND action = 'complete' AND time_spent IS NOT NULL AND time_spent > 0
  `).get(studentId)
  
  const streakDays = db.prepare(`
    SELECT COUNT(DISTINCT DATE(created_at)) as days
    FROM feedback 
    WHERE student_id = ? AND action = 'complete' AND created_at >= datetime('now', '-30 days')
  `).get(studentId).days
  
  const wrongQuestions = db.prepare(`
    SELECT r.id, r.title, wq.wrong_count
    FROM wrong_questions wq
    JOIN resources r ON wq.resource_id = r.id
    WHERE wq.student_id = ?
    ORDER BY wq.wrong_count DESC
  `).all(studentId).map(q => ({
    ...q,
    knowledge_points: db.prepare(`
      SELECT kp.name FROM resource_knowledge rk
      JOIN knowledge_points kp ON rk.knowledge_point_id = kp.id
      WHERE rk.resource_id = ?
    `).all(q.id).map(k => k.name)
  }))
  
  const avgTimeMinutes = avgTimeRes.avg_time ? Math.round(avgTimeRes.avg_time / 60) : 0
  
  res.json({
    mastery_rate: masteryRate,
    weak_points: weakPoints,
    total_practices: totalPractices,
    recent_accuracy: recentAccuracy,
    avg_time: avgTimeMinutes,
    streak_days: streakDays || 0,
    mastery_details: masteryDetails,
    wrong_questions: wrongQuestions
  })
})

router.get('/:id/history', (req, res) => {
  const studentId = req.params.id
  
  const practice = db.prepare(`
    SELECT f.id, f.resource_id, r.title as resource_title, f.is_correct, f.time_spent, f.created_at as completed_at
    FROM feedback f
    JOIN resources r ON f.resource_id = r.id
    WHERE f.student_id = ? AND f.action = 'complete'
    ORDER BY f.created_at DESC
  `).all(studentId)
  
  const favorites = db.prepare(`
    SELECT f.id, f.resource_id, r.title as resource_title, f.created_at
    FROM feedback f
    JOIN resources r ON f.resource_id = r.id
    WHERE f.student_id = ? AND f.action = 'favorite'
    ORDER BY f.created_at DESC
  `).all(studentId)
  
  const skips = db.prepare(`
    SELECT f.id, f.recommendation_id, f.created_at
    FROM feedback f
    WHERE f.student_id = ? AND f.action = 'skip'
    ORDER BY f.created_at DESC
  `).all(studentId)
  
  res.json({ practice, favorites, skips })
})

module.exports = router
