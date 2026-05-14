import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../database';
import { generateId } from '../utils/crypto';
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from '../utils/response';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const createPostSchema = z.object({
  content: z.string().min(1, '内容不能为空').max(2000, '内容最多2000个字符'),
  pageUrl: z.string().url().optional(),
  pageTitle: z.string().max(200).optional(),
});

const createCommentSchema = z.object({
  content: z.string().min(1, '内容不能为空').max(500, '内容最多500个字符'),
});

router.post('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json(errorResponse('未登录'));
    }
    
    const validation = createPostSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(badRequestResponse(validation.error.issues[0]?.message || '参数验证失败'));
    }
    
    const { content, pageUrl, pageTitle } = validation.data;
    const db = getDb();
    const postId = generateId();
    
    db.prepare(`
      INSERT INTO posts (id, user_id, content, page_url, page_title)
      VALUES (?, ?, ?, ?, ?)
    `).run(postId, req.userId, content, pageUrl || null, pageTitle || null);
    
    const post = db
      .prepare(`
        SELECT p.*, u.nickname, u.avatar_config
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
      `)
      .get(postId) as {
        id: string;
        user_id: string;
        content: string;
        page_url?: string;
        page_title?: string;
        likes_count: number;
        comments_count: number;
        created_at: string;
        nickname: string;
        avatar_config: string;
      };
    
    return res.status(201).json(
      successResponse({
        post: {
          id: post.id,
          userId: post.user_id,
          nickname: post.nickname,
          avatarConfig: JSON.parse(post.avatar_config || '{}'),
          content: post.content,
          pageUrl: post.page_url,
          pageTitle: post.page_title,
          likesCount: post.likes_count,
          commentsCount: post.comments_count,
          createdAt: post.created_at,
          isLiked: false,
        },
      }, '发布成功')
    );
  } catch (error) {
    console.error('Create post error:', error);
    return res.status(500).json(errorResponse('发布失败'));
  }
});

router.get('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json(errorResponse('未登录'));
    }
    
    const { limit = '20', offset = '0' } = req.query;
    const limitNum = Math.min(parseInt(limit as string, 10) || 20, 50);
    const offsetNum = parseInt(offset as string, 10) || 0;
    const db = getDb();
    
    const posts = db
      .prepare(`
        SELECT p.*, u.nickname, u.avatar_config
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `)
      .all(limitNum, offsetNum) as Array<{
        id: string;
        user_id: string;
        content: string;
        page_url?: string;
        page_title?: string;
        likes_count: number;
        comments_count: number;
        created_at: string;
        nickname: string;
        avatar_config: string;
      }>;
    
    const likedRows = db
      .prepare('SELECT post_id FROM post_likes WHERE user_id = ?')
      .all(req.userId) as Array<{ post_id: string }>;
    const likedIds = new Set(likedRows.map((row) => row.post_id));
    
    const formattedPosts = posts.map((post) => ({
      id: post.id,
      userId: post.user_id,
      nickname: post.nickname,
      avatarConfig: JSON.parse(post.avatar_config || '{}'),
      content: post.content,
      pageUrl: post.page_url,
      pageTitle: post.page_title,
      likesCount: post.likes_count,
      commentsCount: post.comments_count,
      createdAt: post.created_at,
      isLiked: likedIds.has(post.id),
    }));
    
    const totalCount = (db.prepare('SELECT COUNT(*) as count FROM posts').get() as { count: number }).count;
    
    return res.json(
      successResponse({
        posts: formattedPosts,
        hasMore: offsetNum + limitNum < totalCount,
      })
    );
  } catch (error) {
    console.error('Get posts error:', error);
    return res.status(500).json(errorResponse('获取动态失败'));
  }
});

router.post('/:postId/like', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json(errorResponse('未登录'));
    }
    
    const { postId } = req.params;
    const db = getDb();
    
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json(notFoundResponse('动态'));
    }
    
    const existingLike = db
      .prepare('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?')
      .get(postId, req.userId);
    
    if (existingLike) {
      const transaction = db.transaction(() => {
        db.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').run(postId, req.userId);
        db.prepare('UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?').run(postId);
      });
      transaction();
      
      return res.json(successResponse({ isLiked: false, likesCount: (post as { likes_count: number }).likes_count - 1 }, '取消点赞'));
    }
    
    const likeId = generateId();
    const transaction = db.transaction(() => {
      db.prepare('INSERT INTO post_likes (id, post_id, user_id) VALUES (?, ?, ?)').run(likeId, postId, req.userId);
      db.prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?').run(postId);
    });
    transaction();
    
    return res.json(successResponse({ isLiked: true, likesCount: (post as { likes_count: number }).likes_count + 1 }, '点赞成功'));
  } catch (error) {
    console.error('Like post error:', error);
    return res.status(500).json(errorResponse('操作失败'));
  }
});

router.post('/:postId/comments', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    if (!req.userId || !req.user) {
      return res.status(401).json(errorResponse('未登录'));
    }
    
    const { postId } = req.params;
    const validation = createCommentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(badRequestResponse(validation.error.issues[0]?.message || '参数验证失败'));
    }
    
    const { content } = validation.data;
    const db = getDb();
    
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json(notFoundResponse('动态'));
    }
    
    const commentId = generateId();
    const transaction = db.transaction(() => {
      db.prepare('INSERT INTO post_comments (id, post_id, user_id, content) VALUES (?, ?, ?, ?)').run(commentId, postId, req.userId, content);
      db.prepare('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?').run(postId);
    });
    transaction();
    
    const comment = db
      .prepare(`
        SELECT c.*, u.nickname, u.avatar_config
        FROM post_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `)
      .get(commentId) as {
        id: string;
        user_id: string;
        content: string;
        created_at: string;
        nickname: string;
        avatar_config: string;
      };
    
    return res.status(201).json(
      successResponse({
        comment: {
          id: comment.id,
          userId: comment.user_id,
          nickname: comment.nickname,
          avatarConfig: JSON.parse(comment.avatar_config || '{}'),
          content: comment.content,
          createdAt: comment.created_at,
        },
      }, '评论成功')
    );
  } catch (error) {
    console.error('Create comment error:', error);
    return res.status(500).json(errorResponse('评论失败'));
  }
});

router.get('/:postId/comments', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json(errorResponse('未登录'));
    }
    
    const { postId } = req.params;
    const { limit = '20', offset = '0' } = req.query;
    const limitNum = Math.min(parseInt(limit as string, 10) || 20, 50);
    const offsetNum = parseInt(offset as string, 10) || 0;
    const db = getDb();
    
    const comments = db
      .prepare(`
        SELECT c.*, u.nickname, u.avatar_config
        FROM post_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `)
      .all(postId, limitNum, offsetNum) as Array<{
        id: string;
        user_id: string;
        content: string;
        created_at: string;
        nickname: string;
        avatar_config: string;
      }>;
    
    return res.json(
      successResponse({
        comments: comments.map((c) => ({
          id: c.id,
          userId: c.user_id,
          nickname: c.nickname,
          avatarConfig: JSON.parse(c.avatar_config || '{}'),
          content: c.content,
          createdAt: c.created_at,
        })),
      })
    );
  } catch (error) {
    console.error('Get comments error:', error);
    return res.status(500).json(errorResponse('获取评论失败'));
  }
});

export default router;
