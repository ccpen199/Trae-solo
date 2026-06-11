const express = require('express');
const db = require('../config/database');

const router = express.Router();

router.get('/', (req, res) => {
  let dbStatus = 'ok';
  let userCount = 0;
  let serviceCount = 0;

  try {
    userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    serviceCount = db.prepare('SELECT COUNT(*) as count FROM services').get().count;
  } catch (err) {
    dbStatus = 'error';
  }

  res.json({
    code: 200,
    status: 'healthy',
    data: {
      timestamp: new Date().toISOString(),
      database: dbStatus,
      stats: {
        users: userCount,
        services: serviceCount,
      },
    },
  });
});

router.get('/ping', (req, res) => {
  res.json({ code: 200, message: 'pong', timestamp: new Date().toISOString() });
});

module.exports = router;
