const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const router = express.Router();

router.post('/create', (req, res) => {
  const { hostId, roomName, gameType } = req.body;
  
  if (!hostId || !roomName) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    const roomId = uuidv4();
    
    const stmt = db.prepare(
      'INSERT INTO rooms (id, name, host_id, player1_id) VALUES (?, ?, ?, ?)'
    );
    stmt.run(roomId, roomName, hostId, hostId);
    
    res.json({
      success: true,
      room: {
        id: roomId,
        name: roomName,
        hostId,
        status: 'waiting',
        player1Id: hostId,
        player2Id: null,
        player1Ready: false,
        player2Ready: false
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '创建房间失败' });
  }
});

router.post('/list', (req, res) => {
  try {
    const stmt = db.prepare(
      'SELECT * FROM rooms WHERE status = ? ORDER BY created_at DESC'
    );
    const rows = stmt.all('waiting');
    
    const rooms = rows.map(row => ({
      id: row.id,
      name: row.name,
      hostId: row.host_id,
      status: row.status,
      player1Id: row.player1_id,
      player2Id: row.player2_id,
      player1Ready: !!row.player1_ready,
      player2Ready: !!row.player2_ready
    }));
    
    res.json({ rooms });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '获取房间列表失败' });
  }
});

router.post('/join', (req, res) => {
  const { roomId, playerId } = req.body;
  
  if (!roomId || !playerId) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    const getStmt = db.prepare('SELECT * FROM rooms WHERE id = ?');
    const room = getStmt.get(roomId);
    
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }
    
    if (room.player1_id === playerId) {
      return res.json({
        success: true,
        room: {
          id: room.id,
          name: room.name,
          hostId: room.host_id,
          status: room.status,
          player1Id: room.player1_id,
          player2Id: room.player2_id,
          player1Ready: !!room.player1_ready,
          player2Ready: !!room.player2_ready
        }
      });
    }
    
    if (room.player2_id && room.player2_id !== playerId) {
      return res.status(400).json({ error: '房间已满' });
    }
    
    if (room.status !== 'waiting') {
      return res.status(400).json({ error: '房间已开始游戏' });
    }

    const updateStmt = db.prepare(
      'UPDATE rooms SET player2_id = ? WHERE id = ?'
    );
    updateStmt.run(playerId, roomId);
    
    res.json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        hostId: room.host_id,
        status: room.status,
        player1Id: room.player1_id,
        player2Id: playerId,
        player1Ready: !!room.player1_ready,
        player2Ready: false
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '加入房间失败' });
  }
});

router.post('/ready', (req, res) => {
  const { roomId, playerId, ready } = req.body;
  
  if (!roomId || !playerId) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    const getStmt = db.prepare('SELECT * FROM rooms WHERE id = ?');
    const room = getStmt.get(roomId);
    
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }

    const isPlayer1 = room.player1_id === playerId;
    const isPlayer2 = room.player2_id === playerId;
    
    if (!isPlayer1 && !isPlayer2) {
      return res.status(403).json({ error: '你不在这个房间' });
    }

    const readyField = isPlayer1 ? 'player1_ready' : 'player2_ready';
    const readyValue = ready ? 1 : 0;

    const updateStmt = db.prepare(
      `UPDATE rooms SET ${readyField} = ? WHERE id = ?`
    );
    updateStmt.run(readyValue, roomId);
    
    const getUpdatedStmt = db.prepare('SELECT * FROM rooms WHERE id = ?');
    const updatedRoom = getUpdatedStmt.get(roomId);
    
    res.json({
      success: true,
      room: {
        id: updatedRoom.id,
        name: updatedRoom.name,
        hostId: updatedRoom.host_id,
        status: updatedRoom.status,
        player1Id: updatedRoom.player1_id,
        player2Id: updatedRoom.player2_id,
        player1Ready: !!updatedRoom.player1_ready,
        player2Ready: !!updatedRoom.player2_ready
      },
      allReady: !!updatedRoom.player1_ready && !!updatedRoom.player2_ready
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '更新准备状态失败' });
  }
});

router.post('/get', (req, res) => {
  const { roomId } = req.body;
  
  if (!roomId) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    const stmt = db.prepare('SELECT * FROM rooms WHERE id = ?');
    const room = stmt.get(roomId);
    
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }
    
    res.json({
      room: {
        id: room.id,
        name: room.name,
        hostId: room.host_id,
        status: room.status,
        player1Id: room.player1_id,
        player2Id: room.player2_id,
        player1Ready: !!room.player1_ready,
        player2Ready: !!room.player2_ready
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '查询房间失败' });
  }
});

module.exports = router;