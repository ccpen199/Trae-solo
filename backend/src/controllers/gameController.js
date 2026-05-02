const { ProgressService } = require('../services/progressService');
const { RewardService, AchievementService } = require('../services/rewardService');
const { get, all } = require('../config/database');

const progressService = new ProgressService();
const rewardService = new RewardService();
const achievementService = new AchievementService();

class ProgressController {
  async triggerEvent(req, res) {
    try {
      const userUuid = req.headers['x-user-uuid'];
      const { eventCode, eventData, source } = req.body;

      const result = await progressService.triggerEvent(
        eventCode, 
        userUuid, 
        eventData || {}, 
        source || 'game'
      );
      
      res.json({
        success: true,
        data: result,
        message: '事件触发成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getUserProgress(req, res) {
    try {
      const userUuid = req.headers['x-user-uuid'];
      const { status, task_uuid } = req.query;
      
      const filters = {};
      if (status) filters.status = status;
      if (task_uuid) filters.task_uuid = task_uuid;

      const progress = await progressService.getUserProgress(userUuid, filters);
      
      res.json({
        success: true,
        data: progress
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getProgressDetail(req, res) {
    try {
      const { progressUuid } = req.params;
      const progress = await progressService.getProgressHistory(progressUuid);
      
      if (!progress) {
        return res.status(404).json({
          success: false,
          message: '进度记录不存在'
        });
      }

      res.json({
        success: true,
        data: progress
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getTriggerEvents(req, res) {
    try {
      const events = await all('SELECT * FROM trigger_events ORDER BY created_at');
      
      res.json({
        success: true,
        data: events
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

class RewardController {
  async createReward(req, res) {
    try {
      const operatorUuid = req.headers['x-user-uuid'];
      const rewardData = req.body;

      const result = await rewardService.createReward(rewardData, operatorUuid);
      
      res.json({
        success: true,
        data: result,
        message: '奖励创建成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getRewards(req, res) {
    try {
      const { status, reward_type } = req.query;
      
      const filters = {};
      if (status) filters.status = status;
      if (reward_type) filters.reward_type = reward_type;

      const rewards = await rewardService.getRewards(filters);
      
      res.json({
        success: true,
        data: rewards
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getUserRewards(req, res) {
    try {
      const userUuid = req.headers['x-user-uuid'];
      const { status, source_type } = req.query;
      
      const filters = {};
      if (status) filters.status = status;
      if (source_type) filters.source_type = source_type;

      const rewards = await rewardService.getUserRewards(userUuid, filters);
      
      res.json({
        success: true,
        data: rewards
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async grantTaskRewards(req, res) {
    try {
      const operatorUuid = req.headers['x-user-uuid'];
      const { taskUuid, userUuid } = req.body;

      const result = await rewardService.grantTaskRewards(taskUuid, userUuid, operatorUuid);
      
      res.json({
        success: true,
        data: result,
        message: '奖励发放成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async deliverReward(req, res) {
    try {
      const operatorUuid = req.headers['x-user-uuid'];
      const { userRewardUuid } = req.params;

      const result = await rewardService.deliverReward(userRewardUuid, operatorUuid);
      
      res.json({
        success: true,
        data: result,
        message: '奖励实际发放成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

class AchievementController {
  async createAchievement(req, res) {
    try {
      const operatorUuid = req.headers['x-user-uuid'];
      const achievementData = req.body;

      const result = await achievementService.createAchievement(achievementData, operatorUuid);
      
      res.json({
        success: true,
        data: result,
        message: '成就创建成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getAchievements(req, res) {
    try {
      const { status, rarity } = req.query;
      
      const filters = {};
      if (status) filters.status = status;
      if (rarity) filters.rarity = rarity;

      const achievements = await achievementService.getAchievements(filters);
      
      res.json({
        success: true,
        data: achievements
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getUserAchievements(req, res) {
    try {
      const userUuid = req.headers['x-user-uuid'];
      const { status } = req.query;
      
      const filters = {};
      if (status) filters.status = status;

      const achievements = await achievementService.getUserAchievements(userUuid, filters);
      
      res.json({
        success: true,
        data: achievements
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async addAchievementReward(req, res) {
    try {
      const operatorUuid = req.headers['x-user-uuid'];
      const { achievementUuid } = req.params;
      const { rewardUuid, quantity } = req.body;

      const result = await achievementService.addAchievementReward(
        achievementUuid, 
        rewardUuid, 
        quantity || 1, 
        operatorUuid
      );
      
      res.json({
        success: true,
        data: result,
        message: '成就奖励添加成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = { 
  ProgressController, 
  RewardController, 
  AchievementController 
};
