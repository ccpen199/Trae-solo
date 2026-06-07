import type { Request, Response } from 'express';
import { PostRepository } from '../repositories/PostRepository.js';
import type { Post } from '../types/index.js';

export class PostController {
  private postRepository: PostRepository;

  constructor() {
    this.postRepository = new PostRepository();
  }

  public async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未登录',
        });
        return;
      }

      const { title, content, category, status } = req.body;

      if (!title || !content || !category) {
        res.status(400).json({
          success: false,
          error: '请填写完整信息',
        });
        return;
      }

      const postData: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'views'> = {
        title,
        content,
        category,
        author_id: req.user.id,
        status: status || 'published',
      };

      const postId = this.postRepository.create(postData);

      res.status(201).json({
        success: true,
        data: { id: postId },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '创建文章失败',
      });
    }
  }

  public async list(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.page_size as string) || 10;
      
      const filters: Record<string, unknown> = {};
      if (req.query.category) filters.category = req.query.category;
      if (req.query.status) filters.status = req.query.status;

      const result = this.postRepository.getPostsWithDetails(page, pageSize, filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取文章列表失败',
      });
    }
  }

  public async published(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.page_size as string) || 10;

      const result = this.postRepository.getPublishedPosts(page, pageSize);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取文章列表失败',
      });
    }
  }

  public async get(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的文章ID',
        });
        return;
      }

      const post = this.postRepository.getPostWithAuthor(id);

      if (!post) {
        res.status(404).json({
          success: false,
          error: '文章不存在',
        });
        return;
      }

      this.postRepository.incrementViews(id);

      res.json({
        success: true,
        data: post,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取文章详情失败',
      });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的文章ID',
        });
        return;
      }

      const post = this.postRepository.findById(id);
      if (!post) {
        res.status(404).json({
          success: false,
          error: '文章不存在',
        });
        return;
      }

      const { title, content, category, status } = req.body;

      const updateData: Partial<Post> = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (category !== undefined) updateData.category = category;
      if (status !== undefined) updateData.status = status;

      const success = this.postRepository.update(id, updateData);

      if (!success) {
        res.status(400).json({
          success: false,
          error: '更新文章失败',
        });
        return;
      }

      res.json({
        success: true,
        message: '更新成功',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '更新文章失败',
      });
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的文章ID',
        });
        return;
      }

      const success = this.postRepository.delete(id);

      if (!success) {
        res.status(404).json({
          success: false,
          error: '文章不存在',
        });
        return;
      }

      res.json({
        success: true,
        message: '删除成功',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '删除文章失败',
      });
    }
  }

  public async search(req: Request, res: Response): Promise<void> {
    try {
      const keyword = req.query.keyword as string;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.page_size as string) || 10;

      if (!keyword) {
        res.status(400).json({
          success: false,
          error: '请提供搜索关键词',
        });
        return;
      }

      const result = this.postRepository.searchPosts(keyword, page, pageSize);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '搜索失败',
      });
    }
  }

  public async stats(req: Request, res: Response): Promise<void> {
    try {
      const stats = this.postRepository.getPostStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取统计数据失败',
      });
    }
  }
}

export default PostController;
