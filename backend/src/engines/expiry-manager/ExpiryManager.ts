import dotenv from 'dotenv'
import { AppDataSource } from '../../config/database'
import {
  PointsExpiry,
  ExpiryStatus,
  Notification,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  VoucherType,
  AccountType,
  EntryDirection,
  Member,
} from '../../entities'
import { MoreThanOrEqual, LessThanOrEqual, In, EntityManager } from 'typeorm'
import { LedgerCore } from '../ledger-core'
import {
  ExpiryScanResult,
  ExpiringPointsInfo,
  ExpiredPointsInfo,
  ExpiryPolicy,
  ExpiryClearingResult,
} from './types'

dotenv.config()

export class ExpiryManager {
  private static instance: ExpiryManager
  private policy: ExpiryPolicy

  private constructor() {
    this.policy = {
      defaultExpiryDays: parseInt(process.env.DEFAULT_POINTS_EXPIRY_DAYS || '365'),
      enableExpiry: true,
      enableReminder: true,
      reminderDays: [parseInt(process.env.EXPIRY_NOTIFICATION_DAYS || '7')],
      enableAutoClear: true,
      clearTime: '02:00',
    }
  }

  static getInstance(): ExpiryManager {
    if (!ExpiryManager.instance) {
      ExpiryManager.instance = new ExpiryManager()
    }
    return ExpiryManager.instance
  }

  getPolicy(): ExpiryPolicy {
    return { ...this.policy }
  }

  updatePolicy(policy: Partial<ExpiryPolicy>): void {
    this.policy = { ...this.policy, ...policy }
  }

  async scanAndProcess(): Promise<ExpiryScanResult> {
    const result: ExpiryScanResult = {
      scannedCount: 0,
      expiringSoonCount: 0,
      expiredCount: 0,
      notificationsSent: 0,
      pointsCleared: 0,
      errors: [],
    }

    try {
      const expiringPoints = await this.scanExpiringSoon()
      result.expiringSoonCount = expiringPoints.length
      result.scannedCount += expiringPoints.length

      for (const info of expiringPoints) {
        try {
          const sent = await this.sendExpiryNotification(info)
          if (sent) {
            result.notificationsSent++
          }
        } catch (error: any) {
          result.errors.push(`发送临期通知失败 [${info.expiryId}]: ${error.message}`)
        }
      }

      const expiredPoints = await this.scanExpired()
      result.expiredCount = expiredPoints.length
      result.scannedCount += expiredPoints.length

      for (const info of expiredPoints) {
        try {
          const clearResult = await this.clearExpiredPoints(info)
          if (clearResult.success && clearResult.pointsCleared > 0) {
            result.pointsCleared += clearResult.pointsCleared
          }
        } catch (error: any) {
          result.errors.push(`清零过期积分失败 [${info.expiryId}]: ${error.message}`)
        }
      }
    } catch (error: any) {
      result.errors.push(`扫描处理失败: ${error.message}`)
    }

    return result
  }

  private async scanExpiringSoon(): Promise<ExpiringPointsInfo[]> {
    const expiryRepo = AppDataSource.getRepository(PointsExpiry)
    const now = new Date()

    const latestReminderDay = Math.max(...this.policy.reminderDays)
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + latestReminderDay)

    const expiringRecords = await expiryRepo.find({
      where: {
        status: In([ExpiryStatus.ACTIVE, ExpiryStatus.NOTIFIED]),
        expiryDate: MoreThanOrEqual(now),
        remainingPoints: MoreThanOrEqual(0.01),
      },
    })

    const result: ExpiringPointsInfo[] = []

    for (const record of expiringRecords) {
      const daysUntilExpiry = this.calculateDaysUntilExpiry(record.expiryDate, now)
      
      const shouldNotify = this.policy.reminderDays.some(day => daysUntilExpiry <= day)
      
      const alreadyNotifiedToday = record.lastNotifyAt && 
        this.isSameDay(record.lastNotifyAt, now)

      if (shouldNotify && !alreadyNotifiedToday) {
        result.push({
          expiryId: record.id,
          memberId: record.memberId,
          remainingPoints: record.remainingPoints,
          expiryDate: record.expiryDate,
          daysUntilExpiry,
          transactionId: record.transactionId,
        })
      }
    }

