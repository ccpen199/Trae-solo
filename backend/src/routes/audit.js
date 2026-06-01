const express = require('express');
const auditService = require('../services/auditService');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { entity_type, entity_id, page, pageSize } = req.query;
    const logs = await auditService.getLogs(
      entity_type,
      entity_id ? parseInt(entity_id) : null,
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 50
    );
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: '获取审计日志失败' });
  }
});

module.exports = router;
