import BaseRepository from './base.js'
import type { AuditRule } from '../../shared/types/index.js'

interface AuditCreateData {
  ruleName: string
  ruleCode: string
  ruleCondition: string
  riskLevel: 'low' | 'medium' | 'high'
  threshold?: number
  enabled?: boolean
}

interface AuditUpdateData {
  ruleName?: string
  ruleCondition?: string
  riskLevel?: 'low' | 'medium' | 'high'
  threshold?: number
  enabled?: boolean
}

class AuditRepository extends BaseRepository<AuditRule> {
  constructor() {
    super('audit_rules')
  }

  findAllEnabled(): AuditRule[] {
    return this.findAll([{ field: 'enabled', value: 1 }], 'created_at', 'DESC')
  }

  findByRuleCode(ruleCode: string): AuditRule | undefined {
    return this.findOne([{ field: 'rule_code', value: ruleCode }])
  }

  create(data: AuditCreateData): { id: number; changes: number } {
    const auditData = {
      rule_name: data.ruleName,
      rule_code: data.ruleCode,
      rule_condition: data.ruleCondition,
      risk_level: data.riskLevel,
      threshold: data.threshold || 0,
      enabled: data.enabled !== undefined ? (data.enabled ? 1 : 0) : 1,
    } as unknown as Partial<AuditRule>
    return super.create(auditData)
  }

  updateEnabled(id: number, enabled: boolean): { changes: number } {
    const updateData = { enabled: enabled ? 1 : 0 } as unknown as Partial<AuditRule>
    return this.update(id, updateData)
  }
}

const auditRepository = new AuditRepository()

export default auditRepository
export { AuditRepository, type AuditCreateData, type AuditUpdateData }
