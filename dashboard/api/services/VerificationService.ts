import { Repository, Between } from 'typeorm'
import { AppDataSource } from '../data-source.js'
import { VerificationRecord } from '../entities/VerificationRecord.js'
import { CouponInstance } from '../entities/CouponInstance.js'
import { CouponActivity } from '../entities/CouponActivity.js'
import { Merchant } from '../entities/Merchant.js'
import { generateId, generateOrderNo } from '../utils/id.js'
import { getStartOfDay, getEndOfDay, formatDate } from '../utils/date.js'
import type { TerminalType, VerificationStatus, VerificationTrendData, VerificationRecord as VerificationRecordType } from '../../../shared/types/index.js'

export interface VerifyRequest {
  couponCode: string
  merchantId: string
  storeId?: string
  terminalId?: string
  terminalType: TerminalType
  originalAmount: number
  location?: { latitude: number; longitude: number; address?: string }
  orderNo?: string
}

export class VerificationService {
  private recordRepository: Repository<VerificationRecord>
  private instanceRepository: Repository<CouponInstance>
  private activityRepository: Repository<CouponActivity>
  private merchantRepository: Repository<Merchant>

  constructor() {
    this.recordRepository = AppDataSource.getRepository(VerificationRecord)
    this.instanceRepository = AppDataSource.getRepository(CouponInstance)
    this.activityRepository = AppDataSource.getRepository(CouponActivity)
    this.merchantRepository = AppDataSource.getRepository(Merchant)
  }

  async verify(request: VerifyRequest): Promise<{
    success: boolean
    record?: VerificationRecord
    error?: string
  }> {
    const instance = await this.instanceRepository.findOne({
      where: { code: request.couponCode },
      relations: ['activity', 'user'],
    })

    if (!instance) {
      return { success: false, error: 'Coupon not found' }
    }

    if (instance.status !== 'available') {
      return { success: false, error: `Coupon is ${instance.status}` }
    }

    const now = new Date()
    if (instance.expiresAt < now) {
      return { success: false, error: 'Coupon has expired' }
    }

    if (instance.activity && (instance.activity.startTime > now || instance.activity.endTime < now)) {
      return { success: false, error: 'Coupon activity is not active' }
    }

    const activity = instance.activity
    if (activity && activity.applicableMerchantIds && activity.applicableMerchantIds.length > 0) {
      if (!activity.applicableMerchantIds.includes(request.merchantId)) {
        return { success: false, error: 'Merchant is not eligible for this coupon' }
      }
    }

    if (request.originalAmount < (activity?.threshold || 0)) {
      return { 
        success: false, 
        error: `Order amount does not meet threshold of ${activity?.threshold || 0}` 
      }
    }

    let discountAmount = 0
    if (activity) {
      if (activity.type === 'fixed') {
        discountAmount = Math.min(activity.value, request.originalAmount)
      } else if (activity.type === 'discount') {
        discountAmount = request.originalAmount * (1 - activity.value / 100)
      } else if (activity.type === 'threshold') {
        if (request.originalAmount >= activity.threshold) {
          discountAmount = activity.value
        }
      }
    }

    const finalAmount = Math.max(0, request.originalAmount - discountAmount)

    instance.status = 'used'
    instance.usedAt = now
    instance.updatedAt = now
    await this.instanceRepository.save(instance)

    const record = this.recordRepository.create({
      id: generateId(),
      couponInstanceId: instance.id,
      activityId: instance.activityId,
      userId: instance.userId,
      merchantId: request.merchantId,
      storeId: request.storeId || null,
      terminalId: request.terminalId || null,
      terminalType: request.terminalType,
      originalAmount: request.originalAmount,
      discountAmount,
      amount: finalAmount,
      status: 'success',
      verifiedAt: now,
      location: request.location || null,
      orderNo: request.orderNo || generateOrderNo(),
    })

    const savedRecord = await this.recordRepository.save(record)

    if (activity) {
      activity.usedQuantity = activity.usedQuantity + 1
      await this.activityRepository.save(activity)
    }

    return { success: true, record: savedRecord }
  }

  async reverseVerification(recordId: string): Promise<{
    success: boolean
    record?: VerificationRecord
    error?: string
  }> {
    const record = await this.recordRepository.findOne({
      where: { id: recordId },
      relations: ['couponInstance'],
    })

    if (!record) {
      return { success: false, error: 'Record not found' }
    }

    if (record.status === 'reversed') {
      return { success: false, error: 'Record already reversed' }
    }

    if (record.couponInstance) {
      record.couponInstance.status = 'available'
      record.couponInstance.usedAt = null
      record.couponInstance.updatedAt = new Date()
      await this.instanceRepository.save(record.couponInstance)
    }

    record.status = 'reversed'
    record.updatedAt = new Date()
    const savedRecord = await this.recordRepository.save(record)

    return { success: true, record: savedRecord }
  }

