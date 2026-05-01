const { logger } = require('../utils/logger');
const { wsAuthMiddleware } = require('../middleware/auth');
const LiveInteractionEngine = require('../engines/LiveInteractionEngine');

function initWebSocket(io) {
  LiveInteractionEngine.init(io);

  io.use((socket, next) => {
    wsAuthMiddleware(socket, (err) => {
      if (err) {
        logger.warn('WebSocket 认证失败:', err.message);
        next(new Error('认证失败'));
      } else {
        next();
      }
    });
  });

  io.on('connection', (socket) => {
    logger.info('WebSocket 连接建立', { socketId: socket.id, userId: socket.user?.id });
    
    LiveInteractionEngine.handleConnection(socket);

    socket.on('error', (error) => {
      logger.error('WebSocket 错误:', error);
    });
  });

  io.on('error', (error) => {
    logger.error('WebSocket 服务器错误:', error);
  });

  logger.info('WebSocket 服务器已初始化');
}

module.exports = initWebSocket;
