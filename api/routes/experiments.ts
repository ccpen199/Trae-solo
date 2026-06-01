import { Router } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { findAll, findById, getRubricItems, create, addRubricItem, update, saveVersion } from '../repositories/experimentRepository.js';
import type { ApiResponse, Experiment, RubricItem, ExperimentStatus } from '../types/index.js';

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
    const status = req.query.status as ExperimentStatus | undefined;
    const experiments = findAll(courseId, status);
    res.json({ success: true, data: experiments } as ApiResponse<Experiment[]>);
  } catch (error) {
    res.status(500).json({ success: false, error: '获取实验列表失败' } as ApiResponse);
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const experiment = findById(id);
    
    if (!experiment) {
      return res.status(404).json({ success: false, error: '实验不存在' } as ApiResponse);
    }
    
    const rubricItems = getRubricItems(id);
    res.json({ 
      success: true, 
      data: { ...experiment, rubricItems } 
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: '获取实验详情失败' } as ApiResponse);
  }
});

router.post('/', authMiddleware, roleMiddleware('teacher', 'admin'), (req, res) => {
  try {
    const { title, description, objectives, template, courseId, deadline, lateDeadline, status, rubricItems } = req.body;
    
    if (!title || !courseId || !deadline) {
      return res.status(400).json({ success: false, error: '缺少必填字段' } as ApiResponse);
    }
    
    const experiment = create({
      title,
      description: description || '',
      objectives: objectives || '',
      template,
      courseId: parseInt(courseId),
      deadline,
      lateDeadline,
      status: status || 'draft',
      createdBy: req.user!.userId,
    });
    
    if (rubricItems && rubricItems.length > 0) {
      for (let i = 0; i < rubricItems.length; i++) {
        const item = rubricItems[i];
        addRubricItem(experiment.id, {
          name: item.name,
          description: item.description || '',
          maxScore: parseFloat(item.maxScore) || 100,
          weight: parseFloat(item.weight) || 1,
          sortOrder: i + 1,
        });
      }
    }
    
    res.json({ success: true, data: experiment, message: '实验创建成功' } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: '创建实验失败' } as ApiResponse);
  }
});

router.put('/:id', authMiddleware, roleMiddleware('teacher', 'admin'), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = findById(id);
    
    if (!existing) {
      return res.status(404).json({ success: false, error: '实验不存在' } as ApiResponse);
    }
    
    if (existing.status === 'published') {
      saveVersion(id, existing.version, req.user!.userId);
    }
    
    const { title, description, objectives, template, deadline, lateDeadline, status } = req.body;
    
    const experiment = update(id, {
      title,
      description,
      objectives,
      template,
      deadline,
      lateDeadline,
      status,
    });
    
    res.json({ success: true, data: experiment, message: '实验更新成功' } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: '更新实验失败' } as ApiResponse);
  }
});

export default router;
