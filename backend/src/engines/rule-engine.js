const { getDb } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');
const VariableFactory = require('./variable-factory');

class RuleEngine {
  constructor() {
    this.db = getDb();
    this.variableFactory = new VariableFactory();
  }

  createRule(ruleData, operator = 'system') {
    const id = `rule_${uuidv4().slice(0, 8)}`;
    const stmt = this.db.prepare(`
      INSERT INTO rules (id, name, description, version, status, topology, weight_config, created_by)
      VALUES (@id, @name, @description, @version, @status, @topology, @weight_config, @created_by)
    `);
    
    stmt.run({
      id,
      name: ruleData.name,
      description: ruleData.description || '',
      version: ruleData.version || '1.0.0',
      status: 'draft',
      topology: JSON.stringify(ruleData.topology || this.getDefaultTopology()),
      weight_config: JSON.stringify(ruleData.weightConfig || {}),
      created_by: operator
    });

    this.logAudit(operator, 'CREATE_RULE', 'rule', id, JSON.stringify({ name: ruleData.name }));
    return this.getRuleById(id);
  }

  getDefaultTopology() {
    return {
      nodes: [
        { id: 'start', type: 'start', x: 50, y: 200 },
        { id: 'end', type: 'end', x: 600, y: 200 }
      ],
      connections: [],
      conditions: []
    };
  }

  getRuleById(ruleId) {
    const stmt = this.db.prepare(`SELECT * FROM rules WHERE id = ?`);
    const rule = stmt.get(ruleId);
    if (rule) {
      rule.topology = JSON.parse(rule.topology || '{}');
      rule.weight_config = JSON.parse(rule.weight_config || '{}');
    }
    return rule;
  }

  getAllRules(status = null) {
    let sql = `SELECT * FROM rules ORDER BY created_at DESC`;
    let params = [];
    if (status) {
      sql = `SELECT * FROM rules WHERE status = ? ORDER BY created_at DESC`;
      params = [status];
    }
    const stmt = this.db.prepare(sql);
    const rules = stmt.all(...params);
    return rules.map(r => ({
      ...r,
      topology: JSON.parse(r.topology || '{}'),
      weight_config: JSON.parse(r.weight_config || '{}')
    }));
  }

