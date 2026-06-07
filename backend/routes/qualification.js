const express = require('express');
const router = express.Router();
const { query, getOne } = require('../utils/db');
const { success, error, paginate, logOperation } = require('../utils/response');
const { auth } = require('../middleware/auth');

router.get('/verifications', auth, (req, res) => {
  const { page = 1, pageSize = 10, status, keyword } = req.query;
  let sql = `SELECT qv.*, u.phone 
             FROM qualification_verifications qv 
             LEFT JOIN users u ON qv.user_id = u.id 
             WHERE 1=1`;
  const params = [];
  if (status) {
    sql += ` AND qv.result = ?`;
    params.push(status);
  }
  if (keyword) {
    sql += ` AND (qv.name LIKE ? OR qv.id_card LIKE ?)`;
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  sql += ` ORDER BY qv.created_at DESC`;
  const list = query(sql, params);
  res.json(success(paginate(list, page, pageSize)));
});

router.get('/verifications/:id', auth, (req, res) => {
  const data = getOne('SELECT * FROM qualification_verifications WHERE id = ?', [req.params.id]);
  if (!data) {
    return res.json(error('认证记录不存在', 404));
  }
  const trajectories = query(
    `SELECT * FROM behavior_trajectories 
     WHERE id_card = ? AND event_time >= datetime('now', '-90 days') 
     ORDER BY event_time DESC LIMIT 50`,
    [data.id_card]
  );
  res.json(success({ ...data, trajectories }));
});

router.post('/verify', auth, (req, res) => {
  const { idCard, name, method } = req.body;
  if (!idCard || !name) {
    return res.json(error('身份证号和姓名不能为空', 400));
  }
  const user = getOne('SELECT * FROM users WHERE id_card = ?', [idCard]);
  if (!user) {
    return res.json(error('用户不存在', 404));
  }

  const biometricScore = method === 'biometric' || method === 'combined' 
    ? 0.85 + Math.random() * 0.15 
    : null;
  const behaviorScore = method === 'behavior' || method === 'combined'
    ? 0.80 + Math.random() * 0.20
    : null;
  
  const scores = [biometricScore, behaviorScore].filter(s => s !== null);
  const confidence = scores.reduce((a, b) => a + b, 0) / scores.length;
  const verifyResult = confidence >= 0.85 ? 'pass' : 'fail';
  const methodDisplay = method === 'biometric' ? '生物特征' : method === 'behavior' ? '行为轨迹' : '生物特征+行为轨迹';

  const insertResult = query(
    `INSERT INTO qualification_verifications 
     (user_id, id_card, name, method, biometric_score, behavior_score, confidence, result, remark)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      idCard,
      name,
      method,
      biometricScore,
      behaviorScore,
      confidence,
      verifyResult,
      verifyResult === 'pass' 
        ? `${methodDisplay}静默认证通过，置信度${(confidence * 100).toFixed(1)}%` 
        : `${methodDisplay}认证置信度不足，需人工复核`
    ]
  );

  logOperation(
    { query },
    req.user.userId,
    req.user.userType,
    'qualification',
    `发起静默认证：${name}`,
    req.ip
  );

  res.json(success({
    id: insertResult.lastInsertRowid,
    method,
    biometricScore,
    behaviorScore,
    confidence,
    result: verifyResult,
    needReview: verifyResult !== 'pass' || confidence < 0.9
  }));
});

router.post('/silent-batch', auth, (req, res) => {
  const users = query(
    `SELECT u.id, u.id_card, u.name 
     FROM users u 
     WHERE u.user_type = 'citizen' 
       AND u.id NOT IN (
         SELECT user_id FROM qualification_verifications 
         WHERE created_at >= datetime('now', '-30 days') AND result = 'pass'
       )
     LIMIT 20`
  );

  const results = [];
  users.forEach(user => {
    const biometricScore = 0.88 + Math.random() * 0.12;
    const behaviorScore = 0.85 + Math.random() * 0.15;
    const confidence = (biometricScore + behaviorScore) / 2;
    const result = confidence >= 0.85 ? 'pass' : 'fail';

    query(
      `INSERT INTO qualification_verifications 
       (user_id, id_card, name, method, biometric_score, behavior_score, confidence, result, remark)
       VALUES (?, ?, ?, 'combined', ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.id_card,
        user.name,
        biometricScore,
        behaviorScore,
        confidence,
        result,
        result === 'pass' ? '批量静默认证通过' : '需人工复核'
      ]
    );
    results.push({ name: user.name, result, confidence });
  });

  res.json(success({ count: results.length, results }));
});

router.put('/verifications/:id/review', auth, (req, res) => {
  const { id } = req.params;
  const { result, remark } = req.body;
  query(
    'UPDATE qualification_verifications SET reviewed = 1, result = ?, remark = ?, reviewer_id = ? WHERE id = ?',
    [result, remark || '', req.user.userId, id]
  );
  logOperation(
    { query },
    req.user.userId,
    req.user.userType,
    'qualification',
    `人工复核认证记录ID:${id}，结论:${result === 'pass' ? '通过' : '不通过'}`,
    req.ip
  );
  res.json(success(null, '复核完成'));
});

router.get('/statistics', auth, (req, res) => {
  const total = getOne('SELECT COUNT(*) as count FROM qualification_verifications WHERE created_at >= datetime(\'now\', \'-30 days\')').count;
  const passed = getOne('SELECT COUNT(*) as count FROM qualification_verifications WHERE created_at >= datetime(\'now\', \'-30 days\') AND result = \'pass\'').count;
  const pending = getOne('SELECT COUNT(*) as count FROM qualification_verifications WHERE reviewed = 0 AND (result != \'pass\' OR confidence < 0.9)').count;
  
  const methodStats = query(
    `SELECT method, COUNT(*) as count, 
            AVG(CASE WHEN result = 'pass' THEN 1 ELSE 0 END) as pass_rate
     FROM qualification_verifications 
     WHERE created_at >= datetime('now', '-30 days')
     GROUP BY method`
  );

  res.json(success({
    total,
    passed,
    pending,
    passRate: total > 0 ? passed / total : 0,
    methodStats
  }));
});

module.exports = router;
