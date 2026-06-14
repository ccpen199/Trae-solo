import { Router, type Request, type Response } from 'express'
import { getDatabase } from '../lib/database.js'
import * as sm4 from '../lib/sm4.js'

const router = Router()

interface UserRow {
  id: number
  username: string
  password_hash: string
  real_name?: string
  id_card?: string
  phone?: string
  email?: string
  role: string
  status: string
  avatar?: string
  last_login_at?: string
  created_at?: string
  updated_at?: string
}

interface UserApplicationRow {
  id: number
  user_id: number
  application_no: string
  application_type: string
  title: string
  form_data?: string
  attachments?: string
  status: string
  submitted_at?: string
  approved_at?: string
  rejected_at?: string
  reject_reason?: string
  processor_id?: number
  remark?: string
  created_at: string
  updated_at: string
}

interface UserCertificateRow {
  id: number
  user_id: number
  cert_type: string
  cert_no: string
  cert_name: string
  holder_name: string
  issue_date?: string
  expiry_date?: string
  issuer?: string
  verify_code?: string
  qrcode?: string
  status: string
  created_at: string
}

const APPLICATION_TYPE_NAMES: Record<string, string> = {
  unemployment_register: '失业登记',
  entrepreneur_loan: '创业担保贷款',
  skill_certification: '职业技能等级认定',
  arbitration: '劳动仲裁申请',
  insurance_cert: '社保证明申请',
}

function safeDecrypt(encrypted?: string): string | undefined {
  if (!encrypted) return undefined
  try {
    return sm4.decrypt(encrypted)
  } catch {
    return encrypted
  }
}

router.get('/:userId/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = Number(req.params.userId)
    if (Number.isNaN(userId)) {
      res.status(400).sendJson({ code: 400, message: '无效的用户ID', data: null, traceId: req.traceId })
      return
    }

    const db = getDatabase()
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined
    if (!user) {
      res.status(404).sendJson({ code: 404, message: '用户不存在', data: null, traceId: req.traceId })
      return
    }

    const decryptedIdCard = safeDecrypt(user.id_card)
    const decryptedPhone = safeDecrypt(user.phone)

    res.status(200).sendJson({
      code: 0,
      message: '查询成功',
      data: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        idCard: decryptedIdCard ? sm4.maskIdCard(decryptedIdCard) : undefined,
        idCardPlain: decryptedIdCard,
        phone: decryptedPhone ? sm4.maskPhone(decryptedPhone) : undefined,
        phonePlain: decryptedPhone,
        email: user.email,
        role: user.role,
        roleText: user.role === 'admin' ? '系统管理员' : '普通用户',
        status: user.status,
        avatar: user.avatar,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '查询失败：' + err.message, data: null, traceId: req.traceId })
  }
})

