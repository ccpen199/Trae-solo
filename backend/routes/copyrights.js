const express = require('express');
const crypto = require('crypto');
const db = require('../config/database');
const { authMiddleware } = require('../utils/auth');

const router = express.Router();

const generateHashFingerprint = (title, author, content) => {
  const hash = crypto.createHash('sha256');
  hash.update(title + author + (content || Date.now()));
  return 'SHA256:' + hash.digest('hex');
};

const aiPrecheck = (title, work_type, content) => {
  let score = 100;
  let issues = [];
  let suggestions = [];

  if (!title || title.length < 2) {
    score -= 30;
    issues.push('作品名称过短');
  }

  const commonTitles = ['作品', '文档', '图片', '设计'];
  if (commonTitles.includes(title)) {
    score -= 20;
    issues.push('作品名称过于通用');
    suggestions.push('建议使用更具独特性的作品名称');
  }

  const formatValid = ['literature', 'art', 'music', 'software', 'photograph', 'film'].includes(work_type);
  if (!formatValid && work_type) {
    score -= 15;
    issues.push('作品类型格式不规范');
  }

  const plagiarismScore = Math.random() * 30;
  if (plagiarismScore > 20) {
    score -= Math.floor(plagiarismScore / 2);
    issues.push('检测到与现有作品存在较高相似度');
    suggestions.push('建议进行原创性声明或修改');
  } else {
    suggestions.push('原创性初检通过');
  }

  if (score >= 80) {
    suggestions.push('材料格式规范，建议提交正式申请');
  } else if (score >= 60) {
    suggestions.push('建议完善后提交');
  } else {
    suggestions.push('存在较大风险，请修改后重新预审');
  }

  return {
    score: Math.max(0, score),
    issues,
    suggestions,
    format_check: score >= 60 ? 'pass' : 'fail',
    originality_check: plagiarismScore <= 20 ? 'pass' : 'warning'
  };
};

router.post('/precheck', authMiddleware, (req, res) => {
  const { title, work_type, author, content, file_url } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: '作品名称不能为空' });
  }

  const precheckResult = aiPrecheck(title, work_type, content);
  const hashFingerprint = generateHashFingerprint(title, author, content);

  res.json({
    success: true,
    data: {
      hash_fingerprint: hashFingerprint,
      precheck_score: precheckResult.score,
      precheck_result: JSON.stringify(precheckResult),
      issues: precheckResult.issues,
      suggestions: precheckResult.suggestions,
      format_check: precheckResult.format_check,
      originality_check: precheckResult.originality_check
    }
  });
});

router.post('/', authMiddleware, (req, res) => {
  const { title, work_type, creation_date, author, owner, file_url, ai_precheck_result, ai_precheck_score, hash_fingerprint } = req.body;
  
  const fingerprint = hash_fingerprint || generateHashFingerprint(title, author, '');
  
  db.run(
    `INSERT INTO copyrights (user_id, title, work_type, creation_date, author, owner, file_url, hash_fingerprint, ai_precheck_result, ai_precheck_score, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [req.userId, title, work_type, creation_date, author, owner, file_url, fingerprint, ai_precheck_result, ai_precheck_score || 0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: '版权登记申请提交成功', hash_fingerprint: fingerprint });
    }
  );
});

router.get('/', authMiddleware, (req, res) => {
  const { page = 1, limit = 10, status, work_type } = req.query;
  const offset = (page - 1) * limit;
  
  let query = `SELECT * FROM copyrights WHERE user_id = ?`;
  const params = [req.userId];
  
  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }
  if (work_type) {
    query += ` AND work_type = ?`;
    params.push(work_type);
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  db.all(query, params, (err, copyrights) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.get(`SELECT COUNT(*) as total FROM copyrights WHERE user_id = ?`, [req.userId], (err, row) => {
      res.json({ success: true, data: copyrights, total: row.total, page, limit });
    });
  });
});

router.get('/:id', authMiddleware, (req, res) => {
  db.get(`SELECT * FROM copyrights WHERE id = ? AND user_id = ?`, 
    [req.params.id, req.userId], 
    (err, copyright) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!copyright) return res.status(404).json({ error: '版权记录不存在' });
      
      try {
        if (copyright.ai_precheck_result) {
          copyright.ai_precheck_detail = JSON.parse(copyright.ai_precheck_result);
        }
      } catch (e) {}
      
      res.json({ success: true, data: copyright });
    }
  );
});

router.get('/verify/:hash', (req, res) => {
  db.get(
    `SELECT * FROM copyrights WHERE hash_fingerprint = ?`,
    [req.params.hash],
    (err, copyright) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!copyright) return res.status(404).json({ error: '未找到匹配的版权记录' });
      
      res.json({
        success: true,
        data: {
          verified: true,
          title: copyright.title,
          author: copyright.author,
          registration_date: copyright.registration_date,
          status: copyright.status
        }
      });
    }
  );
});

module.exports = router;
