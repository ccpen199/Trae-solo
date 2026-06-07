import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import dayjs from 'dayjs'
import type { AppointmentWindow, Appointment } from '../db/index.js'

export interface BusinessType {
  code: string
  name: string
  description: string
  durationMinutes: number
}

export const BUSINESS_TYPES: BusinessType[] = [
  { code: 'permit', name: '进京证办理', description: '办理进京通行证相关业务', durationMinutes: 30 },
  { code: 'ebike', name: '电动车登记', description: '电动车注册登记、上牌业务', durationMinutes: 45 },
  { code: 'violation', name: '违法处理', description: '交通违法行为处理业务', durationMinutes: 20 },
  { code: 'accident', name: '事故处理', description: '交通事故责任认定、理赔业务', durationMinutes: 60 },
  { code: 'certificate', name: '证照办理', description: '各类证照的申领、补办业务', durationMinutes: 30 },
  { code: 'consultation', name: '业务咨询', description: '交通业务咨询服务', durationMinutes: 15 },
]

export interface GetWindowsQuery {
  businessType?: string
  startDate?: string
  endDate?: string
}

export interface CreateAppointmentRequest {
  userId: number
  windowId: number
  businessType: string
}

export interface AppointmentListQuery {
  userId?: number
  businessType?: string
  status?: string
  page?: number
  pageSize?: number
}

export interface AppointmentListResult {
  list: Appointment[]
  total: number
  page: number
  pageSize: number
}

export interface QueueStatus {
  appointment: Appointment
  currentNumber: number
  aheadCount: number
  estimatedWaitTime: number
  windowStatus: string
}

export interface RateServiceRequest {
  appointmentId: number
  userId: number
  rating: number
  comment?: string
}

export default class AppointmentService {
  private db: DatabaseType

  constructor(db: DatabaseType) {
    this.db = db
  }

  getBusinessTypes(): BusinessType[] {
    return BUSINESS_TYPES
  }

  getWindows(query: GetWindowsQuery): AppointmentWindow[] {
    const startDate = query.startDate || dayjs().format('YYYY-MM-DD')
    const endDate = query.endDate || dayjs().add(7, 'day').format('YYYY-MM-DD')

    this.ensureWindowsGenerated(startDate, endDate, query.businessType)

    const conditions: string[] = ['date >= ?', 'date <= ?']
    const params: (string | number)[] = [startDate, endDate]

    if (query.businessType) {
      conditions.push('business_type = ?')
      params.push(query.businessType)
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ')

    const windows = this.db.prepare(`
      SELECT * FROM appointment_windows ${whereClause}
      ORDER BY date ASC, start_time ASC
    `).all(...params) as AppointmentWindow[]

    return windows
  }

  private ensureWindowsGenerated(startDate: string, endDate: string, businessType?: string): void {
    const businessTypes = businessType ? [businessType] : BUSINESS_TYPES.map(b => b.code)
    const timeSlots = this.generateTimeSlots()

    let currentDate = dayjs(startDate)
    const end = dayjs(endDate)

    while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
      const dateStr = currentDate.format('YYYY-MM-DD')

      for (const bt of businessTypes) {
        for (const slot of timeSlots) {
          const existing = this.db.prepare(`
            SELECT id FROM appointment_windows 
            WHERE business_type = ? AND date = ? AND start_time = ?
          `).get(bt, dateStr, slot.start) as { id: number } | undefined

          if (!existing) {
            const businessInfo = BUSINESS_TYPES.find(b => b.code === bt)
            const maxCapacity = this.calculateMaxCapacity(bt)
            
            this.db.prepare(`
              INSERT INTO appointment_windows (
                business_type, date, start_time, end_time, max_capacity, current_count, status
              ) VALUES (?, ?, ?, ?, ?, 0, 'available')
            `).run(
              bt,
              dateStr,
              slot.start,
              slot.end,
              maxCapacity,
            )
          }
        }
      }

      currentDate = currentDate.add(1, 'day')
    }
  }

