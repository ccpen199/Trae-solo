const express = require('express');
const db = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  db.get('SELECT 1 as test', [], (err, row) => {
    if (err) {
      res.status(500).json({
        code: 500,
        status: 'error',
        message: '数据库连接异常',
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        code: 200,
        status: 'healthy',
        message: '服务运行正常',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    }
  });
});

module.exports = router;
