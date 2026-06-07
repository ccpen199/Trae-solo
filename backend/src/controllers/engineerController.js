const { Engineer, EngineerSkill } = require('../models');
const logger = require('../utils/logger');
const dispatchService = require('../services/dispatchService');

class EngineerController {
  async getAllEngineers(req, res) {
    try {
      const { status } = req.query;
      const where = status ? { status } : {};
      
      const engineers = await Engineer.findAll({
        where,
        include: [{
          model: EngineerSkill,
          as: 'EngineerSkills'
        }],
        order: [['created_at', 'DESC']]
      });
      
      res.json(engineers);
    } catch (error) {
      logger.error('获取工程师列表失败', error);
      res.status(500).json({ error: '获取失败' });
    }
  }

  async getEngineer(req, res) {
    try {
      const engineer = await Engineer.findByPk(req.params.id, {
        include: [{
          model: EngineerSkill,
          as: 'EngineerSkills'
        }]
      });
      
      if (!engineer) {
        return res.status(404).json({ error: '工程师不存在' });
      }
      
      res.json(engineer);
    } catch (error) {
      logger.error('获取工程师详情失败', error);
      res.status(500).json({ error: '获取失败' });
    }
  }

  async createEngineer(req, res) {
    try {
      const engineer = await Engineer.create(req.body);
      logger.info('创建工程师', { name: engineer.name, id: engineer.id });
      res.status(201).json(engineer);
    } catch (error) {
      logger.error('创建工程师失败', error);
      res.status(500).json({ error: '创建失败' });
    }
  }

  async updateEngineer(req, res) {
    try {
      const engineer = await Engineer.findByPk(req.params.id);
      if (!engineer) {
        return res.status(404).json({ error: '工程师不存在' });
      }
      
      await engineer.update(req.body);
      logger.info('更新工程师信息', { id: engineer.id });
      res.json(engineer);
    } catch (error) {
      logger.error('更新工程师失败', error);
      res.status(500).json({ error: '更新失败' });
    }
  }

  async updateLocation(req, res) {
    try {
      const engineer = await Engineer.findByPk(req.params.id);
      if (!engineer) {
        return res.status(404).json({ error: '工程师不存在' });
      }
      
      const { lat, lng } = req.body;
      await engineer.update({ lat, lng });
      res.json({ success: true });
    } catch (error) {
      logger.error('更新位置失败', error);
      res.status(500).json({ error: '更新失败' });
    }
  }

  async addSkill(req, res) {
    try {
      const { engineerId, faultCode, proficiency } = req.body;
      
      const skill = await EngineerSkill.create({
        engineer_id: engineerId,
        fault_code: faultCode,
        proficiency: proficiency || 3,
        certified_at: new Date()
      });
      
      logger.info('添加工程师技能', { engineerId, faultCode });
      res.status(201).json(skill);
    } catch (error) {
      logger.error('添加技能失败', error);
      res.status(500).json({ error: '添加失败' });
    }
  }

  async getSkills(req, res) {
    try {
      const skills = await EngineerSkill.findAll({
        where: { engineer_id: req.params.id }
      });
      res.json(skills);
    } catch (error) {
      logger.error('获取技能列表失败', error);
      res.status(500).json({ error: '获取失败' });
    }
  }

  async dispatchEngineers(req, res) {
    try {
      const { lat, lng, requiredSkills, limit } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ error: '缺少位置参数' });
      }

      let skills = [];
      if (requiredSkills) {
        skills = Array.isArray(requiredSkills) 
          ? requiredSkills 
          : requiredSkills.split(',').map(s => s.trim());
      }

      const engineers = await dispatchService.findSuitableEngineers(
        parseFloat(lat),
        parseFloat(lng),
        skills,
        parseInt(limit) || 5
      );

      res.json(engineers);
    } catch (error) {
      logger.error('调度工程师失败', error);
      res.status(500).json({ error: '调度失败' });
    }
  }
}

module.exports = new EngineerController();
