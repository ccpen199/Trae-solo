import { ExchangeType, ExchangeOrderStatus } from '../../entities'

export interface ExchangeItem {
  itemId: string
  itemName: string
  itemType: ExchangeType
  pointsPerUnit: number
  quantity: number
  availableStock?: number
  itemDetails?: Record<string, any>
}

export interface ExchangeRequest {
  memberId: string
  items: ExchangeItem[]
  businessNo?: string
  operatorId?: string
  metadata?: Record<string, any>
}

export interface ExchangeValidationResult {
  valid: boolean
  totalPoints: number
  errors: string[]
  warnings: string[]
}

export interface ExchangeFreezeResult {
  success: boolean
  orderId: string
  orderNo: string
  frozenPoints: number
  freezeExpiresAt: Date
  voucherId?: string
  transactionId?: string
  errorMessage?: string
}

export interface ExchangeConfirmResult {
  success: boolean
  orderId: string
  orderNo: string
  deductedPoints: number
  voucherId?: string
  transactionId?: string
  errorMessage?: string
}

export interface ExchangeRollbackResult {
  success: boolean
  orderId: string
  orderNo: string
  rolledbackPoints: number
  voucherId?: string
  transactionId?: string
  errorMessage?: string
}

export interface ExchangeCancelResult {
  success: boolean
  orderId: string
  orderNo: string
  rolledbackPoints: number
  errorMessage?: string
}

export interface ExchangeStateTransition {
  fromStatus: ExchangeOrderStatus
  toStatus: ExchangeOrderStatus
  action: string
  allowed: boolean
  reason?: string
}
