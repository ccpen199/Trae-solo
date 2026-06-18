import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'
import { randomUUID } from 'crypto'

const router = Router()

router.post('/apply', (req: Request, res: Response): void => {
  const db = getDb()
  const { userId, applicationType, amount, months, bankCardNumber, bankName, commitmentSigned } = req.body

  if (!userId || !applicationType || !amount) {
    res.status(400).json({ success: false, error: '缺少必要参数' })
    return
  }

  const user = db.prepare('SELECT * FROM user WHERE id = ?').get(userId)
  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' })
    return
  }

  const rules = db.prepare("SELECT * FROM risk_control_rule WHERE enabled = 1 AND type IN ('duplicate_application', 'abnormal_amount')").all() as any[]

  let riskPassed = true
  const riskResults: any[] = []

  for (const rule of rules) {
    if (rule.type === 'duplicate_application') {
      const existing = db.prepare("SELECT * FROM benefit_application WHERE user_id = ? AND application_type = ? AND status IN ('pending', 'approved') AND created_at > datetime('now', '-30 days')").get(userId, applicationType)
      if (existing) {
        riskPassed = false
        riskResults.push({ rule: rule.name, result: 'blocked', reason: '30天内已存在相同类型的申领记录' })
      }
    }
    if (rule.type === 'abnormal_amount' && amount > 10000) {
      riskResults.push({ rule: rule.name, result: 'review', reason: '申领金额较高，需人工审核' })
    }
  }

  const id = randomUUID()
  const status = riskPassed ? 'pending' : 'rejected'

  db.prepare(`
    INSERT INTO benefit_application (id, user_id, application_type, status, amount, months, bank_card_number, bank_name, commitment_signed, commitment_date, face_verify_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, applicationType, status, amount, months || null, bankCardNumber || null, bankName || null, commitmentSigned ? 1 : 0, commitmentSigned ? new Date().toISOString().split('T')[0] : null, `FV-${Date.now()}`)

  if (riskResults.some(r => r.result === 'review')) {
    db.prepare(`
      INSERT INTO risk_warning (id, rule_id, user_id, severity, description, amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), 'rcr-002', userId, 'medium', `用户${(user as any).name}申领金额${amount}元需人工审核`, amount, 'pending')
  }

  res.json({
    success: true,
    data: {
      applicationId: id,
      status,
      riskResults,
      message: riskPassed ? '申领已提交，等待审核' : '申领被风控拦截'
    }
  })
})

router.post('/ocr-recognize', (req: Request, res: Response): void => {
  const { imageBase64, documentType } = req.body

  if (!imageBase64) {
    res.status(400).json({ success: false, error: '缺少图片数据' })
    return
  }

  const mockOcrResult = {
    documentType: documentType || 'id_card',
    recognizeTime: new Date().toISOString(),
    confidence: 0.95,
    fields: {
      name: '张三',
      idNumber: '110101199001011234',
      address: '北京市东城区建国门大街1号',
      issueDate: '2020-01-01',
      expiryDate: '2040-01-01',
      issuingAuthority: '北京市公安局东城分局'
    }
  }

  res.json({
    success: true,
    data: mockOcrResult
  })
})

router.post('/face-verify', (req: Request, res: Response): void => {
  const { userId, imageBase64 } = req.body

  if (!userId || !imageBase64) {
    res.status(400).json({ success: false, error: '缺少必要参数' })
    return
  }

  const mockFaceResult = {
    verifyId: `FV-${Date.now()}`,
    verified: true,
    similarity: 0.92,
    livenessPassed: true,
    verifyTime: new Date().toISOString(),
    message: '人脸识别验证通过'
  }

  res.json({
    success: true,
    data: mockFaceResult
  })
})

export default router
