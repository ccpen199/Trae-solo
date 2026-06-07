import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import dayjs from 'dayjs'
import type { PermitApplication } from '../db/index.js'

export interface CreatePermitRequest {
  userId: number
  plateNumber: string
  vehicleType: string
  ownerName: string
  ownerIdCard: string
  enterDate: string
  leaveDate: string
  purpose: string
  destination: string
}

export interface PermitListQuery {
  userId?: number
  status?: string
  page?: number
  pageSize?: number
}

export interface PermitListResult {
  list: PermitApplication[]
  total: number
  page: number
  pageSize: number
}

export interface RenewPermitRequest {
  id: number
  enterDate: string
  leaveDate: string
}

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

export default class PermitService {
  private db: DatabaseType

  constructor(db: DatabaseType) {
    this.db = db
  }

  async createApplication(req: CreatePermitRequest): Promise<PermitApplication> {
    this.validateApplicationDates(req.enterDate, req.leaveDate)
    this.checkExistingActivePermit(req.plateNumber)

    const verificationResult = await this.autoVerify(req)

    const result = this.db.prepare(`
      INSERT INTO permit_applications (
        user_id, plate_number, vehicle_type, owner_name, owner_id_card,
        enter_date, leave_date, purpose, destination, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.userId,
      req.plateNumber,
      req.vehicleType,
      req.ownerName,
      req.ownerIdCard,
      req.enterDate,
      req.leaveDate,
      req.purpose,
      req.destination,
      verificationResult.status,
    )

    const permitId = result.lastInsertRowid as number

    if (verificationResult.status === 'approved') {
      const permitNumber = this.generatePermitNumber()
      this.db.prepare(`
        UPDATE permit_applications 
        SET permit_number = ?, verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(permitNumber, permitId)
    } else if (verificationResult.status === 'rejected') {
      this.db.prepare(`
        UPDATE permit_applications 
        SET reject_reason = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(verificationResult.rejectReason, permitId)
    }

    return this.getDetail(permitId)
  }

  private validateApplicationDates(enterDate: string, leaveDate: string): void {
    const enter = dayjs(enterDate)
    const leave = dayjs(leaveDate)
    const now = dayjs()

    if (enter.isBefore(now.startOf('day'))) {
      throw new Error('进京日期不能早于今日')
    }

    if (leave.isBefore(enter)) {
      throw new Error('离京日期不能早于进京日期')
    }

    const duration = leave.diff(enter, 'day') + 1
    if (duration > 7) {
      throw new Error('进京证最长有效期为7天')
    }
  }

  private checkExistingActivePermit(plateNumber: string): void {
    const existing = this.db.prepare(`
      SELECT * FROM permit_applications 
      WHERE plate_number = ? AND status IN ('approved', 'verified')
        AND leave_date >= DATE('now')
    `).get(plateNumber) as any | undefined

    if (existing) {
      throw new Error('该车辆已存在有效的进京证')
    }
  }

  private async autoVerify(req: CreatePermitRequest): Promise<{ status: string; rejectReason?: string }> {
    const restrictedPlates = this.db.prepare(`
      SELECT plate_number FROM violation_reports 
      WHERE plate_number = ? AND status IN ('pending', 'processing')
    `).all(req.plateNumber)

    if (restrictedPlates.length > 0) {
      return {
        status: 'rejected',
        rejectReason: '该车辆存在未处理的交通违法行为，请先处理后再申请',
      }
    }

    const restrictedAreas = ['长安街', '天安门广场', '中南海', '人民大会堂']
    if (restrictedAreas.some(area => req.destination.includes(area))) {
      return {
        status: 'rejected',
        rejectReason: '进入敏感区域需要人工审核',
      }
    }

    const highRiskVehicles = ['货车', '危险品运输车', '大型客车']
    if (highRiskVehicles.includes(req.vehicleType)) {
      return {
        status: 'pending',
      }
    }

    const highRiskPurposes = ['运输货物', '营运载客', '工程施工']
    if (highRiskPurposes.includes(req.purpose)) {
      return {
        status: 'pending',
      }
    }

    return {
      status: 'approved',
    }
  }

  private generatePermitNumber(): string {
    const prefix = 'BJ'
    const dateStr = dayjs().format('YYYYMMDD')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${prefix}${dateStr}${random}`
  }

  getList(query: PermitListQuery): PermitListResult {
    const page = query.page || 1
    const pageSize = query.pageSize || 10
    const offset = (page - 1) * pageSize

    const conditions: string[] = []
    const params: (string | number)[] = []

    if (query.userId !== undefined) {
      conditions.push('user_id = ?')
      params.push(query.userId)
    }

    if (query.status) {
      conditions.push('status = ?')
      params.push(query.status)
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const countResult = this.db.prepare(`
      SELECT COUNT(*) as total FROM permit_applications ${whereClause}
    `).get(...params) as { total: number }

    const list = this.db.prepare(`
      SELECT * FROM permit_applications ${whereClause}
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

  getDetail(id: number): any {
    const permit = this.db.prepare('SELECT * FROM permit_applications WHERE id = ?').get(id) as any

    if (!permit) {
      throw new Error('进京证申请不存在')
    }

    return toCamelCase(permit)
  }

  async renew(req: RenewPermitRequest): Promise<any> {
    const existing = this.getDetail(req.id)

    if (existing.status !== 'approved' && existing.status !== 'verified') {
      throw new Error('只有已通过的申请才能续期')
    }

    if (dayjs(existing.endDate).isAfter(dayjs(req.enterDate))) {
      throw new Error('续期开始日期不能早于原证到期日期')
    }

    const renewedPermit = await this.createApplication({
      userId: existing.userId,
      plateNumber: existing.plateNumber,
      vehicleType: existing.vehicleType,
      ownerName: existing.ownerName,
      ownerIdCard: existing.ownerIdCard,
      enterDate: req.enterDate,
      leaveDate: req.leaveDate,
      purpose: existing.purpose,
      destination: existing.destination,
    })

    return renewedPermit
  }

  verify(id: number, verifierId: number, approved: boolean, rejectReason?: string): any {
    const permit = this.getDetail(id)

    if (permit.status !== 'pending') {
      throw new Error('该申请已处理')
    }

    const newStatus = approved ? 'approved' : 'rejected'
    const permitNumber = approved ? this.generatePermitNumber() : undefined

    this.db.prepare(`
      UPDATE permit_applications 
      SET status = ?, permit_number = ?, verified_at = ?, reject_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      newStatus,
      permitNumber || null,
      approved ? new Date().toISOString() : null,
      approved ? null : rejectReason,
      id,
    )

    return this.getDetail(id)
  }

  checkExpiredPermits(): void {
    this.db.prepare(`
      UPDATE permit_applications 
      SET status = 'expired', updated_at = CURRENT_TIMESTAMP
      WHERE status IN ('approved', 'verified') 
        AND leave_date < DATE('now')
    `).run()
  }

  verifyByPlateNumber(plateNumber: string): any | null {
    this.checkExpiredPermits()

    const permit = this.db.prepare(`
      SELECT * FROM permit_applications 
      WHERE plate_number = ? AND status = 'approved'
        AND enter_date <= DATE('now') AND leave_date >= DATE('now')
      ORDER BY created_at DESC
      LIMIT 1
    `).get(plateNumber) as any | undefined

    if (!permit) {
      return null
    }

    this.db.prepare(`
      UPDATE permit_applications 
      SET status = 'verified', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(permit.id)

    const updated = toCamelCase(permit)
    return {
      ...updated,
      status: 'verified',
      verifiedAt: new Date().toISOString(),
    }
  }
}
