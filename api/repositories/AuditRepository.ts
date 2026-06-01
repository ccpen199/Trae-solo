import { db } from '../db/index.js'
import type { DecryptRequest, AuditLog, AdminUser } from '../types/index.js'

export class AuditRepository {
  private db = db

  createDecryptRequest(request: Omit<DecryptRequest, 'id'>): DecryptRequest {
    const stmt = this.db.prepare(`
      INSERT INTO decrypt_requests (user_id, target_type, target_id, reason, status, expires_at)
      VALUES (@user_id, @target_type, @target_id, @reason, @status, @expires_at)
    `)
    const result = stmt.run(request as any)
    return this.findDecryptRequestById(Number(result.lastInsertRowid))!
  }

  findDecryptRequestById(id: number): DecryptRequest | undefined {
    return this.db.prepare(`
      SELECT dr.*, au.name as applicant_name, adm.name as approver_name
      FROM decrypt_requests dr
      LEFT JOIN admin_users au ON dr.user_id = au.id
      LEFT JOIN admin_users adm ON dr.admin_id = adm.id
      WHERE dr.id = ?
    `).get(id) as DecryptRequest | undefined
  }

  getDecryptRequests(params: { page?: number; pageSize?: number; status?: string } = {}): { data: DecryptRequest[]; total: number } {
    const { page = 1, pageSize = 10, status } = params
    const where: string[] = []
    const values: any[] = []

    if (status) {
      where.push('dr.status = ?')
      values.push(status)
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''
    const totalStmt = this.db.prepare(`SELECT COUNT(*) as count FROM decrypt_requests dr ${whereClause}`)
    const totalResult = totalStmt.get(...values) as { count: number }

    const offset = (page - 1) * pageSize
    const dataStmt = this.db.prepare(`
      SELECT dr.*, au.name as applicant_name, adm.name as approver_name
      FROM decrypt_requests dr
      LEFT JOIN admin_users au ON dr.user_id = au.id
      LEFT JOIN admin_users adm ON dr.admin_id = adm.id
      ${whereClause}
      ORDER BY dr.created_at DESC
      LIMIT ? OFFSET ?
    `)
    const data = dataStmt.all(...values, pageSize, offset) as DecryptRequest[]

    return { data, total: totalResult.count }
  }

  updateDecryptRequest(id: number, updates: Partial<DecryptRequest>): DecryptRequest | undefined {
    const fields = Object.keys(updates)
      .filter(k => k !== 'id' && k !== 'created_at')
      .map(k => `${k} = @${k}`)
      .join(', ')

    if (fields.length === 0) return this.findDecryptRequestById(id)

    const stmt = this.db.prepare(`
      UPDATE decrypt_requests SET ${fields} WHERE id = @id
    `)
    stmt.run({ ...updates, id })
    return this.findDecryptRequestById(id)
  }

  createAuditLog(log: Omit<AuditLog, 'id'>): AuditLog {
    const stmt = this.db.prepare(`
      INSERT INTO audit_logs (admin_id, action, target, detail, created_at)
      VALUES (@admin_id, @action, @target, @detail, @created_at)
    `)
    const result = stmt.run(log as any)
    return this.db.prepare('SELECT * FROM audit_logs WHERE id = ?').get(result.lastInsertRowid) as AuditLog
  }

  getAuditLogs(params: { page?: number; pageSize?: number } = {}): { data: AuditLog[]; total: number } {
    const { page = 1, pageSize = 20 } = params
    const offset = (page - 1) * pageSize

    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM audit_logs')
    const totalResult = totalStmt.get() as { count: number }

    const dataStmt = this.db.prepare(`
      SELECT al.*, au.name as admin_name
      FROM audit_logs al
      LEFT JOIN admin_users au ON al.admin_id = au.id
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `)
    const data = dataStmt.all(pageSize, offset) as AuditLog[]

    return { data, total: totalResult.count }
  }

  findAdminByUsername(username: string): AdminUser | undefined {
    return this.db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username) as AdminUser | undefined
  }

  getComplianceStatus() {
    return {
      iso27001_certified: true,
      certification_number: 'ISO27001-CN-2024-86932',
      valid_until: '2027-05-29',
      last_audit_date: '2026-03-15',
      security_policies: [
        { name: '数据加密标准', version: 'v3.2', last_updated: '2026-04-01' },
        { name: '访问控制策略', version: 'v2.8', last_updated: '2026-03-20' },
        { name: '日志审计规范', version: 'v4.1', last_updated: '2026-04-15' },
        { name: '应急响应预案', version: 'v3.0', last_updated: '2026-02-28' },
      ],
      desensitization_rules: [
        { field: '手机号', rule: '中间4位脱敏', example: '138****5678', enabled: true },
        { field: '姓名', rule: '中间字脱敏', example: '张*三', enabled: true },
        { field: '身份证号', rule: '中间8位脱敏', example: '110101********1234', enabled: true },
        { field: '地址', rule: '详细地址脱敏', example: '北京市朝阳区***', enabled: true },
      ],
    }
  }

  verifyAdminPassword(username: string, password: string): AdminUser | null {
    const bcrypt = require('bcryptjs')
    const admin = this.findAdminByUsername(username)
    if (!admin) return null

    const adminWithPwd = this.db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username) as any
    if (bcrypt.compareSync(password, adminWithPwd.password_hash)) {
      return admin
    }
    return null
  }
}
