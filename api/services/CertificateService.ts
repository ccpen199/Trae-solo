import Database from 'better-sqlite3'
import dayjs from 'dayjs'
import CryptoJS from 'crypto-js'
import type { Certificate } from '../db/index.js'

function toCamelCase<T = any>(obj: any): T {
  if (!obj || typeof obj !== 'object') return obj as T
  const result: any = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      result[camelKey] = toCamelCase(obj[key])
    }
  }
  return result as T
}

function toCamelCaseArray<T = any>(arr: any[]): T[] {
  return arr.map(item => toCamelCase<T>(item))
}

export interface CertificateType {
  code: string
  name: string
  description: string
  validityYears: number
  requiresRenewal: boolean
}

export const CERTIFICATE_TYPES: CertificateType[] = [
  {
    code: 'driving_license',
    name: '机动车驾驶证',
    description: '机动车驾驶资格证书',
    validityYears: 6,
    requiresRenewal: true,
  },
  {
    code: 'vehicle_registration',
    name: '机动车行驶证',
    description: '机动车注册登记证书',
    validityYears: 999,
    requiresRenewal: false,
  },
  {
    code: 'ebike_license',
    name: '电动自行车行驶证',
    description: '电动自行车登记证书',
    validityYears: 999,
    requiresRenewal: false,
  },
  {
    code: 'permit_certificate',
    name: '进京通行证',
    description: '外埠车辆进京通行证明',
    validityYears: 0,
    requiresRenewal: true,
  },
  {
    code: 'inspection_certificate',
    name: '机动车检验合格标志',
    description: '机动车安全技术检验合格证明',
    validityYears: 1,
    requiresRenewal: true,
  },
]

export interface IssueCertificateRequest {
  userId: number
  certType: string
  holderName: string
  holderIdCard: string
  issueDate?: string
  expiryDate?: string
  relatedBusinessId?: number
}

export interface CertificateListQuery {
  userId?: number
  certType?: string
  status?: string
  page?: number
  pageSize?: number
}

export interface CertificateListResult {
  list: Certificate[]
  total: number
  page: number
  pageSize: number
}

export interface VerifyCertificateRequest {
  certNumber?: string
  verifyCode?: string
}

export interface VerifyCertificateResult {
  valid: boolean
  certificate?: Certificate
  message: string
}

export default class CertificateService {
  private db: Database

  constructor(db: Database) {
    this.db = db
  }

  issue(req: IssueCertificateRequest): Certificate {
    const certTypeInfo = CERTIFICATE_TYPES.find(t => t.code === req.certType)
    if (!certTypeInfo) {
      throw new Error('证照类型不存在')
    }

    const certNumber = this.generateCertNumber(req.certType)
    const verifyCode = this.generateVerifyCode(certNumber)

    let issueDate = req.issueDate || dayjs().format('YYYY-MM-DD')
    let expiryDate: string | null = null

    if (req.expiryDate) {
      expiryDate = req.expiryDate
    } else if (certTypeInfo.validityYears < 100) {
      expiryDate = dayjs(issueDate).add(certTypeInfo.validityYears, 'year').format('YYYY-MM-DD')
    }

    const result = this.db.prepare(`
      INSERT INTO certificates (
        user_id, cert_type, cert_number, holder_name, holder_id_card, 
        issue_date, expiry_date, status, verify_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'valid', ?)
    `).run(
      req.userId,
      req.certType,
      certNumber,
      req.holderName,
      req.holderIdCard,
      issueDate,
      expiryDate,
      verifyCode,
    )

    const certId = result.lastInsertRowid as number
    return this.getDetail(certId)
  }

  private generateCertNumber(certType: string): string {
    const prefixes: Record<string, string> = {
      driving_license: 'DL',
      vehicle_registration: 'VR',
      ebike_license: 'EL',
      permit_certificate: 'PC',
      inspection_certificate: 'IC',
    }

    const prefix = prefixes[certType] || 'CE'
    const dateStr = dayjs().format('YYYYMMDD')
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')

    return `${prefix}${dateStr}${random}`
  }

  private generateVerifyCode(certNumber: string): string {
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substring(2, 8)
    const combined = `${certNumber}-${timestamp}-${random}`
    return CryptoJS.SHA256(combined).toString().substring(0, 16).toUpperCase()
  }

  getDetail(id: number): any {
    const cert = this.db.prepare('SELECT * FROM certificates WHERE id = ?').get(id) as any

    if (!cert) {
      throw new Error('证照不存在')
    }

    return toCamelCase(cert)
  }

