import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import dayjs from 'dayjs'
import type { EbikeRegistration } from '../db/index.js'

export interface CreateEbikeRequest {
  ownerId: number
  ownerName: string
  ownerIdCard: string
  phone: string
  brand: string
  model: string
  frameNumber: string
  motorNumber: string
  purchaseDate: string
  invoiceNumber: string
}

export interface EbikeListQuery {
  ownerId?: number
  status?: string
  page?: number
  pageSize?: number
}

export interface EbikeListResult {
  list: EbikeRegistration[]
  total: number
  page: number
  pageSize: number
}

export interface ReviewEbikeRequest {
  id: number
  approved: boolean
  rejectReason?: string
}

export default class EbikeService {
  private db: DatabaseType

  constructor(db: DatabaseType) {
    this.db = db
  }

  async createRegistration(req: CreateEbikeRequest): Promise<EbikeRegistration> {
    this.validateFrameNumber(req.frameNumber)
    this.validateMotorNumber(req.motorNumber)

    const existingFrame = this.db.prepare(`
      SELECT id FROM ebike_registrations 
      WHERE frame_number = ? AND status IN ('pending', 'approved')
    `).get(req.frameNumber) as { id: number } | undefined

    if (existingFrame) {
      throw new Error('该车架号已存在登记记录')
    }

    const existingMotor = this.db.prepare(`
      SELECT id FROM ebike_registrations 
      WHERE motor_number = ? AND status IN ('pending', 'approved')
    `).get(req.motorNumber) as { id: number } | undefined

    if (existingMotor) {
      throw new Error('该电机号已存在登记记录')
    }

    const existingInvoice = this.db.prepare(`
      SELECT id FROM ebike_registrations 
      WHERE invoice_number = ? AND status IN ('pending', 'approved')
    `).get(req.invoiceNumber) as { id: number } | undefined

    if (existingInvoice) {
      throw new Error('该发票号已存在登记记录')
    }

    if (dayjs(req.purchaseDate).isAfter(dayjs())) {
      throw new Error('购买日期不能晚于今日')
    }

    const result = this.db.prepare(`
      INSERT INTO ebike_registrations (
        owner_id, owner_name, owner_id_card, phone,
        brand, model, frame_number, motor_number,
        purchase_date, invoice_number, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      req.ownerId,
      req.ownerName,
      req.ownerIdCard,
      req.phone,
      req.brand,
      req.model,
      req.frameNumber,
      req.motorNumber,
      req.purchaseDate,
      req.invoiceNumber,
    )

    const registrationId = result.lastInsertRowid as number
    return this.getDetail(registrationId)
  }

  private validateFrameNumber(frameNumber: string): void {
    if (!/^[A-Z0-9]{15,17}$/.test(frameNumber)) {
      throw new Error('车架号格式不正确，应为15-17位大写字母和数字组合')
    }
  }

  private validateMotorNumber(motorNumber: string): void {
    if (!/^[A-Z0-9]{10,15}$/.test(motorNumber)) {
      throw new Error('电机号格式不正确，应为10-15位大写字母和数字组合')
    }
  }

  getList(query: EbikeListQuery): EbikeListResult {
    const page = query.page || 1
    const pageSize = query.pageSize || 10
    const offset = (page - 1) * pageSize

    const conditions: string[] = []
    const params: (string | number)[] = []

    if (query.ownerId !== undefined) {
      conditions.push('owner_id = ?')
      params.push(query.ownerId)
    }

    if (query.status) {
      conditions.push('status = ?')
      params.push(query.status)
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const countResult = this.db.prepare(`
      SELECT COUNT(*) as total FROM ebike_registrations ${whereClause}
    `).get(...params) as { total: number }

    const list = this.db.prepare(`
      SELECT * FROM ebike_registrations ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset) as EbikeRegistration[]

    return {
      list,
      total: countResult.total,
      page,
      pageSize,
    }
  }

  getDetail(id: number): EbikeRegistration {
    const registration = this.db.prepare('SELECT * FROM ebike_registrations WHERE id = ?').get(id) as EbikeRegistration | undefined

    if (!registration) {
      throw new Error('电动车登记记录不存在')
    }

    return registration
  }

