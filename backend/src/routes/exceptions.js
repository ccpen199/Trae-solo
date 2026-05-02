const express = require('express');
const router = express.Router();
const exceptionService = require('../services/exceptionService');
const statusFlowService = require('../services/statusFlowService');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', requireRole('rider', 'maintainer'), (req, res) => {
  try {
    const result = exceptionService.reportException(req.user.id, req.user.role, req.body);
    res.json(result);
  } catch (error) {
    console.error('Report exception error:', error);
    res.status(500).json({ error: error.message || '上报异常失败' });
  }
});

router.post('/:id/process', requireRole('service', 'admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    if (!action) {
      return res.status(400).json({ error: '操作类型不能为空' });
    }

    const result = exceptionService.processException(id, req.user.id, req.user.role, action, reason);
    res.json(result);
  } catch (error) {
    console.error('Process exception error:', error);
    res.status(500).json({ error: error.message || '处理异常失败' });
  }
});

router.get('/', (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    const exceptions = exceptionService.getExceptions(req.user.id, req.user.role, {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json(exceptions);
  } catch (error) {
    console.error('Get exceptions error:', error);
    res.status(500).json({ error: '获取异常列表失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const exception = exceptionService.getExceptionById(id, req.user.id, req.user.role);
    if (!exception) {
      return res.status(404).json({ error: '异常记录不存在' });
    }

    const statusFlows = statusFlowService.getStatusFlows('exception', id);
    res.json({ exception, statusFlows });
  } catch (error) {
    console.error('Get exception error:', error);
    res.status(500).json({ error: '获取异常详情失败' });
  }
});

module.exports = router;
