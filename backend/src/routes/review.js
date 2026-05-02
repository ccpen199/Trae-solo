const express = require('express');
const router = express.Router();
const ActionHandler = require('../engines/action-handler');

const actionHandler = new ActionHandler();

router.get('/pending', (req, res) => {
  try {
    const tasks = actionHandler.getPendingReviewTasks();
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:taskId/resolve', (req, res) => {
  try {
    const { taskId } = req.params;
    const { result, comment } = req.body;
    const operator = req.headers['x-operator'] || 'system';
    
    if (!result) {
      return res.status(400).json({ success: false, error: '必须提供审核结果 (result)' });
    }
    
    const updated = actionHandler.resolveReviewTask(taskId, result, comment, operator);
    
    if (!updated) {
      return res.status(404).json({ success: false, error: '审核任务不存在或已处理' });
    }
    
    res.json({ success: true, message: '审核任务已处理' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/actions', (req, res) => {
  try {
    const { decisionId } = req.query;
    const records = actionHandler.getActionRecords(decisionId);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
