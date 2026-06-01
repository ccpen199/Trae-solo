const db = require('../db')

class RiskEvaluator {
  evaluate(aggregatedData) {
    const hitRules = []
    let riskScore = 100
    const evidenceSources = []

    const { business, judicial, tax, creditHistory } = aggregatedData

    if (judicial.success) {
      const hasDishonest = judicial.data.some(r => r.record_type === '失信被执行人' && r.status !== '已履行')
      if (hasDishonest) {
        hitRules.push({ ruleCode: 'R001', ruleName: '存在失信被执行记录', riskLevel: 'high' })
        riskScore -= 30
        evidenceSources.push({ source: '司法数据源', type: '失信被执行人', updatedAt: new Date().toISOString() })
      }

      const hasPendingCases = judicial.data.some(r => r.status === '执行中')
      if (hasPendingCases) {
        hitRules.push({ ruleCode: 'R002', ruleName: '存在未结诉讼案件', riskLevel: 'medium' })
        riskScore -= 15
        evidenceSources.push({ source: '司法数据源', type: '未结诉讼', updatedAt: new Date().toISOString() })
      }
    }

    if (tax.success) {
      const hasTaxAbnormal = tax.data.some(r => r.is_abnormal === 1)
      if (hasTaxAbnormal) {
        hitRules.push({ ruleCode: 'R003', ruleName: '税务异常记录', riskLevel: 'high' })
        riskScore -= 25
        evidenceSources.push({ source: '税务数据源', type: '税务异常', updatedAt: new Date().toISOString() })
      }
    }

    if (business.success && business.data.shareholders) {
      const hasRelatedEnterprises = business.data.shareholders.some(s => s.is_related_enterprise === 1)
      if (hasRelatedEnterprises) {
        hitRules.push({ ruleCode: 'R004', ruleName: '股东关联企业高风险', riskLevel: 'medium' })
        riskScore -= 10
        evidenceSources.push({ source: '工商数据源', type: '关联企业', updatedAt: new Date().toISOString() })
      }
    }

    if (creditHistory.success) {
      const hasOverdue = creditHistory.data.some(c => c.overdue_days > 0)
      if (hasOverdue) {
        hitRules.push({ ruleCode: 'R005', ruleName: '授信逾期记录', riskLevel: 'high' })
        riskScore -= 25
        evidenceSources.push({ source: '授信数据源', type: '授信逾期', updatedAt: new Date().toISOString() })
      }
    }

    if (business.success && business.data.changes) {
      const capitalChanges = business.data.changes.filter(c => c.change_type === '注册资本变更')
      if (capitalChanges.length >= 2) {
        hitRules.push({ ruleCode: 'R006', ruleName: '注册资本变更频繁', riskLevel: 'low' })
        riskScore -= 5
        evidenceSources.push({ source: '工商数据源', type: '变更记录', updatedAt: new Date().toISOString() })
      }
    }

    let riskLevel
    if (riskScore >= 80) riskLevel = 'low'
    else if (riskScore >= 60) riskLevel = 'medium'
    else if (riskScore >= 40) riskLevel = 'high'
    else riskLevel = 'critical'

    return {
      riskScore,
      riskLevel,
      hitRules,
      evidenceSources
    }
  }
}

module.exports = new RiskEvaluator()
