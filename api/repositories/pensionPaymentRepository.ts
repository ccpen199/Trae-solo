import BaseRepository from './base.js'
import type { PaginationParams, PaginationResult } from './base.js'
import { queryOne } from '../db.js'

interface PensionPayment {
  id: number
  userId: number
  payMonth: string
  amount: number
  bankName: string | null
  bankAccount: string | null
  status: 'pending' | 'paid' | 'failed'
  paidAt: string | null
}

interface PensionPaymentCreateData {
  userId: number
  payMonth: string
  amount: number
  bankName?: string
  bankAccount?: string
  status?: 'pending' | 'paid' | 'failed'
}

interface PensionPaymentUpdateData {
  status?: 'pending' | 'paid' | 'failed'
  paidAt?: string
  bankName?: string
  bankAccount?: string
}

class PensionPaymentRepository extends BaseRepository<PensionPayment> {
  constructor() {
    super('pension_payments')
  }

  findByUserId(userId: number, pagination: PaginationParams = {}): PaginationResult<PensionPayment> {
    return this.findPaginated(
      pagination,
      [{ field: 'user_id', value: userId }],
      'pay_month',
      'DESC',
    )
  }

  findByUserIdAndMonth(userId: number, payMonth: string): PensionPayment | undefined {
    return this.findOne([
      { field: 'user_id', value: userId },
      { field: 'pay_month', value: payMonth },
    ])
  }

  findByUserIdAndStatus(userId: number, status: string, pagination: PaginationParams = {}): PaginationResult<PensionPayment> {
    return this.findPaginated(
      pagination,
      [
        { field: 'user_id', value: userId },
        { field: 'status', value: status },
      ],
      'pay_month',
      'DESC',
    )
  }

  create(data: PensionPaymentCreateData): { id: number; changes: number } {
    const paymentData = {
      user_id: data.userId,
      pay_month: data.payMonth,
      amount: data.amount,
      bank_name: data.bankName || null,
      bank_account: data.bankAccount || null,
      status: data.status || 'paid',
    }
    return super.create(paymentData as Partial<PensionPayment>)
  }

  update(id: number, data: PensionPaymentUpdateData): { changes: number } {
    const updateData: Partial<PensionPayment> = {}
    if (data.status !== undefined) {
      ;(updateData as Record<string, unknown>).status = data.status
    }
    if (data.paidAt !== undefined) {
      ;(updateData as Record<string, unknown>).paid_at = data.paidAt
    }
    if (data.bankName !== undefined) {
      ;(updateData as Record<string, unknown>).bank_name = data.bankName
    }
    if (data.bankAccount !== undefined) {
      ;(updateData as Record<string, unknown>).bank_account = data.bankAccount
    }
    return super.update(id, updateData)
  }

  markAsPaid(id: number): { changes: number } {
    return this.update(id, {
      status: 'paid',
      paidAt: new Date().toISOString(),
    })
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

const pensionPaymentRepository = new PensionPaymentRepository()

export default pensionPaymentRepository
export { PensionPaymentRepository, type PensionPayment, type PensionPaymentCreateData, type PensionPaymentUpdateData }
