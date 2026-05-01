export interface ExpiryScanResult {
  scannedCount: number
  expiringSoonCount: number
  expiredCount: number
  notificationsSent: number
  pointsCleared: number
  errors: string[]
}

export interface ExpiringPointsInfo {
  expiryId: string
  memberId: string
  remainingPoints: number
  expiryDate: Date
  daysUntilExpiry: number
  transactionId: string
}

export interface ExpiredPointsInfo {
  expiryId: string
  memberId: string
  remainingPoints: number
  expiryDate: Date
  daysExpired: number
  transactionId: string
}

export interface NotificationConfig {
  channels: ('in_app' | 'sms' | 'email' | 'wechat')[]
  templateId?: string
  reminderDays: number[]
  enableReminder: boolean
}

export interface ExpiryPolicy {
  defaultExpiryDays: number
  enableExpiry: boolean
  enableReminder: boolean
  reminderDays: number[]
  enableAutoClear: boolean
  clearTime: string
}

export interface ExpiryClearingResult {
  success: boolean
  expiryId: string
  memberId: string
  pointsCleared: number
  transactionId?: string
  voucherId?: string
  errorMessage?: string
}
