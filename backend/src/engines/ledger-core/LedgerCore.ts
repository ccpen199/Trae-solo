import { v4 as uuidv4 } from 'uuid'
import { AppDataSource } from '../../config/database'
import {
  LedgerVoucher,
  LedgerEntry,
  VoucherType,
  VoucherStatus,
  AccountType,
  EntryDirection,
  PointsAccount,
  PointsTransaction,
  TransactionType,
  TransactionStatus,
} from '../../entities'
import {
  LedgerVoucherInput,
  LedgerPostingResult,
  LedgerRollbackResult,
  AccountBalance,
  LedgerValidationResult,
} from './types'
import { EntityManager } from 'typeorm'

export class LedgerCore {
  private static instance: LedgerCore

  private constructor() {}

  static getInstance(): LedgerCore {
    if (!LedgerCore.instance) {
      LedgerCore.instance = new LedgerCore()
    }
    return LedgerCore.instance
  }

  async createVoucher(input: LedgerVoucherInput): Promise<LedgerVoucher> {
    const validation = this.validateVoucher(input)
    if (!validation.valid) {
      throw new Error(`凭证验证失败: ${validation.errors.join(', ')}`)
    }

    const voucherRepo = AppDataSource.getRepository(LedgerVoucher)
    const entryRepo = AppDataSource.getRepository(LedgerEntry)

    const voucherNo = this.generateVoucherNo(input.type)

    const voucher = voucherRepo.create({
      voucherNo,
      type: input.type,
      status: VoucherStatus.PENDING,
      totalDebit: validation.totalDebit,
      totalCredit: validation.totalCredit,
      description: input.description,
      businessType: input.businessType,
      businessNo: input.businessNo,
      memberId: input.memberId,
      operatorId: input.operatorId,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    })

    const savedVoucher = await voucherRepo.save(voucher)

    const entries: LedgerEntry[] = input.entries.map((entry, index) => {
      return entryRepo.create({
        entryNo: `${voucherNo}-${String(index + 1).padStart(3, '0')}`,
        voucherId: savedVoucher.id,
        direction: entry.direction,
        accountType: entry.accountType,
        accountRef: entry.accountRef,
        memberId: entry.memberId,
        amount: entry.amount,
        description: entry.description,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      })
    })

    await entryRepo.save(entries)

    return voucherRepo.findOne({
      where: { id: savedVoucher.id },
      relations: ['entries'],
    }) as Promise<LedgerVoucher>
  }

  async postVoucher(voucherId: string): Promise<LedgerPostingResult> {
    return AppDataSource.transaction(async (manager: EntityManager) => {
      const voucherRepo = manager.getRepository(LedgerVoucher)
      const accountRepo = manager.getRepository(PointsAccount)
      const transactionRepo = manager.getRepository(PointsTransaction)

      const voucher = await voucherRepo.findOne({
        where: { id: voucherId },
        relations: ['entries'],
        lock: { mode: 'pessimistic_write' },
      })

      if (!voucher) {
        throw new Error(`凭证 ${voucherId} 不存在`)
      }

      if (voucher.status !== VoucherStatus.PENDING) {
        throw new Error(`凭证 ${voucherId} 状态不是待过账，当前状态: ${voucher.status}`)
      }

      const affectedAccounts: LedgerPostingResult['affectedAccounts'] = []
      const memberEntries = voucher.entries.filter(e => e.memberId)

      const memberGroups = new Map<string, typeof memberEntries>()
      for (const entry of memberEntries) {
        if (!memberGroups.has(entry.memberId!)) {
          memberGroups.set(entry.memberId!, [])
        }
        memberGroups.get(entry.memberId!)!.push(entry)
      }

      for (const [memberId, entries] of memberGroups) {
        const account = await accountRepo.findOne({
          where: { memberId },
          lock: { mode: 'pessimistic_write' },
        })

        if (!account) {
          throw new Error(`会员 ${memberId} 的积分账户不存在`)
        }

        const accountChanges = this.calculateAccountChanges(entries, account)

        account.totalBalance = Number(account.totalBalance) + accountChanges.totalChange
        account.availableBalance = Number(account.availableBalance) + accountChanges.availableChange
        account.frozenBalance = Number(account.frozenBalance) + accountChanges.frozenChange
        account.pendingBalance = Number(account.pendingBalance) + accountChanges.pendingChange

        await accountRepo.save(account)

        affectedAccounts.push({
          memberId,
          balanceChange: accountChanges.totalChange,
          availableBalanceChange: accountChanges.availableChange,
          frozenBalanceChange: accountChanges.frozenChange,
          pendingBalanceChange: accountChanges.pendingChange,
        })

        const transactionType = this.mapVoucherToTransactionType(voucher.type)
        if (transactionType) {
          const transaction = transactionRepo.create({
            transactionNo: this.generateTransactionNo(transactionType),
            memberId,
            type: transactionType,
            status: TransactionStatus.CONFIRMED,
            amount: Math.abs(accountChanges.totalChange),
            balanceBefore: Number(account.totalBalance) - accountChanges.totalChange,
            balanceAfter: Number(account.totalBalance),
            businessType: voucher.businessType,
            businessNo: voucher.businessNo,
            ledgerVoucherId: voucher.id,
            description: voucher.description,
            operatorId: voucher.operatorId,
            confirmedAt: new Date(),
          })
          await transactionRepo.save(transaction)
        }
      }

      voucher.status = VoucherStatus.POSTED
      voucher.postedAt = new Date()
      await voucherRepo.save(voucher)

      return {
        success: true,
        voucherId: voucher.id,
        voucherNo: voucher.voucherNo,
        postedAt: voucher.postedAt!,
        affectedAccounts,
      }
    })
  }

