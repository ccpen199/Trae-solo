import { AppDataSource } from '../config/database'
import {
  Member,
  PointsAccount,
  PointsTransaction,
  TransactionType,
  TransactionStatus,
  BusinessEvent,
  EventType,
  VoucherType,
  AccountType,
  EntryDirection,
} from '../entities'
import { EntityManager } from 'typeorm'
import { RulesOrchestrator } from '../engines/rules-orchestrator'
import { LedgerCore } from '../engines/ledger-core'
import { ExpiryManager } from '../engines/expiry-manager'

export interface PointsEarnResult {
  success: boolean
  pointsEarned?: number
  transactionId?: string
  voucherId?: string
  message?: string
}

export interface PointsQueryResult {
  totalBalance: number
  availableBalance: number
  frozenBalance: number
  pendingBalance: number
  totalEarned: number
  totalSpent: number
  totalExpired: number
}

export class PointsService {
  private static instance: PointsService

  private constructor() {}

  static getInstance(): PointsService {
    if (!PointsService.instance) {
      PointsService.instance = new PointsService()
    }
    return PointsService.instance
  }

  async getPointsInfo(memberId: string): Promise<PointsQueryResult | null> {
    const memberRepo = AppDataSource.getRepository(Member)
    const accountRepo = AppDataSource.getRepository(PointsAccount)

    const member = await memberRepo.findOne({
      where: { id: memberId },
    })

    if (!member) {
      return null
    }

    const account = await accountRepo.findOne({
      where: { memberId },
    })

    if (!account) {
      return null
    }

    return {
      totalBalance: Number(account.totalBalance),
      availableBalance: Number(account.availableBalance),
      frozenBalance: Number(account.frozenBalance),
      pendingBalance: Number(account.pendingBalance),
      totalEarned: Number(member.totalPointsEarned),
      totalSpent: Number(member.totalPointsSpent),
      totalExpired: Number(member.totalPointsExpired),
    }
  }

  async getTransactions(
    memberId: string,
    page: number = 1,
    pageSize: number = 20,
    filters?: {
      type?: TransactionType
      status?: TransactionStatus
      startDate?: Date
      endDate?: Date
    }
  ): Promise<{
    items: PointsTransaction[]
    total: number
    page: number
    pageSize: number
  }> {
    const transactionRepo = AppDataSource.getRepository(PointsTransaction)
    
    const query = transactionRepo.createQueryBuilder('transaction')
      .where('transaction.memberId = :memberId', { memberId })

    if (filters?.type) {
      query.andWhere('transaction.type = :type', { type: filters.type })
    }

    if (filters?.status) {
      query.andWhere('transaction.status = :status', { status: filters.status })
    }

    if (filters?.startDate) {
      query.andWhere('transaction.createdAt >= :startDate', { startDate: filters.startDate })
    }

    if (filters?.endDate) {
      query.andWhere('transaction.createdAt <= :endDate', { endDate: filters.endDate })
    }

    query.orderBy('transaction.createdAt', 'DESC')

    const [items, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount()

    return {
      items,
      total,
      page,
      pageSize,
    }
  }

  async awardPoints(
    memberId: string,
    points: number,
    businessType: string,
    businessNo: string,
    description?: string,
    operatorId?: string,
    expiryDate?: Date
  ): Promise<PointsEarnResult> {
    if (points <= 0) {
      return { success: false, message: '积分数量必须大于0' }
    }

    return AppDataSource.transaction(async (manager: EntityManager) => {
      const memberRepo = manager.getRepository(Member)
      const ledgerCore = LedgerCore.getInstance()
      const expiryManager = ExpiryManager.getInstance()

      const member = await memberRepo.findOne({
        where: { id: memberId },
        lock: { mode: 'pessimistic_write' },
      })

      if (!member) {
        return { success: false, message: '会员不存在' }
      }

      const voucher = await ledgerCore.createVoucher({
        type: VoucherType.POINTS_EARN,
        description: description || `积分入账: ${points} 积分`,
        businessType,
        businessNo,
        memberId,
        entries: [
          {
            direction: EntryDirection.DEBIT,
            accountType: AccountType.POINTS_RESERVE,
            amount: points,
            description: '积分储备账户',
          },
          {
            direction: EntryDirection.CREDIT,
            accountType: AccountType.MEMBER_POINTS,
            memberId,
            amount: points,
            description: '会员积分账户',
          },
        ],
        operatorId,
        metadata: {
          businessType,
          businessNo,
          points,
        },
      })

      const postingResult = await ledgerCore.postVoucher(voucher.id)

      member.totalPointsEarned = Number(member.totalPointsEarned) + points
      await memberRepo.save(member)

      const transaction = postingResult.affectedAccounts.find(a => a.memberId === memberId)

      if (transaction) {
        const earnedDate = new Date()
        const effectiveExpiryDate = expiryDate || expiryManager.calculateExpiryDate(earnedDate)
        
        await expiryManager.createExpiryRecord(
          memberId,
          '',
          points,
          earnedDate,
          effectiveExpiryDate
        )
      }

      return {
        success: true,
        pointsEarned: points,
        voucherId: voucher.id,
      }
    })
  }

  async processBusinessEvent(
    eventType: EventType,
    memberId: string,
    eventData: Record<string, any>,
    businessNo?: string
  ): Promise<{ success: boolean; totalPoints: number; results: any[] }> {
    const eventRepo = AppDataSource.getRepository(BusinessEvent)

    const event = eventRepo.create({
      eventNo: this.generateEventNo(),
      type: eventType,
      memberId,
      businessNo,
      eventData,
      status: 'pending' as any,
    })

    const savedEvent = await eventRepo.save(event)

    const orchestrator = RulesOrchestrator.getInstance()
    const result = await orchestrator.processEvent(savedEvent)

    let totalPoints = 0
    for (const execResult of result.results) {
      if (execResult.success && execResult.pointsAwarded > 0) {
        totalPoints += execResult.pointsAwarded
        
        await this.awardPoints(
          memberId,
          execResult.pointsAwarded,
          `rule_${execResult.ruleCode}`,
          businessNo || savedEvent.eventNo,
          `规则触发: ${execResult.ruleCode}`,
          undefined,
          undefined
        )
      }
    }

    return {
      success: result.success,
      totalPoints,
      results: result.results,
    }
  }

  private generateEventNo(): string {
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
    const random = String(Math.floor(Math.random() * 1000000)).padStart(6, '0')
    return `EVT-${dateStr}-${timeStr}-${random}`
  }
}
