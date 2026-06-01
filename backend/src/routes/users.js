const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/', (req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY created_at').all();
  res.json(users);
});

router.get('/role/:role', (req, res) => {
  const users = db.prepare('SELECT * FROM users WHERE role = ? ORDER BY name').all(req.params.role);
  res.json(users);
});

module.exports = router;
