import { Router, type Request, type Response } from 'express'
import db from '../db/database.js'

const router = Router()

router.get('/skills', (_req: Request, res: Response): void => {
  const nodes = db.prepare('SELECT * FROM skill_nodes').all() as any[]

  const result = nodes.map(n => ({
    ...n,
    related_skills: JSON.parse(n.related_skills || '[]'),
    related_certs: JSON.parse(n.related_certs || '[]'),
  }))

  const categories = db.prepare('SELECT category, COUNT(*) as count FROM skill_nodes GROUP BY category').all() as any[]
  const categoryMap: Record<string, number> = {}
  categories.forEach(c => { categoryMap[c.category] = c.count })

  const edges: any[] = []
  const nodeMap = new Map(result.map(n => [n.name, n]))

  for (const node of result) {
    for (const relatedName of node.related_skills) {
      const related = nodeMap.get(relatedName)
      if (related) {
        edges.push({
          source: node.id,
          target: related.id,
          source_name: node.name,
          target_name: related.name,
          type: 'skill_relation',
        })
      }
    }
    for (const certName of node.related_certs) {
      const certNode = nodeMap.get(certName)
      if (certNode) {
        edges.push({
          source: node.id,
          target: certNode.id,
          source_name: node.name,
          target_name: certName,
          type: 'cert_relation',
        })
      }
    }
  }

  res.json({
    success: true,
    data: {
      nodes: result,
      edges,
      category_summary: categoryMap,
    },
  })
})

router.get('/certifications', (_req: Request, res: Response): void => {
  const mappings = db.prepare('SELECT * FROM cert_mappings').all() as any[]

  const result = mappings.map(m => ({
    ...m,
    job_levels: JSON.parse(m.job_levels || '[]'),
    required_for: JSON.parse(m.required_for || '[]'),
  }))

  const certSkillLinks = db.prepare(`
    SELECT DISTINCT c.name as cert_name, s.name as skill_name, s.category
    FROM certifications c
    JOIN skills s ON s.talent_id = c.talent_id
    ORDER BY c.name
  `).all() as any[]

  const certSkillMap: Record<string, any[]> = {}
  for (const link of certSkillLinks) {
    if (!certSkillMap[link.cert_name]) {
      certSkillMap[link.cert_name] = []
    }
    certSkillMap[link.cert_name].push({ skill_name: link.skill_name, category: link.category })
  }

  res.json({
    success: true,
    data: {
      mappings: result,
      cert_skill_links: certSkillMap,
    },
  })
})

router.get('/skills/:id/related', (req: Request, res: Response): void => {
  const node = db.prepare('SELECT * FROM skill_nodes WHERE id = ?').get(req.params.id) as any
  if (!node) {
    res.status(404).json({ success: false, error: '技能节点不存在' })
    return
  }

  const relatedSkillNames = JSON.parse(node.related_skills || '[]') as string[]
  const relatedCertNames = JSON.parse(node.related_certs || '[]') as string[]

  const relatedNodes = db.prepare(`
    SELECT * FROM skill_nodes WHERE name IN (${relatedSkillNames.map(() => '?').join(',')})
  `).all(...relatedSkillNames) as any[]

  const certNodes = db.prepare(`
    SELECT * FROM skill_nodes WHERE name IN (${relatedCertNames.map(() => '?').join(',')})
  `).all(...relatedCertNames) as any[]

  const talentsWithSkill = db.prepare(`
    SELECT t.id, t.name, t.current_company, t.field, s.level
    FROM talents t
    JOIN skills s ON s.talent_id = t.id
    WHERE s.name = ?
    ORDER BY s.level DESC
  `).all(node.name) as any[]

  const jobsRequiringSkill = db.prepare(`
    SELECT j.id, j.title, j.company, j.field, sr.required, sr.preferred_level
    FROM jobs j
    JOIN skill_requirements sr ON sr.job_id = j.id
    WHERE sr.name = ?
    ORDER BY j.created_at DESC
  `).all(node.name) as any[]

  res.json({
    success: true,
    data: {
      node: {
        ...node,
        related_skills: relatedSkillNames,
        related_certs: relatedCertNames,
      },
      related_skill_nodes: relatedNodes.map(n => ({
        ...n,
        related_skills: JSON.parse(n.related_skills || '[]'),
        related_certs: JSON.parse(n.related_certs || '[]'),
      })),
      related_cert_nodes: certNodes.map(n => ({
        ...n,
        related_skills: JSON.parse(n.related_skills || '[]'),
        related_certs: JSON.parse(n.related_certs || '[]'),
      })),
      talents_with_skill: talentsWithSkill,
      jobs_requiring_skill: jobsRequiringSkill,
    },
  })
})

export default router
