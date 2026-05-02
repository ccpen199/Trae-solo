const express = require('express');
const db = require('../database');
const { authenticateToken } = require('./users');

const router = express.Router();

const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

router.post('/create', authenticateToken, (req, res) => {
  const { game_type_id, max_players = 4, config } = req.body;
  
  if (!game_type_id) {
    return res.status(400).json({ error: '游戏类型不能为空' });
  }
  
  const gameType = db.prepare('SELECT * FROM game_types WHERE id = ?').get(game_type_id);
  if (!gameType) {
    return res.status(404).json({ error: '游戏类型不存在' });
  }
  
  try {
    const roomCode = generateRoomCode();
    const result = db.prepare(`
      INSERT INTO game_rooms (room_code, game_type_id, host_id, max_players, config)
      VALUES (?, ?, ?, ?, ?)
    `).run(roomCode, game_type_id, req.user.id, Math.min(max_players, gameType.max_players), JSON.stringify(config || {}));
    
    const roomId = result.lastInsertRowid;
    
    db.prepare(`
      INSERT INTO room_players (room_id, user_id, is_ready)
      VALUES (?, ?, 1)
    `).run(roomId, req.user.id);
    
    const room = db.prepare(`
      SELECT 
        gr.*,
        gt.name as game_name,
        gt.icon,
        gt.code as game_code,
        gt.min_players,
        gt.max_players as game_max_players
      FROM game_rooms gr
      JOIN game_types gt ON gr.game_type_id = gt.id
      WHERE gr.id = ?
    `).get(roomId);
    
    const players = db.prepare(`
      SELECT 
        rp.*,
        u.username,
        u.nickname,
        u.avatar
      FROM room_players rp
      JOIN users u ON rp.user_id = u.id
      WHERE rp.room_id = ?
    `).all(roomId);
    
    res.json({
      ...room,
      players,
      playerCount: players.length
    });
  } catch (err) {
    console.error('创建房间失败:', err);
    res.status(500).json({ error: '创建房间失败' });
  }
});

router.post('/join/:roomCode', authenticateToken, (req, res) => {
  const { roomCode } = req.params;
  
  const room = db.prepare(`
    SELECT 
      gr.*,
      gt.name as game_name,
      gt.icon,
      gt.code as game_code,
      gt.min_players,
      gt.max_players as game_max_players
    FROM game_rooms gr
    JOIN game_types gt ON gr.game_type_id = gt.id
    WHERE gr.room_code = ?
  `).get(roomCode.toUpperCase());
  
  if (!room) {
    return res.status(404).json({ error: '房间不存在' });
  }
  
  if (room.status !== 'waiting') {
    return res.status(400).json({ error: '房间已开始游戏' });
  }
  
  const existingPlayer = db.prepare('SELECT * FROM room_players WHERE room_id = ? AND user_id = ?').get(room.id, req.user.id);
  if (existingPlayer) {
    return res.status(400).json({ error: '你已经在这个房间里了' });
  }
  
  const playerCount = db.prepare('SELECT COUNT(*) as count FROM room_players WHERE room_id = ?').get(room.id);
  if (playerCount.count >= room.max_players) {
    return res.status(400).json({ error: '房间已满' });
  }
  
  try {
    db.prepare(`
      INSERT INTO room_players (room_id, user_id, is_ready)
      VALUES (?, ?, 0)
    `).run(room.id, req.user.id);
    
    const players = db.prepare(`
      SELECT 
        rp.*,
        u.username,
        u.nickname,
        u.avatar
      FROM room_players rp
      JOIN users u ON rp.user_id = u.id
      WHERE rp.room_id = ?
    `).all(room.id);
    
    res.json({
      ...room,
      players,
      playerCount: players.length
    });
  } catch (err) {
    console.error('加入房间失败:', err);
    res.status(500).json({ error: '加入房间失败' });
  }
});

