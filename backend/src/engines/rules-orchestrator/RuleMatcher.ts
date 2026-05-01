import { RuleCondition, RuleExecutionContext } from './types'

export class RuleMatcher {
  static match(condition: RuleCondition, context: RuleExecutionContext): boolean {
    switch (condition.type) {
      case 'comparison':
        return this.matchComparison(condition, context)
      case 'logical':
        return this.matchLogical(condition, context)
      case 'exists':
        return this.matchExists(condition, context)
      case 'range':
        return this.matchRange(condition, context)
      default:
        return false
    }
  }

  private static matchComparison(condition: RuleCondition, context: RuleExecutionContext): boolean {
    const fieldValue = this.getFieldValue(condition.field, context)
    
    if (fieldValue === undefined) {
      return false
    }

    const targetValue = condition.value

    switch (condition.operator) {
      case 'eq':
        return this.safeEqual(fieldValue, targetValue)
      case 'ne':
        return !this.safeEqual(fieldValue, targetValue)
      case 'gt':
        return Number(fieldValue) > Number(targetValue)
      case 'gte':
        return Number(fieldValue) >= Number(targetValue)
      case 'lt':
        return Number(fieldValue) < Number(targetValue)
      case 'lte':
        return Number(fieldValue) <= Number(targetValue)
      case 'contains':
        return String(fieldValue).includes(String(targetValue))
      case 'startsWith':
        return String(fieldValue).startsWith(String(targetValue))
      case 'endsWith':
        return String(fieldValue).endsWith(String(targetValue))
      case 'in':
        return Array.isArray(targetValue) && targetValue.includes(fieldValue)
      case 'notIn':
        return Array.isArray(targetValue) && !targetValue.includes(fieldValue)
      default:
        return false
    }
  }

  private static matchLogical(condition: RuleCondition, context: RuleExecutionContext): boolean {
    if (!condition.conditions || condition.conditions.length === 0) {
      return true
    }

    const results = condition.conditions.map(c => this.match(c, context))

    if (condition.logical === 'and') {
      return results.every(r => r)
    } else if (condition.logical === 'or') {
      return results.some(r => r)
    }

    return false
  }

  private static matchExists(condition: RuleCondition, context: RuleExecutionContext): boolean {
    const fieldValue = this.getFieldValue(condition.field, context)
    return fieldValue !== undefined && fieldValue !== null
  }

  private static matchRange(condition: RuleCondition, context: RuleExecutionContext): boolean {
    const fieldValue = Number(this.getFieldValue(condition.field, context))
    
    if (isNaN(fieldValue)) {
      return false
    }

    const min = condition.min !== undefined ? Number(condition.min) : -Infinity
    const max = condition.max !== undefined ? Number(condition.max) : Infinity

    return fieldValue >= min && fieldValue <= max
  }

  private static getFieldValue(field: string, context: RuleExecutionContext): any {
    const parts = field.split('.')
    let value: any = context

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part]
      } else {
        return undefined
      }
    }

    return value
  }

  private static safeEqual(a: any, b: any): boolean {
    if (a === b) return true
    
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime()
    }
    
    if (typeof a === 'string' && typeof b === 'number') {
      return Number(a) === b
    }
    
    if (typeof a === 'number' && typeof b === 'string') {
      return a === Number(b)
    }

    return false
  }
}
