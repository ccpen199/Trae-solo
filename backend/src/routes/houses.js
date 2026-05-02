const express = require('express');
const db = require('../models/database');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, authorizeRoles, logOperation } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, keyword, page = 1, pageSize = 10 } = req.query;
    
    let conditions = [];
    let params = [];

    if (status) {
      conditions.push('h.status = ?');
      params.push(status);
    }

    if (keyword) {
      conditions.push('(h.name LIKE ? OR h.address LIKE ? OR h.house_no LIKE ?)');
      const searchPattern = `%${keyword}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countQuery = `SELECT COUNT(*) as total FROM houses h ${whereClause}`;
    const countResult = db.prepare(countQuery).get(...params);
    const total = countResult.total;

    const offset = (page - 1) * pageSize;
    params.push(parseInt(pageSize), offset);

    const query = `
      SELECT h.*, 
             (SELECT COUNT(*) FROM panoramic_images WHERE house_id = h.id) as panoramic_count,
             (SELECT COUNT(*) FROM floor_plans WHERE house_id = h.id) as floor_plan_count,
             u.name as developer_name
      FROM houses h
      LEFT JOIN users u ON h.developer_id = u.id
      ${whereClause}
      ORDER BY h.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const houses = db.prepare(query).all(...params);

    res.json({
      houses,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('获取房源列表失败:', error);
    res.status(500).json({ error: '获取房源列表失败' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const house = db.prepare(`
      SELECT h.*, u.name as developer_name
      FROM houses h
      LEFT JOIN users u ON h.developer_id = u.id
      WHERE h.id = ?
    `).get(id);

    if (!house) {
      return res.status(404).json({ error: '房源不存在' });
    }

    const panoramics = db.prepare(`
      SELECT * FROM panoramic_images WHERE house_id = ? ORDER BY created_at
    `).all(id);

    const floorPlans = db.prepare(`
      SELECT * FROM floor_plans WHERE house_id = ? ORDER BY created_at
    `).all(id);

    res.json({
      house,
      panoramics,
      floorPlans
    });
  } catch (error) {
    console.error('获取房源详情失败:', error);
    res.status(500).json({ error: '获取房源详情失败' });
  }
});

router.post('/', authenticateToken, authorizeRoles('admin', 'developer'), logOperation('houses'), async (req, res) => {
  try {
    const { house_no, name, address, area, rooms, price, status, developer_id } = req.body;

    if (!house_no || !name) {
      return res.status(400).json({ error: '房源编号和名称为必填项' });
    }

    const existingHouse = db.prepare('SELECT * FROM houses WHERE house_no = ?').get(house_no);
    if (existingHouse) {
      return res.status(400).json({ error: '房源编号已存在' });
    }

    const houseId = uuidv4();
    const developerId = developer_id || req.user.id;

    db.prepare(`
      INSERT INTO houses (id, house_no, name, address, area, rooms, price, status, developer_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      houseId,
      house_no,
      name,
      address,
      area,
      rooms,
      price,
      status || 'available',
      developerId
    );

    const house = db.prepare('SELECT * FROM houses WHERE id = ?').get(houseId);

    res.status(201).json(house);
  } catch (error) {
    console.error('创建房源失败:', error);
    res.status(500).json({ error: '创建房源失败' });
  }
});

router.put('/:id', authenticateToken, authorizeRoles('admin', 'developer'), logOperation('houses'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, area, rooms, price, status } = req.body;

    const house = db.prepare('SELECT * FROM houses WHERE id = ?').get(id);
    if (!house) {
      return res.status(404).json({ error: '房源不存在' });
    }

    db.prepare(`
      UPDATE houses 
      SET name = ?, address = ?, area = ?, rooms = ?, price = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name || house.name,
      address || house.address,
      area !== undefined ? area : house.area,
      rooms !== undefined ? rooms : house.rooms,
      price !== undefined ? price : house.price,
      status || house.status,
      id
    );

    const updatedHouse = db.prepare('SELECT * FROM houses WHERE id = ?').get(id);

    res.json(updatedHouse);
  } catch (error) {
    console.error('更新房源失败:', error);
    res.status(500).json({ error: '更新房源失败' });
  }
});

router.delete('/:id', authenticateToken, authorizeRoles('admin'), logOperation('houses'), async (req, res) => {
  try {
    const { id } = req.params;

    const house = db.prepare('SELECT * FROM houses WHERE id = ?').get(id);
    if (!house) {
      return res.status(404).json({ error: '房源不存在' });
    }

    const activeSessions = db.prepare(`
      SELECT COUNT(*) as count FROM viewing_sessions 
      WHERE house_id = ? AND status NOT IN ('completed', 'cancelled')
    `).get(id);

    if (activeSessions.count > 0) {
      return res.status(400).json({ error: '该房源存在进行中的看房会话，无法删除' });
    }

    db.prepare('DELETE FROM hotspots WHERE panoramic_id IN (SELECT id FROM panoramic_images WHERE house_id = ?)').run(id);
    db.prepare('DELETE FROM navigation_points WHERE panoramic_id IN (SELECT id FROM panoramic_images WHERE house_id = ?)').run(id);
    db.prepare('DELETE FROM panoramic_images WHERE house_id = ?').run(id);
    db.prepare('DELETE FROM floor_plans WHERE house_id = ?').run(id);
    db.prepare('DELETE FROM houses WHERE id = ?').run(id);

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除房源失败:', error);
    res.status(500).json({ error: '删除房源失败' });
  }
});

module.exports = router;
