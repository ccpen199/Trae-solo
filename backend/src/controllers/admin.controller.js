import logger from '../utils/logger.js';
import configService from '../services/config.service.js';
import recordService from '../services/record.service.js';
import alertService from '../services/alert.service.js';
import prisma from '../prisma/client.js';

class AdminController {
  async getAccessConfig(req, res) {
    try {
      const config = await configService.getAccessConfig();
      res.json({
        code: 200,
        message: '获取准入配置成功',
        data: config
      });
    } catch (error) {
      logger.error(`Get access config error: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: '获取准入配置失败'
      });
    }
  }

  async updateAccessConfig(req, res) {
    try {
      const updates = req.body;
      const config = await configService.updateAccessConfig(updates);
      
      res.json({
        code: 200,
        message: '更新准入配置成功',
        data: config
      });
    } catch (error) {
      logger.error(`Update access config error: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: '更新准入配置失败'
      });
    }
  }

  async getCollisionConfig(req, res) {
    try {
      const config = await configService.getCollisionConfig();
      res.json({
        code: 200,
        message: '获取撞库配置成功',
        data: config
      });
    } catch (error) {
      logger.error(`Get collision config error: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: '获取撞库配置失败'
      });
    }
  }

  async updateCollisionConfig(req, res) {
    try {
      const updates = req.body;
      const config = await configService.updateCollisionConfig(updates);
      
      res.json({
        code: 200,
        message: '更新撞库配置成功',
        data: config
      });
    } catch (error) {
      logger.error(`Update collision config error: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: '更新撞库配置失败'
      });
    }
  }

  async getChannels(req, res) {
    try {
      const channels = await configService.getAllChannels();
      res.json({
        code: 200,
        message: '获取渠道列表成功',
        data: channels
      });
    } catch (error) {
      logger.error(`Get channels error: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: '获取渠道列表失败'
      });
    }
  }

  async createChannel(req, res) {
    try {
      const { channelCode, channelName, productId, isActive } = req.body;
      
      if (!channelCode || !channelName || !productId) {
        return res.status(400).json({
          code: 400,
          message: '缺少必要参数'
        });
      }

      const channel = await configService.createChannel({
        channelCode,
        channelName,
        productId,
        isActive: isActive !== false
      });

      res.json({
        code: 200,
        message: '创建渠道成功',
        data: channel
      });
    } catch (error) {
      logger.error(`Create channel error: ${error.message}`);
      if (error.code === 'P2002') {
        return res.status(400).json({
          code: 400,
          message: '渠道号已存在'
        });
      }
      res.status(500).json({
        code: 500,
        message: '创建渠道失败'
      });
    }
  }

  async updateChannel(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const channel = await configService.updateChannel(id, updates);
      
      res.json({
        code: 200,
        message: '更新渠道成功',
        data: channel
      });
    } catch (error) {
      logger.error(`Update channel error: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: '更新渠道失败'
      });
    }
  }

  async deleteChannel(req, res) {
    try {
      const { id } = req.params;
      await configService.deleteChannel(id);
      
      res.json({
        code: 200,
        message: '删除渠道成功'
      });
    } catch (error) {
      logger.error(`Delete channel error: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: '删除渠道失败'
      });
    }
  }

  async getProducts(req, res) {
    try {
      const products = await configService.getAllProducts();
      res.json({
        code: 200,
        message: '获取产品列表成功',
        data: products
      });
    } catch (error) {
      logger.error(`Get products error: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: '获取产品列表失败'
      });
    }
  }

  async createProduct(req, res) {
    try {
      const { productId, productName, isTargetProduct } = req.body;
      
      if (!productId || !productName) {
        return res.status(400).json({
          code: 400,
          message: '缺少必要参数'
        });
      }

      const product = await configService.createProduct({
        productId,
        productName,
        isTargetProduct: isTargetProduct === true
      });

      res.json({
        code: 200,
        message: '创建产品成功',
        data: product
      });
    } catch (error) {
      logger.error(`Create product error: ${error.message}`);
      if (error.code === 'P2002') {
        return res.status(400).json({
          code: 400,
          message: '产品ID已存在'
        });
      }
      res.status(500).json({
        code: 500,
        message: '创建产品失败'
      });
    }
  }

  async getRecords(req, res) {
    try {
      const { page, pageSize, channelCode, phoneMd5, returnCode, startDate, endDate, orderBy, order } = req.query;
      
      const result = await recordService.getRecords(
        { channelCode, phoneMd5, returnCode, startDate, endDate },
        { page, pageSize, orderBy, order }
      );

      res.json({
        code: 200,
        message: '获取记录列表成功',
        data: result
      });
    } catch (error) {
      logger.error(`Get records error: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: '获取记录列表失败'
      });
    }
  }

  async getRecordDetail(req, res) {
    try {
      const { id } = req.params;
      const record = await recordService.getRecordById(id);
      
      if (!record) {
        return res.status(404).json({
          code: 404,
          message: '记录不存在'
        });
      }

      res.json({
        code: 200,
        message: '获取记录详情成功',
        data: record
      });
    } catch (error) {
      logger.error(`Get record detail error: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: '获取记录详情失败'
      });
    }
  }

  async getStats(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const stats = await recordService.getStats(startDate, endDate);
      
      res.json({
        code: 200,
        message: '获取统计数据成功',
        data: stats
      });
    } catch (error) {
      logger.error(`Get stats error: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: '获取统计数据失败'
      });
    }
  }

  async getAlerts(req, res) {
    try {
      const alerts = await alertService.getRecentFailures(50);
      
      res.json({
        code: 200,
        message: '获取报警记录成功',
        data: alerts
      });
    } catch (error) {
      logger.error(`Get alerts error: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: '获取报警记录失败'
      });
    }
  }

  async clearAlerts(req, res) {
    try {
      await alertService.clearAlerts();
      
      res.json({
        code: 200,
        message: '清除报警状态成功'
      });
    } catch (error) {
      logger.error(`Clear alerts error: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: '清除报警状态失败'
      });
    }
  }

  async getBlacklist(req, res) {
    try {
      const { page = 1, pageSize = 20 } = req.query;
      
      const total = await prisma.blacklist.count();
      const blacklist = await prisma.blacklist.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(pageSize),
        take: parseInt(pageSize)
      });

      res.json({
        code: 200,
        message: '获取黑名单成功',
        data: {
          blacklist,
          total,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(total / parseInt(pageSize))
        }
      });
    } catch (error) {
      logger.error(`Get blacklist error: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: '获取黑名单失败'
      });
    }
  }

  async addToBlacklist(req, res) {
    try {
      const { phoneMd5, phonePlain, reason, expireDays } = req.body;
      
      if (!phoneMd5) {
        return res.status(400).json({
          code: 400,
          message: '缺少手机号MD5'
        });
      }

      let expireAt = null;
      if (expireDays) {
        expireAt = new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000);
      }

      const blacklist = await prisma.blacklist.upsert({
        where: { phoneMd5 },
        update: { phonePlain, reason, expireAt },
        create: { phoneMd5, phonePlain, reason, expireAt }
      });

      res.json({
        code: 200,
        message: '添加黑名单成功',
        data: blacklist
      });
    } catch (error) {
      logger.error(`Add to blacklist error: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: '添加黑名单失败'
      });
    }
  }

  async removeFromBlacklist(req, res) {
    try {
      const { id } = req.params;
      await prisma.blacklist.delete({
        where: { id }
      });

      res.json({
        code: 200,
        message: '移除黑名单成功'
      });
    } catch (error) {
      logger.error(`Remove from blacklist error: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: '移除黑名单失败'
      });
    }
  }

  async getSystemInfo(req, res) {
    try {
      const info = {
        appName: '渠道撞库联登系统',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 20789,
        database: 'SQLite',
        timestamp: new Date().toISOString()
      };

      res.json({
        code: 200,
        message: '获取系统信息成功',
        data: info
      });
    } catch (error) {
      logger.error(`Get system info error: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: '获取系统信息失败'
      });
    }
  }
}

export default new AdminController();
