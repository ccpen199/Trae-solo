const express = require('express');
const { getQuery, allQuery, runQuery } = require('../database/schema');
const { authMiddleware } = require('../engines/permissionEngine');

const router = express.Router();

router.get('/', authMiddleware(), async (req, res) => {
  try {
    const { building, status, capacity_min, keyword, page = 1, pageSize = 20 } = req.query;
    
    let sql = `
      SELECT * FROM classrooms WHERE 1=1
    `;
    const params = [];
    
    if (building) {
      sql += ' AND building = ?';
      params.push(building);
    }
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    if (capacity_min) {
      sql += ' AND capacity >= ?';
      params.push(parseInt(capacity_min));
    }
    
    if (keyword) {
      sql += ' AND (room_name LIKE ? OR room_code LIKE ? OR building LIKE ?)';
      const likeKeyword = `%${keyword}%`;
      params.push(likeKeyword, likeKeyword, likeKeyword);
    }
    
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    const countResult = await getQuery(countSql, params);
    
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY building, room_code LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);
    
    const classrooms = await allQuery(sql, params);
    
    res.json({
      classrooms,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / pageSize)
      }
    });
    
  } catch (error) {
    console.error('获取教室列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/:id', authMiddleware(), async (req, res) => {
  try {
    const classroom = await getQuery('SELECT * FROM classrooms WHERE id = ?', [req.params.id]);
    
    if (!classroom) {
      return res.status(404).json({ error: '教室不存在' });
    }
    
    res.json({ classroom });
    
  } catch (error) {
    console.error('获取教室详情错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/', authMiddleware(['class:create']), async (req, res) => {
  try {
    const { room_name, room_code, building, floor, capacity, equipment, status = 'available' } = req.body;
    
    if (!room_name || !room_code || !building || !capacity) {
      return res.status(400).json({ error: '教室名称、代码、楼号、容量为必填项' });
    }
    
    const existingClassroom = await getQuery('SELECT * FROM classrooms WHERE room_code = ?', [room_code]);
    if (existingClassroom) {
      return res.status(400).json({ error: '教室代码已存在' });
    }
    
    const result = await runQuery(
      `INSERT INTO classrooms (room_name, room_code, building, floor, capacity, equipment, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [room_name, room_code, building, floor || null, capacity, equipment || null, status]
    );
    
    res.json({
      success: true,
      classroomId: result.lastID,
      message: '教室创建成功'
    });
    
  } catch (error) {
    console.error('创建教室错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.put('/:id', authMiddleware(['class:update']), async (req, res) => {
  try {
    const { room_name, room_code, building, floor, capacity, equipment, status } = req.body;
    
    const existingClassroom = await getQuery('SELECT * FROM classrooms WHERE id = ?', [req.params.id]);
    if (!existingClassroom) {
      return res.status(404).json({ error: '教室不存在' });
    }
    
    let updateFields = [];
    let updateParams = [];
    
    if (room_name !== undefined) {
      updateFields.push('room_name = ?');
      updateParams.push(room_name);
    }
    if (room_code !== undefined) {
      updateFields.push('room_code = ?');
      updateParams.push(room_code);
    }
    if (building !== undefined) {
      updateFields.push('building = ?');
      updateParams.push(building);
    }
    if (floor !== undefined) {
      updateFields.push('floor = ?');
      updateParams.push(floor);
    }
    if (capacity !== undefined) {
      updateFields.push('capacity = ?');
      updateParams.push(capacity);
    }
    if (equipment !== undefined) {
      updateFields.push('equipment = ?');
      updateParams.push(equipment);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateParams.push(status);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: '没有需要更新的字段' });
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateParams.push(req.params.id);
    
    await runQuery(
      `UPDATE classrooms SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );
    
    res.json({
      success: true,
      message: '教室信息更新成功'
    });
    
  } catch (error) {
    console.error('更新教室信息错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.delete('/:id', authMiddleware(['class:delete']), async (req, res) => {
  try {
    const classroom = await getQuery('SELECT * FROM classrooms WHERE id = ?', [req.params.id]);
    if (!classroom) {
      return res.status(404).json({ error: '教室不存在' });
    }
    
    const scheduleCount = await getQuery(
      'SELECT COUNT(*) as count FROM schedules WHERE classroom_id = ? AND status = ?',
      [req.params.id, 'active']
    );
    
    if (scheduleCount.count > 0) {
      return res.status(400).json({ error: '该教室还有排课记录，无法删除' });
    }
    
    await runQuery('DELETE FROM classrooms WHERE id = ?', [req.params.id]);
    
    res.json({
      success: true,
      message: '教室删除成功'
    });
    
  } catch (error) {
    console.error('删除教室错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/buildings/list', authMiddleware(), async (req, res) => {
  try {
    const buildings = await allQuery(
      'SELECT DISTINCT building FROM classrooms ORDER BY building'
    );
    
    res.json({
      buildings: buildings.map(b => b.building)
    });
    
  } catch (error) {
    console.error('获取教学楼列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
