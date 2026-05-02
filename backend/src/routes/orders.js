const express = require('express');
const router = express.Router();

module.exports = (db, statusEngine, auditEngine, releaseEngine) => {
  // 获取主单列表
  router.get('/', (req, res) => {
    try {
      const { status, assigneeId, creatorId, pipelineId, page = 1, pageSize = 20 } = req.query;
      
      let countQuery = 'SELECT COUNT(*) as total FROM main_orders WHERE 1=1';
      let dataQuery = `
        SELECT mo.*, p.name as pipeline_name, u.name as assignee_name, uc.name as creator_name
        FROM main_orders mo
        LEFT JOIN pipelines p ON mo.pipeline_id = p.id
        LEFT JOIN users u ON mo.assignee_id = u.id
        LEFT JOIN users uc ON mo.creator_id = uc.id
        WHERE 1=1
      `;
      const params = [];
      
      if (status) {
        const statusArr = status.split(',');
        const placeholders = statusArr.map(() => '?').join(',');
        countQuery += ` AND status IN (${placeholders})`;
        dataQuery += ` AND mo.status IN (${placeholders})`;
        params.push(...statusArr);
      }
      if (assigneeId) {
        countQuery += ' AND assignee_id = ?';
        dataQuery += ' AND mo.assignee_id = ?';
        params.push(assigneeId);
      }
      if (creatorId) {
        countQuery += ' AND creator_id = ?';
        dataQuery += ' AND mo.creator_id = ?';
        params.push(creatorId);
      }
      if (pipelineId) {
        countQuery += ' AND pipeline_id = ?';
        dataQuery += ' AND mo.pipeline_id = ?';
        params.push(pipelineId);
      }
      
      dataQuery += ' ORDER BY mo.created_at DESC';
      
      // 分页
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      dataQuery += ' LIMIT ? OFFSET ?';
      const dataParams = [...params, parseInt(pageSize), offset];
      
      const countResult = db.prepare(countQuery).get(...params);
      const orders = db.prepare(dataQuery).all(...dataParams);
      
      // 添加状态文本和可用动作
      const enrichedOrders = orders.map(order => ({
        ...order,
        status_text: statusEngine.getStatusText(order.status),
        available_actions: statusEngine.getAvailableActions(order.status)
      }));
      
      res.json({
        success: true,
        data: {
          list: enrichedOrders,
          total: countResult.total,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      });
    } catch (error) {
      console.error('获取主单列表错误:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 获取主单详情
  router.get('/:id', (req, res) => {
    try {
      const { id } = req.params;
      
      const order = db.prepare(`
        SELECT mo.*, p.name as pipeline_name, p.stages as pipeline_stages,
               u.name as assignee_name, u.role as assignee_role,
               uc.name as creator_name, uc.role as creator_role
        FROM main_orders mo
        LEFT JOIN pipelines p ON mo.pipeline_id = p.id
        LEFT JOIN users u ON mo.assignee_id = u.id
        LEFT JOIN users uc ON mo.creator_id = uc.id
        WHERE mo.id = ?
      `).get(id);
      
      if (!order) {
        return res.status(404).json({ success: false, error: '主单不存在' });
      }
      
      // 获取明细项
      const items = db.prepare(`
        SELECT oi.*, u.name as assignee_name
        FROM order_items oi
        LEFT JOIN users u ON oi.assignee_id = u.id
        WHERE oi.main_order_id = ?
        ORDER BY oi.stage_order
      `).all(id);
      
      // 获取时间轴
      const timeline = auditEngine.getTimeline(id, 50);
      
      // 获取操作日志
      const logs = auditEngine.getOperationLogs('order', id, 30);
      
      // 解析 attachments
      let attachments = [];
      if (order.attachments) {
        try {
          attachments = JSON.parse(order.attachments);
        } catch (e) {
          attachments = [];
        }
      }
      
      // 解析 pipeline_stages
      let pipelineStages = [];
      if (order.pipeline_stages) {
        try {
          pipelineStages = JSON.parse(order.pipeline_stages);
        } catch (e) {
          pipelineStages = [];
        }
      }
      
      const enrichedOrder = {
        ...order,
        attachments,
        pipeline_stages: pipelineStages,
        status_text: statusEngine.getStatusText(order.status),
        current_stage_text: statusEngine.getStageText(order.current_stage),
        available_actions: statusEngine.getAvailableActions(order.status),
        items: items.map(item => ({
          ...item,
          status_text: statusEngine.getItemStatusText(item.status),
          stage_text: statusEngine.getStageText(item.stage_name)
        })),
        timeline: timeline.map(t => ({
          ...t,
          action_text: statusEngine.getActionText(t.action),
          details: t.details ? JSON.parse(t.details) : null
        })),
        logs
      };
      
      res.json({ success: true, data: enrichedOrder });
    } catch (error) {
      console.error('获取主单详情错误:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 创建主单（代码提交）
  router.post('/', (req, res) => {
    try {
      const userId = req.headers['x-user-id'];
      const { 
        pipelineId, 
        title, 
        description, 
        commitHash, 
        commitMessage, 
        attachments,
        expectedCompletionAt 
      } = req.body;
      
      if (!userId) {
        return res.status(401).json({ success: false, error: '请先登录' });
      }
      
      const result = releaseEngine.createMainOrder(
        userId,
        pipelineId,
        title,
        description,
        commitHash,
        commitMessage,
        attachments,
        expectedCompletionAt
      );
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      // 添加状态文本
      const data = {
        ...result.data,
        status_text: statusEngine.getStatusText(result.data.status)
      };
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('创建主单错误:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 执行状态流转（核心动作接口）
  router.post('/:id/action', (req, res) => {
    try {
      const userId = req.headers['x-user-id'];
      const { id } = req.params;
      const { action, resultData, comment } = req.body;
      
      if (!userId) {
        return res.status(401).json({ success: false, error: '请先登录' });
      }
      
      if (!action) {
        return res.status(400).json({ success: false, error: '动作为必填项' });
      }
      
      const result = releaseEngine.transitionStatus(
        id,
        userId,
        action,
        resultData || {},
        comment || ''
      );
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      const data = {
        ...result.data,
        status_text: statusEngine.getStatusText(result.data.status)
      };
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('执行动作错误:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 获取待办统计
  router.get('/dashboard/stats', (req, res) => {
    try {
      const userId = req.headers['x-user-id'];
      
      // 我的待办数量
      const myTodos = db.prepare(`
        SELECT COUNT(*) as count FROM main_orders 
        WHERE assignee_id = ? AND status NOT IN ('completed', 'failed', 'rolled_back')
      `).get(userId);
      
      // 我创建的进行中
      const myCreated = db.prepare(`
        SELECT COUNT(*) as count FROM main_orders 
        WHERE creator_id = ? AND status NOT IN ('completed', 'failed', 'rolled_back')
      `).get(userId);
      
      // 按状态统计
      const byStatus = db.prepare(`
        SELECT status, COUNT(*) as count 
        FROM main_orders 
        GROUP BY status
      `).all();
      
      // 今日统计
      const todayStart = new Date().toISOString().slice(0, 10);
      const todayStats = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM main_orders 
        WHERE date(created_at) = date(?)
      `).get(todayStart);
      
      res.json({
        success: true,
        data: {
          myPending: myTodos.count,
          myCreatedActive: myCreated.count,
          byStatus: byStatus.map(s => ({
            ...s,
            status_text: statusEngine.getStatusText(s.status)
          })),
          today: todayStats
        }
      });
    } catch (error) {
      console.error('获取统计错误:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 获取看板数据
  router.get('/dashboard/kanban', (req, res) => {
    try {
      const statuses = ['pending_code', 'pending_trigger', 'pending_build', 'pending_deploy', 'pending_monitor'];
      
      const kanbanData = {};
      
      for (const status of statuses) {
        const orders = db.prepare(`
          SELECT mo.*, p.name as pipeline_name, u.name as assignee_name
          FROM main_orders mo
          LEFT JOIN pipelines p ON mo.pipeline_id = p.id
          LEFT JOIN users u ON mo.assignee_id = u.id
          WHERE mo.status = ?
          ORDER BY mo.created_at DESC
          LIMIT 20
        `).all(status);
        
        kanbanData[status] = {
          status_text: statusEngine.getStatusText(status),
          count: orders.length,
          items: orders
        };
      }
      
      res.json({ success: true, data: kanbanData });
    } catch (error) {
      console.error('获取看板数据错误:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
};
