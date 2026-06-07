const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

function getStats() {
  const db = getDB();
  const profileCount = db.prepare('SELECT COUNT(*) as cnt FROM credit_profiles').get().cnt;
  const merchantPending = db.prepare("SELECT COUNT(*) as cnt FROM merchants WHERE status = 'pending'").get().cnt;
  const merchantApproved = db.prepare("SELECT COUNT(*) as cnt FROM merchants WHERE status = 'approved'").get().cnt;
  const loanPending = db.prepare("SELECT COUNT(*) as cnt FROM loan_applications WHERE status = 'pending'").get().cnt;
  const loanApproved = db.prepare("SELECT COUNT(*) as cnt FROM loan_applications WHERE status = 'approved'").get().cnt;
  const paymentAmount = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM payment_orders WHERE status = 'paid'").get().total;
  const couponUsed = db.prepare('SELECT COALESCE(SUM(used_count),0) as total FROM coupons').get().total;
  const taskPending = db.prepare("SELECT COUNT(*) as cnt FROM coordinator_tasks WHERE status != 'completed'").get().cnt;

  return {
    profileCount,
    merchantPending,
    merchantApproved,
    loanPending,
    loanApproved,
    paymentAmount,
    couponUsed,
    taskPending,
  };
}

router.get('/stats', (req, res) => {
  res.json({ data: getStats() });
});

router.get('/dashboard', (req, res) => {
  const db = getDB();
  const latestLogs = db.prepare('SELECT * FROM system_logs ORDER BY id DESC LIMIT 8').all();
  res.json({
    data: {
      stats: getStats(),
      modules: [
        { key: 'credit', name: '信用画像', path: '/credit' },
        { key: 'payment', name: '生活缴费', path: '/payment' },
        { key: 'business', name: '本地商圈', path: '/business/merchants' },
        { key: 'finance', name: '金融产品', path: '/finance/loans' },
        { key: 'coordinator', name: '协理员', path: '/coordinator' },
        { key: 'analytics', name: '数据分析', path: '/analytics/vitality' },
      ],
      latestLogs,
    },
  });
});

module.exports = router;
