const database = require('../database');
const { v4: uuidv4 } = require('uuid');
const ruleEngine = require('./rule-engine');
const variableFactory = require('./variable-factory');
const actionHandler = require('./action-handler');

function logDecision(decisionData) {
  const db = database.getDb();
  const id = uuidv4();
  
  const stmt = db.prepare(`
    INSERT INTO decision_logs (id, request_id, rule_id, rule_name, decision_result, decision_score, features_snapshot, request_data, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    decisionData.requestId,
    decisionData.ruleId,
    decisionData.ruleName,
    decisionData.result,
    decisionData.score,
    JSON.stringify(decisionData.featuresSnapshot),
    JSON.stringify(decisionData.requestData),
    new Date().toISOString()
  );
  
  return id;
}

function createManualReview(decisionLogId) {
  const db = database.getDb();
  const id = uuidv4();
  
  const stmt = db.prepare(`
    INSERT INTO manual_reviews (id, decision_log_id, created_at)
    VALUES (?, ?, ?)
  `);
  
  stmt.run(id, decisionLogId, new Date().toISOString());
  
  return getManualReviewById(id);
}

function getManualReviewById(id) {
  const db = database.getDb();
  const review = db.prepare('SELECT * FROM manual_reviews WHERE id = ?').get(id);
  if (!review) return null;
  
  return {
    ...review,
    variable_adjustments: review.variable_adjustments ? JSON.parse(review.variable_adjustments) : null
  };
}

function getPendingManualReviews() {
  const db = database.getDb();
  const reviews = db.prepare(`
    SELECT mr.*, dl.rule_name, dl.decision_score, dl.request_data
    FROM manual_reviews mr
    JOIN decision_logs dl ON mr.decision_log_id = dl.id
    WHERE mr.review_result IS NULL OR mr.review_result = ''
    ORDER BY mr.created_at DESC
  `).all();
  
  return reviews.map(r => ({
    ...r,
    request_data: r.request_data ? JSON.parse(r.request_data) : null
  }));
}

function submitManualReview(reviewId, reviewData) {
  const db = database.getDb();
  const now = new Date().toISOString();
  
  const review = getManualReviewById(reviewId);
  if (!review) {
    throw new Error(`审核记录 ${reviewId} 不存在`);
  }
  
  const stmt = db.prepare(`
    UPDATE manual_reviews 
    SET reviewer = ?, review_result = ?, review_comment = ?, variable_adjustments = ?, reviewed_at = ?
    WHERE id = ?
  `);
  
  stmt.run(
    reviewData.reviewer || 'system',
    reviewData.result,
    reviewData.comment || '',
    JSON.stringify(reviewData.variableAdjustments || {}),
    now,
    reviewId
  );
  
  if (reviewData.variableAdjustments) {
    Object.keys(reviewData.variableAdjustments).forEach(variableCode => {
      const adjustment = reviewData.variableAdjustments[variableCode];
      if (adjustment !== 0) {
        variableFactory.adjustVariableWeight(variableCode, adjustment);
      }
    });
  }
  
  createAuditLog('review', 'manual_review', reviewId, reviewData.reviewer, {
    result: reviewData.result,
    comment: reviewData.comment
  });
  
  return getManualReviewById(reviewId);
}

function createAuditLog(actionType, entityType, entityId, operator, changes = {}) {
  const db = database.getDb();
  const id = uuidv4();
  
  const stmt = db.prepare(`
    INSERT INTO audit_logs (id, action_type, entity_type, entity_id, operator, old_value, new_value, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    actionType,
    entityType,
    entityId,
    operator || 'system',
    JSON.stringify(changes.old || {}),
    JSON.stringify(changes.new || {}),
    new Date().toISOString()
  );
  
  return id;
}

function executeDecision(requestData, options = {}) {
  const requestId = options.requestId || uuidv4();
  const environment = options.environment || 'development';
  
  const variables = variableFactory.collectAllVariables(requestData);
  
  const activeRules = ruleEngine.getActiveRules(environment);
  
  if (activeRules.length === 0) {
    return {
      requestId,
      result: 'pass',
      score: 0,
      matchedRules: [],
      actions: [],
      variables,
      message: '没有激活的规则，默认为通过'
    };
  }
  
  let finalResult = 'pass';
  let finalScore = 0;
  const matchedRules = [];
  
  for (const rule of activeRules) {
    if (!rule.logic_topology) continue;
    
    const evaluation = ruleEngine.evaluate(rule.logic_topology, variables);
    
    if (evaluation.success) {
      matchedRules.push({
        ruleId: rule.id,
        ruleName: rule.name,
        result: evaluation.result,
        score: evaluation.score
      });
      
      if (evaluation.score > finalScore) {
        finalScore = evaluation.score;
      }
      
      if (evaluation.result === 'reject') {
        finalResult = 'reject';
      } else if (evaluation.result === 'manual' && finalResult !== 'reject') {
        finalResult = 'manual';
      }
    }
  }
  
  const primaryRule = matchedRules.length > 0 ? matchedRules[0] : null;
  
  const decisionLogId = logDecision({
    requestId,
    ruleId: primaryRule?.ruleId,
    ruleName: primaryRule?.ruleName,
    result: finalResult,
    score: finalScore,
    featuresSnapshot: variables,
    requestData
  });
  
  let manualReviewId = null;
  if (finalResult === 'manual') {
    const review = createManualReview(decisionLogId);
    manualReviewId = review.id;
  }
  
  const actions = actionHandler.executeActionsForDecision(
    decisionLogId,
    finalResult,
    finalScore,
    requestData
  );
  
  createAuditLog('decision', 'decision_log', decisionLogId, 'system', {
    new: {
      result: finalResult,
      score: finalScore,
      matchedRules: matchedRules.length
    }
  });
  
  return {
    requestId,
    decisionLogId,
    result: finalResult,
    score: finalScore,
    matchedRules,
    actions,
    variables,
    manualReviewId,
    timestamp: new Date().toISOString()
  };
}

function getDecisionLogs(options = {}) {
  const db = database.getDb();
  let sql = 'SELECT * FROM decision_logs';
  const conditions = [];
  const params = [];
  
  if (options.requestId) {
    conditions.push('request_id = ?');
    params.push(options.requestId);
  }
  if (options.ruleId) {
    conditions.push('rule_id = ?');
    params.push(options.ruleId);
  }
  if (options.decisionResult) {
    conditions.push('decision_result = ?');
    params.push(options.decisionResult);
  }
  
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  
  sql += ' ORDER BY created_at DESC';
  
  if (options.limit) {
    sql += ` LIMIT ${options.limit}`;
  }
  
  const logs = db.prepare(sql).all(...params);
  return logs.map(l => ({
    ...l,
    features_snapshot: l.features_snapshot ? JSON.parse(l.features_snapshot) : null,
    request_data: l.request_data ? JSON.parse(l.request_data) : null
  }));
}

function getDecisionLogById(id) {
  const db = database.getDb();
  const log = db.prepare('SELECT * FROM decision_logs WHERE id = ?').get(id);
  if (!log) return null;
  
  return {
    ...log,
    features_snapshot: log.features_snapshot ? JSON.parse(log.features_snapshot) : null,
    request_data: log.request_data ? JSON.parse(log.request_data) : null
  };
}

function getAuditLogs(options = {}) {
  const db = database.getDb();
  let sql = 'SELECT * FROM audit_logs';
  const conditions = [];
  const params = [];
  
  if (options.actionType) {
    conditions.push('action_type = ?');
    params.push(options.actionType);
  }
  if (options.entityType) {
    conditions.push('entity_type = ?');
    params.push(options.entityType);
  }
  if (options.entityId) {
    conditions.push('entity_id = ?');
    params.push(options.entityId);
  }
  
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  
  sql += ' ORDER BY created_at DESC';
  
  if (options.limit) {
    sql += ` LIMIT ${options.limit}`;
  }
  
  const logs = db.prepare(sql).all(...params);
  return logs.map(l => ({
    ...l,
    old_value: l.old_value ? JSON.parse(l.old_value) : null,
    new_value: l.new_value ? JSON.parse(l.new_value) : null
  }));
}

module.exports = {
  executeDecision,
  logDecision,
  getDecisionLogs,
  getDecisionLogById,
  createManualReview,
  getManualReviewById,
  getPendingManualReviews,
  submitManualReview,
  createAuditLog,
  getAuditLogs
};
