const express = require('express');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/types', (req, res) => {
  const types = db.prepare(`
    SELECT DISTINCT dict_type FROM data_dictionary WHERE status = 1 ORDER BY dict_type
  `).all();
  
  res.json(types.map(t => t.dict_type));
});

router.get('/:dictType', (req, res) => {
  const { dictType } = req.params;
  
  const items = db.prepare(`
    SELECT dict_key, dict_value, sort_order, description 
    FROM data_dictionary 
    WHERE dict_type = ? AND status = 1 
    ORDER BY sort_order ASC
  `).all(dictType);
  
  res.json(items);
});

router.get('/batch/list', (req, res) => {
  const { types } = req.query;
  
  if (!types) {
    return res.status(400).json({ message: '请指定要获取的字典类型' });
  }

  const typeList = types.split(',');
  const placeholders = typeList.map(() => '?').join(',');

  const items = db.prepare(`
    SELECT dict_type, dict_key, dict_value, sort_order, description 
    FROM data_dictionary 
    WHERE dict_type IN (${placeholders}) AND status = 1 
    ORDER BY dict_type, sort_order ASC
  `).all(...typeList);

  const result = {};
  typeList.forEach(type => {
    result[type] = items.filter(item => item.dict_type === type);
  });

  res.json(result);
});

module.exports = router;
