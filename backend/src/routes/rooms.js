const express = require('express');
const router = express.Router();
const db = require('../config/database');
require('dotenv').config();

const DB_TYPE = process.env.DB_TYPE || 'sqlite';

router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, roomNumber, roomTypeId, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    
    let query = `
      SELECT r.*, rt.name as room_type_name, rt.base_price
      FROM rooms r
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
    `;
    let countQuery = `SELECT COUNT(*) as count FROM rooms r`;
    let conditions = [];
    let params = [];

    if (roomNumber) {
      conditions.push(`r.room_number LIKE ?`);
      params.push(`%${roomNumber}%`);
    }

    if (roomTypeId) {
      conditions.push(`r.room_type_id = ?`);
      params.push(roomTypeId);
    }

    if (status) {
      conditions.push(`r.status = ?`);
      params.push(status);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
    const queryParams = [...params, parseInt(pageSize), offset];
    const countParams = [...params];

    const result = await db.all(query, queryParams);
    const countResult = await db.get(countQuery, countParams);
    const total = parseInt(countResult.count);

    res.json({
      success: true,
      data: {
        list: result,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize))
        }
      }
    });
  } catch (error) {
    console.error('获取客房列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取客房列表失败',
      error: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.get(
      `SELECT r.*, rt.name as room_type_name, rt.base_price, rt.description as room_type_description
       FROM rooms r
       LEFT JOIN room_types rt ON r.room_type_id = rt.id
       WHERE r.id = ?`,
      [id]
    );
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: '客房不存在'
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取客房详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取客房详情失败',
      error: error.message
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { room_number, room_type_id, floor, status, description } = req.body;
    
    if (!room_number || !room_type_id) {
      return res.status(400).json({
        success: false,
        message: '房号和客房类型为必填项'
      });
    }

    const roomTypeResult = await db.get(
      'SELECT * FROM room_types WHERE id = ?',
      [room_type_id]
    );

    if (!roomTypeResult) {
      return res.status(400).json({
        success: false,
        message: '客房类型不存在'
      });
    }

    const checkResult = await db.get(
      'SELECT * FROM rooms WHERE room_number = ?',
      [room_number]
    );

    if (checkResult) {
      return res.status(400).json({
        success: false,
        message: '房号已存在'
      });
    }

    const insertResult = await db.run(
      `INSERT INTO rooms (room_number, room_type_id, floor, status, description)
       VALUES (?, ?, ?, ?, ?)`,
      [room_number, room_type_id, floor, status || 'available', description]
    );

    const newId = insertResult.lastID;
    const newRoom = await db.get(
      `SELECT r.*, rt.name as room_type_name, rt.base_price
       FROM rooms r
       LEFT JOIN room_types rt ON r.room_type_id = rt.id
       WHERE r.id = ?`,
      [newId]
    );

    res.status(201).json({
      success: true,
      message: '客房创建成功',
      data: newRoom
    });
  } catch (error) {
    console.error('创建客房失败:', error);
    res.status(500).json({
      success: false,
      message: '创建客房失败',
      error: error.message
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { room_number, room_type_id, floor, status, description } = req.body;

    const existingResult = await db.get(
      'SELECT * FROM rooms WHERE id = ?',
      [id]
    );

    if (!existingResult) {
      return res.status(404).json({
        success: false,
        message: '客房不存在'
      });
    }

    if (room_type_id) {
      const roomTypeResult = await db.get(
        'SELECT * FROM room_types WHERE id = ?',
        [room_type_id]
      );

      if (!roomTypeResult) {
        return res.status(400).json({
          success: false,
          message: '客房类型不存在'
        });
      }
    }

    if (room_number) {
      const roomNumberCheckResult = await db.get(
        'SELECT * FROM rooms WHERE room_number = ? AND id != ?',
        [room_number, id]
      );

      if (roomNumberCheckResult) {
        return res.status(400).json({
          success: false,
          message: '房号已存在'
        });
      }
    }

    const updateRoomNumber = room_number || existingResult.room_number;
    const updateRoomTypeId = room_type_id || existingResult.room_type_id;
    const updateFloor = floor !== undefined ? floor : existingResult.floor;
    const updateStatus = status || existingResult.status;
    const updateDescription = description !== undefined ? description : existingResult.description;

    await db.run(
      `UPDATE rooms 
       SET room_number = ?, room_type_id = ?, floor = ?, status = ?, 
           description = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        updateRoomNumber,
        updateRoomTypeId,
        updateFloor,
        updateStatus,
        updateDescription,
        id
      ]
    );

    const updatedRoom = await db.get(
      `SELECT r.*, rt.name as room_type_name, rt.base_price
       FROM rooms r
       LEFT JOIN room_types rt ON r.room_type_id = rt.id
       WHERE r.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: '客房更新成功',
      data: updatedRoom
    });
  } catch (error) {
    console.error('更新客房失败:', error);
    res.status(500).json({
      success: false,
      message: '更新客房失败',
      error: error.message
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const roomToDelete = await db.get(
      `SELECT r.*, rt.name as room_type_name, rt.base_price
       FROM rooms r
       LEFT JOIN room_types rt ON r.room_type_id = rt.id
       WHERE r.id = ?`,
      [id]
    );

    if (!roomToDelete) {
      return res.status(404).json({
        success: false,
        message: '客房不存在'
      });
    }

    await db.run('DELETE FROM rooms WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '客房删除成功',
      data: roomToDelete
    });
  } catch (error) {
    console.error('删除客房失败:', error);
    res.status(500).json({
      success: false,
      message: '删除客房失败',
      error: error.message
    });
  }
});

module.exports = router;
