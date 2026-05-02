const express = require('express');
const router = express.Router();

const ruleEngine = require('../engines/rule-engine');
const variableFactory = require('../engines/variable-factory');
const actionHandler = require('../engines/action-handler');
const backtestSimulator = require('../engines/backtest-simulator');
const decisionEngine = require('../engines/decision-engine');

router.get('/', (req, res) => {
  res.json({
    name: '风控规则引擎 API',
    version: '1.0.0',
    endpoints: {
      rules: '/api/rules',
      variables: '/api/variables',
      decisions: '/api/decisions',
      reviews: '/api/reviews',
      backtest: '/api/backtest',
      actions: '/api/actions',
      audit: '/api/audit'
    }
  });
});

router.get('/rules', (req, res) => {
  try {
    const { environment } = req.query;
    const rules = ruleEngine.getAllRules(environment);
    res.json({ success: true, data: rules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/rules/active', (req, res) => {
  try {
    const { environment } = req.query;
    const rules = ruleEngine.getActiveRules(environment || 'development');
    res.json({ success: true, data: rules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/rules/:id', (req, res) => {
  try {
    const rule = ruleEngine.getRuleById(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, error: '规则不存在' });
    }
    res.json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/rules', (req, res) => {
  try {
    const rule = ruleEngine.createRule(req.body);
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/rules/:id', (req, res) => {
  try {
    const rule = ruleEngine.updateRule(req.params.id, req.body);
    res.json({ success: true, data: rule });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.post('/rules/:id/activate', (req, res) => {
  try {
    const { environment } = req.body;
    const rule = ruleEngine.activateRule(req.params.id, environment || 'development');
    res.json({ success: true, data: rule });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.post('/rules/:id/deactivate', (req, res) => {
  try {
    const rule = ruleEngine.deactivateRule(req.params.id);
    res.json({ success: true, data: rule });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.delete('/rules/:id', (req, res) => {
  try {
    const deleted = ruleEngine.deleteRule(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: '规则不存在' });
    }
    res.json({ success: true, message: '规则已删除' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/variables', (req, res) => {
  try {
    const variables = variableFactory.getAllVariableDefinitions();
    res.json({ success: true, data: variables });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/variables/weights', (req, res) => {
  try {
    const weights = variableFactory.getVariableWeights();
    res.json({ success: true, data: weights });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/variables', (req, res) => {
  try {
    const variable = variableFactory.createVariable(req.body);
    res.status(201).json({ success: true, data: variable });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/decisions', (req, res) => {
  try {
    const { requestData, options } = req.body;
    const decision = decisionEngine.executeDecision(requestData || {}, options || {});
    res.json({ success: true, data: decision });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/decisions', (req, res) => {
  try {
    const { requestId, ruleId, decisionResult, limit } = req.query;
    const logs = decisionEngine.getDecisionLogs({
      requestId,
      ruleId,
      decisionResult,
      limit: limit ? parseInt(limit) : undefined
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/decisions/:id', (req, res) => {
  try {
    const log = decisionEngine.getDecisionLogById(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, error: '决策记录不存在' });
    }
    res.json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/reviews/pending', (req, res) => {
  try {
    const reviews = decisionEngine.getPendingManualReviews();
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/reviews/:id/submit', (req, res) => {
  try {
    const review = decisionEngine.submitManualReview(req.params.id, req.body);
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.get('/backtest', (req, res) => {
  try {
    const { ruleId, status, limit } = req.query;
    const tasks = backtestSimulator.getAllBacktestTasks({
      ruleId,
      status,
      limit: limit ? parseInt(limit) : undefined
    });
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/backtest', (req, res) => {
  try {
    const task = backtestSimulator.createBacktestTask(req.body);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/backtest/:id', (req, res) => {
  try {
    const task = backtestSimulator.getBacktestTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: '回测任务不存在' });
    }
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/backtest/:id/run', (req, res) => {
  try {
    const result = backtestSimulator.runBacktest(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.get('/actions/blocked', (req, res) => {
  try {
    const blocked = actionHandler.getBlockedItems();
    res.json({ success: true, data: blocked });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/actions', (req, res) => {
  try {
    const { status, actionType, limit } = req.query;
    const records = actionHandler.getAllActionRecords({
      status,
      actionType,
      limit: limit ? parseInt(limit) : undefined
    });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/actions/unblock/ip', (req, res) => {
  try {
    const { ip } = req.body;
    const result = actionHandler.unblockIp(ip);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/actions/unblock/account', (req, res) => {
  try {
    const { userId } = req.body;
    const result = actionHandler.unblockAccount(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/audit', (req, res) => {
  try {
    const { actionType, entityType, entityId, limit } = req.query;
    const logs = decisionEngine.getAuditLogs({
      actionType,
      entityType,
      entityId,
      limit: limit ? parseInt(limit) : undefined
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/rules/:id/test', (req, res) => {
  try {
    const rule = ruleEngine.getRuleById(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, error: '规则不存在' });
    }
    
    const { testVariables } = req.body;
    const variables = testVariables || variableFactory.collectAllVariables({});
    
    const result = ruleEngine.evaluate(rule.logic_topology, variables);
    res.json({ success: true, data: { rule, variables, result } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
