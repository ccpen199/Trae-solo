const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');
const { getDB } = require('../database/init');

class TimelineEngine {
  constructor() {
    this.eventTypes = {
      LIVE_START: 'LIVE_START',
      LIVE_END: 'LIVE_END',
      FLASH_SALE_START: 'FLASH_SALE_START',
      FLASH_SALE_END: 'FLASH_SALE_END',
      FLASH_SALE_REQUEST: 'FLASH_SALE_REQUEST',
      FLASH_SALE_SUCCESS: 'FLASH_SALE_SUCCESS',
      FLASH_SALE_FAILED: 'FLASH_SALE_FAILED',
      INVENTORY_LOCK: 'INVENTORY_LOCK',
      INVENTORY_UNLOCK: 'INVENTORY_UNLOCK',
      INVENTORY_DEDUCT: 'INVENTORY_DEDUCT',
      INVENTORY_ADD: 'INVENTORY_ADD',
      ORDER_CREATE: 'ORDER_CREATE',
      ORDER_PAY: 'ORDER_PAY',
      ORDER_SHIP: 'ORDER_SHIP',
      ORDER_DELIVER: 'ORDER_DELIVER',
      ORDER_CANCEL: 'ORDER_CANCEL',
      CHAT_MESSAGE: 'CHAT_MESSAGE',
      PRODUCT_MARKER: 'PRODUCT_MARKER',
      VIEWER_JOIN: 'VIEWER_JOIN',
      VIEWER_LEAVE: 'VIEWER_LEAVE',
      LIKE: 'LIKE',
      GIFT_SEND: 'GIFT_SEND'
    };
  }

  async recordEvent(eventData) {
    const db = getDB();
    const eventId = uuidv4();
    const now = Date.now();

    try {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO timeline_events (
            id, event_type, live_stream_id, user_id, product_id, order_id, flash_sale_id, data, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          eventId,
          eventData.eventType,
          eventData.liveStreamId || null,
          eventData.userId || null,
          eventData.productId || null,
          eventData.orderId || null,
          eventData.flashSaleId || null,
          eventData.data || null,
          now
        ], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      logger.debug('时间线事件已记录', {
        eventId,
        eventType: eventData.eventType,
        liveStreamId: eventData.liveStreamId
      });

      return eventId;
    } catch (error) {
      logger.error('记录时间线事件失败:', error);
      throw error;
    }
  }

