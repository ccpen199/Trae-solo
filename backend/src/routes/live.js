const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { requirePermission, requireRole, PERMISSIONS, ROLES } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { getDB } = require('../database/init');
const TimelineEngine = require('../engines/TimelineEngine');
const LiveInteractionEngine = require('../engines/LiveInteractionEngine');

const router = express.Router();

router.get('/list', asyncHandler(async (req, res) => {
  const { status = 'live', limit = 20, offset = 0 } = req.query;
  const db = getDB();

  const query = `
    SELECT 
      ls.*,
      u.nickname as streamer_name,
      u.avatar as streamer_avatar
    FROM live_streams ls
    LEFT JOIN users u ON ls.streamer_id = u.id
    WHERE ls.status = ?
    ORDER BY ls.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const liveStreams = await new Promise((resolve, reject) => {
    db.all(query, [status, parseInt(limit), parseInt(offset)], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const total = await new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM live_streams WHERE status = ?', [status], (err, row) => {
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

router.get('/my', requireRole(ROLES.STREAMER), asyncHandler(async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const db = getDB();

  const liveStreams = await new Promise((resolve, reject) => {
    db.all(`
      SELECT * FROM live_streams 
      WHERE streamer_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [req.user.id, parseInt(limit), parseInt(offset)], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const total = await new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM live_streams WHERE streamer_id = ?', [req.user.id], (err, row) => {
      if (err) reject(err);
      else resolve(row ? row.count : 0);
    });
  });

  res.json({
    success: true,
    data: {
      list: liveStreams,
      total
    }
  });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const db = getDB();

  const liveStream = await new Promise((resolve, reject) => {
    db.get(`
      SELECT 
        ls.*,
        u.nickname as streamer_name,
        u.avatar as streamer_avatar
      FROM live_streams ls
      LEFT JOIN users u ON ls.streamer_id = u.id
      WHERE ls.id = ?
    `, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!liveStream) {
    throw new AppError('直播间不存在', 404, 'LIVE_STREAM_NOT_FOUND');
  }

  const products = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        lp.*,
        p.name,
        p.description,
        p.price,
        p.original_price,
        p.image_url,
        p.stock as total_stock
      FROM live_products lp
      LEFT JOIN products p ON lp.product_id = p.id
      WHERE lp.live_stream_id = ? AND lp.is_active = 1
      ORDER BY lp.display_order ASC
    `, [id], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  res.json({
    success: true,
    data: {
      ...liveStream,
      products
    }
  });
}));

router.post('/create', requireRole(ROLES.STREAMER), asyncHandler(async (req, res) => {
  const { title, productIds = [] } = req.body;

  if (!title) {
    throw new AppError('请输入直播标题', 400, 'MISSING_TITLE');
  }

  const db = getDB();
  const liveStreamId = uuidv4();
  const now = Date.now();
  const streamKey = uuidv4().replace(/-/g, '').substring(0, 32);

  await new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO live_streams (id, title, streamer_id, status, stream_key, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [liveStreamId, title, req.user.id, 'pending', streamKey, now], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (productIds.length > 0) {
    const stmt = db.prepare('INSERT INTO live_products (id, live_stream_id, product_id, display_order, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    
    for (let i = 0; i < productIds.length; i++) {
      const product = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM products WHERE id = ?', [productIds[i]], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (product) {
        stmt.run(
          uuidv4(),
          liveStreamId,
          productIds[i],
          i,
          1,
          now
        );
      }
    }
    
    stmt.finalize();
  }

  logger.info('直播间创建成功', { liveStreamId, streamerId: req.user.id, title });

  res.status(201).json({
    success: true,
    data: {
      id: liveStreamId,
      title,
      streamerId: req.user.id,
      status: 'pending',
      streamKey
    }
  });
}));

router.post('/:id/start', requireRole(ROLES.STREAMER), requirePermission(PERMISSIONS.START_LIVE), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const db = getDB();

  const liveStream = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM live_streams WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!liveStream) {
    throw new AppError('直播间不存在', 404, 'LIVE_STREAM_NOT_FOUND');
  }

  if (liveStream.streamer_id !== req.user.id) {
    throw new AppError('无权限操作此直播间', 403, 'FORBIDDEN');
  }

  if (liveStream.status === 'live') {
    throw new AppError('直播已在进行中', 400, 'ALREADY_LIVE');
  }

  const now = Date.now();

  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE live_streams SET status = ?, start_time = ? WHERE id = ?
    `, ['live', now, id], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  await TimelineEngine.recordEvent({
    eventType: 'LIVE_START',
    liveStreamId: id,
    userId: req.user.id,
    data: JSON.stringify({ title: liveStream.title })
  });

  logger.info('直播开始', { liveStreamId: id, streamerId: req.user.id });

  res.json({
    success: true,
    data: {
      id,
      status: 'live',
      startTime: now
    }
  });
}));

router.post('/:id/end', requireRole(ROLES.STREAMER), requirePermission(PERMISSIONS.END_LIVE), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const db = getDB();

  const liveStream = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM live_streams WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!liveStream) {
    throw new AppError('直播间不存在', 404, 'LIVE_STREAM_NOT_FOUND');
  }

  if (liveStream.streamer_id !== req.user.id) {
    throw new AppError('无权限操作此直播间', 403, 'FORBIDDEN');
  }

  if (liveStream.status !== 'live') {
    throw new AppError('直播未在进行中', 400, 'NOT_LIVE');
  }

  const now = Date.now();
  const replayUrl = `/replays/${id}/playlist.m3u8`;

  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE live_streams SET status = ?, end_time = ?, replay_url = ? WHERE id = ?
    `, ['ended', now, replayUrl, id], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  await TimelineEngine.recordEvent({
    eventType: 'LIVE_END',
    liveStreamId: id,
    userId: req.user.id,
    data: JSON.stringify({
      viewerCount: liveStream.viewer_count,
      likeCount: liveStream.like_count
    })
  });

  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE flash_sales SET status = ? WHERE live_stream_id = ? AND status = ?
    `, ['ended', id, 'active'], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const stats = await TimelineEngine.getStatistics(id);

  logger.info('直播结束', { liveStreamId: id, streamerId: req.user.id });

  res.json({
    success: true,
    data: {
      id,
      status: 'ended',
      endTime: now,
      replayUrl,
      stats
    }
  });
}));

router.get('/:id/stats', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const stats = await TimelineEngine.getStatistics(id);

  if (!stats) {
    throw new AppError('直播间不存在', 404, 'LIVE_STREAM_NOT_FOUND');
  }

  res.json({
    success: true,
    data: stats
  });
}));

router.get('/:id/messages', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  const db = getDB();

  const messages = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        cm.*,
        u.nickname as nickname,
        u.username as username
      FROM chat_messages cm
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE cm.live_stream_id = ?
      ORDER BY cm.created_at DESC
      LIMIT ? OFFSET ?
    `, [id, parseInt(limit), parseInt(offset)], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  res.json({
    success: true,
    data: {
      list: messages,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  });
}));

module.exports = router;
