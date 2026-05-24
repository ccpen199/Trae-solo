const express = require('express');
const db = require('../utils/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const canCreateGame = (req, res, next) => {
  const allowedRoles = ['user', 'organizer', 'venue_manager'];
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: '管理员、运营人员、客服等后台角色不能创建球局' });
  }
  next();
};

const createNotification = (userId, type, title, content) => {
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, content)
    VALUES (?, ?, ?, ?)
  `).run(userId, type, title, content);
};

const createException = (type, gameId, userId, description) => {
  db.prepare(`
    INSERT INTO exceptions (type, game_id, user_id, description)
    VALUES (?, ?, ?, ?)
  `).run(type, gameId, userId, description);
};

router.get('/', authenticate, (req, res) => {
  const { status, sport_type, page = 1, pageSize = 20 } = req.query;
  let sql = `
    SELECT g.*, 
           u.nickname as organizer_name,
           v.name as venue_name,
           c.name as court_name,
           ts.date, ts.start_time, ts.end_time,
           (SELECT COUNT(*) FROM game_members WHERE game_id = g.id AND status = 'registered') as member_count
    FROM games g
    JOIN users u ON g.organizer_id = u.id
    JOIN courts c ON g.court_id = c.id
    JOIN venues v ON c.venue_id = v.id
    JOIN time_slots ts ON g.time_slot_id = ts.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND g.status = ?';
    params.push(status);
  }
  if (sport_type) {
    sql += ' AND g.sport_type = ?';
    params.push(sport_type);
  }
  
  sql += ' ORDER BY g.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (page - 1) * pageSize);
  
  const games = db.prepare(sql).all(...params);
  res.json(games);
});

router.get('/my', authenticate, (req, res) => {
  const games = db.prepare(`
    SELECT g.*,
           u.nickname as organizer_name,
           v.name as venue_name,
           c.name as court_name,
           ts.date, ts.start_time, ts.end_time,
           gm.role as member_role,
           gm.status as member_status,
           (SELECT COUNT(*) FROM game_members WHERE game_id = g.id AND status = 'registered') as member_count
    FROM games g
    JOIN game_members gm ON g.id = gm.game_id
    JOIN users u ON g.organizer_id = u.id
    JOIN courts c ON g.court_id = c.id
    JOIN venues v ON c.venue_id = v.id
    JOIN time_slots ts ON g.time_slot_id = ts.id
    WHERE gm.user_id = ?
    ORDER BY g.created_at DESC
  `).all(req.user.id);
  res.json(games);
});

router.get('/:id', authenticate, (req, res) => {
  const game = db.prepare(`
    SELECT g.*,
           u.nickname as organizer_name,
           v.name as venue_name, v.address as venue_address,
           c.name as court_name, c.sport_type, c.capacity, c.price_per_hour,
           ts.date, ts.start_time, ts.end_time
    FROM games g
    JOIN users u ON g.organizer_id = u.id
    JOIN courts c ON g.court_id = c.id
    JOIN venues v ON c.venue_id = v.id
    JOIN time_slots ts ON g.time_slot_id = ts.id
    WHERE g.id = ?
  `).get(req.params.id);
  
  if (!game) return res.status(404).json({ error: '球局不存在' });
  
  const members = db.prepare(`
    SELECT gm.*, u.nickname, u.level, u.credit_score, u.avatar
    FROM game_members gm
    JOIN users u ON gm.user_id = u.id
    WHERE gm.game_id = ?
    ORDER BY gm.created_at
  `).all(req.params.id);
  
  const waitlist = db.prepare(`
    SELECT w.*, u.nickname, u.level, u.credit_score
    FROM waitlist w
    JOIN users u ON w.user_id = u.id
    WHERE w.game_id = ? AND w.status = 'waiting'
    ORDER BY w.position
  `).all(req.params.id);
  
  res.json({ ...game, members, waitlist });
});

router.post('/', authenticate, canCreateGame, (req, res) => {
  const {
    court_id, time_slot_id, sport_type, title, description,
    level_required, max_players, min_players, aa_rule,
    deposit_amount, allow_waitlist, cancel_deadline
  } = req.body;
  
  const timeSlot = db.prepare('SELECT * FROM time_slots WHERE id = ?').get(time_slot_id);
  if (!timeSlot || timeSlot.status !== 'available') {
    return res.status(400).json({ error: '该时段不可用' });
  }
  
  const tx = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO games (
        organizer_id, court_id, time_slot_id, sport_type, title, description,
        level_required, max_players, min_players, aa_rule,
        deposit_amount, allow_waitlist, cancel_deadline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id, court_id, time_slot_id, sport_type, title, description,
      level_required, max_players, min_players, aa_rule,
      deposit_amount, allow_waitlist ? 1 : 0, cancel_deadline
    );
    
    const gameId = info.lastInsertRowid;
    
    db.prepare(`
      INSERT INTO game_members (game_id, user_id, role, status, deposit_paid)
      VALUES (?, ?, 'organizer', 'registered', ?)
    `).run(gameId, req.user.id, deposit_amount);
    
    if (deposit_amount > 0) {
      db.prepare(`
        INSERT INTO payments (game_id, user_id, amount, payment_type, status)
        VALUES (?, ?, ?, 'deposit', 'completed')
      `).run(gameId, req.user.id, deposit_amount);
    }
    
    db.prepare('UPDATE time_slots SET status = ? WHERE id = ?').run('booked', time_slot_id);
    
    return gameId;
  });
  
  try {
    const gameId = tx();
    res.json({ id: gameId, message: '球局创建成功' });
  } catch (err) {
    res.status(500).json({ error: '创建球局失败: ' + err.message });
  }
});

