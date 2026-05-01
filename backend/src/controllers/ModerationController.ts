import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { postService } from '../services/PostService';
import { contentRankingEngine } from '../services/engines/ContentRankingEngine';
import { UserRole } from '@prisma/client';

export const PostController = {
  create: [
    body('title')
      .isLength({ min: 1, max: 200 })
      .withMessage('标题长度应在 1-200 个字符之间'),
    body('content')
      .isLength({ min: 1, max: 50000 })
      .withMessage('内容长度应在 1-50000 个字符之间'),
    body('categoryId')
      .notEmpty()
      .withMessage('请选择分类'),
    
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: '需要登录'
          });
        }

        const { title, content, categoryId } = req.body;
        const post = await postService.createPost({
          title,
          content,
          categoryId,
          userId: req.user.id
        }, req.ip);

        return res.status(201).json({
          success: true,
          data: post
        });
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
    }
  ],

  update: [
    param('id')
      .isUUID()
      .withMessage('无效的帖子ID'),
    body('title')
      .optional()
      .isLength({ min: 1, max: 200 })
      .withMessage('标题长度应在 1-200 个字符之间'),
    body('content')
      .optional()
      .isLength({ min: 1, max: 50000 })
      .withMessage('内容长度应在 1-50000 个字符之间'),
    
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: '需要登录'
          });
        }

        const postId = req.params.id;
        const { title, content, changeReason } = req.body;
        
        const post = await postService.updatePost(
          postId,
          { title, content },
          req.user.id,
          req.user.role,
          changeReason
        );

        return res.json({
          success: true,
          data: post
        });
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
    }
  ],

  getById: [
    param('id')
      .isUUID()
      .withMessage('无效的帖子ID'),
    
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      try {
        const postId = req.params.id;
        const userId = req.user?.id;
        
        const post = await postService.getPostById(postId, userId);
        
        if (!post) {
          return res.status(404).json({
            success: false,
            error: '帖子不存在'
          });
        }

        return res.json({
          success: true,
          data: post
        });
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  ],

  list: [
    query('categoryId')
      .optional()
      .isUUID()
      .withMessage('无效的分类ID'),
    query('sort')
      .optional()
      .isIn(['hot', 'new', 'top'])
      .withMessage('排序方式只能是 hot、new 或 top'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量应在 1-100 之间'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('偏移量不能为负数'),
    
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      try {
        const { categoryId, sort = 'hot', limit = 20, offset = 0 } = req.query;
        
        let posts;
        const limitNum = parseInt(limit as string);
        const offsetNum = parseInt(offset as string);

        if (sort === 'new') {
          posts = await contentRankingEngine.getRecentPosts(
            categoryId as string,
            limitNum,
            offsetNum
          );
        } else {
          posts = await contentRankingEngine.getHotPosts(
            categoryId as string,
            limitNum,
            offsetNum
          );
        }

        return res.json({
          success: true,
          data: {
            posts,
            pagination: {
              limit: limitNum,
              offset: offsetNum,
              total: posts.length
            }
          }
        });
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  ],

  toggleLike: [
    param('id')
      .isUUID()
      .withMessage('无效的帖子ID'),
    
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: '需要登录'
          });
        }

        const postId = req.params.id;
        const result = await postService.toggleLike(postId, req.user.id);

        return res.json({
          success: true,
          data: result
        });
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
    }
  ],

  delete: [
    param('id')
      .isUUID()
      .withMessage('无效的帖子ID'),
    
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: '需要登录'
          });
        }

        const postId = req.params.id;
        const { reason } = req.body;
        
        await postService.deletePost(
          postId,
          req.user.id,
          req.user.role,
          reason
        );

        return res.json({
          success: true,
          message: '帖子已删除'
        });
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
    }
  ],

  getSnapshots: [
    param('id')
      .isUUID()
      .withMessage('无效的帖子ID'),
    
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      try {
        if (!req.user || (req.user.role !== UserRole.AUDITOR && req.user.role !== UserRole.ADMIN)) {
          return res.status(403).json({
            success: false,
            error: '权限不足'
          });
        }

        const postId = req.params.id;
        const snapshots = await postService.getPostSnapshots(postId);

        return res.json({
          success: true,
          data: snapshots
        });
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  ]
};
