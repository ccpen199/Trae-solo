import { Router } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { findArchives, exportGrades } from '../repositories/gradeRepository.js';
import type { ApiResponse, GradeArchive } from '../types/index.js';

const router = Router();

router.get('/', authMiddleware, roleMiddleware('teacher', 'admin'), (req, res) => {
  try {
    const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
    const classId = req.query.classId ? parseInt(req.query.classId as string) : undefined;
    const experimentId = req.query.experimentId ? parseInt(req.query.experimentId as string) : undefined;
    
    const archives = findArchives(courseId, classId, experimentId);
    res.json({ success: true, data: archives } as ApiResponse<GradeArchive[]>);
  } catch (error) {
    res.status(500).json({ success: false, error: '获取成绩列表失败' } as ApiResponse);
  }
});

router.post('/export', authMiddleware, roleMiddleware('teacher', 'admin'), (req, res) => {
  try {
    const { courseId, classId, experimentId } = req.body;
    
    const data = exportGrades(
      courseId ? parseInt(courseId) : undefined,
      classId ? parseInt(classId) : undefined,
      experimentId ? parseInt(experimentId) : undefined
    );
    
    res.json({ success: true, data, message: '导出成功' } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: '导出失败' } as ApiResponse);
  }
});

export default router;
