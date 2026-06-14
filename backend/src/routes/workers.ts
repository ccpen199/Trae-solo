import { Router, Request, Response } from 'express'
import { success, notFound, badRequest } from '../utils/response'
import { runQuery, runQueryOne, runInsert, runUpdate, runTransaction } from '../utils/db'
import db from '../utils/db'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const { tradeId, healthStatus, page = '1', pageSize = '20', keyword } = req.query
  const p = parseInt(page as string)
  const ps = parseInt(pageSize as string)
  const offset = (p - 1) * ps

  let sql = `SELECT w.*,
    (SELECT COUNT(*) FROM skill_certificates WHERE worker_id = w.id) as certificateCount,
    (SELECT COUNT(*) FROM performance_reviews WHERE worker_id = w.id) as reviewCount,
    (SELECT COUNT(*) FROM safety_trainings WHERE worker_id = w.id) as trainingCount
    FROM workers w WHERE 1=1`
  let countSql = 'SELECT COUNT(*) as count FROM workers WHERE 1=1'
  const params: any[] = []
  const countParams: any[] = []

  if (tradeId) {
    const condition = ` (',' || replace(replace(w.trade_ids, '[', ''), ']', '') || ',' LIKE '%,' || ? || ',%') `
    sql += ` AND ${condition}`
    countSql += ` AND ${condition.replace(/w\./g, '')}`
    params.push(tradeId)
    countParams.push(tradeId)
  }

  if (healthStatus) {
    sql += ' AND w.health_status = ?'
    countSql += ' AND health_status = ?'
    params.push(healthStatus)
    countParams.push(healthStatus)
  }

  if (keyword) {
    sql += ' AND (w.name LIKE ? OR w.phone LIKE ? OR w.address LIKE ?)'
    countSql += ' AND (name LIKE ? OR phone LIKE ? OR address LIKE ?)'
    const kw = `%${keyword}%`
    params.push(kw, kw, kw)
    countParams.push(kw, kw, kw)
  }

  sql += ' ORDER BY w.performance_score DESC LIMIT ? OFFSET ?'
  params.push(ps, offset)

  const list = runQuery(sql, params)
  const countResult = runQueryOne(countSql, countParams)

  const formattedList = list.map(item => ({
    ...item,
    trade_ids: typeof item.trade_ids === 'string' ? JSON.parse(item.trade_ids) : item.trade_ids
  }))

  success(res, {
    list: formattedList,
    total: countResult?.count || 0,
    page: p,
    pageSize: ps
  })
})

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const worker = runQueryOne('SELECT * FROM workers WHERE id = ?', [parseInt(id)])
  if (!worker) {
    return notFound(res, '工人不存在')
  }
  const formatted = {
    ...worker,
    trade_ids: typeof worker.trade_ids === 'string' ? JSON.parse(worker.trade_ids) : worker.trade_ids
  }
  success(res, formatted)
})

router.get('/:id/certificates', (req: Request, res: Response) => {
  const { id } = req.params
  const certificates = runQuery('SELECT * FROM skill_certificates WHERE worker_id = ? ORDER BY id DESC', [parseInt(id)])
  success(res, certificates)
})

router.get('/:id/reviews', (req: Request, res: Response) => {
  const { id } = req.params
  const reviews = runQuery('SELECT * FROM performance_reviews WHERE worker_id = ? ORDER BY id DESC', [parseInt(id)])
  success(res, reviews)
})

router.get('/:id/trainings', (req: Request, res: Response) => {
  const { id } = req.params
  const trainings = runQuery('SELECT * FROM safety_trainings WHERE worker_id = ? ORDER BY id DESC', [parseInt(id)])
  success(res, trainings)
})

