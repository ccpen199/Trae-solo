const express = require('express');
const router = express.Router();
const reconciliationService = require('../services/reconciliationService');
const monitorService = require('../services/monitorService');
const hashChain = require('../engines/hashChain');
const userService = require('../services/userService');

router.get('/dashboard', async (req, res) => {
  try {
    const result = await monitorService.getDashboardStats();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/system-status', async (req, res) => {
  try {
    const result = await monitorService.getSystemStatus();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/transaction-trend', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const result = await monitorService.getTransactionTrend(days);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/risk-summary', async (req, res) => {
  try {
    const result = await monitorService.getRiskSummary();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/reconciliation/daily', async (req, res) => {
  try {
    const { date } = req.body;
    const result = await reconciliationService.executeDailyReconciliation(date);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/reconciliation/list', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const result = await reconciliationService.getReconciliationList(limit);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/reconciliation/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await reconciliationService.getReconciliationDetail(id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/adjustment-pool', async (req, res) => {
  try {
    const result = await reconciliationService.getAdjustmentPool();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/adjustment/handle', async (req, res) => {
  try {
    const { itemId, handlerId, action, remark } = req.body;
    
    if (!itemId || !handlerId || !action) {
      return res.status(400).json({ 
        success: false, 
        error: '调账项ID、处理人ID和操作为必填项' 
      });
    }

    const result = await reconciliationService.handleAdjustment(itemId, handlerId, action, remark || '');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/hashchain/verify', async (req, res) => {
  try {
    const result = await hashChain.verifyChain();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/hashchain/trace-transaction/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const result = await hashChain.traceTransaction(transactionId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/hashchain/trace-funds/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate } = req.query;
    const result = await hashChain.traceFundPath(accountId, startDate, endDate);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/audit-report', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await hashChain.getFullAuditReport(startDate, endDate);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/user/freeze', async (req, res) => {
  try {
    const { userId, reason } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: '用户ID为必填项' 
      });
    }

    const result = await userService.freezeAccount(userId, reason || '管理后台冻结');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/user/unfreeze', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: '用户ID为必填项' 
      });
    }

    const result = await userService.unfreezeAccount(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/reconciliation/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await reconciliationService.getReconciliationStats(startDate, endDate);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
