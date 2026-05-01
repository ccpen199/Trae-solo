export interface RuleCondition {
  type: 'comparison' | 'logical' | 'exists' | 'range'
  field: string
  operator?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'notIn'
  value?: any
  logical?: 'and' | 'or'
  conditions?: RuleCondition[]
  min?: number
  max?: number
}

export interface RuleAction {
  type: 'award_points' | 'send_notification' | 'update_member_level'
  points?: number
  pointsFormula?: string
  multiplier?: number
  maxPoints?: number
  notificationType?: string
  notificationTemplate?: string
  levelThreshold?: number
}

export interface RuleConstraints {
  dailyLimit?: number
  weeklyLimit?: number
  monthlyLimit?: number
  perUserLimit?: number
  globalLimit?: number
  minTransactionAmount?: number
  maxTransactionAmount?: number
  excludeUserLevels?: number[]
  includeUserLevels?: number[]
  effectiveHours?: number[]
  effectiveDays?: number[]
}

export interface RuleExecutionContext {
  eventType: string
  memberId: string
  memberInfo: {
    level: number
    totalPoints: number
    totalConsumption: number
    registrationDate: Date
    birthDate?: Date
  }
  eventData: Record<string, any>
  businessNo?: string
  currentTime: Date
}

export interface RuleMatchResult {
  ruleId: string
  ruleCode: string
  ruleName: string
  matched: boolean
  conditionsPassed: boolean
  constraintsPassed: boolean
  actions?: RuleAction[]
  failureReason?: string
}

export interface RuleExecutionResult {
  success: boolean
  ruleId: string
  ruleCode: string
  actionsExecuted: RuleAction[]
  pointsAwarded: number
  transactionId?: string
  voucherId?: string
  errorMessage?: string
}
