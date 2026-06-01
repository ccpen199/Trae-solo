const express = require('express');
const router = express.Router();
const { db } = require('../database/init');
const authMiddleware = require('../middleware/auth');

router.post('/check', authMiddleware, (req, res) => {
  const { batchId, amount } = req.body;

  const applyingStmt = db.prepare(`
    SELECT * FROM advance_apply 
    WHERE user_id = ? AND batch_id = ? AND status = 'applying'
  `);
  const applying = applyingStmt.get(req.userId, batchId);
  if (applying) {
    return res.json({ code: 400, message: '该批次已有申请中的垫付订单', canApply: false });
  }

  const batchStmt = db.prepare('SELECT * FROM commission_batches WHERE id = ?');
  const batch = batchStmt.get(batchId);
  if (!batch) {
    return res.json({ code: 400, message: '批次不存在', canApply: false });
  }

  if (!batch.has_invoice) {
    return res.json({ code: 400, message: '该批次尚未开具发票，无法申请垫付', canApply: false });
  }

  const creditStmt = db.prepare('SELECT * FROM credit_apply WHERE user_id = ?');
  const credit = creditStmt.get(req.userId);
  if (!credit || credit.available_limit < amount) {
    return res.json({ code: 400, message: '可用额度不足', canApply: false, availableLimit: credit?.available_limit || 0 });
  }

  res.json({
    code: 200,
    canApply: true,
    availableLimit: credit.available_limit,
    batchInfo: {
      id: batch.id,
      batchNo: batch.batch_no,
      availableAmount: batch.total_amount - batch.advanced_amount
    }
  });
});

router.post('/apply', authMiddleware, (req, res) => {
  const { batchId, amount, faceVerified, contractSigned, signature } = req.body;

  if (!faceVerified) {
    return res.json({ code: 400, message: '请完成人脸识别' });
  }
  if (!contractSigned) {
    return res.json({ code: 400, message: '请阅读并签署合同' });
  }
  if (!signature) {
    return res.json({ code: 400, message: '请完成个人签字授权' });
  }

  const insert = db.prepare(`
    INSERT INTO advance_apply (user_id, batch_id, amount, contract_signed, signature)
    VALUES (?, ?, ?, 1, ?)
  `);
  const info = insert.run(req.userId, batchId, amount, signature);

  db.prepare(`
    UPDATE credit_apply 
    SET available_limit = available_limit - ?, face_verified = 1, updated_at = CURRENT_TIMESTAMP 
    WHERE user_id = ?
  `).run(amount, req.userId);

  db.prepare(`
    UPDATE commission_batches 
    SET advanced_amount = advanced_amount + ?, status = CASE 
      WHEN advanced_amount + ? >= total_amount THEN 'completed' 
      ELSE 'partial' 
    END 
    WHERE id = ?
  `).run(amount, amount, batchId);

  res.json({ code: 200, message: '垫付申请提交成功', applyId: info.lastInsertRowid });
});

router.get('/list', authMiddleware, (req, res) => {
  const appliesStmt = db.prepare(`
    SELECT a.*, b.batch_no 
    FROM advance_apply a 
    LEFT JOIN commission_batches b ON a.batch_id = b.id 
    WHERE a.user_id = ? 
    ORDER BY a.created_at DESC
  `);
  const applies = appliesStmt.all(req.userId);

  res.json({
    code: 200,
    data: applies.map(a => ({
      id: a.id,
      batchNo: a.batch_no,
      amount: a.amount,
      status: a.status,
      createdAt: a.created_at
    }))
  });
});

module.exports = router;