  async getLiveTimeline(liveStreamId, options = {}) {
    const db = getDB();
    const { limit = 100, offset = 0, eventTypes = null, startTime = null, endTime = null } = options;

    let query = 'SELECT * FROM timeline_events WHERE live_stream_id = ?';
    const params = [liveStreamId];

    if (eventTypes && eventTypes.length > 0) {
      query += ` AND event_type IN (${eventTypes.map(() => '?').join(',')})`;
      params.push(...eventTypes);
    }

    if (startTime) {
      query += ' AND created_at >= ?';
      params.push(startTime);
    }

    if (endTime) {
      query += ' AND created_at <= ?';
      params.push(endTime);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else {
          const events = rows.map(row => ({
            id: row.id,
            eventType: row.event_type,
            liveStreamId: row.live_stream_id,
            userId: row.user_id,
            productId: row.product_id,
            orderId: row.order_id,
            flashSaleId: row.flash_sale_id,
            data: row.data ? JSON.parse(row.data) : null,
            createdAt: row.created_at
          }));
          resolve(events);
        }
      });
    });
  }

  async getUserTimeline(userId, options = {}) {
    const db = getDB();
    const { limit = 100, offset = 0, eventTypes = null } = options;

    let query = 'SELECT * FROM timeline_events WHERE user_id = ?';
    const params = [userId];

    if (eventTypes && eventTypes.length > 0) {
      query += ` AND event_type IN (${eventTypes.map(() => '?').join(',')})`;
      params.push(...eventTypes);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else {
          const events = rows.map(row => ({
            id: row.id,
            eventType: row.event_type,
            liveStreamId: row.live_stream_id,
            userId: row.user_id,
            productId: row.product_id,
            orderId: row.order_id,
            flashSaleId: row.flash_sale_id,
            data: row.data ? JSON.parse(row.data) : null,
            createdAt: row.created_at
          }));
          resolve(events);
        }
      });
    });
  }

  async getAuditLog(options = {}) {
    const db = getDB();
    const { 
      limit = 500, 
      offset = 0, 
      eventTypes = null,
      startTime = null,
      endTime = null,
      userId = null,
      liveStreamId = null
    } = options;

    let query = `
      SELECT 
        te.*,
        u.username as user_name,
        u.role as user_role,
        p.name as product_name,
        ls.title as live_title
      FROM timeline_events te
      LEFT JOIN users u ON te.user_id = u.id
      LEFT JOIN products p ON te.product_id = p.id
      LEFT JOIN live_streams ls ON te.live_stream_id = ls.id
      WHERE 1=1
    `;
    const params = [];

    if (eventTypes && eventTypes.length > 0) {
      query += ` AND te.event_type IN (${eventTypes.map(() => '?').join(',')})`;
      params.push(...eventTypes);
    }

    if (startTime) {
      query += ' AND te.created_at >= ?';
      params.push(startTime);
    }

    if (endTime) {
      query += ' AND te.created_at <= ?';
      params.push(endTime);
    }

    if (userId) {
      query += ' AND te.user_id = ?';
      params.push(userId);
    }

    if (liveStreamId) {
      query += ' AND te.live_stream_id = ?';
      params.push(liveStreamId);
    }

    query += ' ORDER BY te.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else {
          const events = rows.map(row => ({
            id: row.id,
            eventType: row.event_type,
            liveStreamId: row.live_stream_id,
            liveTitle: row.live_title,
            userId: row.user_id,
            userName: row.user_name,
            userRole: row.user_role,
            productId: row.product_id,
            productName: row.product_name,
            orderId: row.order_id,
            flashSaleId: row.flash_sale_id,
            data: row.data ? JSON.parse(row.data) : null,
            createdAt: row.created_at
          }));
          resolve(events);
        }
      });
    });
  }

  async getStatistics(liveStreamId) {
    const db = getDB();
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const liveStream = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM live_streams WHERE id = ?', [liveStreamId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!liveStream) {
      return null;
    }

    const stats = {
      liveStreamId,
      title: liveStream.title,
      status: liveStream.status,
      startTime: liveStream.start_time,
      endTime: liveStream.end_time,
      viewerCount: liveStream.viewer_count,
      likeCount: liveStream.like_count,
      orders: {
        total: 0,
        pending: 0,
        paid: 0,
        shipped: 0,
        completed: 0,
        totalAmount: 0
      },
      flashSales: {
        total: 0,
        active: 0,
        ended: 0,
        totalSold: 0,
        totalRevenue: 0
      },
      inventoryChanges: {
        locked: 0,
        deducted: 0,
        added: 0
      },
      interactions: {
        chatMessages: 0,
        likes: 0,
        gifts: 0
      }
    };

    const orderStats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          status,
          COUNT(*) as count,
          SUM(total_amount) as amount
        FROM orders 
        WHERE live_stream_id = ?
        GROUP BY status
      `, [liveStreamId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    orderStats.forEach(row => {
      const count = row.count;
      const amount = row.amount || 0;
      
      stats.orders.total += count;
      stats.orders.totalAmount += amount;
      
      if (row.status === 'pending_payment') stats.orders.pending += count;
      else if (row.status === 'paid') stats.orders.paid += count;
      else if (row.status === 'shipped') stats.orders.shipped += count;
      else if (row.status === 'delivered') stats.orders.completed += count;
    });

    const flashSaleStats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          status,
          COUNT(*) as count,
          SUM(sold_count) as total_sold
        FROM flash_sales 
        WHERE live_stream_id = ?
        GROUP BY status
      `, [liveStreamId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    flashSaleStats.forEach(row => {
      stats.flashSales.total += row.count;
      stats.flashSales.totalSold += row.total_sold || 0;
      
      if (row.status === 'active') stats.flashSales.active += row.count;
      else if (row.status === 'ended') stats.flashSales.ended += row.count;
    });

    const inventoryStats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          change_type,
          SUM(ABS(quantity_change)) as total
        FROM inventory_logs 
        WHERE live_stream_id = ?
        GROUP BY change_type
      `, [liveStreamId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    inventoryStats.forEach(row => {
      if (row.change_type === 'LOCK') stats.inventoryChanges.locked += row.total;
      else if (row.change_type === 'DEDUCT') stats.inventoryChanges.deducted += row.total;
      else if (row.change_type === 'ADD') stats.inventoryChanges.added += row.total;
    });

    const chatCount = await new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(*) as count FROM chat_messages WHERE live_stream_id = ?
      `, [liveStreamId], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.count : 0);
      });
    });

    stats.interactions.chatMessages = chatCount;

    return stats;
  }
}

module.exports = new TimelineEngine();
