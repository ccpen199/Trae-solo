import dotenv from 'dotenv'
import { AppDataSource } from '../../config/database'
import {
  ExchangeOrder,
  ExchangeOrderStatus,
  ExchangeType,
  PointsAccount,
  VoucherType,
  AccountType,
  EntryDirection,
  Member,
} from '../../entities'
import { EntityManager, In, MoreThan } from 'typeorm'
import { LedgerCore } from '../ledger-core'
import {
  ExchangeRequest,
  ExchangeValidationResult,
  ExchangeFreezeResult,
  ExchangeConfirmResult,
  ExchangeRollbackResult,
  ExchangeCancelResult,
  ExchangeStateTransition,
} from './types'

dotenv.config()

const FREEZE_TIMEOUT = parseInt(process.env.EXCHANGE_FREEZE_TIMEOUT || '1800000')

export class ExchangeGate {
  private static instance: ExchangeGate

  private readonly stateTransitions: Map<ExchangeOrderStatus, Set<ExchangeOrderStatus>>

  private constructor() {
    this.stateTransitions = new Map()
    this.stateTransitions.set(ExchangeOrderStatus.CREATED, new Set([
      ExchangeOrderStatus.FROZEN,
      ExchangeOrderStatus.CANCELLED,
      ExchangeOrderStatus.FAILED,
    ]))
    this.stateTransitions.set(ExchangeOrderStatus.FROZEN, new Set([
      ExchangeOrderStatus.CONFIRMED,
      ExchangeOrderStatus.CANCELLED,
      ExchangeOrderStatus.ROLLBACKED,
      ExchangeOrderStatus.FAILED,
    ]))
    this.stateTransitions.set(ExchangeOrderStatus.CONFIRMED, new Set([
      ExchangeOrderStatus.COMPLETED,
      ExchangeOrderStatus.ROLLBACKED,
    ]))
    this.stateTransitions.set(ExchangeOrderStatus.COMPLETED, new Set([]))
    this.stateTransitions.set(ExchangeOrderStatus.CANCELLED, new Set([]))
    this.stateTransitions.set(ExchangeOrderStatus.FAILED, new Set([]))
    this.stateTransitions.set(ExchangeOrderStatus.ROLLBACKED, new Set([]))
  }

  static getInstance(): ExchangeGate {
    if (!ExchangeGate.instance) {
      ExchangeGate.instance = new ExchangeGate()
    }
    return ExchangeGate.instance
  }

  canTransition(from: ExchangeOrderStatus, to: ExchangeOrderStatus): ExchangeStateTransition {
    const allowedTransitions = this.stateTransitions.get(from)
    const allowed = allowedTransitions?.has(to) || false

    let reason: string | undefined
    if (!allowed) {
      reason = `状态转换不允许: ${from} -> ${to}`
    }

    const action = this.getTransitionAction(from, to)

    return { fromStatus: from, toStatus: to, action, allowed, reason }
  }

  private getTransitionAction(from: ExchangeOrderStatus, to: ExchangeOrderStatus): string {
    const actionMap: Record<string, string> = {
      [`${ExchangeOrderStatus.CREATED}-${ExchangeOrderStatus.FROZEN}`]: 'freeze',
      [`${ExchangeOrderStatus.CREATED}-${ExchangeOrderStatus.CANCELLED}`]: 'cancel',
      [`${ExchangeOrderStatus.CREATED}-${ExchangeOrderStatus.FAILED}`]: 'fail',
      [`${ExchangeOrderStatus.FROZEN}-${ExchangeOrderStatus.CONFIRMED}`]: 'confirm',
      [`${ExchangeOrderStatus.FROZEN}-${ExchangeOrderStatus.CANCELLED}`]: 'cancel',
      [`${ExchangeOrderStatus.FROZEN}-${ExchangeOrderStatus.ROLLBACKED}`]: 'rollback',
      [`${ExchangeOrderStatus.FROZEN}-${ExchangeOrderStatus.FAILED}`]: 'fail',
      [`${ExchangeOrderStatus.CONFIRMED}-${ExchangeOrderStatus.COMPLETED}`]: 'complete',
      [`${ExchangeOrderStatus.CONFIRMED}-${ExchangeOrderStatus.ROLLBACKED}`]: 'rollback',
    }
    return actionMap[`${from}-${to}`] || 'unknown'
  }

  async validateExchange(request: ExchangeRequest): Promise<ExchangeValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    if (!request.items || request.items.length === 0) {
      errors.push('兑换商品列表不能为空')
      return { valid: false, totalPoints: 0, errors, warnings }
    }

