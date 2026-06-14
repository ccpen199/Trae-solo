import { Router, type Request, type Response } from 'express'
import crypto from 'crypto'
import { getDatabase } from '../lib/database.js'
import * as sm4 from '../lib/sm4.js'
import * as blockchain from '../lib/blockchain.js'

const router = Router()

function generateCertNo(prefix: string): string {
  const ts = Date.now().toString()
  return `${prefix}-${ts}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
}

function generateVerifyCode(): string {
  return `INS${crypto.randomBytes(5).toString('hex').toUpperCase()}`
}

interface InsuranceCertRow {
  id: number
  user_id: number
  cert_no: string
  cert_type: string
  holder_name: string
  id_card: string
  insurance_type?: string
  start_date?: string
  end_date?: string
  insured_months?: number
  total_paid?: number
  status: string
  issued_at: string
  created_at: string
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

interface PaymentRecord {
  id: number
  period: string
  insuranceType: string
  insuranceKey: string
  base: number
  personal: number
  company: number
  status: string
  receivedDate: string
  companyName: string
}

function safeDecryptIdCard(encrypted: string): string {
  try {
    return sm4.decrypt(encrypted)
  } catch {
    return encrypted
  }
}

function safeDecryptPhone(encrypted: string): string {
  try {
    return sm4.decrypt(encrypted)
  } catch {
    return encrypted
  }
}

function safeMaskIdCard(idCard: string): string {
  if (!idCard) return ''
  const plain = safeDecryptIdCard(idCard)
  return sm4.maskIdCard(plain)
}

function safeMaskPhone(phone: string): string {
  if (!phone) return ''
  const plain = safeDecryptPhone(phone)
  return sm4.maskPhone(plain)
}

function generateMockPaymentRecords(userId: number): PaymentRecord[] {
  const records: PaymentRecord[] = []
  const today = new Date()
  const insuranceTypes: Array<{ key: string; label: string; personalRate: number; companyRate: number }> = [
    { key: 'pension', label: '养老保险', personalRate: 0.08, companyRate: 0.16 },
    { key: 'medical', label: '医疗保险', personalRate: 0.02, companyRate: 0.095 },
    { key: 'unemployment', label: '失业保险', personalRate: 0.005, companyRate: 0.005 },
    { key: 'injury', label: '工伤保险', personalRate: 0, companyRate: 0.004 },
    { key: 'maternity', label: '生育保险', personalRate: 0, companyRate: 0.008 },
  ]
  const companies = [
    '北京星辰科技发展有限公司',
    '京津冀人力资源服务有限公司',
    '华夏数字经济研究院',
  ]
  const statusList = ['已到账', '已到账', '已到账', '到账中', '补缴']

  let idCounter = 1
  for (let i = 0; i < 6; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const period = `${year}-${month}`
    const base = 8000 + Math.floor(Math.random() * 4000)
    const company = companies[i % companies.length]
    const receivedDate = `${year}-${month}-${String(10 + Math.floor(Math.random() * 15)).padStart(2, '0')}`
    const status = statusList[Math.floor(Math.random() * statusList.length)]

    for (const ins of insuranceTypes) {
      records.push({
        id: idCounter++,
        period,
        insuranceType: ins.label,
        insuranceKey: ins.key,
        base,
        personal: Math.round(base * ins.personalRate * 100) / 100,
        company: Math.round(base * ins.companyRate * 100) / 100,
        status,
        receivedDate,
        companyName: company,
      })
    }
  }
  return records
}

function computeDataDigest(cert: {
  userId: number
  certNo: string
  holderName: string
  insuredMonths: number
  totalPaid: number
  startDate?: string
  endDate?: string
}): string {
  const raw = `${cert.userId}|${cert.certNo}|${cert.holderName}|${cert.insuredMonths}|${cert.totalPaid}|${cert.startDate || ''}|${cert.endDate || ''}`
  return crypto.createHash('sha256').update(raw).digest('hex')
}

router.post('/certificate', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      userId,
      certType,
      holderName,
      idCard,
      insuranceType,
    } = req.body

    if (!userId || !certType || !holderName || !idCard) {
      res.status(400).sendJson({
        code: 400,
        message: '必填字段缺失',
        data: null,
        traceId: req.traceId,
      })
      return
    }

    const insuredMonths = 120 + crypto.randomInt(1, 120)
    const totalPaid = insuredMonths * (1200 + crypto.randomInt(100, 800))

    const today = new Date()
    const startDate = new Date(today.getFullYear() - 10, today.getMonth(), 1).toISOString().slice(0, 10)
    const endDate = today.toISOString().slice(0, 10)

    const db = getDatabase()
    const encryptedIdCard = sm4.encrypt(idCard)
    const certNo = generateCertNo('INS')
    const verifyCode = generateVerifyCode()

    const dataDigest = computeDataDigest({
      userId: Number(userId),
      certNo,
      holderName,
      insuredMonths,
      totalPaid,
      startDate,
      endDate,
    })

    const tx = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO insurance_certs (
          user_id, cert_no, cert_type, holder_name, id_card, insurance_type,
          start_date, end_date, insured_months, total_paid, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        certNo,
        certType,
        holderName,
        encryptedIdCard,
        insuranceType || '职工社会保险',
        startDate,
        endDate,
        insuredMonths,
        totalPaid,
        'valid'
      )

      const bcRecord = blockchain.createRecord('insurance_cert', certNo, dataDigest)

      db.prepare(`
        INSERT INTO user_certificates (
          user_id, cert_type, cert_no, cert_name, holder_name, issue_date, issuer, verify_code, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        'insurance_cert',
        certNo,
        certType === '参保证明' ? '社会保险参保证明' : certType,
        holderName,
        endDate,
        '省级社会保险基金管理局',
        verifyCode,
        'valid'
      )

      return {
        id: Number(result.lastInsertRowid),
        bcRecord,
        verifyCode,
      }
    })

    const result = tx()
    const cert = db.prepare('SELECT * FROM insurance_certs WHERE id = ?').get(result.id) as InsuranceCertRow

    res.status(201).sendJson({
      code: 0,
      message: '参保证明生成成功',
      data: {
        id: cert.id,
        certNo: cert.cert_no,
        certType: cert.cert_type,
        holderName: cert.holder_name,
        idCard: safeMaskIdCard(cert.id_card),
        insuranceType: cert.insurance_type,
        startDate: cert.start_date,
        endDate: cert.end_date,
        insuredMonths: cert.insured_months,
        totalPaid: cert.total_paid,
        verifyCode: result.verifyCode,
        blockchain: {
          hash: result.bcRecord.hash,
          previousHash: result.bcRecord.previousHash,
          blockHeight: result.bcRecord.blockHeight,
        },
        issuedAt: cert.issued_at,
        status: cert.status,
      },
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({
      code: 500,
      message: '生成失败：' + err.message,
      data: null,
      traceId: req.traceId,
    })
  }
})

