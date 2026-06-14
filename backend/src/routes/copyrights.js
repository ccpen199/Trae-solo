import { Router } from 'express';
import { getDB } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();

router.get('/', authenticateToken, (req, res) => {
  const db = getDB();
  const { work_type, status, keyword, page = 1, pageSize = 20 } = req.query;

  let whereClause = 'WHERE user_id = ?';
  let params = [req.user.id];

  if (work_type) {
    whereClause += ' AND work_type = ?';
    params.push(work_type);
  }
  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }
  if (keyword) {
    whereClause += ' AND (work_name LIKE ? OR registration_number LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const count = db.prepare(`SELECT COUNT(*) as total FROM copyrights ${whereClause}`).get(...params).total;
  const offset = (page - 1) * pageSize;
  const copyrights = db.prepare(`
    SELECT * FROM copyrights ${whereClause}
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({
    data: copyrights,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total: count,
      totalPages: Math.ceil(count / pageSize)
    }
  });
});

router.get('/:id', authenticateToken, (req, res) => {
  const db = getDB();
  const copyright = db.prepare('SELECT * FROM copyrights WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

  if (!copyright) {
    return res.status(404).json({ error: '版权不存在' });
  }

  res.json(copyright);
});

router.post('/', authenticateToken, (req, res) => {
  const db = getDB();
  const { work_name, work_type, author, copyright_owner, notes } = req.body;

  if (!work_name) {
    return res.status(400).json({ error: '作品名称不能为空' });
  }

  const evidenceHash = '0x' + crypto.createHash('sha256').update(work_name + Date.now()).digest('hex');

  const result = db.prepare(`
    INSERT INTO copyrights (user_id, work_name, work_type, creation_date, author, copyright_owner, evidence_hash, evidence_url, status, notes)
    VALUES (?, ?, ?, date('now'), ?, ?, ?, ?, 'pending', ?)
  `).run(req.user.id, work_name, work_type, author, copyright_owner, evidenceHash, 'https://evidence.example.com/' + evidenceHash.slice(0, 16), notes);

  const copyright = db.prepare('SELECT * FROM copyrights WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(copyright);
});

router.post('/evidence', authenticateToken, (req, res) => {
  const { work_name, work_content, metadata } = req.body;

  if (!work_name || !work_content) {
    return res.status(400).json({ error: '作品名称和内容不能为空' });
  }

  const evidenceHash = '0x' + crypto.createHash('sha256').update(work_content + Date.now()).digest('hex');
  const timestamp = new Date().toISOString();

  res.json({
    success: true,
    evidence: {
      workName: work_name,
      evidenceHash,
      timestamp,
      blockHeight: Math.floor(Math.random() * 1000000) + 1000000,
      txId: '0x' + crypto.randomBytes(32).toString('hex'),
      metadata: metadata || {},
      confirmationStatus: 'confirmed',
      confirmations: 12
    },
    certificateUrl: 'https://evidence.example.com/certificate/' + evidenceHash.slice(0, 16)
  });
});

router.post('/verify', authenticateToken, (req, res) => {
  const { evidence_hash, work_content } = req.body;

  if (!evidence_hash) {
    return res.status(400).json({ error: '存证哈希不能为空' });
  }

  const db = getDB();
  const copyright = db.prepare('SELECT * FROM copyrights WHERE user_id = ? AND evidence_hash = ?').get(req.user.id, evidence_hash);

  let isValid = false;
  let verificationResult = {};

  if (copyright) {
    isValid = true;
    verificationResult = {
      workName: copyright.work_name,
      workType: copyright.work_type,
      registrationDate: copyright.registration_date,
      creationDate: copyright.creation_date,
      author: copyright.author,
      copyrightOwner: copyright.copyright_owner
    };
  } else if (work_content) {
    const computedHash = '0x' + crypto.createHash('sha256').update(work_content).digest('hex');
    isValid = computedHash.toLowerCase() === evidence_hash.toLowerCase();
  }

  res.json({
    valid: isValid,
    evidenceHash: evidence_hash,
    verificationTime: new Date().toISOString(),
    result: verificationResult,
    trustedTimestamp: new Date().toISOString()
  });
});

router.get('/bulk/list', authenticateToken, (req, res) => {
  const db = getDB();
  const batches = db.prepare(`
    SELECT * FROM copyright_bulk_registrations
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(req.user.id);

  res.json({ data: batches });
});

router.post('/bulk', authenticateToken, (req, res) => {
  const db = getDB();
  const { batch_name, works } = req.body;

  if (!batch_name || !works || !Array.isArray(works) || works.length === 0) {
    return res.status(400).json({ error: '批次名称和作品列表不能为空' });
  }

  const totalCount = works.length;
  const successCount = Math.floor(works.length * (0.85 + Math.random() * 0.15));
  const failedCount = totalCount - successCount;

  const result = db.prepare(`
    INSERT INTO copyright_bulk_registrations (user_id, batch_name, total_count, success_count, failed_count, status)
    VALUES (?, ?, ?, ?, ?, 'processing')
  `).run(req.user.id, batch_name, totalCount, successCount, failedCount);

  setTimeout(() => {
    db.prepare('UPDATE copyright_bulk_registrations SET status = ? WHERE id = ?').run('completed', result.lastInsertRowid);
  }, 2000);

  const insertCopyright = db.prepare(`
    INSERT INTO copyrights (user_id, work_name, work_type, creation_date, author, copyright_owner, evidence_hash, evidence_url, status)
    VALUES (?, ?, ?, date('now'), ?, ?, ?, ?, 'registered')
  `);

  works.slice(0, successCount).forEach(work => {
    const evidenceHash = '0x' + crypto.createHash('sha256').update(work.name + Date.now() + Math.random()).digest('hex');
    insertCopyright.run(req.user.id, work.name, work.type || '软件著作权', work.author || '作者', work.owner || '版权所有', evidenceHash, 'https://evidence.example.com/' + evidenceHash.slice(0, 16));
  });

  res.status(201).json({
    id: result.lastInsertRowid,
    message: '批量登记已提交',
    totalCount,
    successCount,
    failedCount
  });
});

export default router;
