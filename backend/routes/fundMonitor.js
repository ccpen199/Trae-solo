const express = require('express');
const router = express.Router();
const { query, getOne } = require('../utils/db');
const { success, error } = require('../utils/response');
const { auth, requireRole } = require('../middleware/auth');

router.get('/overview', auth, requireRole('admin'), (req, res) => {
  const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
  
  const income = getOne(`
    SELECT COALESCE(SUM(amount), 0) as total,
           COALESCE(SUM(CASE WHEN fund_type = 'pension' THEN amount END), 0) as pension,
           COALESCE(SUM(CASE WHEN fund_type = 'medical' THEN amount END), 0) as medical,
           COALESCE(SUM(CASE WHEN fund_type = 'unemployment' THEN amount END), 0) as unemployment
    FROM fund_operations
    WHERE operation_type = 'income' AND statistics_date = ?
  `, [currentMonth]);
  
  const expense = getOne(`
    SELECT COALESCE(SUM(amount), 0) as total,
           COALESCE(SUM(CASE WHEN fund_type = 'pension' THEN amount END), 0) as pension,
           COALESCE(SUM(CASE WHEN fund_type = 'medical' THEN amount END), 0) as medical,
           COALESCE(SUM(CASE WHEN fund_type = 'unemployment' THEN amount END), 0) as unemployment
    FROM fund_operations
    WHERE operation_type = 'expense' AND statistics_date = ?
  `, [currentMonth]);

  const balance = {
    total: income.total - expense.total,
    pension: income.pension - expense.pension,
    medical: income.medical - expense.medical,
    unemployment: income.unemployment - expense.unemployment
  };

  const warnings = getOne(`
    SELECT COUNT(*) as total,
           SUM(CASE WHEN level = 'high' THEN 1 ELSE 0 END) as high,
           SUM(CASE WHEN level = 'medium' THEN 1 ELSE 0 END) as medium,
           SUM(CASE WHEN level = 'low' THEN 1 ELSE 0 END) as low
    FROM fund_warnings
    WHERE status = 'active'
  `);

  const abnormal = getOne(`
    SELECT COUNT(*) as count, COALESCE(SUM(ip.total_amount), 0) as amount
    FROM abnormal_payments ap
    LEFT JOIN insurance_payments ip ON ap.payment_id = ip.id
    WHERE ap.status = 'pending'
  `);

  const crossProvince = getOne(`
    SELECT COUNT(*) as count,
           COALESCE(AVG(settlement_days), 0) as avg_days,
           COALESCE(SUM(total_amount), 0) as total_amount,
           COALESCE(SUM(reimbursement_amount), 0) as reimbursement
    FROM cross_province_settlements
    WHERE created_at >= datetime('now', '-30 days')
  `);

  res.json(success({
    currentMonth,
    income,
    expense,
    balance,
    warnings: {
      total: warnings.total || 0,
      high: warnings.high || 0,
      medium: warnings.medium || 0,
      low: warnings.low || 0
    },
    abnormal,
    crossProvince
  }));
});

router.get('/balance-trend', auth, requireRole('admin'), (req, res) => {
  const { months = 6, fundType } = req.query;
  const limit = Number(months);
  
  let typeCondition = '';
  const params = [];
  if (fundType && fundType !== 'all') {
    typeCondition = 'AND fund_type = ?';
    params.push(fundType);
  }
  
  const data = query(`
    SELECT 
      substr(statistics_date, 1, 7) as month,
      fund_type,
      COALESCE(SUM(CASE WHEN operation_type = 'income' THEN amount END), 0) as income,
      COALESCE(SUM(CASE WHEN operation_type = 'expense' THEN amount END), 0) as expense
    FROM fund_operations
    WHERE 1=1 ${typeCondition}
    GROUP BY substr(statistics_date, 1, 7), fund_type
    ORDER BY month DESC
    LIMIT ?
  `, [...params, limit * 5]);

  const monthsData = {};
  data.forEach(item => {
    if (!monthsData[item.month]) {
      monthsData[item.month] = { month: item.month, income: 0, expense: 0, balance: 0 };
    }
    monthsData[item.month].income += item.income;
    monthsData[item.month].expense += item.expense;
    monthsData[item.month].balance += item.income - item.expense;
  });

  const result = Object.values(monthsData).sort((a, b) => a.month.localeCompare(b.month));
  res.json(success(result));
});

router.get('/region-ranking', auth, requireRole('admin'), (req, res) => {
  const { fundType = 'pension', operationType = 'income' } = req.query;
  const data = query(`
    SELECT region, COALESCE(SUM(amount), 0) as amount
    FROM fund_operations
    WHERE fund_type = ? AND operation_type = ?
    GROUP BY region
    ORDER BY amount DESC
    LIMIT 11
  `, [fundType, operationType]);
  res.json(success(data));
});

router.get('/fund-type-distribution', auth, requireRole('admin'), (req, res) => {
  const { operationType = 'income' } = req.query;
  const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
  const data = query(`
    SELECT fund_type, COALESCE(SUM(amount), 0) as amount
    FROM fund_operations
    WHERE operation_type = ? AND statistics_date = ?
    GROUP BY fund_type
  `, [operationType, currentMonth]);
  
  const typeMap = {
    pension: '养老保险',
    medical: '医疗保险',
    unemployment: '失业保险',
    injury: '工伤保险',
    maternity: '生育保险'
  };
  
  const result = data.map(item => ({
    ...item,
    fund_name: typeMap[item.fund_type] || item.fund_type
  }));
  
  res.json(success(result));
});

