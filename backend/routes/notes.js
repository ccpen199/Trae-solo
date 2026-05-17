import express from 'express';
import db from '../database/db.js';
import { successResponse, errorResponse, asyncHandler } from '../middleware/response.js';

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    pageSize = 20, 
    topic_id, 
    type, 
    sort = 'recommend',
    keyword 
  } = req.query;
  
  const offset = (page - 1) * pageSize;
  
  let whereClause = ['n.status = 1'];
  let params = [];
  
  if (topic_id) {
    whereClause.push('n.topic_id = ?');
    params.push(topic_id);
  }
  
  if (type) {
    whereClause.push('n.type = ?');
    params.push(type);
  }
  
  if (keyword) {
    whereClause.push('(n.title LIKE ? OR n.content LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  
  let orderBy = 'n.created_at DESC';
  if (sort === 'hot') {
    orderBy = '(n.like_count + n.collect_count + n.view_count) DESC';
  } else if (sort === 'newest') {
    orderBy = 'n.created_at DESC';
  }
  
  const whereSql = whereClause.join(' AND ');
  
  const notes = db.prepare(`
    SELECT n.*, t.name as topic_name 
    FROM notes n
    LEFT JOIN topics t ON n.topic_id = t.id
    WHERE ${whereSql}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  notes.forEach(note => {
    note.images = JSON.parse(note.images || '[]');
  });
  
  const { total } = db.prepare(`
    SELECT COUNT(*) as total FROM notes n WHERE ${whereSql}
  `).get(...params);
  
  successResponse(res, {
    list: notes,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  db.prepare('UPDATE notes SET view_count = view_count + 1 WHERE id = ?').run(id);
  
  const note = db.prepare(`
    SELECT n.*, t.name as topic_name 
    FROM notes n
    LEFT JOIN topics t ON n.topic_id = t.id
    WHERE n.id = ?
  `).get(id);
  
  if (!note) {
    return errorResponse(res, '笔记不存在', 404);
  }
  
  note.images = JSON.parse(note.images || '[]');
  
  successResponse(res, note);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { topic_id, title, content, images, type = 'image' } = req.body;
  
  if (!title) {
    return errorResponse(res, '标题不能为空', 400);
  }
  
  const imagesStr = Array.isArray(images) ? JSON.stringify(images) : JSON.stringify([]);
  
  const result = db.prepare(`
    INSERT INTO notes (topic_id, title, content, images, type)
    VALUES (?, ?, ?, ?, ?)
  `).run(topic_id || null, title, content, imagesStr, type);
  
  if (topic_id) {
    db.prepare('UPDATE topics SET note_count = note_count + 1 WHERE id = ?').run(topic_id);
  }
  
  successResponse(res, { id: result.lastInsertRowid }, '发布成功');
}));

router.post('/:id/like', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  db.prepare('UPDATE notes SET like_count = like_count + 1 WHERE id = ?').run(id);
  
  successResponse(res, null, '点赞成功');
}));

router.post('/:id/collect', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  db.prepare('UPDATE notes SET collect_count = collect_count + 1 WHERE id = ?').run(id);
  
  successResponse(res, null, '收藏成功');
}));

router.get('/:id/comments', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  const comments = db.prepare(`
    SELECT * FROM comments 
    WHERE note_id = ? 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `).all(id, parseInt(pageSize), offset);
  
  const { total } = db.prepare(`
    SELECT COUNT(*) as total FROM comments WHERE note_id = ?
  `).get(id);
  
  successResponse(res, {
    list: comments,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
}));

router.post('/:id/comments', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  
  if (!content) {
    return errorResponse(res, '评论内容不能为空', 400);
  }
  
  const result = db.prepare(`
    INSERT INTO comments (note_id, content)
    VALUES (?, ?)
  `).run(id, content);
  
  db.prepare('UPDATE notes SET comment_count = comment_count + 1 WHERE id = ?').run(id);
  
  successResponse(res, { id: result.lastInsertRowid }, '评论成功');
}));

export default router;
