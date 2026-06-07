const express = require('express');
const router = express.Router();
const { query, getOne } = require('../utils/db');
const { success, error, paginate, logOperation } = require('../utils/response');
const { auth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.get('/merchants', auth, (req, res) => {
  const { type, keyword } = req.query;
  let sql = 'SELECT * FROM merchants WHERE status = 1';
  const params = [];
  if (type && type !== 'all') {
    sql += ' AND type = ?';
    params.push(type);
  }
  if (keyword) {
    sql += ' AND name LIKE ?';
    params.push(`%${keyword}%`);
  }
  sql += ' ORDER BY id';
  const list = query(sql, params);
  res.json(success(list));
});

router.get('/prescriptions', auth, (req, res) => {
  const { page = 1, pageSize = 10, status } = req.query;
  let sql = 'SELECT * FROM prescriptions WHERE user_id = ?';
  const params = [req.user.userId];
  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }
  sql += ' ORDER BY created_at DESC';
  const list = query(sql, params);
  res.json(success(paginate(list, page, pageSize)));
});

router.get('/prescriptions/:id', auth, (req, res) => {
  const prescription = getOne('SELECT * FROM prescriptions WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
  if (!prescription) {
    return res.json(error('处方不存在', 404));
  }
  try {
    prescription.drugs = JSON.parse(prescription.drugs);
  } catch (e) {}
  res.json(success(prescription));
});

router.post('/prescriptions', auth, (req, res) => {
  const { hospitalName, doctorName, diagnosis, drugs, totalAmount } = req.body;
  const prescriptionNo = `CF${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const result = query(
    `INSERT INTO prescriptions 
     (prescription_no, user_id, hospital_name, doctor_name, diagnosis, drugs, total_amount, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      prescriptionNo,
      req.user.userId,
      hospitalName,
      doctorName,
      diagnosis,
      JSON.stringify(drugs),
      totalAmount
    ]
  );
  logOperation(
    { query },
    req.user.userId,
    req.user.userType,
    'medical_payment',
    `开具处方：${prescriptionNo}`,
    req.ip
  );
  res.json(success({ id: result.lastInsertRowid, prescriptionNo, message: '处方开具成功' }));
});

