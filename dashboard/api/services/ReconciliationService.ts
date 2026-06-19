import { Repository, Between, In } from 'typeorm'
import { AppDataSource } from '../data-source.js'
import { SettlementRecord } from '../entities/SettlementRecord.js'
import { VerificationRecord } from '../entities/VerificationRecord.js'
import { Merchant } from '../entities/Merchant.js'
import { generateId, generateBatchNo } from '../utils/id.js'
import { getStartOfMonth, getEndOfMonth } from '../utils/date.js'
import type { SettlementStatus } from '../../../shared/types/index.js'

export interface SettlementApplication {
  merchantId: string
  periodStart: Date
  periodEnd: Date
}

export class ReconciliationService {
  private settlementRepository: Repository<SettlementRecord>
  private verificationRepository: Repository<VerificationRecord>
  private merchantRepository: Repository<Merchant>

  constructor() {
    this.settlementRepository = AppDataSource.getRepository(SettlementRecord)
    this.verificationRepository = AppDataSource.getRepository(VerificationRecord)
    this.merchantRepository = AppDataSource.getRepository(Merchant)
  }

  async createSettlementApplication(
    application: SettlementApplication,
  ): Promise<SettlementRecord | null> {
    const { merchantId, periodStart, periodEnd } = application

    const merchant = await this.merchantRepository.findOne({ where: { id: merchantId } })
    if (!merchant) {
      return null
    }

    const verificationRecords = await this.verificationRepository.find({
      where: {
        merchantId,
        status: 'success',
        verifiedAt: Between(periodStart, periodEnd),
        settlementRecordId: null,
      },
    })

    if (verificationRecords.length === 0) {
      return null
    }

    let totalVerifications = verificationRecords.length
    let totalAmount = 0
    let totalSubsidy = 0

    for (const record of verificationRecords) {
      totalAmount += record.amount
      totalSubsidy += record.discountAmount
    }

    const actualAmount = totalSubsidy

    const settlement = this.settlementRepository.create({
      id: generateId(),
      merchantId,
      periodStart,
      periodEnd,
      totalVerifications,
      totalAmount,
      subsidyAmount: totalSubsidy,
      actualAmount,
      status: 'pending',
    })

    const savedSettlement = await this.settlementRepository.save(settlement)

    const recordIds = verificationRecords.map(r => r.id)
    await this.verificationRepository
      .createQueryBuilder()
      .update(VerificationRecord)
      .set({ settlementRecordId: savedSettlement.id, updatedAt: new Date() })
      .where('id IN (:...ids)', { ids: recordIds })
      .execute()

    return savedSettlement
  }

