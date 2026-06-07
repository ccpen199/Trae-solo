import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDB } from '../db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const { user_type, role, department_id, status, keyword, page = 1, pageSize = 20 } = req.query;
    const db = getDB();
    const conditions = [];
    const params = [];

    if (user_type) {
      conditions.push('u.user_type = ?');
      params.push(user_type);
    }
    if (role) {
      conditions.push('u.role = ?');
      params.push(role);
    }
    if (department_id) {
      conditions.push('u.department_id = ?');
      params.push(department_id);
    }
    if (status) {
      conditions.push('u.status = ?');
      params.push(status);
    }
    if (keyword) {
      conditions.push('(u.username LIKE ? OR u.real_name LIKE ? OR u.phone LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const total = db.prepare(`SELECT COUNT(*) as cnt FROM users u ${where}`).get(...params).cnt;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const list = db.prepare(`
      SELECT u.id, u.username, u.real_name, u.id_number, u.phone, u.email,
        u.user_type, u.department_id, u.role, u.avatar, u.status,
        u.last_login_at, u.created_at, u.updated_at,
        d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      ${where}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize), offset);

    res.json({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = getDB();
    const user = db.prepare(`
      SELECT u.id, u.username, u.real_name, u.id_number, u.phone, u.email,
        u.user_type, u.department_id, u.role, u.avatar, u.status,
        u.last_login_at, u.created_at, u.updated_at,
        d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `).get(req.params.id);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', roleMiddleware('admin', 'super_admin'), (req, res) => {
  try {
    const db = getDB();
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const { role, status, department_id, real_name, phone, email } = req.body;

    if (role && !['user', 'operator', 'reviewer', 'admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ error: '无效的角色' });
    }
    if (status && !['active', 'disabled', 'locked'].includes(status)) {
      return res.status(400).json({ error: '无效的状态' });
    }

    db.prepare(`
      UPDATE users SET
        role = COALESCE(?, role),
        status = COALESCE(?, status),
        department_id = COALESCE(?, department_id),
        real_name = COALESCE(?, real_name),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        updated_at = datetime('now','localtime')
      WHERE id = ?
    `).run(role || null, status || null, department_id !== undefined ? department_id : null,
      real_name || null, phone || null, email || null, req.params.id);

    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/password', (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) {
      return res.status(400).json({ error: '旧密码和新密码不能为空' });
    }

    const db = getDB();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user.id !== parseInt(req.params.id)) {
      const valid = bcrypt.compareSync(old_password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: '旧密码错误' });
      }
    }

    const hash = bcrypt.hashSync(new_password, 10);
    db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now','localtime') WHERE id = ?").run(hash, req.params.id);

    res.json({ message: '密码修改成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
