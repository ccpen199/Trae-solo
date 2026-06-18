import { Router, type Request, type Response } from 'express'
import db from '../db/database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { jobId } = req.query

  if (!jobId) {
    res.status(400).json({ success: false, error: '缺少jobId参数' })
    return
  }

  const matches = db.prepare(`
    SELECT m.*, t.name, t.current_company, t.field, t.location
    FROM match_results m
    JOIN talents t ON m.talent_id = t.id
    WHERE m.job_id = ?
    ORDER BY m.overall_score DESC
  `).all(jobId) as any[]

  const result = matches.map(m => ({
    id: m.id,
    talentId: m.talent_id,
    jobId: m.job_id,
    talentName: m.name,
    talentField: m.field,
    talentLocation: m.location,
    talentCompany: m.current_company,
    overallScore: Math.round(m.overall_score * 100),
    semanticScore: Math.round(m.semantic_score * 100),
    networkScore: Math.round(m.network_score * 100),
    regionScore: Math.round(m.region_score * 100),
  }))

  res.json({ success: true, data: result })
})

router.get('/:jobId/:talentId', (req: Request, res: Response): void => {
  const { jobId, talentId } = req.params

  const match = db.prepare(`
    SELECT m.* FROM match_results m
    WHERE m.job_id = ? AND m.talent_id = ?
  `).get(jobId, talentId) as any

  if (!match) {
    res.status(404).json({ success: false, error: '匹配结果不存在' })
    return
  }

  const talent = db.prepare('SELECT * FROM talents WHERE id = ?').get(talentId) as any
  const skills = db.prepare('SELECT * FROM skills WHERE talent_id = ?').all(talentId)
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as any
  const skillReqs = db.prepare('SELECT * FROM skill_requirements WHERE job_id = ?').all(jobId)

  const talentSkillNames = new Set(skills.map((s: any) => s.name))
  const levelRank: Record<string, number> = { '初级': 1, '中级': 2, '高级': 3, '专家': 4 }

  const skillMatch = (skillReqs as any[]).map(sr => {
    const hasSkill = talentSkillNames.has(sr.name)
    const ts = hasSkill ? (skills as any[]).find(s => s.name === sr.name) : null
    const levelMet = ts ? (levelRank[ts.level] || 0) >= (levelRank[sr.preferred_level] || 0) : false
    return {
      skill: sr.name,
      jobRequired: sr.preferred_level || sr.category,
      talentLevel: ts?.level || '无',
      matchScore: hasSkill ? (levelMet ? 100 : 60) : 0,
    }
  })

  const talentAlumni = JSON.parse(talent.alumni_network || '[]') as string[]
  const talentPrevCompanies = JSON.parse(talent.previous_companies || '[]') as string[]

  const sharedAlumni = talentAlumni.length
  const sharedCompanies = talentPrevCompanies.filter(c => c === job.company).length
  const warmthScore = Math.min(100, (sharedAlumni * 10 + sharedCompanies * 20))

  const clusterMap: Record<string, string> = {
    '长春': '东北汽车产业集群', '武汉': '华中汽车产业集群',
    '合肥': '安徽新能源汽车集群', '上海': '长三角汽车产业集群',
    '重庆': '西南汽车产业集群', '广州': '珠三角汽车产业集群',
    '北京': '京津冀汽车产业集群', '深圳': '珠三角新能源集群',
    '苏州': '长三角零部件集群', '保定': '长城汽车产业集群',
  }

  res.json({
    success: true,
    data: {
      overallScore: Math.round(match.overall_score * 100),
      semanticScore: Math.round(match.semantic_score * 100),
      networkScore: Math.round(match.network_score * 100),
      regionScore: Math.round(match.region_score * 100),
      skillMatch,
      networkOverlap: {
        sharedAlumni,
        sharedCompanies,
        warmthScore,
      },
      regionAdvantage: {
        talentLocation: talent.location,
        jobLocation: job.location,
        clusterScore: Math.round(match.region_score * 100),
        clusterName: clusterMap[talent.location] || talent.location + '汽车产业区',
      },
    },
  })
})

export default router
