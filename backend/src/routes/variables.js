const express = require('express');
const db = require('../models/database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM variable_fields WHERE 1=1';
    const params = [];
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const variables = await db.all(sql, params);
    res.json(variables.map(v => ({
      ...v,
      validation_rules: JSON.parse(v.validation_rules || '{}')
    })));
  } catch (error) {
    res.status(500).json({ error: '获取变量列表失败' });
  }
});

module.exports = router;