  generateLicense(id: number): {
    licensePlate: string
    licenseNumber: string
  } {
    const registration = this.getDetail(id)

    if (registration.status !== 'pending') {
      throw new Error('只有待审核的登记记录才能生成牌照')
    }

    const licensePlate = this.generateLicensePlate()
    const licenseNumber = this.generateLicenseNumber()

    this.db.prepare(`
      UPDATE ebike_registrations 
      SET license_plate = ?, license_number = ?, status = 'approved', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(licensePlate, licenseNumber, id)

    return {
      licensePlate,
      licenseNumber,
    }
  }

  private generateLicensePlate(): string {
    const prefix = '京B'
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const randomLetters = Array(2).fill(0).map(() => letters[Math.floor(Math.random() * letters.length)]).join('')
    const randomNumbers = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${prefix}${randomLetters}${randomNumbers}`
  }

  private generateLicenseNumber(): string {
    const prefix = 'EBIKE'
    const dateStr = dayjs().format('YYYYMMDD')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${prefix}${dateStr}${random}`
  }

  reviewRegistration(req: ReviewEbikeRequest): EbikeRegistration {
    const registration = this.getDetail(req.id)

    if (registration.status !== 'pending') {
      throw new Error('该登记记录已审核')
    }

    if (req.approved) {
      this.generateLicense(req.id)
    } else {
      if (!req.rejectReason) {
        throw new Error('驳回原因不能为空')
      }

      this.db.prepare(`
        UPDATE ebike_registrations 
        SET status = 'rejected', reject_reason = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(req.rejectReason, req.id)
    }

    return this.getDetail(req.id)
  }

  searchByLicensePlate(licensePlate: string): EbikeRegistration | null {
    const registration = this.db.prepare(`
      SELECT * FROM ebike_registrations 
      WHERE license_plate = ? AND status = 'approved'
      LIMIT 1
    `).get(licensePlate) as EbikeRegistration | undefined

    return registration || null
  }

  searchByFrameNumber(frameNumber: string): EbikeRegistration | null {
    const registration = this.db.prepare(`
      SELECT * FROM ebike_registrations 
      WHERE frame_number = ?
      LIMIT 1
    `).get(frameNumber) as EbikeRegistration | undefined

    return registration || null
  }

  transferOwnership(id: number, newOwnerId: number, newOwnerName: string, newOwnerIdCard: string, newPhone: string): EbikeRegistration {
    const registration = this.getDetail(id)

    if (registration.status !== 'approved') {
      throw new Error('只有已登记上牌的车辆才能过户')
    }

    const existingOwner = this.db.prepare('SELECT id FROM users WHERE id_card = ?').get(newOwnerIdCard) as { id: number } | undefined
    if (!existingOwner) {
      throw new Error('新车主信息不存在，请先注册')
    }

    this.db.prepare(`
      UPDATE ebike_registrations 
      SET owner_id = ?, owner_name = ?, owner_id_card = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newOwnerId, newOwnerName, newOwnerIdCard, newPhone, id)

    return this.getDetail(id)
  }

  cancelRegistration(id: number, reason: string): EbikeRegistration {
    const registration = this.getDetail(id)

    if (registration.status !== 'approved') {
      throw new Error('只有已登记上牌的车辆才能注销')
    }

    this.db.prepare(`
      UPDATE ebike_registrations 
      SET status = 'cancelled', reject_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(reason, id)

    return this.getDetail(id)
  }

  getEbikeStats(ownerId?: number): {
    total: number
    pending: number
    approved: number
    rejected: number
  } {
    const conditions: string[] = []
    const params: (string | number)[] = []

    if (ownerId !== undefined) {
      conditions.push('owner_id = ?')
      params.push(ownerId)
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const stats = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM ebike_registrations ${whereClause}
    `).get(...params) as {
      total: number
      pending: number
      approved: number
      rejected: number
    }

    return {
      total: stats.total || 0,
      pending: stats.pending || 0,
      approved: stats.approved || 0,
      rejected: stats.rejected || 0,
    }
  }
}