router.get('/warnings', auth, requireRole('admin'), (req, res) => {
  const { page = 1, pageSize = 10, level, status } = req.query;
  let sql = 'SELECT * FROM fund_warnings WHERE 1=1';
  const params = [];
  if (level && level !== 'all') {
    sql += ' AND level = ?';
    params.push(level);
  }
  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }
  sql += ' ORDER BY created_at DESC';
  const list = query(sql, params);
  
  list.forEach(item => {
    try {
      item.related_data = JSON.parse(item.related_data);
    } catch (e) {}
  });
  
  res.json(success({
    list: list.slice((page - 1) * pageSize, page * pageSize),
    total: list.length,
    page: Number(page),
    pageSize: Number(pageSize)
  }));
});

router.post('/warnings/check-balance', auth, requireRole('admin'), (req, res) => {
  const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
  const funds = ['pension', 'medical', 'unemployment', 'injury', 'maternity'];
  const warnings = [];
  
  funds.forEach(type => {
    const data = getOne(`
      SELECT 
        COALESCE(SUM(CASE WHEN operation_type = 'income' THEN amount END), 0) as income,
        COALESCE(SUM(CASE WHEN operation_type = 'expense' THEN amount END), 0) as expense
      FROM fund_operations
      WHERE fund_type = ? AND statistics_date >= date(?, '-2 months')
      GROUP BY fund_type
    `, [type, currentMonth]);
    
    if (data && data.income < data.expense * 0.8) {
      const ratio = data.income / data.expense;
      const level = ratio < 0.5 ? 'high' : ratio < 0.7 ? 'medium' : 'low';
      const typeName = { pension: '养老', medical: '医疗', unemployment: '失业', injury: '工伤', maternity: '生育' }[type];
      
      const existing = getOne(
        'SELECT id FROM fund_warnings WHERE warning_type = ? AND status = \'active\'',
        [`${type}_balance`]
      );
      
      if (!existing) {
        query(
          `INSERT INTO fund_warnings
           (warning_type, level, description, related_data, status)
           VALUES (?, ?, ?, ?, 'active')`,
          [
            `${type}_balance`,
            level,
            `${typeName}保险基金收支失衡预警：收入仅为支出的${(ratio * 100).toFixed(1)}%`,
            JSON.stringify({ fundType: type, income: data.income, expense: data.expense, ratio }),
          ]
        );
        warnings.push({ type, level, ratio });
      }
    }
  });
  
  res.json(success({ checked: funds.length, newWarnings: warnings.length, warnings }));
});

router.put('/warnings/:id/handle', auth, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const { status, remark } = req.body;
  query(
    'UPDATE fund_warnings SET status = ?, handled = 1 WHERE id = ?',
    [status || 'handled', id]
  );
  res.json(success(null, '预警处理完成'));
});

router.get('/abnormal-payments', auth, requireRole('admin'), (req, res) => {
  const { page = 1, pageSize = 10, status } = req.query;
  let sql = `
    SELECT ap.*, ip.total_amount, ip.merchant_name, ip.merchant_type,
           u.name, u.id_card, ip.created_at as payment_time
    FROM abnormal_payments ap
    LEFT JOIN insurance_payments ip ON ap.payment_id = ip.id
    LEFT JOIN users u ON ap.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (status && status !== 'all') {
    sql += ' AND ap.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY ap.risk_score DESC, ap.created_at DESC';
  
  const list = query(sql, params);
  
  res.json(success({
    list: list.slice((page - 1) * pageSize, page * pageSize),
    total: list.length,
    page: Number(page),
    pageSize: Number(pageSize)
  }));
});

router.get('/cross-province-analysis', auth, requireRole('admin'), (req, res) => {
  const { days = 90 } = req.query;
  
  const byProvince = query(`
    SELECT to_province,
           COUNT(*) as count,
           COALESCE(AVG(settlement_days), 0) as avg_days,
           COALESCE(SUM(total_amount), 0) as total_amount,
           COALESCE(SUM(reimbursement_amount), 0) as reimbursement
    FROM cross_province_settlements
    WHERE created_at >= datetime('now', ? || ' days')
    GROUP BY to_province
    ORDER BY count DESC
  `, [`-${days}`]);
  
  const efficiency = query(`
    SELECT 
      substr(created_at, 1, 7) as month,
      COUNT(*) as count,
      COALESCE(AVG(settlement_days), 0) as avg_days,
      SUM(CASE WHEN settlement_days <= 7 THEN 1 ELSE 0 END) as within_7d,
      SUM(CASE WHEN settlement_days > 15 THEN 1 ELSE 0 END) as over_15d
    FROM cross_province_settlements
    WHERE created_at >= datetime('now', '-180 days')
    GROUP BY substr(created_at, 1, 7)
    ORDER BY month
  `);
  
  res.json(success({ byProvince, efficiency }));
});

router.get('/realtime-alerts', auth, requireRole('admin'), (req, res) => {
  const warnings = query(
    'SELECT * FROM fund_warnings WHERE status = \'active\' ORDER BY level DESC, created_at DESC LIMIT 5'
  );
  const abnormal = query(
    `SELECT ap.*, ip.merchant_name, u.name 
     FROM abnormal_payments ap
     LEFT JOIN insurance_payments ip ON ap.payment_id = ip.id
     LEFT JOIN users u ON ap.user_id = u.id
     WHERE ap.status = 'pending'
     ORDER BY ap.risk_score DESC
     LIMIT 5`
  );
  res.json(success({ warnings, abnormal }));
});

module.exports = router;
