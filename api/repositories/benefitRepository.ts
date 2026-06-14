import BaseRepository from './base.js'
import type { PensionPayment } from '../../shared/types/index.js'
import { query } from '../db.js'

interface MedicalCredit {
  id: number
  userId: number
  creditYear: number
  amount: number
  creditedAt: string
}

interface PensionPaymentCreateData {
  userId: number
  payMonth: string
  amount: number
  bankName?: string
  bankAccount?: string
  status?: 'pending' | 'paid' | 'failed'
}

class BenefitRepository extends BaseRepository<PensionPayment> {
  constructor() {
    super('pension_payments')
  }

  findPensionByUserId(userId: number): PensionPayment[] {
    return this.findAll([{ field: 'user_id', value: userId }], 'pay_month', 'DESC')
  }

  findMedicalCreditByUserId(userId: number): MedicalCredit[] {
    const sql = `SELECT * FROM medical_credits WHERE user_id = ? ORDER BY credit_year DESC`
    return query<MedicalCredit>(sql, [userId])
  }

  createPensionPayment(data: PensionPaymentCreateData): { id: number; changes: number } {
    const paymentData = {
      user_id: data.userId,
      pay_month: data.payMonth,
      amount: data.amount,
      bank_name: data.bankName || '',
      bank_account: data.bankAccount || '',
      status: data.status || 'paid',
    }
    return super.create(paymentData as Partial<PensionPayment>)
  }
}

const benefitRepository = new BenefitRepository()

export default benefitRepository
export { BenefitRepository, type PensionPaymentCreateData, type MedicalCredit }
