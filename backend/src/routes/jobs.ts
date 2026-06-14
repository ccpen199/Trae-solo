import { Router, Request, Response } from 'express'
import { success, notFound, badRequest } from '../utils/response'
import { runQuery, runQueryOne, runInsert, runUpdate } from '../utils/db'
import { calculateDistance, normalizeLocationScore, normalizePerformanceScore, calculateMatchScore, calculateSkillMatchScore } from '../utils/location'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const { employerId, tradeId, status, page = '1', pageSize = '20', keyword } = req.query
  const p = parseInt(page as string)
  const ps = parseInt(pageSize as string)
  const offset = (p - 1) * ps

  let sql = `SELECT j.*, e.company_name as employer_name,
    COALESCE((SELECT result FROM review_records WHERE job_id = j.id AND review_level = 'ai' ORDER BY created_at DESC LIMIT 1), 'not_started') as ai_review_status,
    COALESCE((SELECT reviewer FROM review_records WHERE job_id = j.id AND review_level = 'ai' ORDER BY created_at DESC LIMIT 1), '') as ai_reviewer,
    COALESCE((SELECT comment FROM review_records WHERE job_id = j.id AND review_level = 'ai' ORDER BY created_at DESC LIMIT 1), '') as ai_review_comment,
    COALESCE((SELECT created_at FROM review_records WHERE job_id = j.id AND review_level = 'ai' ORDER BY created_at DESC LIMIT 1), '') as ai_review_at,
    COALESCE((SELECT result FROM review_records WHERE job_id = j.id AND review_level = 'manual' ORDER BY created_at DESC LIMIT 1), 'not_started') as manual_review_status,
    COALESCE((SELECT reviewer FROM review_records WHERE job_id = j.id AND review_level = 'manual' ORDER BY created_at DESC LIMIT 1), '') as manual_reviewer,
    COALESCE((SELECT comment FROM review_records WHERE job_id = j.id AND review_level = 'manual' ORDER BY created_at DESC LIMIT 1), '') as manual_review_comment,
    COALESCE((SELECT created_at FROM review_records WHERE job_id = j.id AND review_level = 'manual' ORDER BY created_at DESC LIMIT 1), '') as manual_review_at,
    COALESCE((SELECT result FROM review_records WHERE job_id = j.id AND review_level = 'site' ORDER BY created_at DESC LIMIT 1), 'not_started') as site_review_status,
    COALESCE((SELECT reviewer FROM review_records WHERE job_id = j.id AND review_level = 'site' ORDER BY created_at DESC LIMIT 1), '') as site_reviewer,
    COALESCE((SELECT comment FROM review_records WHERE job_id = j.id AND review_level = 'site' ORDER BY created_at DESC LIMIT 1), '') as site_review_comment,
    COALESCE((SELECT created_at FROM review_records WHERE job_id = j.id AND review_level = 'site' ORDER BY created_at DESC LIMIT 1), '') as site_review_at
    FROM job_requirements j LEFT JOIN employers e ON j.employer_id = e.id WHERE 1=1`
  let countSql = 'SELECT COUNT(*) as count FROM job_requirements WHERE 1=1'
  const params: any[] = []
  const countParams: any[] = []

  if (employerId) {
    sql += ' AND j.employer_id = ?'
    countSql += ' AND employer_id = ?'
    params.push(employerId)
    countParams.push(employerId)
  }

  if (tradeId) {
    sql += ' AND j.trade_id = ?'
    countSql += ' AND trade_id = ?'
    params.push(tradeId)
    countParams.push(tradeId)
  }

  if (status) {
    sql += ' AND j.status = ?'
    countSql += ' AND status = ?'
    params.push(status)
    countParams.push(status)
  }

  if (keyword) {
    sql += ' AND (j.project_name LIKE ? OR j.project_address LIKE ?)'
    countSql += ' AND (project_name LIKE ? OR project_address LIKE ?)'
    const kw = `%${keyword}%`
    params.push(kw, kw)
    countParams.push(kw, kw)
  }

  sql += ' ORDER BY j.created_at DESC LIMIT ? OFFSET ?'
  params.push(ps, offset)

  const list = runQuery(sql, params)
  const countResult = runQueryOne(countSql, countParams)

  success(res, {
    list,
    total: countResult?.count || 0,
    page: p,
    pageSize: ps
  })
})

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const job = runQueryOne(`
    SELECT j.*, e.company_name as employer_name,
    COALESCE((SELECT result FROM review_records WHERE job_id = j.id AND review_level = 'ai' ORDER BY created_at DESC LIMIT 1), 'not_started') as ai_review_status,
    COALESCE((SELECT reviewer FROM review_records WHERE job_id = j.id AND review_level = 'ai' ORDER BY created_at DESC LIMIT 1), '') as ai_reviewer,
    COALESCE((SELECT comment FROM review_records WHERE job_id = j.id AND review_level = 'ai' ORDER BY created_at DESC LIMIT 1), '') as ai_review_comment,
    COALESCE((SELECT created_at FROM review_records WHERE job_id = j.id AND review_level = 'ai' ORDER BY created_at DESC LIMIT 1), '') as ai_review_at,
    COALESCE((SELECT result FROM review_records WHERE job_id = j.id AND review_level = 'manual' ORDER BY created_at DESC LIMIT 1), 'not_started') as manual_review_status,
    COALESCE((SELECT reviewer FROM review_records WHERE job_id = j.id AND review_level = 'manual' ORDER BY created_at DESC LIMIT 1), '') as manual_reviewer,
    COALESCE((SELECT comment FROM review_records WHERE job_id = j.id AND review_level = 'manual' ORDER BY created_at DESC LIMIT 1), '') as manual_review_comment,
    COALESCE((SELECT created_at FROM review_records WHERE job_id = j.id AND review_level = 'manual' ORDER BY created_at DESC LIMIT 1), '') as manual_review_at,
    COALESCE((SELECT result FROM review_records WHERE job_id = j.id AND review_level = 'site' ORDER BY created_at DESC LIMIT 1), 'not_started') as site_review_status,
    COALESCE((SELECT reviewer FROM review_records WHERE job_id = j.id AND review_level = 'site' ORDER BY created_at DESC LIMIT 1), '') as site_reviewer,
    COALESCE((SELECT comment FROM review_records WHERE job_id = j.id AND review_level = 'site' ORDER BY created_at DESC LIMIT 1), '') as site_review_comment,
    COALESCE((SELECT created_at FROM review_records WHERE job_id = j.id AND review_level = 'site' ORDER BY created_at DESC LIMIT 1), '') as site_review_at
    FROM job_requirements j LEFT JOIN employers e ON j.employer_id = e.id WHERE j.id = ?
  `, [parseInt(id)])
  if (!job) {
    return notFound(res, '招工需求不存在')
  }
  success(res, job)
})

