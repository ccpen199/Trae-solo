const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { auth } = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  try {
    const collections = db.prepare('SELECT * FROM collections WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json({ code: 0, data: collections, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.post('/', auth, (req, res) => {
  try {
    const { name, description, cover_image, is_public } = req.body;

    if (!name) {
      return res.status(400).json({ code: 1, message: '收藏夹名称不能为空' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO collections (id, user_id, name, description, cover_image, is_public, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, req.user.id, name, description || null, cover_image || null, is_public !== undefined ? is_public : 1, now);

    const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(id);
    res.json({ code: 0, data: collection, message: '创建成功' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.put('/:id', auth, (req, res) => {
  try {
    const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
    if (!collection) {
      return res.status(404).json({ code: 1, message: '收藏夹不存在' });
    }
    if (collection.user_id !== req.user.id) {
      return res.status(403).json({ code: 1, message: '无权修改' });
    }

    const { name, description, cover_image, is_public } = req.body;

    db.prepare(`
      UPDATE collections SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        cover_image = COALESCE(?, cover_image),
        is_public = COALESCE(?, is_public)
      WHERE id = ?
    `).run(name || null, description || null, cover_image || null, is_public !== undefined ? is_public : null, req.params.id);

    const updated = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
    res.json({ code: 0, data: updated, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.delete('/:id', auth, (req, res) => {
  try {
    const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
    if (!collection) {
      return res.status(404).json({ code: 1, message: '收藏夹不存在' });
    }
    if (collection.user_id !== req.user.id) {
      return res.status(403).json({ code: 1, message: '无权删除' });
    }

    db.prepare('DELETE FROM collection_items WHERE collection_id = ?').run(req.params.id);
    db.prepare('DELETE FROM collections WHERE id = ?').run(req.params.id);

    res.json({ code: 0, data: null, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.post('/:id/items', auth, (req, res) => {
  try {
    const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
    if (!collection) {
      return res.status(404).json({ code: 1, message: '收藏夹不存在' });
    }
    if (collection.user_id !== req.user.id) {
      return res.status(403).json({ code: 1, message: '无权操作' });
    }

    const { content_id } = req.body;
    if (!content_id) {
      return res.status(400).json({ code: 1, message: '内容ID不能为空' });
    }

    const content = db.prepare('SELECT id FROM contents WHERE id = ?').get(content_id);
    if (!content) {
      return res.status(404).json({ code: 1, message: '内容不存在' });
    }

    const existing = db.prepare('SELECT id FROM collection_items WHERE collection_id = ? AND content_id = ?').get(req.params.id, content_id);
    if (existing) {
      return res.status(409).json({ code: 1, message: '已在该收藏夹中' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare('INSERT INTO collection_items (id, collection_id, content_id, created_at) VALUES (?, ?, ?, ?)').run(id, req.params.id, content_id, now);
    db.prepare('UPDATE collections SET content_count = content_count + 1 WHERE id = ?').run(req.params.id);
    db.prepare('UPDATE contents SET collect_count = collect_count + 1 WHERE id = ?').run(content_id);

    res.json({ code: 0, data: null, message: '添加成功' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.delete('/:id/items/:contentId', auth, (req, res) => {
  try {
    const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
    if (!collection) {
      return res.status(404).json({ code: 1, message: '收藏夹不存在' });
    }
    if (collection.user_id !== req.user.id) {
      return res.status(403).json({ code: 1, message: '无权操作' });
    }

    const item = db.prepare('SELECT id FROM collection_items WHERE collection_id = ? AND content_id = ?').get(req.params.id, req.params.contentId);
    if (!item) {
      return res.status(404).json({ code: 1, message: '内容不在收藏夹中' });
    }

    db.prepare('DELETE FROM collection_items WHERE collection_id = ? AND content_id = ?').run(req.params.id, req.params.contentId);
    db.prepare('UPDATE collections SET content_count = content_count - 1 WHERE id = ?').run(req.params.id);
    db.prepare('UPDATE contents SET collect_count = collect_count - 1 WHERE id = ?').run(req.params.contentId);

    res.json({ code: 0, data: null, message: '移除成功' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

module.exports = router;