  async getRecords(
    page: number = 1,
    pageSize: number = 20,
    merchantId?: string,
    startDate?: Date,
    endDate?: Date,
    status?: VerificationStatus,
  ): Promise<{ records: VerificationRecord[]; total: number }> {
    const where: Record<string, unknown> = {}
    if (merchantId) where.merchantId = merchantId
    if (status) where.status = status
    
    if (startDate && endDate) {
      where.verifiedAt = Between(startDate, endDate)
    } else if (startDate) {
      where.verifiedAt = Between(startDate, new Date())
    }

    const [records, total] = await this.recordRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { verifiedAt: 'DESC' },
      relations: ['couponInstance', 'activity', 'merchant'],
    })

    return { records, total }
  }

  async getRecordById(id: string): Promise<VerificationRecord | null> {
    return this.recordRepository.findOne({
      where: { id },
      relations: ['couponInstance', 'activity', 'merchant', 'user', 'store', 'terminal'],
    })
  }

  async getReconciliationData(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalRecords: number
    totalAmount: number
    totalDiscount: number
    totalSubsidy: number
    records: VerificationRecord[]
  }> {
    const where: Record<string, unknown> = {
      merchantId,
      status: 'success',
      verifiedAt: Between(startDate, endDate),
      settlementRecordId: null,
    }

    const records = await this.recordRepository.find({
      where,
      relations: ['activity'],
    })

    let totalAmount = 0
    let totalDiscount = 0
    let totalSubsidy = 0

    for (const record of records) {
      totalAmount += record.amount
      totalDiscount += record.discountAmount
      totalSubsidy += record.discountAmount
    }

    return {
      totalRecords: records.length,
      totalAmount,
      totalDiscount,
      totalSubsidy,
      records,
    }
  }

  async getVerificationTrend(days: number = 30): Promise<VerificationTrendData[]> {
    const endDate = getEndOfDay()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days + 1)
    startDate.setHours(0, 0, 0, 0)

    const records = await this.recordRepository.find({
      where: {
        verifiedAt: Between(startDate, endDate),
        status: 'success',
      },
      order: { verifiedAt: 'ASC' },
    })

    const dailyData = new Map<string, VerificationTrendData>()

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
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

  async getTodayStats(merchantId?: string): Promise<{
    count: number
    amount: number
    discountAmount: number
  }> {
    const startOfDay = getStartOfDay()
    const endOfDay = getEndOfDay()

    const where: Record<string, unknown> = {
      verifiedAt: Between(startOfDay, endOfDay),
      status: 'success',
    }
    if (merchantId) where.merchantId = merchantId

    const records = await this.recordRepository.find({ where })

    let count = 0
    let amount = 0
    let discountAmount = 0

    for (const record of records) {
      count++
      amount += record.amount
      discountAmount += record.discountAmount
    }

    return { count, amount, discountAmount }
  }

  async getVerificationRate(activityId: string): Promise<number> {
    const activity = await this.activityRepository.findOne({ where: { id: activityId } })
    if (!activity || activity.totalQuantity === 0) {
      return 0
    }

    const count = await this.recordRepository.count({
      where: { activityId, status: 'success' },
    })

    return count / activity.totalQuantity
  }

  async getMerchantStats(merchantId: string): Promise<{
    totalVerifications: number
    totalAmount: number
    totalDiscount: number
    averageOrderValue: number
  }> {
    const records = await this.recordRepository.find({
      where: { merchantId, status: 'success' },
    })

    let totalVerifications = records.length
    let totalAmount = 0
    let totalDiscount = 0

    for (const record of records) {
      totalAmount += record.amount
      totalDiscount += record.discountAmount
    }

    return {
      totalVerifications,
      totalAmount,
      totalDiscount,
      averageOrderValue: totalVerifications > 0 ? totalAmount / totalVerifications : 0,
    }
  }

  async updateRecordSettlement(recordIds: string[], settlementRecordId: string): Promise<void> {
    await this.recordRepository
      .createQueryBuilder()
      .update(VerificationRecord)
      .set({ settlementRecordId, updatedAt: new Date() })
      .where('id IN (:...ids)', { ids: recordIds })
      .execute()
  }
}

export const verificationService = new VerificationService()
