const express = require('express');
const db = require('../config/database');
const { authMiddleware } = require('../utils/auth');

const router = express.Router();

const generateLegalStatusTree = (patentId, status) => {
  const tree = {
    current_status: status,
    history: [
      { status: 'application_submitted', date: new Date().toISOString(), description: '专利申请提交' },
      { status: 'preliminary_examination', date: new Date().toISOString(), description: '初步审查通过' },
      { status: 'publication', date: new Date().toISOString(), description: '专利公开' },
      { status: status, date: new Date().toISOString(), description: '当前状态' }
    ],
    next_steps: [
      { action: 'annual_fee_payment', due_date: null, description: '年费缴纳' }
    ]
  };
  return JSON.stringify(tree);
};

router.post('/', authMiddleware, (req, res) => {
  const { title, patent_type, application_number, application_date, inventor, applicant, abstract } = req.body;
  
  const nextFeeDueDate = new Date();
  nextFeeDueDate.setFullYear(nextFeeDueDate.getFullYear() + 1);
  
  db.run(
    `INSERT INTO patents (user_id, title, patent_type, application_number, application_date, inventor, applicant, abstract, next_fee_due_date, legal_status_tree) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.userId, title, patent_type, application_number, application_date, inventor, applicant, abstract, nextFeeDueDate.toISOString().split('T')[0], generateLegalStatusTree(null, 'pending')],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      const feeAmount = patent_type === 'invention' ? 900 : (patent_type === 'utility' ? 600 : 300);
      db.run(
        `INSERT INTO patent_fee_reminders (patent_id, fee_type, due_date, amount, status) 
         VALUES (?, 'annual_fee', ?, ?, 'pending')`,
        [this.lastID, nextFeeDueDate.toISOString().split('T')[0], feeAmount]
      );
      
      res.json({ success: true, id: this.lastID, message: '专利创建成功' });
    }
  );
});

router.get('/', authMiddleware, (req, res) => {
  const { page = 1, limit = 10, status, patent_type } = req.query;
  const offset = (page - 1) * limit;
  
  let query = `SELECT * FROM patents WHERE user_id = ?`;
  const params = [req.userId];
  
  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }
  if (patent_type) {
    query += ` AND patent_type = ?`;
    params.push(patent_type);
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  db.all(query, params, (err, patents) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.get(`SELECT COUNT(*) as total FROM patents WHERE user_id = ?`, [req.userId], (err, row) => {
      res.json({ success: true, data: patents, total: row.total, page, limit });
    });
  });
});

router.get('/:id', authMiddleware, (req, res) => {
  db.get(`SELECT * FROM patents WHERE id = ? AND user_id = ?`, 
    [req.params.id, req.userId], 
    (err, patent) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!patent) return res.status(404).json({ error: '专利不存在' });
      
      try {
        patent.legal_status_tree = JSON.parse(patent.legal_status_tree);
      } catch (e) {}
      
      db.all(`SELECT * FROM patent_fee_reminders WHERE patent_id = ? ORDER BY due_date DESC`, 
        [req.params.id], 
        (err, fees) => {
          res.json({ success: true, data: { ...patent, fee_reminders: fees } });
        }
      );
    }
  );
});

router.get('/fees/due-soon', authMiddleware, (req, res) => {
  const days = req.query.days || 30;
  
  db.all(
    `SELECT pfr.*, p.title as patent_title, p.patent_number 
     FROM patent_fee_reminders pfr 
     LEFT JOIN patents p ON pfr.patent_id = p.id 
     WHERE p.user_id = ? AND pfr.status = 'pending' 
     AND julianday(pfr.due_date) - julianday('now') <= ? 
     ORDER BY pfr.due_date ASC`,
    [req.userId, days],
    (err, fees) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, data: fees, count: fees.length });
    }
  );
});

router.post('/fees/:id/pay', authMiddleware, (req, res) => {
  db.run(
    `UPDATE patent_fee_reminders SET status = 'paid', paid_at = DATETIME('now') WHERE id = ? 
     AND EXISTS (SELECT 1 FROM patents WHERE id = patent_fee_reminders.patent_id AND user_id = ?)`,
    [req.params.id, req.userId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      db.get(`SELECT patent_id FROM patent_fee_reminders WHERE id = ?`, [req.params.id], (err, row) => {
        const nextDueDate = new Date();
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        
        db.run(
          `UPDATE patents SET next_fee_due_date = ?, last_fee_paid_date = DATE('now') WHERE id = ?`,
          [nextDueDate.toISOString().split('T')[0], row.patent_id]
        );
        
        db.run(
          `INSERT INTO patent_fee_reminders (patent_id, fee_type, due_date, amount, status) 
           SELECT ?, 'annual_fee', ?, amount, 'pending' 
           FROM patent_fee_reminders WHERE id = ?`,
          [row.patent_id, nextDueDate.toISOString().split('T')[0], req.params.id]
        );
      });
      
      res.json({ success: true, message: '缴费成功，已生成下一年度缴费提醒' });
    }
  );
});

module.exports = router;