router.get('/:userId/applications', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = Number(req.params.userId)
    if (Number.isNaN(userId)) {
      res.status(400).sendJson({ code: 400, message: '无效的用户ID', data: null, traceId: req.traceId })
      return
    }

    const db = getDatabase()

    const myApplications = db.prepare(
      'SELECT * FROM user_applications WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId) as UserApplicationRow[]

    const uregList = db.prepare(
      'SELECT id, status, created_at FROM unemployment_registers WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId) as Array<{ id: number; status: string; created_at: string }>

    const loanList = db.prepare(
      'SELECT id, loan_amount, loan_term, status, created_at FROM entrepreneur_loans WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId) as Array<{ id: number; loan_amount: number; loan_term: number; status: string; created_at: string }>

    const skillList = db.prepare(
      'SELECT id, cert_no, skill_name, skill_level, status, created_at FROM skill_certs WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId) as Array<{ id: number; cert_no: string; skill_name: string; skill_level: string; status: string; created_at: string }>

    const arbitrationList = db.prepare(
      'SELECT id, case_no, case_type, status, created_at FROM arbitration_cases WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId) as Array<{ id: number; case_no: string; case_type: string; status: string; created_at: string }>

    const insuranceList = db.prepare(
      'SELECT id, cert_no, cert_type, status, created_at FROM insurance_certs WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId) as Array<{ id: number; cert_no: string; cert_type: string; status: string; created_at: string }>

    const aggregated: Array<{
      id: string
      applicationNo: string
      applicationType: string
      applicationTypeName: string
      title: string
      status: string
      statusText: string
      submittedAt?: string
      createdAt: string
      updatedAt?: string
      detail: unknown
      source: string
    }> = []

    const statusMap: Record<string, string> = {
      draft: '草稿',
      pending: '待审核',
      pre_approved: '预审通过',
      approved: '已通过',
      rejected: '已拒绝',
      processing: '处理中',
      completed: '已完成',
      closed: '已结案',
      valid: '有效',
      invalid: '无效',
      failed: '未通过',
      pending_exam: '待考试',
      withdrawn: '已撤回',
      accepted: '已受理',
      hearing_scheduled: '已排期',
      hearing_done: '已开庭',
    }

    for (const a of myApplications) {
      aggregated.push({
        id: `app-${a.id}`,
        applicationNo: a.application_no,
        applicationType: a.application_type,
        applicationTypeName: APPLICATION_TYPE_NAMES[a.application_type] || a.application_type,
        title: a.title,
        status: a.status,
        statusText: statusMap[a.status] || a.status,
        submittedAt: a.submitted_at,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
        detail: {
          remark: a.remark,
          rejectReason: a.reject_reason,
        },
        source: 'user_applications',
      })
    }

    for (const u of uregList) {
      aggregated.push({
        id: `ureg-${u.id}`,
        applicationNo: `UR${u.id}`,
        applicationType: 'unemployment_register',
        applicationTypeName: '失业登记',
        title: `失业登记 #${u.id}`,
        status: u.status,
        statusText: statusMap[u.status] || u.status,
        createdAt: u.created_at,
        detail: { registerId: u.id },
        source: 'unemployment_registers',
      })
    }

    for (const l of loanList) {
      aggregated.push({
        id: `loan-${l.id}`,
        applicationNo: `EL${l.id}`,
        applicationType: 'entrepreneur_loan',
        applicationTypeName: '创业担保贷款',
        title: `创业贷款 ${l.loan_amount}元 / ${l.loan_term}月`,
        status: l.status,
        statusText: statusMap[l.status] || l.status,
        createdAt: l.created_at,
        detail: { loanAmount: l.loan_amount, loanTerm: l.loan_term },
        source: 'entrepreneur_loans',
      })
    }

    for (const s of skillList) {
      aggregated.push({
        id: `sk-${s.id}`,
        applicationNo: s.cert_no,
        applicationType: 'skill_certification',
        applicationTypeName: '职业技能等级认定',
        title: `${s.skill_name} - ${s.skill_level}`,
        status: s.status,
        statusText: statusMap[s.status] || s.status,
        createdAt: s.created_at,
        detail: { skillName: s.skill_name, skillLevel: s.skill_level },
        source: 'skill_certs',
      })
    }

    for (const arb of arbitrationList) {
      aggregated.push({
        id: `arb-${arb.id}`,
        applicationNo: arb.case_no,
        applicationType: 'arbitration',
        applicationTypeName: '劳动仲裁申请',
        title: `仲裁案件 - ${arb.case_type}`,
        status: arb.status,
        statusText: statusMap[arb.status] || arb.status,
        createdAt: arb.created_at,
        detail: { caseType: arb.case_type, caseNo: arb.case_no },
        source: 'arbitration_cases',
      })
    }

    for (const ins of insuranceList) {
      aggregated.push({
        id: `ins-${ins.id}`,
        applicationNo: ins.cert_no,
        applicationType: 'insurance_cert',
        applicationTypeName: '社保证明申请',
        title: ins.cert_type,
        status: ins.status,
        statusText: statusMap[ins.status] || ins.status,
        createdAt: ins.created_at,
        detail: { certType: ins.cert_type },
        source: 'insurance_certs',
      })
    }

    aggregated.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))

    const statusStats = aggregated.reduce((acc, item) => {
      const key = item.status
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    res.status(200).sendJson({
      code: 0,
      message: '查询成功',
      data: {
        total: aggregated.length,
        totalByStatus: Object.keys(statusStats).map((s) => ({
          status: s,
          statusText: statusMap[s] || s,
          count: statusStats[s],
        })),
        items: aggregated,
      },
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '查询失败：' + err.message, data: null, traceId: req.traceId })
  }
})

router.get('/:userId/certificates', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = Number(req.params.userId)
    if (Number.isNaN(userId)) {
      res.status(400).sendJson({ code: 400, message: '无效的用户ID', data: null, traceId: req.traceId })
      return
    }

    const db = getDatabase()

    const userCerts = db.prepare(
      'SELECT * FROM user_certificates WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId) as UserCertificateRow[]

    const skillCerts = db.prepare(
      "SELECT * FROM skill_certs WHERE user_id = ? AND status = 'valid' ORDER BY created_at DESC"
    ).all(userId) as Array<{
      id: number
      cert_no: string
      skill_name: string
      skill_level: string
      holder_name: string
      exam_score?: number
      issue_date?: string
      issuer?: string
      status: string
      created_at: string
    }>

    const insuranceCerts = db.prepare(
      "SELECT * FROM insurance_certs WHERE user_id = ? AND status = 'valid' ORDER BY created_at DESC"
    ).all(userId) as Array<{
      id: number
      cert_no: string
      cert_type: string
      holder_name: string
      insurance_type?: string
      start_date?: string
      end_date?: string
      insured_months?: number
      total_paid?: number
      issued_at?: string
      status: string
      created_at: string
    }>

    const combined: Array<{
      id: string
      certType: string
      certTypeName: string
      certNo: string
      certName: string
      holderName: string
      issueDate?: string
      expiryDate?: string
      issuer?: string
      verifyCode?: string
      status: string
      statusText: string
      detail: unknown
      source: string
      createdAt: string
    }> = []

    const certTypeMap: Record<string, string> = {
      skill_cert: '职业技能等级证书',
      insurance_cert: '社会保险参保证明',
      id_card: '身份证',
      diploma: '学历证书',
    }

    for (const c of userCerts) {
      combined.push({
        id: `uc-${c.id}`,
        certType: c.cert_type,
        certTypeName: certTypeMap[c.cert_type] || c.cert_type,
        certNo: c.cert_no,
        certName: c.cert_name,
        holderName: c.holder_name,
        issueDate: c.issue_date,
        expiryDate: c.expiry_date,
        issuer: c.issuer,
        verifyCode: c.verify_code,
        status: c.status,
        statusText: c.status === 'valid' ? '有效' : '已失效',
        detail: { qrcode: c.qrcode },
        source: 'user_certificates',
        createdAt: c.created_at,
      })
    }

    for (const s of skillCerts) {
      if (!userCerts.find((u) => u.cert_no === s.cert_no)) {
        combined.push({
          id: `sk-${s.id}`,
          certType: 'skill_cert',
          certTypeName: '职业技能等级证书',
          certNo: s.cert_no,
          certName: `${s.skill_name} - ${s.skill_level}`,
          holderName: s.holder_name,
          issueDate: s.issue_date,
          issuer: s.issuer,
          status: s.status,
          statusText: '有效',
          detail: { skillName: s.skill_name, skillLevel: s.skill_level, examScore: s.exam_score },
          source: 'skill_certs',
          createdAt: s.created_at,
        })
      }
    }

    for (const i of insuranceCerts) {
      combined.push({
        id: `ins-${i.id}`,
        certType: 'insurance_cert',
        certTypeName: '社会保险参保证明',
        certNo: i.cert_no,
        certName: i.cert_type,
        holderName: i.holder_name,
        issueDate: i.end_date,
        issuer: '省级社会保险基金管理局',
        status: i.status,
        statusText: '有效',
        detail: {
          insuranceType: i.insurance_type,
          startDate: i.start_date,
          endDate: i.end_date,
          insuredMonths: i.insured_months,
          totalPaid: i.total_paid,
        },
        source: 'insurance_certs',
        createdAt: i.created_at,
      })
    }

    combined.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))

    res.status(200).sendJson({
      code: 0,
      message: '查询成功',
      data: {
        total: combined.length,
        totalByType: Object.entries(
          combined.reduce((acc, c) => {
            acc[c.certTypeName] = (acc[c.certTypeName] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        ).map(([typeName, count]) => ({ typeName, count })),
        items: combined,
      },
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '查询失败：' + err.message, data: null, traceId: req.traceId })
  }
})

router.post('/:userId/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = Number(req.params.userId)
    if (Number.isNaN(userId)) {
      res.status(400).sendJson({ code: 400, message: '无效的用户ID', data: null, traceId: req.traceId })
      return
    }

    const { realName, idCard, phone, email, avatar } = req.body

    const db = getDatabase()
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined
    if (!existing) {
      res.status(404).sendJson({ code: 404, message: '用户不存在', data: null, traceId: req.traceId })
      return
    }

    const encryptedIdCard = idCard ? sm4.encrypt(idCard) : existing.id_card
    const encryptedPhone = phone ? sm4.encrypt(phone) : existing.phone

    db.prepare(`
      UPDATE users
      SET real_name = ?, id_card = ?, phone = ?, email = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      realName !== undefined ? realName : existing.real_name,
      encryptedIdCard,
      encryptedPhone,
      email !== undefined ? email : existing.email,
      avatar !== undefined ? avatar : existing.avatar,
      userId
    )

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow
    const decryptedIdCard = safeDecrypt(updated.id_card)
    const decryptedPhone = safeDecrypt(updated.phone)

    res.status(200).sendJson({
      code: 0,
      message: '更新成功',
      data: {
        id: updated.id,
        username: updated.username,
        realName: updated.real_name,
        idCard: decryptedIdCard ? sm4.maskIdCard(decryptedIdCard) : undefined,
        phone: decryptedPhone ? sm4.maskPhone(decryptedPhone) : undefined,
        email: updated.email,
        avatar: updated.avatar,
        updatedAt: updated.updated_at,
      },
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '更新失败：' + err.message, data: null, traceId: req.traceId })
  }
})

export default router
