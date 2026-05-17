const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { run, get } = require('../utils/db');
const { success, error } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'library_secret_key_2024_05_16';

const login = async (req, res) => {
  try {
    const { account, password } = req.body;

    if (!account || !password) {
      return error(res, '账号和密码不能为空');
    }

    const user = await get(
      'SELECT * FROM users WHERE username = ? OR phone = ?',
      [account, account]
    );

    if (!user) {
      return error(res, '用户不存在');
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      return error(res, '密码错误');
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    success(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        is_vip: user.is_vip,
        vip_expire_at: user.vip_expire_at
      }
    }, '登录成功');
  } catch (err) {
    console.error('登录错误:', err);
    error(res, '登录失败，请稍后重试');
  }
};

const register = async (req, res) => {
  try {
    const { username, phone, password, nickname } = req.body;

    if (!username || !phone || !password) {
      return error(res, '用户名、手机号和密码不能为空');
    }

    const existingUser = await get(
      'SELECT id FROM users WHERE username = ? OR phone = ?',
      [username, phone]
    );

    if (existingUser) {
      return error(res, '用户名或手机号已存在');
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await run(
      'INSERT INTO users (username, phone, password, nickname) VALUES (?, ?, ?, ?)',
      [username, phone, hashedPassword, nickname || username]
    );

    const token = jwt.sign({ userId: result.lastID }, JWT_SECRET, { expiresIn: '7d' });
    const user = await get('SELECT id, username, phone, nickname, avatar, is_vip FROM users WHERE id = ?', [result.lastID]);

    success(res, { token, user }, '注册成功');
  } catch (err) {
    console.error('注册错误:', err);
    error(res, '注册失败，请稍后重试');
  }
};

const getCurrentUser = async (req, res) => {
  try {
    success(res, { user: req.user }, '获取成功');
  } catch (err) {
    console.error('获取用户信息错误:', err);
    error(res, '获取失败');
  }
};

const thirdPartyAuth = async (req, res) => {
  try {
    const { platform, openId, nickname, avatar } = req.body;

    if (!platform || !openId) {
      return error(res, '参数不完整');
    }

    let user = await get('SELECT * FROM users WHERE third_party_platform = ? AND third_party_openid = ?', [platform, openId]);

    if (!user) {
      const username = `${platform}_${openId.slice(0, 8)}`;
      const hashedPassword = bcrypt.hashSync('default_password', 10);
      const result = await run(
        'INSERT INTO users (username, password, nickname, avatar, third_party_platform, third_party_openid) VALUES (?, ?, ?, ?, ?, ?)',
        [username, hashedPassword, nickname || username, avatar || '', platform, openId]
      );
      user = await get('SELECT * FROM users WHERE id = ?', [result.lastID]);
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    success(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        is_vip: user.is_vip
      }
    }, '登录成功');
  } catch (err) {
    console.error('第三方登录错误:', err);
    error(res, '登录失败，请稍后重试');
  }
};

module.exports = { login, register, getCurrentUser, thirdPartyAuth };
