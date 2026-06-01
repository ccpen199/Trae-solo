const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { success, error } = require('../utils/response');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE username = ? OR phone = ?').get(username, username);
    
    if (!user) {
      return res.status(401).json(error('用户名或密码错误'));
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json(error('用户名或密码错误'));
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'waterdrop-secret-key-2024',
      { expiresIn: '7d' }
    );

    res.json(success({
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        bio: user.bio
      }
    }, '登录成功'));
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json(error('登录失败'));
  }
};

const register = async (req, res) => {
  try {
    const { username, nickname, password, phone, code } = req.body;

    if (!username || !nickname || !password) {
      return res.status(400).json(error('请填写完整信息'));
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json(error('用户名已存在'));
    }

    const existingNickname = db.prepare('SELECT id FROM users WHERE nickname = ?').get(nickname);
    if (existingNickname) {
      return res.status(400).json(error('昵称已被使用'));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = db.prepare('INSERT INTO users (username, nickname, password, phone) VALUES (?, ?, ?, ?)').run(username, nickname, hashedPassword, phone);

    const token = jwt.sign(
      { id: result.lastInsertRowid, username },
      process.env.JWT_SECRET || 'waterdrop-secret-key-2024',
      { expiresIn: '7d' }
    );

    res.json(success({
      token,
      user: {
        id: result.lastInsertRowid,
        username,
        nickname
      }
    }, '注册成功'));
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json(error('注册失败'));
  }
};

const checkNickname = (req, res) => {
  const { nickname } = req.params;
  
  const user = db.prepare('SELECT id FROM users WHERE nickname = ?').get(nickname);
  res.json(success({ available: !user }, user ? '昵称已被使用' : '昵称可用'));
};

const sendSmsCode = (req, res) => {
  const { phone } = req.body;
  const code = Math.random().toString().slice(2, 8);
  console.log(`发送验证码到 ${phone}: ${code}`);
  res.json(success({ sent: true, code }, '验证码已发送（演示环境直接返回）'));
};

const oauthLogin = (req, res) => {
  try {
    const { platform, code } = req.body;
    const openid = `${platform}_${Date.now()}`;
    
    const user = db.prepare(`SELECT * FROM users WHERE ${platform}_openid = ?`).get(openid);
    
    if (user) {
      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET || 'waterdrop-secret-key-2024',
        { expiresIn: '7d' }
      );
      return res.json(success({ token, user }, '登录成功'));
    }

    const nickname = `${platform}用户${Math.random().toString(36).slice(2, 6)}`;
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync('oauth_default', salt);

    const result = db.prepare(`INSERT INTO users (username, nickname, password, ${platform}_openid) VALUES (?, ?, ?, ?)`).run(openid, nickname, hashedPassword, openid);

    const token = jwt.sign(
      { id: result.lastInsertRowid, username: openid },
      process.env.JWT_SECRET || 'waterdrop-secret-key-2024',
      { expiresIn: '7d' }
    );

    res.json(success({
      token,
      user: { id: result.lastInsertRowid, username: openid, nickname }
    }, '登录成功'));
  } catch (err) {
    console.error('第三方登录错误:', err);
    res.status(500).json(error('登录失败'));
  }
};

module.exports = { login, register, checkNickname, sendSmsCode, oauthLogin };