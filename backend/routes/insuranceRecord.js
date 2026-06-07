const express = require('express');
const router = express.Router();
const { query, getOne } = require('../utils/db');
const { success, error, paginate, logOperation } = require('../utils/response');
const { auth } = require('../middleware/auth');

router.get('/my-profile', auth, (req, res) => {
  const user = getOne('SELECT * FROM users WHERE id = ?', [req.user.userId]);
  if (!user) {
    return res.json(error('用户不存在', 404));
  }
  const card = getOne('SELECT * FROM social_cards WHERE user_id = ? AND status = \'active\'', [req.user.userId]);
  const summary = getOne(`
    SELECT 
      COUNT(DISTINCT insurance_type) as insurance_types,
      SUM(CASE WHEN insurance_type = 'pension' THEN 1 ELSE 0 END) as pension_months,
      SUM(CASE WHEN insurance_type = 'medical' THEN 1 ELSE 0 END) as medical_months,
      COALESCE(SUM(personal_payment), 0) as total_personal
    FROM insurance_records
    WHERE user_id = ?
  `, [req.user.userId]);
  
  res.json(success({
    user: { id: user.id, id_card: user.id_card, name: user.name, phone: user.phone, user_type: user.user_type },
    socialCard: card,
    insuranceSummary: summary
  }));
});

router.get('/payment-records', auth, (req, res) => {
  const { page = 1, pageSize = 10, insuranceType, year } = req.query;
  let sql = 'SELECT * FROM insurance_records WHERE user_id = ?';
  const params = [req.user.userId];
  if (insuranceType && insuranceType !== 'all') {
    sql += ' AND insurance_type = ?';
    params.push(insuranceType);
  }
  if (year && year !== 'all') {
    sql += ' AND payment_month LIKE ?';
    params.push(`${year}%`);
  }
  sql += ' ORDER BY payment_month DESC';
  const list = query(sql, params);
  
  const yearStats = query(`
    SELECT 
      substr(payment_month, 1, 4) as year,
      insurance_type,
      COUNT(*) as months,
      SUM(payment_base) as total_base,
      SUM(personal_payment) as total_personal,
      SUM(company_payment) as total_company
    FROM insurance_records
    WHERE user_id = ?
    GROUP BY substr(payment_month, 1, 4), insurance_type
    ORDER BY year DESC
  `, [req.user.userId]);

  res.json(success({
    ...paginate(list, page, pageSize),
    yearStats
  }));
});

router.get('/payment-detail', auth, (req, res) => {
  const { id } = req.query;
  const record = getOne(`
    SELECT ir.*, c.company_name
    FROM insurance_records ir
    LEFT JOIN companies c ON ir.company_id = c.id
    WHERE ir.id = ? AND ir.user_id = ?
  `, [id, req.user.userId]);
  if (!record) {
    return res.json(error('缴费记录不存在', 404));
  }
  res.json(success(record));
});

router.get('/years', auth, (req, res) => {
  const years = query(`
    SELECT DISTINCT substr(payment_month, 1, 4) as year
    FROM insurance_records
    WHERE user_id = ?
    ORDER BY year DESC
  `, [req.user.userId]).map(r => r.year);
  res.json(success(years));
});

router.get('/transfers', auth, (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  const list = query(
    'SELECT * FROM insurance_transfers WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.userId]
  );
  res.json(success(paginate(list, page, pageSize)));
});

router.post('/transfers', auth, (req, res) => {
  const { fromLocation, toLocation, transferType } = req.body;
  const result = query(
    `INSERT INTO insurance_transfers
     (user_id, from_location, to_location, transfer_type, status, progress, remark)
     VALUES (?, ?, ?, ?, 'processing', 10, '材料已提交，等待审核')`,
    [req.user.userId, fromLocation, toLocation, transferType]
  );
  logOperation(
    { query },
    req.user.userId,
    req.user.userType,
    'insurance_record',
    `社保转移申请：${fromLocation} -> ${toLocation}`,
    req.ip
  );
  res.json(success({
    id: result.lastInsertRowid,
    status: 'processing',
    message: '转移接续申请已提交，预计15个工作日内完成审核'
  }));
});

router.get('/transfers/:id/progress', auth, (req, res) => {
  const transfer = getOne(
    'SELECT * FROM insurance_transfers WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.userId]
  );
  if (!transfer) {
    return res.json(error('转移记录不存在', 404));
  }
  const steps = [
    { step: 1, name: '提交申请', completed: transfer.progress >= 10, time: transfer.created_at },
    { step: 2, name: '原参保地审核', completed: transfer.progress >= 30, time: null },
    { step: 3, name: '转移基金划转', completed: transfer.progress >= 60, time: null },
    { step: 4, name: '新参保地接续', completed: transfer.progress >= 80, time: null },
    { step: 5, name: '完成接续完成', completed: transfer.progress >= 100, time: transfer.status === 'completed' ? transfer.updated_at : null },
  ];
  res.json(success({ ...transfer, steps }));
});

