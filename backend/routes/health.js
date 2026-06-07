const express = require('express');
const router = express.Router();
const { getDb } = require('../db/init');

router.get('/health', (req, res) => {
  try {
    const db = getDb();
    db.prepare('SELECT 1').get();
    res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString(), db: 'connected' } });
  } catch (error) {
    res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString(), db: 'disconnected' } });
  }
});

module.exports = router;
