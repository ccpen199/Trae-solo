const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, query, validationResult } = require('express-validator');
const { getDB } = require('../utils/db');
const { success, error } = require('../utils/response');
const { requireAuth, requireVIP } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  query('folderId').optional(),
  query('isFavorite').optional().isIn(['0', '1']),
  query('keyword').optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(error('参数验证失败', errors.array()));
  }

  const { page = 1, pageSize = 20, folderId, isFavorite, keyword } = req.query;
  const offset = (page - 1) * pageSize;

  try {
    const db = getDB();
    let sql = `
      SELECT n.*, f.name as folder_name
      FROM notes n
      LEFT JOIN folders f ON n.folder_id = f.id
      WHERE n.user_id = ? AND n.is_deleted = 0
    `;
    const params = [req.user.id];

    if (folderId) {
      sql += ' AND n.folder_id = ?';
      params.push(folderId);
    }

    if (isFavorite === '1') {
      sql += ' AND n.is_favorite = 1';
    }

    if (keyword) {
      sql += ' AND (n.title LIKE ? OR n.content LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    sql += ' ORDER BY n.updated_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const notes = db.prepare(sql).all(...params);

    let countSql = `
      SELECT COUNT(*) as total
      FROM notes n
      WHERE n.user_id = ? AND n.is_deleted = 0
    `;
    const countParams = [req.user.id];

    if (folderId) {
      countSql += ' AND n.folder_id = ?';
      countParams.push(folderId);
    }

    if (isFavorite === '1') {
      countSql += ' AND n.is_favorite = 1';
    }

    if (keyword) {
      countSql += ' AND (n.title LIKE ? OR n.content LIKE ?)';
      countParams.push(`%${keyword}%`, `%${keyword}%`);
    }

    const { total } = db.prepare(countSql).get(...countParams);

    res.json(success({
      notes,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total
      }
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('获取笔记列表失败'));
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const note = db.prepare(`
      SELECT n.*, f.name as folder_name
      FROM notes n
      LEFT JOIN folders f ON n.folder_id = f.id
      WHERE n.id = ? AND n.user_id = ? AND n.is_deleted = 0
    `).get(req.params.id, req.user.id);

    if (!note) {
      return res.status(404).json(error('笔记不存在'));
    }

    res.json(success({ note }));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('获取笔记详情失败'));
  }
});

router.post('/', requireAuth, [
  body('title').notEmpty().withMessage('标题不能为空')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(error('参数验证失败', errors.array()));
  }

  const { title, content = '', contentHtml = '', folderId } = req.body;
  const noteId = uuidv4();
  const now = Date.now();

  try {
    const db = getDB();
    db.prepare(`
      INSERT INTO notes (id, user_id, title, content, content_html, folder_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(noteId, req.user.id, title, content, contentHtml, folderId || null, now, now);

    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId);
    res.json(success({ note }, '创建笔记成功'));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('创建笔记失败'));
  }
});

router.put('/:id', requireAuth, [
  body('title').optional().notEmpty().withMessage('标题不能为空')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(error('参数验证失败', errors.array()));
  }

  const { title, content, contentHtml, folderId, isFavorite } = req.body;

  try {
    const db = getDB();
    const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!note) {
      return res.status(404).json(error('笔记不存在'));
    }

    const isVip = req.user.vip_type > 0 && (!req.user.vip_expire_at || req.user.vip_expire_at > Date.now());
    
    if (isVip) {
      db.prepare(`
        INSERT INTO note_versions (id, note_id, user_id, title, content, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), note.id, req.user.id, note.title, note.content, Date.now());
    }

    const now = Date.now();
    db.prepare(`
      UPDATE notes 
      SET title = ?, content = ?, content_html = ?, folder_id = ?, is_favorite = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(
      title !== undefined ? title : note.title,
      content !== undefined ? content : note.content,
      contentHtml !== undefined ? contentHtml : note.content_html,
      folderId !== undefined ? folderId : note.folder_id,
      isFavorite !== undefined ? isFavorite : note.is_favorite,
      now,
      req.params.id,
      req.user.id
    );

    const updatedNote = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
    res.json(success({ note: updatedNote }, '更新笔记成功'));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('更新笔记失败'));
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!note) {
      return res.status(404).json(error('笔记不存在'));
    }

    db.prepare('UPDATE notes SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ?').run(
      Date.now(), Date.now(), req.params.id
    );

    res.json(success(null, '删除笔记成功'));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('删除笔记失败'));
  }
});

router.get('/trash/list', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const notes = db.prepare(`
      SELECT * FROM notes 
      WHERE user_id = ? AND is_deleted = 1
      ORDER BY deleted_at DESC
    `).all(req.user.id);

    res.json(success({ notes }));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('获取回收站失败'));
  }
});

router.put('/:id/restore', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!note) {
      return res.status(404).json(error('笔记不存在'));
    }

    db.prepare('UPDATE notes SET is_deleted = 0, deleted_at = NULL, updated_at = ? WHERE id = ?').run(
      Date.now(), req.params.id
    );

    res.json(success(null, '恢复笔记成功'));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('恢复笔记失败'));
  }
});

router.delete('/:id/permanent', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!note) {
      return res.status(404).json(error('笔记不存在'));
    }

    db.prepare('DELETE FROM note_versions WHERE note_id = ?').run(req.params.id);
    db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);

    res.json(success(null, '永久删除成功'));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('永久删除失败'));
  }
});

router.get('/:id/versions', requireVIP, async (req, res) => {
  try {
    const db = getDB();
    const versions = db.prepare(`
      SELECT * FROM note_versions 
      WHERE note_id = ? AND user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(req.params.id, req.user.id);

    res.json(success({ versions }));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('获取历史版本失败'));
  }
});

module.exports = router;
