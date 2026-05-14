const express = require('express');
const router = express.Router();
const { authenticate, success, error, query, queryOne, execute } = require('../utils');

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const cases = await query('SELECT cc.*, d.real_name, d.avatar FROM custom_cases cc LEFT JOIN designers d ON cc.designer_id = d.id WHERE cc.status = 1 ORDER BY cc.created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
    const total = await queryOne('SELECT COUNT(*) as count FROM custom_cases WHERE status = 1');
    
    res.json(success({ cases, total: total.count, page, limit }));
  } catch (e) {
    res.json(error('获取失败'));
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await execute('UPDATE custom_cases SET views = views + 1 WHERE id = ?', [id]);
    
    const customCase = await queryOne('SELECT cc.*, d.real_name, d.avatar FROM custom_cases cc LEFT JOIN designers d ON cc.designer_id = d.id WHERE cc.id = ?', [id]);
    if (!customCase) return res.json(error('案例不存在'));
    
    res.json(success(customCase));
  } catch (e) {
    res.json(error('获取失败'));
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const designer = await queryOne('SELECT * FROM designers WHERE user_id = ?', [req.userId]);
    if (!designer) return res.json(error('请先申请成为设计师'));
    
    const { title, description, images, area, style, budget } = req.body;
    if (!title) return res.json(error('标题不能为空'));
    
    const result = await execute('INSERT INTO custom_cases (designer_id, title, description, images, area, style, budget) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [designer.id, title, description, JSON.stringify(images || []), area || 0, style, budget || 0]);
    
    const customCase = await queryOne('SELECT cc.*, d.real_name, d.avatar FROM custom_cases cc LEFT JOIN designers d ON cc.designer_id = d.id WHERE cc.id = ?', [result.lastID]);
    res.json(success(customCase, '发布成功'));
  } catch (e) {
    res.json(error('发布失败'));
  }
});

router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const caseData = await queryOne('SELECT * FROM custom_cases WHERE id = ?', [id]);
    if (!caseData) return res.json(error('案例不存在'));
    
    const newLikes = caseData.likes + 1;
    await execute('UPDATE custom_cases SET likes = ? WHERE id = ?', [newLikes, id]);
    
    res.json(success({ likes: newLikes }, '点赞成功'));
  } catch (e) {
    res.json(error('操作失败'));
  }
});

module.exports = router;