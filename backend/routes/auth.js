const express = require('express');
const router = express.Router();
const { query, getOne } = require('../utils/db');
const { success, error } = require('../utils/response');
const { generateToken, auth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

router.post('/login', (req, res) => {
  const { username, password, userType } = req.body;
  if (!username || !password) {
    return res.json(error('用户名和密码不能为空', 400));
  }

  const user = getOne(
    'SELECT * FROM users WHERE (id_card = ? OR phone = ?) AND status = 1',
    [username, username]
  );
  
  if (!user) {
    return res.json(error('用户不存在或已禁用', 404));
  }
  
  if (userType && user.user_type !== userType && user.user_type !== 'admin') {
    return res.json(error('用户类型不匹配', 403));
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.json(error('密码错误', 401));
  }

  const token = generateToken(user);
  
  query(
    'INSERT INTO operation_logs (user_id, user_type, module, operation, ip) VALUES (?, ?, \'auth\', \'登录\', ?)',
    [user.id, user.user_type, req.ip]
  );

  res.json(success({
    token,
    user: {
      id: user.id,
      idCard: user.id_card,
      name: user.name,
      phone: user.phone,
      userType: user.user_type,
      socialCardNo: user.social_card_no
    }
  }, '登录成功'));
});

router.post('/social-card-login', (req, res) => {
  const { cardNo, password } = req.body;
  if (!cardNo) {
    return res.json(error('社保卡号不能为空', 400));
  }
  
  const card = getOne('SELECT * FROM social_cards WHERE card_no = ?', [cardNo]);
  if (!card) {
    return res.json(error('社保卡不存在', 404));
  }
  if (card.status !== 'active' || card.loss_reported === 1) {
    return res.json(error('社保卡状态异常，请先挂失或解锁', 403));
  }
  
  const user = getOne('SELECT * FROM users WHERE id = ?', [card.user_id]);
  if (!user || user.status !== 1) {
    return res.json(error('用户不存在或已禁用', 404));
  }

  if (password && !bcrypt.compareSync(password, user.password)) {
    return res.json(error('密码错误', 401));
  }

  const token = generateToken(user);
  query(
    'INSERT INTO operation_logs (user_id, user_type, module, operation, ip) VALUES (?, ?, \'auth\', \'社保卡登录\', ?)',
    [user.id, user.user_type, req.ip]
  );

  res.json(success({
    token,
    user: {
      id: user.id,
      idCard: user.id_card,
      name: user.name,
      phone: user.phone,
      userType: user.user_type,
      socialCardNo: card.card_no
    }
  }, '社保卡登录成功'));
});

router.get('/current-user', auth, (req, res) => {
  const user = getOne('SELECT * FROM users WHERE id = ?', [req.user.userId]);
  if (!user) {
    return res.json(error('用户不存在', 404));
  }
  res.json(success({
    id: user.id,
    idCard: user.id_card,
    name: user.name,
    phone: user.phone,
    userType: user.user_type,
    socialCardNo: user.social_card_no
  }));
});

router.post('/logout', auth, (req, res) => {
  query(
    'INSERT INTO operation_logs (user_id, user_type, module, operation, ip) VALUES (?, ?, \'auth\', \'登出\', ?)',
    [req.user.userId, req.user.userType, req.ip]
  );
  res.json(success(null, '登出成功'));
});

module.exports = router;
