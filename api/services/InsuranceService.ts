import insuranceRepository, { type InsuranceInfo } from '../repositories/insuranceRepository.js'
import type { PaginationParams, PaginationResult } from '../repositories/base.js'

interface InsuranceHistoryEntry {
  id: number
  insuranceId: number
  changeType: 'status_change' | 'grade_change' | 'payment'
  oldValue?: string | number
  newValue?: string | number
  operatorId?: number
  operatedAt: string
  remark?: string
}

interface InsuranceListResult {
  success: boolean
  items?: InsuranceInfo[]
  total?: number
  page?: number
  pageSize?: number
  totalPages?: number
  error?: string
}

interface InsuranceHistoryResult {
  success: boolean
  list?: InsuranceHistoryEntry[]
  error?: string
}

interface InsuranceStatusResult {
  success: boolean
  valid?: boolean
  insurance?: InsuranceInfo
  error?: string
}

class InsuranceService {
  private static instance: InsuranceService

  private constructor() {}

  static getInstance(): InsuranceService {
    if (!InsuranceService.instance) {
      InsuranceService.instance = new InsuranceService()
    }
    return InsuranceService.instance
  }

  getInsuranceList(userId: number, pagination: PaginationParams = {}): InsuranceListResult {
    const result = insuranceRepository.findByUserId(userId)

    return {
      success: true,
      items: result,
      total: result.length,
      page: pagination.page || 1,
      pageSize: pagination.pageSize || 10,
      totalPages: Math.ceil(result.length / (pagination.pageSize || 10)),
    }
  }

  getUserInsurance(userId: number): InsuranceListResult {
    const list = insuranceRepository.findByUserId(userId)

    return {
      success: true,
      items: list,
      total: list.length,
      page: 1,
      pageSize: 10,
      totalPages: Math.ceil(list.length / 10),
    }
  }

  getInsuranceHistory(userId: number, insuranceId: number): InsuranceHistoryResult
  getInsuranceHistory(insuranceId: number): InsuranceHistoryResult
  getInsuranceHistory(
    userIdOrInsuranceId: number,
    insuranceId?: number): InsuranceHistoryResult {
    const id = insuranceId !== undefined ? insuranceId : userIdOrInsuranceId

    const insurance = insuranceRepository.findById(id)

    if (!insurance) {
      return {
        success: false,
        error: '参保信息不存在',
      }
    }

    const mockHistory: InsuranceHistoryEntry[] = [
      {
        id: 1,
        insuranceId: id,
        changeType: 'payment',
        oldValue: insurance.totalMonths - 12,
        newValue: insurance.totalMonths,
        operatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        remark: '年度缴费',
      },
      {
        id: 2,
        insuranceId: id,
        changeType: 'status_change',
        oldValue: 'suspended',
        newValue: 'insured',
        operatorId: 1,
        operatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        remark: '恢复参保',
      },
      {
        id: 3,
        insuranceId: id,
        changeType: 'grade_change',
        oldValue: insurance.payGrade - 1,
        newValue: insurance.payGrade,
        operatorId: 1,
        operatedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        remark: '调整缴费档次',
      },
    ]

    return {
      success: true,
      list: mockHistory,
    }
  }

  validateInsuranceStatus(userId: number, insuranceType: string): InsuranceStatusResult {
    const insurance = insuranceRepository.findByUserIdAndType(userId, insuranceType)

    if (!insurance) {
      return {
        success: false,
        error: '未查询到对应险种参保信息',
      }
    }

    const valid = insurance.status === 'insured'

    return {
      success: true,
      valid,
      insurance,
    }
  }
}

const insuranceService = InsuranceService.getInstance()

export default insuranceService
export { InsuranceService, type InsuranceHistoryEntry, type InsuranceListResult, type InsuranceHistoryResult, type InsuranceStatusResult }
