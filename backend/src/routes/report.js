const express = require('express');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { requireRole, PERMISSIONS, ROLES } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { getDB } = require('../database/init');

const router = express.Router();

router.get('/overview', requireRole(ROLES.PLATFORM_ADMIN), asyncHandler(async (req, res) => {
  const db = getDB();

  const userStats = await new Promise((resolve, reject) => {
    db.all('SELECT role, COUNT(*) as count FROM users GROUP BY role', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const liveStats = await new Promise((resolve, reject) => {
    db.all('SELECT status, COUNT(*) as count FROM live_streams GROUP BY status', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const orderStats = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        status, 
        COUNT(*) as count,
        SUM(total_amount) as total_amount
      FROM orders 
      GROUP BY status
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const productStats = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        status, 
        COUNT(*) as count,
        SUM(stock) as total_stock
      FROM products 
      GROUP BY status
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  const todayOrders = await new Promise((resolve, reject) => {
    db.get(`
      SELECT COUNT(*) as count, SUM(total_amount) as total_amount
      FROM orders WHERE created_at >= ?
    `, [todayTimestamp], (err, row) => {
      if (err) reject(err);
      else resolve(row || { count: 0, total_amount: 0 });
    });
  });

  const liveStreamsToday = await new Promise((resolve, reject) => {
    db.get(`
      SELECT COUNT(*) as count FROM live_streams WHERE created_at >= ?
    `, [todayTimestamp], (err, row) => {
      if (err) reject(err);
      else resolve(row ? row.count : 0);
    });
  });

  const activeViewers = await new Promise((resolve, reject) => {
    db.get(`
      SELECT SUM(viewer_count) as total FROM live_streams WHERE status = 'live'
    `, (err, row) => {
      if (err) reject(err);
      else resolve(row ? row.total : 0);
    });
  });

  res.json({
    success: true,
    data: {
      users: {
        total: userStats.reduce((sum, u) => sum + u.count, 0),
        byRole: userStats
      },
      liveStreams: {
        total: liveStats.reduce((sum, l) => sum + l.count, 0),
        active: liveStats.find(l => l.status === 'live')?.count || 0,
        ended: liveStats.find(l => l.status === 'ended')?.count || 0,
        today: liveStreamsToday
      },
      orders: {
        total: orderStats.reduce((sum, o) => sum + o.count, 0),
        totalRevenue: orderStats.reduce((sum, o) => sum + (o.total_amount || 0), 0),
        today: {
          count: todayOrders.count || 0,
          revenue: todayOrders.total_amount || 0
        },
        byStatus: orderStats
      },
      products: {
        total: productStats.reduce((sum, p) => sum + p.count, 0),
        active: productStats.find(p => p.status === 'active')?.count || 0,
        totalStock: productStats.reduce((sum, p) => sum + (p.total_stock || 0), 0)
      },
      realtime: {
        activeViewers: activeViewers || 0,
        activeLives: liveStats.find(l => l.status === 'live')?.count || 0
      }
    }
  });
}));

router.get('/live-streams', requireRole(ROLES.PLATFORM_ADMIN, ROLES.STREAMER), asyncHandler(async (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query;
  const db = getDB();

  let query = `
    SELECT 
      ls.*,
      u.nickname as streamer_name,
      u.username as streamer_username,
      (SELECT COUNT(*) FROM orders WHERE live_stream_id = ls.id) as order_count,
      (SELECT SUM(total_amount) FROM orders WHERE live_stream_id = ls.id) as total_revenue,
      (SELECT COUNT(*) FROM flash_sales WHERE live_stream_id = ls.id) as flash_sale_count
    FROM live_streams ls
    LEFT JOIN users u ON ls.streamer_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role === 'streamer') {
    query += ' AND ls.streamer_id = ?';
    params.push(req.user.id);
  }

  if (status) {
    query += ' AND ls.status = ?';
    params.push(status);
  }

  query += ' ORDER BY ls.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const liveStreams = await new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const total = await new Promise((resolve, reject) => {
    let countQuery = 'SELECT COUNT(*) as count FROM live_streams WHERE 1=1';
    const countParams = [];

    if (req.user.role === 'streamer') {
      countQuery += ' AND streamer_id = ?';
      countParams.push(req.user.id);
    }

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    db.get(countQuery, countParams, (err, row) => {
      if (err) reject(err);
      else resolve(row ? row.count : 0);
    });
  });

  res.json({
    success: true,
    data: {
      list: liveStreams,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  });
}));

router.get('/top-products', requireRole(ROLES.PLATFORM_ADMIN, ROLES.MERCHANT), asyncHandler(async (req, res) => {
  const { limit = 20, startTime, endTime } = req.query;
  const db = getDB();

  let query = `
    SELECT 
      p.*,
      u.nickname as merchant_name,
      COUNT(o.id) as order_count,
      SUM(o.quantity) as total_quantity,
      SUM(o.total_amount) as total_revenue
    FROM products p
    LEFT JOIN users u ON p.merchant_id = u.id
    LEFT JOIN orders o ON p.id = o.product_id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role === 'merchant') {
    query += ' AND p.merchant_id = ?';
    params.push(req.user.id);
  }

  if (startTime) {
    query += ' AND o.created_at >= ?';
    params.push(parseInt(startTime));
  }

  if (endTime) {
    query += ' AND o.created_at <= ?';
    params.push(parseInt(endTime));
  }

  query += ' GROUP BY p.id HAVING order_count > 0 ORDER BY total_revenue DESC LIMIT ?';
  params.push(parseInt(limit));

  const products = await new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  res.json({
    success: true,
    data: products
  });
}));

router.get('/top-streamers', requireRole(ROLES.PLATFORM_ADMIN), asyncHandler(async (req, res) => {
  const { limit = 10, startTime, endTime } = req.query;
  const db = getDB();

  let query = `
    SELECT 
      u.id,
      u.username,
      u.nickname,
      u.avatar,
      COUNT(ls.id) as live_count,
      SUM(ls.viewer_count) as total_viewers,
      SUM(ls.like_count) as total_likes,
      COUNT(o.id) as order_count,
      SUM(o.total_amount) as total_revenue
    FROM users u
    LEFT JOIN live_streams ls ON u.id = ls.streamer_id
    LEFT JOIN orders o ON ls.id = o.live_stream_id
    WHERE u.role = 'streamer'
  `;
  const params = [];

  if (startTime) {
    query += ' AND ls.created_at >= ?';
    params.push(parseInt(startTime));
  }

  if (endTime) {
    query += ' AND ls.created_at <= ?';
    params.push(parseInt(endTime));
  }

  query += ' GROUP BY u.id ORDER BY total_revenue DESC LIMIT ?';
  params.push(parseInt(limit));

  const streamers = await new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  res.json({
    success: true,
    data: streamers
  });
}));

router.get('/flash-sales', requireRole(ROLES.PLATFORM_ADMIN), asyncHandler(async (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query;
  const db = getDB();

  let query = `
    SELECT 
      fs.*,
      p.name as product_name,
      p.image_url,
      lp.flash_price,
      ls.title as live_title,
      u.nickname as streamer_name
    FROM flash_sales fs
    LEFT JOIN products p ON fs.product_id = p.id
    LEFT JOIN live_products lp ON fs.live_product_id = lp.id
    LEFT JOIN live_streams ls ON fs.live_stream_id = ls.id
    LEFT JOIN users u ON ls.streamer_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND fs.status = ?';
    params.push(status);
  }

  query += ' ORDER BY fs.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const flashSales = await new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const total = await new Promise((resolve, reject) => {
    let countQuery = 'SELECT COUNT(*) as count FROM flash_sales WHERE 1=1';
    const countParams = [];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    db.get(countQuery, countParams, (err, row) => {
      if (err) reject(err);
      else resolve(row ? row.count : 0);
    });
  });

  res.json({
    success: true,
    data: {
      list: flashSales,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  });
}));

module.exports = router;
