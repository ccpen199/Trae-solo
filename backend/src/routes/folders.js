const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../utils/db');
const { success, error } = require('../utils/response');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const folders = db.prepare(`
      SELECT * FROM folders 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    res.json(success({ folders }));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('获取文件夹列表失败'));
  }
});

router.post('/', requireAuth, [
  body('name').notEmpty().withMessage('文件夹名称不能为空')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(error('参数验证失败', errors.array()));
  }

  const { name, parentId, color = '#1890ff' } = req.body;
  const folderId = uuidv4();
  const now = Date.now();

  try {
    const db = getDB();
    db.prepare(`
      INSERT INTO folders (id, user_id, name, parent_id, color, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(folderId, req.user.id, name, parentId || null, color, now, now);

    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(folderId);
    res.json(success({ folder }, '创建文件夹成功'));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('创建文件夹失败'));
  }
});

router.put('/:id', requireAuth, [
  body('name').optional().notEmpty().withMessage('文件夹名称不能为空')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(error('参数验证失败', errors.array()));
  }

  const { name, color } = req.body;

  try {
    const db = getDB();
    const folder = db.prepare('SELECT * FROM folders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!folder) {
      return res.status(404).json(error('文件夹不存在'));
    }

    db.prepare(`
      UPDATE folders 
      SET name = ?, color = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(
      name !== undefined ? name : folder.name,
      color !== undefined ? color : folder.color,
      Date.now(),
      req.params.id,
      req.user.id
    );

    const updatedFolder = db.prepare('SELECT * FROM folders WHERE id = ?').get(req.params.id);
    res.json(success({ folder: updatedFolder }, '更新文件夹成功'));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('更新文件夹失败'));
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const folder = db.prepare('SELECT * FROM folders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!folder) {
      return res.status(404).json(error('文件夹不存在'));
    }

    db.prepare('UPDATE notes SET folder_id = NULL WHERE folder_id = ? AND user_id = ?').run(req.params.id, req.user.id);
    db.prepare('DELETE FROM folders WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);

    res.json(success(null, '删除文件夹成功'));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('删除文件夹失败'));
  }
});

module.exports = router;