  async rollbackVoucher(voucherId: string, reason?: string): Promise<LedgerRollbackResult> {
    return AppDataSource.transaction(async (manager: EntityManager) => {
      const voucherRepo = manager.getRepository(LedgerVoucher)
      const accountRepo = manager.getRepository(PointsAccount)

      const voucher = await voucherRepo.findOne({
        where: { id: voucherId },
        relations: ['entries'],
        lock: { mode: 'pessimistic_write' },
      })

      if (!voucher) {
        throw new Error(`凭证 ${voucherId} 不存在`)
      }

      if (voucher.status !== VoucherStatus.POSTED) {
        throw new Error(`凭证 ${voucherId} 状态不是已过账，无法回滚`)
      }

      const affectedAccounts: LedgerRollbackResult['affectedAccounts'] = []
      const memberEntries = voucher.entries.filter(e => e.memberId)

      const memberGroups = new Map<string, typeof memberEntries>()
      for (const entry of memberEntries) {
        if (!memberGroups.has(entry.memberId!)) {
          memberGroups.set(entry.memberId!, [])
        }
        memberGroups.get(entry.memberId!)!.push(entry)
      }

      for (const [memberId, entries] of memberGroups) {
        const account = await accountRepo.findOne({
          where: { memberId },
          lock: { mode: 'pessimistic_write' },
        })

        if (!account) {
          throw new Error(`会员 ${memberId} 的积分账户不存在`)
        }

        const accountChanges = this.calculateAccountChanges(entries, account)
        
        const reverseChanges = {
          totalChange: -accountChanges.totalChange,
          availableChange: -accountChanges.availableChange,
          frozenChange: -accountChanges.frozenChange,
          pendingChange: -accountChanges.pendingChange,
        }

        account.totalBalance = Number(account.totalBalance) + reverseChanges.totalChange
        account.availableBalance = Number(account.availableBalance) + reverseChanges.availableChange
        account.frozenBalance = Number(account.frozenBalance) + reverseChanges.frozenChange
        account.pendingBalance = Number(account.pendingBalance) + reverseChanges.pendingChange

        if (account.totalBalance < 0 || account.availableBalance < 0) {
          throw new Error(`回滚操作会导致账户余额为负，会员: ${memberId}`)
        }

        await accountRepo.save(account)

        affectedAccounts.push({
          memberId,
          balanceChange: reverseChanges.totalChange,
        })
      }

      voucher.status = VoucherStatus.CANCELLED
      voucher.cancelledAt = new Date()
      await voucherRepo.save(voucher)

      return {
        success: true,
        voucherId: voucher.id,
        voucherNo: voucher.voucherNo,
        rollbackedAt: voucher.cancelledAt!,
        affectedAccounts,
      }
    })
  }

  async getVoucher(voucherId: string): Promise<LedgerVoucher | null> {
    const voucherRepo = AppDataSource.getRepository(LedgerVoucher)
    return voucherRepo.findOne({
      where: { id: voucherId },
      relations: ['entries'],
    })
  }