router.get('/certificate/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    if (Number.isNaN(id)) {
      res.status(400).sendJson({ code: 400, message: '无效的ID', data: null, traceId: req.traceId })
      return
    }

    const db = getDatabase()
    const cert = db.prepare('SELECT * FROM insurance_certs WHERE id = ?').get(id) as InsuranceCertRow | undefined
    if (!cert) {
      res.status(404).sendJson({ code: 404, message: '证明不存在', data: null, traceId: req.traceId })
      return
    }

    const bcRecord = blockchain.getRecordByRef('insurance_cert', cert.cert_no)
    const bcVerified = bcRecord ? blockchain.verifyRecord(bcRecord.hash) : false

    const userCert = db.prepare(
      'SELECT verify_code FROM user_certificates WHERE cert_no = ?'
    ).get(cert.cert_no) as UserCertificateRow | undefined

    res.status(200).sendJson({
      code: 0,
      message: '查询成功',
      data: {
        id: cert.id,
        userId: cert.user_id,
        certNo: cert.cert_no,
        certType: cert.cert_type,
        holderName: cert.holder_name,
        idCard: safeMaskIdCard(cert.id_card),
        insuranceType: cert.insurance_type,
        startDate: cert.start_date,
        endDate: cert.end_date,
        insuredMonths: cert.insured_months,
        totalPaid: cert.total_paid,
        verifyCode: userCert?.verify_code,
        blockchain: bcRecord ? {
          hash: bcRecord.hash,
          previousHash: bcRecord.previousHash,
          blockHeight: bcRecord.blockHeight,
          verified: bcVerified,
        } : null,
        status: cert.status,
        issuedAt: cert.issued_at,
        createdAt: cert.created_at,
      },
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '查询失败：' + err.message, data: null, traceId: req.traceId })
  }
})

