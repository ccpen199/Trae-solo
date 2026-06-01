import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (req, res) => {
  const applications = db.prepare(`
    SELECT aa.*, dc.title as catalog_title, d.name as applicant_department_name
    FROM access_applications aa
    LEFT JOIN data_catalogs dc ON aa.catalog_id = dc.id
    LEFT JOIN departments d ON aa.applicant_department_id = d.id
    ORDER BY aa.created_at DESC
  `).all();
  res.json(applications);
});

router.get('/:id', (req, res) => {
  const application = db.prepare(`
    SELECT aa.*, dc.title as catalog_title, d.name as applicant_department_name
    FROM access_applications aa
    LEFT JOIN data_catalogs dc ON aa.catalog_id = dc.id
    LEFT JOIN departments d ON aa.applicant_department_id = d.id
    WHERE aa.id = ?
  `).get(req.params.id);
  
  if (!application) {
    return res.status(404).json({ error: '申请不存在' });
  }
  
  res.json(application);
});

router.post('/', (req, res) => {
  const { catalog_id, applicant_department_id, use_case, field_scope, start_date, end_date } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO access_applications (catalog_id, applicant_department_id, use_case, field_scope, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(catalog_id, applicant_department_id, use_case, JSON.stringify(field_scope), start_date, end_date);
    
    db.prepare(`
      INSERT INTO audit_logs (action, department_id, target_type, target_id, details)
      VALUES ('create_application', ?, 'application', ?, ?)
    `).run(applicant_department_id, result.lastInsertRowid, `申请访问数据目录 ID: ${catalog_id}`);
    
    res.json({ id: result.lastInsertRowid, message: '申请提交成功' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/approve', (req, res) => {
  const { id } = req.params;
  const { approval_opinion, approver_id } = req.body;
  
  const application = db.prepare('SELECT * FROM access_applications WHERE id = ?').get(id);
  if (!application) {
    return res.status(404).json({ error: '申请不存在' });
  }
  
  try {
    db.prepare(`
      UPDATE access_applications
      SET status = 'approved', approval_opinion = ?, approver_id = ?, approved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(approval_opinion, approver_id, id);
    
    db.prepare(`
      INSERT INTO audit_logs (action, target_type, target_id, details)
      VALUES ('approve_application', 'application', ?, ?)
    `).run(id, approval_opinion || '审批通过');
    
    res.json({ message: '审批通过' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/reject', (req, res) => {
  const { id } = req.params;
  const { approval_opinion, approver_id } = req.body;
  
  const application = db.prepare('SELECT * FROM access_applications WHERE id = ?').get(id);
  if (!application) {
    return res.status(404).json({ error: '申请不存在' });
  }
  
  try {
    db.prepare(`
      UPDATE access_applications
      SET status = 'rejected', approval_opinion = ?, approver_id = ?, approved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(approval_opinion, approver_id, id);
    
    db.prepare(`
      INSERT INTO audit_logs (action, target_type, target_id, details)
      VALUES ('reject_application', 'application', ?, ?)
    `).run(id, approval_opinion || '审批拒绝');
    
    res.json({ message: '已拒绝' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
