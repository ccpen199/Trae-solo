const { getDb } = require('../models/database');

function seed() {
  const db = getDb();

  const adminCerts = db.prepare("SELECT COUNT(*) as c FROM certificates WHERE user_id = 1").get().c;
  if (adminCerts === 0) {
    const certs = [
      { userId: 1, type: '身份证', number: '110101199001011234', name: '居民身份证', issuer: '北京市公安局' },
      { userId: 1, type: '社保卡', number: 'B11010120240001', name: '社会保障卡', issuer: '北京市人力资源和社会保障局' },
      { userId: 1, type: '医保卡', number: 'Y11010120240001', name: '医疗保险卡', issuer: '北京市医疗保障局' },
      { userId: 1, type: '驾驶证', number: 'D11010120240001', name: '机动车驾驶证', issuer: '北京市公安局交通管理局' },
    ];
    const insertCert = db.prepare(`
      INSERT INTO certificates (user_id, cert_type, cert_number, cert_name, issuer, issue_date, expire_date, qr_code, verify_code, status)
      VALUES (?, ?, ?, ?, ?, DATE('now'), DATE('now', '+10 years'), ?, ?, 'active')
    `);
    certs.forEach(c => {
      const qr = `QR-${c.number}-${Date.now()}`;
      const vc = Math.random().toString(36).substring(2, 10).toUpperCase();
      insertCert.run(c.userId, c.type, c.number, c.name, c.issuer, qr, vc);
    });
  }

  const legalCount = db.prepare("SELECT COUNT(*) as c FROM legal_entities WHERE user_id = 3").get().c;
  if (legalCount === 0) {
    db.prepare(`
      INSERT INTO legal_entities (user_id, company_name, credit_code, legal_representative, status)
      VALUES (3, '北京华信科技有限公司', '91110000MA00DEMO01', '李四', 'active')
    `).run();
  }

  const authCount = db.prepare("SELECT COUNT(*) as c FROM authorization_chains").get().c;
  if (authCount === 0) {
    db.prepare(`
      INSERT INTO authorization_chains (legal_id, authorizer_id, authorized_id, permissions, valid_from, valid_to, status)
      VALUES (1, 3, 1, '["社保办理","税务申报","公积金提取"]', DATE('now'), DATE('now', '+1 year'), 'active')
    `).run();
    db.prepare(`
      INSERT INTO authorization_chains (legal_id, authorizer_id, authorized_id, permissions, valid_from, valid_to, status)
      VALUES (1, 3, 2, '["社保办理","医保报销"]', DATE('now'), DATE('now', '+6 months'), 'active')
    `).run();
  }

  const appCount = db.prepare("SELECT COUNT(*) as c FROM applications").get().c;
  if (appCount === 0) {
    const getServiceId = db.prepare('SELECT id FROM service_items WHERE name = ? LIMIT 1');
    const apps = [
      { userId: 1, serviceName: '身份证办理', no: 'BZ20240601001', status: 'completed', rating: 5, feedback: '办理很方便，服务态度好', daysAgo: 30, step: 4 },
      { userId: 1, serviceName: '社保查询', no: 'BZ20240601002', status: 'completed', rating: 4, feedback: '查询速度快', daysAgo: 20, step: 4 },
      { userId: 1, serviceName: '医保报销', no: 'BZ20240601003', status: 'processing', rating: null, feedback: null, daysAgo: 5, step: 3 },
      { userId: 1, serviceName: '个人所得税申报', no: 'BZ20240601004', status: 'submitted', rating: null, feedback: null, daysAgo: 2, step: 2 },
      { userId: 1, serviceName: '公积金提取', no: 'BZ20240601005', status: 'rejected', rating: 2, feedback: '材料要求不明确，反复补交', daysAgo: 15, step: 2 },
      { userId: 2, serviceName: '身份证办理', no: 'BZ20240601006', status: 'completed', rating: 1, feedback: '办理时间太长，等了一个月', daysAgo: 40, step: 4 },
      { userId: 2, serviceName: '社保查询', no: 'BZ20240601007', status: 'submitted', rating: null, feedback: null, daysAgo: 12, step: 1 },
      { userId: 2, serviceName: '学历认证', no: 'BZ20240601008', status: 'submitted', rating: null, feedback: null, daysAgo: 10, step: 1 },
      { userId: 3, serviceName: '发票申领', no: 'BZ20240601009', status: 'completed', rating: 3, feedback: '流程可以更简化', daysAgo: 25, step: 4 },
      { userId: 3, serviceName: '公积金提取', no: 'BZ20240601010', status: 'processing', rating: null, feedback: null, daysAgo: 8, step: 3 },
    ];

    const insertApp = db.prepare(`
      INSERT INTO applications (user_id, service_id, service_name, application_no, form_data, materials, status, current_step, rating, feedback, submit_time, created_at, updated_at)
      VALUES (?, ?, ?, ?, '{}', '[]', ?, ?, ?, ?, datetime('now', '-' || ? || ' days'), datetime('now', '-' || ? || ' days'), datetime('now', '-' || ? || ' days'))
    `);

    const insertStep = db.prepare(`
      INSERT INTO application_steps (application_id, step_no, step_name, status, handle_time, remark)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const stepNames = ['提交申请', '材料审核', '业务办理', '办结归档'];

    apps.forEach(app => {
      const service = getServiceId.get(app.serviceName);
      if (!service) {
        throw new Error(`缺少政务服务事项: ${app.serviceName}`);
      }

      const result = insertApp.run(
        app.userId, service.id, app.serviceName, app.no,
        app.status, app.step, app.rating, app.feedback,
        app.daysAgo, app.daysAgo, app.daysAgo
      );
      const appId = result.lastInsertRowid;

      stepNames.forEach((name, idx) => {
        const stepNo = idx + 1;
        let stepStatus = 'pending';
        let handleTime = null;
        let remark = '';
        if (stepNo < app.step) {
          stepStatus = 'completed';
          handleTime = `datetime('now', '-' || ${app.daysAgo - stepNo} || ' days')`;
          remark = stepNo === 1 ? '已提交' : stepNo === 2 ? '审核通过' : '办理完成';
        } else if (stepNo === app.step && (app.status === 'completed' || app.status === 'processing' || app.status === 'rejected')) {
          stepStatus = app.status === 'completed' ? 'completed' : app.status === 'rejected' ? 'completed' : 'processing';
          handleTime = app.status !== 'processing' ? `datetime('now', '-' || ${Math.max(app.daysAgo - stepNo, 0)} || ' days')` : null;
          remark = app.status === 'rejected' ? '材料不齐全，已驳回' : app.status === 'completed' ? '已办结' : '正在办理中';
        }
        db.prepare(`
          INSERT INTO application_steps (application_id, step_no, step_name, status, handle_time, remark)
          VALUES (?, ?, ?, ?, ${handleTime || 'NULL'}, ?)
        `).run(appId, stepNo, name, stepStatus, remark);
      });
    });
  }

  const verifyLogCount = db.prepare("SELECT COUNT(*) as c FROM cert_verify_logs").get().c;
  if (verifyLogCount === 0) {
    const logs = [
      { certId: 1, verifierId: 2, result: 'success' },
      { certId: 2, verifierId: 1, result: 'success' },
      { certId: 3, verifierId: 3, result: 'failed' },
    ];
    const insertLog = db.prepare(`
      INSERT INTO cert_verify_logs (cert_id, verifier_id, verify_result, client_info)
      VALUES (?, ?, ?, ?)
    `);
    logs.forEach(l => insertLog.run(l.certId, l.verifierId, l.result, 'demo-client'));
  }

  console.log('Demo data seeded successfully');
}

module.exports = { seed };
