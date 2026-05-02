const { get, run } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const ROLE_NAMES = {
  'design_operation': '设计运营',
  'creator': '创作者',
  'merchant': '商家',
  'auditor': '审核',
  'admin': '管理员'
};

exports.login = (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  
  try {
    const user = get('SELECT * FROM users WHERE username = ?', [username]);
    
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        role: user.role,
        roleName: ROLE_NAMES[user.role] || user.role,
        email: user.email
      }
    });
  } catch (err) {
    console.error('登录查询错误:', err);
    return res.status(500).json({ error: '服务器错误' });
  }
};

exports.register = (req, res) => {
  const { username, password, nickname, email, role } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  try {
    const result = run(
      `INSERT INTO users (username, password, nickname, email, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [username, hashedPassword, nickname || username, email, role || 'merchant']
    );
    
    res.json({
      id: result.lastInsertRowid,
      username,
      nickname: nickname || username,
      role: role || 'merchant'
    });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ error: '用户名已存在' });
    }
    console.error('注册错误:', err);
    return res.status(500).json({ error: '服务器错误' });
  }
};

exports.getCurrentUser = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: '未登录' });
  }
  
  res.json({
    ...req.user,
    roleName: ROLE_NAMES[req.user.role] || req.user.role
  });
};

exports.getRoleInfo = (req, res) => {
  res.json(ROLE_NAMES);
};
