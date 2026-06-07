const express = require('express');
const crypto = require('crypto');
const db = require('../config/database');
const { authMiddleware } = require('../utils/auth');

const router = express.Router();

const generateFeatureVector = (name, category) => {
  const hash = crypto.createHash('sha256');
  hash.update(name + category + Date.now());
  const hex = hash.digest('hex');
  const vector = [];
  for (let i = 0; i < 64; i += 2) {
    vector.push(parseInt(hex.substr(i, 2), 16) / 255);
  }
  return JSON.stringify(vector);
};

const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

router.get('/search', (req, res) => {
  const { name, category, image_features, threshold = 0.7 } = req.query;
  
  let query = `SELECT * FROM trademarks WHERE 1=1`;
  const params = [];

  if (name) {
    query += ` AND name LIKE ?`;
    params.push(`%${name}%`);
  }
  
  if (category) {
    query += ` AND (category LIKE ? OR category_code = ?)`;
    params.push(`%${category}%`, category);
  }

  db.all(query, params, (err, trademarks) => {
    if (err) return res.status(500).json({ error: err.message });

    let results = trademarks.map(tm => {
      let similarity = 0;
      let textMatch = 0;

      if (name && tm.name) {
        const tmLower = tm.name.toLowerCase();
        const nameLower = name.toLowerCase();
        if (tmLower === nameLower) textMatch = 1;
        else if (tmLower.includes(nameLower)) textMatch = 0.8;
        else textMatch = 0.3;
      }

      if (image_features && tm.feature_vector) {
        try {
          const vecA = JSON.parse(image_features);
          const vecB = JSON.parse(tm.feature_vector);
          similarity = cosineSimilarity(vecA, vecB);
        } catch (e) {
          similarity = 0.5;
        }
      }

      const overallScore = (textMatch * 0.4 + similarity * 0.4 + (category && tm.category ? 0.2 : 0));
      
      return {
        ...tm,
        similarity: Math.round(similarity * 100),
        text_match: Math.round(textMatch * 100),
        overall_score: Math.round(overallScore * 100)
      };
    });

    if (image_features || name) {
      results = results.filter(r => r.overall_score >= threshold * 100);
      results.sort((a, b) => b.overall_score - a.overall_score);
    }

    res.json({ success: true, data: results, count: results.length });
  });
});

router.post('/', authMiddleware, (req, res) => {
  const { name, category, category_code, image_url, owner, address } = req.body;
  const featureVector = generateFeatureVector(name, category);
  
  db.run(
    `INSERT INTO trademarks (user_id, name, category, category_code, image_url, feature_vector, owner, address) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.userId, name, category, category_code, image_url, featureVector, owner, address],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: '商标创建成功' });
    }
  );
});

router.get('/', authMiddleware, (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const offset = (page - 1) * limit;
  
  let query = `SELECT * FROM trademarks WHERE user_id = ?`;
  const params = [req.userId];
  
  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  db.all(query, params, (err, trademarks) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.get(`SELECT COUNT(*) as total FROM trademarks WHERE user_id = ?`, [req.userId], (err, row) => {
      res.json({ success: true, data: trademarks, total: row.total, page, limit });
    });
  });
});

router.get('/:id', authMiddleware, (req, res) => {
  db.get(`SELECT * FROM trademarks WHERE id = ? AND user_id = ?`, 
    [req.params.id, req.userId], 
    (err, trademark) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!trademark) return res.status(404).json({ error: '商标不存在' });
      res.json({ success: true, data: trademark });
    }
  );
});

router.post('/:id/ocr', authMiddleware, (req, res) => {
  const { file_url, ocr_data, applicant_name, application_number, application_date, trademark_name, category } = req.body;
  
  db.run(
    `INSERT INTO trademark_ocr_records 
     (trademark_id, file_url, ocr_data, applicant_name, application_number, application_date, trademark_name, category) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.params.id, file_url, ocr_data, applicant_name, application_number, application_date, trademark_name, category],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      db.run(
        `UPDATE trademarks SET application_number = ?, application_date = ?, status = 'under_review' WHERE id = ?`,
        [application_number, application_date, req.params.id],
        () => {
          res.json({ success: true, id: this.lastID, message: 'OCR识别完成，数据已更新' });
        }
      );
    }
  );
});

module.exports = router;
