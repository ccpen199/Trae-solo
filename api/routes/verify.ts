import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../database.js'

const router = Router()

const failureReasons = ['人脸不匹配', '活体检测失败', '网络异常', '系统超时', '信息不一致']

router.post('/submit', (req: Request, res: Response): void => {
  const { id_card, name, social_security_no, device_fingerprint, ip_address } = req.body

  if (!id_card || !name) {
    res.status(400).json({ success: false, error: '缺少必要参数' })
    return
  }

  const certificationId = uuidv4()
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
  const faceMatchSuccess = Math.random() < 0.8

  let status: string
  let failureReason: string | null = null
  let certNo: string | null = null

  if (faceMatchSuccess) {
    status = 'success'
    certNo = 'CERT' + Date.now().toString().padStart(10, '0')
  } else {
    status = 'failed'
    failureReason = failureReasons[Math.floor(Math.random() * failureReasons.length)]
  }

  const insertCert = db.prepare(`
    INSERT INTO certifications (certification_id, id_card, name, social_security_no, status, failure_reason, device_fingerprint, cert_no, verify_time, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (log_id, certification_id, id_card, action, device_fingerprint, ip_address, detail, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertReview = db.prepare(`
    INSERT INTO review_orders (order_id, certification_id, id_card, name, status)
    VALUES (?, ?, ?, ?, ?)
  `)

  const insertAlert = db.prepare(`
    INSERT INTO alerts (alert_id, type, level, id_card, detail, status, trigger_time)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction(() => {
    insertCert.run(certificationId, id_card, name, social_security_no || null, status, failureReason, device_fingerprint || null, certNo, now, now)

    insertAudit.run(
      uuidv4(),
      certificationId,
      id_card,
      status === 'success' ? '认证通过' : '认证失败',
      device_fingerprint || null,
      ip_address || null,
      status === 'success' ? '人脸比对通过，认证成功' : `认证失败：${failureReason}`,
      now
    )

    insertAudit.run(
      uuidv4(),
      certificationId,
      id_card,
      '提交认证',
      device_fingerprint || null,
      ip_address || null,
      `提交养老认证申请`,
      now
    )

    if (status === 'failed') {
      insertReview.run(uuidv4(), certificationId, id_card, name, 'pending')

      if (failureReason === '人脸不匹配' && Math.random() < 0.5) {
        insertAlert.run(
          uuidv4(),
          'face_mismatch',
          'critical',
          id_card,
          `人脸比对相似度低于阈值，疑似替人认证`,
          'pending',
          now
        )
      }
    }

    const recentCount = db.prepare(`
      SELECT COUNT(*) as cnt FROM certifications
      WHERE id_card = ? AND verify_time > datetime('now', '-1 hour')
    `).get(id_card) as { cnt: number }

    if (recentCount.cnt >= 3) {
      insertAlert.run(
        uuidv4(),
        'high_frequency',
        'warning',
        id_card,
        '同一身份证号在短时间内多次发起认证请求',
        'pending',
        now
      )
    }
  })

  try {
    transaction()
    const cert = db.prepare('SELECT * FROM certifications WHERE certification_id = ?').get(certificationId)
    res.json({ success: true, data: cert })
  } catch (err) {
    res.status(500).json({ success: false, error: '认证提交失败' })
  }
})

router.get('/status/:idCard', (req: Request, res: Response): void => {
  const { idCard } = req.params

  const records = db.prepare(`
    SELECT * FROM certifications WHERE id_card = ? ORDER BY created_at DESC
  `).all(idCard)

  if (!records.length) {
    res.json({ success: true, data: [] })
    return
  }

  res.json({ success: true, data: records })
})

router.get('/credential/:certNo', (req: Request, res: Response): void => {
  const { certNo } = req.params

  const cert = db.prepare(`
    SELECT * FROM certifications WHERE cert_no = ? AND status = 'success'
  `).get(certNo) as any

  if (!cert) {
    res.status(404).json({ success: false, error: '凭证不存在或认证未通过' })
    return
  }

  res.json({ success: true, data: cert })
})

export default router
