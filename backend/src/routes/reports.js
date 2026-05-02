const express = require('express');
const { authMiddleware, roleMiddleware } = require('./auth');
const db = require('../database/init');
const { ORDER_STATUS, STATUS_NAMES, EXCEPTION_TYPES, EXCEPTION_TYPE_NAMES } = require('../utils/constants');

const router = express.Router();

router.get('/overview', authMiddleware, roleMiddleware('ADMIN', 'DISPATCHER', 'OPERATOR'), (req, res) => {
  try {
    const statuses = Object.values(ORDER_STATUS);
    const statusCounts = {};
    let completedCount = 0;
    let pendingCount = 0;
    let exceptionCount = 0;

    const statusResults = db.prepare(
      'SELECT status, COUNT(*) as count FROM navigation_orders GROUP BY status'
    ).all();

    const statusMap = {};
    statusResults.forEach(row => {
      statusMap[row.status] = row.count;
    });

    statuses.forEach(status => {
      statusCounts[status] = statusMap[status] || 0;
      if (status === ORDER_STATUS.ARRIVED || status === ORDER_STATUS.CANCELLED) {
        completedCount += statusMap[status] || 0;
      } else if (status === ORDER_STATUS.EXCEPTION) {
        exceptionCount = statusMap[status] || 0;
      } else {
        pendingCount += statusMap[status] || 0;
      }
    });

    const totalResult = db.prepare('SELECT COUNT(*) as total FROM navigation_orders').get();

    const exceptionResult = db.prepare(
      'SELECT COUNT(*) as count FROM exception_queue WHERE status = ?'
    ).get('PENDING');

    res.json({
      success: true,
      data: {
        total: totalResult.total,
        pending: pendingCount,
        completed: completedCount,
        exception: exceptionResult.count,
        byStatus: statusCounts,
        statusNames: STATUS_NAMES,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: err.message,
    });
  }
});

router.get('/by-status', authMiddleware, roleMiddleware('ADMIN', 'DISPATCHER', 'OPERATOR'), (req, res) => {
  try {
    const results = db.prepare(`
      SELECT 
        status, 
        COUNT(*) as count,
        MIN(created_at) as first_order_time,
        MAX(created_at) as last_order_time
      FROM navigation_orders 
      GROUP BY status
    `).all();

    const data = results.map(row => ({
      status: row.status,
      statusName: STATUS_NAMES[row.status] || row.status,
      count: row.count,
      firstOrderTime: row.first_order_time,
      lastOrderTime: row.last_order_time,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '获取状态统计失败',
      error: err.message,
    });
  }
});

router.get('/by-date', authMiddleware, roleMiddleware('ADMIN', 'DISPATCHER', 'OPERATOR'), (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let whereClause = '';
    let params = [];

    if (startDate) {
      whereClause += ' AND date(created_at) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND date(created_at) <= ?';
      params.push(endDate);
    }

    const results = db.prepare(`
      SELECT 
        date(created_at) as date,
        status,
        COUNT(*) as count
      FROM navigation_orders 
      WHERE 1=1 ${whereClause}
      GROUP BY date(created_at), status
      ORDER BY date(created_at) DESC
    `).all(...params);

    const dateMap = {};
    results.forEach(row => {
      if (!dateMap[row.date]) {
        dateMap[row.date] = {
          date: row.date,
          total: 0,
          byStatus: {},
        };
      }
      dateMap[row.date].byStatus[row.status] = row.count;
      dateMap[row.date].total += row.count;
    });

    const data = Object.values(dateMap);

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '获取日期统计失败',
      error: err.message,
    });
  }
});

