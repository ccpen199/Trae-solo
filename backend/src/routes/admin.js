const express = require('express')
const router = express.Router()
const db = require('../db')

router.get('/stats', (req, res) => {
  const totalResources = db.prepare('SELECT COUNT(*) as count FROM resources').get().count
  const activeStudents = db.prepare('SELECT COUNT(*) as count FROM students').get().count
  const todayRecommendations = db.prepare(`
    SELECT COUNT(*) as count FROM recommendations 
    WHERE DATE(created_at) = DATE('now')
  `).get().count
  
  res.json({
    total_resources: totalResources,
    active_students: activeStudents,
    today_recommendations: todayRecommendations
  })
})

router.get('/students', (req, res) => {
  const students = db.prepare('SELECT * FROM students').all()
  
  const result = students.map(s => {
    const mastery = db.prepare(`
      SELECT AVG(level) as avg_level FROM student_mastery WHERE student_id = ?
    `).get(s.id)
    
    const practices = db.prepare(`
      SELECT COUNT(*) as total, AVG(is_correct) as accuracy 
      FROM feedback WHERE student_id = ? AND action = 'complete'
    `).get(s.id)
    
    const lastActive = db.prepare(`
      SELECT MAX(created_at) as last FROM feedback WHERE student_id = ?
    `).get(s.id)
    
    return {
      ...s,
      mastery_rate: mastery.avg_level ? Math.round(mastery.avg_level * 100) : 0,
      total_practices: practices.total || 0,
      accuracy: practices.accuracy ? Math.round(practices.accuracy * 100) : 0,
      last_active: lastActive.last
    }
  })
  
  res.json(result)
})

module.exports = router
