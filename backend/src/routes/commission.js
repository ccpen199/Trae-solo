const express = require('express');
const router = express.Router();
const { db } = require('../database/init');
const authMiddleware = require('../middleware/auth');

router.get('/overview', authMiddleware, (req, res) => {
  const batchesStmt = db.prepare('SELECT * FROM commission_batches WHERE user_id = ? ORDER BY created_at DESC');
  const batches = batchesStmt.all(req.userId);

  const totalPending = batches
    .filter(b => b.status !== 'completed')
    .reduce((sum, b) => sum + (b.total_amount - b.advanced_amount), 0);

  const totalAdvanced = batches.reduce((sum, b) => sum + b.advanced_amount, 0);

  res.json({
    code: 200,
    data: {
      pendingCommission: totalPending,
      advancedAmount: totalAdvanced,
      batches: batches.map(b => ({
        id: b.id,
        batchNo: b.batch_no,
        totalAmount: b.total_amount,
        advancedAmount: b.advanced_amount,
        availableAmount: b.total_amount - b.advanced_amount,
        status: b.status,
        hasInvoice: b.has_invoice,
        createdAt: b.created_at
      }))
    }
  });
});

module.exports = router;
