const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const db = require('../database/init');

const router = express.Router();

router.post('/', authenticateToken, [
  body('creditId').isInt().withMessage('授信ID不能为空'),
  body('amount').isFloat({ min: 0 }).withMessage('借款金额不能为空'),
  body('term').isInt({ min: 1 }).withMessage('借款期限不能为空')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { creditId, amount, term } = req.body;
  const userId = req.user.id;

  try {
    const credit = db.prepare(
      'SELECT * FROM credit_applications WHERE id = ? AND user_id = ? AND status = ?'
    ).get(creditId, userId, 'approved');

    if (!credit) {
      return res.status(400).json({ success: false, message: '无效的授信申请' });
    }

    if (amount > credit.approved_amount) {
      return res.status(400).json({ success: false, message: '借款金额超过授信额度' });
    }

    const result = db.prepare(
      'INSERT INTO loan_applications (user_id, credit_id, product_id, amount, term, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId, creditId, credit.product_id, amount, term, 'approved');

    const loanId = result.lastInsertRowid;
    const monthlyPrincipal = amount / term;
    const monthlyInterest = amount * 0.0005 * 30;

    const insertRepayment = db.prepare(
      'INSERT INTO repayments (loan_id, user_id, amount, principal, interest, period, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );

    for (let i = 1; i <= term; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);
      insertRepayment.run(
        loanId, userId, monthlyPrincipal + monthlyInterest, 
        monthlyPrincipal, monthlyInterest, i, dueDate.toISOString(), 'pending'
      );
    }

    res.json({
      success: true,
      data: { id: loanId, status: 'approved' },
      message: '借款申请成功'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '创建借款申请失败' });
  }
});

router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  try {
    const loans = db.prepare(
      'SELECT la.*, p.name as product_name, ca.approved_amount FROM loan_applications la LEFT JOIN products p ON la.product_id = p.id LEFT JOIN credit_applications ca ON la.credit_id = ca.id WHERE la.user_id = ? ORDER BY la.created_at DESC'
    ).all(userId);
    res.json({ success: true, data: loans || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '获取借款列表失败' });
  }
});

router.get('/credit/:creditId', authenticateToken, (req, res) => {
  const { creditId } = req.params;
  const userId = req.user.id;
  
  try {
    const loans = db.prepare(
      'SELECT la.*, p.name as product_name FROM loan_applications la LEFT JOIN products p ON la.product_id = p.id WHERE la.user_id = ? AND la.credit_id = ? ORDER BY la.created_at DESC'
    ).all(userId, creditId);
    res.json({ success: true, data: loans || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '获取借款列表失败' });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const loan = db.prepare(
      'SELECT la.*, p.name as product_name FROM loan_applications la LEFT JOIN products p ON la.product_id = p.id WHERE la.id = ? AND la.user_id = ?'
    ).get(id, userId);
    if (!loan) {
      return res.status(404).json({ success: false, message: '借款申请不存在' });
    }
    res.json({ success: true, data: loan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '获取借款详情失败' });
  }
});

router.get('/:id/repayments', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const repayments = db.prepare(
      'SELECT * FROM repayments WHERE loan_id = ? AND user_id = ? ORDER BY period'
    ).all(id, userId);
    res.json({ success: true, data: repayments || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '获取还款计划失败' });
  }
});

module.exports = router;
