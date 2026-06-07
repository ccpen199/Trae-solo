import { Router } from 'express';
import { getDB } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const { status, applicant_id, item_id, department_id, keyword, start_date, end_date, page = 1, pageSize = 20 } = req.query;
    const db = getDB();
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('c.status = ?');
      params.push(status);
    }
    if (applicant_id) {
      conditions.push('c.applicant_id = ?');
      params.push(applicant_id);
    }
    if (item_id) {
      conditions.push('c.item_id = ?');
      params.push(item_id);
    }
    if (department_id) {
      conditions.push('si.department_id = ?');
      params.push(department_id);
    }
    if (keyword) {
      conditions.push('(c.case_no LIKE ? OR c.applicant_name LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (start_date) {
      conditions.push("date(c.created_at) >= date(?)");
      params.push(start_date);
    }
    if (end_date) {
      conditions.push("date(c.created_at) <= date(?)");
      params.push(end_date);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const total = db.prepare(`
      SELECT COUNT(*) as cnt FROM cases c
      LEFT JOIN service_items si ON c.item_id = si.id
      ${where}
    `).get(...params).cnt;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const list = db.prepare(`
      SELECT c.*, si.name as item_name, si.code as item_code, d.name as department_name
      FROM cases c
      LEFT JOIN service_items si ON c.item_id = si.id
      LEFT JOIN departments d ON si.department_id = d.id
      ${where}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize), offset);

    res.json({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { item_id, applicant_name, applicant_phone, urgency, submit_data, materials } = req.body;
    const applicant_id = req.user.id;
    const db = getDB();

    const item = db.prepare('SELECT * FROM service_items WHERE id = ?').get(item_id);
    if (!item) {
      return res.status(404).json({ error: '服务事项不存在' });
    }

    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    const todayCount = db.prepare(`
      SELECT COUNT(*) as cnt FROM cases WHERE case_no LIKE ?
    `).get(`YN${dateStr}%`).cnt;
    const caseNo = 'YN' + dateStr + String(todayCount + 1).padStart(6, '0');

    const processConfig = item.process_config ? JSON.parse(item.process_config) : [];
    const currentStep = processConfig.length > 0 ? processConfig[0].step : null;

    const insertCase = db.prepare(`
      INSERT INTO cases (case_no, item_id, applicant_id, applicant_name, applicant_phone, status, current_step, urgency, submit_data)
      VALUES (?, ?, ?, ?, ?, 'submitted', ?, ?, ?)
    `);

    const insertStep = db.prepare(`
      INSERT INTO case_steps (case_id, step_name, step_order, status)
      VALUES (?, ?, ?, 'pending')
    `);

    const insertCaseMat = db.prepare(`
      INSERT INTO case_materials (case_id, material_id, material_name, file_path, file_name)
      VALUES (?, ?, ?, ?, ?)
    `);

    const caseResult = insertCase.run(
      caseNo, item_id, applicant_id, applicant_name || req.user.username,
      applicant_phone, currentStep, urgency || 'normal',
      submit_data ? JSON.stringify(submit_data) : null
    );

    const caseId = caseResult.lastInsertRowid;

    for (let i = 0; i < processConfig.length; i++) {
      insertStep.run(caseId, processConfig[i].step, i + 1);
    }

    if (materials && Array.isArray(materials)) {
      for (const mat of materials) {
        insertCaseMat.run(caseId, mat.material_id, mat.material_name, mat.file_path || null, mat.file_name || null);
      }
    }

    db.prepare(`
      INSERT INTO notifications (user_id, title, content, type, link)
      VALUES (?, ?, ?, 'case', ?)
    `).run(applicant_id, '事项提交成功', `您提交的${item.name}申请已成功，办件编号：${caseNo}`, `/cases/${caseId}`);

    res.status(201).json({ id: caseId, case_no: caseNo, message: '提交成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = getDB();
    const caseData = db.prepare(`
      SELECT c.*, si.name as item_name, si.code as item_code, si.time_limit, si.time_unit, d.name as department_name
      FROM cases c
      LEFT JOIN service_items si ON c.item_id = si.id
      LEFT JOIN departments d ON si.department_id = d.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!caseData) {
      return res.status(404).json({ error: '办件不存在' });
    }

    const steps = db.prepare(`
      SELECT cs.* FROM case_steps cs WHERE cs.case_id = ? ORDER BY cs.step_order
    `).all(req.params.id);

    const caseMaterials = db.prepare('SELECT * FROM case_materials WHERE case_id = ?').all(req.params.id);

    const applicant = db.prepare('SELECT id, username, real_name, phone, id_number FROM users WHERE id = ?').get(caseData.applicant_id);

    if (caseData.submit_data) {
      caseData.submit_data = JSON.parse(caseData.submit_data);
    }

    res.json({ ...caseData, steps, materials: caseMaterials, applicant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/accept', (req, res) => {
  try {
    const db = getDB();
    const caseData = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
    if (!caseData) {
      return res.status(404).json({ error: '办件不存在' });
    }
    if (caseData.status !== 'submitted') {
      return res.status(400).json({ error: '当前状态不可受理' });
    }

    const item = db.prepare('SELECT * FROM service_items WHERE id = ?').get(caseData.item_id);

    db.prepare(`
      UPDATE cases SET status = 'accepted', accept_at = datetime('now','localtime'),
        current_step = '审核', updated_at = datetime('now','localtime') WHERE id = ?
    `).run(req.params.id);

    const step = db.prepare(`
      SELECT * FROM case_steps WHERE case_id = ? AND step_name = '受理'
    `).get(req.params.id);
    if (step) {
      db.prepare(`
        UPDATE case_steps SET status = 'completed', handler_id = ?, handler_name = ?,
          started_at = datetime('now','localtime'), completed_at = datetime('now','localtime')
        WHERE id = ?
      `).run(req.user.id, req.user.username, step.id);
    }

    const nextStep = db.prepare(`
      SELECT * FROM case_steps WHERE case_id = ? AND step_name = '审核'
    `).get(req.params.id);
    if (nextStep) {
      db.prepare(`
        UPDATE case_steps SET status = 'processing', started_at = datetime('now','localtime') WHERE id = ?
      `).run(nextStep.id);
    }

    db.prepare(`
      INSERT INTO notifications (user_id, title, content, type, link)
      VALUES (?, ?, ?, 'case', ?)
    `).run(caseData.applicant_id, '案件已受理', `您的办件${caseData.case_no}已受理，正在审核中。`, `/cases/${caseData.id}`);

    res.json({ message: '受理成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/review', (req, res) => {
  try {
    const { step_id, action, opinion } = req.body;
    const db = getDB();
    const caseData = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
    if (!caseData) {
      return res.status(404).json({ error: '办件不存在' });
    }

    const step = db.prepare('SELECT * FROM case_steps WHERE id = ? AND case_id = ?').get(step_id, req.params.id);
    if (!step) {
      return res.status(404).json({ error: '步骤不存在' });
    }

    if (action === 'approve') {
      db.prepare(`
        UPDATE case_steps SET status = 'completed', handler_id = ?, handler_name = ?,
          opinion = ?, completed_at = datetime('now','localtime') WHERE id = ?
      `).run(req.user.id, req.user.username, opinion || null, step_id);

      const nextStep = db.prepare(`
        SELECT * FROM case_steps WHERE case_id = ? AND step_order > ? ORDER BY step_order LIMIT 1
      `).get(req.params.id, step.step_order);

      if (nextStep) {
        db.prepare(`
          UPDATE case_steps SET status = 'processing', started_at = datetime('now','localtime') WHERE id = ?
        `).run(nextStep.id);
        db.prepare(`
          UPDATE cases SET current_step = ?, status = 'reviewing', updated_at = datetime('now','localtime') WHERE id = ?
        `).run(nextStep.step_name, req.params.id);
      } else {
        db.prepare(`
          UPDATE cases SET status = 'approved', current_step = '办结', updated_at = datetime('now','localtime') WHERE id = ?
        `).run(req.params.id);

        db.prepare(`
          INSERT INTO notifications (user_id, title, content, type, link)
          VALUES (?, ?, ?, 'approval', ?)
        `).run(caseData.applicant_id, '审批通过', `您的办件${caseData.case_no}已审批通过。`, `/cases/${caseData.id}`);
      }
    } else if (action === 'reject') {
      db.prepare(`
        UPDATE case_steps SET status = 'rejected', handler_id = ?, handler_name = ?,
          opinion = ?, completed_at = datetime('now','localtime') WHERE id = ?
      `).run(req.user.id, req.user.username, opinion || null, step_id);

      db.prepare(`
        UPDATE cases SET status = 'rejected', updated_at = datetime('now','localtime') WHERE id = ?
      `).run(req.params.id);

      db.prepare(`
        INSERT INTO notifications (user_id, title, content, type, link)
        VALUES (?, ?, ?, 'approval', ?)
      `).run(caseData.applicant_id, '审批不通过', `您的办件${caseData.case_no}审批未通过${opinion ? '，原因：' + opinion : ''}。`, `/cases/${caseData.id}`);
    }

    res.json({ message: '审核操作成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/supplement', (req, res) => {
  try {
    const { reason } = req.body;
    const db = getDB();
    const caseData = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
    if (!caseData) {
      return res.status(404).json({ error: '办件不存在' });
    }

    db.prepare(`
      UPDATE cases SET status = 'supplementing', updated_at = datetime('now','localtime') WHERE id = ?
    `).run(req.params.id);

    db.prepare(`
      INSERT INTO notifications (user_id, title, content, type, link)
      VALUES (?, ?, ?, 'case', ?)
    `).run(caseData.applicant_id, '需要补充材料', `您的办件${caseData.case_no}需要补充材料${reason ? '，原因：' + reason : ''}。`, `/cases/${caseData.id}`);

    res.json({ message: '已通知申请人补充材料' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/complete', (req, res) => {
  try {
    const { result_content, result_file } = req.body;
    const db = getDB();
    const caseData = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
    if (!caseData) {
      return res.status(404).json({ error: '办件不存在' });
    }
    if (caseData.status !== 'approved') {
      return res.status(400).json({ error: '当前状态不可办结' });
    }

    db.prepare(`
      UPDATE cases SET status = 'completed', complete_at = datetime('now','localtime'),
        result_content = ?, result_file = ?, updated_at = datetime('now','localtime') WHERE id = ?
    `).run(result_content || null, result_file || null, req.params.id);

    const lastStep = db.prepare(`
      SELECT * FROM case_steps WHERE case_id = ? ORDER BY step_order DESC LIMIT 1
    `).get(req.params.id);
    if (lastStep && lastStep.status !== 'completed') {
      db.prepare(`
        UPDATE case_steps SET status = 'completed', handler_id = ?, handler_name = ?,
          completed_at = datetime('now','localtime') WHERE id = ?
      `).run(req.user.id, req.user.username, lastStep.id);
    }

    db.prepare(`
      INSERT INTO notifications (user_id, title, content, type, link)
      VALUES (?, ?, ?, 'case', ?)
    `).run(caseData.applicant_id, '办件已办结', `您的办件${caseData.case_no}已办结。`, `/cases/${caseData.id}`);

    res.json({ message: '办结成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/archive', (req, res) => {
  try {
    const db = getDB();
    const caseData = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
    if (!caseData) {
      return res.status(404).json({ error: '办件不存在' });
    }
    if (caseData.status !== 'completed') {
      return res.status(400).json({ error: '只有已办结的案件可归档' });
    }

    db.prepare(`
      UPDATE cases SET status = 'archived', archive_at = datetime('now','localtime'), updated_at = datetime('now','localtime') WHERE id = ?
    `).run(req.params.id);

    res.json({ message: '归档成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/withdraw', (req, res) => {
  try {
    const db = getDB();
    const caseData = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
    if (!caseData) {
      return res.status(404).json({ error: '办件不存在' });
    }
    if (caseData.applicant_id !== req.user.id) {
      return res.status(403).json({ error: '只有申请人可以撤回' });
    }
    if (!['submitted', 'accepted'].includes(caseData.status)) {
      return res.status(400).json({ error: '当前状态不可撤回' });
    }

    db.prepare(`
      UPDATE cases SET status = 'withdrawn', updated_at = datetime('now','localtime') WHERE id = ?
    `).run(req.params.id);

    res.json({ message: '撤回成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
