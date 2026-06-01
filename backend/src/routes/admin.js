const express = require('express');
const { db } = require('../models/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, requireRole(['admin', 'platform', 'ops']));

router.get('/parcels', (req, res) => {
  try {
    const { status, courier, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, u.username as owner_name, u.phone as owner_phone
      FROM parcels p
      LEFT JOIN users u ON p.user_id = u.id
    `;
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }

    if (courier) {
      conditions.push('p.courier LIKE ?');
      params.push(`%${courier}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY p.updated_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const parcels = db.prepare(query).all(...params);

    const countQuery = 'SELECT COUNT(*) as total FROM parcels';
    const countParams = [];
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
      countParams.push(...params.slice(0, -2));
    }
    const { total } = db.prepare(countQuery).get(...countParams);

    res.json({
      success: true,
      data: parcels,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('获取包裹列表错误:', err);
    res.status(500).json({ error: '获取包裹列表失败' });
  }
});

router.get('/orders', (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT o.*, u.username as user_name, u.phone as user_phone
      FROM shipping_orders o
      LEFT JOIN users u ON o.user_id = u.id
    `;
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push('o.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const orders = db.prepare(query).all(...params);

    const countQuery = 'SELECT COUNT(*) as total FROM shipping_orders';
    const countParams = [];
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
      countParams.push(...params.slice(0, -2));
    }
    const { total } = db.prepare(countQuery).get(...countParams);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('获取订单列表错误:', err);
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

router.get('/users', (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, username, phone, role, created_at FROM users';
    const params = [];

    if (role) {
      query += ' WHERE role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const users = db.prepare(query).all(...params);

    const countQuery = 'SELECT COUNT(*) as total FROM users';
    const countParams = [];
    if (role) {
      countQuery += ' WHERE role = ?';
      countParams.push(role);
    }
    const { total } = db.prepare(countQuery).get(...countParams);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('获取用户列表错误:', err);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

router.get('/stats', (req, res) => {
  try {
    const userStats = db.prepare(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as regular_users,
        SUM(CASE WHEN role = 'station_master' THEN 1 ELSE 0 END) as station_masters,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN role = 'platform' THEN 1 ELSE 0 END) as platform_admins,
        SUM(CASE WHEN role = 'ops' THEN 1 ELSE 0 END) as ops_admins
      FROM users
    `).get();

    const parcelStats = db.prepare(`
      SELECT 
        COUNT(*) as total_parcels,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'transit' THEN 1 ELSE 0 END) as in_transit,
        SUM(CASE WHEN status = 'out_for_delivery' THEN 1 ELSE 0 END) as out_for_delivery,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'exception' THEN 1 ELSE 0 END) as exceptions,
        SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) as returned
      FROM parcels
    `).get();

    const orderStats = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(price) as total_revenue,
        AVG(price) as avg_order_price,
        SUM(CASE WHEN status = 'created' THEN 1 ELSE 0 END) as created_orders,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders
      FROM shipping_orders
    `).get();

    const anomalyStats = db.prepare(`
      SELECT 
        COUNT(*) as total_anomalies,
        SUM(CASE WHEN status = 'detected' THEN 1 ELSE 0 END) as detected,
        SUM(CASE WHEN status = 'investigating' THEN 1 ELSE 0 END) as investigating,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
      FROM anomalies
    `).get();

    const stationStats = db.prepare(`
      SELECT 
        COUNT(*) as total_stations,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_stations,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_stations
      FROM stations
    `).get();

    const communityStats = db.prepare(`
      SELECT 
        COUNT(*) as total_posts,
        SUM(CASE WHEN type = 'help_request' THEN 1 ELSE 0 END) as help_requests,
        SUM(CASE WHEN type = 'help_offer' THEN 1 ELSE 0 END) as help_offers,
        SUM(reward) as total_rewards
      FROM community_posts
    `).get();

    const recyclingStats = db.prepare(`
      SELECT 
        COUNT(*) as total_records,
        SUM(points) as total_points,
        SUM(quantity) as total_items
      FROM recycling_records
    `).get();

    const recentActivity = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM parcels WHERE created_at >= datetime('now', '-7 days')) as parcels_last_7_days,
        (SELECT COUNT(*) FROM shipping_orders WHERE created_at >= datetime('now', '-7 days')) as orders_last_7_days,
        (SELECT COUNT(*) FROM users WHERE created_at >= datetime('now', '-7 days')) as new_users_last_7_days
    `).get();

    res.json({
      success: true,
      data: {
        users: userStats,
        parcels: parcelStats,
        orders: orderStats,
        anomalies: anomalyStats,
        stations: stationStats,
        community: communityStats,
        recycling: recyclingStats,
        recent_activity: recentActivity,
        generated_at: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('获取统计数据错误:', err);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

module.exports = router;
