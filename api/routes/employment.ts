import { Router, type Request, type Response } from 'express'
import crypto from 'crypto'
import { getDatabase } from '../lib/database.js'
import * as sm4 from '../lib/sm4.js'

const router = Router()

function generateApplicationNo(prefix: string): string {
  const ts = Date.now().toString().slice(-8)
  const rand = crypto.randomInt(1000, 9999).toString()
  return `${prefix}${ts}${rand}`
}

function generateCertNo(prefix: string): string {
  const ts = Date.now().toString()
  return `${prefix}-${ts}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
}

interface UnemploymentRegisterRow {
  id: number
  user_id: number
  real_name: string
  id_card: string
  phone: string
  register_type: string
  education?: string
  work_years?: number
  last_employer?: string
  unemployment_reason?: string
  expected_position?: string
  expected_salary_min?: number
  expected_salary_max?: number
  status: string
  remark?: string
  created_at: string
  updated_at: string
}

interface EntrepreneurLoanRow {
  id: number
  user_id: number
  real_name: string
  id_card: string
  phone: string
  enterprise_name?: string
  credit_code?: string
  loan_amount: number
  loan_term: number
  loan_purpose?: string
  business_address?: string
  business_license?: string
  status: string
  remark?: string
  created_at: string
  updated_at: string
}

interface SkillCertRow {
  id: number
  user_id: number
  cert_no: string
  skill_name: string
  skill_level: string
  holder_name: string
  id_card: string
  exam_score?: number
  issue_date?: string
  issuer?: string
  status: string
  created_at: string
}

function safeDecrypt(encrypted: string): string {
  try {
    return sm4.decrypt(encrypted)
  } catch {
    return encrypted
  }
}

function safeMaskIdCard(idCard: string): string {
  if (!idCard) return ''
  return sm4.maskIdCard(safeDecrypt(idCard))
}

function safeMaskPhone(phone: string): string {
  if (!phone) return ''
  return sm4.maskPhone(safeDecrypt(phone))
}

function maskUnemployment(row: UnemploymentRegisterRow) {
  return {
    id: row.id,
    userId: row.user_id,
    realName: row.real_name,
    idCard: safeMaskIdCard(row.id_card),
    phone: safeMaskPhone(row.phone),
    registerType: row.register_type,
    education: row.education,
    workYears: row.work_years,
    lastEmployer: row.last_employer,
    unemploymentReason: row.unemployment_reason,
    expectedPosition: row.expected_position,
    expectedSalaryMin: row.expected_salary_min,
    expectedSalaryMax: row.expected_salary_max,
    status: row.status,
    remark: row.remark,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function maskLoan(row: EntrepreneurLoanRow) {
  return {
    id: row.id,
    userId: row.user_id,
    realName: row.real_name,
    idCard: safeMaskIdCard(row.id_card),
    phone: safeMaskPhone(row.phone),
    enterpriseName: row.enterprise_name,
    creditCode: row.credit_code,
    loanAmount: row.loan_amount,
    loanTerm: row.loan_term,
    loanPurpose: row.loan_purpose,
    businessAddress: row.business_address,
    businessLicense: row.business_license,
    status: row.status,
    remark: row.remark,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function maskSkillCert(row: SkillCertRow) {
  return {
    id: row.id,
    userId: row.user_id,
    certNo: row.cert_no,
    skillName: row.skill_name,
    skillLevel: row.skill_level,
    holderName: row.holder_name,
    idCard: safeMaskIdCard(row.id_card),
    examScore: row.exam_score,
    issueDate: row.issue_date,
    issuer: row.issuer,
    status: row.status,
    createdAt: row.created_at,
  }
}

router.post('/unemployment-register', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      userId,
      realName,
      idCard,
      phone,
      registerType,
      education,
      workYears,
      lastEmployer,
      unemploymentReason,
      expectedPosition,
      expectedSalaryMin,
      expectedSalaryMax,
      remark,
    } = req.body

    if (!userId || !realName || !idCard || !phone || !registerType) {
      res.status(400).sendJson({
        code: 400,
        message: '必填字段缺失',
        data: null,
        traceId: req.traceId,
      })
      return
    }

    const db = getDatabase()
    const encryptedIdCard = sm4.encrypt(idCard)
    const encryptedPhone = sm4.encrypt(phone)
    const applicationNo = generateApplicationNo('UR')

    const tx = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO unemployment_registers (
          user_id, real_name, id_card, phone, register_type, education, work_years,
          last_employer, unemployment_reason, expected_position,
          expected_salary_min, expected_salary_max, status, remark
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        realName,
        encryptedIdCard,
        encryptedPhone,
        registerType,
        education || null,
        workYears || null,
        lastEmployer || null,
        unemploymentReason || null,
        expectedPosition || null,
        expectedSalaryMin || null,
        expectedSalaryMax || null,
        'pending',
        remark || null
      )

      db.prepare(`
        INSERT INTO user_applications (
          user_id, application_no, application_type, title, form_data, status, submitted_at, remark
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
      `).run(
        userId,
        applicationNo,
        'unemployment_register',
        `失业登记 - ${realName}`,
        JSON.stringify({ registerType, education, expectedPosition }),
        'pending',
        `登记ID: ${result.lastInsertRowid}`
      )

      return Number(result.lastInsertRowid)
    })

    const registerId = tx()

    res.status(201).sendJson({
      code: 0,
      message: '失业登记提交成功',
      data: {
        id: registerId,
        applicationNo,
        status: 'pending',
      },
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({
      code: 500,
      message: '提交失败：' + err.message,
      data: null,
      traceId: req.traceId,
    })
  }
})

router.get('/unemployment-register/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    if (Number.isNaN(id)) {
      res.status(400).sendJson({ code: 400, message: '无效的ID', data: null, traceId: req.traceId })
      return
    }

    const db = getDatabase()
    const row = db.prepare('SELECT * FROM unemployment_registers WHERE id = ?').get(id) as UnemploymentRegisterRow | undefined
    if (!row) {
      res.status(404).sendJson({ code: 404, message: '登记不存在', data: null, traceId: req.traceId })
      return
    }

    res.status(200).sendJson({
      code: 0,
      message: '查询成功',
      data: maskUnemployment(row),
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '查询失败：' + err.message, data: null, traceId: req.traceId })
  }
})

router.get('/unemployment-register', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = Number(req.query.userId)
    if (Number.isNaN(userId)) {
      res.status(400).sendJson({ code: 400, message: 'userId 必填', data: null, traceId: req.traceId })
      return
    }

    const db = getDatabase()
    const rows = db.prepare(
      'SELECT * FROM unemployment_registers WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId) as UnemploymentRegisterRow[]

    res.status(200).sendJson({
      code: 0,
      message: '查询成功',
      data: rows.map(maskUnemployment),
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '查询失败：' + err.message, data: null, traceId: req.traceId })
  }
})

function preCheckEntrepreneurLoan(params: {
  loanAmount: number
  loanTerm: number
  creditCode?: string
  workYears?: number
}): {
  passed: boolean
  estimatedAmount: number
  estimatedTerm: number
  interestRate: number
  reasons: string[]
  suggestions: string[]
} {
  const reasons: string[] = []
  const suggestions: string[] = []
  let passed = true

  let estimatedAmount = params.loanAmount
  let estimatedTerm = params.loanTerm

  if (params.creditCode) {
    estimatedAmount = Math.min(estimatedAmount, 3000000)
    if (estimatedAmount < params.loanAmount) {
      reasons.push('小微企业贷款额度上限为300万元')
    }
  } else {
    estimatedAmount = Math.min(estimatedAmount, 200000)
    if (estimatedAmount < params.loanAmount) {
      reasons.push('个人创业贷款额度上限为20万元')
    }
  }

  if (params.workYears !== undefined && params.workYears >= 3) {
    estimatedAmount = Math.min(estimatedAmount * 1.2, params.creditCode ? 3000000 : 200000)
  } else if (params.workYears !== undefined && params.workYears < 1) {
    estimatedAmount = estimatedAmount * 0.8
    reasons.push('经营年限不足1年，额度下调20%')
  }

  if (estimatedTerm > 36) {
    estimatedTerm = 36
    reasons.push('贷款期限最长不超过3年')
  }

  if (estimatedAmount < 10000) {
    passed = false
    reasons.push('贷款额度低于最低门槛1万元')
    suggestions.push('请提高申请额度至1万元以上')
  }

  return {
    passed,
    estimatedAmount: Math.floor(estimatedAmount),
    estimatedTerm,
    interestRate: 3.85,
    reasons,
    suggestions: passed ? ['建议准备营业执照、身份证等材料提交后续审核'] : suggestions,
  }
}

router.post('/entrepreneur-loan', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      userId,
      realName,
      idCard,
      phone,
      enterpriseName,
      creditCode,
      loanAmount,
      loanTerm,
      loanPurpose,
      businessAddress,
      businessLicense,
      remark,
      workYears,
    } = req.body

    if (!userId || !realName || !idCard || !phone || !loanAmount || !loanTerm) {
      res.status(400).sendJson({ code: 400, message: '必填字段缺失', data: null, traceId: req.traceId })
      return
    }

    const preCheckResult = preCheckEntrepreneurLoan({
      loanAmount: Number(loanAmount),
      loanTerm: Number(loanTerm),
      creditCode,
      workYears: Number(workYears),
    })

    const db = getDatabase()
    const encryptedIdCard = sm4.encrypt(idCard)
    const encryptedPhone = sm4.encrypt(phone)
    const applicationNo = generateApplicationNo('EL')

    const tx = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO entrepreneur_loans (
          user_id, real_name, id_card, phone, enterprise_name, credit_code,
          loan_amount, loan_term, loan_purpose, business_address,
          business_license, status, remark
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        realName,
        encryptedIdCard,
        encryptedPhone,
        enterpriseName || null,
        creditCode || null,
        preCheckResult.estimatedAmount,
        preCheckResult.estimatedTerm,
        loanPurpose || null,
        businessAddress || null,
        businessLicense || null,
        preCheckResult.passed ? 'pre_approved' : 'rejected',
        remark || null
      )

      db.prepare(`
        INSERT INTO user_applications (
          user_id, application_no, application_type, title, form_data, status, submitted_at, remark
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
      `).run(
        userId,
        applicationNo,
        'entrepreneur_loan',
        `创业担保贷款 - ${realName}`,
        JSON.stringify({ loanAmount, loanTerm, enterpriseName, loanPurpose }),
        preCheckResult.passed ? 'pre_approved' : 'rejected',
        `申请ID: ${result.lastInsertRowid}，预审${preCheckResult.passed ? '通过' : '未通过'}`
      )

      return Number(result.lastInsertRowid)
    })

    const loanId = tx()

    res.status(201).sendJson({
      code: 0,
      message: preCheckResult.passed ? '申请已提交，预审通过' : '申请已提交，预审未通过',
      data: {
        id: loanId,
        applicationNo,
        preCheckResult,
        status: preCheckResult.passed ? 'pre_approved' : 'rejected',
      },
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '提交失败：' + err.message, data: null, traceId: req.traceId })
  }
})

router.get('/entrepreneur-loan', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = Number(req.query.userId)
    if (Number.isNaN(userId)) {
      res.status(400).sendJson({ code: 400, message: 'userId 必填', data: null, traceId: req.traceId })
      return
    }

    const db = getDatabase()
    const rows = db.prepare(
      'SELECT * FROM entrepreneur_loans WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId) as EntrepreneurLoanRow[]

    res.status(200).sendJson({
      code: 0,
      message: '查询成功',
      data: rows.map(maskLoan),
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '查询失败：' + err.message, data: null, traceId: req.traceId })
  }
})

router.post('/skill-certification', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      userId,
      realName,
      idCard,
      skillName,
      skillLevel,
      examDate,
      issuer,
    } = req.body

    if (!userId || !realName || !idCard || !skillName || !skillLevel) {
      res.status(400).sendJson({ code: 400, message: '必填字段缺失', data: null, traceId: req.traceId })
      return
    }

    const db = getDatabase()
    const encryptedIdCard = sm4.encrypt(idCard)
    const applicationNo = generateApplicationNo('SC')
    const certNo = generateCertNo('SK')

    const tx = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO skill_certs (
          user_id, cert_no, skill_name, skill_level, holder_name, id_card,
          issuer, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        certNo,
        skillName,
        skillLevel,
        realName,
        encryptedIdCard,
        issuer || '省级职业技能鉴定中心',
        'pending_exam'
      )

      db.prepare(`
        INSERT INTO user_applications (
          user_id, application_no, application_type, title, form_data, status, submitted_at, remark
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
      `).run(
        userId,
        applicationNo,
        'skill_certification',
        `职业技能等级报名 - ${skillName}(${skillLevel})`,
        JSON.stringify({ skillName, skillLevel, examDate }),
        'pending',
        `报名ID: ${result.lastInsertRowid}`
      )

      return Number(result.lastInsertRowid)
    })

    const certId = tx()

    res.status(201).sendJson({
      code: 0,
      message: '报名成功',
      data: {
        id: certId,
        applicationNo,
        certNo,
        status: 'pending_exam',
      },
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '报名失败：' + err.message, data: null, traceId: req.traceId })
  }
})

router.get('/skill-certification', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = Number(req.query.userId)
    if (Number.isNaN(userId)) {
      res.status(400).sendJson({ code: 400, message: 'userId 必填', data: null, traceId: req.traceId })
      return
    }

    const db = getDatabase()
    const rows = db.prepare(
      'SELECT * FROM skill_certs WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId) as SkillCertRow[]

    res.status(200).sendJson({
      code: 0,
      message: '查询成功',
      data: rows.map(maskSkillCert),
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '查询失败：' + err.message, data: null, traceId: req.traceId })
  }
})

router.post('/skill-certification/:id/score', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    const { score, pass, issuer } = req.body

    if (Number.isNaN(id) || score === undefined || pass === undefined) {
      res.status(400).sendJson({ code: 400, message: '参数不完整', data: null, traceId: req.traceId })
      return
    }

    const db = getDatabase()
    const cert = db.prepare('SELECT * FROM skill_certs WHERE id = ?').get(id) as SkillCertRow | undefined
    if (!cert) {
      res.status(404).sendJson({ code: 404, message: '报名记录不存在', data: null, traceId: req.traceId })
      return
    }

    const isPass = Boolean(pass)
    const status = isPass ? 'valid' : 'failed'
    const today = new Date().toISOString().slice(0, 10)

    db.prepare(`
      UPDATE skill_certs
      SET exam_score = ?, issue_date = ?, issuer = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(Number(score), today, issuer || cert.issuer || '省级职业技能鉴定中心', status, id)

    if (isPass) {
      db.prepare(`
        INSERT INTO user_certificates (
          user_id, cert_type, cert_no, cert_name, holder_name, issue_date, issuer, verify_code, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        cert.user_id,
        'skill_cert',
        cert.cert_no,
        `${cert.skill_name} - ${cert.skill_level}`,
        cert.holder_name,
        today,
        issuer || cert.issuer || '省级职业技能鉴定中心',
        `SK${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        'valid'
      )
    }

    const updated = db.prepare('SELECT * FROM skill_certs WHERE id = ?').get(id) as SkillCertRow

    res.status(200).sendJson({
      code: 0,
      message: isPass ? '成绩录入成功，证书已生成' : '成绩录入成功（未通过）',
      data: maskSkillCert(updated),
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '录入失败：' + err.message, data: null, traceId: req.traceId })
  }
})

export default router
