const db = require('../database');
const auth = require('../auth');

function escapeStr(str) {
  return String(str || '').replace(/'/g, "''");
}

function registerExamRoutes(app) {
  app.get('/api/exams', auth.requireAuth, (req, res) => {
    const { exam_type, status, page = 1, page_size = 10 } = req.query;
    const offset = (page - 1) * page_size;
    
    let sql = 'SELECT * FROM exams WHERE 1=1';
    const params = [];
    
    if (exam_type) {
      sql += ' AND exam_type = ?';
      params.push(exam_type);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY exam_date DESC LIMIT ? OFFSET ?';
    params.push(Number(page_size), Number(offset));
    
    const exams = db.query(sql, params);
    
    const enriched = exams.map(exam => {
      const registered = db.query('SELECT id, status FROM exam_registrations WHERE exam_id = ? AND user_id = ?', [exam.id, req.session.userId]);
      const announcements = db.query('SELECT id, title, announcement_type, publish_date FROM exam_announcements WHERE exam_id = ? ORDER BY publish_date DESC LIMIT 3', [exam.id]);
      return { ...exam, is_registered: registered.length > 0, registration: registered[0] || null, recent_announcements: announcements };
    });
    
    res.json({ ok: true, data: enriched });
  });

  app.get('/api/exams/:id', auth.requireAuth, (req, res) => {
    const examId = Number(req.params.id);
    const exams = db.query('SELECT * FROM exams WHERE id = ?', [examId]);
    
    if (exams.length === 0) {
      return res.json({ ok: false, message: '考试不存在' });
    }
    
    const exam = exams[0];
    const registered = db.query('SELECT * FROM exam_registrations WHERE exam_id = ? AND user_id = ?', [examId, req.session.userId]);
    const announcements = db.query('SELECT * FROM exam_announcements WHERE exam_id = ? ORDER BY publish_date DESC', [examId]);
    
    res.json({ ok: true, data: { ...exam, is_registered: registered.length > 0, registration: registered[0] || null, announcements } });
  });

  app.get('/api/exam-announcements', auth.requireAuth, (req, res) => {
    const { exam_id, page = 1, page_size = 10 } = req.query;
    const offset = (page - 1) * page_size;
    
    let sql = `
      SELECT ea.*, e.exam_name, e.exam_code
      FROM exam_announcements ea
      INNER JOIN exams e ON ea.exam_id = e.id
      WHERE 1=1
    `;
    const params = [];
    
    if (exam_id) {
      sql += ' AND ea.exam_id = ?';
      params.push(Number(exam_id));
    }
    
    sql += ' ORDER BY ea.publish_date DESC LIMIT ? OFFSET ?';
    params.push(Number(page_size), Number(offset));
    
    const announcements = db.query(sql, params);
    res.json({ ok: true, data: announcements });
  });

  app.post('/api/exam-registrations', auth.requireAuth, auth.requirePermission('personal.exam.register'), async (req, res) => {
    const body = await req.body;
    const { exam_id, id_card, real_name, gender, birth_date, education, graduate_school, major, graduation_date, work_unit, work_years, contact_phone, contact_email, exam_city, exam_district, exam_center } = body;
    
    if (!exam_id || !id_card || !real_name || !contact_phone || !exam_city || !exam_district) {
      return res.json({ ok: false, message: '缺少必要参数' });
    }
    
    const exams = db.query('SELECT * FROM exams WHERE id = ? AND status IN (?)', [Number(exam_id), 'registration_open']);
    if (exams.length === 0) {
      return res.json({ ok: false, message: '考试不存在或未到报名时间' });
    }
    
    const existing = db.query('SELECT id FROM exam_registrations WHERE exam_id = ? AND user_id = ?', [Number(exam_id), req.session.userId]);
    if (existing.length > 0) {
      return res.json({ ok: false, message: '您已报名过此考试' });
    }
    
    try {
      db.execute(`
        INSERT INTO exam_registrations (exam_id, user_id, id_card, real_name, gender, birth_date, education, graduate_school, major, graduation_date, work_unit, work_years, contact_phone, contact_email, exam_city, exam_district, exam_center, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `, [Number(exam_id), req.session.userId, id_card, real_name, gender, birth_date, education, graduate_school, major, graduation_date, work_unit, Number(work_years || 0), contact_phone, contact_email, exam_city, exam_district, exam_center || null]);
      
      const registrationId = db.getLastInsertId();
      
      db.execute(`
        INSERT INTO notifications (user_id, type, title, content, related_module, related_id)
        VALUES (?, 'business', ?, ?, 'exam', ?)
      `, [req.session.userId, '考试报名成功', `您已成功报名"${exams[0].exam_name}"，请等待资格审核。`, registrationId]);
      
      res.json({ ok: true, data: { id: registrationId } });
    } catch (e) {
      res.json({ ok: false, message: '报名失败：' + e.message });
    }
  });

  app.get('/api/exam-registrations', auth.requireAuth, (req, res) => {
    const { status, page = 1, page_size = 10 } = req.query;
    const offset = (page - 1) * page_size;
    
    let sql = `
      SELECT er.*, e.exam_name, e.exam_date, e.exam_time
      FROM exam_registrations er
      INNER JOIN exams e ON er.exam_id = e.id
      WHERE er.user_id = ?
    `;
    const params = [req.session.userId];
    
    if (status) {
      sql += ' AND er.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY er.registration_date DESC LIMIT ? OFFSET ?';
    params.push(Number(page_size), Number(offset));
    
    const registrations = db.query(sql, params);
    
    const enriched = registrations.map(reg => {
      const ticket = db.query('SELECT * FROM admission_tickets WHERE exam_registration_id = ?', [reg.id]);
      const result = db.query('SELECT * FROM exam_results WHERE exam_registration_id = ?', [reg.id]);
      return { ...reg, admission_ticket: ticket[0] || null, exam_result: result[0] || null };
    });
    
    res.json({ ok: true, data: enriched });
  });

  app.post('/api/exam-registrations/:id/pay', auth.requireAuth, async (req, res) => {
    const registrationId = Number(req.params.id);
    
    const registrations = db.query('SELECT * FROM exam_registrations WHERE id = ? AND user_id = ?', [registrationId, req.session.userId]);
    if (registrations.length === 0) {
      return res.json({ ok: false, message: '报名记录不存在' });
    }
    
    db.execute(`
      UPDATE exam_registrations
      SET application_fee_paid = 1, exam_fee_paid = 1, status = 'approved', updated_at = datetime('now')
      WHERE id = ?
    `, [registrationId]);
    
    db.execute(`
      INSERT INTO notifications (user_id, type, title, content, related_module, related_id)
        SELECT user_id, 'business', ?, ?, 'exam', ? FROM exam_registrations WHERE id = ?
    `, ['缴费成功', `您的考试报名费用已缴纳，请按时参加考试。`, registrationId, registrationId]);
    
    res.json({ ok: true, message: '缴费成功' });
  });

  app.get('/api/admission-tickets/:id', auth.requireAuth, auth.requirePermission('personal.exam.ticket'), (req, res) => {
    const registrationId = Number(req.params.id);
    
    const registrations = db.query('SELECT * FROM exam_registrations WHERE id = ? AND user_id = ?', [registrationId, req.session.userId]);
    if (registrations.length === 0) {
      return res.json({ ok: false, message: '报名记录不存在' });
    }
    
    const reg = registrations[0];
    if (reg.status !== 'approved') {
      return res.json({ ok: false, message: '报名尚未审核通过，无法生成准考证' });
    }
    
    const existing = db.query('SELECT * FROM admission_tickets WHERE exam_registration_id = ?', [registrationId]);
    if (existing.length > 0) {
      db.execute(`UPDATE admission_tickets SET printed_count = printed_count + 1, last_printed_at = datetime('now') WHERE id = ?`, [existing[0].id]);
      return res.json({ ok: true, data: existing[0] });
    }
    
    const exams = db.query('SELECT * FROM exams WHERE id = ?', [reg.exam_id]);
    const exam = exams[0];
    
    const ticketNo = `ZKZ${reg.exam_id}${String(registrationId).padStart(8, '0')}`;
    const examRoom = `${Math.floor(Math.random() * 100) + 1}考场`;
    const seatNo = `${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')}号`;
    const examCenter = reg.exam_center || '北京市人事考试中心';
    const qrCodeData = JSON.stringify({ ticketNo, name: reg.real_name, idCard: reg.id_card });
    
    db.execute(`
      INSERT INTO admission_tickets (exam_registration_id, ticket_number, exam_room, seat_number, exam_center_address, qr_code_data)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [registrationId, ticketNo, examRoom, seatNo, examCenter, qrCodeData]);
    
    const ticketId = db.getLastInsertId();
    const tickets = db.query('SELECT * FROM admission_tickets WHERE id = ?', [ticketId]);
    
    res.json({ ok: true, data: tickets[0] });
  });

  app.get('/api/exam-results', auth.requireAuth, auth.requirePermission('personal.exam.result'), (req, res) => {
    const { page = 1, page_size = 10 } = req.query;
    const offset = (page - 1) * page_size;
    
    const results = db.query(`
      SELECT er.*, e.exam_name, e.exam_code, e.certificate_validity_period
      FROM exam_results er
      INNER JOIN exams e ON er.exam_id = e.id
      WHERE er.user_id = ?
      ORDER BY er.publish_date DESC
      LIMIT ? OFFSET ?
    `, [req.session.userId, Number(page_size), Number(offset)]);
    
    res.json({ ok: true, data: results });
  });

  app.get('/api/certificate-verify', async (req, res) => {
    const { certificate_no, id_card } = req.query;
    
    if (!certificate_no || !id_card) {
      return res.json({ ok: false, message: '请输入证书编号和身份证号' });
    }
    
    const certificates = db.query(`
      SELECT ec.*, u.real_name, u.id_card
      FROM electronic_certificates ec
      INNER JOIN users u ON ec.user_id = u.id
      WHERE ec.certificate_no = ? AND u.id_card = ?
    `, [certificate_no, id_card]);
    
    if (certificates.length === 0) {
      return res.json({ ok: false, message: '证书不存在或信息不匹配' });
    }
    
    const cert = certificates[0];
    
    db.execute(`
      INSERT INTO certificate_verifications (certificate_id, verifier_type, verifier_name, verifier_id_card, verification_result, verification_purpose)
        VALUES (?, 'personal', ?, ?, ?, 'online_verify')
    `, [cert.id, cert.real_name, id_card, cert.status === 'valid' ? 'valid' : cert.status]);
    
    res.json({ ok: true, data: cert });
  });

  app.get('/api/certificates', auth.requireAuth, auth.requirePermission('personal.certificate.verify'), (req, res) => {
    const { type } = req.query;
    
    let sql = `
      SELECT ec.*, er.total_score, er.is_pass, e.exam_name
      FROM electronic_certificates ec
      LEFT JOIN exam_results er ON ec.id = er.certificate_id
      LEFT JOIN exams e ON er.exam_id = e.id
      WHERE ec.user_id = ?
    `;
    const params = [req.session.userId];
    
    if (type) {
      sql += ' AND ec.certificate_type = ?';
      params.push(type);
    }
    
    sql += ' ORDER BY ec.created_at DESC';
    
    const certificates = db.query(sql, params);
    res.json({ ok: true, data: certificates });
  });

  app.get('/api/exam/overview', auth.requireAuth, (req, res) => {
    const upcomingExams = db.query(`
      SELECT e.*, er.status as registration_status
      FROM exams e
      LEFT JOIN exam_registrations er ON e.id = er.exam_id AND er.user_id = ?
      WHERE e.status IN ('registration_open', 'registration_not_started', 'exam_pending')
      ORDER BY e.exam_date ASC
      LIMIT 5
    `, [req.session.userId]);
    
    const myRegistrations = db.query(`
      SELECT er.*, e.exam_name, e.exam_date
      FROM exam_registrations er
      INNER JOIN exams e ON er.exam_id = e.id
      WHERE er.user_id = ?
      ORDER BY er.registration_date DESC
      LIMIT 5
    `, [req.session.userId]);
    
    const myResults = db.query(`
      SELECT er.*, e.exam_name
      FROM exam_results er
      INNER JOIN exams e ON er.exam_id = e.id
      WHERE er.user_id = ?
      ORDER BY er.publish_date DESC
      LIMIT 5
    `, [req.session.userId]);
    
    const recentAnnouncements = db.query(`
      SELECT ea.*, e.exam_name
      FROM exam_announcements ea
      INNER JOIN exams e ON ea.exam_id = e.id
      ORDER BY ea.publish_date DESC
      LIMIT 5
    `);
    
    res.json({ ok: true, data: {
      upcomingExams,
      myRegistrations,
      myResults,
      recentAnnouncements
    }});
  });
}

module.exports = { registerExamRoutes, escapeStr };
