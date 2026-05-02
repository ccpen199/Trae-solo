const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const WorkflowService = require('../services/workflowService');
const ExceptionService = require('../services/exceptionService');
const TaskService = require('../services/taskService');

const router = express.Router();

function dashboardRoutes(db) {
  const workflowService = new WorkflowService(db);
  const exceptionService = new ExceptionService(db);
  const taskService = new TaskService(db);

  router.get('/', authMiddleware, (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      const projectBoard = workflowService.getProjectStatusBoard(userId, userRole);
      const exceptions = exceptionService.getDashboardExceptions(userId, userRole);
      const exceptionStats = exceptionService.getStatistics();

      const myTasks = db.prepare(`
        SELECT 
          t.*,
          p.name as project_name,
          p.project_no,
          assignee.name as assignee_name,
          reporter.name as reporter_name
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN users assignee ON t.assignee_id = assignee.id
        LEFT JOIN users reporter ON t.reporter_id = reporter.id
        WHERE t.assignee_id = ? AND t.status != 'done'
        ORDER BY t.updated_at DESC
        LIMIT 20
      `).all(userId);

      const unreadNotifications = db.prepare(`
        SELECT COUNT(*) as count 
        FROM notifications 
        WHERE user_id = ? AND is_read = 0
      `).get(userId).count;

      const recentNotifications = db.prepare(`
        SELECT n.*, u.name as creator_name
        FROM notifications n
        LEFT JOIN users u ON n.user_id = u.id
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC
        LIMIT 10
      `).all(userId);

      const stats = {
        projects: projectBoard.statistics,
        exceptions: exceptionStats,
        myTasks: {
          total: myTasks.length,
          byStatus: {}
        },
        notifications: {
          unread: unreadNotifications
        }
      };

      myTasks.forEach(task => {
        stats.myTasks.byStatus[task.status] = (stats.myTasks.byStatus[task.status] || 0) + 1;
      });

      res.json({
        success: true,
        data: {
          stats,
          projectBoard: projectBoard.board,
          myTasks,
          exceptions,
          recentNotifications
        }
      });
    } catch (error) {
      console.error('Get dashboard error:', error);
      res.status(500).json({
        success: false,
        message: '获取仪表盘数据失败',
        error: error.message
      });
    }
  });

  router.get('/todos', authMiddleware, (req, res) => {
    try {
      const userId = req.user.id;
      const { status, limit = 50 } = req.query;

      let query = `
        SELECT 
          t.*,
          p.name as project_name,
          p.project_no,
          p.status as project_status,
          assignee.name as assignee_name,
          reporter.name as reporter_name
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN users assignee ON t.assignee_id = assignee.id
        LEFT JOIN users reporter ON t.reporter_id = reporter.id
        WHERE t.assignee_id = ?
      `;

      const params = [userId];

      if (status) {
        query += ' AND t.status = ?';
        params.push(status);
      }

      query += ' ORDER BY t.updated_at DESC LIMIT ?';
      params.push(parseInt(limit));

      const todos = db.prepare(query).all(...params);

      res.json({
        success: true,
        data: todos
      });
    } catch (error) {
      console.error('Get todos error:', error);
      res.status(500).json({
        success: false,
        message: '获取待办失败',
        error: error.message
      });
    }
  });

  router.get('/notifications', authMiddleware, (req, res) => {
    try {
      const userId = req.user.id;
      const { limit = 50, unread_only = false } = req.query;

      let query = `
        SELECT n.*
        FROM notifications n
        WHERE n.user_id = ?
      `;
      const params = [userId];

      if (unread_only === true || unread_only === 'true') {
        query += ' AND n.is_read = 0';
      }

      query += ' ORDER BY n.created_at DESC LIMIT ?';
      params.push(parseInt(limit));

      const notifications = db.prepare(query).all(...params);

      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        message: '获取通知失败',
        error: error.message
      });
    }
  });

  router.put('/notifications/:id/read', authMiddleware, (req, res) => {
    try {
      const notifId = req.params.id;
      const userId = req.user.id;

      const notif = db.prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?').get(notifId, userId);
      if (!notif) {
        return res.status(404).json({
          success: false,
          message: '通知不存在'
        });
      }

      db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(notifId);

      res.json({
        success: true,
        message: '通知已标记为已读'
      });
    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({
        success: false,
        message: '标记通知失败',
        error: error.message
      });
    }
  });

  router.get('/exceptions', authMiddleware, (req, res) => {
    try {
      const { status, type, project_id } = req.query;
      const filters = {};
      if (status) filters.status = status;
      if (type) filters.type = type;
      if (project_id) filters.project_id = project_id;

      if (req.user.role !== 'management') {
        filters.assigned_to = req.user.id;
      }

      const exceptions = exceptionService.getExceptions(filters);

      res.json({
        success: true,
        data: exceptions
      });
    } catch (error) {
      console.error('Get exceptions error:', error);
      res.status(500).json({
        success: false,
        message: '获取异常队列失败',
        error: error.message
      });
    }
  });

  router.get('/exceptions/:id', authMiddleware, (req, res) => {
    try {
      const exception = exceptionService.getExceptionById(req.params.id);

      if (!exception) {
        return res.status(404).json({
          success: false,
          message: '异常记录不存在'
        });
      }

      res.json({
        success: true,
        data: exception
      });
    } catch (error) {
      console.error('Get exception error:', error);
      res.status(500).json({
        success: false,
        message: '获取异常详情失败',
        error: error.message
      });
    }
  });

  router.post('/exceptions/:id/resolve', authMiddleware, (req, res) => {
    try {
      const { resolution } = req.body;

      const result = exceptionService.resolveException(
        req.params.id,
        req.user.id,
        resolution
      );

      res.json({
        success: true,
        message: '异常已解决',
        data: result
      });
    } catch (error) {
      console.error('Resolve exception error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '解决异常失败',
        error: error.message
      });
    }
  });

  return router;
}

module.exports = dashboardRoutes;
