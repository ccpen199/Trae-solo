const express = require('express');
const router = express.Router();
const { authenticate, success, error, query, queryOne, execute } = require('../utils');

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const designers = await query('SELECT * FROM designers WHERE status = 1 ORDER BY followers DESC LIMIT ? OFFSET ?', [limit, offset]);
    const total = await queryOne('SELECT COUNT(*) as count FROM designers WHERE status = 1');
    
    res.json(success({ designers, total: total.count, page, limit }));
  } catch (e) {
    res.json(error('获取失败'));
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const designer = await queryOne('SELECT d.*, u.phone FROM designers d LEFT JOIN users u ON d.user_id = u.id WHERE d.id = ?', [id]);
    if (!designer) return res.json(error('设计师不存在'));
    
    const works = await query('SELECT * FROM designer_works WHERE designer_id = ? AND review_status = "approved" ORDER BY created_at DESC', [id]);
    
    res.json(success({ designer, works }));
  } catch (e) {
    res.json(error('获取失败'));
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const existing = await queryOne('SELECT * FROM designers WHERE user_id = ?', [req.userId]);
    if (existing) return res.json(error('已申请成为设计师'));
    
    const { real_name, bio, experience } = req.body;
    const result = await execute('INSERT INTO designers (user_id, real_name, bio, experience) VALUES (?, ?, ?, ?)', [req.userId, real_name, bio, experience || 0]);
    
    await execute('UPDATE users SET role = "designer" WHERE id = ?', [req.userId]);
    
    const designer = await queryOne('SELECT * FROM designers WHERE id = ?', [result.lastID]);
    res.json(success(designer, '申请成功，等待审核'));
  } catch (e) {
    res.json(error('申请失败'));
  }
});

router.post('/works', authenticate, async (req, res) => {
  try {
    const designer = await queryOne('SELECT * FROM designers WHERE user_id = ?', [req.userId]);
    if (!designer) return res.json(error('请先申请成为设计师'));
    
    const { title, description, images } = req.body;
    if (!title) return res.json(error('标题不能为空'));
    
    const result = await execute('INSERT INTO designer_works (designer_id, title, description, images) VALUES (?, ?, ?, ?)', [designer.id, title, description, JSON.stringify(images || [])]);
    
    await execute('UPDATE designers SET works_count = works_count + 1 WHERE id = ?', [designer.id]);
    
    const work = await queryOne('SELECT * FROM designer_works WHERE id = ?', [result.lastID]);
    res.json(success(work, '提交成功，等待审核'));
  } catch (e) {
    res.json(error('提交失败'));
  }
});

router.get('/works/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await execute('UPDATE designer_works SET views = views + 1 WHERE id = ?', [id]);
    
    const work = await queryOne('SELECT dw.*, d.real_name, d.avatar FROM designer_works dw LEFT JOIN designers d ON dw.designer_id = d.id WHERE dw.id = ?', [id]);
    if (!work) return res.json(error('作品不存在'));
    
    res.json(success(work));
  } catch (e) {
    res.json(error('获取失败'));
  }
});

router.post('/:id/follow', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await queryOne('SELECT * FROM designer_follows WHERE user_id = ? AND designer_id = ?', [req.userId, id]);
    if (existing) {
      await execute('DELETE FROM designer_follows WHERE id = ?', [existing.id]);
      await execute('UPDATE designers SET followers = followers - 1 WHERE id = ?', [id]);
      res.json(success({ followed: false }, '取消关注'));
    } else {
      await execute('INSERT INTO designer_follows (user_id, designer_id) VALUES (?, ?)', [req.userId, id]);
      await execute('UPDATE designers SET followers = followers + 1 WHERE id = ?', [id]);
      res.json(success({ followed: true }, '关注成功'));
    }
  } catch (e) {
    res.json(error('操作失败'));
  }
});

router.post('/works/:id/like', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await queryOne('SELECT * FROM designer_work_likes WHERE work_id = ? AND user_id = ?', [id, req.userId]);
    if (existing) {
      await execute('DELETE FROM designer_work_likes WHERE id = ?', [existing.id]);
      await execute('UPDATE designer_works SET likes = likes - 1 WHERE id = ?', [id]);
      res.json(success({ liked: false }, '取消点赞'));
    } else {
      await execute('INSERT INTO designer_work_likes (work_id, user_id) VALUES (?, ?)', [id, req.userId]);
      await execute('UPDATE designer_works SET likes = likes + 1 WHERE id = ?', [id]);
      
      const work = await queryOne('SELECT designer_id FROM designer_works WHERE id = ?', [id]);
      await execute('UPDATE designers SET likes = likes + 1 WHERE id = ?', [work.designer_id]);
      
      res.json(success({ liked: true }, '点赞成功'));
    }
  } catch (e) {
    res.json(error('操作失败'));
  }
});

module.exports = router;