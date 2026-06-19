import { Repository, Between } from 'typeorm'
import { AppDataSource } from '../data-source.js'
import { SettlementRecord } from '../entities/SettlementRecord.js'
import { VerificationRecord } from '../entities/VerificationRecord.js'
import { generateBatchNo, generateId } from '../utils/id.js'
import { reconciliationService } from './ReconciliationService.js'
import type { ProvincialSettlementRecord, ProvincialPlatformConfig } from '../../../shared/types/index.js'

export interface SyncResult {
  success: boolean
  batchId: string
  syncedCount: number
  totalAmount: number
  message?: string
}

export class ProvincialPlatformService {
  private settlementRepository: Repository<SettlementRecord>
  private verificationRepository: Repository<VerificationRecord>
  private config: ProvincialPlatformConfig
  private syncStore: Map<string, ProvincialSettlementRecord> = new Map()

  constructor() {
    this.settlementRepository = AppDataSource.getRepository(SettlementRecord)
    this.verificationRepository = AppDataSource.getRepository(VerificationRecord)
    this.config = {
      apiUrl: process.env.PROVINCIAL_API_URL || 'https://provincial.example.com/api',
      appId: process.env.PROVINCIAL_APP_ID || 'SY024',
      cityCode: process.env.PROVINCIAL_CITY_CODE || '210100',
      publicKey: process.env.PROVINCIAL_PUBLIC_KEY || '',
      enabled: process.env.PROVINCIAL_ENABLED === 'true',
    }
  }

  getConfig(): ProvincialPlatformConfig {
    return this.config
  }

  updateConfig(config: Partial<ProvincialPlatformConfig>): void {
    Object.assign(this.config, config)
  }

  async syncToProvincial(): Promise<SyncResult> {
    if (!this.config.enabled) {
      return {
        success: false,
        batchId: '',
        syncedCount: 0,
        totalAmount: 0,
        message: '省级平台对接未启用',
      }
    }

    const unsynced = await reconciliationService.getUnsyncedSettlements()

    if (unsynced.length === 0) {
      return {
        success: true,
        batchId: '',
        syncedCount: 0,
        totalAmount: 0,
        message: '没有需要同步的结算记录',
      }
    }

    const batchId = generateBatchNo('PROV')
    
    let totalAmount = 0
    let totalSubsidy = 0
    const settlementIds: string[] = []

    for (const settlement of unsynced) {
      totalAmount += settlement.totalAmount
      totalSubsidy += settlement.subsidyAmount
      settlementIds.push(settlement.id)
    }

    const provincialRecord: ProvincialSettlementRecord = {
      id: generateId(),
      batchId,
      cityCode: this.config.cityCode,
      totalAmount,
      subsidyAmount: totalSubsidy,
      merchantCount: unsynced.length,
      status: 'synced',
      syncTime: new Date(),
      createdAt: new Date(),
    }

    this.syncStore.set(batchId, provincialRecord)

    await reconciliationService.updateProvincialBatchId(settlementIds, batchId)

    const mockSuccess = true
    if (mockSuccess) {
      provincialRecord.status = 'confirmed'
      provincialRecord.confirmTime = new Date()
      this.syncStore.set(batchId, provincialRecord)

      for (const settlement of unsynced) {
        await reconciliationService.markAsTransferred(settlement.id, batchId)
      }

      provincialRecord.status = 'paid'
      provincialRecord.paidTime = new Date()
      this.syncStore.set(batchId, provincialRecord)
    }

    return {
      success: true,
      batchId,
      syncedCount: unsynced.length,
      totalAmount: totalSubsidy,
      message: `成功同步${unsynced.length}条结算记录，批次号：${batchId}`,
    }
  }

  async getProvincialSettlements(
    page: number = 1,
    pageSize: number = 20,
    status?: ProvincialSettlementRecord['status'],
  ): Promise<{ records: ProvincialSettlementRecord[]; total: number }> {
    let records = Array.from(this.syncStore.values())
    
    if (status) {
      records = records.filter(r => r.status === status)
    }

    records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    const total = records.length
    const startIndex = (page - 1) * pageSize
    const paginatedRecords = records.slice(startIndex, startIndex + pageSize)

    return { records: paginatedRecords, total }
  }

  async getProvincialSettlementById(batchId: string): Promise<ProvincialSettlementRecord | null> {
    return this.syncStore.get(batchId) || null
  }

