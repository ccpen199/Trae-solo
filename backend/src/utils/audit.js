const { v4: uuidv4 } = require('uuid');
const { AuditLog } = require('../models');
const logger = require('./logger');

const generateTraceId = () => {
  return `TRACE-${Date.now()}-${uuidv4().substring(0, 8)}`;
};

const generateRequestId = () => {
  return `REQ-${Date.now()}-${uuidv4().substring(0, 8)}`;
};

const createAuditLog = async (options) => {
  try {
    const {
      eventType,
      userId = null,
      userRole = null,
      targetType = null,
      targetId = null,
      action,
      beforeData = null,
      afterData = null,
      changes = [],
      status = 'success',
      errorMessage = null,
      requestId = null,
      sessionId = null,
      userIp = null,
      userAgent = null
    } = options;

    const traceId = generateTraceId();
    
    const auditLog = await AuditLog.create({
      traceId,
      eventType,
      userId,
      userRole,
      targetType,
      targetId,
      action,
      beforeData,
      afterData,
      changes,
      status,
      errorMessage,
      requestId,
      sessionId,
      userIp,
      userAgent
    });

    logger.info(`审计日志已创建: ${traceId} - ${eventType} - ${action}`, {
      traceId,
      eventType,
      targetType,
      targetId
    });

    return auditLog;
  } catch (error) {
    logger.error('创建审计日志失败', error);
    return null;
  }
};

const auditMiddleware = (eventType, options = {}) => {
  return async (req, res, next) => {
    const requestId = generateRequestId();
    req.requestId = requestId;
    
    const originalJson = res.json;
    let responseData = null;
    
    res.json = function(data) {
      responseData = data;
      return originalJson.call(this, data);
    };
    
    res.on('finish', async () => {
      try {
        const isSuccess = res.statusCode >= 200 && res.statusCode < 400;
        
        await createAuditLog({
          eventType,
          userId: req.user?.id,
          userRole: req.user?.role,
          targetType: options.targetType,
          targetId: options.targetId || req.params?.id,
          action: `${req.method} ${req.path}`,
          beforeData: options.beforeData,
          afterData: responseData,
          status: isSuccess ? 'success' : 'failed',
          errorMessage: !isSuccess ? responseData?.message : null,
          requestId,
          sessionId: req.sessionId,
          userIp: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });
      } catch (error) {
        logger.error('审计中间件错误', error);
      }
    });
    
    next();
  };
};

const trackContentChange = async (userId, action, beforeContent, afterContent) => {
  const changes = [];
  
  if (beforeContent && afterContent) {
    for (const key in afterContent) {
      if (JSON.stringify(beforeContent[key]) !== JSON.stringify(afterContent[key])) {
        changes.push({
          field: key,
          before: beforeContent[key],
          after: afterContent[key]
        });
      }
    }
  }
  
  return createAuditLog({
    eventType: 'content_change',
    userId,
    userRole: beforeContent?.createdBy ? 'operator' : 'admin',
    targetType: 'content',
    targetId: afterContent?.id || beforeContent?.id,
    action,
    beforeData: beforeContent,
    afterData,
    changes,
    status: 'success'
  });
};

const trackRecommendation = async (userId, contentId, recommendationId, action) => {
  return createAuditLog({
    eventType: 'recommendation',
    userId,
    targetType: 'content',
    targetId: contentId,
    action,
    beforeData: { recommendationId },
    status: 'success'
  });
};

const trackAdDelivery = async (userId, materialId, deliveryId, action) => {
  return createAuditLog({
    eventType: 'ad_delivery',
    userId,
    targetType: 'ad_material',
    targetId: materialId,
    action,
    beforeData: { deliveryId },
    status: 'success'
  });
};

const trackNegativeFeedback = async (userId, contentId, type) => {
  return createAuditLog({
    eventType: 'negative_feedback',
    userId,
    targetType: 'content',
    targetId: contentId,
    action: `提交负反馈: ${type}`,
    status: 'success'
  });
};

const trackConfigChange = async (userId, configType, beforeConfig, afterConfig) => {
  return createAuditLog({
    eventType: 'config_change',
    userId,
    userRole: 'operator',
    targetType: configType,
    action: '修改配置',
    beforeData: beforeConfig,
    afterData: afterConfig,
    status: 'success'
  });
};

module.exports = {
  generateTraceId,
  generateRequestId,
  createAuditLog,
  auditMiddleware,
  trackContentChange,
  trackRecommendation,
  trackAdDelivery,
  trackNegativeFeedback,
  trackConfigChange
};
