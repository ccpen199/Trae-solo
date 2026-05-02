const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const ProjectService = require('../services/projectService');
const WorkflowService = require('../services/workflowService');

const router = express.Router();

function projectRoutes(db) {
  const projectService = new ProjectService(db);
  const workflowService = new WorkflowService(db);

  router.get('/', authMiddleware, (req, res) => {
    try {
      const { status, search } = req.query;
      const filters = {};
      if (status) filters.status = status;
      if (search) filters.search = search;

      const projects = projectService.getProjects(req.user.id, req.user.role, filters);

      res.json({
        success: true,
        data: projects
      });
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({
        success: false,
        message: '获取项目列表失败',
        error: error.message
      });
    }
  });

  router.get('/status-board', authMiddleware, (req, res) => {
    try {
      const board = workflowService.getProjectStatusBoard(req.user.id, req.user.role);

      res.json({
        success: true,
        data: board
      });
    } catch (error) {
      console.error('Get status board error:', error);
      res.status(500).json({
        success: false,
        message: '获取状态看板失败',
        error: error.message
      });
    }
  });

  router.get('/:id', authMiddleware, (req, res) => {
    try {
      const project = projectService.getProjectById(req.params.id);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      const stateInfo = workflowService.getStateInfo('project', project.status);
      const availableTransitions = workflowService.getAvailableTransitions('project', project.status, req.user.role);
      const stateActions = workflowService.getStateActions('project', project.status);

      res.json({
        success: true,
        data: {
          ...project,
          stateInfo,
          availableTransitions,
          stateActions
        }
      });
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({
        success: false,
        message: '获取项目详情失败',
        error: error.message
      });
    }
  });

  router.post('/', authMiddleware, (req, res) => {
    try {
      if (req.user.role !== 'project_manager' && req.user.role !== 'management') {
        return res.status(403).json({
          success: false,
          message: '只有项目经理和管理层可以创建项目'
        });
      }

      const project = projectService.createProject(req.body, req.user.id);

      res.json({
        success: true,
        message: '项目创建成功',
        data: project
      });
    } catch (error) {
      console.error('Create project error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '创建项目失败',
        error: error.message
      });
    }
  });

  router.put('/:id', authMiddleware, (req, res) => {
    try {
      const project = projectService.updateProject(req.params.id, req.body, req.user.id);

      res.json({
        success: true,
        message: '项目更新成功',
        data: project
      });
    } catch (error) {
      console.error('Update project error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '更新项目失败',
        error: error.message
      });
    }
  });

  router.post('/:id/transition', authMiddleware, (req, res) => {
    try {
      const { action, comment } = req.body;

      const result = workflowService.transitionProjectState(
        req.params.id,
        action,
        req.user.id,
        comment
      );

      res.json({
        success: true,
        message: '状态流转成功',
        data: result
      });
    } catch (error) {
      console.error('Project transition error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '状态流转失败',
        error: error.message
      });
    }
  });

  router.get('/:id/timeline', authMiddleware, (req, res) => {
    try {
      const timeline = projectService.getProjectTimeline(req.params.id);

      res.json({
        success: true,
        data: timeline
      });
    } catch (error) {
      console.error('Get project timeline error:', error);
      res.status(500).json({
        success: false,
        message: '获取时间轴失败',
        error: error.message
      });
    }
  });

  router.get('/:id/statistics', authMiddleware, (req, res) => {
    try {
      const statistics = projectService.getProjectStatistics(req.params.id);

      if (!statistics) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Get project statistics error:', error);
      res.status(500).json({
        success: false,
        message: '获取统计信息失败',
        error: error.message
      });
    }
  });

  return router;
}

module.exports = projectRoutes;
