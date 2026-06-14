const db = require('../database');
const auth = require('../auth');
const workflow = require('../workflow');

function escapeStr(str) {
  return String(str || '').replace(/'/g, "''");
}

function registerInsuranceRoutes(app) {
  app.get('/api/insurance/accounts', auth.requireAuth, (req, res) => {
    const accounts = db.query(`
      SELECT ia.*, it.name as insurance_type_name, it.code as insurance_type_code
      FROM social_insurance_accounts ia
      INNER JOIN insurance_types it ON ia.insurance_type_id = it.id
      WHERE ia.user_id = ?
      ORDER BY it.id ASC
    `, [req.session.userId]);
    res.json({ ok: true, data: accounts });
  });

  app.get('/api/insurance/accounts/:id', auth.requireAuth, (req, res) => {
    const accountId = Number(req.params.id);
    const accounts = db.query(`
      SELECT ia.*, it.name as insurance_type_name, it.code as insurance_type_code
      FROM social_insurance_accounts ia
      INNER JOIN insurance_types it ON ia.insurance_type_id = it.id
      WHERE ia.id = ? AND ia.user_id = ?
      LIMIT 1
    `, [accountId, req.session.userId]);
    
    if (accounts.length === 0) {
      return res.json({ ok: false, message: '社保账户不存在' });
    }
    
    const account = accounts[0];
    const payments = db.query(`
      SELECT * FROM payment_records
      WHERE insurance_account_id = ?
      ORDER BY payment_year DESC, payment_month DESC
      LIMIT 24
    `, [accountId]);
    
    res.json({ ok: true, data: { ...account, payments } });
  });

  app.get('/api/insurance/payment-history', auth.requireAuth, (req, res) => {
    const { insurance_type_id, year, page = 1, page_size = 12 } = req.query;
    const offset = (page - 1) * page_size;
    
    let sql = `
      SELECT pr.*, it.name as insurance_type_name
      FROM payment_records pr
      INNER JOIN social_insurance_accounts ia ON pr.insurance_account_id = ia.id
      INNER JOIN insurance_types it ON ia.insurance_type_id = it.id
      WHERE pr.user_id = ?
    `;
    const params = [req.session.userId];
    
    if (insurance_type_id) {
      sql += ' AND ia.insurance_type_id = ?';
      params.push(Number(insurance_type_id));
    }
    if (year) {
      sql += ' AND pr.payment_year = ?';
      params.push(year);
    }
    
    sql += ' ORDER BY pr.payment_year DESC, pr.payment_month DESC LIMIT ? OFFSET ?';
    params.push(Number(page_size), Number(offset));
    
    const records = db.query(sql, params);
    res.json({ ok: true, data: records, page: Number(page), page_size: Number(page_size) });
  });

  app.post('/api/insurance/registrations', auth.requireAuth, auth.requirePermission('personal.insurance.register'), async (req, res) => {
    const body = await req.body;
    const { insurance_type_id, registration_type, applicant_type, region } = body;
    
    if (!insurance_type_id || !registration_type || !region) {
      return res.json({ ok: false, message: '缺少必要参数' });
    }
    
    db.execute(`
      INSERT INTO insurance_registrations (user_id, insurance_type_id, registration_type, applicant_type, region, applicant_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [req.session.userId, Number(insurance_type_id), registration_type, applicant_type || 'personal', region, applicant_type || 'personal']);
    
    const registrationId = db.getLastInsertId();
    
    const wfResult = workflow.startWorkflow(
      'WF_SI001',
      registrationId,
      'insurance_registration',
      req.session.userId,
      req.session.userType,
      { insurance_type_id, registration_type, region },
      'normal'
    );
    
    db.execute(`
      UPDATE insurance_registrations
      SET current_step = ?, total_steps = ?, status = 'pending'
      WHERE id = ?
    `, [wfResult.currentStep, wfResult.totalSteps, registrationId]);
    
    db.execute(`
      INSERT INTO notifications (user_id, type, title, content, related_module, related_id)
      VALUES (?, 'business', ?, ?, 'insurance', ?)
    `, [req.session.userId, '参保登记申请已提交', `您的${registration_type === 'new' ? '新参保' : registration_type === 'transfer_in' ? '转入' : '变更'}登记申请已提交，正在等待审核。`, registrationId]);
    
    res.json({ ok: true, data: { id: registrationId, workflow: wfResult } });
  });

  app.get('/api/insurance/registrations', auth.requireAuth, (req, res) => {
    const { status, page = 1, page_size = 10 } = req.query;
    const offset = (page - 1) * page_size;
    
    let sql = `
      SELECT ir.*, it.name as insurance_type_name
      FROM insurance_registrations ir
      INNER JOIN insurance_types it ON ir.insurance_type_id = it.id
      WHERE ir.user_id = ?
    `;
    const params = [req.session.userId];
    
    if (status) {
      sql += ' AND ir.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY ir.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(page_size), Number(offset));
    
    const registrations = db.query(sql, params);
    res.json({ ok: true, data: registrations });
  });

  app.post('/api/insurance/benefit-certification', auth.requireAuth, auth.requirePermission('personal.benefit.certify'), async (req, res) => {
    const body = await req.body;
    const { insurance_type_id, certification_method, face_image_data, location } = body;
    
    if (!insurance_type_id || !certification_method) {
      return res.json({ ok: false, message: '缺少必要参数' });
    }
    
    const passed = certification_method === 'data_cross_check' || certification_method === 'face';
    
    const certDate = new Date().toISOString();
    const nextCertDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    
    db.execute(`
      INSERT INTO benefit_certifications (user_id, insurance_type_id, certification_method, certification_date, certification_result, face_image_data, location, next_certification_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [req.session.userId, Number(insurance_type_id), certification_method, certDate, passed ? 'passed' : 'failed', face_image_data || null, location || null, nextCertDate]);
    
    const certId = db.getLastInsertId();
    
    if (passed) {
      db.execute(`
        INSERT INTO notifications (user_id, type, title, content, related_module, related_id)
        VALUES (?, 'business', ?, ?, 'insurance', ?)
      `, [req.session.userId, '待遇资格认证成功', `您的${certification_method === 'face' ? '人脸' : '数据比对'}认证已通过，下次认证时间为${nextCertDate.split('T')[0]}。`, certId]);
    }
    
    res.json({ ok: true, data: { id: certId, result: passed ? 'passed' : 'failed', next_certification_date: nextCertDate } });
  });

  app.get('/api/insurance/benefit-certifications', auth.requireAuth, (req, res) => {
    const certifications = db.query(`
      SELECT bc.*, it.name as insurance_type_name
      FROM benefit_certifications bc
      INNER JOIN insurance_types it ON bc.insurance_type_id = it.id
      WHERE bc.user_id = ?
      ORDER BY bc.certification_date DESC
      LIMIT 20
    `, [req.session.userId]);
    res.json({ ok: true, data: certifications });
  });

  app.post('/api/insurance/transfers', auth.requireAuth, auth.requirePermission('personal.insurance.transfer'), async (req, res) => {
    const body = await req.body;
    const { insurance_type_id, transfer_type, from_region, to_region } = body;
    
    if (!insurance_type_id || !transfer_type || !from_region || !to_region) {
      return res.json({ ok: false, message: '缺少必要参数' });
    }
    
    const accounts = db.query(`
      SELECT * FROM social_insurance_accounts
      WHERE user_id = ? AND insurance_type_id = ?
      LIMIT 1
    `, [req.session.userId, Number(insurance_type_id)]);
    
    if (accounts.length === 0) {
      return res.json({ ok: false, message: '社保账户不存在' });
    }
    const account = accounts[0];
    
    db.execute(`
      INSERT INTO insurance_transfers (user_id, insurance_type_id, transfer_type, from_region, to_region, personal_account_balance, unit_account_balance, total_months)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [req.session.userId, Number(insurance_type_id), transfer_type, from_region, to_region, account.personal_balance, account.unit_balance, account.accumulated_months]);
    
    const transferId = db.getLastInsertId();
    
    const wfResult = workflow.startWorkflow(
      'WF_SI002',
      transferId,
      'insurance_transfer',
      req.session.userId,
      req.session.userType,
      { insurance_type_id, transfer_type, from_region, to_region },
      'high'
    );
    
    db.execute(`
      UPDATE insurance_transfers
      SET current_step = ?, total_steps = ?, status = 'pending'
      WHERE id = ?
    `, [wfResult.currentStep, wfResult.totalSteps, transferId]);
    
    db.execute(`
      INSERT INTO notifications (user_id, type, title, content, related_module, related_id)
      VALUES (?, 'business', ?, ?, 'insurance', ?)
    `, [req.session.userId, '社保转移申请已提交', `您的${transfer_type === 'in' ? '转入' : '转出'}申请已提交，预计45个工作日内完成。`, transferId]);
    
    res.json({ ok: true, data: { id: transferId, workflow: wfResult } });
  });

  app.get('/api/insurance/transfers', auth.requireAuth, (req, res) => {
    const transfers = db.query(`
      SELECT it.*, itype.name as insurance_type_name
      FROM insurance_transfers it
      INNER JOIN insurance_types itype ON it.insurance_type_id = itype.id
      WHERE it.user_id = ?
      ORDER BY it.created_at DESC
      LIMIT 10
    `, [req.session.userId]);
    res.json({ ok: true, data: transfers });
  });

  app.post('/api/insurance/certificates', auth.requireAuth, auth.requirePermission('personal.certificate.apply'), async (req, res) => {
    const body = await req.body;
    const { certificate_type } = body;
    
    if (!certificate_type) {
      return res.json({ ok: false, message: '缺少必要参数' });
    }
    
    const existing = db.query(`
      SELECT * FROM electronic_certificates
      WHERE user_id = ? AND certificate_type = ? AND status = 'valid'
      LIMIT 1
    `, [req.session.userId, certificate_type]);
    
    if (existing.length > 0) {
      return res.json({ ok: true, data: existing[0], message: '电子凭证已存在' });
    }
    
    const certNo = `${certificate_type.substring(0, 3).toUpperCase()}${Date.now()}${String(req.session.userId).padStart(6, '0')}`;
    const now = new Date().toISOString();
    const validTo = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString();
    
    db.execute(`
      INSERT INTO electronic_certificates (user_id, certificate_type, certificate_no, valid_from, valid_to, status, issued_by)
      VALUES (?, ?, ?, ?, ?, 'valid', '北京市社会保险基金管理中心')
    `, [req.session.userId, certificate_type, certNo, now, validTo]);
    
    const certId = db.getLastInsertId();
    const certs = db.query('SELECT * FROM electronic_certificates WHERE id = ?', [certId]);
    
    db.execute(`
      INSERT INTO notifications (user_id, type, title, content, related_module, related_id)
      VALUES (?, 'business', ?, ?, 'insurance', ?)
    `, [req.session.userId, '电子凭证签发成功', `您的${certificate_type === 'social_security_card' ? '电子社保卡' : certificate_type === 'pension_certificate' ? '养老金领取证' : '电子凭证'}已签发成功。`, certId]);
    
    res.json({ ok: true, data: certs[0] });
  });

  app.get('/api/insurance/certificates', auth.requireAuth, (req, res) => {
    const certificates = db.query(`
      SELECT * FROM electronic_certificates
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [req.session.userId]);
    res.json({ ok: true, data: certificates });
  });

  app.get('/api/insurance/types', auth.requireAuth, (req, res) => {
    const types = db.query('SELECT * FROM insurance_types ORDER BY id ASC');
    res.json({ ok: true, data: types });
  });

  app.post('/api/insurance/base-declaration', auth.requireAuth, auth.requirePermission('enterprise.base.declare'), async (req, res) => {
    const body = await req.body;
    const { declaration_year, declaration_month, employees, total_payment_base } = body;
    
    if (!declaration_year || !declaration_month || !employees || employees.length === 0) {
      return res.json({ ok: false, message: '缺少必要参数' });
    }
    
    const enterprises = db.query('SELECT * FROM enterprises WHERE user_id = ? LIMIT 1', [req.session.userId]);
    if (enterprises.length === 0) {
      return res.json({ ok: false, message: '企业信息不存在' });
    }
    const enterprise = enterprises[0];
    
    db.execute(`
      INSERT INTO base_declarations (enterprise_id, declaration_year, declaration_month, total_employees, total_payment_base, applicant_id, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `, [enterprise.id, declaration_year, declaration_month, employees.length, total_payment_base, req.session.userId]);
    
    const declarationId = db.getLastInsertId();
    
    for (const emp of employees) {
      db.execute(`
        INSERT INTO base_declaration_details (declaration_id, user_id, insurance_type_id, payment_base, personal_payment, unit_payment)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [declarationId, emp.user_id, emp.insurance_type_id, emp.payment_base, emp.personal_payment, emp.unit_payment]);
    }
    
    db.execute(`
      INSERT INTO notifications (user_id, type, title, content, related_module, related_id)
      VALUES (?, 'business', ?, ?, 'insurance', ?)
    `, [req.session.userId, '基数申报已提交', `您的${declaration_year}年${declaration_month}月缴费基数申报已提交，正在等待审核。`, declarationId]);
    
    res.json({ ok: true, data: { id: declarationId } });
  });

  app.get('/api/insurance/base-declarations', auth.requireAuth, auth.requirePermission('enterprise.base.declare'), (req, res) => {
    const enterprises = db.query('SELECT * FROM enterprises WHERE user_id = ? LIMIT 1', [req.session.userId]);
    if (enterprises.length === 0) {
      return res.json({ ok: true, data: [] });
    }
    
    const declarations = db.query(`
      SELECT bd.*, e.enterprise_name
      FROM base_declarations bd
      INNER JOIN enterprises e ON bd.enterprise_id = e.id
      WHERE bd.enterprise_id = ?
      ORDER BY bd.created_at DESC
      LIMIT 10
    `, [enterprises[0].id]);
    
    res.json({ ok: true, data: declarations });
  });

  app.get('/api/insurance/overview', auth.requireAuth, (req, res) => {
    const accounts = db.query(`
      SELECT ia.*, it.name as insurance_type_name, it.code as insurance_type_code
      FROM social_insurance_accounts ia
      INNER JOIN insurance_types it ON ia.insurance_type_id = it.id
      WHERE ia.user_id = ?
      ORDER BY it.id ASC
    `, [req.session.userId]);
    
    const totalPersonalBalance = accounts.reduce((sum, a) => sum + (a.personal_balance || 0), 0);
    const totalUnitBalance = accounts.reduce((sum, a) => sum + (a.unit_balance || 0), 0);
    const totalMonths = accounts.reduce((sum, a) => sum + (a.accumulated_months || 0), 0);
    
    const recentPayments = db.query(`
      SELECT pr.*, it.name as insurance_type_name
      FROM payment_records pr
      INNER JOIN social_insurance_accounts ia ON pr.insurance_account_id = ia.id
      INNER JOIN insurance_types it ON ia.insurance_type_id = it.id
      WHERE pr.user_id = ?
      ORDER BY pr.payment_year DESC, pr.payment_month DESC
      LIMIT 6
    `, [req.session.userId]);
    
    const certifications = db.query(`
      SELECT bc.*, it.name as insurance_type_name
      FROM benefit_certifications bc
      INNER JOIN insurance_types it ON bc.insurance_type_id = it.id
      WHERE bc.user_id = ?
      ORDER BY bc.certification_date DESC
      LIMIT 3
    `, [req.session.userId]);
    
    const pendingApplications = db.query(`
      SELECT 'registration' as type, ir.id, ir.status, ir.created_at, it.name as type_name
      FROM insurance_registrations ir
      INNER JOIN insurance_types it ON ir.insurance_type_id = it.id
      WHERE ir.user_id = ? AND ir.status IN ('pending', 'reviewing')
      UNION ALL
      SELECT 'transfer' as type, it.id, it.status, it.created_at, itype.name as type_name
      FROM insurance_transfers it
      INNER JOIN insurance_types itype ON it.insurance_type_id = itype.id
      WHERE it.user_id = ? AND it.status IN ('pending', 'reviewing', 'in_progress')
      ORDER BY created_at DESC
    `, [req.session.userId, req.session.userId]);
    
    res.json({
      ok: true,
      data: {
        accounts,
        summary: {
          totalPersonalBalance,
          totalUnitBalance,
          totalMonths,
          accountCount: accounts.length
        },
        recentPayments,
        certifications,
        pendingApplications
      }
    });
  });
}

module.exports = { registerInsuranceRoutes, escapeStr };
