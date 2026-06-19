import { Router, type Request, type Response } from 'express'
import db from '../db/database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { jobId } = req.query

  if (!jobId) {
    res.status(400).json({ success: false, error: '缺少jobId参数' })
    return
  }

  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as any
  if (!job) {
    res.status(404).json({ success: false, error: '职位不存在' })
    return
  }

  const skillReqs = db.prepare('SELECT * FROM skill_requirements WHERE job_id = ?').all(jobId) as any[]
  const jobSkillNames = new Set(skillReqs.map(s => s.name))
  const hardConstraints = db.prepare('SELECT * FROM hard_constraints WHERE job_id = ?').all(jobId) as any[]

  const matches = db.prepare(`
    SELECT m.*, t.name, t.current_company, t.field, t.location,
           t.alumni_network, t.previous_companies, t.experience
    FROM match_results m
    JOIN talents t ON m.talent_id = t.id
    WHERE m.job_id = ?
    ORDER BY m.overall_score DESC
  `).all(jobId) as any[]

  const clusterMap: Record<string, string> = {
    '长春': '东北汽车产业集群', '武汉': '华中汽车产业集群',
    '合肥': '安徽新能源汽车集群', '上海': '长三角汽车产业集群',
    '重庆': '西南汽车产业集群', '广州': '珠三角汽车产业集群',
    '北京': '京津冀汽车产业集群', '深圳': '珠三角新能源集群',
    '苏州': '长三角零部件集群', '保定': '长城汽车产业集群',
  }

  const result = matches.map(m => {
    const talentSkills = db.prepare('SELECT * FROM skills WHERE talent_id = ?').all(m.talent_id) as any[]
    const talentSkillNames = new Set(talentSkills.map(s => s.name))
    const matchedSkills = [...jobSkillNames].filter(n => talentSkillNames.has(n))
    const missingSkills = [...jobSkillNames].filter(n => !talentSkillNames.has(n))

    const talentAlumni = JSON.parse(m.alumni_network || '[]') as string[]
    const talentPrevCompanies = JSON.parse(m.previous_companies || '[]') as string[]
    const sharedCompanies = talentPrevCompanies.filter(c => c === job.company).length

    const talentCerts = db.prepare('SELECT * FROM certifications WHERE talent_id = ?').all(m.talent_id) as any[]
    const matchedConstraints = hardConstraints.filter((hc: any) => {
      if (hc.type === 'IATF16949内审员') return talentCerts.some((c: any) => c.name.includes('IATF'))
      if (hc.type === '功能安全认证') return talentCerts.some((c: any) => c.name.includes('26262') || c.name.includes('功能安全'))
      if (hc.type === 'ASPICE认证') return talentCerts.some((c: any) => c.name.includes('ASPICE'))
      return false
    })

    return {
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
      matchedSkills,
      missingSkills,
      matchedConstraintTypes: matchedConstraints.map((c: any) => c.type),
      sharedAlumniCount: talentAlumni.length,
      sharedCompanies,
      talentExperience: m.experience,
      clusterName: clusterMap[m.location] || m.location + '汽车产业区',
      sameRegion: m.location === job.location,
    }
  })

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
