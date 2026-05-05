import { verifySignature } from '../utils/signature.js';
import logger from '../utils/logger.js';
import configService from '../services/config.service.js';

export const signatureMiddleware = async (req, res, next) => {
  try {
    const { sign, ...params } = req.method === 'GET' ? req.query : req.body;
    
    if (!sign) {
      return res.status(401).json({
        code: 401,
        message: '缺少签名参数'
      });
    }

    const isValid = verifySignature(params, sign);
    
    if (!isValid) {
      logger.warn(`Invalid signature for request: ${JSON.stringify(params)}`);
      return res.status(401).json({
        code: 401,
        message: '签名验证失败'
      });
    }

    next();
  } catch (error) {
    logger.error(`Signature middleware error: ${error.message}`);
    return res.status(500).json({
      code: 500,
      message: '签名验证出错'
    });
  }
};

export const channelMiddleware = async (req, res, next) => {
  try {
    const { channelCode } = req.method === 'GET' ? req.query : req.body;
    
    if (!channelCode) {
      return res.status(400).json({
        code: 400,
        message: '缺少渠道号参数'
      });
    }

    const channel = await configService.getChannelByCode(channelCode);
    
    if (!channel) {
      return res.status(404).json({
        code: 404,
        message: '渠道不存在'
      });
    }

    if (!channel.isActive) {
      return res.status(403).json({
        code: 403,
        message: '渠道已停用'
      });
    }

    req.channel = channel;
    next();
  } catch (error) {
    logger.error(`Channel middleware error: ${error.message}`);
    return res.status(500).json({
      code: 500,
      message: '渠道验证出错'
    });
  }
};

export const errorHandler = (err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, err);
  
  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || '服务器内部错误'
  });
};
