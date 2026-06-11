const express = require('express');
const db = require('../config/database');
const { authenticate, requireAuthLevel } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');
const { requireSensitiveVerify } = require('../middleware/sensitiveOperation');
const { routeToProvince } = require('../middleware/provinceRouter');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const createServiceRecord = async (userId, serviceId, serviceCode, serviceName, requestData, status = 'pending', province) => {
  const traceId = uuidv4();
  await db.runAsync(`
    INSERT INTO service_records (user_id, service_id, service_code, service_name, request_data, status, province, trace_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, userId, serviceId, serviceCode, serviceName, JSON.stringify(requestData), status, province, traceId);
  return traceId;
};

router.get('/', authenticate, routeToProvince, auditLog('services', 'get_services'), async (req, res) => {
  const { category } = req.query;
  const province = req.province || 'national';

  let sql = 'SELECT * FROM services WHERE is_enabled = 1 AND (province = \'national\' OR province = ?)';
  const params = [province];
  
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  
  sql += ' ORDER BY sort_order ASC';
  const services = await db.allAsync(sql, ...params);

  const categories = (await db.allAsync(`
    SELECT DISTINCT category FROM services
    WHERE is_enabled = 1
  `)).map(s => s.category);

  res.json({
    code: 200,
    data: {
      list: services,
      categories,
    },
  });
});

router.get('/records', authenticate, auditLog('services', 'get_service_records'), async (req, res) => {
  const { page = 1, pageSize = 10, status } = req.query;
  const pageNum = parseInt(page);
  const pageSizeNum = parseInt(pageSize);
  const offset = (pageNum - 1) * pageSizeNum;

  let sql = 'SELECT * FROM service_records WHERE user_id = ?';
  const params = [req.user.id];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(pageSizeNum, offset);

  const records = await db.allAsync(sql, ...params);

  let totalSql = 'SELECT COUNT(*) as count FROM service_records WHERE user_id = ?';
  const totalParams = [req.user.id];
  if (status) {
    totalSql += ' AND status = ?';
    totalParams.push(status);
  }
  const total = (await db.getAsync(totalSql, ...totalParams)).count;

  res.json({
    code: 200,
    data: {
      list: records,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    },
  });
});

router.get('/pension/verify', authenticate, requireAuthLevel(2), requireSensitiveVerify('pension_verify'), auditLog('services', 'pension_verify'), async (req, res) => {
  const { verify_method = 'face' } = req.query;
  const verify_result = 'success';
  const nextDate = new Date();
  nextDate.setFullYear(nextDate.getFullYear() + 1);

  await db.runAsync(`
    INSERT INTO pension_verifications (user_id, verify_date, verify_method, verify_result, next_verify_date)
    VALUES (?, DATE(), ?, ?, ?)
  `, req.user.id, verify_method, verify_result, nextDate.toISOString().split('T')[0]);

  const service = await db.getAsync('SELECT * FROM services WHERE code = ?', 'pension_verify');
  const traceId = await createServiceRecord(req.user.id, service.id, service.code, service.name, { verify_method, verify_result }, 'completed', req.user.province);

  await db.runAsync(`
    INSERT INTO notifications (user_id, title, content, type, related_service)
    VALUES (?, ?, ?, 'system', 'pension_verify')
  `, req.user.id, '养老金认证成功', '您已完成2024年度养老金领取资格认证');

  res.json({
    code: 200,
    message: '养老金领取资格认证成功',
    data: {
      trace_id: traceId,
      next_verify_date: nextDate.toISOString().split('T')[0],
    },
  });
});

router.get('/medical/records', authenticate, routeToProvince, auditLog('services', 'get_medical_records'), async (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  const pageNum = parseInt(page);
  const pageSizeNum = parseInt(pageSize);
  const offset = (pageNum - 1) * pageSizeNum;

  const records = await db.allAsync(`
    SELECT * FROM medical_records
    WHERE user_id = ?
    ORDER BY date DESC
    LIMIT ? OFFSET ?
  `, req.user.id, pageSizeNum, offset);

  const total = (await db.getAsync('SELECT COUNT(*) as count FROM medical_records WHERE user_id = ?', req.user.id)).count;

  res.json({
    code: 200,
    data: {
      list: records,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    },
  });
});

router.post('/medical/record', authenticate, requireAuthLevel(2), requireSensitiveVerify('medical_record'), auditLog('services', 'medical_record'), async (req, res) => {
  const { hospital, department, diagnosis, amount, date, is_remote } = req.body;

  await db.runAsync(`
    INSERT INTO medical_records (user_id, hospital, department, diagnosis, amount, reimbursement, date, province, is_remote)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, req.user.id, hospital, department, diagnosis, amount, amount * 0.7, date, req.user.province, is_remote ? 1 : 0);

  const service = await db.getAsync('SELECT * FROM services WHERE code = ?', 'medical_record');
  const traceId = await createServiceRecord(req.user.id, service.id, service.code, service.name, req.body, 'completed', req.user.province);

  res.json({ code: 200, message: '就医记录已保存', data: { trace_id: traceId } });
});