router.get('/exceptions', authMiddleware, roleMiddleware('ADMIN', 'DISPATCHER', 'OPERATOR'), (req, res) => {
  try {
    const { status } = req.query;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (status) {
      whereClause += ' AND eq.status = ?';
      params.push(status);
    }

    const results = db.prepare(`
      SELECT 
        eq.*,
        no.order_no,
        no.status as order_status,
        no.origin_address,
        no.dest_address
      FROM exception_queue eq
      LEFT JOIN navigation_orders no ON eq.order_id = no.id
      ${whereClause}
      ORDER BY eq.created_at DESC
    `).all(...params);

    const data = results.map(row => ({
      ...row,
      exceptionTypeName: EXCEPTION_TYPE_NAMES[row.exception_type] || row.exception_type,
      orderStatusName: STATUS_NAMES[row.order_status] || row.order_status,
      originalData: row.original_data ? JSON.parse(row.original_data) : null,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '获取异常队列失败',
      error: err.message,
    });
  }
});

router.get('/exceptions/stats', authMiddleware, roleMiddleware('ADMIN', 'DISPATCHER', 'OPERATOR'), (req, res) => {
  try {
    const results = db.prepare(`
      SELECT 
        exception_type,
        status,
        COUNT(*) as count
      FROM exception_queue
      GROUP BY exception_type, status
    `).all();

    const stats = {
      byType: {},
      byStatus: {
        PENDING: 0,
        PROCESSING: 0,
        RESOLVED: 0,
        FAILED: 0,
      },
      total: 0,
    };

    results.forEach(row => {
      if (!stats.byType[row.exception_type]) {
        stats.byType[row.exception_type] = {
          name: EXCEPTION_TYPE_NAMES[row.exception_type] || row.exception_type,
          count: 0,
          byStatus: {},
        };
      }
      stats.byType[row.exception_type].count += row.count;
      stats.byType[row.exception_type].byStatus[row.status] = row.count;
      stats.byStatus[row.status] = (stats.byStatus[row.status] || 0) + row.count;
      stats.total += row.count;
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '获取异常统计失败',
      error: err.message,
    });
  }
});

router.get('/drilldown', authMiddleware, roleMiddleware('ADMIN', 'DISPATCHER', 'OPERATOR'), (req, res) => {
  try {
    const { status, exceptionType, startDate, endDate, page = 1, pageSize = 20 } = req.query;

    let whereClauses = ['1=1'];
    let params = [];

    if (status) {
      whereClauses.push('no.status = ?');
      params.push(status);
    }

    if (exceptionType) {
      whereClauses.push('eq.exception_type = ?');
      params.push(exceptionType);
    }

    if (startDate) {
      whereClauses.push('date(no.created_at) >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereClauses.push('date(no.created_at) <= ?');
      params.push(endDate);
    }

    const whereSql = whereClauses.join(' AND ');

    const countResult = db.prepare(`
      SELECT COUNT(DISTINCT no.id) as total
      FROM navigation_orders no
      LEFT JOIN exception_queue eq ON no.id = eq.order_id
      WHERE ${whereSql}
    `).get(...params);

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const results = db.prepare(`
      SELECT DISTINCT
        no.id,
        no.order_no,
        no.status,
        no.origin_address,
        no.dest_address,
        no.created_at,
        no.updated_at,
        eq.id as exception_id,
        eq.exception_type,
        eq.status as exception_status,
        eq.exception_message
      FROM navigation_orders no
      LEFT JOIN exception_queue eq ON no.id = eq.order_id
      WHERE ${whereSql}
      ORDER BY no.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const data = results.map(row => ({
      id: row.id,
      orderNo: row.order_no,
      status: row.status,
      statusName: STATUS_NAMES[row.status] || row.status,
      originAddress: row.origin_address,
      destAddress: row.dest_address,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      hasException: !!row.exception_id,
      exceptionType: row.exception_type,
      exceptionTypeName: row.exception_type ? (EXCEPTION_TYPE_NAMES[row.exception_type] || row.exception_type) : null,
      exceptionStatus: row.exception_status,
      exceptionMessage: row.exception_message,
    }));

    res.json({
      success: true,
      data: {
        total: countResult.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(countResult.total / parseInt(pageSize)),
        items: data,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '获取穿透数据失败',
      error: err.message,
    });
  }
});

router.get('/order-detail/:id', authMiddleware, roleMiddleware('ADMIN', 'DISPATCHER', 'OPERATOR'), (req, res) => {
  try {
    const orderId = req.params.id;

    const order = db.prepare('SELECT * FROM navigation_orders WHERE id = ?').get(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在',
      });
    }

    const timeAxis = db.prepare(
      'SELECT * FROM time_axis WHERE order_id = ? ORDER BY created_at'
    ).all(orderId);

    const exceptions = db.prepare(
      'SELECT * FROM exception_queue WHERE order_id = ? ORDER BY created_at'
    ).all(orderId);

    const messages = db.prepare(
      'SELECT * FROM messages WHERE order_id = ? ORDER BY created_at'
    ).all(orderId);

    res.json({
      success: true,
      data: {
        order: {
          ...order,
          statusName: STATUS_NAMES[order.status],
        },
        timeAxis: timeAxis.map(ta => ({
          ...ta,
          statusBeforeName: ta.status_before ? (STATUS_NAMES[ta.status_before] || ta.status_before) : null,
          statusAfterName: ta.status_after ? (STATUS_NAMES[ta.status_after] || ta.status_after) : null,
        })),
        exceptions: exceptions.map(ex => ({
          ...ex,
          exceptionTypeName: EXCEPTION_TYPE_NAMES[ex.exception_type] || ex.exception_type,
          originalData: ex.original_data ? JSON.parse(ex.original_data) : null,
        })),
        messages,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '获取订单详情失败',
      error: err.message,
    });
  }
});

module.exports = router;
