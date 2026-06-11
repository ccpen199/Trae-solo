import { db } from '../db/database';
import type { QualityRule } from '../../shared/types';

interface ValidationResult {
  valid: boolean;
  score: number;
  failures: { ruleId: string; ruleName: string; field: string; message: string }[];
  details: { ruleId: string; ruleName: string; passed: boolean; weight: number }[];
}

function parseThreshold(thresholdStr: string, operator: string): number | [number, number] {
  if (operator === 'range') {
    try {
      const parsed = JSON.parse(thresholdStr);
      if (Array.isArray(parsed) && parsed.length === 2) {
        return [parsed[0], parsed[1]];
      }
    } catch {
      const match = thresholdStr.match(/\[([\d.-]+),\s*([\d.-]+)\]/);
      if (match) {
        return [parseFloat(match[1]), parseFloat(match[2])];
      }
    }
    return [0, 100];
  }
  return parseFloat(thresholdStr);
}

function evaluateRule(value: number, rule: QualityRule): boolean {
  const threshold = rule.threshold;
  
  switch (rule.operator) {
    case '>':
      return value > (threshold as number);
    case '<':
      return value < (threshold as number);
    case '>=':
      return value >= (threshold as number);
    case '<=':
      return value <= (threshold as number);
    case '==':
      return value === (threshold as number);
    case '!=':
      return value !== (threshold as number);
    case 'range': {
      const [min, max] = threshold as [number, number];
      return value >= min && value <= max;
    }
    default:
      return true;
  }
}

function mapDbRuleToQualityRule(dbRule: any): QualityRule {
  return {
    id: dbRule.id,
    name: dbRule.name,
    field: dbRule.field,
    operator: dbRule.operator as QualityRule['operator'],
    threshold: parseThreshold(dbRule.threshold, dbRule.operator),
    weight: dbRule.weight,
    enabled: dbRule.enabled === 1 || dbRule.enabled === true,
    description: dbRule.description || '',
  };
}

function mapQualityRuleToDb(rule: QualityRule): any {
  let thresholdStr: string;
  if (rule.operator === 'range' && Array.isArray(rule.threshold)) {
    thresholdStr = JSON.stringify(rule.threshold);
  } else {
    thresholdStr = String(rule.threshold);
  }
  
  return {
    id: rule.id,
    name: rule.name,
    field: rule.field,
    operator: rule.operator,
    threshold: thresholdStr,
    weight: rule.weight,
    enabled: rule.enabled ? 1 : 0,
    description: rule.description,
  };
}

export const QualityCheckService = {
  getQualityRules(): QualityRule[] {
    const rules = db.prepare('SELECT * FROM quality_rules ORDER BY weight DESC').all() as any[];
    return rules.map(mapDbRuleToQualityRule);
  },

  getQualityRuleById(ruleId: string): QualityRule | null {
    const rule = db.prepare('SELECT * FROM quality_rules WHERE id = ?').get(ruleId) as any;
    if (!rule) return null;
    return mapDbRuleToQualityRule(rule);
  },

  updateQualityRule(rule: QualityRule): QualityRule | null {
    const existing = db.prepare('SELECT id FROM quality_rules WHERE id = ?').get(rule.id) as any;
    const dbRule = mapQualityRuleToDb(rule);
    
    if (existing) {
      db.prepare(`
        UPDATE quality_rules 
        SET name = @name, field = @field, operator = @operator, threshold = @threshold, 
            weight = @weight, enabled = @enabled, description = @description
        WHERE id = @id
      `).run(dbRule);
    } else {
      db.prepare(`
        INSERT INTO quality_rules (id, name, field, operator, threshold, weight, enabled, description)
        VALUES (@id, @name, @field, @operator, @threshold, @weight, @enabled, @description)
      `).run(dbRule);
    }
    
    return this.getQualityRuleById(rule.id);
  },

  validateData(data: Record<string, number | string>, sourceId: string): ValidationResult {
    const enabledRules = db.prepare('SELECT * FROM quality_rules WHERE enabled = 1 ORDER BY weight DESC').all() as any[];
    const rules = enabledRules.map(mapDbRuleToQualityRule);
    
    let totalWeight = 0;
    let passedWeight = 0;
    const failures: ValidationResult['failures'] = [];
    const details: ValidationResult['details'] = [];
    
    for (const rule of rules) {
      totalWeight += rule.weight;
      
      const value = data[rule.field];
      let passed = true;
      
      if (value === undefined || value === null) {
        passed = false;
      } else if (typeof value === 'number') {
        passed = evaluateRule(value, rule);
      } else if (typeof value === 'string') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          passed = evaluateRule(numValue, rule);
        }
      }
      
      if (passed) {
        passedWeight += rule.weight;
      } else {
        let message = '';
        if (value === undefined || value === null) {
          message = `字段 ${rule.field} 缺失`;
        } else {
          const threshold = rule.threshold;
          if (rule.operator === 'range' && Array.isArray(threshold)) {
            message = `${rule.field} 值 ${value} 不在有效范围 [${threshold[0]}, ${threshold[1]}] 内`;
          } else {
            message = `${rule.field} 值 ${value} 不满足 ${rule.operator} ${threshold}`;
          }
        }
        
        failures.push({
          ruleId: rule.id,
          ruleName: rule.name,
          field: rule.field,
          message,
        });
      }
      
      details.push({
        ruleId: rule.id,
        ruleName: rule.name,
        passed,
        weight: rule.weight,
      });
    }
    
    const score = totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 100;
    
    if (sourceId) {
      db.prepare(`
        UPDATE data_sources 
        SET quality_score = (quality_score * 0.9 + ? * 0.1), last_update = DATETIME('now')
        WHERE id = ?
      `).run(score, sourceId);
    }
    
    return {
      valid: failures.length === 0,
      score,
      failures,
      details,
    };
  },

  calculateQualityScore(data: Record<string, number | string>): number {
    const result = this.validateData(data, '');
    return result.score;
  },

  addQualityRule(rule: Omit<QualityRule, 'id'> & { id?: string }): QualityRule {
    const ruleId = rule.id || `rule-${Date.now()}`;
    const newRule: QualityRule = {
      ...rule,
      id: ruleId,
    } as QualityRule;
    
    return this.updateQualityRule(newRule)!;
  },

  deleteQualityRule(ruleId: string): boolean {
    const result = db.prepare('DELETE FROM quality_rules WHERE id = ?').run(ruleId);
    return result.changes > 0;
  },

  toggleQualityRule(ruleId: string, enabled: boolean): QualityRule | null {
    const rule = this.getQualityRuleById(ruleId);
    if (!rule) return null;
    
    rule.enabled = enabled;
    return this.updateQualityRule(rule);
  },
};
