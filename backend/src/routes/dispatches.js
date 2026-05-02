const express = require('express');
const router = express.Router();
const dispatchService = require('../services/dispatchService');
const statusFlowService = require('../services/statusFlowService');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', requireRole('dispatcher', 'admin'), (req, res) => {
  try {
    const result = dispatchService.createDispatch(req.user.id, req.user.role, req.body);
    res.json(result);
  } catch (error) {
    console.error('Create dispatch error:', error);
    res.status(500).json({ error: error.message || '创建调度失败' });
  }
});

router.post('/:id/assign', requireRole('dispatcher', 'admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { operator_id, reason } = req.body;

    if (!operator_id) {
      return res.status(400).json({ error: '运维员ID不能为空' });
    }

    const result = dispatchService.assignOperator(id, req.user.id, req.user.role, operator_id, reason);
    res.json(result);
  } catch (error) {
    console.error('Assign operator error:', error);
    res.status(500).json({ error: error.message || '分配运维员失败' });
  }
});

router.post('/:id/complete', requireRole('maintainer', 'admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = dispatchService.completeDispatch(id, req.user.id, req.user.role, reason);
    res.json(result);
  } catch (error) {
    console.error('Complete dispatch error:', error);
    res.status(500).json({ error: error.message || '完成调度失败' });
  }
});

router.get('/', (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    const dispatches = dispatchService.getDispatches(req.user.id, req.user.role, {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json(dispatches);
  } catch (error) {
    console.error('Get dispatches error:', error);
    res.status(500).json({ error: '获取调度列表失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const dispatch = dispatchService.getDispatches(req.user.id, req.user.role, { limit: 1 })
      .find(d => d.id === id);

    if (!dispatch) {
      return res.status(404).json({ error: '调度记录不存在' });
    }

    const statusFlows = statusFlowService.getStatusFlows('dispatch', id);
    res.json({ dispatch, statusFlows });
  } catch (error) {
    console.error('Get dispatch error:', error);
    res.status(500).json({ error: '获取调度详情失败' });
  }
});

module.exports = router;
