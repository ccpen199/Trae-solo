import { Router, Response } from 'express';
import db from '../models/database';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/posts', authMiddleware(), (req: AuthRequest, res: Response) => {
  const { page = 1, pageSize = 10, tag, user_role, is_answered, keyword } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  let where = [];
  let params: any[] = [];

  if (tag) {
    where.push('tags LIKE ?');
    params.push(`%${tag}%`);
  }
  if (user_role) {
    where.push('user_role = ?');
    params.push(user_role);
  }
  if (is_answered !== undefined) {
    where.push('is_answered = ?');
    params.push(is_answered === 'true' ? 1 : 0);
  }
  if (keyword) {
    where.push('(title LIKE ? OR content LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  if (req.user!.role !== 'admin' && req.user!.role !== 'expert') {
    where.push('is_private = 0 OR user_id = ?');
    params.push(req.user!.id);
  }

  const whereSql = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) as count FROM community_posts ${whereSql}`).get(...params) as any;
  const list = db.prepare(`
    SELECT cp.*, u.username, u.avatar,
      (SELECT COUNT(*) FROM community_comments cc WHERE cc.post_id = cp.id) as comment_count
    FROM community_posts cp
    LEFT JOIN users u ON cp.user_id = u.id
    ${whereSql}
    ORDER BY cp.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset);

  res.json({
    list,
    total: total.count,
    page: Number(page),
    pageSize: Number(pageSize),
  });
});

router.get('/posts/:id', authMiddleware(), (req: AuthRequest, res: Response) => {
  const post = db.prepare(`
    SELECT cp.*, u.username, u.avatar,
      (SELECT COUNT(*) FROM community_comments cc WHERE cc.post_id = cp.id) as comment_count
    FROM community_posts cp
    LEFT JOIN users u ON cp.user_id = u.id
    WHERE cp.id = ?
  `).get(req.params.id) as any;

  if (!post) {
    return res.status(404).json({ error: '帖子不存在' });
  }

  if (post.is_private && req.user!.role !== 'admin' && req.user!.role !== 'expert' && post.user_id !== req.user!.id) {
    return res.status(403).json({ error: '该帖子为隐私内容' });
  }

  db.prepare('UPDATE community_posts SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);

  const comments = db.prepare(`
    SELECT cc.*, u.username, u.avatar, u.role
    FROM community_comments cc
    LEFT JOIN users u ON cc.user_id = u.id
    WHERE cc.post_id = ?
    ORDER BY cc.created_at ASC
  `).all(req.params.id);

  res.json({ post, comments });
});

router.post('/posts', authMiddleware(), (req: AuthRequest, res: Response) => {
  const { title, content, tags, is_private } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: '标题和内容不能为空' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO community_posts (id, user_id, user_role, title, content, tags, is_private)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user!.id, req.user!.role, title, content, tags ? tags.join(',') : '', is_private ? 1 : 0);

  res.json({ success: true, id, message: '发布成功' });
});

router.post('/posts/:id/answer', authMiddleware(['expert', 'admin']), (req: AuthRequest, res: Response) => {
  const { expert_answer } = req.body;
  const postId = req.params.id;

  if (!expert_answer) {
    return res.status(400).json({ error: '回答内容不能为空' });
  }

  db.prepare(`
    UPDATE community_posts SET
      expert_id = ?,
      expert_answer = ?,
      is_answered = 1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.user!.id, expert_answer, postId);

  res.json({ success: true, message: '回答已发布' });
});

router.post('/posts/:id/like', authMiddleware(), (req: AuthRequest, res: Response) => {
  db.prepare('UPDATE community_posts SET like_count = like_count + 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: '点赞成功' });
});

router.post('/posts/:id/comments', authMiddleware(), (req: AuthRequest, res: Response) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: '评论内容不能为空' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO community_comments (id, post_id, user_id, content)
    VALUES (?, ?, ?, ?)
  `).run(id, req.params.id, req.user!.id, content);

  res.json({ success: true, id, message: '评论成功' });
});

router.get('/hot-tags', authMiddleware(), (req: AuthRequest, res: Response) => {
  const rows = db.prepare("SELECT tags FROM community_posts WHERE tags != ''").all() as any[];
  const tagCount: Record<string, number> = {};

  rows.forEach(row => {
    const tags = row.tags.split(',');
    tags.forEach((tag: string) => {
      tag = tag.trim();
      if (tag) {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      }
    });
  });

  const hotTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  res.json({ hotTags });
});

router.get('/experts', authMiddleware(), (req: AuthRequest, res: Response) => {
  const experts = db.prepare(`
    SELECT u.id, u.username, u.avatar, u.phone,
      (SELECT COUNT(*) FROM community_posts cp WHERE cp.expert_id = u.id) as answered_count
    FROM users u WHERE u.role = 'expert'
  `).all();

  res.json({ list: experts });
});

export default router;
