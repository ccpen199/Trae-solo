import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { resumeService } from '../services/resumeService';

const router = Router();

const uploadDir = path.join(__dirname, '../../uploads/portfolio');
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
    cb(null, `portfolio-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('不支持的文件格式'));
    }
  }
});

router.put('/resume', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const result = await resumeService.createOrUpdateResume(req.user.id, req.body);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新简历失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.get('/resume', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const result = await resumeService.getResumeByUserId(req.user.id);
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取简历失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.post('/portfolio', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: '请上传文件' });
      return;
    }

    const { title, description, type } = req.body;
    const fileUrl = `/uploads/portfolio/${req.file.filename}`;
    const thumbnailUrl = req.file.mimetype.startsWith('image/') ? fileUrl : undefined;

    const result = await resumeService.addPortfolioItem(req.user.id, {
      title,
      description,
      type,
      fileUrl,
      thumbnailUrl
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '上传作品集失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.get('/portfolio', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const result = await resumeService.getPortfoliosByUserId(req.user.id);
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取作品集失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.delete('/portfolio/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const portfolioId = parseInt(req.params.id, 10);
    if (isNaN(portfolioId)) {
      res.status(400).json({ success: false, message: '无效的作品集ID' });
      return;
    }

    const result = await resumeService.deletePortfolioItem(req.user.id, portfolioId);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除作品集失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.post('/apply/:jobId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const jobId = parseInt(req.params.jobId, 10);
    if (isNaN(jobId)) {
      res.status(400).json({ success: false, message: '无效的岗位ID' });
      return;
    }

    const result = await resumeService.applyJob(req.user.id, jobId);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '申请岗位失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.get('/applications', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10;

    const result = await resumeService.getMyApplications(req.user.id, page, pageSize);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取申请列表失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

export default router;