router.post('/scan-pay', auth, (req, res) => {
  const { merchantId, totalAmount, prescriptionId } = req.body;
  const merchant = getOne('SELECT * FROM merchants WHERE id = ?', [merchantId]);
  if (!merchant) {
    return res.json(error('商户不存在', 404));
  }

  const insurancePayment = Math.floor(totalAmount * (merchant.type === 'hospital' ? 0.55 : 0.45));
  const personalPayment = totalAmount - insurancePayment;
  const transactionNo = `PAY${Date.now()}${Math.floor(Math.random() * 10000)}`;

  const result = query(
    `INSERT INTO insurance_payments 
     (user_id, social_card_no, merchant_id, merchant_name, merchant_type, total_amount, 
      insurance_payment, personal_payment, prescription_id, payment_status, transaction_no)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)`,
    [
      req.user.userId,
      req.user.socialCardNo,
      merchantId,
      merchant.name,
      merchant.type,
      totalAmount,
      insurancePayment,
      personalPayment,
      prescriptionId || null,
      transactionNo
    ]
  );

  if (prescriptionId) {
    query('UPDATE prescriptions SET status = \'completed\' WHERE id = ?', [prescriptionId]);
  }

  const riskScore = Math.random();
  if (riskScore > 0.85) {
    query(
      `INSERT INTO abnormal_payments 
       (payment_id, user_id, abnormal_type, risk_score, description, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [
        result.lastInsertRowid,
        req.user.userId,
        riskScore > 0.95 ? 'high_amount' : 'frequent_visits',
        riskScore,
        riskScore > 0.95 ? '单次金额过高，触发风险预警' : '近期就诊频次异常，需关注',
      ]
    );
  }

  logOperation(
    { query },
    req.user.userId,
    req.user.userType,
    'medical_payment',
    `医保支付：${merchant.name}，金额${totalAmount}元`,
    req.ip
  );

  res.json(success({
    id: result.lastInsertRowid,
    transactionNo,
    totalAmount,
    insurancePayment,
    personalPayment,
    merchantName: merchant.name,
    paymentTime: new Date().toISOString(),
    message: '支付成功'
  }));
});

router.get('/payments', auth, (req, res) => {
  const { page = 1, pageSize = 10, type, merchantType } = req.query;
  let sql = `SELECT ip.*, m.qualification_no 
             FROM insurance_payments ip 
             LEFT JOIN merchants m ON ip.merchant_id = m.id 
             WHERE ip.user_id = ?`;
  const params = [req.user.userId];
  if (merchantType && merchantType !== 'all') {
    sql += ' AND ip.merchant_type = ?';
    params.push(merchantType);
  }
  sql += ' ORDER BY ip.created_at DESC';
  const list = query(sql, params);
  res.json(success(paginate(list, page, pageSize)));
});

router.get('/payments/:id', auth, (req, res) => {
  const payment = getOne(
    `SELECT ip.*, m.address, m.contact_phone 
     FROM insurance_payments ip 
     LEFT JOIN merchants m ON ip.merchant_id = m.id 
     WHERE ip.id = ? AND ip.user_id = ?`,
    [req.params.id, req.user.userId]
  );
  if (!payment) {
    return res.json(error('支付记录不存在', 404));
  }
  if (payment.prescription_id) {
    const prescription = getOne('SELECT * FROM prescriptions WHERE id = ?', [payment.prescription_id]);
    if (prescription) {
      try {
        prescription.drugs = JSON.parse(prescription.drugs);
      } catch (e) {}
      payment.prescription = prescription;
    }
  }
  res.json(success(payment));
});

router.get('/abnormal', auth, (req, res) => {
  const { page = 1, pageSize = 10, status } = req.query;
  let sql = `SELECT ap.*, ip.total_amount, ip.merchant_name, ip.created_at as payment_time, u.name, u.id_card
             FROM abnormal_payments ap 
             LEFT JOIN insurance_payments ip ON ap.payment_id = ip.id 
             LEFT JOIN users u ON ap.user_id = u.id 
             WHERE 1=1`;
  const params = [];
  if (status && status !== 'all') {
    sql += ' AND ap.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY ap.created_at DESC';
  const list = query(sql, params);
  res.json(success(paginate(list, page, pageSize)));
});

router.put('/abnormal/:id/handle', auth, (req, res) => {
  const { status, remark } = req.body;
  query(
    'UPDATE abnormal_payments SET status = ?, handled = 1 WHERE id = ?',
    [status, req.params.id]
  );
  logOperation(
    { query },
    req.user.userId,
    req.user.userType,
    'medical_payment',
    `处理异常支付：ID=${req.params.id}，状态=${status}`,
    req.ip
  );
  res.json(success(null, '处理完成'));
});

router.get('/statistics', auth, (req, res) => {
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().slice(0, 10);
  
  const totalPayments = getOne(`SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as amount FROM insurance_payments WHERE created_at >= ?`, [monthStartStr]);
  const hospitalPayments = getOne(`SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as amount FROM insurance_payments WHERE created_at >= ? AND merchant_type = 'hospital'`, [monthStartStr]);
  const pharmacyPayments = getOne(`SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as amount FROM insurance_payments WHERE created_at >= ? AND merchant_type = 'pharmacy'`, [monthStartStr]);
  const abnormalCount = getOne(`SELECT COUNT(*) as count FROM abnormal_payments WHERE status = 'pending'`).count;

  res.json(success({
    month: {
      totalCount: totalPayments.count,
      totalAmount: totalPayments.amount,
      hospitalCount: hospitalPayments.count,
      hospitalAmount: hospitalPayments.amount,
      pharmacyCount: pharmacyPayments.count,
      pharmacyAmount: pharmacyPayments.amount
    },
    abnormalCount
  }));
});

module.exports = router;
