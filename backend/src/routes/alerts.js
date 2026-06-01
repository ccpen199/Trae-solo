const express = require('express');
const alertService = require('../services/alertService');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const alerts = await alertService.getAlerts(status, req.user.roleName);
    res.json(alerts);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: '获取告警列表失败' });
  }
});

router.post('/:id/close', async (req, res) => {
  try {
    const { reason } = req.body;
    await alertService.closeAlert(parseInt(req.params.id), req.user.id, reason);
    res.json({ message: '告警已关闭' });
  } catch (error) {
    res.status(500).json({ error: '关闭告警失败' });
  }
});

module.exports = router;
