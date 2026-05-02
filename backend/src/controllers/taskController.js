const { TaskService } = require('../services/taskService');
const { ProgressService } = require('../services/progressService');
const { RewardService } = require('../services/rewardService');
const { TASK_STATES, TaskStateService } = require('../services/stateMachine');
const { get } = require('../config/database');

const taskService = new TaskService();
const progressService = new ProgressService();
const rewardService = new RewardService();
const stateService = new TaskStateService();

class TaskController {
  async createTask(req, res) {
    try {
      const operatorUuid = req.headers['x-user-uuid'];
      const taskData = req.body;

      const result = await taskService.createTask(taskData, operatorUuid);
      
      res.json({
        success: true,
        data: result,
        message: '任务创建成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateTask(req, res) {
    try {
      const operatorUuid = req.headers['x-user-uuid'];
      const { taskUuid } = req.params;
      const taskData = req.body;

      const result = await taskService.updateTask(taskUuid, taskData, operatorUuid);
      
      res.json({
        success: true,
        data: result,
        message: '任务更新成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async configureTask(req, res) {
    try {
      const operatorUuid = req.headers['x-user-uuid'];
      const { taskUuid } = req.params;

      const result = await taskService.configureTask(taskUuid, operatorUuid);
      
      res.json({
        success: true,
        data: result,
        message: '任务配置完成'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async publishTask(req, res) {
    try {
      const operatorUuid = req.headers['x-user-uuid'];
      const { taskUuid } = req.params;

      const result = await taskService.publishTask(taskUuid, operatorUuid);
      
      res.json({
        success: true,
        data: result,
        message: '任务发布成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getTask(req, res) {
    try {
      const { taskUuid } = req.params;
      const task = await taskService.getTask(taskUuid);
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      const rewards = await taskService.getTaskRewards(taskUuid);
      const validEvents = await stateService.getValidEvents(task.status);

      res.json({
        success: true,
        data: {
          ...task,
          rewards,
          validEvents
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getTasks(req, res) {
    try {
      const { status, task_type, created_by } = req.query;
      
      const filters = {};
      if (status) filters.status = status;
      if (task_type) filters.task_type = task_type;
      if (created_by) filters.created_by = created_by;

      const tasks = await taskService.getTasks(filters);
      
      res.json({
        success: true,
        data: tasks
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async addTaskReward(req, res) {
    try {
      const operatorUuid = req.headers['x-user-uuid'];
      const { taskUuid } = req.params;
      const { rewardUuid, quantity } = req.body;

      const result = await taskService.addTaskReward(
        taskUuid, 
        rewardUuid, 
        quantity || 1, 
        operatorUuid
      );
      
      res.json({
        success: true,
        data: result,
        message: '奖励添加成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getTaskStates(req, res) {
    try {
      const states = Object.values(TASK_STATES).map(state => ({
        code: state,
        name: this.getStateName(state),
        description: this.getStateDescription(state)
      }));

      res.json({
        success: true,
        data: states
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  getStateName(state) {
    const names = {
      [TASK_STATES.DRAFT]: '草稿',
      [TASK_STATES.PENDING_CONFIG]: '待配置',
      [TASK_STATES.PENDING_TRIGGER]: '待触发',
      [TASK_STATES.PENDING_PROGRESS]: '待进度',
      [TASK_STATES.PENDING_REWARD]: '待奖励',
      [TASK_STATES.PENDING_ANALYSIS]: '待分析',
      [TASK_STATES.COMPLETED]: '已完成',
      [TASK_STATES.ARCHIVED]: '已归档'
    };
    return names[state] || state;
  }

  getStateDescription(state) {
    const descriptions = {
      [TASK_STATES.DRAFT]: '任务刚创建，尚未配置完成',
      [TASK_STATES.PENDING_CONFIG]: '任务配置完成，等待审核发布',
      [TASK_STATES.PENDING_TRIGGER]: '任务已发布，等待玩家触发',
      [TASK_STATES.PENDING_PROGRESS]: '任务已触发，正在累计进度',
      [TASK_STATES.PENDING_REWARD]: '任务已完成，等待发放奖励',
      [TASK_STATES.PENDING_ANALYSIS]: '奖励已发放，等待数据分析',
      [TASK_STATES.COMPLETED]: '任务全流程已完成',
      [TASK_STATES.ARCHIVED]: '任务已归档'
    };
    return descriptions[state] || '';
  }
}

module.exports = { TaskController };