  async getSettlementList(
    page: number = 1,
    pageSize: number = 20,
    merchantId?: string,
    status?: SettlementStatus,
  ): Promise<{ settlements: SettlementRecord[]; total: number }> {
    const where: Record<string, unknown> = {}
    if (merchantId) where.merchantId = merchantId
    if (status) where.status = status

    const [settlements, total] = await this.settlementRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
      relations: ['merchant'],
    })

    return { settlements, total }
  }

  async getSettlementById(id: string): Promise<SettlementRecord | null> {
    return this.settlementRepository.findOne({
      where: { id },
      relations: ['merchant', 'verificationRecords'],
    })
  }

  async updateSettlementStatus(
    id: string,
    status: SettlementStatus,
    handlerNotes?: string,
  ): Promise<SettlementRecord | null> {
    const settlement = await this.settlementRepository.findOne({ where: { id } })
    if (!settlement) {
      return null
    }

    settlement.status = status
    settlement.updatedAt = new Date()

    if (status === 'transferred') {
      settlement.transferTime = new Date()
    }

    return this.settlementRepository.save(settlement)
  }

  async approveSettlement(id: string): Promise<SettlementRecord | null> {
    return this.updateSettlementStatus(id, 'approved')
  }

  async rejectSettlement(id: string): Promise<SettlementRecord | null> {
    return this.updateSettlementStatus(id, 'rejected')
  }

  async markAsTransferred(id: string, provincialBatchId?: string): Promise<SettlementRecord | null> {
    const settlement = await this.settlementRepository.findOne({ where: { id } })
    if (!settlement) {
      return null
    }

    settlement.status = 'transferred'
    settlement.transferTime = new Date()
    if (provincialBatchId) {
      settlement.provincialBatchId = provincialBatchId
    }
    settlement.updatedAt = new Date()

    return this.settlementRepository.save(settlement)
  }

  async getSettlementSummary(merchantId: string): Promise<{
    pendingCount: number
    pendingAmount: number
    approvedCount: number
    approvedAmount: number
    transferredCount: number
    transferredAmount: number
    totalCount: number
    totalAmount: number
  }> {
    const settlements = await this.settlementRepository.find({
      where: { merchantId },
    })

    let pendingCount = 0, pendingAmount = 0
    let approvedCount = 0, approvedAmount = 0
    let transferredCount = 0, transferredAmount = 0

    for (const s of settlements) {
      if (s.status === 'pending') {
        pendingCount++
        pendingAmount += s.actualAmount
      } else if (s.status === 'approved') {
        approvedCount++
        approvedAmount += s.actualAmount
      } else if (s.status === 'transferred') {
        transferredCount++
        transferredAmount += s.actualAmount
      }
    }

    return {
      pendingCount,
      pendingAmount,
      approvedCount,
      approvedAmount,
      transferredCount,
      transferredAmount,
      totalCount: settlements.length,
      totalAmount: pendingAmount + approvedAmount + transferredAmount,
    }
  }

  async generateMonthlySettlements(month?: Date): Promise<number> {
    const targetDate = month || new Date()
    const startDate = getStartOfMonth(targetDate)
    const endDate = getEndOfMonth(targetDate)

    const merchants = await this.merchantRepository.find({
      where: { status: 'active' },
    })

    let createdCount = 0

    for (const merchant of merchants) {
      const settlement = await this.createSettlementApplication({
        merchantId: merchant.id,
        periodStart: startDate,
        periodEnd: endDate,
      })
      if (settlement) {
        createdCount++
      }
    }

    return createdCount
  }

  async getReconciliationStats(): Promise<{
    totalSettlements: number
    pendingSettlements: number
    totalSubsidy: number
    pendingSubsidy: number
    thisMonthSubsidy: number
  }> {
    const totalSettlements = await this.settlementRepository.count()
    const pendingSettlements = await this.settlementRepository.count({ where: { status: 'pending' } })

    const allSettlements = await this.settlementRepository.find()
    let totalSubsidy = 0
    let pendingSubsidy = 0

    for (const s of allSettlements) {
      totalSubsidy += s.subsidyAmount
      if (s.status === 'pending') {
        pendingSubsidy += s.subsidyAmount
      }
    }

    const startOfMonth = getStartOfMonth()
    const endOfMonth = getEndOfMonth()
    const thisMonthSettlements = await this.settlementRepository.find({
      where: {
        createdAt: Between(startOfMonth, endOfMonth),
      },
    })

    let thisMonthSubsidy = 0
    for (const s of thisMonthSettlements) {
      thisMonthSubsidy += s.subsidyAmount
    }

    return {
      totalSettlements,
      pendingSettlements,
      totalSubsidy,
      pendingSubsidy,
      thisMonthSubsidy,
    }
  }

  async updateProvincialBatchId(settlementIds: string[], provincialBatchId: string): Promise<void> {
    await this.settlementRepository
      .createQueryBuilder()
      .update(SettlementRecord)
      .set({ provincialBatchId, updatedAt: new Date() })
      .where('id IN (:...ids)', { ids: settlementIds })
      .execute()
  }

  async getUnsyncedSettlements(): Promise<SettlementRecord[]> {
    return this.settlementRepository.find({
      where: {
        provincialBatchId: null,
        status: In(['approved', 'transferred']),
      },
      relations: ['merchant'],
    })
  }
}

export const reconciliationService = new ReconciliationService()
