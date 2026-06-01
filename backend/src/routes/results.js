const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { db } = require('../database');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post('/:customer_id', upload.fields([{ name: 'before_screenshot' }, { name: 'after_screenshot' }, { name: 'institution_reply' }]), (req, res) => {
  const { service_conclusion, refund_status, final_balance } = req.body;
  const customerId = req.params.customer_id;
  
  const existing = db.prepare('SELECT id FROM results WHERE customer_id = ?').get(customerId);
  
  const beforeFile = req.files?.before_screenshot?.[0]?.filename;
  const afterFile = req.files?.after_screenshot?.[0]?.filename;
  const replyFile = req.files?.institution_reply?.[0]?.filename;
  
  if (existing) {
    let updateSql = 'UPDATE results SET service_conclusion = ?, refund_status = ?, final_balance = ?, closed_by = ?, closed_at = CURRENT_TIMESTAMP';
    const params = [service_conclusion, refund_status, final_balance, 1];
    
    if (beforeFile) { updateSql += ', before_screenshot = ?'; params.push(beforeFile); }
    if (afterFile) { updateSql += ', after_screenshot = ?'; params.push(afterFile); }
    if (replyFile) { updateSql += ', institution_reply = ?'; params.push(replyFile); }
    
    updateSql += ' WHERE customer_id = ?';
    params.push(customerId);
    
    db.prepare(updateSql).run(...params);
  } else {
    db.prepare(`
      INSERT INTO results (customer_id, before_screenshot, after_screenshot, institution_reply, service_conclusion, refund_status, final_balance, closed_by, closed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(customerId, beforeFile, afterFile, replyFile, service_conclusion, refund_status, final_balance, 1);
  }
  
  db.prepare('INSERT INTO progress (customer_id, status, remark, operator_id) VALUES (?, ?, ?, ?)')
    .run(customerId, '已结案', service_conclusion, 1);
  
  db.prepare('UPDATE customers SET status = ? WHERE id = ?').run('closed', customerId);
  
  res.json({ success: true });
});

router.get('/', (req, res) => {
  const results = db.prepare(`
    SELECT r.*, c.name, c.customer_no, c.fee_status, c.total_fee
    FROM results r
    JOIN customers c ON r.customer_id = c.id
    ORDER BY r.closed_at DESC
  `).all();
  res.json(results);
});

module.exports = router;