    const accountRepo = AppDataSource.getRepository(PointsAccount)
    const account = await accountRepo.findOne({
      where: { memberId: request.memberId },
    })

    if (!account) {
      errors.push(`会员 ${request.memberId} 的积分账户不存在`)
      return { valid: false, totalPoints: 0, errors, warnings }
    }

    let totalPoints = 0

    for (const item of request.items) {
      if (item.quantity <= 0) {
        errors.push(`商品 ${item.itemId} 数量必须大于0`)
        continue
      }

      if (item.pointsPerUnit <= 0) {
        errors.push(`商品 ${item.itemId} 积分单价必须大于0`)
        continue
      }

      const itemPoints = item.pointsPerUnit * item.quantity
      totalPoints += itemPoints

      if (item.availableStock !== undefined && item.quantity > item.availableStock) {
        errors.push(`商品 ${item.itemId} 库存不足，当前库存: ${item.availableStock}`)
      }
    }

    if (totalPoints > Number(account.availableBalance)) {
      errors.push(`可用积分不足，当前可用: ${account.availableBalance}, 需要: ${totalPoints}`)
    }

    if (totalPoints <= 0) {
      errors.push('兑换总积分必须大于0')
    }

    return {
      valid: errors.length === 0,
      totalPoints,
      errors,
      warnings,
    }
  }

  async createAndFreeze(request: ExchangeRequest): Promise<ExchangeFreezeResult> {
    const validation = await this.validateExchange(request)
    if (!validation.valid) {
      return {
        success: false,
        orderId: '',
        orderNo: '',
        frozenPoints: 0,
        freezeExpiresAt: new Date(),
        errorMessage: validation.errors.join('; '),
      }
    }

    return AppDataSource.transaction(async (manager: EntityManager) => {
      const orderRepo = manager.getRepository(ExchangeOrder)
      const accountRepo = manager.getRepository(PointsAccount)
      const ledgerCore = LedgerCore.getInstance()

      const account = await accountRepo.findOne({
        where: { memberId: request.memberId },
        lock: { mode: 'pessimistic_write' },
      })

      if (!account) {
        return {
          success: false,
          orderId: '',
          orderNo: '',
          frozenPoints: 0,
          freezeExpiresAt: new Date(),
          errorMessage: '积分账户不存在',
        }
      }

      const firstItem = request.items[0]
      const totalPoints = validation.totalPoints

      const freezeExpiresAt = new Date(Date.now() + FREEZE_TIMEOUT)

      const order = orderRepo.create({
        orderNo: this.generateOrderNo(),
        memberId: request.memberId,
        exchangeType: firstItem.itemType,
        status: ExchangeOrderStatus.CREATED,
        itemId: firstItem.itemId,
        itemName: firstItem.itemName,
        itemDetails: firstItem.itemDetails ? JSON.stringify(firstItem.itemDetails) : null,
        quantity: firstItem.quantity,
        pointsPerUnit: firstItem.pointsPerUnit,
        totalPoints,
        freezeExpiresAt,
        businessNo: request.businessNo,
        operatorId: request.operatorId,
        metadata: request.metadata ? JSON.stringify(request.metadata) : null,
      })

      const savedOrder = await orderRepo.save(order)

      try {
        const voucher = await ledgerCore.createVoucher({
          type: VoucherType.POINTS_FREEZE,
          description: `兑换订单 ${savedOrder.orderNo} 积分冻结: ${totalPoints} 积分`,
          businessType: 'exchange_freeze',
          businessNo: savedOrder.orderNo,
          memberId: request.memberId,
          entries: [
            {
              direction: EntryDirection.CREDIT,
              accountType: AccountType.MEMBER_POINTS,
              memberId: request.memberId,
              amount: totalPoints,
              description: '会员积分账户',
            },
            {
              direction: EntryDirection.DEBIT,
              accountType: AccountType.POINTS_FROZEN,
              memberId: request.memberId,
              amount: totalPoints,
              description: '冻结积分账户',
            },
          ],
          operatorId: request.operatorId,
          metadata: { orderId: savedOrder.id },
        })

        const postingResult = await ledgerCore.postVoucher(voucher.id)

        savedOrder.status = ExchangeOrderStatus.FROZEN
        savedOrder.frozenPoints = totalPoints
        savedOrder.freezeVoucherId = voucher.id
        savedOrder.frozenAt = new Date()
        await orderRepo.save(savedOrder)

        return {
          success: true,
          orderId: savedOrder.id,
          orderNo: savedOrder.orderNo,
          frozenPoints: totalPoints,
          freezeExpiresAt,
          voucherId: voucher.id,
        }
      } catch (error: any) {
        savedOrder.status = ExchangeOrderStatus.FAILED
        savedOrder.failureReason = error.message
        savedOrder.failedAt = new Date()
        await orderRepo.save(savedOrder)

        return {
          success: false,
          orderId: savedOrder.id,
          orderNo: savedOrder.orderNo,
          frozenPoints: 0,
          freezeExpiresAt,
          errorMessage: error.message,
        }
      }
    })
  }

  async confirmExchange(orderId: string): Promise<ExchangeConfirmResult> {
    return AppDataSource.transaction(async (manager: EntityManager) => {
      const orderRepo = manager.getRepository(ExchangeOrder)
      const ledgerCore = LedgerCore.getInstance()

      const order = await orderRepo.findOne({
        where: { id: orderId },
        lock: { mode: 'pessimistic_write' },
      })

      if (!order) {
        return {
          success: false,
          orderId,
          orderNo: '',
          deductedPoints: 0,
          errorMessage: '兑换订单不存在',
        }
      }

      const transition = this.canTransition(order.status, ExchangeOrderStatus.CONFIRMED)
      if (!transition.allowed) {
        return {
          success: false,
          orderId,
          orderNo: order.orderNo,
          deductedPoints: 0,
          errorMessage: transition.reason || '状态转换不允许',
        }
      }

      if (order.freezeExpiresAt && new Date() > order.freezeExpiresAt) {
        return {
          success: false,
          orderId,
          orderNo: order.orderNo,
          deductedPoints: 0,
          errorMessage: '冻结已过期，请重新发起兑换',
        }
      }

      try {
        const voucher = await ledgerCore.createVoucher({
          type: VoucherType.POINTS_SPEND,
          description: `兑换订单 ${order.orderNo} 积分扣减: ${order.frozenPoints} 积分`,
          businessType: 'exchange_deduct',
          businessNo: order.orderNo,
          memberId: order.memberId,
          entries: [
            {
              direction: EntryDirection.CREDIT,
              accountType: AccountType.POINTS_FROZEN,
              memberId: order.memberId,
              amount: order.frozenPoints!,
              description: '冻结积分账户',
            },
            {
              direction: EntryDirection.DEBIT,
              accountType: AccountType.POINTS_RESERVE,
              amount: order.frozenPoints!,
              description: '积分储备账户',
            },
          ],
          operatorId: order.operatorId,
          metadata: { orderId: order.id },
        })

        await ledgerCore.postVoucher(voucher.id)

        order.status = ExchangeOrderStatus.CONFIRMED
        order.deductedPoints = order.frozenPoints
        order.deductVoucherId = voucher.id
        order.confirmedAt = new Date()
        await orderRepo.save(order)

        return {
          success: true,
          orderId: order.id,
          orderNo: order.orderNo,
          deductedPoints: order.frozenPoints!,
          voucherId: voucher.id,
        }
      } catch (error: any) {
        return {
          success: false,
          orderId,
          orderNo: order.orderNo,
          deductedPoints: 0,
          errorMessage: error.message,
        }
      }
    })
  }

  async completeExchange(orderId: string): Promise<{ success: boolean; errorMessage?: string }> {
    const orderRepo = AppDataSource.getRepository(ExchangeOrder)

    const order = await orderRepo.findOne({
      where: { id: orderId },
    })

    if (!order) {
      return { success: false, errorMessage: '兑换订单不存在' }
    }

    const transition = this.canTransition(order.status, ExchangeOrderStatus.COMPLETED)
    if (!transition.allowed) {
      return { success: false, errorMessage: transition.reason || '状态转换不允许' }
    }

    order.status = ExchangeOrderStatus.COMPLETED
    order.completedAt = new Date()
    await orderRepo.save(order)

    return { success: true }
  }

  async rollbackExchange(orderId: string, reason?: string): Promise<ExchangeRollbackResult> {
    return AppDataSource.transaction(async (manager: EntityManager) => {
      const orderRepo = manager.getRepository(ExchangeOrder)
      const ledgerCore = LedgerCore.getInstance()

      const order = await orderRepo.findOne({
        where: { id: orderId },
        lock: { mode: 'pessimistic_write' },
      })

      if (!order) {
        return {
          success: false,
          orderId,
          orderNo: '',
          rolledbackPoints: 0,
          errorMessage: '兑换订单不存在',
        }
      }

      const validStatuses = [ExchangeOrderStatus.FROZEN, ExchangeOrderStatus.CONFIRMED]
      if (!validStatuses.includes(order.status)) {
        return {
          success: false,
          orderId,
          orderNo: order.orderNo,
          rolledbackPoints: 0,
          errorMessage: `当前状态 ${order.status} 不允许回滚`,
        }
      }

      const pointsToRollback = order.deductedPoints || order.frozenPoints || 0

      if (pointsToRollback <= 0) {
        return {
          success: true,
          orderId: order.id,
          orderNo: order.orderNo,
          rolledbackPoints: 0,
        }
      }

      try {
        let voucherType: VoucherType
        let sourceAccount: AccountType

        if (order.status === ExchangeOrderStatus.FROZEN) {
          voucherType = VoucherType.POINTS_UNFREEZE
          sourceAccount = AccountType.POINTS_FROZEN
        } else {
          voucherType = VoucherType.POINTS_ROLLBACK
          sourceAccount = AccountType.POINTS_RESERVE
        }

        const voucher = await ledgerCore.createVoucher({
          type: voucherType,
          description: `兑换订单 ${order.orderNo} 积分回滚: ${pointsToRollback} 积分`,
          businessType: 'exchange_rollback',
          businessNo: order.orderNo,
          memberId: order.memberId,
          entries: [
            {
              direction: EntryDirection.DEBIT,
              accountType: sourceAccount,
              memberId: order.memberId,
              amount: pointsToRollback,
              description: order.status === ExchangeOrderStatus.FROZEN ? '冻结积分账户' : '储备积分账户',
            },
            {
              direction: EntryDirection.CREDIT,
              accountType: AccountType.MEMBER_POINTS,
              memberId: order.memberId,
              amount: pointsToRollback,
              description: '会员积分账户',
            },
          ],
          operatorId: order.operatorId,
          metadata: { orderId: order.id, reason },
        })

        await ledgerCore.postVoucher(voucher.id)

        order.status = ExchangeOrderStatus.ROLLBACKED
        order.rolledbackPoints = pointsToRollback
        order.rollbackVoucherId = voucher.id
        order.rollbackedAt = new Date()
        await orderRepo.save(order)

        return {
          success: true,
          orderId: order.id,
          orderNo: order.orderNo,
          rolledbackPoints: pointsToRollback,
          voucherId: voucher.id,
        }
      } catch (error: any) {
        return {
          success: false,
          orderId: order.id,
          orderNo: order.orderNo,
          rolledbackPoints: 0,
          errorMessage: error.message,
        }
      }
    })
  }

  async cancelExchange(orderId: string, reason?: string): Promise<ExchangeCancelResult> {
    const rollbackResult = await this.rollbackExchange(orderId, reason)

    if (rollbackResult.success) {
      return {
        success: true,
        orderId: rollbackResult.orderId,
        orderNo: rollbackResult.orderNo,
        rolledbackPoints: rollbackResult.rolledbackPoints,
      }
    }

    return {
      success: false,
      orderId: rollbackResult.orderId,
      orderNo: rollbackResult.orderNo,
      rolledbackPoints: 0,
      errorMessage: rollbackResult.errorMessage,
    }
  }

  async processTimeoutOrders(): Promise<{ processedCount: number; errors: string[] }> {
    const orderRepo = AppDataSource.getRepository(ExchangeOrder)
    const now = new Date()
    const errors: string[] = []
    let processedCount = 0

    const timeoutOrders = await orderRepo.find({
      where: {
        status: ExchangeOrderStatus.FROZEN,
        freezeExpiresAt: MoreThan(new Date(0)),
      },
    })

    for (const order of timeoutOrders) {
      if (order.freezeExpiresAt && now > order.freezeExpiresAt) {
        try {
          const result = await this.cancelExchange(order.id, '冻结超时自动取消')
          if (result.success) {
            processedCount++
          } else {
            errors.push(`处理超时订单失败 [${order.orderNo}]: ${result.errorMessage}`)
          }
        } catch (error: any) {
          errors.push(`处理超时订单异常 [${order.orderNo}]: ${error.message}`)
        }
      }
    }

    return { processedCount, errors }
  }

  private generateOrderNo(): string {
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
    const random = String(Math.floor(Math.random() * 1000000)).padStart(6, '0')
    return `EX-${dateStr}-${timeStr}-${random}`
  }
}