router.post('/:id/join', authenticate, (req, res) => {
  const gameId = req.params.id;
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  
  if (!game) return res.status(404).json({ error: '球局不存在' });
  if (game.status !== 'recruiting') return res.status(400).json({ error: '球局不在招募中' });
  
  const existing = db.prepare('SELECT * FROM game_members WHERE game_id = ? AND user_id = ?').get(gameId, req.user.id);
  if (existing) return res.status(400).json({ error: '已报名该球局' });
  
  if (req.user.level < game.level_required) {
    return res.status(400).json({ error: '等级不足，无法报名' });
  }
  
  const memberCount = db.prepare(`
    SELECT COUNT(*) as count FROM game_members 
    WHERE game_id = ? AND status = 'registered'
  `).get(gameId).count;
  
  const tx = db.transaction(() => {
    if (memberCount >= game.max_players) {
      if (!game.allow_waitlist) {
        throw new Error('名额已满且不接受候补');
      }
      const maxPos = db.prepare(`
        SELECT COALESCE(MAX(position), 0) as max_pos 
        FROM waitlist WHERE game_id = ?
      `).get(gameId).max_pos;
      
      db.prepare(`
        INSERT INTO waitlist (game_id, user_id, position)
        VALUES (?, ?, ?)
      `).run(gameId, req.user.id, maxPos + 1);
      
      createNotification(req.user.id, 'waitlist', '候补成功', `您已加入球局"${game.title}"的候补队列`);
      return { joined: false, waitlisted: true, message: '已加入候补队列' };
    }
    
    db.prepare(`
      INSERT INTO game_members (game_id, user_id, status, deposit_paid)
      VALUES (?, ?, 'registered', ?)
    `).run(gameId, req.user.id, game.deposit_amount);
    
    if (game.deposit_amount > 0) {
      db.prepare(`
        INSERT INTO payments (game_id, user_id, amount, payment_type, status)
        VALUES (?, ?, ?, 'deposit', 'completed')
      `).run(gameId, req.user.id, game.deposit_amount);
    }
    
    createNotification(game.organizer_id, 'new_member', '新成员报名', `${req.user.nickname}报名了您的球局"${game.title}"`);
    
    return { joined: true, waitlisted: false, message: '报名成功' };
  });
  
  try {
    const result = tx();
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/confirm', authenticate, (req, res) => {
  const gameId = req.params.id;
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  
  if (!game) return res.status(404).json({ error: '球局不存在' });
  if (game.organizer_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限操作' });
  }
  
  const memberCount = db.prepare(`
    SELECT COUNT(*) as count FROM game_members 
    WHERE game_id = ? AND status = 'registered'
  `).get(gameId).count;
  
  if (memberCount < game.min_players) {
    createException('insufficient_players', gameId, null, `球局"${game.title}"人数不足，最低${game.min_players}人，实际${memberCount}人`);
    return res.status(400).json({ error: '人数不足，无法成局' });
  }
  
  db.prepare('UPDATE games SET status = ? WHERE id = ?').run('confirmed', gameId);
  
  const members = db.prepare('SELECT user_id FROM game_members WHERE game_id = ?').all(gameId);
  members.forEach(m => {
    createNotification(m.user_id, 'game_confirmed', '球局已成局', `球局"${game.title}"已确认成局`);
  });
  
  res.json({ message: '球局已确认' });
});

router.post('/:id/cancel', authenticate, (req, res) => {
  const gameId = req.params.id;
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  
  if (!game) return res.status(404).json({ error: '球局不存在' });
  if (game.organizer_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限操作' });
  }
  
  const tx = db.transaction(() => {
    db.prepare('UPDATE games SET status = ? WHERE id = ?').run('cancelled', gameId);
    db.prepare('UPDATE time_slots SET status = ? WHERE id = ?').run('available', game.time_slot_id);
    
    const members = db.prepare('SELECT user_id FROM game_members WHERE game_id = ?').all(gameId);
    members.forEach(m => {
      createNotification(m.user_id, 'game_cancelled', '球局已取消', `球局"${game.title}"已被取消`);
    });
  });
  
  tx();
  res.json({ message: '球局已取消' });
});

module.exports = router;