router.get('/:roomCode', authenticateToken, (req, res) => {
  const { roomCode } = req.params;
  
  const room = db.prepare(`
    SELECT 
      gr.*,
      gt.name as game_name,
      gt.icon,
      gt.code as game_code,
      gt.min_players,
      gt.max_players as game_max_players,
      gt.description as game_description
    FROM game_rooms gr
    JOIN game_types gt ON gr.game_type_id = gt.id
    WHERE gr.room_code = ?
  `).get(roomCode.toUpperCase());
  
  if (!room) {
    return res.status(404).json({ error: '房间不存在' });
  }
  
  const players = db.prepare(`
    SELECT 
      rp.*,
      u.username,
      u.nickname,
      u.avatar
    FROM room_players rp
    JOIN users u ON rp.user_id = u.id
    WHERE rp.room_id = ?
    ORDER BY rp.joined_at
  `).all(room.id);
  
  res.json({
    ...room,
    players,
    playerCount: players.length
  });
});

router.post('/ready', authenticateToken, (req, res) => {
  const { room_id } = req.body;
  
  if (!room_id) {
    return res.status(400).json({ error: '房间ID不能为空' });
  }
  
  const player = db.prepare('SELECT * FROM room_players WHERE room_id = ? AND user_id = ?').get(room_id, req.user.id);
  
  if (!player) {
    return res.status(404).json({ error: '你不在这个房间里' });
  }
  
  try {
    const newReadyStatus = player.is_ready ? 0 : 1;
    db.prepare('UPDATE room_players SET is_ready = ? WHERE room_id = ? AND user_id = ?').run(newReadyStatus, room_id, req.user.id);
    
    const players = db.prepare(`
      SELECT 
        rp.*,
        u.username,
        u.nickname,
        u.avatar
      FROM room_players rp
      JOIN users u ON rp.user_id = u.id
      WHERE rp.room_id = ?
    `).all(room_id);
    
    res.json({
      readyStatus: newReadyStatus,
      players
    });
  } catch (err) {
    console.error('更新准备状态失败:', err);
    res.status(500).json({ error: '更新准备状态失败' });
  }
});

router.post('/start', authenticateToken, (req, res) => {
  const { room_id } = req.body;
  
  if (!room_id) {
    return res.status(400).json({ error: '房间ID不能为空' });
  }
  
  const room = db.prepare(`
    SELECT gr.*, gt.min_players
    FROM game_rooms gr
    JOIN game_types gt ON gr.game_type_id = gt.id
    WHERE gr.id = ?
  `).get(room_id);
  
  if (!room) {
    return res.status(404).json({ error: '房间不存在' });
  }
  
  if (room.host_id !== req.user.id) {
    return res.status(403).json({ error: '只有房主可以开始游戏' });
  }
  
  const players = db.prepare('SELECT * FROM room_players WHERE room_id = ?').all(room_id);
  
  if (players.length < room.min_players) {
    return res.status(400).json({ error: `至少需要 ${room.min_players} 名玩家才能开始游戏` });
  }
  
  try {
    db.prepare('UPDATE game_rooms SET status = ? WHERE id = ?').run('playing', room_id);
    
    res.json({
      message: '游戏开始',
      roomId: room_id
    });
  } catch (err) {
    console.error('开始游戏失败:', err);
    res.status(500).json({ error: '开始游戏失败' });
  }
});

router.post('/leave', authenticateToken, (req, res) => {
  const { room_id } = req.body;
  
  if (!room_id) {
    return res.status(400).json({ error: '房间ID不能为空' });
  }
  
  try {
    db.prepare('DELETE FROM room_players WHERE room_id = ? AND user_id = ?').run(room_id, req.user.id);
    
    const remainingPlayers = db.prepare('SELECT * FROM room_players WHERE room_id = ?').all(room_id);
    
    if (remainingPlayers.length === 0) {
      db.prepare('DELETE FROM game_rooms WHERE id = ?').run(room_id);
    }
    
    res.json({ message: '已离开房间' });
  } catch (err) {
    console.error('离开房间失败:', err);
    res.status(500).json({ error: '离开房间失败' });
  }
});

router.get('/list/waiting', authenticateToken, (req, res) => {
  const rooms = db.prepare(`
    SELECT 
      gr.*,
      gt.name as game_name,
      gt.icon,
      gt.code as game_code,
      (SELECT COUNT(*) FROM room_players WHERE room_id = gr.id) as player_count
    FROM game_rooms gr
    JOIN game_types gt ON gr.game_type_id = gt.id
    WHERE gr.status = 'waiting'
    ORDER BY gr.created_at DESC
    LIMIT 20
  `).all();
  
  res.json(rooms);
});

module.exports = router;
