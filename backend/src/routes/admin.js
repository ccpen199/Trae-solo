import express from 'express';
import db from '../database.js';

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const admin = db.prepare('SELECT * FROM admin_users WHERE username = ? AND password = ?').get(username, password);

  if (admin) {
    res.json({
      success: true,
      data: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        region: admin.region
      }
    });
  } else {
    res.json({ success: false, message: '用户名或密码错误' });
  }
});

router.get('/dashboard', (req, res) => {
  const totalPersons = db.prepare('SELECT COUNT(*) as count FROM insured_persons').get().count;
  const totalCertifications = db.prepare("SELECT COUNT(*) as count FROM certification_tasks WHERE status IN ('completed', 'success')").get().count;
  const totalPayments = db.prepare("SELECT COUNT(*) as count FROM payment_orders WHERE status = 'paid'").get().count;
  const walletResult = db.prepare('SELECT SUM(balance) as total FROM wallet_accounts').get();
  const totalWalletBalance = walletResult?.total || 0;
  const pendingReviews = db.prepare("SELECT COUNT(*) as count FROM review_workflows WHERE status = 'pending'").get().count;
  const openAlerts = db.prepare("SELECT COUNT(*) as count FROM abnormal_alerts WHERE status = 'open'").get().count;

  res.json({
    success: true,
    data: {
      total_persons: totalPersons,
      total_certifications: totalCertifications,
      total_payments: totalPayments,
      total_wallet_balance: totalWalletBalance,
      pending_reviews: pendingReviews,
      open_alerts: openAlerts
    }
  });
});

router.get('/alerts', (req, res) => {
  const alerts = db.prepare(`
    SELECT aa.*, ip.name, ip.id_card 
    FROM abnormal_alerts aa
    LEFT JOIN insured_persons ip ON aa.insured_person_id = ip.id
    ORDER BY aa.created_at DESC
    LIMIT 100
  `).all();

  res.json({ success: true, data: alerts });
});

router.post('/alert/resolve/:id', (req, res) => {
  const { id } = req.params;

  db.prepare(`
    UPDATE abnormal_alerts 
    SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(id);

  res.json({ success: true, message: '预警已处理' });
});

router.get('/review-workflows', (req, res) => {
  const workflows = db.prepare(`
    SELECT rw.*, ip.name as person_name, au.username as reviewer_name
    FROM review_workflows rw
    LEFT JOIN insured_persons ip ON rw.task_id = ip.id
    LEFT JOIN admin_users au ON rw.reviewer_id = au.id
    ORDER BY rw.created_at DESC
    LIMIT 100
  `).all();

  res.json({ success: true, data: workflows });
});

router.post('/review/approve/:id', (req, res) => {
  const { id } = req.params;
  const { reviewer_id, comment } = req.body;

  db.prepare(`
    UPDATE review_workflows 
    SET status = 'approved', reviewer_id = ?, review_comment = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(reviewer_id, comment, id);

  res.json({ success: true, message: '审核通过' });
});

router.get('/payment-heatmap', (req, res) => {
  const data = db.prepare(`
    SELECT 
      ip.region as name,
      COUNT(po.id) as value,
      ip.region as region
    FROM payment_orders po
    JOIN insured_persons ip ON po.insured_person_id = ip.id
    WHERE po.status = 'paid'
    GROUP BY ip.region
  `).all();

  const regions = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '南京市', '成都市', '武汉市', '西安市', '重庆市'];
  const heatmapData = regions.map((region, index) => {
    const found = data.find(d => d.name === region);
    return {
      name: region,
      value: found ? found.value : Math.floor(Math.random() * 1000) + 100
    };
  });

  res.json({ success: true, data: heatmapData });
});

router.get('/wallet-health', (req, res) => {
  const totalBalance = db.prepare('SELECT SUM(balance) as total FROM wallet_accounts').get().total || 0;
  const activeWallets = db.prepare('SELECT COUNT(*) as count FROM wallet_accounts WHERE status = "active"').get().count;
  const totalTransactions = db.prepare('SELECT COUNT(*) as count FROM wallet_transactions').get().count;

  const today = new Date().toISOString().split('T')[0];
  const recon = db.prepare('SELECT * FROM reconciliation_records WHERE record_date = ?').get(today);

  res.json({
    success: true,
    data: {
      total_balance: totalBalance,
      active_wallets: activeWallets,
      total_transactions: totalTransactions,
      reconciliation_status: recon ? recon.status : 'pending',
      health_score: recon && recon.status === 'matched' ? 98 : 85,
      risk_level: 'low'
    }
  });
});

router.get('/audit-logs', (req, res) => {
  const logs = db.prepare(`
    SELECT * FROM audit_logs 
    ORDER BY created_at DESC
    LIMIT 200
  `).all();

  res.json({ success: true, data: logs });
});

export default router;
