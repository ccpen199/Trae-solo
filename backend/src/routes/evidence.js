const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const uploadPath = path.join(__dirname, '../../data/uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.get('/case/:caseId', authenticateToken, (req, res) => {
  const evidence = db.prepare(`
    SELECT e.*, g.group_name, u.name as creator_name
    FROM evidence e
    LEFT JOIN evidence_groups g ON e.group_id = g.id
    LEFT JOIN users u ON e.created_by = u.id
    WHERE e.case_id = ? AND e.is_active = 1
    ORDER BY g.group_order, e.sort_order
  `).all(req.params.caseId);

  res.json({ evidence });
});

router.get('/:evidenceId', authenticateToken, (req, res) => {
  const evidence = db.prepare(`
    SELECT e.*, g.group_name, u.name as creator_name
    FROM evidence e
    LEFT JOIN evidence_groups g ON e.group_id = g.id
    LEFT JOIN users u ON e.created_by = u.id
    WHERE e.id = ?
  `).get(req.params.evidenceId);

  if (!evidence) {
    return res.status(404).json({ error: '证据不存在' });
  }

  const history = db.prepare(`
    SELECT h.*, u.name as changed_by_name
    FROM evidence_history h
    LEFT JOIN users u ON h.changed_by = u.id
    WHERE h.evidence_id = ?
    ORDER BY h.version DESC
  `).all(req.params.evidenceId);

  res.json({ evidence, history });
});

router.post('/', authenticateToken, upload.single('file'), (req, res) => {
  if (req.user.role === 'client') {
    return res.status(403).json({ error: '客户无法上传证据' });
  }

  const { case_id, group_id, evidence_number, evidence_name, evidence_type, source, obtain_date, confidentiality_level, original_status, proof_purpose, dispute_focus, upload_batch } = req.body;

  const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM evidence WHERE case_id = ?').get(case_id);
  const sort_order = (maxOrder.max || 0) + 1;

  let file_name = null;
  let file_path = null;
  let file_size = null;
  let file_type = null;

  if (req.file) {
    file_name = req.file.originalname;
    file_path = req.file.filename;
    file_size = req.file.size;
    file_type = req.file.mimetype;
  }

  const result = db.prepare(`
    INSERT INTO evidence (
      case_id, group_id, evidence_number, evidence_name, evidence_type, source, obtain_date, confidentiality_level, original_status, proof_purpose, dispute_focus, upload_batch, file_name, file_path, file_size, file_type, sort_order, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    case_id, group_id, evidence_number, evidence_name, evidence_type, source, obtain_date, confidentiality_level, original_status, proof_purpose, dispute_focus, upload_batch, file_name, file_path, file_size, file_type, sort_order, req.user.id
  );

  db.prepare(`
    INSERT INTO evidence_history (evidence_id, version, evidence_number, evidence_name, sort_order, changed_by, change_reason)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(result.lastInsertRowid, 1, evidence_number, evidence_name, sort_order, req.user.id, '创建证据');

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, module, record_id, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, 'create', 'evidence', result.lastInsertRowid, `上传证据: ${evidence_name}`);

  res.json({ evidence: { id: result.lastInsertRowid, ...req.body } });
});

router.post('/batch', authenticateToken, upload.array('files', 50), (req, res) => {
  if (req.user.role === 'client') {
    return res.status(403).json({ error: '客户无法上传证据' });
  }

  const { case_id, group_id, upload_batch } = req.body;
  const batchId = upload_batch || `BATCH-${Date.now()}`;
  const results = [];

  req.files.forEach((file, index) => {
    const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM evidence WHERE case_id = ?').get(case_id);
    const sort_order = (maxOrder.max || 0) + index + 1;
    const evidence_number = `E-${Date.now()}-${index}`;

    const result = db.prepare(`
      INSERT INTO evidence (
        case_id, group_id, evidence_number, evidence_name, file_name, file_path, file_size, file_type, upload_batch, sort_order, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      case_id, group_id, evidence_number, file.originalname, file.originalname, file.filename, file.size, file.mimetype, batchId, sort_order, req.user.id
    );

    results.push({ id: result.lastInsertRowid, filename: file.originalname });
  });

  res.json({ message: '批量上传成功', count: results.length, results });
});

router.put('/:evidenceId', authenticateToken, (req, res) => {
  if (req.user.role === 'client') {
    return res.status(403).json({ error: '客户无法编辑证据' });
  }

  const { group_id, evidence_number, evidence_name, evidence_type, source, obtain_date, confidentiality_level, original_status, proof_purpose, dispute_focus, sort_order } = req.body;

  const oldEvidence = db.prepare('SELECT * FROM evidence WHERE id = ?').get(req.params.evidenceId);
  if (!oldEvidence) {
    return res.status(404).json({ error: '证据不存在' });
  }

  const newVersion = oldEvidence.version + 1;

  db.prepare(`
    UPDATE evidence 
    SET group_id = ?, evidence_number = ?, evidence_name = ?, evidence_type = ?, source = ?, obtain_date = ?, confidentiality_level = ?, original_status = ?, proof_purpose = ?, dispute_focus = ?, sort_order = ?, version = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    group_id, evidence_number, evidence_name, evidence_type, source, obtain_date, confidentiality_level, original_status, proof_purpose, dispute_focus, sort_order, newVersion, req.params.evidenceId
  );

  db.prepare(`
    INSERT INTO evidence_history (evidence_id, version, evidence_number, evidence_name, sort_order, changed_by, change_reason)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.evidenceId, newVersion, evidence_number, evidence_name, sort_order, req.user.id, '更新证据');

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, module, record_id, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, 'update', 'evidence', req.params.evidenceId, `更新证据: ${evidence_name}`);

  res.json({ message: '证据更新成功' });
});

router.post('/:evidenceId/withdraw', authenticateToken, (req, res) => {
  if (req.user.role === 'client') {
    return res.status(403).json({ error: '客户无法撤回证据' });
  }

  const { reason } = req.body;

  db.prepare(`
    UPDATE evidence 
    SET is_active = 0, withdrawn_reason = ?, withdrawn_by = ?, withdrawn_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(reason, req.user.id, req.params.evidenceId);

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, module, record_id, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, 'withdraw', 'evidence', req.params.evidenceId, `撤回证据: ${reason}`);

  res.json({ message: '证据撤回成功' });
});

router.post('/reorder/:caseId', authenticateToken, (req, res) => {
  if (req.user.role === 'client') {
    return res.status(403).json({ error: '客户无法重新排序' });
  }

  const { orders } = req.body;

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      db.prepare('UPDATE evidence SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(item.sort_order, item.id);
    }
  });

  insertMany(orders);

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, module, record_id, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, 'reorder', 'evidence', req.params.caseId, `重新排序 ${orders.length} 条证据`);

  res.json({ message: '排序更新成功' });
});

router.get('/download/:filename', authenticateToken, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadPath, filename);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: '文件不存在' });
  }
});

module.exports = router;
