import express, { type Request, type Response } from 'express';
import { db } from '../db/init.js';

const router = express.Router();

const generateApplicationNo = () => {
  const date = new Date();
  const prefix = `UW${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const count = db.prepare('SELECT COUNT(*) as count FROM applications WHERE application_no LIKE ?').get(`${prefix}%`) as any;
  return `${prefix}${String(count.count + 1).padStart(4, '0')}`;
};

router.get('/', (req: Request, res: Response) => {
  try {
    const { status, assigned_to, page = 1, limit = 20 } = req.query;
    
    let query = `
      SELECT a.*, u.name as assigned_name
      FROM applications a
      LEFT JOIN users u ON a.assigned_to = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }
    if (assigned_to) {
      query += ' AND a.assigned_to = ?';
      params.push(assigned_to);
    }

    query += ' ORDER BY a.submitted_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const applications = db.prepare(query).all(...params);

    const countQuery = 'SELECT COUNT(*) as total FROM applications WHERE 1=1' + 
      (status ? ' AND status = ?' : '') + 
      (assigned_to ? ' AND assigned_to = ?' : '');
    const countParams = [];
    if (status) countParams.push(status);
    if (assigned_to) countParams.push(assigned_to);
    const countResult = db.prepare(countQuery).get(...countParams) as any;

    res.json({
      success: true,
      data: applications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: countResult.total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as any;
    if (!application) {
      return res.status(404).json({ success: false, error: '投保单不存在' });
    }

    const healthDeclarations = db.prepare('SELECT * FROM health_declarations WHERE application_id = ?').all(id);
    const medicalHistories = db.prepare('SELECT * FROM medical_histories WHERE application_id = ?').all(id);
    const ruleHits = db.prepare(`
      SELECT rh.*, ur.rule_name, ur.rule_type
      FROM rule_hits rh
      JOIN underwriting_rules ur ON rh.rule_id = ur.id
      WHERE rh.application_id = ?
    `).all(id);
    const supplementaryDocs = db.prepare(`
      SELECT sd.*, u.name as uploaded_name
      FROM supplementary_docs sd
      LEFT JOIN users u ON sd.uploaded_by = u.id
      WHERE sd.application_id = ?
    `).all(id);
    const supplementRequests = db.prepare(`
      SELECT sr.*, u.name as requested_name
      FROM supplement_requests sr
      LEFT JOIN users u ON sr.requested_by = u.id
      WHERE sr.application_id = ?
    `).all(id);
    const decision = db.prepare(`
      SELECT ud.*, u.name as decision_maker_name
      FROM underwriting_decisions ud
      LEFT JOIN users u ON ud.decision_made_by = u.id
      WHERE ud.application_id = ?
    `).get(id);
    const auditLogs = db.prepare(`
      SELECT al.*, u.name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.application_id = ?
      ORDER BY al.created_at DESC
    `).all(id);

    const missingFields = [];
    if (!application.customer_phone) missingFields.push('客户手机号');
    if (!application.customer_email) missingFields.push('客户邮箱');
    if (!application.occupation) missingFields.push('职业信息');
    if (!application.premium) missingFields.push('保费金额');

    res.json({
      success: true,
      data: {
        ...application,
        healthDeclarations,
        medicalHistories,
        ruleHits,
        supplementaryDocs,
        supplementRequests,
        decision,
        auditLogs,
        missingFields
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const {
      customer_name, customer_id_card, customer_gender, customer_birth_date,
      customer_phone, customer_email, customer_address, occupation, occupation_code,
      occupation_risk_level, product_name, product_code, coverage_amount, premium,
      policy_term, payment_term, beneficiary_name, beneficiary_relationship, beneficiary_id_card,
      healthDeclarations, medicalHistories
    } = req.body;

    const application_no = generateApplicationNo();

    const insertApp = db.prepare(`
      INSERT INTO applications (
        application_no, customer_name, customer_id_card, customer_gender, customer_birth_date,
        customer_phone, customer_email, customer_address, occupation, occupation_code,
        occupation_risk_level, product_name, product_code, coverage_amount, premium,
        policy_term, payment_term, beneficiary_name, beneficiary_relationship, beneficiary_id_card,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `);

    const result = insertApp.run(
      application_no, customer_name, customer_id_card, customer_gender, customer_birth_date,
      customer_phone, customer_email, customer_address, occupation, occupation_code,
      occupation_risk_level || 1, product_name, product_code, coverage_amount, premium,
      policy_term, payment_term, beneficiary_name, beneficiary_relationship, beneficiary_id_card
    );

    const applicationId = result.lastInsertRowid;

    if (healthDeclarations && healthDeclarations.length > 0) {
      const insertHD = db.prepare(`
        INSERT INTO health_declarations (application_id, question_code, question_text, answer, answer_details, has_condition)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const hd of healthDeclarations) {
        insertHD.run(applicationId, hd.question_code, hd.question_text, hd.answer, hd.answer_details, hd.has_condition ? 1 : 0);
      }
    }

    if (medicalHistories && medicalHistories.length > 0) {
      const insertMH = db.prepare(`
        INSERT INTO medical_histories (application_id, condition_type, condition_name, diagnosis_date, hospital_name, treatment_details, is_recovered, recovery_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const mh of medicalHistories) {
        insertMH.run(applicationId, mh.condition_type, mh.condition_name, mh.diagnosis_date, mh.hospital_name, mh.treatment_details, mh.is_recovered ? 1 : 0, mh.recovery_date);
      }
    }

    db.prepare('INSERT INTO audit_logs (application_id, user_id, action, action_details) VALUES (?, ?, ?, ?)')
      .run(applicationId, 1, 'create_application', JSON.stringify({ application_no }));

    res.json({
      success: true,
      data: { id: applicationId, application_no }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.put('/:id/assign', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;

    db.prepare('UPDATE applications SET assigned_to = ?, assigned_at = CURRENT_TIMESTAMP, status = ? WHERE id = ?')
      .run(assigned_to, 'underwriting', id);

    db.prepare('INSERT INTO audit_logs (application_id, user_id, action, action_details) VALUES (?, ?, ?, ?)')
      .run(id, 1, 'assign_application', JSON.stringify({ assigned_to }));

    res.json({ success: true, message: '分配成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/statistics/summary', (req: Request, res: Response) => {
  try {
    const result = db.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM applications
      GROUP BY status
    `).all() as any[];

    const statusMap: Record<string, number> = {
      pending: 0,
      underwriting: 0,
      supplementary: 0,
      approved: 0,
      rated: 0,
      excluded: 0,
      postponed: 0,
      rejected: 0
    };

    result.forEach(r => {
      statusMap[r.status] = r.count;
    });

    res.json({
      success: true,
      data: statusMap
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
