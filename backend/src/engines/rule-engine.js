const database = require('../database');
const { v4: uuidv4 } = require('uuid');

const OPERATORS = {
  '>': (a, b) => a > b,
  '<': (a, b) => a < b,
  '>=': (a, b) => a >= b,
  '<=': (a, b) => a <= b,
  '==': (a, b) => a == b,
  '!=': (a, b) => a != b,
  'in': (a, b) => Array.isArray(b) && b.includes(a),
  'notIn': (a, b) => Array.isArray(b) && !b.includes(a),
  'contains': (a, b) => typeof a === 'string' && a.includes(b),
  'startsWith': (a, b) => typeof a === 'string' && a.startsWith(b),
  'endsWith': (a, b) => typeof a === 'string' && a.endsWith(b),
};

function executeCondition(node, variables) {
  const { variable, operator, value, trueAction, falseAction } = node;
  const variableValue = variables[variable];
  
  if (variableValue === undefined) {
    throw new Error(`变量 ${variable} 未找到`);
  }
  
  const operatorFn = OPERATORS[operator];
  if (!operatorFn) {
    throw new Error(`不支持的操作符: ${operator}`);
  }
  
  const result = operatorFn(variableValue, value);
  
  if (result && trueAction) {
    return executeNode(trueAction, variables);
  } else if (!result && falseAction) {
    return executeNode(falseAction, variables);
  }
  
  return { result: 'pass', score: 0, nodePath: [node.type] };
}

function executeDecision(node) {
  return {
    result: node.result,
    score: node.score || 0,
    nodePath: [node.type]
  };
}

function executeNode(node, variables) {
  switch (node.type) {
    case 'condition':
      return executeCondition(node, variables);
    case 'decision':
      return executeDecision(node);
    default:
      throw new Error(`未知的节点类型: ${node.type}`);
  }
}

function evaluate(ruleLogic, variables) {
  try {
    const result = executeNode(ruleLogic, variables);
    return {
      success: true,
      ...result,
      executedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      executedAt: new Date().toISOString()
    };
  }
}

function getAllRules(environment = null) {
  const db = database.getDb();
  let sql = 'SELECT * FROM rules ORDER BY created_at DESC';
  const params = [];
  
  if (environment) {
    sql = 'SELECT * FROM rules WHERE environment = ? ORDER BY created_at DESC';
    params.push(environment);
  }
  
  const rules = db.prepare(sql).all(...params);
  return rules.map(r => ({
    ...r,
    logic_topology: r.logic_topology ? JSON.parse(r.logic_topology) : null
  }));
}

function getActiveRules(environment = 'development') {
  const db = database.getDb();
  const rules = db.prepare(
    'SELECT * FROM rules WHERE status = ? AND environment = ? ORDER BY created_at DESC'
  ).all('active', environment);
  
  return rules.map(r => ({
    ...r,
    logic_topology: r.logic_topology ? JSON.parse(r.logic_topology) : null
  }));
}

function getRuleById(id) {
  const db = database.getDb();
  const rule = db.prepare('SELECT * FROM rules WHERE id = ?').get(id);
  if (!rule) return null;
  
  return {
    ...rule,
    logic_topology: rule.logic_topology ? JSON.parse(rule.logic_topology) : null
  };
}

function createRule(data) {
  const db = database.getDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO rules (id, name, description, status, environment, logic_topology, version, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    data.name,
    data.description || '',
    'draft',
    data.environment || 'development',
    data.logic_topology ? JSON.stringify(data.logic_topology) : null,
    1,
    now,
    now
  );
  
  return getRuleById(id);
}

function updateRule(id, data) {
  const db = database.getDb();
  const now = new Date().toISOString();
  
  const existingRule = getRuleById(id);
  if (!existingRule) {
    throw new Error(`规则 ${id} 不存在`);
  }
  
  const newVersion = (existingRule.version || 1) + 1;
  
  const updates = [];
  const params = [];
  
  if (data.name !== undefined) { updates.push('name = ?'); params.push(data.name); }
  if (data.description !== undefined) { updates.push('description = ?'); params.push(data.description); }
  if (data.logic_topology !== undefined) { 
    updates.push('logic_topology = ?'); 
    params.push(JSON.stringify(data.logic_topology));
  }
  if (data.environment !== undefined) { updates.push('environment = ?'); params.push(data.environment); }
  
  updates.push('version = ?'); params.push(newVersion);
  updates.push('updated_at = ?'); params.push(now);
  
  params.push(id);
  
  const stmt = db.prepare(`UPDATE rules SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...params);
  
  return getRuleById(id);
}

function activateRule(id, targetEnvironment = 'development') {
  const db = database.getDb();
  const now = new Date().toISOString();
  
  const existingRule = getRuleById(id);
  if (!existingRule) {
    throw new Error(`规则 ${id} 不存在`);
  }
  
  if (existingRule.status === 'active' && existingRule.environment === targetEnvironment) {
    return existingRule;
  }
  
  const stmt = db.prepare(`
    UPDATE rules SET status = ?, environment = ?, activated_at = ?, updated_at = ?
    WHERE id = ?
  `);
  stmt.run('active', targetEnvironment, now, now, id);
  
  return getRuleById(id);
}

function deactivateRule(id) {
  const db = database.getDb();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    UPDATE rules SET status = ?, updated_at = ?
    WHERE id = ?
  `);
  stmt.run('draft', now, id);
  
  return getRuleById(id);
}

function deleteRule(id) {
  const db = database.getDb();
  const stmt = db.prepare('DELETE FROM rules WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

module.exports = {
  evaluate,
  getAllRules,
  getActiveRules,
  getRuleById,
  createRule,
  updateRule,
  activateRule,
  deactivateRule,
  deleteRule,
  OPERATORS
};
