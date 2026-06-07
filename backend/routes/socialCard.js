const express = require('express');
const router = express.Router();
const { query, getOne } = require('../utils/db');
const { success, error, paginate, logOperation } = require('../utils/response');
const { auth } = require('../middleware/auth');

router.get('/my-card', auth, (req, res) => {
  const card = getOne(
    'SELECT * FROM social_cards WHERE user_id = ? ORDER BY id DESC LIMIT 1',
    [req.user.userId]
  );
  if (!card) {
    return res.json(error('未查询到社保卡信息', 404));
  }
  const operations = query(
    'SELECT * FROM card_operations WHERE card_id = ? ORDER BY created_at DESC LIMIT 10',
    [card.id]
  );
  res.json(success({ ...card, operations }));
});

router.get('/cards', auth, (req, res) => {
  const { page = 1, pageSize = 10, status, keyword } = req.query;
  let sql = 'SELECT * FROM social_cards WHERE 1=1';
  const params = [];
  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (keyword) {
    sql += ' AND (name LIKE ? OR card_no LIKE ? OR id_card LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  sql += ' ORDER BY created_at DESC';
  const list = query(sql, params);
  res.json(success(paginate(list, page, pageSize)));
});

router.get('/cards/:id', auth, (req, res) => {
  const card = getOne('SELECT * FROM social_cards WHERE id = ?', [req.params.id]);
  if (!card) {
    return res.json(error('社保卡不存在', 404));
  }
  const operations = query(
    'SELECT * FROM card_operations WHERE card_id = ? ORDER BY created_at DESC',
    [card.id]
  );
  res.json(success({ ...card, operations }));
});

router.post('/report-loss', auth, (req, res) => {
  const { cardNo, reason } = req.body;
  const card = getOne('SELECT * FROM social_cards WHERE card_no = ?', [cardNo]);
  if (!card) {
    return res.json(error('社保卡不存在', 404));
  }
  if (card.loss_reported === 1) {
    return res.json(error('该社保卡已挂失', 400));
  }

  query(
    'UPDATE social_cards SET loss_reported = 1, status = \'frozen\', updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [card.id]
  );

  const result = query(
    `INSERT INTO card_operations 
     (card_id, user_id, operation_type, reason, status, progress, tracking_no)
     VALUES (?, ?, 'loss', ?, 'completed', 100, ?)`,
    [card.id, req.user.userId, reason || '持卡人主动挂失', `GS${Date.now()}`]
  );

  logOperation(
    { query },
    req.user.userId,
    req.user.userType,
    'social_card',
    `社保卡挂失：${cardNo}`,
    req.ip
  );

  res.json(success({ id: result.lastInsertRowid, message: '挂失成功' }));
});

router.post('/unfreeze', auth, (req, res) => {
  const { cardNo, reason } = req.body;
  const card = getOne('SELECT * FROM social_cards WHERE card_no = ?', [cardNo]);
  if (!card) {
    return res.json(error('社保卡不存在', 404));
  }
  if (card.loss_reported === 0) {
    return res.json(error('该社保卡未挂失', 400));
  }

  query(
    'UPDATE social_cards SET loss_reported = 0, status = \'active\', updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [card.id]
  );

  query(
    `INSERT INTO card_operations 
     (card_id, user_id, operation_type, reason, status, progress, tracking_no)
     VALUES (?, ?, 'unfreeze', ?, 'completed', 100, ?)`,
    [card.id, req.user.userId, reason || '持卡人解挂', `JG${Date.now()}`]
  );

  logOperation(
    { query },
    req.user.userId,
    req.user.userType,
    'social_card',
    `社保卡解挂：${cardNo}`,
    req.ip
  );

  res.json(success(null, '解挂成功'));
});

router.post('/replacement', auth, (req, res) => {
  const { cardNo, reason, appointmentDate } = req.body;
  const card = getOne('SELECT * FROM social_cards WHERE card_no = ?', [cardNo]);
  if (!card) {
    return res.json(error('社保卡不存在', 404));
  }

  const result = query(
    `INSERT INTO card_operations 
     (card_id, user_id, operation_type, reason, status, appointment_date, progress, tracking_no)
     VALUES (?, ?, 'replace', ?, 'pending', ?, 10, ?)`,
    [card.id, req.user.userId, reason || '卡片损坏补办', appointmentDate || null, `BK${Date.now()}`]
  );

  logOperation(
    { query },
    req.user.userId,
    req.user.userType,
    'social_card',
    `补换卡预约：${cardNo}`,
    req.ip
  );

  res.json(success({
    id: result.lastInsertRowid,
    trackingNo: `BK${Date.now()}`,
    estimatedDays: 15,
    message: '补换卡预约成功，预计15个工作日完成'
  }));
});

router.get('/operations', auth, (req, res) => {
  const { page = 1, pageSize = 10, type, status } = req.query;
  let sql = `SELECT co.*, sc.name, sc.card_no 
             FROM card_operations co 
             LEFT JOIN social_cards sc ON co.card_id = sc.id 
             WHERE 1=1`;
  const params = [];
  if (type && type !== 'all') {
    sql += ' AND co.operation_type = ?';
    params.push(type);
  }
  if (status && status !== 'all') {
    sql += ' AND co.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY co.created_at DESC';
  const list = query(sql, params);
  res.json(success(paginate(list, page, pageSize)));
});

router.get('/operations/:id/progress', auth, (req, res) => {
  const operation = getOne(
    `SELECT co.*, sc.name, sc.card_no, sc.bank_name 
     FROM card_operations co 
     LEFT JOIN social_cards sc ON co.card_id = sc.id 
     WHERE co.id = ?`,
    [req.params.id]
  );
  if (!operation) {
    return res.json(error('业务记录不存在', 404));
  }
  const progressSteps = [
    { step: 1, name: '申请提交', completed: operation.progress >= 10, time: operation.created_at },
    { step: 2, name: '材料审核', completed: operation.progress >= 30, time: operation.progress >= 30 ? operation.updated_at : null },
    { step: 3, name: '制卡中', completed: operation.progress >= 60, time: null },
    { step: 4, name: '银行关联', completed: operation.progress >= 80, time: null },
    { step: 5, name: '完成制卡', completed: operation.progress >= 100, time: operation.progress >= 100 ? operation.updated_at : null },
  ];
  res.json(success({ ...operation, progressSteps }));
});

router.put('/operations/:id/progress', auth, (req, res) => {
  const { progress, status, remark } = req.body;
  query(
    'UPDATE card_operations SET progress = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [progress, status, req.params.id]
  );
  logOperation(
    { query },
    req.user.userId,
    req.user.userType,
    'social_card',
    `更新制卡进度：操作ID=${req.params.id}，进度=${progress}%`,
    req.ip
  );
  res.json(success(null, '进度更新成功'));
});

router.get('/statistics', auth, (req, res) => {
  const total = getOne('SELECT COUNT(*) as count FROM social_cards').count;
  const active = getOne('SELECT COUNT(*) as count FROM social_cards WHERE status = \'active\'').count;
  const frozen = getOne('SELECT COUNT(*) as count FROM social_cards WHERE status = \'frozen\'').count;
  const pending = getOne('SELECT COUNT(*) as count FROM card_operations WHERE status = \'pending\'').count;
  const todayNew = getOne(`SELECT COUNT(*) as count FROM social_cards WHERE date(created_at) = date('now')`).count;

  res.json(success({
    total,
    active,
    frozen,
    pending,
    todayNew
  }));
});

module.exports = router;
