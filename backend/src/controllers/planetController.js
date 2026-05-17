const db = require('../models/database');
const { validationResult } = require('express-validator');

const createPlanet = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg
    });
  }

  const { name, description, cover, join_type, price, invite_reward, is_public } = req.body;
  const userId = req.user.id;

  try {
    const isPublicValue = is_public === true ? 1 : is_public === false ? 0 : (is_public ?? 1);
    const result = db.prepare(
      'INSERT INTO planets (name, description, cover, owner_id, join_type, price, invite_reward, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(name, description || '', cover || '', userId, join_type || 'free', price || 0, invite_reward || 0, isPublicValue);

    const planetId = result.lastInsertRowid;

    db.prepare(
      'INSERT INTO planet_members (planet_id, user_id, role) VALUES (?, ?, ?)'
    ).run(planetId, userId, 'owner');

    const planet = db.prepare('SELECT * FROM planets WHERE id = ?').get(planetId);

    res.json({
      success: true,
      data: planet,
      message: '星球创建成功'
    });
  } catch (error) {
    console.error('创建星球错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const getPlanets = (req, res) => {
  const { page = 1, pageSize = 20, type = 'all' } = req.query;
  const userId = req.user?.id;
  const offset = (page - 1) * pageSize;

  try {
    let planets, total;

    if (type === 'joined' && userId) {
      planets = db.prepare(`
        SELECT p.*, pm.role as user_role, 1 as is_member, pm.joined_at 
        FROM planets p 
        JOIN planet_members pm ON p.id = pm.planet_id 
        WHERE pm.user_id = ? 
        ORDER BY p.created_at DESC 
        LIMIT ? OFFSET ?
      `).all(userId, parseInt(pageSize), offset);

      total = db.prepare(`
        SELECT COUNT(*) as count 
        FROM planets p 
        JOIN planet_members pm ON p.id = pm.planet_id 
        WHERE pm.user_id = ?
      `).get(userId).count;
    } else if (type === 'owned' && userId) {
      planets = db.prepare(`
        SELECT p.*, 'owner' as user_role, 1 as is_member
        FROM planets p 
        WHERE p.owner_id = ? 
        ORDER BY p.created_at DESC 
        LIMIT ? OFFSET ?
      `).all(userId, parseInt(pageSize), offset);

      total = db.prepare('SELECT COUNT(*) as count FROM planets WHERE owner_id = ?').get(userId).count;
    } else {
      const params = [];
      
      if (userId) {
        params.push(userId);
      } else {
        params.push(0);
      }
      params.push(parseInt(pageSize), offset);

      planets = db.prepare(`
        SELECT p.*, 
          CASE WHEN pm.user_id IS NOT NULL THEN pm.role ELSE NULL END as user_role,
          CASE WHEN pm.user_id IS NOT NULL THEN 1 ELSE 0 END as is_member
        FROM planets p 
        LEFT JOIN planet_members pm ON p.id = pm.planet_id AND pm.user_id = ?
        WHERE p.is_public = 1
        ORDER BY p.member_count DESC 
        LIMIT ? OFFSET ?
      `).all(...params);

      total = db.prepare('SELECT COUNT(*) as count FROM planets WHERE is_public = 1').get().count;
    }

    res.json({
      success: true,
      data: {
        list: planets,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取星球列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const getPlanetById = (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const planet = db.prepare(`
      SELECT p.*, u.nickname as owner_name, u.avatar as owner_avatar,
        CASE WHEN pm.user_id IS NOT NULL THEN pm.role ELSE NULL END as user_role
      FROM planets p 
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN planet_members pm ON p.id = pm.planet_id AND pm.user_id = ?
      WHERE p.id = ?
    `).get(userId || 0, id);

    if (!planet) {
      return res.status(404).json({
        success: false,
        message: '星球不存在'
      });
    }

    res.json({
      success: true,
      data: planet
    });
  } catch (error) {
    console.error('获取星球详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const joinPlanet = (req, res) => {
  const { planet_id, invite_code } = req.body;
  const userId = req.user.id;

  try {
    const planet = db.prepare('SELECT * FROM planets WHERE id = ?').get(planet_id);
    if (!planet) {
      return res.status(404).json({
        success: false,
        message: '星球不存在'
      });
    }

    const existingMember = db.prepare('SELECT * FROM planet_members WHERE planet_id = ? AND user_id = ?').get(planet_id, userId);
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: '已经是该星球成员'
      });
    }

    let inviteBy = null;

    if (invite_code) {
      const invite = db.prepare('SELECT * FROM invites WHERE invite_code = ? AND planet_id = ?').get(invite_code, planet_id);
      if (!invite) {
        return res.status(400).json({
          success: false,
          message: '邀请码无效'
        });
      }

      if (invite.used_count >= invite.max_uses) {
        return res.status(400).json({
          success: false,
          message: '邀请码已达到使用上限'
        });
      }

      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        return res.status(400).json({
          success: false,
          message: '邀请码已过期'
        });
      }

      inviteBy = invite.inviter_id;

      db.prepare('UPDATE invites SET used_count = used_count + 1 WHERE id = ?').run(invite.id);

      if (planet.invite_reward > 0) {
        db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(planet.invite_reward, inviteBy);
      }
    }

    if (planet.join_type === 'paid' && planet.price > 0) {
      const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
      if (user.balance < planet.price) {
        return res.status(400).json({
          success: false,
          message: '余额不足，请先充值'
        });
      }
      db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(planet.price, userId);
    }

    db.prepare(
      'INSERT INTO planet_members (planet_id, user_id, role, invite_by) VALUES (?, ?, ?, ?)'
    ).run(planet_id, userId, 'member', inviteBy);

    db.prepare('UPDATE planets SET member_count = member_count + 1 WHERE id = ?').run(planet_id);

    res.json({
      success: true,
      message: '加入星球成功'
    });
  } catch (error) {
    console.error('加入星球错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const createInviteCode = (req, res) => {
  const { planet_id, max_uses = 10, expires_at } = req.body;
  const userId = req.user.id;

  try {
    const member = db.prepare('SELECT * FROM planet_members WHERE planet_id = ? AND user_id = ?').get(planet_id, userId);
    if (!member) {
      return res.status(403).json({
        success: false,
        message: '只有星球成员才能创建邀请码'
      });
    }

    const inviteCode = 'INV_' + Math.random().toString(36).substring(2, 10).toUpperCase();

    const result = db.prepare(
      'INSERT INTO invites (planet_id, inviter_id, invite_code, max_uses, expires_at) VALUES (?, ?, ?, ?, ?)'
    ).run(planet_id, userId, inviteCode, max_uses, expires_at || null);

    const invite = db.prepare('SELECT * FROM invites WHERE id = ?').get(result.lastInsertRowid);

    res.json({
      success: true,
      data: invite,
      message: '邀请码创建成功'
    });
  } catch (error) {
    console.error('创建邀请码错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const searchPlanets = (req, res) => {
  const { keyword, page = 1, pageSize = 20 } = req.query;
  const userId = req.user?.id;
  const offset = (page - 1) * pageSize;

  if (!keyword) {
    return res.status(400).json({
      success: false,
      message: '搜索关键词不能为空'
    });
  }

  try {
    const searchKeyword = `%${keyword}%`;

    const planets = db.prepare(`
      SELECT p.*, 
        CASE WHEN pm.user_id IS NOT NULL THEN pm.role ELSE NULL END as user_role,
        CASE WHEN pm.user_id IS NOT NULL THEN 1 ELSE 0 END as is_member
      FROM planets p 
      LEFT JOIN planet_members pm ON p.id = pm.planet_id AND pm.user_id = ?
      WHERE p.is_public = 1 AND (p.name LIKE ? OR p.description LIKE ?)
      ORDER BY p.member_count DESC 
      LIMIT ? OFFSET ?
    `).all(userId || 0, searchKeyword, searchKeyword, parseInt(pageSize), offset);

    const total = db.prepare(`
      SELECT COUNT(*) as count 
      FROM planets 
      WHERE is_public = 1 AND (name LIKE ? OR description LIKE ?)
    `).get(searchKeyword, searchKeyword).count;

    res.json({
      success: true,
      data: {
        list: planets,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('搜索星球错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

module.exports = {
  createPlanet,
  getPlanets,
  getPlanetById,
  joinPlanet,
  createInviteCode,
  searchPlanets
};
