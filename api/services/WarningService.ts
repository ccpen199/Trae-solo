import warningRepository from '../repositories/warningRepository.js'
import type { PaymentWarning } from '../../shared/types/index.js'
import type { PaginationParams } from '../repositories/base.js'
import { query } from '../db.js'

interface WarningListResponse {
  success: boolean
  items: PaymentWarning[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  error?: string
  stats: {
    pending: number
    processing: number
    resolved: number
    ignored: number
  }
}

interface HandleWarningRequest {
  handleNote: string
  status?: 'processing' | 'resolved' | 'ignored'
}

interface HandleWarningResponse {
  success: boolean
  id: number
  status: string
  handledAt: string
  message: string
  error?: string
}

interface GenerateWarningRequest {
  userId: number
  warningType: 'break_pay' | 'abnormal_amount' | 'suspected_fraud'
  severity: 'low' | 'medium' | 'high'
  description: string
}

class WarningService {
  getWarningList(pagination: PaginationParams = {}): WarningListResponse {
    const result = warningRepository.findAllPaginated(pagination)
    const stats = {
      pending: warningRepository.countByStatus('pending'),
      processing: warningRepository.countByStatus('processing'),
      resolved: warningRepository.countByStatus('resolved'),
      ignored: warningRepository.countByStatus('ignored'),
    }

    return {
      success: true,
      items: result.items as unknown as PaymentWarning[],
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
      stats,
    }
  }

  handleWarning(warningId: number, handlerId: number, request: HandleWarningRequest): HandleWarningResponse {
    const warning = warningRepository.findById(warningId)
    if (!warning) {
      throw new Error('预警记录不存在')
    }

    const status = request.status || 'resolved'
    warningRepository.handle(warningId, handlerId, request.handleNote, status)

    return {
      success: true,
      id: warningId,
      status,
      handledAt: new Date().toISOString(),
      message: '预警处理成功',
    }
  }

  generateWarning(request: GenerateWarningRequest): { id: number; message: string } {
    const result = warningRepository.create({
      userId: request.userId,
      warningType: request.warningType,
      severity: request.severity,
      description: request.description,
    })

    return {
      id: result.id,
      message: '预警生成成功',
    }
  }

  generateBreakPayWarnings(): number {
    const sql = `
      SELECT DISTINCT ii.user_id
      FROM insurance_info ii
      LEFT JOIN payment_orders po ON ii.user_id = po.user_id 
        AND po.status = 'paid' 
        AND po.created_at >= date('now', '-3 months')
      WHERE ii.status = 'insured'
        AND po.id IS NULL
    `
    const users = query<{ user_id: number }>(sql)

    let count = 0
    for (const user of users) {
      const existing = warningRepository.findOne([
        { field: 'user_id', value: user.user_id },
        { field: 'warning_type', value: 'break_pay' },
        { field: 'status', value: 'pending' },
      ])
      if (!existing) {
        warningRepository.create({
          userId: user.user_id,
          warningType: 'break_pay',
          severity: 'medium',
          description: '用户连续3个月未缴费，可能存在断缴风险',
        })
        count++
      }
    }

    return count
  }
}

const warningService = new WarningService()

export default warningService
export { WarningService, type WarningListResponse, type HandleWarningRequest, type HandleWarningResponse, type GenerateWarningRequest }