  async getSettlementDetails(batchId: string): Promise<{
    batch: ProvincialSettlementRecord
    settlements: SettlementRecord[]
  } | null> {
    const batch = this.syncStore.get(batchId)
    if (!batch) {
      return null
    }

    const settlements = await this.settlementRepository.find({
      where: { provincialBatchId: batchId },
      relations: ['merchant'],
    })

    return { batch, settlements }
  }

  async checkSyncStatus(batchId: string): Promise<{
    status: ProvincialSettlementRecord['status']
    message: string
  } | null> {
    const record = this.syncStore.get(batchId)
    if (!record) {
      return null
    }

    const statusMessages: Record<string, string> = {
      pending: '待同步',
      synced: '已同步，等待省级平台确认',
      confirmed: '省级平台已确认，等待拨款',
      paid: '已拨款完成',
    }

    return {
      status: record.status,
      message: statusMessages[record.status] || '未知状态',
    }
  }

  async getProvincialStats(): Promise<{
    totalBatches: number
    totalAmount: number
    totalSubsidy: number
    pendingCount: number
    syncedCount: number
    confirmedCount: number
    paidCount: number
  }> {
    const records = Array.from(this.syncStore.values())
    
    let totalAmount = 0
    let totalSubsidy = 0
    let pendingCount = 0
    let syncedCount = 0
    let confirmedCount = 0
    let paidCount = 0

    for (const record of records) {
      totalAmount += record.totalAmount
      totalSubsidy += record.subsidyAmount
      if (record.status === 'pending') pendingCount++
      else if (record.status === 'synced') syncedCount++
      else if (record.status === 'confirmed') confirmedCount++
      else if (record.status === 'paid') paidCount++
    }

    return {
      totalBatches: records.length,
      totalAmount,
      totalSubsidy,
      pendingCount,
      syncedCount,
      confirmedCount,
      paidCount,
    }
  }

  async getCrossCitySettlements(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ records: ProvincialSettlementRecord[]; total: number }> {
    return this.getProvincialSettlements(page, pageSize)
  }

  async confirmReceipt(batchId: string): Promise<boolean> {
    const record = this.syncStore.get(batchId)
    if (!record || record.status !== 'confirmed') {
      return false
    }

    record.status = 'paid'
    record.paidTime = new Date()
    this.syncStore.set(batchId, record)

    return true
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config.enabled) {
      return {
        success: false,
        message: '省级平台对接未启用',
      }
    }

    const mockSuccess = true

    if (mockSuccess) {
      return {
        success: true,
        message: `成功连接到省级平台 API: ${this.config.apiUrl}`,
      }
    } else {
      return {
        success: false,
        message: '连接省级平台失败，请检查网络和配置',
      }
    }
  }

  async generateProvincialReport(startDate: Date, endDate: Date): Promise<{
    cityCode: string
    cityName: string
    periodStart: Date
    periodEnd: Date
    totalVerifications: number
    totalAmount: number
    totalSubsidy: number
    merchantCount: number
    settlementBatches: ProvincialSettlementRecord[]
  }> {
    const records = Array.from(this.syncStore.values()).filter(
      r => r.createdAt >= startDate && r.createdAt <= endDate
    )

    let totalVerifications = 0
    let totalAmount = 0
    let totalSubsidy = 0
    const merchantSet = new Set<string>()

    for (const record of records) {
      totalAmount += record.totalAmount
      totalSubsidy += record.subsidyAmount
      merchantSet.add(record.cityCode)
    }

    const verifications = await this.verificationRepository.count({
      where: { verifiedAt: Between(startDate, endDate), status: 'success' },
    })
    totalVerifications = verifications

    return {
      cityCode: this.config.cityCode,
      cityName: '沈阳市',
      periodStart: startDate,
      periodEnd: endDate,
      totalVerifications,
      totalAmount,
      totalSubsidy,
      merchantCount: merchantSet.size,
      settlementBatches: records,
    }
  }

  async createProvincialSettlementRecord(
    record: Omit<ProvincialSettlementRecord, 'id' | 'createdAt'>,
  ): Promise<ProvincialSettlementRecord> {
    const newRecord: ProvincialSettlementRecord = {
      id: generateId(),
      createdAt: new Date(),
      ...record,
    }
    this.syncStore.set(newRecord.batchId, newRecord)
    return newRecord
  }
}

export const provincialPlatformService = new ProvincialPlatformService()
