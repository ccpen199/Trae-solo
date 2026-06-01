const express = require('express')
const router = express.Router()
const db = require('../db')

router.post('/', (req, res) => {
  let { student_id, recommendation_id, resource_id, resource_type, action, is_correct, time_spent, user_answer } = req.body
  
  if (action === 'skip' && recommendation_id && !resource_id) {
    const rec = db.prepare('SELECT resource_id FROM recommendations WHERE id = ?').get(recommendation_id)
    if (rec) {
      resource_id = rec.resource_id
    }
    db.prepare('UPDATE recommendations SET status = ? WHERE id = ?').run('skipped', recommendation_id)
  }
  
  db.prepare(`
    INSERT INTO feedback (student_id, recommendation_id, resource_id, resource_type, action, is_correct, time_spent, user_answer)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(student_id, recommendation_id, resource_id, resource_type, action, is_correct, time_spent, user_answer)
  
  if (action === 'complete' && resource_id) {
    const resource = db.prepare('SELECT id FROM resources WHERE id = ?').get(resource_id)
    if (resource) {
      const kps = db.prepare(`
        SELECT knowledge_point_id FROM resource_knowledge WHERE resource_id = ?
      `).all(resource_id)
      
      kps.forEach(kp => {
        const existing = db.prepare(`
          SELECT * FROM student_mastery WHERE student_id = ? AND knowledge_point_id = ?
        `).get(student_id, kp.knowledge_point_id)
        
        if (existing) {
          const newPracticeCount = existing.practice_count + 1
          const newCorrectCount = existing.correct_count + (is_correct ? 1 : 0)
          const newLevel = Math.min(1, Math.max(0, newCorrectCount / newPracticeCount))
          
          db.prepare(`
            UPDATE student_mastery 
            SET level = ?, practice_count = ?, correct_count = ?, source = ?, updated_at = CURRENT_TIMESTAMP
            WHERE student_id = ? AND knowledge_point_id = ?
          `).run(newLevel, newPracticeCount, newCorrectCount, '练习反馈', student_id, kp.knowledge_point_id)
        } else {
          db.prepare(`
            INSERT INTO student_mastery (student_id, knowledge_point_id, level, source, practice_count, correct_count)
            VALUES (?, ?, ?, ?, 1, ?)
          `).run(student_id, kp.knowledge_point_id, is_correct ? 1 : 0, '练习反馈', is_correct ? 1 : 0)
        }
      })
    }
  }
  
  if (action === 'complete' && !is_correct && resource_id) {
    db.prepare(`
      INSERT INTO wrong_questions (student_id, resource_id, wrong_count, last_wrong_at)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, resource_id) DO UPDATE SET
        wrong_count = wrong_count + 1,
        last_wrong_at = CURRENT_TIMESTAMP
    `).run(student_id, resource_id)
  }
  
  if (action === 'complete' && is_correct && resource_id) {
    db.prepare('DELETE FROM wrong_questions WHERE student_id = ? AND resource_id = ?').run(student_id, resource_id)
  }
  
  if (action === 'complete' && recommendation_id) {
    db.prepare('UPDATE recommendations SET status = ? WHERE id = ?').run('completed', recommendation_id)
  }
  
  res.json({ success: true })
})

module.exports = router