router.post('/', (req: Request, res: Response) => {
  const {
    idCard, name, gender, age, phone, address, latitude, longitude, tradeIds, healthStatus,
    healthCodeSource, healthCodeUpdatedAt, nucleicAcidStatus, vaccinationStatus,
    skillCertificates, safetyTrainings
  } = req.body

  if (!idCard || !name || !gender || !age || !phone) {
    return badRequest(res, '缺少必要参数')
  }

  const existing = runQueryOne('SELECT id FROM workers WHERE id_card = ?', [idCard])
  if (existing) {
    return badRequest(res, '该身份证号已注册')
  }

  let workerId: number

  runTransaction(() => {
    workerId = runInsert(
      `INSERT INTO workers (
        id_card, name, gender, age, phone, address, latitude, longitude, trade_ids, health_status,
        health_code_source, health_code_updated_at, nucleic_acid_status, vaccination_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idCard, name, gender, age, phone, address || '', latitude || 0, longitude || 0,
        JSON.stringify(tradeIds || []), healthStatus || 'green',
        healthCodeSource || null, healthCodeUpdatedAt || null,
        nucleicAcidStatus || 'untested', vaccinationStatus || 'unvaccinated'
      ]
    )

    if (skillCertificates && Array.isArray(skillCertificates) && skillCertificates.length > 0) {
      const certStmt = db.prepare(
        `INSERT INTO skill_certificates (
          worker_id, certificate_type, certificate_number, issuing_authority, issue_date, expiry_date, ocr_result, verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )

      for (const cert of skillCertificates) {
        if (cert.certificateType && cert.certificateNumber) {
          certStmt.run(
            workerId,
            cert.certificateType,
            cert.certificateNumber,
            cert.issuingAuthority || '',
            cert.issueDate || '',
            cert.expiryDate || '',
            cert.ocrResult || '',
            cert.verified ? 1 : 0
          )
        }
      }
    }

    if (safetyTrainings && Array.isArray(safetyTrainings) && safetyTrainings.length > 0) {
      const trainingStmt = db.prepare(
        `INSERT INTO safety_trainings (
          worker_id, training_name, training_date, training_hours, exam_score, passed
        ) VALUES (?, ?, ?, ?, ?, ?)`
      )

      for (const training of safetyTrainings) {
        if (training.trainingName) {
          trainingStmt.run(
            workerId,
            training.trainingName,
            training.trainingDate || '',
            training.trainingHours || 0,
            training.examScore || 0,
            training.passed ? 1 : 0
          )
        }
      }
    }
  })

  success(res, { id: workerId!, ...req.body, tradeIds })
})

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const { idCard, name, gender, age, phone, address, latitude, longitude, tradeIds, performanceScore, healthStatus, healthCodeSource, healthCodeUpdatedAt, nucleicAcidStatus, vaccinationStatus } = req.body

  const existing = runQueryOne('SELECT id FROM workers WHERE id = ?', [parseInt(id)])
  if (!existing) {
    return notFound(res, '工人不存在')
  }

  const updates: string[] = []
  const params: any[] = []

  if (idCard !== undefined) { updates.push('id_card = ?'); params.push(idCard) }
  if (name !== undefined) { updates.push('name = ?'); params.push(name) }
  if (gender !== undefined) { updates.push('gender = ?'); params.push(gender) }
  if (age !== undefined) { updates.push('age = ?'); params.push(age) }
  if (phone !== undefined) { updates.push('phone = ?'); params.push(phone) }
  if (address !== undefined) { updates.push('address = ?'); params.push(address) }
  if (latitude !== undefined) { updates.push('latitude = ?'); params.push(latitude) }
  if (longitude !== undefined) { updates.push('longitude = ?'); params.push(longitude) }
  if (tradeIds !== undefined) { updates.push('trade_ids = ?'); params.push(JSON.stringify(tradeIds)) }
  if (performanceScore !== undefined) { updates.push('performance_score = ?'); params.push(performanceScore) }
  if (healthStatus !== undefined) { updates.push('health_status = ?'); params.push(healthStatus) }
  if (healthCodeSource !== undefined) { updates.push('health_code_source = ?'); params.push(healthCodeSource) }
  if (healthCodeUpdatedAt !== undefined) { updates.push('health_code_updated_at = ?'); params.push(healthCodeUpdatedAt) }
  if (nucleicAcidStatus !== undefined) { updates.push('nucleic_acid_status = ?'); params.push(nucleicAcidStatus) }
  if (vaccinationStatus !== undefined) { updates.push('vaccination_status = ?'); params.push(vaccinationStatus) }
  updates.push('updated_at = CURRENT_TIMESTAMP')
  params.push(parseInt(id))

  runUpdate(`UPDATE workers SET ${updates.join(', ')} WHERE id = ?`, params)

  const updated = runQueryOne('SELECT * FROM workers WHERE id = ?', [parseInt(id)])
  const formatted = {
    ...updated,
    trade_ids: typeof updated?.trade_ids === 'string' ? JSON.parse(updated.trade_ids) : updated?.trade_ids
  }
  success(res, formatted)
})

router.post('/:id/certificates', (req: Request, res: Response) => {
  const { id } = req.params
  const { certificateType, certificateNumber, issuingAuthority, issueDate, expiryDate, ocrResult, verified } = req.body
  if (!certificateType || !certificateNumber) {
    return badRequest(res, '缺少必要参数')
  }

  const certId = runInsert(
    'INSERT INTO skill_certificates (worker_id, certificate_type, certificate_number, issuing_authority, issue_date, expiry_date, ocr_result, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [parseInt(id), certificateType, certificateNumber, issuingAuthority || '', issueDate || '', expiryDate || '', ocrResult || '', verified ? 1 : 0]
  )

  success(res, { id: certId, workerId: parseInt(id), ...req.body })
})

export default router
