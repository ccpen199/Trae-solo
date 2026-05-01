const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');
const { getDB } = require('../database/init');
const TimelineEngine = require('./TimelineEngine');

class LiveInteractionEngine {
  constructor() {
    this.activeRooms = new Map();
    this.userSockets = new Map();
    this.socketUsers = new Map();
  }

  init(io) {
    this.io = io;
    logger.info('LiveInteractionEngine 已初始化');
  }

  handleConnection(socket) {
    const userId = socket.user?.id;
    if (!userId) {
      logger.warn('未授权的 WebSocket 连接尝试');
      return;
    }

    this.socketUsers.set(socket.id, userId);
    
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(socket.id);

    logger.info('用户连接 WebSocket', { userId, socketId: socket.id });

    socket.on('join_live', async (data) => {
      await this.handleJoinLive(socket, data);
    });

    socket.on('leave_live', async (data) => {
      await this.handleLeaveLive(socket, data);
    });

    socket.on('send_message', async (data) => {
      await this.handleSendMessage(socket, data);
    });

    socket.on('send_like', async (data) => {
      await this.handleSendLike(socket, data);
    });

    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  async handleJoinLive(socket, data) {
    const { liveStreamId } = data;
    const userId = socket.user?.id;

    if (!liveStreamId || !userId) {
      socket.emit('error', { message: '参数错误' });
      return;
    }

    const db = getDB();
    const liveStream = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM live_streams WHERE id = ?', [liveStreamId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!liveStream) {
      socket.emit('error', { message: '直播间不存在' });
      return;
    }

    if (liveStream.status !== 'live') {
      socket.emit('error', { message: '直播未开始' });
      return;
    }

    socket.join(`live:${liveStreamId}`);

    if (!this.activeRooms.has(liveStreamId)) {
      this.activeRooms.set(liveStreamId, {
        viewers: new Set(),
        streamerId: liveStream.streamer_id
      });
    }

    const room = this.activeRooms.get(liveStreamId);
    room.viewers.add(userId);

    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE live_streams SET viewer_count = viewer_count + 1 WHERE id = ?',
        [liveStreamId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    await TimelineEngine.recordEvent({
      eventType: 'VIEWER_JOIN',
      liveStreamId,
      userId,
      data: JSON.stringify({ viewerCount: room.viewers.size })
    });

    socket.emit('joined_live', {
      liveStreamId,
      viewerCount: room.viewers.size,
      likeCount: liveStream.like_count
    });

    this.io.to(`live:${liveStreamId}`).emit('viewer_count', {
      viewerCount: room.viewers.size
    });

    logger.info('用户加入直播间', { userId, liveStreamId });
  }

  async handleLeaveLive(socket, data) {
    const { liveStreamId } = data;
    const userId = socket.user?.id;

    if (!liveStreamId || !userId) {
      return;
    }

    socket.leave(`live:${liveStreamId}`);

    const room = this.activeRooms.get(liveStreamId);
    if (room) {
      room.viewers.delete(userId);

      const db = getDB();
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE live_streams SET viewer_count = MAX(0, viewer_count - 1) WHERE id = ?',
          [liveStreamId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      await TimelineEngine.recordEvent({
        eventType: 'VIEWER_LEAVE',
        liveStreamId,
        userId,
        data: JSON.stringify({ viewerCount: room.viewers.size })
      });

      this.io.to(`live:${liveStreamId}`).emit('viewer_count', {
        viewerCount: room.viewers.size
      });

      socket.emit('left_live', { liveStreamId });

      logger.info('用户离开直播间', { userId, liveStreamId });
    }
  }

  async handleSendMessage(socket, data) {
    const { liveStreamId, content, messageType = 'text' } = data;
    const userId = socket.user?.id;

    if (!liveStreamId || !content || !userId) {
      socket.emit('error', { message: '参数错误' });
      return;
    }

    if (content.length > 500) {
      socket.emit('error', { message: '消息内容过长' });
      return;
    }

    const db = getDB();
    const messageId = uuidv4();
    const now = Date.now();

    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO chat_messages (id, live_stream_id, user_id, content, message_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [messageId, liveStreamId, userId, content, messageType, now], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await TimelineEngine.recordEvent({
      eventType: 'CHAT_MESSAGE',
      liveStreamId,
      userId,
      data: JSON.stringify({ content: content.substring(0, 50) })
    });

    const message = {
      id: messageId,
      liveStreamId,
      userId,
      username: user?.username || '匿名用户',
      nickname: user?.nickname || user?.username,
      content,
      messageType,
      createdAt: now
    };

    this.io.to(`live:${liveStreamId}`).emit('chat_message', message);

    logger.debug('发送弹幕消息', { userId, liveStreamId, content: content.substring(0, 20) });
  }

  async handleSendLike(socket, data) {
    const { liveStreamId, count = 1 } = data;
    const userId = socket.user?.id;

    if (!liveStreamId || !userId) {
      socket.emit('error', { message: '参数错误' });
      return;
    }

    const likeCount = Math.min(count, 100);

    const db = getDB();
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE live_streams SET like_count = like_count + ? WHERE id = ?',
        [likeCount, liveStreamId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    const liveStream = await new Promise((resolve, reject) => {
      db.get('SELECT like_count FROM live_streams WHERE id = ?', [liveStreamId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    await TimelineEngine.recordEvent({
      eventType: 'LIKE',
      liveStreamId,
      userId,
      data: JSON.stringify({ likeCount, totalLikes: liveStream?.like_count || 0 })
    });

    this.io.to(`live:${liveStreamId}`).emit('like_count', {
      likeCount: liveStream?.like_count || 0,
      userId,
      count: likeCount
    });

    logger.debug('点赞', { userId, liveStreamId, likeCount });
  }

  handleDisconnect(socket) {
    const userId = this.socketUsers.get(socket.id);
    if (userId) {
      const userSockets = this.userSockets.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          this.userSockets.delete(userId);
          
          this.activeRooms.forEach((room, liveStreamId) => {
            if (room.viewers.has(userId)) {
              room.viewers.delete(userId);
              
              this.io.to(`live:${liveStreamId}`).emit('viewer_count', {
                viewerCount: room.viewers.size
              });
            }
          });
        }
      }
      
      this.socketUsers.delete(socket.id);
      logger.info('用户断开 WebSocket', { userId, socketId: socket.id });
    }
  }

  async broadcastFlashSaleStart(liveStreamId, flashSaleData) {
    this.io.to(`live:${liveStreamId}`).emit('flash_sale_start', {
      ...flashSaleData,
      timestamp: Date.now()
    });

    await TimelineEngine.recordEvent({
      eventType: 'FLASH_SALE_START',
      liveStreamId,
      productId: flashSaleData.productId,
      flashSaleId: flashSaleData.id,
      data: JSON.stringify(flashSaleData)
    });

    logger.info('广播秒杀活动开始', { liveStreamId, flashSaleId: flashSaleData.id });
  }

  async broadcastFlashSaleEnd(liveStreamId, flashSaleId) {
    this.io.to(`live:${liveStreamId}`).emit('flash_sale_end', {
      flashSaleId,
      timestamp: Date.now()
    });

    await TimelineEngine.recordEvent({
      eventType: 'FLASH_SALE_END',
      liveStreamId,
      flashSaleId,
      data: JSON.stringify({ flashSaleId })
    });

    logger.info('广播秒杀活动结束', { liveStreamId, flashSaleId });
  }

  async broadcastOrderUpdate(liveStreamId, orderData) {
    this.io.to(`live:${liveStreamId}`).emit('order_update', {
      ...orderData,
      timestamp: Date.now()
    });

    logger.debug('广播订单更新', { liveStreamId, orderId: orderData.orderId });
  }

  async broadcastInventoryUpdate(liveStreamId, inventoryData) {
    this.io.to(`live:${liveStreamId}`).emit('inventory_update', {
      ...inventoryData,
      timestamp: Date.now()
    });

    logger.debug('广播库存更新', { liveStreamId, productId: inventoryData.productId });
  }

  getViewerCount(liveStreamId) {
    const room = this.activeRooms.get(liveStreamId);
    return room ? room.viewers.size : 0;
  }

  getActiveLives() {
    return Array.from(this.activeRooms.entries()).map(([liveStreamId, room]) => ({
      liveStreamId,
      streamerId: room.streamerId,
      viewerCount: room.viewers.size
    }));
  }
}

module.exports = new LiveInteractionEngine();
