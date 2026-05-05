const express = require('express');
const router = express.Router();
const db = require('../config/database');
require('dotenv').config();

const DB_TYPE = process.env.DB_TYPE || 'sqlite';

router.get('/', async (req, res) => {
  try {
    const result = await db.all(
      'SELECT * FROM room_types ORDER BY created_at DESC'
    );
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取客房类型失败:', error);
    res.status(500).json({
      success: false,
      message: '获取客房类型失败',
      error: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.get(
      'SELECT * FROM room_types WHERE id = ?',
      [id]
    );
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: '客房类型不存在'
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取客房类型详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取客房类型详情失败',
      error: error.message
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, base_price, max_occupancy, area, amenities } = req.body;
    
    if (!name || !base_price) {
      return res.status(400).json({
        success: false,
        message: '房型名称和基础价格为必填项'
      });
    }

    const checkResult = await db.get(
      'SELECT * FROM room_types WHERE name = ?',
      [name]
    );

    if (checkResult) {
      return res.status(400).json({
        success: false,
        message: '房型名称已存在'
      });
    }

    const insertResult = await db.run(
      `INSERT INTO room_types (name, description, base_price, max_occupancy, area, amenities)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description, base_price, max_occupancy || 2, area, amenities]
    );

    const newId = insertResult.lastID;
    const newRoomType = await db.get('SELECT * FROM room_types WHERE id = ?', [newId]);

    res.status(201).json({
      success: true,
      message: '客房类型创建成功',
      data: newRoomType
    });
  } catch (error) {
    console.error('创建客房类型失败:', error);
    res.status(500).json({
      success: false,
      message: '创建客房类型失败',
      error: error.message
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, base_price, max_occupancy, area, amenities } = req.body;

    const existingResult = await db.get(
      'SELECT * FROM room_types WHERE id = ?',
      [id]
    );

    if (!existingResult) {
      return res.status(404).json({
        success: false,
        message: '客房类型不存在'
      });
    }

    if (name) {
      const nameCheckResult = await db.get(
        'SELECT * FROM room_types WHERE name = ? AND id != ?',
        [name, id]
      );

      if (nameCheckResult) {
        return res.status(400).json({
          success: false,
          message: '房型名称已存在'
        });
      }
    }

    const updateName = name || existingResult.name;
    const updateDescription = description !== undefined ? description : existingResult.description;
    const updateBasePrice = base_price !== undefined ? base_price : existingResult.base_price;
    const updateMaxOccupancy = max_occupancy !== undefined ? max_occupancy : existingResult.max_occupancy;
    const updateArea = area !== undefined ? area : existingResult.area;
    const updateAmenities = amenities !== undefined ? amenities : existingResult.amenities;

    await db.run(
      `UPDATE room_types 
       SET name = ?, description = ?, base_price = ?, max_occupancy = ?, 
           area = ?, amenities = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        updateName,
        updateDescription,
        updateBasePrice,
        updateMaxOccupancy,
        updateArea,
        updateAmenities,
        id
      ]
    );

    const updatedRoomType = await db.get('SELECT * FROM room_types WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '客房类型更新成功',
      data: updatedRoomType
    });
  } catch (error) {
    console.error('更新客房类型失败:', error);
    res.status(500).json({
      success: false,
      message: '更新客房类型失败',
      error: error.message
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const checkUsage = await db.get(
      'SELECT COUNT(*) as count FROM rooms WHERE room_type_id = ?',
      [id]
    );

    if (parseInt(checkUsage.count) > 0) {
      return res.status(400).json({
        success: false,
        message: '该房型下仍有客房，无法删除'
      });
    }

    const roomTypeToDelete = await db.get('SELECT * FROM room_types WHERE id = ?', [id]);
    
    if (!roomTypeToDelete) {
      return res.status(404).json({
        success: false,
        message: '客房类型不存在'
      });
    }

    await db.run('DELETE FROM room_types WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '客房类型删除成功',
      data: roomTypeToDelete
    });
  } catch (error) {
    console.error('删除客房类型失败:', error);
    res.status(500).json({
      success: false,
      message: '删除客房类型失败',
      error: error.message
    });
  }
});

module.exports = router;