router.get('/certificate', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = Number(req.query.userId)
    if (Number.isNaN(userId)) {
      res.status(400).sendJson({ code: 400, message: 'userId 必填', data: null, traceId: req.traceId })
      return
    }

    const db = getDatabase()
    const rows = db.prepare(
      'SELECT * FROM insurance_certs WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId) as InsuranceCertRow[]

    const data = rows.map((cert) => {
      const bcRecord = blockchain.getRecordByRef('insurance_cert', cert.cert_no)
      const bcVerified = bcRecord ? blockchain.verifyRecord(bcRecord.hash) : false
      return {
        id: cert.id,
        certNo: cert.cert_no,
        certType: cert.cert_type,
        holderName: cert.holder_name,
        idCard: safeMaskIdCard(cert.id_card),
        insuranceType: cert.insurance_type,
        startDate: cert.start_date,
        endDate: cert.end_date,
        insuredMonths: cert.insured_months,
        totalPaid: cert.total_paid,
        status: cert.status,
        issuedAt: cert.issued_at,
        blockchainVerified: bcVerified,
      }
    })

    res.status(200).sendJson({
      code: 0,
      message: '查询成功',
      data,
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '查询失败：' + err.message, data: null, traceId: req.traceId })
  }
})

router.get('/certificate/verify/:verifyCode', async (req: Request, res: Response): Promise<void> => {
  try {
    const verifyCode = req.params.verifyCode
    if (!verifyCode) {
      res.status(400).sendJson({ code: 400, message: '核验码必填', data: null, traceId: req.traceId })
      return
    }

    const db = getDatabase()
    const userCert = db.prepare(
      'SELECT * FROM user_certificates WHERE verify_code = ?'
    ).get(verifyCode) as UserCertificateRow | undefined

    if (!userCert) {
      res.status(200).sendJson({
        code: 0,
        message: '核验完成',
        data: {
          valid: false,
          reason: '未找到对应的证明记录',
          certificate: null,
        },
        traceId: req.traceId,
      })
      return
    }

    const cert = db.prepare(
      'SELECT * FROM insurance_certs WHERE cert_no = ?'
    ).get(userCert.cert_no) as InsuranceCertRow | undefined

    const bcRecord = cert ? blockchain.getRecordByRef('insurance_cert', cert.cert_no) : null
    const bcVerified = bcRecord ? blockchain.verifyRecord(bcRecord.hash) : false

    res.status(200).sendJson({
      code: 0,
      message: '核验完成',
      data: {
        valid: userCert.status === 'valid' && bcVerified,
        reason: userCert.status !== 'valid' ? '该证明已失效' : (bcVerified ? '区块链核验通过' : '区块链核验失败'),
        certificate: cert ? {
          certNo: cert.cert_no,
          certType: cert.cert_type,
          certName: userCert.cert_name,
          holderName: cert.holder_name,
          idCard: safeMaskIdCard(cert.id_card),
          insuranceType: cert.insurance_type,
          startDate: cert.start_date,
          endDate: cert.end_date,
          insuredMonths: cert.insured_months,
          totalPaid: cert.total_paid,
          issuer: userCert.issuer,
          issueDate: userCert.issue_date,
          status: userCert.status,
          blockchain: bcRecord ? {
            hash: bcRecord.hash,
            blockHeight: bcRecord.blockHeight,
            verified: bcVerified,
          } : null,
        } : null,
      },
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '核验失败：' + err.message, data: null, traceId: req.traceId })
  }
})

router.get('/payment-records', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = Number(req.query.userId)
    if (Number.isNaN(userId)) {
      res.status(400).sendJson({ code: 400, message: 'userId 必填', data: null, traceId: req.traceId })
      return
    }

    const records = generateMockPaymentRecords(userId)
    const uniqueMonths = new Set(records.map((r) => r.period))
    const totalPersonal = Math.round(records.reduce((sum, r) => sum + r.personal, 0) * 100) / 100
    const totalCompany = Math.round(records.reduce((sum, r) => sum + r.company, 0) * 100) / 100
    const avgBase = Math.round(records.reduce((sum, r) => sum + r.base, 0) / records.length)
    const summary = {
      totalMonths: uniqueMonths.size,
      personalTotal: totalPersonal,
      companyTotal: totalCompany,
      avgBase,
      totalAmount: Math.round((totalPersonal + totalCompany) * 100) / 100,
    }

    res.status(200).sendJson({
      code: 0,
      message: '查询成功',
      data: {
        records,
        summary,
      },
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '查询失败：' + err.message, data: null, traceId: req.traceId })
  }
})

export default router
