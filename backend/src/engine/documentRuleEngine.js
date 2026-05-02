import prisma from '../config/database.js'

export const documentRuleEngine = {
  async validateDocument(doc, declaration) {
    const rules = await prisma.configRule.findMany({
      where: { ruleType: 'DOCUMENT_VALIDATION', isActive: true },
      orderBy: { priority: 'desc' },
    })

    const errors = []
    const warnings = []

    for (const rule of rules) {
      const result = this.evaluateRule(rule, { doc, declaration })
      if (result.passed === false) {
        if (result.severity === 'ERROR') {
          errors.push(result.message)
        } else {
          warnings.push(result.message)
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  },

  async validateDeclarationDocuments(declarationId) {
    const declaration = await prisma.declaration.findUnique({
      where: { id: declarationId },
      include: { documents: true },
    })

    if (!declaration) {
      return { isValid: false, errors: ['Declaration not found'] }
    }

    const requiredDocTypes = this.getRequiredDocTypes(declaration.declarationType)
    const existingTypes = declaration.documents.map(d => d.docType)

    const missingTypes = requiredDocTypes.filter(type => !existingTypes.includes(type))

    if (missingTypes.length > 0) {
      return {
        isValid: false,
        errors: [`缺少必需单证: ${missingTypes.join(', ')}`],
      }
    }

    const allValid = await Promise.all(
      declaration.documents.map(doc => this.validateDocument(doc, declaration))
    )

    const errors = allValid.flatMap(r => r.errors)
    const warnings = allValid.flatMap(r => r.warnings)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  },

  getRequiredDocTypes(declarationType) {
    const requiredByType = {
      IMPORT: ['INVOICE', 'PACKING_LIST', 'BILL_OF_LADING'],
      EXPORT: ['INVOICE', 'PACKING_LIST', 'BILL_OF_LADING'],
      TRANSIT: ['INVOICE', 'PACKING_LIST'],
    }
    return requiredByType[declarationType] || requiredByType.IMPORT
  },

  evaluateRule(rule, context) {
    try {
      const condition = this.parseCondition(rule.condition, context)
      const passed = this.executeCondition(condition, context)

      return {
        passed,
        message: passed ? null : this.getRuleMessage(rule),
        severity: rule.priority > 5 ? 'ERROR' : 'WARNING',
      }
    } catch (error) {
      return {
        passed: false,
        message: `规则执行错误: ${error.message}`,
        severity: 'ERROR',
      }
    }
  },

  parseCondition(conditionStr, context) {
    return conditionStr
  },

  executeCondition(condition, context) {
    if (condition.includes('doc.verified')) {
      return context.doc?.verified === true
    }
    if (condition.includes('doc.docNo')) {
      return !!context.doc?.docNo
    }
    return true
  },

  getRuleMessage(rule) {
    const messages = {
      'DOC_VERIFIED': '单证需要验证',
      'DOC_NO_REQUIRED': '单证编号不能为空',
      'INVOICE_AMOUNT_MATCH': '发票金额与申报金额不匹配',
    }
    return messages[rule.ruleCode] || `规则验证失败: ${rule.ruleName}`
  },
}

export default documentRuleEngine
