import express from 'express';
import db from '../database/db.js';
import { successResponse, errorResponse, asyncHandler } from '../middleware/response.js';

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 10, status, keyword } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = ['1=1'];
  let params = [];
  
  if (status !== undefined) {
    whereClause.push('status = ?');
    params.push(status);
  }
  
  if (keyword) {
    whereClause.push('(name LIKE ? OR keywords LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  
  const whereSql = whereClause.join(' AND ');
  
  const topics = db.prepare(`
    SELECT * FROM topics 
    WHERE ${whereSql}
    ORDER BY priority DESC, created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const { total } = db.prepare(`
    SELECT COUNT(*) as total FROM topics WHERE ${whereSql}
  `).get(...params);
  
  topics.forEach(topic => {
    topic.tags = topic.tags ? topic.tags.split(',') : [];
    topic.keywords = topic.keywords ? topic.keywords.split(',') : [];
    
    const notes = db.prepare(`
      SELECT images FROM notes 
      WHERE topic_id = ? AND status = 1 
      ORDER BY created_at DESC LIMIT 3
    `).all(topic.id);
    
    topic.thumbnails = notes.map(note => {
      const images = JSON.parse(note.images || '[]');
      return images[0] || null;
    }).filter(Boolean);
  });
  
  successResponse(res, {
    list: topics,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
}));

router.get('/search', asyncHandler(async (req, res) => {
  const { keyword, limit = 10 } = req.query;
  
  let whereClause = ['status = 1'];
  let params = [];
  
  if (keyword) {
    whereClause.push('(name LIKE ? OR keywords LIKE ? OR tags LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  
  const whereSql = whereClause.join(' AND ');
  
  const topics = db.prepare(`
    SELECT * FROM topics 
    WHERE ${whereSql}
    ORDER BY priority DESC, created_at DESC
    LIMIT ?
  `).all(...params, parseInt(limit));
  
  topics.forEach(topic => {
    topic.tags = topic.tags ? topic.tags.split(',') : [];
    
    const notes = db.prepare(`
      SELECT images FROM notes 
      WHERE topic_id = ? AND status = 1 
      ORDER BY created_at DESC LIMIT 3
    `).all(topic.id);
    
    topic.thumbnails = notes.map(note => {
      const images = JSON.parse(note.images || '[]');
      return images[0] || null;
    }).filter(Boolean);
  });
  
  successResponse(res, topics);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  db.prepare('UPDATE topics SET view_count = view_count + 1 WHERE id = ?').run(id);
  
  const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(id);
  
  if (!topic) {
    return errorResponse(res, '话题不存在', 404);
  }
  
  topic.tags = topic.tags ? topic.tags.split(',') : [];
  topic.keywords = topic.keywords ? topic.keywords.split(',') : [];
  
  const userId = 1;
  const follow = db.prepare(`
    SELECT id FROM user_topic_follow 
    WHERE user_id = ? AND topic_id = ?
  `).get(userId, id);
  
  topic.is_followed = !!follow;
  
  successResponse(res, topic);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { name, description, keywords, background_image, tags, start_time, end_time, status, priority } = req.body;
  
  if (!name) {
    return errorResponse(res, '话题名称不能为空', 400);
  }
  
  const keywordsStr = Array.isArray(keywords) ? keywords.join(',') : keywords;
  const tagsStr = Array.isArray(tags) ? tags.join(',') : tags;
  
  const result = db.prepare(`
    INSERT INTO topics (name, description, keywords, background_image, tags, start_time, end_time, status, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, description, keywordsStr, background_image, tagsStr, start_time, end_time, status, priority);
  
  successResponse(res, { id: result.lastInsertRowid }, '创建成功');
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, keywords, background_image, tags, start_time, end_time, status, priority } = req.body;
  
  const keywordsStr = Array.isArray(keywords) ? keywords.join(',') : keywords;
  const tagsStr = Array.isArray(tags) ? tags.join(',') : tags;
  
  db.prepare(`
    UPDATE topics 
    SET name = ?, description = ?, keywords = ?, background_image = ?, tags = ?, 
        start_time = ?, end_time = ?, status = ?, priority = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, description, keywordsStr, background_image, tagsStr, start_time, end_time, status, priority, id);
  
  successResponse(res, null, '更新成功');
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  db.prepare('DELETE FROM topics WHERE id = ?').run(id);
  
  successResponse(res, null, '删除成功');
}));

router.post('/:id/follow', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = 1;
  
  try {
    db.prepare(`
      INSERT INTO user_topic_follow (user_id, topic_id)
      VALUES (?, ?)
    `).run(userId, id);
    
    successResponse(res, { followed: true }, '关注成功');
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      db.prepare(`
        DELETE FROM user_topic_follow 
        WHERE user_id = ? AND topic_id = ?
      `).run(userId, id);
      
      successResponse(res, { followed: false }, '取消关注成功');
    } else {
      throw error;
    }
  }
}));

router.get('/user/followed', asyncHandler(async (req, res) => {
  const userId = 1;
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  const topics = db.prepare(`
    SELECT t.* FROM topics t
    INNER JOIN user_topic_follow utf ON t.id = utf.topic_id
    WHERE utf.user_id = ? AND t.status = 1
    ORDER BY utf.created_at DESC
    LIMIT ? OFFSET ?
  `).all(userId, parseInt(pageSize), offset);
  
  topics.forEach(topic => {
    topic.tags = topic.tags ? topic.tags.split(',') : [];
    topic.is_followed = true;
  });
  
  const { total } = db.prepare(`
    SELECT COUNT(*) as total FROM user_topic_follow WHERE user_id = ?
  `).get(userId);
  
  successResponse(res, {
    list: topics,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
}));

router.get('/recommend/list', asyncHandler(async (req, res) => {
  const userId = 1;
  const { limit = 5 } = req.query;
  
  const topics = db.prepare(`
    SELECT t.* FROM topics t
    WHERE t.status = 1 AND t.id NOT IN (
      SELECT topic_id FROM user_topic_follow WHERE user_id = ?
    )
    ORDER BY t.priority DESC, t.note_count DESC
    LIMIT ?
  `).all(userId, parseInt(limit));
  
  topics.forEach(topic => {
    topic.tags = topic.tags ? topic.tags.split(',') : [];
    topic.is_followed = false;
  });
  
  successResponse(res, topics);
}));

export default router;
