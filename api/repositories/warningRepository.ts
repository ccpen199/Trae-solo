import BaseRepository from './base.js'
import type { PaginationParams, PaginationResult } from './base.js'

interface PaymentWarning {
  id: number
  userId: number
  warningType: 'break_pay' | 'abnormal_amount' | 'suspected_fraud'
  severity: 'low' | 'medium' | 'high'
  description: string | null
  status: 'pending' | 'processing' | 'resolved' | 'ignored'
  handlerId: number | null
  handledAt: string | null
  handleNote: string | null
  triggeredAt: string | null
}

interface WarningCreateData {
  userId: number
  warningType: 'break_pay' | 'abnormal_amount' | 'suspected_fraud'
  severity: 'low' | 'medium' | 'high'
  description?: string
}

interface WarningUpdateData {
  status?: 'pending' | 'processing' | 'resolved' | 'ignored'
  handlerId?: number
  handledAt?: string
  handleNote?: string
}

class WarningRepository extends BaseRepository<PaymentWarning> {
  constructor() {
    super('payment_warnings')
  }

  findByUserId(userId: number, pagination: PaginationParams = {}): PaginationResult<PaymentWarning> {
    return this.findPaginated(
      pagination,
      [{ field: 'user_id', value: userId }],
      'triggered_at',
      'DESC',
    )
  }

  findByStatus(status: string, pagination: PaginationParams = {}): PaginationResult<PaymentWarning> {
    return this.findPaginated(
      pagination,
      [{ field: 'status', value: status }],
      'triggered_at',
      'DESC',
    )
  }

  findBySeverity(severity: string, pagination: PaginationParams = {}): PaginationResult<PaymentWarning> {
    return this.findPaginated(
      pagination,
      [{ field: 'severity', value: severity }],
      'triggered_at',
      'DESC',
    )
  }

  findAllPaginated(pagination: PaginationParams = {}): PaginationResult<PaymentWarning> {
    return this.findPaginated(
      pagination,
      [],
      'triggered_at',
      'DESC',
    )
  }

  create(data: WarningCreateData): { id: number; changes: number } {
    const warningData = {
      user_id: data.userId,
      warning_type: data.warningType,
      severity: data.severity,
      description: data.description || null,
      status: 'pending' as const,
    }
    return super.create(warningData as Partial<PaymentWarning>)
  }

  update(id: number, data: WarningUpdateData): { changes: number } {
    const updateData: Partial<PaymentWarning> = {}
    if (data.status !== undefined) {
      ;(updateData as Record<string, unknown>).status = data.status
    }
    if (data.handlerId !== undefined) {
      ;(updateData as Record<string, unknown>).handler_id = data.handlerId
    }
    if (data.handledAt !== undefined) {
      ;(updateData as Record<string, unknown>).handled_at = data.handledAt
    }
    if (data.handleNote !== undefined) {
      ;(updateData as Record<string, unknown>).handle_note = data.handleNote
    }
    return super.update(id, updateData)
  }

  handle(id: number, handlerId: number, handleNote: string, status: 'processing' | 'resolved' | 'ignored' = 'resolved'): { changes: number } {
    return this.update(id, {
      status,
      handlerId,
      handledAt: new Date().toISOString(),
      handleNote,
    })
  }

  countByStatus(status: string): number {
    return this.count([{ field: 'status', value: status }])
  }

  countBySeverity(severity: string): number {
    return this.count([{ field: 'severity', value: severity }])
  }
}

const warningRepository = new WarningRepository()

export default warningRepository
export { WarningRepository, type PaymentWarning, type WarningCreateData, type WarningUpdateData }
