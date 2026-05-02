const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const TaskService = require('../services/taskService');

const router = express.Router();

function taskRoutes(db) {
  const taskService = new TaskService(db);

  router.get('/kanban/:projectId', authMiddleware, (req, res) => {
    try {
      const kanban = taskService.getKanbanBoard(req.params.projectId);

      res.json({
        success: true,
        data: kanban
      });
    } catch (error) {
      console.error('Get kanban error:', error);
      res.status(500).json({
        success: false,
        message: '获取看板失败',
        error: error.message
      });
    }
  });

  router.get('/gantt/:projectId', authMiddleware, (req, res) => {
    try {
      const ganttData = taskService.getGanttData(req.params.projectId);

      res.json({
        success: true,
        data: ganttData
      });
    } catch (error) {
      console.error('Get gantt error:', error);
      res.status(500).json({
        success: false,
        message: '获取甘特图数据失败',
        error: error.message
      });
    }
  });

  router.get('/project/:projectId', authMiddleware, (req, res) => {
    try {
      const { status, column_id, assignee_id, parent_id } = req.query;
      const filters = {};
      if (status) filters.status = status;
      if (column_id) filters.column_id = column_id;
      if (assignee_id) filters.assignee_id = assignee_id;
      if (parent_id !== undefined) filters.parent_id = parent_id === 'null' ? null : parent_id;

      const tasks = taskService.getProjectTasks(req.params.projectId, filters);

      res.json({
        success: true,
        data: tasks
      });
    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(500).json({
        success: false,
        message: '获取任务列表失败',
        error: error.message
      });
    }
  });

  router.get('/:id', authMiddleware, (req, res) => {
    try {
      const task = taskService.getTaskById(req.params.id);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      console.error('Get task error:', error);
      res.status(500).json({
        success: false,
        message: '获取任务详情失败',
        error: error.message
      });
    }
  });

  router.post('/', authMiddleware, (req, res) => {
    try {
      const task = taskService.createTask(req.body, req.user.id);

      res.json({
        success: true,
        message: '任务创建成功',
        data: task
      });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '创建任务失败',
        error: error.message
      });
    }
  });

  router.put('/:id', authMiddleware, (req, res) => {
    try {
      const task = taskService.updateTask(req.params.id, req.body, req.user.id);

      res.json({
        success: true,
        message: '任务更新成功',
        data: task
      });
    } catch (error) {
      console.error('Update task error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '更新任务失败',
        error: error.message
      });
    }
  });

  router.post('/:id/move', authMiddleware, (req, res) => {
    try {
      const { column_id, index } = req.body;

      const task = taskService.moveTask(
        req.params.id,
        column_id,
        index || 0,
        req.user.id
      );

      res.json({
        success: true,
        message: '任务移动成功',
        data: task
      });
    } catch (error) {
      console.error('Move task error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '移动任务失败',
        error: error.message
      });
    }
  });

  router.delete('/:id', authMiddleware, (req, res) => {
    try {
      const result = taskService.deleteTask(req.params.id, req.user.id);

      res.json({
        success: true,
        message: '任务删除成功',
        data: result
      });
    } catch (error) {
      console.error('Delete task error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '删除任务失败',
        error: error.message
      });
    }
  });

  return router;
}

module.exports = taskRoutes;