router.put('/transfers/:id/progress', auth, (req, res) => {
  const { progress, status, remark } = req.body;
  query(
    'UPDATE insurance_transfers SET progress = ?, status = ?, remark = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [progress, status, remark, req.params.id]
  );
  logOperation(
    { query },
    req.user.userId,
    req.user.userType,
    'insurance_record',
    `更新转移进度：ID=${req.params.id}，进度=${progress}%`,
    req.ip
  );
  res.json(success(null, '进度更新成功'));
});

router.post('/retirement-estimate', auth, (req, res) => {
  const { birthDate, gender } = req.body;
  if (!birthDate || !gender) {
    return res.json(error('出生日期和性别不能为空', 400));
  }
  const birth = new Date(birthDate);
  const now = new Date();
  const retirementAge = gender === 'male' ? 60 : 55;
  const retirementDate = new Date(birth);
  retirementDate.setFullYear(birth.getFullYear() + retirementAge);
  
  const records = query(`
    SELECT insurance_type, COUNT(*) as months, SUM(payment_base) as total_base
    FROM insurance_records
    WHERE user_id = ? AND insurance_type = 'pension'
    GROUP BY insurance_type
  `, [req.user.userId]);
  
  const pensionRecord = records.find(r => r.insurance_type === 'pension') || { months: 0, total_base: 0 };
  const contributionYears = Math.floor(pensionRecord.months / 12);
  const personalAccountBalance = pensionRecord.total_base * 0.08 * 1.05;
  
  const yearsToRetirement = Math.max(0, (retirementDate - now) / (1000 * 60 * 60 * 24 * 365));
  const futureContribution = yearsToRetirement * 12 * 6000 * 0.08;
  const totalAccount = personalAccountBalance + futureContribution;
  const averageSalary = 6000;
  const estimatedPension = averageSalary * 0.01 * contributionYears + totalAccount / 139;

  query(
    `INSERT INTO retirement_estimates
     (user_id, id_card, birth_date, gender, retirement_age, contribution_years,
      personal_account_balance, average_salary, estimated_pension)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user.userId, req.user.idCard, birthDate, gender, retirementAge,
      contributionYears, personalAccountBalance, averageSalary, estimatedPension
    ]
  );

  res.json(success({
    retirementAge,
    retirementDate: retirementDate.toISOString().slice(0, 10),
    contributionYears,
    personalAccountBalance: Math.round(personalAccountBalance),
    estimatedPension: Math.round(estimatedPension),
    details: {
      basicPension: Math.round(averageSalary * 0.01 * contributionYears),
      personalPension: Math.round(totalAccount / 139),
      totalAccount: Math.round(totalAccount)
    },
    suggestion: contributionYears < 15 ? '累计缴费年限不足15年，建议补缴或延长缴费' : '缴费年限满足领取条件'
  }));
});

router.get('/retirement-history', auth, (req, res) => {
  const list = query(
    'SELECT * FROM retirement_estimates WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
    [req.user.userId]
  );
  res.json(success(list));
});

router.get('/statistics', auth, (req, res) => {
  const totalMonths = getOne(`
    SELECT 
      SUM(CASE WHEN insurance_type = 'pension' THEN 1 ELSE 0 END) as pension,
      SUM(CASE WHEN insurance_type = 'medical' THEN 1 ELSE 0 END) as medical,
      COALESCE(SUM(CASE WHEN insurance_type = 'pension' THEN personal_payment ELSE 0 END), 0) as pension_personal,
      COALESCE(SUM(CASE WHEN insurance_type = 'pension' THEN company_payment ELSE 0 END), 0) as pension_company
    FROM insurance_records
    WHERE user_id = ?
  `, [req.user.userId]);
  
  const transferPending = getOne(`
    SELECT COUNT(*) as count FROM insurance_transfers WHERE user_id = ? AND status != 'completed'`,
    [req.user.userId]
  );

  res.json(success({
    pension: {
      months: totalMonths.pension || 0,
      personal: totalMonths.pension_personal || 0,
      company: totalMonths.pension_company || 0
    },
    medical: {
      months: totalMonths.medical || 0
    },
    transferPending: transferPending.count
  }));
});

module.exports = router;
