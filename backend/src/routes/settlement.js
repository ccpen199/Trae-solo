const express = require('express');
const { authenticateToken, requireRole } = require('./auth');
const clearingEngine = require('../clearing-engine');
const AuditLogger = require('../audit-logger');

const router = express.Router();

router.use(authenticateToken);

router.get('/reports', requireRole('financial_settler', 'exchange_admin'), async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;
    
    const reports = clearingEngine.getSettlementReports(userId, startDate, endDate);
    
    res.json({ reports });
  } catch (error) {
    console.error('获取结算报表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/reports/my', requireRole('investor'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const reports = clearingEngine.getSettlementReports(req.user.id, startDate, endDate);
    
    res.json({ reports });
  } catch (error) {
    console.error('获取我的结算报表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const details = clearingEngine.getSettlementReportDetails(id);
    
    if (!details) {
      return res.status(404).json({ error: '结算报表不存在' });
    }

    if (req.user.role === 'investor' && details.report.user_id !== req.user.id) {
      return res.status(403).json({ error: '权限不足' });
    }

    res.json(details);
  } catch (error) {
    console.error('获取结算报表详情错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/run-daily', requireRole('financial_settler', 'exchange_admin'), async (req, res) => {
  try {
    const { reportDate } = req.body;
    
    const reports = clearingEngine.runDailySettlement(reportDate);

    AuditLogger.log('DAILY_SETTLEMENT_RUN', 'settlement', null, {
      reportDate: reportDate || new Date().toISOString().split('T')[0],
      reportCount: reports.length
    }, req.user, req);

    res.json({
      message: '日终清算完成',
      reportCount: reports.length,
      reports
    });
  } catch (error) {
    console.error('执行日终清算错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/reports/:id/voucher', requireRole('financial_settler', 'investor'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const details = clearingEngine.getSettlementReportDetails(id);
    
    if (!details) {
      return res.status(404).json({ error: '结算报表不存在' });
    }

    if (req.user.role === 'investor' && details.report.user_id !== req.user.id) {
      return res.status(403).json({ error: '权限不足' });
    }

    const voucher = clearingEngine.exportSettlementVoucher(id);

    AuditLogger.log('VOUCHER_EXPORTED', 'settlement', id, {
      reportDate: details.report.report_date
    }, req.user, req);

    res.json(voucher);
  } catch (error) {
    console.error('导出结算凭证错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
