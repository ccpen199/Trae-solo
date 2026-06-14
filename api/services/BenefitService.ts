import pensionPaymentRepository from '../repositories/pensionPaymentRepository.js'
import insuranceRepository from '../repositories/insuranceRepository.js'
import type { PensionPayment, InsuranceInfo } from '../../shared/types/index.js'
import type { PaginationParams, PaginationResult } from '../repositories/base.js'

interface PensionListResponse {
  success: boolean
  items: PensionPayment[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  totalAmount: number
}

interface MedicalListResponse {
  success: boolean
  items: Array<{
    id: number
    insuranceType: string
    payMonth: string
    amount: number
    status: string
    creditedAt: string
  }>
  total: number
  page: number
  pageSize: number
  totalPages: number
  totalAmount: number
}

interface PensionStatsResponse {
  totalAmount: number
  currentMonthAmount: number
  averageAmount: number
}

interface MedicalBalanceResponse {
  balance: number
  lastUpdate: string
}

class BenefitService {
  getPensionList(userId: number, pagination: PaginationParams = {}): PensionListResponse {
    const result = pensionPaymentRepository.findByUserId(userId, pagination)
    const totalAmount = pensionPaymentRepository.sumAmountByUserId(userId, 'paid')

    return {
      success: true,
      items: result.items as unknown as PensionPayment[],
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
      totalAmount,
    }
  }

  getMedicalList(userId: number, pagination: PaginationParams = {}): MedicalListResponse {
    const insuranceList = insuranceRepository.findByUserIdAndStatus(userId, 'insured')
    const medicalInsurance = insuranceList.filter(ins => 
      ins.insuranceType.includes('medical')
    )

    const items: Array<{
      id: number
      insuranceType: string
      payMonth: string
      amount: number
      status: string
      creditedAt: string
    }> = []

    medicalInsurance.forEach(insurance => {
      const history = this.generateMedicalHistory(insurance as unknown as InsuranceInfo)
      items.push(...history)
    })

    const page = pagination.page || 1
    const pageSize = pagination.pageSize || 10
    const total = items.length
    const totalPages = Math.ceil(total / pageSize)
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedItems = items.slice(startIndex, endIndex)

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

    return {
      success: true,
      items: paginatedItems,
      total,
      page,
      pageSize,
      totalPages,
      totalAmount,
    }
  }

  getPensionStats(userId: number): PensionStatsResponse {
    const result = pensionPaymentRepository.findByUserId(userId, { page: 1, pageSize: 1000 })
    const paidItems = result.items.filter(item => item.status === 'paid')
    const totalAmount = paidItems.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const currentMonth = new Date().toISOString().slice(0, 7)
    const currentMonthAmount = paidItems
      .filter(item => item.payMonth === currentMonth)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)

    return {
      totalAmount,
      currentMonthAmount,
      averageAmount: paidItems.length > 0 ? Math.round((totalAmount / paidItems.length) * 100) / 100 : 0,
    }
  }

  getMedicalBalance(userId: number): MedicalBalanceResponse {
    const insuranceList = insuranceRepository.findByUserIdAndStatus(userId, 'insured')
    const balance = insuranceList
      .filter(insurance => insurance.insuranceType.includes('medical'))
      .reduce((sum, insurance) => sum + Number(insurance.personalAccount || 0), 0)

    return {
      balance,
      lastUpdate: new Date().toISOString(),
    }
  }

  private generateMedicalHistory(insurance: InsuranceInfo): Array<{
    id: number
    insuranceType: string
    payMonth: string
    amount: number
    status: string
    creditedAt: string
  }> {
    const history: Array<{
      id: number
      insuranceType: string
      payMonth: string
      amount: number
      status: string
      creditedAt: string
    }> = []

    const now = new Date()
    const insuredDate = new Date(insurance.insuredAt)
    const monthlyAmount = Math.round(insurance.payGrade * 0.04 * 100) / 100

    let currentDate = new Date(insuredDate)
    let monthsGenerated = 0
    let idCounter = insurance.id * 1000

    while (currentDate <= now && monthsGenerated < insurance.totalMonths) {
      const year = currentDate.getFullYear()
      const month = String(currentDate.getMonth() + 1).padStart(2, '0')
      const payMonth = `${year}-${month}`
      const creditedAt = new Date(currentDate)
      creditedAt.setDate(creditedAt.getDate() + 5)

      history.push({
        id: idCounter++,
        insuranceType: insurance.insuranceType,
        payMonth,
        amount: monthlyAmount,
        status: 'credited',
        creditedAt: creditedAt.toISOString(),
      })

      currentDate.setMonth(currentDate.getMonth() + 1)
      monthsGenerated++
    }

    return history.reverse()
  }
}

const benefitService = new BenefitService()

export default benefitService
export { BenefitService, type PensionListResponse, type MedicalListResponse, type PensionStatsResponse, type MedicalBalanceResponse }
