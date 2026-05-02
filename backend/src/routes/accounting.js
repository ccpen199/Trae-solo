const express = require('express');
const CaseAccounting = require('../engines/CaseAccounting');
const LegalTimeline = require('../engines/LegalTimeline');
const { authMiddleware, roleMiddleware, caseAccessMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/:caseId/transactions', caseAccessMiddleware, async (req, res) => {
  try {
    const transactions = await CaseAccounting.getCaseTransactions(req.params.caseId);
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取交易记录失败' });
  }
});

router.post('/:caseId/transactions',
  roleMiddleware('lead_lawyer', 'assistant', 'finance'),
  caseAccessMiddleware,
  async (req, res) => {
    try {
      const { caseId } = req.params;
      const userId = req.user.id;
      const { type, amount, category, description } = req.body;

      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({ error: '无效的交易类型' });
      }

      const result = await CaseAccounting.recordTransaction(
        caseId,
        type,
        amount,
        category,
        description,
        userId
      );

      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '记录交易失败' });
    }
  }
);

router.put('/transactions/:transactionId/confirm',
  roleMiddleware('finance'),
  async (req, res) => {
    try {
      const { transactionId } = req.params;
      const userId = req.user.id;

      const result = await CaseAccounting.confirmTransaction(transactionId, userId);
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '确认交易失败' });
    }
  }
);

router.get('/:caseId/profit',
  roleMiddleware('lead_lawyer', 'finance'),
  caseAccessMiddleware,
  async (req, res) => {
    try {
      const result = await CaseAccounting.calculateCaseProfit(req.params.caseId);
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '计算利润失败' });
    }
  }
);

router.post('/:caseId/close',
  roleMiddleware('lead_lawyer'),
  caseAccessMiddleware,
  async (req, res) => {
    try {
      const { caseId } = req.params;
      const userId = req.user.id;

      const result = await CaseAccounting.closeCase(caseId, userId);
      await LegalTimeline.createCaseClosedEvent(caseId, userId);

      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '结案失败' });
    }
  }
);

router.post('/:caseId/archive',
  roleMiddleware('lead_lawyer'),
  caseAccessMiddleware,
  async (req, res) => {
    try {
      const { caseId } = req.params;
      const userId = req.user.id;

      const result = await CaseAccounting.archiveCase(caseId, userId);
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '归档失败' });
    }
  }
);

router.get('/:caseId/reminders', caseAccessMiddleware, (req, res) => {
  const db = require('../database/init');
  db.all(
    `SELECT * FROM reminders 
     WHERE case_id = ? 
     ORDER BY reminder_date ASC`,
    [req.params.caseId],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: '查询提醒失败' });
      }
      res.json(rows);
    }
  );
});

module.exports = router;