  validateVoucher(input: LedgerVoucherInput): LedgerValidationResult {
    const errors: string[] = []
    let totalDebit = 0
    let totalCredit = 0

    if (!input.entries || input.entries.length === 0) {
      errors.push('凭证必须包含至少一条分录')
      return { valid: false, totalDebit: 0, totalCredit: 0, isBalanced: false, errors }
    }

    for (const entry of input.entries) {
      if (entry.amount <= 0) {
        errors.push(`分录金额必须大于0: ${entry.description}`)
        continue
      }

      if (entry.direction === EntryDirection.DEBIT) {
        totalDebit += entry.amount
      } else {
        totalCredit += entry.amount
      }
    }

    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.0001

    if (!isBalanced) {
      errors.push(`借贷不平衡: 借方=${totalDebit}, 贷方=${totalCredit}`)
    }

    return {
      valid: errors.length === 0,
      totalDebit,
      totalCredit,
      isBalanced,
      errors,
    }
  }

  private calculateAccountChanges(
    entries: LedgerEntry[],
    account: PointsAccount
  ): {
    totalChange: number
    availableChange: number
    frozenChange: number
    pendingChange: number
  } {
    let totalChange = 0
    let availableChange = 0
    let frozenChange = 0
    let pendingChange = 0

    for (const entry of entries) {
      const amount = entry.direction === EntryDirection.DEBIT ? entry.amount : -entry.amount

      switch (entry.accountType) {
        case AccountType.MEMBER_POINTS:
          totalChange += amount
          availableChange += amount
          break
        case AccountType.POINTS_FROZEN:
          totalChange += amount
          frozenChange += amount
          break
        case AccountType.POINTS_PENDING:
          totalChange += amount
          pendingChange += amount
          break
        case AccountType.POINTS_EXPIRED:
          totalChange += amount
          availableChange += amount
          break
        default:
          break
      }
    }

    return { totalChange, availableChange, frozenChange, pendingChange }
  }

  private mapVoucherToTransactionType(voucherType: VoucherType): TransactionType | null {
    const mapping: Record<VoucherType, TransactionType> = {
      [VoucherType.POINTS_EARN]: TransactionType.EARN,
      [VoucherType.POINTS_SPEND]: TransactionType.SPEND,
      [VoucherType.POINTS_FREEZE]: TransactionType.FREEZE,
      [VoucherType.POINTS_UNFREEZE]: TransactionType.UNFREEZE,
      [VoucherType.POINTS_EXPIRE]: TransactionType.EXPIRE,
      [VoucherType.POINTS_ADJUST]: TransactionType.ADJUST,
      [VoucherType.POINTS_ROLLBACK]: TransactionType.ROLLBACK,
    }
    return mapping[voucherType] || null
  }

  private generateVoucherNo(type: VoucherType): string {
    const date = new Date()
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
    const timeStr = `${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
    
    const typeCode = {
      [VoucherType.POINTS_EARN]: 'EARN',
      [VoucherType.POINTS_SPEND]: 'SPEND',
      [VoucherType.POINTS_FREEZE]: 'FRZE',
      [VoucherType.POINTS_UNFREEZE]: 'UFRZ',
      [VoucherType.POINTS_EXPIRE]: 'EXPR',
      [VoucherType.POINTS_ADJUST]: 'ADJT',
      [VoucherType.POINTS_ROLLBACK]: 'RLLB',
    }[type] || 'VCHR'

    return `${typeCode}-${dateStr}-${timeStr}-${random}`
  }

  private generateTransactionNo(type: TransactionType): string {
    const date = new Date()
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
    const timeStr = `${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`
    const random = String(Math.floor(Math.random() * 1000000)).padStart(6, '0')
    
    const typeCode = {
      [TransactionType.EARN]: 'EARN',
      [TransactionType.SPEND]: 'SPEND',
      [TransactionType.FREEZE]: 'FRZE',
      [TransactionType.UNFREEZE]: 'UFRZ',
      [TransactionType.EXPIRE]: 'EXPR',
      [TransactionType.ADJUST]: 'ADJT',
      [TransactionType.ROLLBACK]: 'RLLB',
      [TransactionType.CANCELLED]: 'CNCL',
      [TransactionType.FAILED]: 'FAIL',
    }[type] || 'TRX'

    return `${typeCode}-${dateStr}${timeStr}-${random}`
  }
}
