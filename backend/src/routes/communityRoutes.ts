import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { communityService } from '../services/communityService';

const router = Router();

const uploadDir = path.join(__dirname, '../../uploads/community');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `community-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('只支持图片格式'));
    }
  }
});

router.post('/posts', authMiddleware, upload.array('images', 9), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const { title, content, tags } = req.body;

    let images: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      images = req.files.map(file => `/uploads/community/${file.filename}`);
    }

    const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;

    const result = await communityService.createPost(req.user.id, {
      title,
      content,
      tags: parsedTags,
      images
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '发帖失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.get('/posts', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
    const tag = req.query.tag as string;
    const keyword = req.query.keyword as string;

    const result = await communityService.getPostList({
      tag,
      keyword,
      page,
      pageSize
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取帖子列表失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.get('/posts/:id', async (req: AuthRequest, res: Response) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      res.status(400).json({ success: false, message: '无效的帖子ID' });
      return;
    }

    const result = await communityService.getPostDetail(postId);
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取帖子详情失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.post('/posts/:id/comments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      res.status(400).json({ success: false, message: '无效的帖子ID' });
      return;
    }

    const { content, parentId } = req.body;

    const result = await communityService.addComment(req.user.id, postId, {
      content,
      parentId: parentId ? parseInt(parentId, 10) : undefined
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '评论失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.post('/posts/:id/like', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      res.status(400).json({ success: false, message: '无效的帖子ID' });
      return;
    }

    const result = await communityService.likePost(req.user.id, postId);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '点赞失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

export default router;
