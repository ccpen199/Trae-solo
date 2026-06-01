import { Router, Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { findOrCreate, findById, getFiles, addFile, removeFile, updateStatus, addHistory, findByStudent, getAnnotations, addAnnotation } from '../repositories/submissionRepository.js';
import { findById as findExperimentById } from '../repositories/experimentRepository.js';
import type { ApiResponse, Submission, SubmissionFile, Annotation } from '../types/index.js';

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

const router = Router();

router.get('/my', authMiddleware, roleMiddleware('student'), (req, res) => {
  try {
    const submissions = findByStudent(req.user!.userId);
    res.json({ success: true, data: submissions } as ApiResponse<Submission[]>);
  } catch (error) {
    res.status(500).json({ success: false, error: '获取提交记录失败' } as ApiResponse);
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const submission = findById(id);
    
    if (!submission) {
      return res.status(404).json({ success: false, error: '提交记录不存在' } as ApiResponse);
    }
    
    const files = getFiles(id);
    const annotations = getAnnotations(id);
    
    res.json({ 
      success: true, 
      data: { ...submission, files, annotations } 
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: '获取提交详情失败' } as ApiResponse);
  }
});

router.get('/experiment/:experimentId/my', authMiddleware, roleMiddleware('student'), (req, res) => {
  try {
    const experimentId = parseInt(req.params.experimentId);
    const submissions = findByStudent(req.user!.userId, experimentId);
    const submission = submissions[0] || null;
    
    if (submission) {
      const files = getFiles(submission.id);
      res.json({ success: true, data: { ...submission, files } } as ApiResponse);
    } else {
      res.json({ success: true, data: null } as ApiResponse);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: '获取提交记录失败' } as ApiResponse);
  }
});

router.post('/experiment/:experimentId', authMiddleware, roleMiddleware('student'), (req, res) => {
  try {
    const experimentId = parseInt(req.params.experimentId);
    const experiment = findExperimentById(experimentId);
    
    if (!experiment) {
      return res.status(404).json({ success: false, error: '实验不存在' } as ApiResponse);
    }
    
    const submission = findOrCreate(experimentId, req.user!.userId);
    res.json({ success: true, data: submission } as ApiResponse<Submission>);
  } catch (error) {
    res.status(500).json({ success: false, error: '创建提交失败' } as ApiResponse);
  }
});

router.post('/:id/files', authMiddleware, roleMiddleware('student'), upload.array('files', 10), (req: Request, res) => {
  try {
    const submissionId = parseInt(req.params.id);
    const submission = findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({ success: false, error: '提交记录不存在' } as ApiResponse);
    }
    
    if (submission.studentId !== req.user!.userId) {
      return res.status(403).json({ success: false, error: '无权限操作此提交' } as ApiResponse);
    }
    
    const files: SubmissionFile[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const savedFile = addFile(submissionId, {
          filename: file.filename,
          originalName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
        });
        files.push(savedFile);
      }
    }
    
    res.json({ success: true, data: files, message: '文件上传成功' } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: '文件上传失败' } as ApiResponse);
  }
});

router.delete('/:submissionId/files/:fileId', authMiddleware, roleMiddleware('student'), (req, res) => {
  try {
    const submissionId = parseInt(req.params.submissionId);
    const fileId = parseInt(req.params.fileId);
    const submission = findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({ success: false, error: '提交记录不存在' } as ApiResponse);
    }
    
    if (submission.studentId !== req.user!.userId) {
      return res.status(403).json({ success: false, error: '无权限操作此提交' } as ApiResponse);
    }
    
    const files = getFiles(submissionId);
    const file = files.find(f => f.id === fileId);
    
    if (file) {
      const filePath = path.join(uploadDir, file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      removeFile(fileId);
    }
    
    res.json({ success: true, message: '文件删除成功' } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: '文件删除失败' } as ApiResponse);
  }
});

router.post('/:id/submit', authMiddleware, roleMiddleware('student'), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const submission = findById(id);
    
    if (!submission) {
      return res.status(404).json({ success: false, error: '提交记录不存在' } as ApiResponse);
    }
    
    if (submission.studentId !== req.user!.userId) {
      return res.status(403).json({ success: false, error: '无权限操作此提交' } as ApiResponse);
    }
    
    const files = getFiles(id);
    if (files.length === 0) {
      return res.status(400).json({ success: false, error: '请至少上传一个文件' } as ApiResponse);
    }
    
    const experiment = findExperimentById(submission.experimentId);
    const now = new Date();
    let status: 'submitted' | 'late' = 'submitted';
    
    if (experiment && new Date(experiment.deadline) < now) {
      if (experiment.lateDeadline && new Date(experiment.lateDeadline) >= now) {
        status = 'late';
      } else {
        return res.status(400).json({ success: false, error: '已超过提交截止时间' } as ApiResponse);
      }
    }
    
    const oldStatus = submission.status;
    const updated = updateStatus(id, status, now.toISOString())!;
    addHistory(id, 'submit', oldStatus, status, req.user!.userId);
    
    res.json({ success: true, data: updated, message: '提交成功' } as ApiResponse<Submission>);
  } catch (error) {
    res.status(500).json({ success: false, error: '提交失败' } as ApiResponse);
  }
});

router.post('/:id/resubmit', authMiddleware, roleMiddleware('student'), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const submission = findById(id);
    
    if (!submission) {
      return res.status(404).json({ success: false, error: '提交记录不存在' } as ApiResponse);
    }
    
    if (submission.studentId !== req.user!.userId) {
      return res.status(403).json({ success: false, error: '无权限操作此提交' } as ApiResponse);
    }
    
    if (!['submitted', 'late', 'returned'].includes(submission.status)) {
      return res.status(400).json({ success: false, error: '当前状态无法撤回重交' } as ApiResponse);
    }
    
    const oldStatus = submission.status;
    const updated = updateStatus(id, 'resubmitted')!;
    addHistory(id, 'resubmit', oldStatus, 'resubmitted', req.user!.userId);
    
    res.json({ success: true, data: updated, message: '已撤回，可重新提交' } as ApiResponse<Submission>);
  } catch (error) {
    res.status(500).json({ success: false, error: '操作失败' } as ApiResponse);
  }
});

router.post('/:id/annotations', authMiddleware, (req, res) => {
  try {
    const submissionId = parseInt(req.params.id);
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, error: '批注内容不能为空' } as ApiResponse);
    }
    
    const annotation = addAnnotation(submissionId, content, req.user!.userId);
    res.json({ success: true, data: annotation, message: '批注添加成功' } as ApiResponse<Annotation>);
  } catch (error) {
    res.status(500).json({ success: false, error: '添加批注失败' } as ApiResponse);
  }
});

export default router;