  getList(query: CertificateListQuery): any {
    const page = query.page || 1
    const pageSize = query.pageSize || 10
    const offset = (page - 1) * pageSize

    const conditions: string[] = []
    const params: (string | number)[] = []

    if (query.userId !== undefined) {
      conditions.push('user_id = ?')
      params.push(query.userId)
    }

    if (query.certType) {
      conditions.push('cert_type = ?')
      params.push(query.certType)
    }

    if (query.status) {
      conditions.push('status = ?')
      params.push(query.status)
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const countResult = this.db.prepare(`
      SELECT COUNT(*) as total FROM certificates ${whereClause}
    `).get(...params) as { total: number }

    const list = this.db.prepare(`
      SELECT * FROM certificates ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset) as any[]

    return {
      list: toCamelCaseArray(list),
      total: countResult.total,
      page,
      pageSize,
    }
  }

  verify(req: VerifyCertificateRequest): any {
    if (!req.certNumber && !req.verifyCode) {
      return {
        valid: false,
        message: '请提供证照编号或验证码',
      }
    }

    let cert: any

    if (req.certNumber) {
      cert = this.db.prepare('SELECT * FROM certificates WHERE cert_number = ?').get(req.certNumber) as any
    } else if (req.verifyCode) {
      cert = this.db.prepare('SELECT * FROM certificates WHERE verify_code = ?').get(req.verifyCode) as any
    }

    if (!cert) {
      return {
        valid: false,
        message: '证照不存在',
      }
    }

    const camelCert = toCamelCase(cert)

    if (camelCert.status !== 'valid') {
      return {
        valid: false,
        certificate: camelCert,
        message: `证照状态异常：${this.getStatusText(camelCert.status)}`,
      }
    }

    if (camelCert.expiryDate && dayjs(camelCert.expiryDate).isBefore(dayjs())) {
      return {
        valid: false,
        certificate: camelCert,
        message: '证照已过期',
      }
    }

    return {
      valid: true,
      certificate: camelCert,
      message: '证照有效',
    }
  }

  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      valid: '有效',
      expired: '已过期',
      revoked: '已吊销',
    }
    return statusMap[status] || status
  }

  revoke(id: number, reason: string): any {
    const cert = this.getDetail(id)

    if (cert.status !== 'valid') {
      throw new Error('只有有效的证照才能吊销')
    }

    this.db.prepare(`
      UPDATE certificates 
      SET status = 'revoked'
      WHERE id = ?
    `).run(id)

    return this.getDetail(id)
  }

  renew(id: number, expiryDate: string): any {
    const cert = this.getDetail(id)

    const certTypeInfo = CERTIFICATE_TYPES.find(t => t.code === cert.certType)
    if (!certTypeInfo?.requiresRenewal) {
      throw new Error('该证照类型不需要换证')
    }

    const newVerifyCode = this.generateVerifyCode(cert.certNumber)

    this.db.prepare(`
      UPDATE certificates 
      SET expiry_date = ?, verify_code = ?, issue_date = DATE('now')
      WHERE id = ?
    `).run(expiryDate, newVerifyCode, id)

    return this.getDetail(id)
  }

  checkExpiringCerts(userId?: number): any[] {
    const conditions: string[] = [
      "status = 'valid'",
      "expiry_date IS NOT NULL",
      "expiry_date <= DATE('now', '+30 days')",
    ]
    const params: (string | number)[] = []

    if (userId !== undefined) {
      conditions.push('user_id = ?')
      params.push(userId)
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ')

    const certs = this.db.prepare(`
      SELECT * FROM certificates ${whereClause}
      ORDER BY expiry_date ASC
    `).all(...params) as any[]

    return toCamelCaseArray(certs)
  }

  checkExpiredCerts(): void {
    this.db.prepare(`
      UPDATE certificates 
      SET status = 'expired'
      WHERE status = 'valid' 
        AND expiry_date IS NOT NULL 
        AND expiry_date < DATE('now')
    `).run()
  }

  getCertStats(userId?: number): {
    total: number
    valid: number
    expired: number
    revoked: number
    expiring: number
  } {
    this.checkExpiredCerts()

    const conditions: string[] = []
    const params: (string | number)[] = []

    if (userId !== undefined) {
      conditions.push('user_id = ?')
      params.push(userId)
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const stats = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'valid' THEN 1 ELSE 0 END) as valid,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END) as revoked
      FROM certificates ${whereClause}
    `).get(...params) as {
      total: number
      valid: number
      expired: number
      revoked: number
    }

    const expiring = this.checkExpiringCerts(userId).length

    return {
      total: stats.total || 0,
      valid: stats.valid || 0,
      expired: stats.expired || 0,
      revoked: stats.revoked || 0,
      expiring,
    }
  }

  getCertTypes(): CertificateType[] {
    return CERTIFICATE_TYPES
  }

  getByHolderIdCard(holderIdCard: string, certType?: string): any[] {
    const conditions: string[] = ['holder_id_card = ?']
    const params: (string | number)[] = [holderIdCard]

    if (certType) {
      conditions.push('cert_type = ?')
      params.push(certType)
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ')

    const certs = this.db.prepare(`
      SELECT * FROM certificates ${whereClause}
      ORDER BY created_at DESC
    `).all(...params) as any[]

    return toCamelCaseArray(certs)
  }

  searchCertificates(keyword: string): any[] {
    const certs = this.db.prepare(`
      SELECT * FROM certificates 
      WHERE cert_number LIKE ? 
         OR holder_name LIKE ? 
         OR holder_id_card LIKE ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`) as any[]

    return toCamelCaseArray(certs)
  }
}