  updateRuleTopology(ruleId, topology, operator = 'system') {
    const stmt = this.db.prepare(`
      UPDATE rules 
      SET topology = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    const result = stmt.run(JSON.stringify(topology), ruleId);
    
    this.logAudit(operator, 'UPDATE_RULE_TOPOLOGY', 'rule', ruleId, '拓扑结构已更新');
    return result.changes > 0;
  }

  pushToTest(ruleId, operator = 'system') {
    const stmt = this.db.prepare(`
      UPDATE rules 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND status IN ('draft', 'testing')
    `);
    const result = stmt.run('testing', ruleId);
    
    this.logAudit(operator, 'PUSH_TO_TEST', 'rule', ruleId, '推送到测试环境');
    return result.changes > 0;
  }

  activateRule(ruleId, operator = 'system') {
    const stmt = this.db.prepare(`
      UPDATE rules 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND status = 'testing'
    `);
    const result = stmt.run('active', ruleId);
    
    this.logAudit(operator, 'ACTIVATE_RULE', 'rule', ruleId, '规则已上线激活');
    return result.changes > 0;
  }

  extractVariableCodesFromTopology(topology) {
    const codes = new Set();
    if (!topology.conditions) return [];
    
    for (const condition of topology.conditions) {
      if (condition.variableCode) {
        codes.add(condition.variableCode);
      }
    }
    return Array.from(codes);
  }

  evaluateCondition(condition, variableValue) {
    const { operator, value } = condition;
    const actualValue = variableValue?.value;

    if (actualValue === null || actualValue === undefined) {
      return { match: false, reason: '变量值缺失' };
    }

    let match = false;
    switch (operator) {
      case 'eq':
        match = actualValue === value;
        break;
      case 'ne':
        match = actualValue !== value;
        break;
      case 'gt':
        match = actualValue > value;
        break;
      case 'gte':
        match = actualValue >= value;
        break;
      case 'lt':
        match = actualValue < value;
        break;
      case 'lte':
        match = actualValue <= value;
        break;
      case 'contains':
        match = String(actualValue).includes(String(value));
        break;
      case 'is_true':
        match = actualValue === true;
        break;
      case 'is_false':
        match = actualValue === false;
        break;
      default:
        match = false;
    }

    return {
      match,
      variableValue: actualValue,
      conditionValue: value,
      operator
    };
  }

  async executeDecision(requestContext, activeRules = null) {
    const startTime = Date.now();
    
    if (!activeRules) {
      activeRules = this.getAllRules('active');
    }

    if (activeRules.length === 0) {
      return {
        decisionResult: 'pass',
        score: 0,
        matchedConditions: [],
        variablesSnapshot: {},
        executionTime: Date.now() - startTime,
        message: '无激活规则，默认通过'
      };
    }

    const allVariableCodes = new Set();
    for (const rule of activeRules) {
      const codes = this.extractVariableCodesFromTopology(rule.topology);
      codes.forEach(c => allVariableCodes.add(c));
    }

    const { values: resolvedVars, snapshot } = await this.variableFactory.resolveVariables(
      requestContext,
      Array.from(allVariableCodes)
    );

    let totalScore = 0;
    const matchedConditions = [];
    let finalResult = 'pass';
    let triggeredRuleId = null;

    for (const rule of activeRules) {
      const ruleResult = this.evaluateRule(rule, resolvedVars);
      
      if (ruleResult.match) {
        matchedConditions.push({
          ruleId: rule.id,
          ruleName: rule.name,
          conditions: ruleResult.matchedConditions,
          score: ruleResult.score
        });
        totalScore += ruleResult.score;
        
        if (ruleResult.result === 'reject') {
          finalResult = 'reject';
          triggeredRuleId = rule.id;
          break;
        } else if (ruleResult.result === 'review' && finalResult === 'pass') {
          finalResult = 'review';
          triggeredRuleId = rule.id;
        }
      }
    }

    const executionTime = Date.now() - startTime;

    return {
      decisionResult: finalResult,
      score: totalScore,
      matchedConditions,
      variablesSnapshot: snapshot,
      executionTime,
      triggeredRuleId
    };
  }

  evaluateRule(rule, resolvedVars) {
    const topology = rule.topology;
    const matchedConditions = [];
    let totalScore = 0;
    let result = 'pass';

    if (!topology.conditions || topology.conditions.length === 0) {
      return { match: false, score: 0, result: 'pass', matchedConditions: [] };
    }

    const conditions = topology.conditions;
    const logicMode = topology.logicMode || 'any';

    let matchCount = 0;
    for (const condition of conditions) {
      const varValue = resolvedVars[condition.variableCode];
      const evalResult = this.evaluateCondition(condition, varValue);

      if (evalResult.match) {
        matchCount++;
        matchedConditions.push({
          conditionId: condition.id,
          variableCode: condition.variableCode,
          variableName: varValue?.variable?.name,
          ...evalResult,
          weight: varValue?.variable?.weight || 1
        });
        
        const weight = varValue?.variable?.weight || 1;
        const conditionScore = condition.score || 10;
        totalScore += conditionScore * weight;
      }
    }

    let isMatch = false;
    if (logicMode === 'all') {
      isMatch = matchCount === conditions.length;
    } else {
      isMatch = matchCount > 0;
    }

    if (isMatch) {
      if (topology.action === 'reject' || totalScore >= 80) {
        result = 'reject';
      } else if (topology.action === 'review' || totalScore >= 50) {
        result = 'review';
      }
    }

    return {
      match: isMatch,
      score: totalScore,
      result,
      matchedConditions
    };
  }

  recordDecision(requestId, decisionData, ruleId = null) {
    const id = `dec_${uuidv4().slice(0, 12)}`;
    const stmt = this.db.prepare(`
      INSERT INTO decision_records (
        id, request_id, rule_id, rule_version, decision_result, 
        score, variables_snapshot, matched_conditions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      requestId,
      ruleId || decisionData.triggeredRuleId,
      '1.0.0',
      decisionData.decisionResult,
      decisionData.score,
      JSON.stringify(decisionData.variablesSnapshot),
      JSON.stringify(decisionData.matchedConditions)
    );

    return { ...decisionData, decisionId: id };
  }

  logAudit(operator, action, resourceType, resourceId, details) {
    const stmt = this.db.prepare(`
      INSERT INTO audit_logs (operator, action, resource_type, resource_id, details)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(operator, action, resourceType, resourceId, details);
  }
}

module.exports = RuleEngine;
