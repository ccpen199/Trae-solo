const express = require('express');
const router = express.Router();
const db = require('../database/init');
const StateSyncService = require('../services/stateSyncService');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名和密码不能为空'
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: '账户已被禁用'
      });
    }

    let profile = null;
    if (user.role === 'passenger') {
      profile = db.prepare('SELECT * FROM passengers WHERE user_id = ?').get(user.id);
    } else if (user.role === 'driver') {
      profile = db.prepare('SELECT * FROM drivers WHERE user_id = ?').get(user.id);
    }

    const todoCount = StateSyncService.getTodoCount(user.id);
    const unreadCount = StateSyncService.getUnreadNotificationCount(user.id);

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        phone: user.phone
      },
      profile,
      stats: {
        todoCount,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: '登录失败'
    });
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const { user_id, limit = 20, offset = 0 } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: '缺少用户ID'
      });
    }

    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(user_id, parseInt(limit), parseInt(offset));

    const unreadCount = StateSyncService.getUnreadNotificationCount(user_id);

    res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: '获取通知失败'
    });
  }
});

router.post('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    StateSyncService.markNotificationAsRead(id);

    res.json({
      success: true
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      error: '操作失败'
    });
  }
});

router.get('/todos', async (req, res) => {
  try {
    const { user_id, status = 'pending', limit = 20, offset = 0 } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: '缺少用户ID'
      });
    }

    const todos = db.prepare(`
      SELECT t.*,
             om.order_no,
             om.start_address,
             om.end_address,
             om.status as order_status
      FROM todos t
      JOIN order_main om ON t.order_id = om.id
      WHERE t.user_id = ? AND t.status = ?
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `).all(user_id, status, parseInt(limit), parseInt(offset));

    const count = StateSyncService.getTodoCount(user_id, status);

    res.json({
      success: true,
      todos,
      total: count
    });
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({
      success: false,
      error: '获取待办事项失败'
    });
  }
});

router.get('/drivers', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT d.*, u.name as driver_name, u.phone
      FROM drivers d
      JOIN users u ON d.user_id = u.id
    `;
    const params = [];

    if (status) {
      query += ' WHERE d.status = ?';
      params.push(status);
    }

    query += ' ORDER BY d.updated_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const drivers = db.prepare(query).all(...params);

    res.json({
      success: true,
      drivers
    });
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({
      success: false,
      error: '获取司机列表失败'
    });
  }
});

router.get('/passengers', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const passengers = db.prepare(`
      SELECT p.*, u.name as passenger_name, u.phone
      FROM passengers p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.updated_at DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(limit), parseInt(offset));

    res.json({
      success: true,
      passengers
    });
  } catch (error) {
    console.error('Get passengers error:', error);
    res.status(500).json({
      success: false,
      error: '获取乘客列表失败'
    });
  }
});

router.get('/driver/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = db.prepare(`
      SELECT d.*, u.name as driver_name, u.phone, u.username
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `).get(driverId);

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: '司机不存在'
      });
    }

    res.json({
      success: true,
      driver
    });
  } catch (error) {
    console.error('Get driver error:', error);
    res.status(500).json({
      success: false,
      error: '获取司机信息失败'
    });
  }
});

router.get('/passenger/:passengerId', async (req, res) => {
  try {
    const { passengerId } = req.params;

    const passenger = db.prepare(`
      SELECT p.*, u.name as passenger_name, u.phone, u.username
      FROM passengers p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(passengerId);

    if (!passenger) {
      return res.status(404).json({
        success: false,
        error: '乘客不存在'
      });
    }

    res.json({
      success: true,
      passenger
    });
  } catch (error) {
    console.error('Get passenger error:', error);
    res.status(500).json({
      success: false,
      error: '获取乘客信息失败'
    });
  }
});

router.post('/driver/:driverId/update-location', async (req, res) => {
  try {
    const { driverId } = req.params;
    const { lat, lng, accuracy, speed, heading } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        error: '缺少坐标参数'
      });
    }

    const GeofenceEngine = require('../engines/geofenceEngine');
    const location = GeofenceEngine.recordDriverLocation(
      driverId, lat, lng, accuracy, speed, heading
    );

    res.json({
      success: true,
      location
    });
  } catch (error) {
    console.error('Update driver location error:', error);
    res.status(500).json({
      success: false,
      error: '更新位置失败'
    });
  }
});

module.exports = router;