  private generateTimeSlots(): { start: string; end: string }[] {
    const slots: { start: string; end: string }[] = []
    const startTime = dayjs('09:00', 'HH:mm')
    const endTime = dayjs('17:00', 'HH:mm')
    const interval = 60

    let current = startTime.clone()
    while (current.isBefore(endTime)) {
      const slotEnd = current.clone().add(interval, 'minute')
      if (slotEnd.isAfter(endTime)) break
      
      const middayStart = dayjs('12:00', 'HH:mm')
      const middayEnd = dayjs('13:30', 'HH:mm')
      if (current.isBefore(middayEnd) && slotEnd.isAfter(middayStart)) {
        current = middayEnd.clone()
        continue
      }

      slots.push({
        start: current.format('HH:mm'),
        end: slotEnd.format('HH:mm'),
      })
      current = slotEnd
    }

    return slots
  }

  private calculateMaxCapacity(businessType: string): number {
    const capacities: Record<string, number> = {
      permit: 15,
      ebike: 10,
      violation: 20,
      accident: 5,
      certificate: 15,
      consultation: 25,
    }
    return capacities[businessType] || 10
  }

  getAvailableSlots(businessType: string, date: string): {
    window: AppointmentWindow
    available: number
  }[] {
    const windows = this.getWindows({ businessType, startDate: date, endDate: date })

    return windows.map(window => {
      const currentCount = this.db.prepare(`
        SELECT COUNT(*) as count FROM appointments 
        WHERE window_id = ? AND status IN ('pending', 'confirmed')
      `).get(window.id) as { count: number }

      const available = window.max_capacity - currentCount.count

      return {
        window,
        available: Math.max(0, available),
      }
    })
  }

  createAppointment(req: CreateAppointmentRequest): Appointment {
    const window = this.db.prepare('SELECT * FROM appointment_windows WHERE id = ?').get(req.windowId) as AppointmentWindow | undefined

    if (!window) {
      throw new Error('预约时段不存在')
    }

    if (window.status === 'closed') {
      throw new Error('该时段已关闭预约')
    }

    const existingAppointment = this.db.prepare(`
      SELECT id FROM appointments 
      WHERE user_id = ? AND appointment_date = ? AND status IN ('pending', 'confirmed')
    `).get(req.userId, window.date) as { id: number } | undefined

    if (existingAppointment) {
      throw new Error('您今日已有预约，请取消后再重新预约')
    }

    const currentCount = this.db.prepare(`
      SELECT COUNT(*) as count FROM appointments 
      WHERE window_id = ? AND status IN ('pending', 'confirmed')
    `).get(req.windowId) as { count: number }

    if (currentCount.count >= window.max_capacity) {
      throw new Error('该时段预约已满')
    }

    const queueNumber = currentCount.count + 1

    const result = this.db.prepare(`
      INSERT INTO appointments (
        user_id, window_id, business_type, appointment_date, 
        appointment_time, queue_number, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'confirmed')
    `).run(
      req.userId,
      req.windowId,
      req.businessType,
      window.date,
      window.start_time,
      queueNumber,
    )

    this.db.prepare(`
      UPDATE appointment_windows 
      SET current_count = current_count + 1,
          status = CASE WHEN current_count + 1 >= max_capacity THEN 'full' ELSE status END
      WHERE id = ?
    `).run(req.windowId)

    const appointmentId = result.lastInsertRowid as number
    return this.getDetail(appointmentId)
  }

  getDetail(id: number): Appointment {
    const appointment = this.db.prepare('SELECT * FROM appointments WHERE id = ?').get(id) as Appointment | undefined

    if (!appointment) {
      throw new Error('预约记录不存在')
    }

    return appointment
  }