router.get('/:id/matches', (req: Request, res: Response) => {
  const { id } = req.params
  const matches = runQuery(`
    SELECT m.*, w.name as worker_name, w.phone as worker_phone, w.performance_score
    FROM job_matches m
    LEFT JOIN workers w ON m.worker_id = w.id
    WHERE m.job_id = ?
    ORDER BY m.match_score DESC
  `, [parseInt(id)])
  success(res, matches)
})

router.get('/:id/reviews', (req: Request, res: Response) => {
  const { id } = req.params
  const reviews = runQuery(`
    SELECT id, job_id, review_level, reviewer, result, comment, review_date, details
    FROM review_records
    WHERE job_id = ?
    ORDER BY review_date DESC
  `, [parseInt(id)])
  success(res, reviews)
})

router.post('/', (req: Request, res: Response) => {
  const {
    employerId,
    projectName,
    projectAddress,
    detailedAddress,
    latitude,
    longitude,
    tradeId,
    tradeName,
    quantity,
    skillLevelRequired,
    startDate,
    endDate,
    workDuration,
    dailyWageMin,
    dailyWageMax,
    paymentMethod,
    providesFood,
    providesLodging,
    certificateRequired,
    certificateTypes,
    safetyTraining,
    otherQualifications,
    projectIntro,
    constructionEnvironment,
    notes,
    dailyWage,
    workHours,
    qualificationRequired,
    description
  } = req.body

  if (!employerId || !projectName || !tradeId || !quantity) {
    return badRequest(res, '缺少必要参数')
  }

  const id = runInsert(
    `INSERT INTO job_requirements (
      employer_id, project_name, project_address, detailed_address, latitude, longitude,
      trade_id, trade_name, quantity, skill_level_required, start_date, end_date,
      work_duration, daily_wage_min, daily_wage_max, payment_method, provides_food,
      provides_lodging, certificate_required, certificate_types, safety_training,
      other_qualifications, project_intro, construction_environment, notes,
      daily_wage, work_hours, qualification_required, description, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      employerId,
      projectName,
      projectAddress || '',
      detailedAddress || '',
      latitude || 0,
      longitude || 0,
      tradeId,
      tradeName || '',
      quantity || 1,
      skillLevelRequired || '',
      startDate || '',
      endDate || '',
      workDuration || '',
      dailyWageMin || 0,
      dailyWageMax || 0,
      paymentMethod || '',
      providesFood ? 1 : 0,
      providesLodging ? 1 : 0,
      certificateRequired ? 1 : 0,
      Array.isArray(certificateTypes) ? JSON.stringify(certificateTypes) : certificateTypes || '',
      safetyTraining || '',
      otherQualifications || '',
      projectIntro || '',
      constructionEnvironment || '',
      notes || '',
      dailyWage || dailyWageMin || 0,
      workHours || '',
      qualificationRequired || '',
      description || '',
      'pending_review'
    ]
  )

  success(res, { id, ...req.body })
})

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const existing = runQueryOne('SELECT id FROM job_requirements WHERE id = ?', [parseInt(id)])
  if (!existing) {
    return notFound(res, '招工需求不存在')
  }

  const {
    projectName,
    projectAddress,
    detailedAddress,
    latitude,
    longitude,
    tradeId,
    tradeName,
    quantity,
    skillLevelRequired,
    startDate,
    endDate,
    workDuration,
    dailyWageMin,
    dailyWageMax,
    paymentMethod,
    providesFood,
    providesLodging,
    certificateRequired,
    certificateTypes,
    safetyTraining,
    otherQualifications,
    projectIntro,
    constructionEnvironment,
    notes,
    dailyWage,
    workHours,
    qualificationRequired,
    description,
    status
  } = req.body

  const updates: string[] = []
  const params: any[] = []

  if (projectName !== undefined) { updates.push('project_name = ?'); params.push(projectName) }
  if (projectAddress !== undefined) { updates.push('project_address = ?'); params.push(projectAddress) }
  if (detailedAddress !== undefined) { updates.push('detailed_address = ?'); params.push(detailedAddress) }
  if (latitude !== undefined) { updates.push('latitude = ?'); params.push(latitude) }
  if (longitude !== undefined) { updates.push('longitude = ?'); params.push(longitude) }
  if (tradeId !== undefined) { updates.push('trade_id = ?'); params.push(tradeId) }
  if (tradeName !== undefined) { updates.push('trade_name = ?'); params.push(tradeName) }
  if (quantity !== undefined) { updates.push('quantity = ?'); params.push(quantity) }
  if (skillLevelRequired !== undefined) { updates.push('skill_level_required = ?'); params.push(skillLevelRequired) }
  if (startDate !== undefined) { updates.push('start_date = ?'); params.push(startDate) }
  if (endDate !== undefined) { updates.push('end_date = ?'); params.push(endDate) }
  if (workDuration !== undefined) { updates.push('work_duration = ?'); params.push(workDuration) }
  if (dailyWageMin !== undefined) { updates.push('daily_wage_min = ?'); params.push(dailyWageMin) }
  if (dailyWageMax !== undefined) { updates.push('daily_wage_max = ?'); params.push(dailyWageMax) }
  if (paymentMethod !== undefined) { updates.push('payment_method = ?'); params.push(paymentMethod) }
  if (providesFood !== undefined) { updates.push('provides_food = ?'); params.push(providesFood ? 1 : 0) }
  if (providesLodging !== undefined) { updates.push('provides_lodging = ?'); params.push(providesLodging ? 1 : 0) }
  if (certificateRequired !== undefined) { updates.push('certificate_required = ?'); params.push(certificateRequired ? 1 : 0) }
  if (certificateTypes !== undefined) {
    updates.push('certificate_types = ?')
    params.push(Array.isArray(certificateTypes) ? JSON.stringify(certificateTypes) : certificateTypes || '')
  }
  if (safetyTraining !== undefined) { updates.push('safety_training = ?'); params.push(safetyTraining) }
  if (otherQualifications !== undefined) { updates.push('other_qualifications = ?'); params.push(otherQualifications) }
  if (projectIntro !== undefined) { updates.push('project_intro = ?'); params.push(projectIntro) }
  if (constructionEnvironment !== undefined) { updates.push('construction_environment = ?'); params.push(constructionEnvironment) }
  if (notes !== undefined) { updates.push('notes = ?'); params.push(notes) }
  if (dailyWage !== undefined) { updates.push('daily_wage = ?'); params.push(dailyWage) }
  if (workHours !== undefined) { updates.push('work_hours = ?'); params.push(workHours) }
  if (qualificationRequired !== undefined) { updates.push('qualification_required = ?'); params.push(qualificationRequired) }
  if (description !== undefined) { updates.push('description = ?'); params.push(description) }
  if (status !== undefined) { updates.push('status = ?'); params.push(status) }
  updates.push('updated_at = CURRENT_TIMESTAMP')
  params.push(parseInt(id))

  runUpdate(`UPDATE job_requirements SET ${updates.join(', ')} WHERE id = ?`, params)

  const updated = runQueryOne('SELECT * FROM job_requirements WHERE id = ?', [parseInt(id)])
  success(res, updated)
})

router.post('/:id/match', (req: Request, res: Response) => {
  const { id } = req.params
  const job = runQueryOne('SELECT * FROM job_requirements WHERE id = ?', [parseInt(id)])
  if (!job) {
    return notFound(res, '招工需求不存在')
  }

  runUpdate('DELETE FROM job_matches WHERE job_id = ? AND status = ?', [parseInt(id), 'pending'])

  const allWorkers = runQuery(`
    SELECT w.*
    FROM workers w
    WHERE w.health_status = 'green'
    ORDER BY w.performance_score DESC
    LIMIT 100
  `)

  const targetTradeId = job.trade_id
  const workers = allWorkers.filter((w: any) => {
    const tradeIds = typeof w.trade_ids === 'string' ? JSON.parse(w.trade_ids) : w.trade_ids
    return Array.isArray(tradeIds) && tradeIds.includes(targetTradeId)
  })

  const matches: any[] = []

  for (const worker of workers) {
    const tradeIds = typeof worker.trade_ids === 'string' ? JSON.parse(worker.trade_ids) : worker.trade_ids
    const certs = runQuery(
      'SELECT certificate_type, verified FROM skill_certificates WHERE worker_id = ?',
      [worker.id]
    )
    const certificates = certs.map((c: any) => ({
      certificateType: c.certificate_type,
      verified: c.verified === 1
    }))

    const distance = calculateDistance(job.latitude, job.longitude, worker.latitude, worker.longitude)
    const locationScore = normalizeLocationScore(distance)
    const skillScore = calculateSkillMatchScore(tradeIds, job.trade_id, certificates, job.qualification_required)
    const performanceScore = normalizePerformanceScore(worker.performance_score)
    const matchScore = calculateMatchScore(skillScore, locationScore, performanceScore)

    if (matchScore >= 40) {
      const matchId = runInsert(
        'INSERT INTO job_matches (job_id, worker_id, match_score, skill_match_score, location_match_score, performance_match_score, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [parseInt(id), worker.id, matchScore, skillScore, locationScore, performanceScore, 'pending']
      )
      matches.push({
        id: matchId,
        jobId: parseInt(id),
        workerId: worker.id,
        workerName: worker.name,
        matchScore,
        skillScore,
        locationScore,
        performanceScore,
        distance: Math.round(distance * 100) / 100
      })
    }
  }

  matches.sort((a, b) => b.matchScore - a.matchScore)
  success(res, matches.slice(0, 20))
})

router.post('/:id/review/:level', (req: Request, res: Response) => {
  const { id, level } = req.params
  const { result, comment, reviewer, details } = req.body

  const job = runQueryOne('SELECT * FROM job_requirements WHERE id = ?', [parseInt(id)])
  if (!job) {
    return notFound(res, '招工需求不存在')
  }

  if (!['ai', 'manual', 'site'].includes(level)) {
    return badRequest(res, '审核级别错误')
  }

  const reviewDate = new Date().toISOString().split('T')[0]
  runInsert(
    'INSERT INTO review_records (job_id, review_level, reviewer, result, comment, review_date, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [parseInt(id), level, reviewer || '', result || 'pending', comment || '', reviewDate, details || '']
  )

  let newStatus = job.status
  if (level === 'ai' && result === 'pass') {
    newStatus = 'ai_reviewed'
    runUpdate('UPDATE job_requirements SET status = ?, ai_review_result = ?, ai_review_score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, comment || 'AI审核通过', details ? parseInt(details) : 85, parseInt(id)])
  } else if (level === 'manual' && result === 'pass') {
    newStatus = 'manual_reviewed'
    runUpdate('UPDATE job_requirements SET status = ?, manual_review_comment = ?, manual_reviewer = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, comment || '', reviewer || '', parseInt(id)])
  } else if (level === 'site' && result === 'pass') {
    newStatus = 'published'
    runUpdate('UPDATE job_requirements SET status = ?, verified_by = ?, verified_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, reviewer || '', reviewDate, parseInt(id)])
  }

  success(res, { jobId: parseInt(id), level, result, newStatus })
})

export default router
