const express = require('express');
const { getAsync, allAsync, runAsync } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { isRead, page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let countSql = `SELECT COUNT(*) as total FROM notifications WHERE user_id = ?`;
    let dataSql = `SELECT n.*, mo.order_no, mo.title as order_title
                   FROM notifications n 
                   LEFT JOIN main_orders mo ON n.main_order_id = mo.id
                   WHERE n.user_id = ?`;
    
    let params = [req.user.id];
    let countParams = [req.user.id];

    if (isRead !== undefined && isRead !== '') {
      const isReadVal = isRead === 'true' ? 1 : 0;
      dataSql += ` AND n.is_read = ?`;
      countSql += ` AND is_read = ?`;
      params.push(isReadVal);
      countParams.push(isReadVal);
    }

    const countResult = await getAsync(countSql, countParams);
    const total = countResult.total;

    dataSql += ` ORDER BY n.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);

    const notifications = await allAsync(dataSql, params);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize))
        }
      }
    });
  } catch (err) {
    console.error('获取通知列表失败:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const result = await getAsync(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        unreadCount: result.count
      }
    });
  } catch (err) {
    console.error('获取未读通知数量失败:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.put('/:notificationId/read', authMiddleware, async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await getAsync(
      `SELECT * FROM notifications WHERE id = ? AND user_id = ?`,
      [notificationId, req.user.id]
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: '通知不存在或无权限访问'
      });
    }

    await runAsync(
      `UPDATE notifications SET is_read = 1, read_at = datetime('now') WHERE id = ?`,
      [notificationId]
    );

    res.json({
      success: true,
      message: '通知已标记为已读'
    });
  } catch (err) {
    console.error('标记通知已读失败:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    await runAsync(
      `UPDATE notifications SET is_read = 1, read_at = datetime('now') WHERE user_id = ? AND is_read = 0`,
      [req.user.id]
    );

    res.json({
      success: true,
      message: '所有通知已标记为已读'
    });
  } catch (err) {
    console.error('批量标记通知已读失败:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

module.exports = router;
