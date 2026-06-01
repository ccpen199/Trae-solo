const express = require('express')
const router = express.Router()
const db = require('../db')

function generateRecommendations(studentId) {
  const mastery = db.prepare(`
    SELECT kp.id, kp.name, sm.level, sm.practice_count
    FROM knowledge_points kp
    LEFT JOIN student_mastery sm ON kp.id = sm.knowledge_point_id AND sm.student_id = ?
  `).all(studentId)
  
  const skippedResourceIds = db.prepare(`
    SELECT DISTINCT resource_id FROM feedback 
    WHERE student_id = ? AND action = 'skip' AND created_at >= datetime('now', '-1 hour')
  `).all(studentId).map(f => f.resource_id)
  
  const completedResourceIds = db.prepare(`
    SELECT DISTINCT resource_id FROM feedback 
    WHERE student_id = ? AND action = 'complete' AND created_at >= datetime('now', '-1 hour')
  `).all(studentId).map(f => f.resource_id)
  
  const excludedIds = [...new Set([...skippedResourceIds, ...completedResourceIds])]
  
  const resources = db.prepare(`
    SELECT r.*, GROUP_CONCAT(kp.name) as kp_names
    FROM resources r
    JOIN resource_knowledge rk ON r.id = rk.resource_id
    JOIN knowledge_points kp ON rk.knowledge_point_id = kp.id
    WHERE r.in_recommendation_pool = 1
    GROUP BY r.id
  `).all().filter(r => !excludedIds.includes(r.id))
  
  const candidates = []
  const strategies = { weak: [], reinforce: [], preview: [], sprint: [] }
  
  resources.forEach(resource => {
    const resourceKPs = resource.kp_names.split(',')
    const resourceMastery = mastery.filter(m => resourceKPs.includes(m.name))
    
    const avgLevel = resourceMastery.length > 0
      ? resourceMastery.reduce((sum, m) => sum + (m.level || 0), 0) / resourceMastery.length
      : 0
    
    let strategy, reason, score
    
    const hasPracticed = resourceMastery.some(m => m.practice_count > 0)
    
    if (avgLevel < 0.4 && hasPracticed) {
      strategy = 'weak'
      const weakKPs = resourceMastery.filter(m => m.level < 0.5).map(m => m.name).join('、')
      reason = `您在「${weakKPs}」知识点掌握较弱（${Math.round(avgLevel * 100)}%），需要加强基础练习`
      score = (1 - avgLevel) * 0.95
    } else if (avgLevel >= 0.4 && avgLevel < 0.7) {
      strategy = 'reinforce'
      reason = `您在相关知识点掌握度为${Math.round(avgLevel * 100)}%，建议巩固练习提升熟练度`
      score = 0.7 + (avgLevel - 0.4) * 0.5
    } else if (avgLevel >= 0.8 && resource.difficulty === 'hard') {
      strategy = 'sprint'
      reason = `您基础扎实，推荐挑战高难度题目，冲刺高分`
      score = 0.65
    } else {
      strategy = 'preview'
      reason = `提前预习相关知识点，为后续学习打好基础`
      score = 0.3
    }
    
    strategies[strategy].push({
      resource_id: resource.id,
      resource: {
        id: resource.id,
        title: resource.title,
        description: resource.description,
        difficulty: resource.difficulty,
        estimated_time: resource.estimated_time,
        knowledge_points: resourceKPs
      },
      strategy,
      reason,
      score
    })
  })
  
  const strategyOrder = ['weak', 'reinforce', 'preview', 'sprint']
  strategyOrder.forEach(s => {
    strategies[s].sort((a, b) => b.score - a.score)
    const selected = strategies[s].slice(0, 2)
    candidates.push(...selected)
  })
  
  const insertRec = db.prepare(`
    INSERT INTO recommendations (student_id, resource_id, strategy, reason, score, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `)
  
  const finalRecs = candidates.slice(0, 6).map(rec => {
    const result = insertRec.run(studentId, rec.resource_id, rec.strategy, rec.reason, rec.score)
    return {
      id: result.lastInsertRowid,
      ...rec
    }
  })
  
  return finalRecs
}

router.get('/:studentId', (req, res) => {
  const recommendations = generateRecommendations(req.params.studentId)
  res.json(recommendations)
})

module.exports = router
