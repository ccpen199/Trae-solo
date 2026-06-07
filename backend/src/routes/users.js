import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/init.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const rolePermissions = {
  admin: {
    label: '系统管理员',
    color: 'red',
    description: '拥有系统全部权限，可管理所有用户、设备、账户及所有配置',
    menus: ['dashboard', 'users', 'obu', 'accounts', 'toll', 'exceptions', 'disputes', 'operations', 'settlements', 'openapi', 'audit-logs']
  },
  platform: {
    label: '运营平台',
    color: 'blue',
    description: '运营管理权限，可查看运营数据、处理异常、管理结算、配置策略，无用户增删权限',
    menus: ['dashboard', 'users:view', 'obu', 'accounts', 'toll', 'exceptions', 'disputes', 'operations', 'settlements', 'openapi', 'audit-logs']
  },
  operator: {
    label: '运维操作员',
    color: 'purple',
    description: '运维操作权限，可进行设备激活、升级、数据质量监控等技术操作',
    menus: ['dashboard', 'obu', 'accounts', 'toll', 'exceptions', 'disputes', 'operations']
  },
  owner: {
    label: '车主',
    color: 'green',
    description: '车主自助服务权限，可申领OBU、充值、查询通行记录、发起争议申诉',
    menus: ['dashboard', 'obu:apply', 'accounts', 'toll', 'disputes:create']
  },
  fleet_admin: {
    label: '车队管理者',
    color: 'orange',
    description: '车队管理权限，可管理多车辆账户、批量充值、查看车队通行数据',
    menus: ['dashboard', 'obu:apply', 'accounts', 'toll', 'disputes:create']
  }
};

router.get('/roles', authMiddleware, (req, res) => {
  res.json({ roles: rolePermissions });
});

router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const offset = (page - 1) * pageSize;

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (username LIKE ? OR real_name LIKE ? OR phone LIKE ? OR vehicle_plate LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (role) {
      where += ' AND role = ?';
      params.push(role);
    }

    const total = db.prepare(`SELECT COUNT(*) AS count FROM users ${where}`).get(...params).count;
    const list = db.prepare(`SELECT * FROM users ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset);

    const safeList = list.map(({ password_hash, ...rest }) => rest);

    res.json({ list: safeList, total, page, pageSize });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    const { password_hash, ...userInfo } = user;
    res.json(userInfo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { username, password, real_name, phone, id_card, role, vehicle_plate, fleet_name } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(409).json({ error: '用户名已存在' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (username, password_hash, real_name, phone, id_card, role, vehicle_plate, fleet_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(username, password_hash, real_name || null, phone || null, id_card || null, role || 'owner', vehicle_plate || null, fleet_name || null);

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'create_user', 'user', result.lastInsertRowid, JSON.stringify({ username, role }), req.ip);

    res.status(201).json({ id: result.lastInsertRowid, message: '用户创建成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const { real_name, phone, id_card, role, vehicle_plate, fleet_name, status } = req.body;
    db.prepare(`
      UPDATE users SET real_name = ?, phone = ?, id_card = ?, role = ?, vehicle_plate = ?, fleet_name = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      real_name !== undefined ? real_name : user.real_name,
      phone !== undefined ? phone : user.phone,
      id_card !== undefined ? id_card : user.id_card,
      role !== undefined ? role : user.role,
      vehicle_plate !== undefined ? vehicle_plate : user.vehicle_plate,
      fleet_name !== undefined ? fleet_name : user.fleet_name,
      status !== undefined ? status : user.status,
      req.params.id
    );

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'update_user', 'user', parseInt(req.params.id), JSON.stringify(req.body), req.ip);

    res.json({ message: '用户更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const confirmation = req.query.confirm;
    const accountCount = db.prepare('SELECT COUNT(*) AS count FROM etc_accounts WHERE user_id = ?').get(req.params.id).count;
    const deviceCount = db.prepare('SELECT COUNT(*) AS count FROM obu_devices WHERE user_id = ?').get(req.params.id).count;
    const activeTollCount = db.prepare('SELECT COUNT(*) AS count FROM toll_records t JOIN etc_accounts a ON t.account_id = a.id WHERE a.user_id = ? AND t.exit_time >= DATE(\'now\', \'-30 days\')').get(req.params.id).count;

    if (confirmation !== 'yes') {
      return res.status(400).json({
        error: '停用确认',
        username: user.username,
        role: user.role,
        linked_accounts: accountCount,
        linked_devices: deviceCount,
        recent_toll_records: activeTollCount,
        warning: `停用该用户将影响其名下 ${accountCount} 个ETC账户、${deviceCount} 台OBU设备的使用，近30天有 ${activeTollCount} 条通行记录`,
        confirm: '请确认后再次调用，请求添加 ?confirm=yes'
      });
    }

    db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('disabled', req.params.id);

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'disable_user', 'user', parseInt(req.params.id),
        JSON.stringify({
          username: user.username,
          role: user.role,
          linked_accounts: accountCount,
          linked_devices: deviceCount,
          recent_toll_records: activeTollCount,
          status: 'disabled'
        }), req.ip);

    res.json({
      message: '用户已停用，操作已记录审计日志',
      username: user.username,
      linked_accounts: accountCount,
      linked_devices: deviceCount,
      audit_recorded: true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
