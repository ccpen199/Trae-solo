const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const RuleEngine = require('../engines/rule-engine');
const ActionHandler = require('../engines/action-handler');

const ruleEngine = new RuleEngine();
const actionHandler = new ActionHandler();

router.post('/evaluate', async (req, res) => {
  try {
    const requestContext = req.body;
    const requestId = requestContext.requestId || `req_${uuidv4().slice(0, 12)}`;
    
    const decisionResult = await ruleEngine.executeDecision(requestContext);
    
    const recorded = ruleEngine.recordDecision(requestId, decisionResult);
    
    const actions = await actionHandler.handleDecision(recorded, requestContext);
    
    const response = {
      success: true,
      requestId,
      decisionId: recorded.decisionId,
      result: {
        decision: decisionResult.decisionResult,
        score: decisionResult.score,
        executionTimeMs: decisionResult.executionTime
      },
      matchedConditions: decisionResult.matchedConditions,
      variablesSnapshot: decisionResult.variablesSnapshot,
      actionsExecuted: actions
    };
    
    res.json(response);
  } catch (error) {
    console.error('决策执行错误:', error);
    res.status(500).json({ 
      success: false, 
      error: '决策引擎执行失败',
      details: error.message 
    });
  }
});

router.get('/records', (req, res) => {
  try {
    const db = require('../database/connection').getDb();
    const { limit = 50, offset = 0 } = req.query;
    
    const records = db.prepare(`
      SELECT * FROM decision_records 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(parseInt(limit), parseInt(offset));
    
    res.json({ 
      success: true, 
      data: records.map(r => ({
        ...r,
        variables_snapshot: JSON.parse(r.variables_snapshot || '{}'),
        matched_conditions: JSON.parse(r.matched_conditions || '[]')
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
