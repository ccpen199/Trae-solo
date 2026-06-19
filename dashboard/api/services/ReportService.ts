import { Repository, Between, In } from 'typeorm'
import { AppDataSource } from '../data-source.js'
import { CouponActivity } from '../entities/CouponActivity.js'
import { VerificationRecord } from '../entities/VerificationRecord.js'
import { Merchant } from '../entities/Merchant.js'
import { SettlementRecord } from '../entities/SettlementRecord.js'
import { RiskEvent } from '../entities/RiskEvent.js'
import { getStartOfDay, getEndOfDay, formatDate, getDateRange } from '../utils/date.js'
import type { DashboardStats, VerificationTrendData } from '../../../shared/types/index.js'

export class ReportService {
  private activityRepository: Repository<CouponActivity>
  private verificationRepository: Repository<VerificationRecord>
  private merchantRepository: Repository<Merchant>
  private settlementRepository: Repository<SettlementRecord>
  private riskRepository: Repository<RiskEvent>

  constructor() {
    this.activityRepository = AppDataSource.getRepository(CouponActivity)
    this.verificationRepository = AppDataSource.getRepository(VerificationRecord)
    this.merchantRepository = AppDataSource.getRepository(Merchant)
    this.settlementRepository = AppDataSource.getRepository(SettlementRecord)
    this.riskRepository = AppDataSource.getRepository(RiskEvent)
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const [activities, merchants, todayRecords] = await Promise.all([
      this.activityRepository.find(),
      this.merchantRepository.find({ where: { status: 'active' } }),
      this.verificationRepository.find({
        where: {
          verifiedAt: Between(getStartOfDay(), getEndOfDay()),
          status: 'success',
        },
      }),
    ])

    let totalCoupons = 0
    let usedCoupons = 0
    let totalAmount = 0
    let totalSubsidy = 0
    let activeActivities = 0

    for (const activity of activities) {
      totalCoupons += activity.totalQuantity
      usedCoupons += activity.usedQuantity
      if (activity.status === 'active') {
        activeActivities++
      }
    }

    for (const record of todayRecords) {
      totalAmount += record.amount
      totalSubsidy += record.discountAmount
    }

    const verificationRate = totalCoupons > 0 ? usedCoupons / totalCoupons : 0
    const todayVerifications = todayRecords.length
    const todayAmount = todayRecords.reduce((sum, r) => sum + r.amount, 0)
    const activeMerchants = merchants.length

    return {
      totalCoupons,
      usedCoupons,
      verificationRate,
      totalAmount,
      totalSubsidy,
      activeActivities,
      activeMerchants,
      todayVerifications,
      todayAmount,
    }
  }

  async getVerificationTrend(days: number = 30): Promise<VerificationTrendData[]> {
    const endDate = getEndOfDay()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days + 1)
    startDate.setHours(0, 0, 0, 0)

    const records = await this.verificationRepository.find({
      where: {
        verifiedAt: Between(startDate, endDate),
        status: 'success',
      },
      order: { verifiedAt: 'ASC' },
    })

    const dailyData = new Map<string, VerificationTrendData>()
    const dateRange = getDateRange(startDate, endDate)

    for (const date of dateRange) {
      const dateKey = formatDate(date)
      dailyData.set(dateKey, {
        date: dateKey,
        count: 0,
        amount: 0,
        discountAmount: 0,
      })
    }

    for (const record of records) {
      const dateKey = formatDate(record.verifiedAt)
      const data = dailyData.get(dateKey)
      if (data) {
        data.count++
        data.amount += record.amount
        data.discountAmount += record.discountAmount
      }
    }

