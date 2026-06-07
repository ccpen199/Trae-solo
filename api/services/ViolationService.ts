import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import CryptoJS from 'crypto-js'
import fs from 'fs'
import path from 'path'
import type { ViolationReport } from '../db/index.js'

export interface CreateViolationRequest {
  reporterId: number
  plateNumber: string
  violationType: string
  violationTime: string
  location: string
  description: string
  evidenceFiles: string[]
}

export interface ViolationListQuery {
  reporterId?: number
  handlerId?: number
  status?: string
  violationType?: string
  page?: number
  pageSize?: number
}

export interface ViolationListResult {
  list: ViolationReport[]
  total: number
  page: number
  pageSize: number
}

export interface ProcessViolationRequest {
  id: number
  handlerId: number
  status: 'processing' | 'verified' | 'rejected'
  result?: string
}

export default class ViolationService {
  private db: DatabaseType

  constructor(db: DatabaseType) {
    this.db = db
  }

  async createReport(req: CreateViolationRequest): Promise<ViolationReport> {
    if (req.evidenceFiles.length === 0) {
      throw new Error('至少需要上传一张证据照片')
    }

    const evidenceHash = this.calculateEvidenceHash(req.evidenceFiles)

    const existingReport = this.db.prepare(`
      SELECT id FROM violation_reports 
      WHERE plate_number = ? AND violation_time = ? AND evidence_hash = ?
    `).get(req.plateNumber, req.violationTime, evidenceHash) as { id: number } | undefined

    if (existingReport) {
      throw new Error('该违法记录已被举报')
    }

    const result = this.db.prepare(`
      INSERT INTO violation_reports (
        reporter_id, plate_number, violation_type, violation_time,
        location, description, evidence_files, evidence_hash, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      req.reporterId,
      req.plateNumber,
      req.violationType,
      req.violationTime,
      req.location,
      req.description,
      JSON.stringify(req.evidenceFiles),
      evidenceHash,
    )

    const reportId = result.lastInsertRowid as number
    return this.getDetail(reportId)
  }

  calculateEvidenceHash(evidenceFiles: string[]): string {
    const uploadDir = process.env.UPLOAD_DIR || './uploads'
    const resolvedUploadDir = path.resolve(process.cwd(), uploadDir)
    
    const hashes: string[] = []

    for (const filePath of evidenceFiles) {
      const fullPath = path.resolve(resolvedUploadDir, filePath)
      
      if (fs.existsSync(fullPath)) {
        const fileContent = fs.readFileSync(fullPath)
        const fileHash = CryptoJS.SHA256(fileContent.toString('base64')).toString()
        hashes.push(fileHash)
      } else {
        const fileHash = CryptoJS.SHA256(filePath).toString()
        hashes.push(fileHash)
      }
    }

    const combinedHash = CryptoJS.SHA256(hashes.join('|')).toString()
    return combinedHash
  }

  verifyEvidenceHash(id: number): boolean {
    const report = this.getDetail(id)
    const evidenceFiles = JSON.parse(report.evidence_files) as string[]
    const recalculatedHash = this.calculateEvidenceHash(evidenceFiles)
    return recalculatedHash === report.evidence_hash
  }

  getList(query: ViolationListQuery): ViolationListResult {
    const page = query.page || 1
    const pageSize = query.pageSize || 10
    const offset = (page - 1) * pageSize

    const conditions: string[] = []
    const params: (string | number)[] = []

    if (query.reporterId !== undefined) {
      conditions.push('reporter_id = ?')
      params.push(query.reporterId)
    }

    if (query.handlerId !== undefined) {
      conditions.push('handler_id = ?')
      params.push(query.handlerId)
    }

    if (query.status) {
      conditions.push('status = ?')
      params.push(query.status)
    }

    if (query.violationType) {
      conditions.push('violation_type = ?')
      params.push(query.violationType)
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const countResult = this.db.prepare(`
      SELECT COUNT(*) as total FROM violation_reports ${whereClause}
    `).get(...params) as { total: number }

    const list = this.db.prepare(`
      SELECT * FROM violation_reports ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset) as ViolationReport[]

    return {
      list,
      total: countResult.total,
      page,
      pageSize,
    }
  }

  getDetail(id: number): ViolationReport {
    const report = this.db.prepare('SELECT * FROM violation_reports WHERE id = ?').get(id) as ViolationReport | undefined

    if (!report) {
      throw new Error('违法举报记录不存在')
    }

    return report
  }

  processViolation(req: ProcessViolationRequest): ViolationReport {
    const report = this.getDetail(req.id)

    if (report.status === 'verified' || report.status === 'rejected') {
      throw new Error('该举报已处理完成，无法再次处理')
    }

    if (req.status === 'verified' || req.status === 'rejected') {
      if (!req.result) {
        throw new Error('处理结果不能为空')
      }

      const evidenceValid = this.verifyEvidenceHash(req.id)
      if (!evidenceValid) {
        throw new Error('证据文件可能被篡改，请重新审核')
      }
    }

    this.db.prepare(`
      UPDATE violation_reports 
      SET status = ?, handler_id = ?, result = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      req.status,
      req.handlerId,
      req.result || null,
      req.id,
    )

    return this.getDetail(req.id)
  }

  assignHandler(id: number, handlerId: number): ViolationReport {
    const report = this.getDetail(id)

    if (report.status !== 'pending') {
      throw new Error('只有待处理的举报才能分配处理人')
    }

    this.db.prepare(`
      UPDATE violation_reports 
      SET status = 'processing', handler_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(handlerId, id)

    return this.getDetail(id)
  }

  getViolationStats(reporterId?: number): {
    total: number
    pending: number
    processing: number
    verified: number
    rejected: number
  } {
    const conditions: string[] = []
    const params: (string | number)[] = []

    if (reporterId !== undefined) {
      conditions.push('reporter_id = ?')
      params.push(reporterId)
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const stats = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM violation_reports ${whereClause}
    `).get(...params) as {
      total: number
      pending: number
      processing: number
      verified: number
      rejected: number
    }

    return {
      total: stats.total || 0,
      pending: stats.pending || 0,
      processing: stats.processing || 0,
      verified: stats.verified || 0,
      rejected: stats.rejected || 0,
    }
  }
}
