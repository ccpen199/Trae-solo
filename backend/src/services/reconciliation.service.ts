import { AppDataSource } from '../config/database'
import {
  DailyReconciliation,
  ReconciliationStatus,
  PointsTransaction,
  TransactionType,
  TransactionStatus,
  LedgerVoucher,
  VoucherType,
  VoucherStatus,
  Member,
  PointsAccount,
} from '../entities'
import { Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm'

export interface ReconciliationResult {
  success: boolean
  reconciliationId: string
  reconciliationNo: string
  date: Date
  status: ReconciliationStatus
  openingBalance: number
  closingBalance: number
  totalIssued: number
  totalConsumed: number
  totalExpired: number
  expectedBalance: number
  actualBalance: number
  difference: number
  hasWarning: boolean
  hasError: boolean
}

export class ReconciliationService {
  private static instance: ReconciliationService

  private constructor() {}

  static getInstance(): ReconciliationService {
    if (!ReconciliationService.instance) {
      ReconciliationService.instance = new ReconciliationService()
    }
    return ReconciliationService.instance
  }

  async executeDailyReconciliation(date?: Date): Promise<ReconciliationResult> {
    const reconciliationRepo = AppDataSource.getRepository(DailyReconciliation)
    const transactionRepo = AppDataSource.getRepository(PointsTransaction)
    const memberRepo = AppDataSource.getRepository(Member)
    const accountRepo = AppDataSource.getRepository(PointsAccount)

    const targetDate = date || new Date()
    targetDate.setHours(0, 0, 0, 0)

    const existingReconciliation = await reconciliationRepo.findOne({
      where: {
        date: targetDate,
      },
    })

    if (existingReconciliation && existingReconciliation.status === ReconciliationStatus.SUCCESS) {
      return this.mapToResult(existingReconciliation)
    }

    const startOfDay = new Date(targetDate)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const yesterday = new Date(targetDate)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayEnd = new Date(yesterday)
    yesterdayEnd.setHours(23, 59, 59, 999)

    const reconciliation = existingReconciliation || reconciliationRepo.create({
      reconciliationNo: this.generateReconciliationNo(targetDate),
      date: targetDate,
      status: ReconciliationStatus.IN_PROGRESS,
      startedAt: new Date(),
    })

    const previousReconciliation = await reconciliationRepo.findOne({
      where: {
        date: yesterday,
      },
    })

    const yesterdayTransactions = await transactionRepo.find({
      where: {
        status: TransactionStatus.CONFIRMED,
        createdAt: LessThanOrEqual(yesterdayEnd),
      },
    })

    let openingBalance = 0
    for (const tx of yesterdayTransactions) {
      if (
        tx.type === TransactionType.EARN ||
        tx.type === TransactionType.ROLLBACK ||
        tx.type === TransactionType.UNFREEZE
      ) {
        openingBalance += Number(tx.amount)
      } else {
        openingBalance -= Number(tx.amount)
      }
    }

    if (previousReconciliation) {
      openingBalance = Number(previousReconciliation.closingBalance)
    }

    const todayTransactions = await transactionRepo.find({
      where: {
        status: TransactionStatus.CONFIRMED,
        createdAt: Between(startOfDay, endOfDay),
      },
    })

    let totalIssued = 0
    let totalConsumed = 0
    let totalExpired = 0
    let totalAdjusted = 0
    let totalRollbacked = 0

    for (const tx of todayTransactions) {
      const amount = Number(tx.amount)
      switch (tx.type) {
        case TransactionType.EARN:
          totalIssued += amount
          break
        case TransactionType.SPEND:
        case TransactionType.FREEZE:
          totalConsumed += amount
          break
        case TransactionType.EXPIRE:
          totalExpired += amount
          break
        case TransactionType.ADJUST:
          totalAdjusted += amount
          break
        case TransactionType.ROLLBACK:
        case TransactionType.UNFREEZE:
          totalRollbacked += amount
          break
      }
    }

    const expectedBalance =
      openingBalance + totalIssued - totalConsumed - totalExpired + totalAdjusted + totalRollbacked

    const allAccounts = await accountRepo.find()
    let actualBalance = 0
    for (const account of allAccounts) {
      actualBalance += Number(account.totalBalance)
    }

    const difference = expectedBalance - actualBalance
    const warnings: any[] = []
    const errors: any[] = []

    if (Math.abs(difference) > 0.01) {
      errors.push({
        type: 'BALANCE_MISMATCH',
        message: `余额不一致，预期: ${expectedBalance}, 实际: ${actualBalance}, 差异: ${difference}`,
        expected: expectedBalance,
        actual: actualBalance,
        difference: difference,
      })
    }

    for (const account of allAccounts) {
      const memberTotal = Number(account.totalBalance)
      const memberAvailable = Number(account.availableBalance)
      const memberFrozen = Number(account.frozenBalance)
      const memberPending = Number(account.pendingBalance)

      const calculatedTotal = memberAvailable + memberFrozen + memberPending
      
      if (Math.abs(memberTotal - calculatedTotal) > 0.01) {
        warnings.push({
          type: 'ACCOUNT_INCONSISTENCY',
          memberId: account.memberId,
          message: `会员账户余额不一致，总余额: ${memberTotal}, 计算值: ${calculatedTotal}`,
        })
      }
    }

    reconciliation.openingBalance = openingBalance
    reconciliation.closingBalance = actualBalance
    reconciliation.totalIssued = totalIssued
    reconciliation.totalConsumed = totalConsumed
    reconciliation.totalExpired = totalExpired
    reconciliation.totalAdjusted = totalAdjusted
    reconciliation.totalRollbacked = totalRollbacked
    reconciliation.expectedBalance = expectedBalance
    reconciliation.actualBalance = actualBalance
    reconciliation.difference = difference
    reconciliation.hasWarning = warnings.length > 0
    reconciliation.hasError = errors.length > 0
    reconciliation.warnings = warnings
    reconciliation.errors = errors
    reconciliation.completedAt = new Date()

    if (errors.length > 0) {
      reconciliation.status = ReconciliationStatus.FAILED
    } else if (warnings.length > 0) {
      reconciliation.status = ReconciliationStatus.WARNING
    } else {
      reconciliation.status = ReconciliationStatus.SUCCESS
    }

    const savedReconciliation = await reconciliationRepo.save(reconciliation)

    return this.mapToResult(savedReconciliation)
  }

  async getReconciliationByDate(date: Date): Promise<DailyReconciliation | null> {
    const reconciliationRepo = AppDataSource.getRepository(DailyReconciliation)
    
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    return reconciliationRepo.findOne({
      where: { date: targetDate },
    })
  }

  async listReconciliations(
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    items: DailyReconciliation[]
    total: number
    page: number
    pageSize: number
  }> {
    const reconciliationRepo = AppDataSource.getRepository(DailyReconciliation)
    
    const [items, total] = await reconciliationRepo.findAndCount({
      order: { date: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    return {
      items,
      total,
      page,
      pageSize,
    }
  }

  private mapToResult(reconciliation: DailyReconciliation): ReconciliationResult {
    return {
      success: reconciliation.status === ReconciliationStatus.SUCCESS || reconciliation.status === ReconciliationStatus.WARNING,
      reconciliationId: reconciliation.id,
      reconciliationNo: reconciliation.reconciliationNo,
      date: reconciliation.date,
      status: reconciliation.status,
      openingBalance: Number(reconciliation.openingBalance),
      closingBalance: Number(reconciliation.closingBalance),
      totalIssued: Number(reconciliation.totalIssued),
      totalConsumed: Number(reconciliation.totalConsumed),
      totalExpired: Number(reconciliation.totalExpired),
      expectedBalance: Number(reconciliation.expectedBalance),
      actualBalance: Number(reconciliation.actualBalance),
      difference: Number(reconciliation.difference),
      hasWarning: reconciliation.hasWarning,
      hasError: reconciliation.hasError,
    }
  }

  private generateReconciliationNo(date: Date): string {
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
    const timeStr = `${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`
    return `REC-${dateStr}-${timeStr}`
  }
}