    return Array.from(dailyData.values())
  }

  async getCategoryDistribution(): Promise<{ category: string; count: number; amount: number }[]> {
    const merchants = await this.merchantRepository.find({
      select: ['id', 'category'],
    })

    const merchantCategories = new Map(merchants.map(m => [m.id, m.category]))

    const records = await this.verificationRepository.find({
      where: { status: 'success' },
    })

    const categoryStats = new Map<string, { count: number; amount: number }>()

    for (const record of records) {
      const category = merchantCategories.get(record.merchantId) || '其他'
      const stats = categoryStats.get(category) || { count: 0, amount: 0 }
      stats.count++
      stats.amount += record.amount
      categoryStats.set(category, stats)
    }

    return Array.from(categoryStats.entries()).map(([category, stats]) => ({
      category,
      count: stats.count,
      amount: stats.amount,
    }))
  }

  async getDistrictDistribution(): Promise<{ district: string; count: number; amount: number }[]> {
    const merchants = await this.merchantRepository.find({
      select: ['id', 'district'],
    })

    const merchantDistricts = new Map(merchants.map(m => [m.id, m.district]))

    const records = await this.verificationRepository.find({
      where: { status: 'success' },
    })

    const districtStats = new Map<string, { count: number; amount: number }>()

    for (const record of records) {
      const district = merchantDistricts.get(record.merchantId) || '未知'
      const stats = districtStats.get(district) || { count: 0, amount: 0 }
      stats.count++
      stats.amount += record.amount
      districtStats.set(district, stats)
    }

    return Array.from(districtStats.entries()).map(([district, stats]) => ({
      district,
      count: stats.count,
      amount: stats.amount,
    }))
  }

  async getActivityPerformance(activityId: string): Promise<{
    activity: CouponActivity
    verificationRate: number
    totalAmount: number
    totalDiscount: number
    avgOrderValue: number
    dailyTrend: VerificationTrendData[]
  }> {
    const activity = await this.activityRepository.findOne({ where: { id: activityId } })
    if (!activity) {
      throw new Error('Activity not found')
    }

    const records = await this.verificationRepository.find({
      where: { activityId, status: 'success' },
    })

    const verificationRate = activity.totalQuantity > 0 ? records.length / activity.totalQuantity : 0
    const totalAmount = records.reduce((sum, r) => sum + r.amount, 0)
    const totalDiscount = records.reduce((sum, r) => sum + r.discountAmount, 0)
    const avgOrderValue = records.length > 0 ? totalAmount / records.length : 0

    const dailyData = new Map<string, VerificationTrendData>()
    
    for (const record of records) {
      const dateKey = formatDate(record.verifiedAt)
      const data = dailyData.get(dateKey) || {
        date: dateKey,
        count: 0,
        amount: 0,
        discountAmount: 0,
      }
      data.count++
      data.amount += record.amount
      data.discountAmount += record.discountAmount
      dailyData.set(dateKey, data)
    }

    const dailyTrend = Array.from(dailyData.values()).sort((a, b) => a.date.localeCompare(b.date))

    return {
      activity,
      verificationRate,
      totalAmount,
      totalDiscount,
      avgOrderValue,
      dailyTrend,
    }
  }

  async getMerchantPerformance(
    merchantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    merchant: Merchant
    totalVerifications: number
    totalAmount: number
    totalDiscount: number
    avgOrderValue: number
    dailyTrend: VerificationTrendData[]
  }> {
    const merchant = await this.merchantRepository.findOne({ where: { id: merchantId } })
    if (!merchant) {
      throw new Error('Merchant not found')
    }

    const where: Record<string, unknown> = { merchantId, status: 'success' }
    if (startDate && endDate) {
      where.verifiedAt = Between(startDate, endDate)
    }

    const records = await this.verificationRepository.find({ where })

    const totalVerifications = records.length
    const totalAmount = records.reduce((sum, r) => sum + r.amount, 0)
    const totalDiscount = records.reduce((sum, r) => sum + r.discountAmount, 0)
    const avgOrderValue = records.length > 0 ? totalAmount / records.length : 0

    const dailyData = new Map<string, VerificationTrendData>()
    
    for (const record of records) {
      const dateKey = formatDate(record.verifiedAt)
      const data = dailyData.get(dateKey) || {
        date: dateKey,
        count: 0,
        amount: 0,
        discountAmount: 0,
      }
      data.count++
      data.amount += record.amount
      data.discountAmount += record.discountAmount
      dailyData.set(dateKey, data)
    }

    const dailyTrend = Array.from(dailyData.values()).sort((a, b) => a.date.localeCompare(b.date))

    return {
      merchant,
      totalVerifications,
      totalAmount,
      totalDiscount,
      avgOrderValue,
      dailyTrend,
    }
  }

  async getSettlementReport(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalSettlements: number
    totalAmount: number
    totalSubsidy: number
    byMerchant: { merchantId: string; merchantName: string; amount: number; subsidy: number }[]
  }> {
    const settlements = await this.settlementRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
        status: In(['approved', 'transferred']),
      },
      relations: ['merchant'],
    })

    let totalSettlements = settlements.length
    let totalAmount = 0
    let totalSubsidy = 0
    const byMerchantMap = new Map<string, { merchantId: string; merchantName: string; amount: number; subsidy: number }>()

    for (const s of settlements) {
      totalAmount += s.totalAmount
      totalSubsidy += s.subsidyAmount
      
      const existing = byMerchantMap.get(s.merchantId) || {
        merchantId: s.merchantId,
        merchantName: s.merchant?.name || '未知商户',
        amount: 0,
        subsidy: 0,
      }
      existing.amount += s.totalAmount
      existing.subsidy += s.subsidyAmount
      byMerchantMap.set(s.merchantId, existing)
    }

    return {
      totalSettlements,
      totalAmount,
      totalSubsidy,
      byMerchant: Array.from(byMerchantMap.values()),
    }
  }

  async getRiskReport(startDate: Date, endDate: Date): Promise<{
    totalEvents: number
    byType: { type: string; count: number }[]
    byLevel: { level: string; count: number }[]
    byStatus: { status: string; count: number }[]
  }> {
    const events = await this.riskRepository.find({
      where: { detectedAt: Between(startDate, endDate) },
    })

    const byType = new Map<string, number>()
    const byLevel = new Map<string, number>()
    const byStatus = new Map<string, number>()

    for (const event of events) {
      byType.set(event.type, (byType.get(event.type) || 0) + 1)
      byLevel.set(event.level, (byLevel.get(event.level) || 0) + 1)
      byStatus.set(event.status, (byStatus.get(event.status) || 0) + 1)
    }

    return {
      totalEvents: events.length,
      byType: Array.from(byType.entries()).map(([type, count]) => ({ type, count })),
      byLevel: Array.from(byLevel.entries()).map(([level, count]) => ({ level, count })),
      byStatus: Array.from(byStatus.entries()).map(([status, count]) => ({ status, count })),
    }
  }

  async exportToCSV(data: unknown[], filename: string): Promise<string> {
    if (data.length === 0) {
      return ''
    }

    const headers = Object.keys(data[0] as Record<string, unknown>).join(',')
    const rows = data.map(row => 
      Object.values(row as Record<string, unknown>).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    )

    const csv = [headers, ...rows].join('\n')
    return csv
  }
}

export const reportService = new ReportService()
