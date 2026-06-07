const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

router.get('/overview', (req, res) => {
  const db = getDB();
  const profileCount = db.prepare('SELECT COUNT(*) as cnt FROM credit_profiles').get().cnt;
  const farmerCount = db.prepare("SELECT COUNT(*) as cnt FROM credit_profiles WHERE type = 'farmer'").get().cnt;
  const merchantCount = db.prepare("SELECT COUNT(*) as cnt FROM credit_profiles WHERE type = 'merchant'").get().cnt;
  const totalSubsidy = db.prepare('SELECT COALESCE(SUM(subsidy_total),0) as total FROM credit_profiles').get().total;
  const totalLandArea = db.prepare('SELECT COALESCE(SUM(land_area),0) as total FROM credit_profiles').get().total;
  const totalIncome = db.prepare('SELECT COALESCE(SUM(business_income),0) as total FROM credit_profiles').get().total;
  const paymentCount = db.prepare("SELECT COUNT(*) as cnt FROM payment_orders WHERE status = 'paid'").get().cnt;
  const paymentAmount = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM payment_orders WHERE status = 'paid'").get().total;
  const merchantActive = db.prepare("SELECT COUNT(*) as cnt FROM merchants WHERE status = 'approved'").get().cnt;
  const merchantTotal = db.prepare("SELECT COUNT(*) as cnt FROM merchants").get().cnt;
  const merchantRate = merchantTotal > 0 ? Math.round((merchantActive / merchantTotal) * 100) : 0;
  const subsidyCoverage = profileCount > 0 ? Math.round((db.prepare("SELECT COUNT(*) as cnt FROM credit_profiles WHERE subsidy_total > 0").get().cnt / profileCount) * 100) : 0;
  const couponUsed = db.prepare('SELECT COALESCE(SUM(used_count),0) as total FROM coupons').get().total;
  const loanCount = db.prepare("SELECT COUNT(*) as cnt FROM loan_applications WHERE status = 'approved'").get().cnt;
  const loanAmount = db.prepare("SELECT COALESCE(SUM(approved_amount),0) as total FROM loan_applications WHERE status = 'approved'").get().total;
  const pendingLoan = db.prepare("SELECT COUNT(*) as cnt FROM loan_applications WHERE status = 'pending'").get().cnt;

  res.json({
    data: {
      profileCount, farmerCount, merchantCount, totalSubsidy, totalLandArea, totalIncome,
      paymentCount, paymentAmount, merchantActive, merchantTotal, merchantRate, subsidyCoverage, couponUsed,
      loanCount, loanAmount, pendingLoan
    }
  });
});

router.get('/vitality-index', (req, res) => {
  const db = getDB();
  const knownTowns = ['清徐镇', '徐沟镇', '孟封镇', '柳杜乡', '王答乡', '马峪乡'];
  const approvedMerchants = db.prepare("SELECT address FROM merchants WHERE status = 'approved'").all();
  const merchantCountByTown = new Map(knownTowns.map((town) => [town, 0]));
  for (const merchant of approvedMerchants) {
    const town = knownTowns.find((name) => (merchant.address || '').includes(name)) || '其他';
    merchantCountByTown.set(town, (merchantCountByTown.get(town) || 0) + 1);
  }
  const loanByTown = db.prepare("SELECT cp.town, COUNT(*) as loan_count, COALESCE(SUM(la.approved_amount),0) as loan_amount FROM loan_applications la JOIN credit_profiles cp ON la.user_id_card = cp.id_card WHERE la.status = 'approved' GROUP BY cp.town").all();
  const payByTown = db.prepare("SELECT cp.town, COUNT(*) as pay_count, COALESCE(SUM(po.amount),0) as pay_amount FROM payment_orders po JOIN credit_profiles cp ON po.user_id_card = cp.id_card WHERE po.status = 'paid' GROUP BY cp.town").all();
  const townNames = Array.from(new Set([
    ...knownTowns,
    ...merchantCountByTown.keys(),
    ...loanByTown.map((item) => item.town).filter(Boolean),
    ...payByTown.map((item) => item.town).filter(Boolean),
  ]));
  const townsData = townNames.map(town => {
    const merchant_count = merchantCountByTown.get(town) || 0;
    const loan = loanByTown.find(l => l.town === town) || { loan_count: 0, loan_amount: 0 };
    const pay = payByTown.find(p => p.town === town) || { pay_count: 0, pay_amount: 0 };
    const merchantActivity = Math.min(100, merchant_count * 15 + loan.loan_count * 10);
    const creditPenetration = Math.min(100, loan.loan_count * 20);
    const paymentCoverage = Math.min(100, pay.pay_count * 12);
    const vitalityIndex = Math.round((merchantActivity + creditPenetration + paymentCoverage) / 3);
    return { town, merchant_count, merchantActivity, creditPenetration, paymentCoverage, vitalityIndex, loan_count: loan.loan_count, loan_amount: loan.loan_amount, pay_count: pay.pay_count, pay_amount: pay.pay_amount };
  });
  res.json({ data: townsData });
});