router.post('/unemployment/apply', authenticate, requireAuthLevel(2), requireSensitiveVerify('unemployment_apply'), auditLog('services', 'unemployment_apply'), async (req, res) => {
  const { reason } = req.body;
  const amount = 1890;
  const months = 6;

  await db.runAsync(`
    INSERT INTO unemployment_applications (user_id, application_date, reason, status, amount, months)
    VALUES (?, DATE(), ?, 'pending', ?, ?)
  `, req.user.id, reason, amount, months);

  const service = await db.getAsync('SELECT * FROM services WHERE code = ?', 'unemployment');
  const traceId = await createServiceRecord(req.user.id, service.id, service.code, service.name, req.body, 'pending', req.user.province);

  res.json({
    code: 200,
    message: '失业金申领已提交，将在3个工作日内审核',
    data: {
      trace_id: traceId,
      expected_amount: amount,
      expected_months: months,
    },
  });
});

router.get('/certificates', authenticate, auditLog('services', 'get_certificates'), async (req, res) => {
  const certs = await db.allAsync(`
    SELECT * FROM certificates
    WHERE user_id = ? AND status = 1
    ORDER BY issue_date DESC
  `, req.user.id);

  if (certs.length === 0) {
    const sampleCerts = [
      { cert_name: '人力资源管理师', cert_no: '2023110001', issue_date: '2023-11-15', issue_org: '人力资源社会保障部', level: '二级' },
      { cert_name: '社会工作者职业资格', cert_no: '2022060015', issue_date: '2022-06-20', issue_org: '民政部', level: '中级' },
    ];
    for (const c of sampleCerts) {
      await db.runAsync(`
        INSERT INTO certificates (user_id, cert_name, cert_no, issue_date, issue_org, level)
        VALUES (?, ?, ?, ?, ?, ?)
      `, req.user.id, c.cert_name, c.cert_no, c.issue_date, c.issue_org, c.level);
    }
    const certsAfter = await db.allAsync('SELECT * FROM certificates WHERE user_id = ?', req.user.id);
    return res.json({ code: 200, data: certsAfter });
  }

  res.json({ code: 200, data: certs });
});

router.post('/labor/report', authenticate, requireAuthLevel(2), requireSensitiveVerify('labor_report'), auditLog('services', 'labor_report'), async (req, res) => {
  const { company, matter, content, contact } = req.body;

  const service = await db.getAsync('SELECT * FROM services WHERE code = ?', 'labor_report');
  const traceId = await createServiceRecord(req.user.id, service.id, service.code, service.name, req.body, 'pending', req.user.province);

  res.json({
    code: 200,
    message: '举报已提交，将在7个工作日内处理',
    data: { trace_id: traceId },
  });
});

router.get('/social-card', authenticate, auditLog('services', 'get_social_card'), async (req, res) => {
  let card = await db.getAsync('SELECT * FROM social_security_cards WHERE user_id = ?', req.user.id);

  if (!card) {
    const cardNo = '62' + Math.floor(Math.random() * 100000000000000000).toString().padStart(16, '0');
    await db.runAsync(`
      INSERT INTO social_security_cards (user_id, card_no, issue_date, valid_date, issue_office, balance)
      VALUES (?, ?, DATE(), DATE(DATE(), '+10 years'), ?, 12580.50)
    `, req.user.id, cardNo, req.user.province + '市人力资源和社会保障局');
    card = await db.getAsync('SELECT * FROM social_security_cards WHERE user_id = ?', req.user.id);
  }

  const maskedCard = {
    ...card,
    card_no: card.card_no.replace(/(\d{6})\d{10}(\d{2})/, '$1**********$2'),
  };

  res.json({ code: 200, data: maskedCard });
});

router.post('/social/transfer', authenticate, requireAuthLevel(2), requireSensitiveVerify('social_transfer'), auditLog('services', 'social_transfer'), async (req, res) => {
  const { from_province, to_province, transfer_type } = req.body;

  const service = await db.getAsync('SELECT * FROM services WHERE code = ?', 'social_transfer');
  const traceId = await createServiceRecord(req.user.id, service.id, service.code, service.name, req.body, 'pending', req.user.province);

  res.json({
    code: 200,
    message: '社保关系转移申请已提交',
    data: { trace_id: traceId, expected_days: 15 },
  });
});

module.exports = router;
