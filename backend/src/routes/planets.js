const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../database/init');
const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, type } = req.query;
    const offset = (page - 1) * pageSize;

    let query = `
      SELECT p.*, u.nickname as owner_name, u.avatar as owner_avatar,
             CASE WHEN pm.id IS NOT NULL THEN 1 ELSE 0 END as is_joined
      FROM planets p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN planet_members pm ON p.id = pm.planet_id AND pm.user_id = ?
      WHERE p.status = 'active'
    `;
    let params = [req.user.id];

    if (keyword) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (type === 'joined') {
      query += ' AND pm.id IS NOT NULL';
    } else if (type === 'owned') {
      query += ' AND p.owner_id = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const planets = db.prepare(query).all(...params);

    const totalResult = db.prepare("SELECT COUNT(*) as total FROM planets WHERE status = 'active'").get();

    res.json({
      success: true,
      data: {
        list: planets,
        total: totalResult?.total || 0,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取星球列表失败:', error);
    res.json({ success: false, message: '获取星球列表失败' });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const planet = db.prepare(`
      SELECT p.*, u.nickname as owner_name, u.avatar as owner_avatar,
             CASE WHEN pm.id IS NOT NULL THEN 1 ELSE 0 END as is_joined,
             pm.role as member_role
      FROM planets p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN planet_members pm ON p.id = pm.planet_id AND pm.user_id = ?
      WHERE p.id = ?
    `).get(req.user.id, req.params.id);

    if (!planet) {
      return res.json({ success: false, message: '星球不存在' });
    }
    res.json({ success: true, data: planet });
  } catch (error) {
    console.error('获取星球信息失败:', error);
    res.json({ success: false, message: '获取星球信息失败' });
  }
});

router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, description, join_type = 'free', price = 0, is_private = 0 } = req.body;

    if (!name) {
      return res.json({ success: false, message: '请输入星球名称' });
    }

    const insertPlanet = db.prepare(`
      INSERT INTO planets (name, description, owner_id, join_type, price, is_private)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = insertPlanet.run(name, description || '', req.user.id, join_type, price, is_private ? 1 : 0);
    const planetId = result.lastInsertRowid;

    db.prepare('INSERT INTO planet_members (planet_id, user_id, role) VALUES (?, ?, ?)').run(planetId, req.user.id, 'owner');
    db.prepare('UPDATE planets SET member_count = 1 WHERE id = ?').run(planetId);

    res.json({
      success: true,
      message: '创建星球成功',
      data: { id: planetId }
    });
  } catch (error) {
    console.error('创建星球失败:', error);
    res.json({ success: false, message: '创建星球失败' });
  }
});

router.post('/:id/join', authenticateToken, (req, res) => {
  try {
    const planetId = req.params.id;
    const { invite_code } = req.body;

    const planet = db.prepare("SELECT * FROM planets WHERE id = ? AND status = 'active'").get(planetId);
    if (!planet) {
      return res.json({ success: false, message: '星球不存在' });
    }

    const existingMember = db.prepare('SELECT id FROM planet_members WHERE planet_id = ? AND user_id = ?').get(planetId, req.user.id);
    if (existingMember) {
      return res.json({ success: false, message: '已经加入该星球' });
    }

    let inviterId = null;
    if (invite_code) {
      const code = db.prepare("SELECT * FROM invite_codes WHERE code = ? AND status = 'active'").get(invite_code);
      if (code && code.used_count < code.max_count) {
        inviterId = code.user_id;
      }
    }

    db.prepare('INSERT INTO planet_members (planet_id, user_id, inviter_id) VALUES (?, ?, ?)').run(planetId, req.user.id, inviterId);
    db.prepare('UPDATE planets SET member_count = member_count + 1 WHERE id = ?').run(planetId);

    if (inviterId && invite_code) {
      db.prepare('UPDATE invite_codes SET used_count = used_count + 1 WHERE code = ?').run(invite_code);
    }

    res.json({ success: true, message: '加入星球成功' });
  } catch (error) {
    console.error('加入星球失败:', error);
    res.json({ success: false, message: '加入星球失败' });
  }
});

router.post('/:id/invite-code', authenticateToken, (req, res) => {
  try {
    const planetId = req.params.id;
    const { max_count = 10, reward_amount = 0 } = req.body;

    const member = db.prepare("SELECT id FROM planet_members WHERE planet_id = ? AND user_id = ? AND role IN ('owner', 'admin')").get(planetId, req.user.id);
    if (!member) {
      return res.json({ success: false, message: '没有权限生成邀请码' });
    }

    const code = 'INV-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    
    const result = db.prepare('INSERT INTO invite_codes (planet_id, user_id, code, max_count, reward_amount) VALUES (?, ?, ?, ?, ?)').run(planetId, req.user.id, code, max_count, reward_amount);

    res.json({ success: true, data: { code, id: result.lastInsertRowid } });
  } catch (error) {
    console.error('生成邀请码失败:', error);
    res.json({ success: false, message: '生成邀请码失败' });
  }
});

router.get('/:id/invite-codes', authenticateToken, (req, res) => {
  try {
    const planetId = req.params.id;
    
    const codes = db.prepare('SELECT * FROM invite_codes WHERE planet_id = ? AND user_id = ? ORDER BY created_at DESC').all(planetId, req.user.id);
    res.json({ success: true, data: codes || [] });
  } catch (error) {
    console.error('获取邀请码失败:', error);
    res.json({ success: false, message: '获取邀请码失败' });
  }
});

module.exports = router;