    return result
  }

  private async scanExpired(): Promise<ExpiredPointsInfo[]> {
    const expiryRepo = AppDataSource.getRepository(PointsExpiry)
    const now = new Date()

    const expiredRecords = await expiryRepo.find({
      where: {
        status: In([ExpiryStatus.ACTIVE, ExpiryStatus.NOTIFIED]),
        expiryDate: LessThanOrEqual(now),
        remainingPoints: MoreThanOrEqual(0.01),
      },
    })

    const result: ExpiredPointsInfo[] = []

    for (const record of expiredRecords) {
      const daysExpired = this.calculateDaysExpired(record.expiryDate, now)
      
      result.push({
        expiryId: record.id,
        memberId: record.memberId,
        remainingPoints: record.remainingPoints,
        expiryDate: record.expiryDate,
        daysExpired,
        transactionId: record.transactionId,
      })
    }

    return result
  }

  private async sendExpiryNotification(info: ExpiringPointsInfo): Promise<boolean> {
    if (!this.policy.enableReminder) {
      return false
    }

    const expiryRepo = AppDataSource.getRepository(PointsExpiry)
    const notificationRepo = AppDataSource.getRepository(Notification)
    const memberRepo = AppDataSource.getRepository(Member)

    const expiryRecord = await expiryRepo.findOne({
      where: { id: info.expiryId },
    })

    if (!expiryRecord) {
      return false
    }

    const member = await memberRepo.findOne({
      where: { id: info.memberId },
      relations: ['user'],
    })

    const notification = notificationRepo.create({
      notificationNo: this.generateNotificationNo(),
      type: NotificationType.POINTS_EXPIRY_SOON,
      channel: NotificationChannel.IN_APP,
      status: NotificationStatus.SENT,
      recipientId: info.memberId,
      title: '积分即将过期提醒',
      content: `您有 ${info.remainingPoints.toFixed(2)} 积分将于 ${this.formatDate(info.expiryDate)} 过期，请尽快使用。`,
      data: {
        expiryId: info.expiryId,
        points: info.remainingPoints,
        expiryDate: info.expiryDate.toISOString(),
        daysUntilExpiry: info.daysUntilExpiry,
      },
      sentAt: new Date(),
    })

    await notificationRepo.save(notification)

    expiryRecord.status = ExpiryStatus.NOTIFIED
    expiryRecord.isNotified = true
    expiryRecord.notifyCount = (expiryRecord.notifyCount || 0) + 1
    expiryRecord.lastNotifyAt = new Date()

    await expiryRepo.save(expiryRecord)

    return true
  }

  private async clearExpiredPoints(info: ExpiredPointsInfo): Promise<ExpiryClearingResult> {
    return AppDataSource.transaction(async (manager: EntityManager) => {
      const expiryRepo = manager.getRepository(PointsExpiry)
      const memberRepo = manager.getRepository(Member)

      const expiryRecord = await expiryRepo.findOne({
        where: { id: info.expiryId },
        lock: { mode: 'pessimistic_write' },
      })

      if (!expiryRecord) {
        return {
          success: false,
          expiryId: info.expiryId,
          memberId: info.memberId,
          pointsCleared: 0,
          errorMessage: '过期记录不存在',
        }
      }

      if (expiryRecord.status === ExpiryStatus.CLEARED) {
        return {
          success: true,
          expiryId: info.expiryId,
          memberId: info.memberId,
          pointsCleared: 0,
        }
      }

      const pointsToClear = expiryRecord.remainingPoints

      if (pointsToClear <= 0) {
        expiryRecord.status = ExpiryStatus.CLEARED
        expiryRecord.clearedAt = new Date()
        await expiryRepo.save(expiryRecord)

        return {
          success: true,
          expiryId: info.expiryId,
          memberId: info.memberId,
          pointsCleared: 0,
        }
      }

      const ledgerCore = LedgerCore.getInstance()
      const voucher = await ledgerCore.createVoucher({
        type: VoucherType.POINTS_EXPIRE,
        description: `积分过期清零: ${pointsToClear} 积分`,
        businessType: 'points_expiry',
        businessNo: info.expiryId,
        memberId: info.memberId,
        entries: [
          {
            direction: EntryDirection.CREDIT,
            accountType: AccountType.MEMBER_POINTS,
            memberId: info.memberId,
            amount: pointsToClear,
            description: '会员积分账户',
          },
          {
            direction: EntryDirection.DEBIT,
            accountType: AccountType.POINTS_EXPIRED,
            amount: pointsToClear,
            description: '过期积分账户',
          },
        ],
        metadata: {
          expiryId: info.expiryId,
          transactionId: info.transactionId,
          daysExpired: info.daysExpired,
        },
      })

      const postingResult = await ledgerCore.postVoucher(voucher.id)

      expiryRecord.status = ExpiryStatus.EXPIRED
      expiryRecord.expiredAt = new Date()
      expiryRecord.expiredPoints = pointsToClear
      expiryRecord.expiredVoucherId = voucher.id

      const transaction = postingResult.affectedAccounts.find(a => a.memberId === info.memberId)
      if (transaction) {
        expiryRecord.status = ExpiryStatus.CLEARED
        expiryRecord.clearedAt = new Date()
      }

      await expiryRepo.save(expiryRecord)

      const member = await memberRepo.findOne({
        where: { id: info.memberId },
        lock: { mode: 'pessimistic_write' },
      })

      if (member) {
        member.totalPointsExpired = Number(member.totalPointsExpired) + pointsToClear
        await memberRepo.save(member)
      }

      return {
        success: true,
        expiryId: info.expiryId,
        memberId: info.memberId,
        pointsCleared: pointsToClear,
        voucherId: voucher.id,
      }
    })
  }

  async createExpiryRecord(
    memberId: string,
    transactionId: string,
    points: number,
    earnedDate: Date,
    expiryDate?: Date
  ): Promise<PointsExpiry> {
    const expiryRepo = AppDataSource.getRepository(PointsExpiry)

    const effectiveExpiryDate = expiryDate || this.calculateExpiryDate(earnedDate)

    const expiryRecord = expiryRepo.create({
      expiryNo: this.generateExpiryNo(),
      memberId,
      transactionId,
      originalPoints: points,
      remainingPoints: points,
      earnedDate,
      expiryDate: effectiveExpiryDate,
      status: ExpiryStatus.ACTIVE,
      isNotified: false,
      notifyCount: 0,
    })

    return expiryRepo.save(expiryRecord)
  }

  async deductPointsFromExpiry(
    memberId: string,
    pointsToDeduct: number
  ): Promise<{ success: boolean; deductedAmount: number; expiryRecordsUsed: string[] }> {
    const expiryRepo = AppDataSource.getRepository(PointsExpiry)

    const activeRecords = await expiryRepo.find({
      where: {
        memberId,
        status: ExpiryStatus.ACTIVE,
        remainingPoints: MoreThanOrEqual(0.01),
      },
      order: {
        expiryDate: 'ASC',
      },
    })

    let remainingToDeduct = pointsToDeduct
    const expiryRecordsUsed: string[] = []
    let totalDeducted = 0

    for (const record of activeRecords) {
      if (remainingToDeduct <= 0) break

      const canDeduct = Math.min(record.remainingPoints, remainingToDeduct)
      
      if (canDeduct > 0) {
        record.remainingPoints = record.remainingPoints - canDeduct
        await expiryRepo.save(record)
        
        remainingToDeduct -= canDeduct
        totalDeducted += canDeduct
        expiryRecordsUsed.push(record.id)
      }
    }

    return {
      success: remainingToDeduct === 0,
      deductedAmount: totalDeducted,
      expiryRecordsUsed,
    }
  }

  private calculateDaysUntilExpiry(expiryDate: Date, now: Date): number {
    const diffTime = expiryDate.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  private calculateDaysExpired(expiryDate: Date, now: Date): number {
    const diffTime = now.getTime() - expiryDate.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  private calculateExpiryDate(earnedDate: Date): Date {
    const expiryDate = new Date(earnedDate)
    expiryDate.setDate(expiryDate.getDate() + this.policy.defaultExpiryDays)
    return expiryDate
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  private formatDate(date: Date): string {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }

  private generateExpiryNo(): string {
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
    return `EXP-${dateStr}-${timeStr}-${random}`
  }

  private generateNotificationNo(): string {
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
    return `NOT-${dateStr}-${timeStr}-${random}`
  }
}
