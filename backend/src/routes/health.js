const express = require('express');
const router = express.Router();
const db = require('../utils/db');

router.get('/', (req, res) => {
  try {
    const result = db.prepare('SELECT 1 as health').get();
    res.json({
      code: 200,
      message: '服务运行正常',
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: 'connected'
      }
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '服务异常',
      data: { status: 'error' }
    });
  }
});

router.get('/stats', (req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const outletCount = db.prepare('SELECT COUNT(*) as count FROM service_outlets').get().count;
  const itemCount = db.prepare('SELECT COUNT(*) as count FROM service_items').get().count;
  const certCount = db.prepare('SELECT COUNT(*) as count FROM certificates').get().count;

  res.json({
    code: 200,
    data: {
      userCount,
      outletCount,
      itemCount,
      certCount
    }
  });
});

module.exports = router;
