import auditRuleRepository from '../repositories/auditRuleRepository.js'
import type { AuditRule } from '../../shared/types/index.js'
import type { PaginationParams } from '../repositories/base.js'

interface AuditRuleListResponse {
  success: boolean
  items: AuditRule[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  error?: string
}

interface CreateAuditRuleRequest {
  ruleName: string
  ruleCode: string
  ruleCondition: string
  riskLevel: 'low' | 'medium' | 'high'
  threshold?: number
  enabled?: boolean
}

interface UpdateAuditRuleRequest {
  ruleName?: string
  ruleCondition?: string
  riskLevel?: 'low' | 'medium' | 'high'
  threshold?: number
  enabled?: boolean
}

interface AuditRuleMutationResponse {
  success: boolean
  id: number
  message: string
  rule?: AuditRule
  error?: string
}

class AuditService {
  getAuditRules(pagination: PaginationParams = {}): AuditRuleListResponse {
    const result = auditRuleRepository.findAllPaginated(pagination)
    return {
      success: true,
      items: result.items as unknown as AuditRule[],
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    }
  }

  createAuditRule(request: CreateAuditRuleRequest): AuditRuleMutationResponse {
    const existing = auditRuleRepository.findByRuleCode(request.ruleCode)
    if (existing) {
      throw new Error('规则编码已存在')
    }

    const result = auditRuleRepository.create({
      ruleName: request.ruleName,
      ruleCode: request.ruleCode,
      ruleCondition: request.ruleCondition,
      riskLevel: request.riskLevel,
      threshold: request.threshold,
      enabled: request.enabled,
    })

    return {
      success: true,
      id: result.id,
      rule: auditRuleRepository.findById(result.id) as unknown as AuditRule,
      message: '稽核规则创建成功',
    }
  }

  updateAuditRule(ruleId: number, request: UpdateAuditRuleRequest): AuditRuleMutationResponse {
    const existing = auditRuleRepository.findById(ruleId)
    if (!existing) {
      throw new Error('稽核规则不存在')
    }

    auditRuleRepository.update(ruleId, request)

    return {
      success: true,
      id: ruleId,
      rule: auditRuleRepository.findById(ruleId) as unknown as AuditRule,
      message: '稽核规则更新成功',
    }
  }

  executeAudit(): Array<{ userId: number; ruleId: number; ruleName: string; riskLevel: string; matched: boolean }> {
    const enabledRules = auditRuleRepository.findByEnabled(true)
    const results: Array<{ userId: number; ruleId: number; ruleName: string; riskLevel: string; matched: boolean }> = []

    enabledRules.forEach(rule => {
      const matchedUsers = this.executeRule(rule)
      matchedUsers.forEach(userId => {
        results.push({
          userId,
          ruleId: rule.id,
          ruleName: rule.ruleName,
          riskLevel: rule.riskLevel,
          matched: true,
        })
      })
    })

    return results
  }

  private executeRule(rule: AuditRule): number[] {
    const matchedUserIds: number[] = []
    const randomMatch = Math.random() > 0.7
    if (randomMatch) {
      matchedUserIds.push(Math.floor(Math.random() * 100) + 1)
    }
    return matchedUserIds
  }
}

const auditService = new AuditService()

export default auditService
export { AuditService, type AuditRuleListResponse, type CreateAuditRuleRequest, type UpdateAuditRuleRequest, type AuditRuleMutationResponse }
