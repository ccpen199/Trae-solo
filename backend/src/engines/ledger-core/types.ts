import { VoucherType, AccountType, EntryDirection } from '../../entities'

export interface LedgerEntryInput {
  direction: EntryDirection
  accountType: AccountType
  accountRef?: string
  memberId?: string
  amount: number
  description?: string
}

export interface LedgerVoucherInput {
  type: VoucherType
  description?: string
  businessType?: string
  businessNo?: string
  memberId?: string
  entries: LedgerEntryInput[]
  operatorId?: string
  metadata?: Record<string, any>
}

export interface LedgerPostingResult {
  success: boolean
  voucherId: string
  voucherNo: string
  postedAt: Date
  affectedAccounts: {
    memberId: string
    balanceChange: number
    availableBalanceChange: number
    frozenBalanceChange: number
    pendingBalanceChange: number
  }[]
}

export interface LedgerRollbackResult {
  success: boolean
  voucherId: string
  voucherNo: string
  rollbackedAt: Date
  affectedAccounts: {
    memberId: string
    balanceChange: number
  }[]
}

export interface AccountBalance {
  memberId: string
  totalBalance: number
  availableBalance: number
  frozenBalance: number
  pendingBalance: number
  version: number
}

export interface LedgerValidationResult {
  valid: boolean
  totalDebit: number
  totalCredit: number
  isBalanced: boolean
  errors: string[]
}
