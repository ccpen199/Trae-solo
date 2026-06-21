const db = require('../config/database');
const { generateToken, hashPassword, comparePassword, generateOTP, getClientIp, validateIMEI, generateTemporaryToken } = require('../utils/common');
const axios = require('axios');

const ROLE_HIERARCHY = {
  owner: ['owner', 'member', 'guest'],
  member: ['member', 'guest'],
  guest: ['guest']
};

class UserController {
  async login(req, res) {
    try {
      const { username, password, imei, deviceModel, captcha } = req.body;
      if (!username || !password) {
        return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
      }

      const user = db.prepare('SELECT * FROM users WHERE username = ? OR phone = ? OR email = ?').get(username, username, username);
      const ip = getClientIp(req);
      const userAgent = req.headers['user-agent'] || '';
      let riskLevel = 'low';
      let location = '';

      try {
        const geoRes = await axios.get(`http://ip-api.com/json/${ip}?lang=zh-CN`, { timeout: 2000 });
        if (geoRes.data && geoRes.data.status === 'success') {
          location = `${geoRes.data.country}${geoRes.data.regionName}${geoRes.data.city}`;
        }
      } catch (e) {}

      if (!user) {
        db.prepare(`INSERT INTO login_logs (username, ip, user_agent, location, status, risk_level, fail_reason) VALUES (?, ?, ?, ?, 0, ?, ?)`).run(username, ip, userAgent, location, 'medium', '用户不存在');
        return res.status(401).json({ code: 401, message: '用户名或密码错误' });
      }

      if (user.status !== 1) {
        db.prepare(`INSERT INTO login_logs (user_id, username, ip, user_agent, location, status, risk_level, fail_reason) VALUES (?, ?, ?, ?, ?, 0, ?, ?)`).run(user.id, username, ip, userAgent, location, 'high', '账号已禁用');
        return res.status(403).json({ code: 403, message: '账号已被禁用' });
      }

      if (!comparePassword(password, user.password)) {
        db.prepare(`INSERT INTO login_logs (user_id, username, ip, user_agent, location, status, risk_level, fail_reason) VALUES (?, ?, ?, ?, ?, 0, ?, ?)`).run(user.id, username, ip, userAgent, location, 'medium', '密码错误');
        return res.status(401).json({ code: 401, message: '用户名或密码错误' });
      }

      if (imei) {
        if (!validateIMEI(imei)) {
          riskLevel = 'high';
          db.prepare(`INSERT INTO login_logs (user_id, username, ip, user_agent, location, status, risk_level, fail_reason) VALUES (?, ?, ?, ?, ?, 0, ?, ?)`).run(user.id, username, ip, userAgent, location, 'high', 'IMEI格式无效');
        } else {
          const existingDevice = db.prepare('SELECT * FROM user_devices WHERE user_id = ? AND imei = ?').get(user.id, imei);
          if (!existingDevice) {
            db.prepare('INSERT INTO user_devices (user_id, imei, device_model, last_login_at, is_trusted) VALUES (?, ?, ?, ?, 0)').run(user.id, imei, deviceModel || '', new Date().toISOString());
            riskLevel = 'medium';
          } else {
            db.prepare('UPDATE user_devices SET last_login_at = ?, device_model = COALESCE(?, device_model) WHERE id = ?').run(new Date().toISOString(), deviceModel, existingDevice.id);
            if (!existingDevice.is_trusted) riskLevel = 'medium';
          }
        }
      }

      db.prepare(`INSERT INTO login_logs (user_id, username, ip, user_agent, location, status, risk_level) VALUES (?, ?, ?, ?, ?, 1, ?)`).run(user.id, username, ip, userAgent, location, riskLevel);

      const token = generateToken(user);

      res.json({
        code: 200,
        message: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            nickname: user.nickname,
            role: user.role,
            phone: user.phone,
            email: user.email,
            avatar: user.avatar
          },
          riskLevel
        }
      });
    } catch (e) {
      console.error('Login error:', e);
      res.status(500).json({ code: 500, message: '登录服务异常' });
    }
  }

  async register(req, res) {
    try {
      const { username, password, phone, email, nickname, code } = req.body;
      if (!username || !password) {
        return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
      }

      if (password.length < 8) {
        return res.status(400).json({ code: 400, message: '密码长度至少8位' });
      }

      const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
      if (exists) {
        return res.status(400).json({ code: 400, message: '用户名已存在' });
      }

      if (phone) {
        const phoneExists = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
        if (phoneExists) return res.status(400).json({ code: 400, message: '手机号已被注册' });
      }

      const hashedPwd = hashPassword(password);
      const result = db.prepare(`
        INSERT INTO users (username, password, phone, email, nickname, role)
        VALUES (?, ?, ?, ?, ?, 'owner')
      `).run(username, hashedPwd, phone || null, email || null, nickname || username);

      const user = db.prepare('SELECT id, username, nickname, role, phone, email FROM users WHERE id = ?').get(result.lastInsertRowid);
      const token = generateToken(user);

      res.json({
        code: 200,
        message: '注册成功',
        data: { token, user }
      });
    } catch (e) {
      console.error('Register error:', e);
      res.status(500).json({ code: 500, message: '注册服务异常' });
    }
  }

  async logout(req, res) {
    try {
      res.json({ code: 200, message: '退出成功' });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async getCurrentUser(req, res) {
    try {
      const user = db.prepare('SELECT id, username, nickname, role, phone, email, avatar, status, created_at FROM users WHERE id = ?').get(req.user.id);
      res.json({ code: 200, data: user });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async updateProfile(req, res) {
    try {
      const { nickname, phone, email, avatar } = req.body;
      db.prepare(`
        UPDATE users SET nickname = COALESCE(?, nickname), 
        phone = COALESCE(?, phone), 
        email = COALESCE(?, email),
        avatar = COALESCE(?, avatar),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(nickname || null, phone || null, email || null, avatar || null, req.user.id);

      const user = db.prepare('SELECT id, username, nickname, role, phone, email, avatar FROM users WHERE id = ?').get(req.user.id);
      res.json({ code: 200, message: '更新成功', data: user });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword || newPassword.length < 8) {
        return res.status(400).json({ code: 400, message: '参数无效，新密码至少8位' });
      }

      const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
      if (!comparePassword(oldPassword, user.password)) {
        return res.status(400).json({ code: 400, message: '原密码错误' });
      }

      db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hashPassword(newPassword), req.user.id);
      res.json({ code: 200, message: '密码修改成功' });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async createSubAccount(req, res) {
    try {
      if (req.user.role !== 'owner') {
        return res.status(403).json({ code: 403, message: '仅主账号可创建子账号' });
      }

      const { username, password, phone, nickname, role = 'member' } = req.body;
      if (!username || !password) {
        return res.status(400).json({ code: 400, message: '必填参数缺失' });
      }

      if (!['member', 'guest'].includes(role)) {
        return res.status(400).json({ code: 400, message: '角色无效' });
      }

      const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
      if (exists) return res.status(400).json({ code: 400, message: '用户名已存在' });

      const result = db.prepare(`
        INSERT INTO users (username, password, phone, nickname, role, parent_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(username, hashPassword(password), phone || null, nickname || username, role, req.user.id);

      const user = db.prepare('SELECT id, username, nickname, role, phone, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
      res.json({ code: 200, message: '创建成功', data: user });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async listSubAccounts(req, res) {
    try {
      if (req.user.role !== 'owner') {
        return res.status(403).json({ code: 403, message: '无权限' });
      }

      const { page = 1, pageSize = 20 } = req.query;
      const offset = (page - 1) * pageSize;

      const users = db.prepare(`
        SELECT id, username, nickname, role, phone, email, status, created_at
        FROM users WHERE parent_id = ? OR (parent_id IN (SELECT id FROM users WHERE parent_id = ?))
        ORDER BY created_at DESC LIMIT ? OFFSET ?
      `).all(req.user.id, req.user.id, pageSize, offset);

      const total = db.prepare('SELECT COUNT(*) as count FROM users WHERE parent_id = ?').get(req.user.id).count;

      res.json({ code: 200, data: { list: users, total, page: +page, pageSize: +pageSize } });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async updateSubAccount(req, res) {
    try {
      const { id } = req.params;
      const { nickname, role, status, phone } = req.body;

      const account = db.prepare('SELECT * FROM users WHERE id = ? AND parent_id = ?').get(id, req.user.id);
      if (!account) return res.status(404).json({ code: 404, message: '子账号不存在' });

      db.prepare(`
        UPDATE users SET nickname = COALESCE(?, nickname),
        role = COALESCE(?, role),
        status = COALESCE(?, status),
        phone = COALESCE(?, phone),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(nickname || null, role || null, status !== undefined ? status : null, phone || null, id);

      res.json({ code: 200, message: '更新成功' });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async deleteSubAccount(req, res) {
    try {
      const { id } = req.params;
      const account = db.prepare('SELECT * FROM users WHERE id = ? AND parent_id = ?').get(id, req.user.id);
      if (!account) return res.status(404).json({ code: 404, message: '子账号不存在' });

      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      res.json({ code: 200, message: '删除成功' });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async listLoginLogs(req, res) {
    try {
      const { page = 1, pageSize = 20, status } = req.query;
      const offset = (page - 1) * pageSize;
      let where = 'WHERE user_id = ?';
      const params = [req.user.id];

      if (status !== undefined) {
        where += ' AND status = ?';
        params.push(+status);
      }

      const logs = db.prepare(`
        SELECT id, username, ip, location, status, risk_level, fail_reason, created_at
        FROM login_logs ${where}
        ORDER BY created_at DESC LIMIT ? OFFSET ?
      `).all(...params, pageSize, offset);

      const total = db.prepare(`SELECT COUNT(*) as count FROM login_logs ${where}`).get(...params).count;

      res.json({ code: 200, data: { list: logs, total, page: +page, pageSize: +pageSize } });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async verifyTrustedDevice(req, res) {
    try {
      const { deviceId, isTrusted } = req.body;
      const device = db.prepare('SELECT * FROM user_devices WHERE id = ? AND user_id = ?').get(deviceId, req.user.id);
      if (!device) return res.status(404).json({ code: 404, message: '设备不存在' });

      db.prepare('UPDATE user_devices SET is_trusted = ? WHERE id = ?').run(isTrusted ? 1 : 0, deviceId);
      res.json({ code: 200, message: '操作成功' });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }

  async listTrustedDevices(req, res) {
    try {
      const devices = db.prepare('SELECT * FROM user_devices WHERE user_id = ? ORDER BY last_login_at DESC').all(req.user.id);
      res.json({ code: 200, data: devices });
    } catch (e) {
      res.status(500).json({ code: 500, message: '服务异常' });
    }
  }
}

module.exports = new UserController();
