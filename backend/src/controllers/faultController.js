const { Fault } = require('../models');
const diagnosisService = require('../services/diagnosisService');
const logger = require('../utils/logger');

class FaultController {
  async diagnose(req, res) {
    try {
      const { text, deviceType, image } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: '请输入故障描述' });
      }

      const result = await diagnosisService.diagnose(text, deviceType, image);
      
      logger.info('故障诊断完成', { keywords: result.keywords, accuracy: result.predictionAccuracy });
      res.json(result);
    } catch (error) {
      logger.error('故障诊断失败', error);
      res.status(500).json({ error: '诊断失败，请稍后重试' });
    }
  }

  async getAllFaults(req, res) {
    try {
      const { deviceType } = req.query;
      const where = deviceType ? { device_type: deviceType } : {};
      
      const faults = await Fault.findAll({ where });
      res.json(faults);
    } catch (error) {
      logger.error('获取故障列表失败', error);
      res.status(500).json({ error: '获取失败' });
    }
  }

  async getFault(req, res) {
    try {
      const fault = await Fault.findByPk(req.params.id);
      if (!fault) {
        return res.status(404).json({ error: '故障不存在' });
      }
      res.json(fault);
    } catch (error) {
      logger.error('获取故障详情失败', error);
      res.status(500).json({ error: '获取失败' });
    }
  }

  async createFault(req, res) {
    try {
      const fault = await Fault.create(req.body);
      logger.info('创建新故障类型', { code: fault.code, name: fault.name });
      res.status(201).json(fault);
    } catch (error) {
      logger.error('创建故障失败', error);
      res.status(500).json({ error: '创建失败' });
    }
  }

  async updateFault(req, res) {
    try {
      const fault = await Fault.findByPk(req.params.id);
      if (!fault) {
        return res.status(404).json({ error: '故障不存在' });
      }
      await fault.update(req.body);
      res.json(fault);
    } catch (error) {
      logger.error('更新故障失败', error);
      res.status(500).json({ error: '更新失败' });
    }
  }
}

module.exports = new FaultController();
