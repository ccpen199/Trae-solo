const express = require('express')
const router = express.Router()
const db = require('../db')

function getResourceWithKP(resourceId) {
  const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(resourceId)
  if (!resource) return null
  
  const kps = db.prepare(`
    SELECT kp.name FROM resource_knowledge rk
    JOIN knowledge_points kp ON rk.knowledge_point_id = kp.id
    WHERE rk.resource_id = ?
  `).all(resourceId).map(k => k.name)
  
  return {
    ...resource,
    knowledge_points: kps,
    options: resource.options ? JSON.parse(resource.options) : null
  }
}

router.get('/', (req, res) => {
  const resources = db.prepare('SELECT * FROM resources ORDER BY id DESC').all()
  
  const result = resources.map(r => ({
    ...r,
    knowledge_points: db.prepare(`
      SELECT kp.name FROM resource_knowledge rk
      JOIN knowledge_points kp ON rk.knowledge_point_id = kp.id
      WHERE rk.resource_id = ?
    `).all(r.id).map(k => k.name)
  }))
  
  res.json(result)
})

router.get('/:id', (req, res) => {
  const resource = getResourceWithKP(req.params.id)
  if (!resource) return res.status(404).json({ error: '资源不存在' })
  res.json(resource)
})

router.post('/', (req, res) => {
  const { type, title, description, content, difficulty, estimated_time, knowledge_points, options, correct_answer, explanation } = req.body
  
  const hasRequiredTags = knowledge_points && knowledge_points.length > 0 && difficulty && estimated_time
  const inRecommendationPool = hasRequiredTags ? 1 : 0
  
  const insert = db.prepare(`
    INSERT INTO resources (type, title, description, content, difficulty, estimated_time, options, correct_answer, explanation, in_recommendation_pool)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  
  const result = insert.run(
    type, title, description, content, difficulty, estimated_time,
    options ? JSON.stringify(options) : null,
    correct_answer, explanation, inRecommendationPool
  )
  
  const resourceId = result.lastInsertRowid
  
  if (knowledge_points && knowledge_points.length > 0) {
    const linkKP = db.prepare('INSERT INTO resource_knowledge (resource_id, knowledge_point_id) VALUES (?, ?)')
    knowledge_points.forEach(kpName => {
      let kp = db.prepare('SELECT id FROM knowledge_points WHERE name = ?').get(kpName)
      if (!kp) {
        const insertKP = db.prepare('INSERT INTO knowledge_points (name, subject) VALUES (?, ?)')
        kp = { id: insertKP.run(kpName, '数学').lastInsertRowid }
      }
      linkKP.run(resourceId, kp.id)
    })
  }
  
  res.json({ id: resourceId, in_recommendation_pool: inRecommendationPool })
})

router.post('/:id/toggle-pool', (req, res) => {
  const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id)
  if (!resource) return res.status(404).json({ error: '资源不存在' })
  
  const kpCount = db.prepare('SELECT COUNT(*) as count FROM resource_knowledge WHERE resource_id = ?').get(req.params.id).count
  const canEnterPool = kpCount > 0 && resource.difficulty && resource.estimated_time
  
  if (!resource.in_recommendation_pool && !canEnterPool) {
    return res.status(400).json({ error: '资源缺少必要标签，无法进入推荐池' })
  }
  
  db.prepare('UPDATE resources SET in_recommendation_pool = 1 - in_recommendation_pool WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

module.exports = router
