const { Router } = require('express');
const jwt = require('jsonwebtoken');
const { mockUsers } = require('../data');

const JWT_SECRET = process.env.JWT_SECRET || 'chengdu_metropolitan_circle_gov_service_secret_2025';
const TOKEN_EXPIRES_IN = process.env.TOKEN_EXPIRES_IN || '7d';
const DEFAULT_PASSWORD = '123456';

const router = Router();

function findUserByIdCard(idCard) {
  return mockUsers.find((u) => u.idCard === idCard);
}

function findUserByPhone(phone) {
  return mockUsers.find((u) => u.phone === phone);
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, idCard: user.idCard, city: user.city },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ code: 401, message: '未认证，请先登录', data: null });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = mockUsers.find((u) => u.id === decoded.id);
    if (!user) {
      return res.status(401).json({ code: 401, message: '用户不存在', data: null });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: '登录已过期，请重新登录', data: null });
  }
}

router.post('/login', (req, res) => {
  const { method, idCard, phone, password } = req.body || {};
  if (!password) {
    return res.status(400).json({ code: 400, message: '请输入密码', data: null });
  }
  if (password !== DEFAULT_PASSWORD) {
    return res.status(401).json({ code: 401, message: '密码错误（默认密码：123456）', data: null });
  }

  let matchedUser;
  if (method === 'face') {
    matchedUser = mockUsers[0];
  } else if (['idcard', 'socialcard', 'medicalcard'].includes(method)) {
    if (!idCard) {
      return res.status(400).json({ code: 400, message: '请输入证件号码', data: null });
    }
    matchedUser = findUserByIdCard(idCard);
    if (!matchedUser) {
      matchedUser = {
        id: 'U' + String(Date.now()).slice(-6),
        idCard,
        name: `用户${idCard.slice(-4)}`,
        phone: '138****8888',
        city: 'chengdu',
        district: '锦江区',
        address: '四川省成都市锦江区',
        authMethod: method,
        lastLoginTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        isRealNameVerified: true,
      };
    }
  } else if (method === 'phone') {
    if (!phone) {
      return res.status(400).json({ code: 400, message: '请输入手机号', data: null });
    }
    matchedUser = findUserByPhone(phone);
    if (!matchedUser) {
      matchedUser = {
        id: 'U' + String(Date.now()).slice(-6),
        idCard: '510104********1234',
        name: `用户${phone.slice(-4)}`,
        phone,
        city: 'chengdu',
        district: '锦江区',
        address: '四川省成都市锦江区',
        authMethod: method,
        lastLoginTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        isRealNameVerified: true,
      };
    }
  } else {
    return res.status(400).json({ code: 400, message: '不支持的登录方式', data: null });
  }

  const updatedUser = {
    ...matchedUser,
    authMethod: method,
    lastLoginTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };

  const token = signToken(updatedUser);
  console.log(`[API][login] 用户 ${updatedUser.name} 通过 ${method} 登录成功`);

  res.json({
    code: 0,
    message: '登录成功',
    data: {
      token,
      user: updatedUser,
      authMethod: method,
    },
  });
});

router.post('/logout', (req, res) => {
  res.json({ code: 0, message: '退出成功', data: null });
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ code: 0, message: 'ok', data: req.user });
});

module.exports = router;
module.exports.authMiddleware = authMiddleware;
