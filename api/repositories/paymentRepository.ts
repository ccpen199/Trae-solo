import BaseRepository from './base.js'
import type { PaginationParams, PaginationResult, WhereCondition } from './base.js'
import { queryOne } from '../db.js'

interface PaymentOrder {
  id: number
  orderNo: string
  userId: number
  insuranceType: string
  payYear: number
  payGrade: number
  amount: number
  channel: 'wechat' | 'alipay' | 'dc_epay' | 'bank'
  status: 'pending' | 'paid' | 'cancelled' | 'refunded'
  taxInvoiceStatus: 'pending' | 'issued' | 'failed'
  financeStatus: 'pending' | 'warehoused' | 'failed'
  medicalCreditStatus: 'pending' | 'credited' | 'failed'
  paidAt: string | null
  createdAt: string
}

interface PaymentCreateData {
  orderNo: string
  userId: number
  insuranceType: string
  payYear: number
  payGrade: number
  amount: number
  channel: 'wechat' | 'alipay' | 'dc_epay' | 'bank'
}

interface PaymentUpdateData {
  status?: 'pending' | 'paid' | 'cancelled' | 'refunded'
  channel?: 'wechat' | 'alipay' | 'dc_epay' | 'bank'
  taxInvoiceStatus?: 'pending' | 'issued' | 'failed'
  financeStatus?: 'pending' | 'warehoused' | 'failed'
  medicalCreditStatus?: 'pending' | 'credited' | 'failed'
  paidAt?: string
}

interface PaymentQueryParams extends PaginationParams {
  userId?: number
  status?: string
  insuranceType?: string
  payYear?: number
  startDate?: string
  endDate?: string
}

class PaymentRepository extends BaseRepository<PaymentOrder> {
  constructor() {
    super('payment_orders')
  }

  findByOrderNo(orderNo: string): PaymentOrder | undefined {
    return this.findOne([{ field: 'order_no', value: orderNo }])
  }

  findByUserId(userId: number, pagination: PaginationParams = {}): PaginationResult<PaymentOrder> {
    return this.findPaginated(
      pagination,
      [{ field: 'user_id', value: userId }],
      'created_at',
      'DESC',
    )
  }

  findByUserIdAndStatus(userId: number, status: string, pagination: PaginationParams = {}): PaginationResult<PaymentOrder> {
    return this.findPaginated(
      pagination,
      [
        { field: 'user_id', value: userId },
        { field: 'status', value: status },
      ],
      'created_at',
      'DESC',
    )
  }

  findByStatus(status: string, pagination: PaginationParams = {}): PaginationResult<PaymentOrder> {
    return this.findPaginated(
      pagination,
      [{ field: 'status', value: status }],
      'created_at',
      'DESC',
    )
  }

  findQuery(params: PaymentQueryParams): PaginationResult<PaymentOrder> {
    const { page, pageSize, userId, status, insuranceType, payYear, startDate, endDate } = params
    const conditions: WhereCondition[] = []

    if (userId !== undefined) {
      conditions.push({ field: 'user_id', value: userId })
    }
    if (status !== undefined) {
      conditions.push({ field: 'status', value: status })
    }
    if (insuranceType !== undefined) {
      conditions.push({ field: 'insurance_type', value: insuranceType })
    }
    if (payYear !== undefined) {
      conditions.push({ field: 'pay_year', value: payYear })
    }
    if (startDate !== undefined) {
      conditions.push({ field: 'created_at', operator: '>=', value: startDate })
    }
    if (endDate !== undefined) {
      conditions.push({ field: 'created_at', operator: '<=', value: endDate })
    }

    return this.findPaginated(
      { page, pageSize },
      conditions,
      'created_at',
      'DESC',
    )
  }

  create(data: PaymentCreateData): { id: number; changes: number } {
    const paymentData = {
      order_no: data.orderNo,
      user_id: data.userId,
      insurance_type: data.insuranceType,
      pay_year: data.payYear,
      pay_grade: data.payGrade,
      amount: data.amount,
      channel: data.channel,
      status: 'pending' as const,
      tax_invoice_status: 'pending' as const,
      finance_status: 'pending' as const,
      medical_credit_status: 'pending' as const,
    }
    return super.create(paymentData as Partial<PaymentOrder>)
  }

  update(id: number, data: PaymentUpdateData): { changes: number } {
    const updateData: Partial<PaymentOrder> = {}
    if (data.status !== undefined) {
      ;(updateData as Record<string, unknown>).status = data.status
    }
    if (data.channel !== undefined) {
      ;(updateData as Record<string, unknown>).channel = data.channel
    }
    if (data.taxInvoiceStatus !== undefined) {
      ;(updateData as Record<string, unknown>).tax_invoice_status = data.taxInvoiceStatus
    }
    if (data.financeStatus !== undefined) {
      ;(updateData as Record<string, unknown>).finance_status = data.financeStatus
    }
    if (data.medicalCreditStatus !== undefined) {
      ;(updateData as Record<string, unknown>).medical_credit_status = data.medicalCreditStatus
    }
    if (data.paidAt !== undefined) {
      ;(updateData as Record<string, unknown>).paid_at = data.paidAt
    }
    return super.update(id, updateData)
  }

  updateStatus(id: number, status: string): { changes: number } {
    return this.update(id, { status: status as PaymentOrder['status'] })
  }

  markAsPaid(id: number, paidAt?: string): { changes: number } {
    return this.update(id, {
      status: 'paid',
      paidAt: paidAt || new Date().toISOString(),
    })
  }

  updateTaxInvoiceStatus(id: number, status: string): { changes: number } {
    return this.update(id, { taxInvoiceStatus: status as PaymentOrder['taxInvoiceStatus'] })
  }

  updateFinanceStatus(id: number, status: string): { changes: number } {
    return this.update(id, { financeStatus: status as PaymentOrder['financeStatus'] })
  }

  updateMedicalCreditStatus(id: number, status: string): { changes: number } {
    return this.update(id, { medicalCreditStatus: status as PaymentOrder['medicalCreditStatus'] })
  }

  countByUserIdAndStatus(userId: number, status: string): number {
    return this.count([
      { field: 'user_id', value: userId },
      { field: 'status', value: status },
    ])
  }

  sumAmountByUserId(userId: number, status?: string): number {
    const conditions: { field: string; value: unknown }[] = [{ field: 'user_id', value: userId }]
    if (status) {
      conditions.push({ field: 'status', value: status })
    }
    const whereClauses = conditions.map(c => `${c.field} = ?`).join(' AND ')
    const params = conditions.map(c => c.value)

    const sql = `SELECT COALESCE(SUM(amount), 0) as total FROM ${this.tableName} WHERE ${whereClauses}`
    const result = queryOne<{ total: number }>(sql, params)
    return result?.total || 0
  }
}

const paymentRepository = new PaymentRepository()

export default paymentRepository
export { PaymentRepository, type PaymentOrder, type PaymentCreateData, type PaymentUpdateData, type PaymentQueryParams }
