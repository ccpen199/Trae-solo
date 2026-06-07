const { Part, UsedDevice, Engineer } = require('../models');
const analyticsService = require('../services/analyticsService');
const logger = require('../utils/logger');

class AdminController {
  async getDashboardStats(req, res) {
    try {
      const stats = await analyticsService.getDashboardStats();
      res.json(stats);
    } catch (error) {
      logger.error('获取看板数据失败', error);
      res.status(500).json({ error: '获取失败' });
    }
  }

  async getEngineerRadar(req, res) {
    try {
      const radar = await analyticsService.getEngineerRadar(req.params.id);
      if (!radar) {
        return res.status(404).json({ error: '工程师不存在' });
      }
      res.json(radar);
    } catch (error) {
      logger.error('获取雷达图数据失败', error);
      res.status(500).json({ error: '获取失败' });
    }
  }

  async getFaultHeatmap(req, res) {
    try {
      const data = await analyticsService.getFaultHeatmapData();
      res.json(data);
    } catch (error) {
      logger.error('获取故障热力图数据失败', error);
      res.status(500).json({ error: '获取失败' });
    }
  }

  async getPartsForecast(req, res) {
    try {
      const data = await analyticsService.getPartsForecast();
      res.json(data);
    } catch (error) {
      logger.error('获取配件预测数据失败', error);
      res.status(500).json({ error: '获取失败' });
    }
  }

  async getOrderTrend(req, res) {
    try {
      const { days = 7 } = req.query;
      const data = await analyticsService.getOrderTrend(parseInt(days));
      res.json(data);
    } catch (error) {
      logger.error('获取订单趋势失败', error);
      res.status(500).json({ error: '获取失败' });
    }
  }

  async getEngineerPerformance(req, res) {
    try {
      const data = await analyticsService.getEngineerPerformanceList();
      res.json(data);
    } catch (error) {
      logger.error('获取工程师绩效失败', error);
      res.status(500).json({ error: '获取失败' });
    }
  }

  async getParts(req, res) {
    try {
      const parts = await Part.findAll();
      res.json(parts);
    } catch (error) {
      logger.error('获取配件列表失败', error);
      res.status(500).json({ error: '获取失败' });
    }
  }

  async createPart(req, res) {
    try {
      const part = await Part.create(req.body);
      logger.info('创建配件', { sku: part.sku, name: part.name });
      res.status(201).json(part);
    } catch (error) {
      logger.error('创建配件失败', error);
      res.status(500).json({ error: '创建失败' });
    }
  }

  async updatePart(req, res) {
    try {
      const part = await Part.findByPk(req.params.id);
      if (!part) {
        return res.status(404).json({ error: '配件不存在' });
      }
      await part.update(req.body);
      res.json(part);
    } catch (error) {
      logger.error('更新配件失败', error);
      res.status(500).json({ error: '更新失败' });
    }
  }

  async getUsedDevices(req, res) {
    try {
      const devices = await UsedDevice.findAll();
      res.json(devices);
    } catch (error) {
      logger.error('获取二手机列表失败', error);
      res.status(500).json({ error: '获取失败' });
    }
  }

  async createUsedDevice(req, res) {
    try {
      const device = await UsedDevice.create(req.body);
      logger.info('创建二手机库存', { model: device.device_model });
      res.status(201).json(device);
    } catch (error) {
      logger.error('创建二手机失败', error);
      res.status(500).json({ error: '创建失败' });
    }
  }

  async triggerCallback(req, res) {
    try {
      const { orderId } = req.body;
      logger.info('触发自动外呼', { orderId });
      
      setTimeout(() => {
        logger.info('外呼模拟完成', { orderId, result: '用户满意，评分5星' });
      }, 2000);
      
      res.json({ success: true, message: '外呼已触发' });
    } catch (error) {
      logger.error('外呼失败', error);
      res.status(500).json({ error: '外呼失败' });
    }
  }

  async bindEquipment(req, res) {
    try {
      const { equipmentId } = req.body;
      const engineer = await Engineer.findByPk(req.params.id);
      if (!engineer) {
        return res.status(404).json({ error: '工程师不存在' });
      }
      await engineer.update({ equipment_id: equipmentId });
      logger.info('绑定装备', { engineerId: req.params.id, equipmentId });
      res.json(engineer);
    } catch (error) {
      logger.error('绑定装备失败', error);
      res.status(500).json({ error: '绑定失败' });
    }
  }

  async updateUsedDevice(req, res) {
    try {
      const device = await UsedDevice.findByPk(req.params.id);
      if (!device) {
        return res.status(404).json({ error: '设备不存在' });
      }
      await device.update(req.body);
      logger.info('更新二手机设备', { id: req.params.id });
      res.json(device);
    } catch (error) {
      logger.error('更新二手机设备失败', error);
      res.status(500).json({ error: '更新失败' });
    }
  }
}

module.exports = new AdminController();
