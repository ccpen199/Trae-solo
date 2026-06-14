import BaseRepository from './base.js'

interface InsuranceInfo {
  id: number
  userId: number
  insuranceType: 'pension' | 'medical' | 'flexible_pension' | 'flexible_medical'
  status: 'insured' | 'suspended' | 'terminated'
  payGrade: number
  totalMonths: number
  governmentSubsidy: number
  personalAccount: number
  insuredAt: string
}

interface InsuranceCreateData {
  userId: number
  insuranceType: 'pension' | 'medical' | 'flexible_pension' | 'flexible_medical'
  status?: 'insured' | 'suspended' | 'terminated'
  payGrade: number
  totalMonths?: number
  governmentSubsidy?: number
  personalAccount?: number
}

interface InsuranceUpdateData {
  status?: 'insured' | 'suspended' | 'terminated'
  payGrade?: number
  totalMonths?: number
  governmentSubsidy?: number
  personalAccount?: number
}

class InsuranceRepository extends BaseRepository<InsuranceInfo> {
  constructor() {
    super('insurance_info')
  }

  findByUserId(userId: number): InsuranceInfo[] {
    return this.findAll([{ field: 'user_id', value: userId }], 'insured_at', 'DESC')
  }

  findByUserIdAndType(userId: number, insuranceType: string): InsuranceInfo | undefined {
    return this.findOne([
      { field: 'user_id', value: userId },
      { field: 'insurance_type', value: insuranceType },
    ])
  }

  findByUserIdAndStatus(userId: number, status: string): InsuranceInfo[] {
    return this.findAll([
      { field: 'user_id', value: userId },
      { field: 'status', value: status },
    ], 'insured_at', 'DESC')
  }

  create(data: InsuranceCreateData): { id: number; changes: number } {
    const insuranceData = {
      user_id: data.userId,
      insurance_type: data.insuranceType,
      status: data.status || 'insured',
      pay_grade: data.payGrade,
      total_months: data.totalMonths || 0,
      government_subsidy: data.governmentSubsidy || 0,
      personal_account: data.personalAccount || 0,
    }
    return super.create(insuranceData as Partial<InsuranceInfo>)
  }

  update(id: number, data: InsuranceUpdateData): { changes: number } {
    const updateData: Partial<InsuranceInfo> = {}
    if (data.status !== undefined) {
      ;(updateData as Record<string, unknown>).status = data.status
    }
    if (data.payGrade !== undefined) {
      ;(updateData as Record<string, unknown>).pay_grade = data.payGrade
    }
    if (data.totalMonths !== undefined) {
      ;(updateData as Record<string, unknown>).total_months = data.totalMonths
    }
    if (data.governmentSubsidy !== undefined) {
      ;(updateData as Record<string, unknown>).government_subsidy = data.governmentSubsidy
    }
    if (data.personalAccount !== undefined) {
      ;(updateData as Record<string, unknown>).personal_account = data.personalAccount
    }
    return super.update(id, updateData)
  }

  updateTotalMonths(id: number, months: number): { changes: number } {
    return this.update(id, { totalMonths: months })
  }

  addMonths(id: number, addMonths: number): { changes: number } {
    const insurance = this.findById(id)
    if (!insurance) {
      return { changes: 0 }
    }
    return this.update(id, { totalMonths: insurance.totalMonths + addMonths })
  }

  updatePersonalAccount(id: number, amount: number): { changes: number } {
    return this.update(id, { personalAccount: amount })
  }
}

const insuranceRepository = new InsuranceRepository()

export default insuranceRepository
export { InsuranceRepository, type InsuranceInfo, type InsuranceCreateData, type InsuranceUpdateData }