  getList(query: AppointmentListQuery): AppointmentListResult {
    const page = query.page || 1
    const pageSize = query.pageSize || 10
    const offset = (page - 1) * pageSize

    const conditions: string[] = []
    const params: (string | number)[] = []

    if (query.userId !== undefined) {
      conditions.push('user_id = ?')
      params.push(query.userId)
    }

    if (query.businessType) {
      conditions.push('business_type = ?')
      params.push(query.businessType)
    }

    if (query.status) {
      conditions.push('status = ?')
      params.push(query.status)
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const countResult = this.db.prepare(`
      SELECT COUNT(*) as total FROM appointments ${whereClause}
    `).get(...params) as { total: number }

    const list = this.db.prepare(`
      SELECT * FROM appointments ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset) as Appointment[]

    return {
      list,
      total: countResult.total,
      page,
      pageSize,
    }
  }

  getQueueStatus(appointmentId: number): QueueStatus {
    const appointment = this.getDetail(appointmentId)

    if (appointment.status !== 'confirmed') {
      throw new Error('只有已确认的预约才能查询排队状态')
    }

    const currentNumber = this.db.prepare(`
      SELECT MIN(queue_number) as current FROM appointments 
      WHERE window_id = ? AND status = 'confirmed'
    `).get(appointment.window_id) as { current: number | null }

    const aheadCount = this.db.prepare(`
      SELECT COUNT(*) as count FROM appointments 
      WHERE window_id = ? AND status = 'confirmed' AND queue_number < ?
    `).get(appointment.window_id, appointment.queue_number) as { count: number }

    const businessInfo = BUSINESS_TYPES.find(b => b.code === appointment.business_type)
    const estimatedWaitTime = aheadCount.count * (businessInfo?.durationMinutes || 30)

    const window = this.db.prepare(`
      SELECT status FROM appointment_windows WHERE id = ?
    `).get(appointment.window_id) as { status: string }

    return {
      appointment,
      currentNumber: currentNumber.current || appointment.queue_number,
      aheadCount: aheadCount.count,
      estimatedWaitTime,
      windowStatus: window.status,
    }
  }

  cancelAppointment(id: number, userId: number): Appointment {
    const appointment = this.getDetail(id)

    if (appointment.user_id !== userId) {
      throw new Error('无权取消他人预约')
    }

    if (appointment.status !== 'confirmed') {
      throw new Error('该预约已取消或已完成')
    }

    if (dayjs(`${appointment.appointment_date} ${appointment.appointment_time}`).isBefore(dayjs().add(1, 'hour'))) {
      throw new Error('预约开始前1小时内不能取消')
    }

    this.db.prepare(`
      UPDATE appointments 
      SET status = 'cancelled'
      WHERE id = ?
    `).run(id)

    this.db.prepare(`
      UPDATE appointment_windows 
      SET current_count = current_count - 1,
          status = CASE WHEN current_count - 1 < max_capacity THEN 'available' ELSE status END
      WHERE id = ?
    `).run(appointment.window_id)

    return this.getDetail(id)
  }

  completeAppointment(id: number): Appointment {
    const appointment = this.getDetail(id)

    if (appointment.status !== 'confirmed') {
      throw new Error('该预约无法标记为完成')
    }

    this.db.prepare(`
      UPDATE appointments 
      SET status = 'completed'
      WHERE id = ?
    `).run(id)

    return this.getDetail(id)
  }

  rateService(req: RateServiceRequest): Appointment {
    const appointment = this.getDetail(req.appointmentId)

    if (appointment.user_id !== req.userId) {
      throw new Error('无权评价他人预约')
    }

    if (appointment.status !== 'completed') {
      throw new Error('只有已完成的预约才能评价')
    }

    if (appointment.rating) {
      throw new Error('该预约已评价，无法重复评价')
    }

    if (req.rating < 1 || req.rating > 5) {
      throw new Error('评分必须在1-5分之间')
    }

    this.db.prepare(`
      UPDATE appointments 
      SET rating = ?, comment = ?
      WHERE id = ?
    `).run(req.rating, req.comment || null, req.appointmentId)

    return this.getDetail(req.appointmentId)
  }

  getAppointmentStats(userId?: number): {
    total: number
    pending: number
    confirmed: number
    cancelled: number
    completed: number
    averageRating: number
  } {
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
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        AVG(CASE WHEN rating IS NOT NULL THEN rating ELSE NULL END) as averageRating
      FROM appointments ${whereClause}
    `).get(...params) as {
      total: number
      pending: number
      confirmed: number
      cancelled: number
      completed: number
      averageRating: number | null
    }

    return {
      total: stats.total || 0,
      pending: stats.pending || 0,
      confirmed: stats.confirmed || 0,
      cancelled: stats.cancelled || 0,
      completed: stats.completed || 0,
      averageRating: stats.averageRating || 0,
    }
  }
}