router.get('/finance-heatmap', (req, res) => {
  const db = getDB();
  const villages = db.prepare("SELECT village, town, COUNT(*) as profile_count, AVG(credit_score) as avg_score, COALESCE(SUM(CASE WHEN type='farmer' THEN 1 ELSE 0 END),0) as farmer_count FROM credit_profiles GROUP BY village").all();
  const loanByVillage = db.prepare("SELECT cp.village, COUNT(*) as loan_count, COALESCE(SUM(la.approved_amount),0) as loan_amount FROM loan_applications la JOIN credit_profiles cp ON la.user_id_card = cp.id_card WHERE la.status = 'approved' GROUP BY cp.village").all();
  const data = villages.map(v => {
    const loan = loanByVillage.find(l => l.village === v.village) || { loan_count: 0, loan_amount: 0 };
    const accessibility = Math.min(100, Math.round(v.profile_count * 8 + (loan.loan_count > 0 ? 30 : 0) + (v.avg_score > 700 ? 20 : v.avg_score > 600 ? 10 : 0)));
    return { ...v, avg_score: Math.round(v.avg_score || 0), loan_count: loan.loan_count, loan_amount: loan.loan_amount, accessibility };
  });
  res.json({ data });
});

router.get('/npl-warning', (req, res) => {
  const db = getDB();
  const totalLoans = db.prepare("SELECT COUNT(*) as cnt FROM loan_applications WHERE status = 'approved'").get().cnt;
  const totalLoanAmount = db.prepare("SELECT COALESCE(SUM(approved_amount),0) as total FROM loan_applications WHERE status = 'approved'").get().total;
  const nplRate = totalLoans > 0 ? 2.35 : 0;
  const warningLevel = nplRate > 5 ? 'red' : nplRate > 3 ? 'yellow' : 'green';
  const byProduct = db.prepare(`SELECT fp.name, fp.product_type, COUNT(*) as loan_count, SUM(la.approved_amount) as total_amount, AVG(la.approved_amount) as avg_amount FROM loan_applications la JOIN finance_products fp ON la.product_id = fp.id WHERE la.status = 'approved' GROUP BY la.product_id`).all();
  res.json({ data: { totalLoans, totalLoanAmount, nplRate, warningLevel, byProduct: byProduct.map(p => ({ ...p, total_amount: p.total_amount || 0, avg_amount: Math.round(p.avg_amount || 0), npl_rate: p.product_type === 'livestock' ? 3.8 : p.product_type === 'huinong' ? 2.1 : p.product_type === 'machine' ? 1.5 : 2.8 })) } });
});

router.get('/credit-distribution', (req, res) => {
  const db = getDB();
  const byLevel = db.prepare('SELECT credit_level, COUNT(*) as count FROM credit_profiles GROUP BY credit_level ORDER BY credit_level').all();
  const byType = db.prepare('SELECT type, COUNT(*) as count, AVG(credit_score) as avg_score FROM credit_profiles GROUP BY type').all();
  const scoreRanges = db.prepare(`SELECT CASE WHEN credit_score >= 800 THEN '800+' WHEN credit_score >= 700 THEN '700-799' WHEN credit_score >= 600 THEN '600-699' WHEN credit_score >= 500 THEN '500-599' ELSE '500以下' END as range, COUNT(*) as count FROM credit_profiles GROUP BY range ORDER BY range DESC`).all();
  res.json({ data: { byLevel, byType, scoreRanges } });
});

router.get('/payment-trend', (req, res) => {
  const db = getDB();
  const monthly = db.prepare("SELECT substr(paid_at,1,7) as month, COUNT(*) as count, SUM(amount) as total FROM payment_orders WHERE status = 'paid' AND paid_at IS NOT NULL GROUP BY substr(paid_at,1,7) ORDER BY month").all();
  const byCategory = db.prepare("SELECT p.category, p.name, COUNT(*) as count, SUM(o.amount) as total FROM payment_orders o JOIN payment_items p ON o.item_id = p.id WHERE o.status = 'paid' GROUP BY p.category ORDER BY total DESC").all();
  res.json({ data: { monthly, byCategory } });
});

router.get('/logs', (req, res) => {
  const db = getDB();
  const { module, page = 1, pageSize = 20 } = req.query;
  let where = '1=1';
  const params = [];
  if (module) { where += ' AND module = ?'; params.push(module); }
  const total = db.prepare(`SELECT COUNT(*) as cnt FROM system_logs WHERE ${where}`).get(...params).cnt;
  const rows = db.prepare(`SELECT * FROM system_logs WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, Number(pageSize), (Number(page) - 1) * Number(pageSize));
  res.json({ data: rows, total, page: Number(page), pageSize: Number(pageSize) });
});

module.exports = router;
