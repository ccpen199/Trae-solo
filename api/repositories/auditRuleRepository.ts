import BaseRepository from './base.js'
import type { PaginationParams, PaginationResult } from './base.js'

interface AuditRule {
  id: number
  ruleName: string
  ruleCode: string
  ruleCondition: string
  riskLevel: 'low' | 'medium' | 'high'
  threshold: number | null
  enabled: boolean
  createdAt: string | null
}

interface AuditRuleCreateData {
  ruleName: string
  ruleCode: string
  ruleCondition: string
  riskLevel: 'low' | 'medium' | 'high'
  threshold?: number
  enabled?: boolean
}

interface AuditRuleUpdateData {
  ruleName?: string
  ruleCondition?: string
  riskLevel?: 'low' | 'medium' | 'high'
  threshold?: number
  enabled?: boolean
}

class AuditRuleRepository extends BaseRepository<AuditRule> {
  constructor() {
    super('audit_rules')
  }

  findByRuleCode(ruleCode: string): AuditRule | undefined {
    return this.findOne([{ field: 'rule_code', value: ruleCode }])
  }

  findByEnabled(enabled: boolean): AuditRule[] {
    return this.findAll([{ field: 'enabled', value: enabled ? 1 : 0 }], 'created_at', 'DESC')
  }

  findByRiskLevel(riskLevel: string): AuditRule[] {
    return this.findAll([{ field: 'risk_level', value: riskLevel }], 'created_at', 'DESC')
  }

  findAllPaginated(pagination: PaginationParams = {}): PaginationResult<AuditRule> {
    return this.findPaginated(
      pagination,
      [],
      'created_at',
      'DESC',
    )
  }

  create(data: AuditRuleCreateData): { id: number; changes: number } {
    const ruleData = {
      rule_name: data.ruleName,
      rule_code: data.ruleCode,
      rule_condition: data.ruleCondition,
      risk_level: data.riskLevel,
      threshold: data.threshold ?? null,
      enabled: data.enabled !== undefined ? (data.enabled ? 1 : 0) : 1,
    } as unknown as Partial<AuditRule>
    return super.create(ruleData)
  }

  update(id: number, data: AuditRuleUpdateData): { changes: number } {
    const updateData: Partial<AuditRule> = {}
    if (data.ruleName !== undefined) {
      ;(updateData as Record<string, unknown>).rule_name = data.ruleName
    }
    if (data.ruleCondition !== undefined) {
      ;(updateData as Record<string, unknown>).rule_condition = data.ruleCondition
    }
    if (data.riskLevel !== undefined) {
      ;(updateData as Record<string, unknown>).risk_level = data.riskLevel
    }
    if (data.threshold !== undefined) {
      ;(updateData as Record<string, unknown>).threshold = data.threshold
    }
    if (data.enabled !== undefined) {
      ;(updateData as Record<string, unknown>).enabled = data.enabled ? 1 : 0
    }
    return super.update(id, updateData)
  }

  toggleEnabled(id: number): { changes: number } {
    const rule = this.findById(id)
    if (!rule) {
      return { changes: 0 }
    }
    return this.update(id, { enabled: !rule.enabled })
  }
}

const auditRuleRepository = new AuditRuleRepository()

export default auditRuleRepository
export { AuditRuleRepository, type AuditRule, type AuditRuleCreateData, type AuditRuleUpdateData }
