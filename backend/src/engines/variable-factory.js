const database = require('../database');
const { v4: uuidv4 } = require('uuid');

const realTimeVariableCache = new Map();

function getVariableDefinition(code) {
  const db = database.getDb();
  const variable = db.prepare('SELECT * FROM variables WHERE code = ?').get(code);
  if (!variable) return null;
  
  return {
    ...variable,
    config: variable.config ? JSON.parse(variable.config) : null
  };
}

function getAllVariableDefinitions() {
  const db = database.getDb();
  const variables = db.prepare('SELECT * FROM variables ORDER BY created_at DESC').all();
  return variables.map(v => ({
    ...v,
    config: v.config ? JSON.parse(v.config) : null
  }));
}

function getVariableDefinitionsBySource(source) {
  const db = database.getDb();
  const variables = db.prepare(
    'SELECT * FROM variables WHERE source = ? ORDER BY created_at DESC'
  ).all(source);
  return variables.map(v => ({
    ...v,
    config: v.config ? JSON.parse(v.config) : null
  }));
}

function createVariable(data) {
  const db = database.getDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO variables (id, name, code, description, type, source, config, weight, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    data.name,
    data.code,
    data.description || '',
    data.type,
    data.source,
    data.config ? JSON.stringify(data.config) : null,
    data.weight || 1.0,
    now,
    now
  );
  
  return getVariableDefinition(data.code);
}

function updateVariable(code, data) {
  const db = database.getDb();
  const now = new Date().toISOString();
  
  const existingVar = getVariableDefinition(code);
  if (!existingVar) {
    throw new Error(`变量 ${code} 不存在`);
  }
  
  const updates = [];
  const params = [];
  
  if (data.name !== undefined) { updates.push('name = ?'); params.push(data.name); }
  if (data.description !== undefined) { updates.push('description = ?'); params.push(data.description); }
  if (data.type !== undefined) { updates.push('type = ?'); params.push(data.type); }
  if (data.source !== undefined) { updates.push('source = ?'); params.push(data.source); }
  if (data.config !== undefined) { 
    updates.push('config = ?'); 
    params.push(JSON.stringify(data.config));
  }
  if (data.weight !== undefined) { updates.push('weight = ?'); params.push(data.weight); }
  
  updates.push('updated_at = ?'); params.push(now);
  
  params.push(code);
  
  const stmt = db.prepare(`UPDATE variables SET ${updates.join(', ')} WHERE code = ?`);
  stmt.run(...params);
  
  return getVariableDefinition(code);
}

function setRealTimeVariable(code, value) {
  realTimeVariableCache.set(code, {
    value,
    timestamp: Date.now()
  });
}

function getRealTimeVariable(code) {
  const cached = realTimeVariableCache.get(code);
  if (!cached) return null;
  return cached.value;
}

function fetchVariablesFromSource(source, requestData) {
  const variables = getVariableDefinitionsBySource(source);
  const values = {};
  
  variables.forEach(v => {
    let value;
    
    switch (source) {
      case 'real_time':
        value = requestData[v.code] !== undefined 
          ? requestData[v.code] 
          : getRealTimeVariable(v.code);
        break;
      case 'external':
        value = requestData[v.code] !== undefined 
          ? requestData[v.code] 
          : simulateExternalVariable(v);
        break;
      case 'database':
        value = requestData[v.code] !== undefined 
          ? requestData[v.code] 
          : simulateDatabaseVariable(v);
        break;
      default:
        value = requestData[v.code];
    }
    
    if (value !== undefined && value !== null) {
      values[v.code] = value;
    }
  });
  
  return values;
}

function simulateExternalVariable(variable) {
  switch (variable.code) {
    case 'ip_risk_level':
      return Math.floor(Math.random() * 10);
    default:
      return null;
  }
}

function simulateDatabaseVariable(variable) {
  switch (variable.code) {
    case 'account_balance':
      return Math.floor(Math.random() * 100000);
    case 'chargeback_count':
      return Math.floor(Math.random() * 5);
    default:
      return null;
  }
}

function collectAllVariables(requestData = {}) {
  const variables = {};
  
  Object.keys(requestData).forEach(key => {
    variables[key] = requestData[key];
  });
  
  const sources = ['real_time', 'external', 'database'];
  sources.forEach(source => {
    const sourceVariables = fetchVariablesFromSource(source, requestData);
    Object.assign(variables, sourceVariables);
  });
  
  return variables;
}

function adjustVariableWeight(code, adjustment) {
  const db = database.getDb();
  const variable = getVariableDefinition(code);
  if (!variable) {
    throw new Error(`变量 ${code} 不存在`);
  }
  
  const newWeight = Math.max(0, Math.min(10, (variable.weight || 1) + adjustment));
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    UPDATE variables SET weight = ?, updated_at = ? WHERE code = ?
  `);
  stmt.run(newWeight, now, code);
  
  return getVariableDefinition(code);
}

function getVariableWeights() {
  const db = database.getDb();
  const variables = db.prepare('SELECT code, name, weight FROM variables').all();
  return variables;
}

module.exports = {
  getVariableDefinition,
  getAllVariableDefinitions,
  getVariableDefinitionsBySource,
  createVariable,
  updateVariable,
  setRealTimeVariable,
  getRealTimeVariable,
  fetchVariablesFromSource,
  collectAllVariables,
  adjustVariableWeight,
  getVariableWeights
};
