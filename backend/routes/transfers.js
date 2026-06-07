const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authMiddleware } = require('../utils/auth');

const router = express.Router();

const generateNotaryCertificate = (transferId) => {
  const certificateNumber = `GZ-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const verificationCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO notary_certificates (transfer_id, certificate_number, notary_office, notary_name, notary_date, verification_code, status) 
       VALUES (?, ?, ?, ?, DATE('now'), ?, 'completed')`,
      [transferId, certificateNumber, '国家知识产权公证中心', '公证员', verificationCode],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, certificateNumber, verificationCode });
      }
    );
  });
};

router.post('/', authMiddleware, (req, res) => {
  const { trademark_id, assignee_name, transfer_price } = req.body;
  
  db.get(`SELECT * FROM trademarks WHERE id = ? AND user_id = ?`, [trademark_id, req.userId], (err, trademark) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!trademark) return res.status(404).json({ error: '商标不存在或无权限' });

    db.run(
      `INSERT INTO trademark_transfers (trademark_id, assignor_id, assignor_name, assignee_name, transfer_price, status) 
       VALUES (?, ?, ?, ?, ?, 'draft')`,
      [trademark_id, req.userId, trademark.owner, assignee_name, transfer_price],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID, message: '转让合同创建成功' });
      }
    );
  });
});

router.get('/', authMiddleware, (req, res) => {
  db.all(
    `SELECT tt.*, tm.name as trademark_name, tm.registration_number 
     FROM trademark_transfers tt 
     LEFT JOIN trademarks tm ON tt.trademark_id = tm.id 
     WHERE tt.assignor_id = ? OR tt.assignee_name = ?
     ORDER BY tt.created_at DESC`,
    [req.userId, req.query.assignee_name || ''],
    (err, transfers) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, data: transfers });
    }
  );
});

router.get('/:id', authMiddleware, (req, res) => {
  db.get(
    `SELECT tt.*, tm.name as trademark_name, tm.registration_number, tm.image_url
     FROM trademark_transfers tt 
     LEFT JOIN trademarks tm ON tt.trademark_id = tm.id 
     WHERE tt.id = ?`,
    [req.params.id],
    (err, transfer) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!transfer) return res.status(404).json({ error: '转让记录不存在' });
      
      db.get(`SELECT * FROM notary_certificates WHERE transfer_id = ?`, [req.params.id], (err, certificate) => {
        res.json({ success: true, data: { ...transfer, certificate } });
      });
    }
  );
});

router.post('/:id/sign', authMiddleware, (req, res) => {
  const { signer_type, signature } = req.body;
  
  db.get(`SELECT * FROM trademark_transfers WHERE id = ?`, [req.params.id], (err, transfer) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!transfer) return res.status(404).json({ error: '转让记录不存在' });

    const updateField = signer_type === 'assignor' ? 'assignor_signature' : 'assignee_signature';
    
    db.run(
      `UPDATE trademark_transfers SET ${updateField} = ?, status = ? WHERE id = ?`,
      [signature, 'signed', req.params.id],
      async (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        try {
          const notaryResult = await generateNotaryCertificate(req.params.id);
          
          db.run(
            `UPDATE trademark_transfers SET notary_certificate_id = ?, status = 'completed', signed_at = DATETIME('now'), completed_at = DATETIME('now') WHERE id = ?`,
            [notaryResult.id, req.params.id],
            () => {
              res.json({
                success: true,
                message: '签约完成，公证书已生成',
                certificate: {
                  number: notaryResult.certificateNumber,
                  verificationCode: notaryResult.verificationCode,
                  generatedAt: new Date().toISOString()
                }
              });
            }
          );
        } catch (err) {
          res.status(500).json({ error: '公证生成失败' });
        }
      }
    );
  });
});

router.get('/notary/verify/:code', (req, res) => {
  db.get(
    `SELECT nc.*, tt.transfer_price, tt.completed_at, tm.name as trademark_name
     FROM notary_certificates nc
     LEFT JOIN trademark_transfers tt ON nc.transfer_id = tt.id
     LEFT JOIN trademarks tm ON tt.trademark_id = tm.id
     WHERE nc.verification_code = ?`,
    [req.params.code],
    (err, record) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!record) return res.status(404).json({ error: '公证书不存在' });
      
      res.json({
        success: true,
        data: {
          ...record,
          is_valid: record.status === 'completed'
        }
      });
    }
  );
});

module.exports = router;
