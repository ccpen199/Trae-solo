import { Router } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { getPendingGrading, findById as findSubmissionById, saveGrade, updateScore, updateStatus, getGrades, addHistory } from '../repositories/submissionRepository.js';
import { findById as findExperimentById, getRubricItems } from '../repositories/experimentRepository.js';
import { findById as findUserById } from '../repositories/userRepository.js';
import { archiveGrade, findAllCourses, findAllClasses } from '../repositories/gradeRepository.js';
import type { ApiResponse, Submission, Grade } from '../types/index.js';

const router = Router();

router.get('/pending', authMiddleware, roleMiddleware('ta', 'teacher', 'admin'), (req, res) => {
  try {
    const submissions = getPendingGrading(req.user!.userId);
    const result = submissions.map(s => {
      const student = findUserById(s.studentId);
      const experiment = findExperimentById(s.experimentId);
      return {
        ...s,
        studentName: student?.name,
        studentId: student?.studentId,
        experimentTitle: experiment?.title,
      };
    });
    res.json({ success: true, data: result } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: '获取待批改列表失败' } as ApiResponse);
  }
});

router.get('/submission/:id', authMiddleware, roleMiddleware('ta', 'teacher', 'admin'), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const submission = findSubmissionById(id);
    
    if (!submission) {
      return res.status(404).json({ success: false, error: '提交记录不存在' } as ApiResponse);
    }
    
    const student = findUserById(submission.studentId);
    const experiment = findExperimentById(submission.experimentId);
    const rubricItems = experiment ? getRubricItems(experiment.id) : [];
    const existingGrades = getGrades(id);
    
    const gradesMap = new Map<number, Grade>();
    existingGrades.forEach(g => gradesMap.set(g.rubricItemId, g));
    
    const rubricsWithGrades = rubricItems.map(item => ({
      ...item,
      grade: gradesMap.get(item.id) || null,
    }));
    
    res.json({
      success: true,
      data: {
        submission,
        student,
        experiment,
        rubricItems: rubricsWithGrades,
      },
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: '获取批改详情失败' } as ApiResponse);
  }
});

router.post('/:submissionId/grade', authMiddleware, roleMiddleware('ta', 'teacher', 'admin'), (req, res) => {
  try {
    const submissionId = parseInt(req.params.submissionId);
    const submission = findSubmissionById(submissionId);
    
    if (!submission) {
      return res.status(404).json({ success: false, error: '提交记录不存在' } as ApiResponse);
    }
    
    const { grades } = req.body as { grades: Array<{ rubricItemId: number; score: number; comment?: string }> };
    
    if (!grades || grades.length === 0) {
      return res.status(400).json({ success: false, error: '请填写评分' } as ApiResponse);
    }
    
    const experiment = findExperimentById(submission.experimentId);
    const rubricItems = experiment ? getRubricItems(experiment.id) : [];
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const grade of grades) {
      const rubric = rubricItems.find(r => r.id === grade.rubricItemId);
      if (!rubric) continue;
      
      const clampedScore = Math.min(Math.max(grade.score, 0), rubric.maxScore);
      saveGrade(submissionId, grade.rubricItemId, clampedScore, grade.comment, req.user!.userId);
      
      totalScore += clampedScore * rubric.weight;
      totalWeight += rubric.weight;
    }
    
    const finalScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) / 100 : 0;
    const updated = updateScore(submissionId, finalScore, req.user!.userId)!;
    
    addHistory(submissionId, 'grade', submission.status, 'graded', req.user!.userId);
    
    if (experiment) {
      archiveGrade({
        submissionId,
        courseId: experiment.courseId,
        experimentId: submission.experimentId,
        studentId: submission.studentId,
        totalScore: finalScore,
        gradingVersion: submission.version,
        archivedBy: req.user!.userId,
      });
    }
    
    res.json({ success: true, data: updated, message: '评分完成' } as ApiResponse<Submission>);
  } catch (error) {
    res.status(500).json({ success: false, error: '评分失败' } as ApiResponse);
  }
});

router.post('/:submissionId/return', authMiddleware, roleMiddleware('ta', 'teacher', 'admin'), (req, res) => {
  try {
    const submissionId = parseInt(req.params.submissionId);
    const submission = findSubmissionById(submissionId);
    
    if (!submission) {
      return res.status(404).json({ success: false, error: '提交记录不存在' } as ApiResponse);
    }
    
    const { reason } = req.body;
    const oldStatus = submission.status;
    const updated = updateStatus(submissionId, 'returned')!;
    
    addHistory(submissionId, 'return', oldStatus, 'returned', req.user!.userId, reason);
    
    res.json({ success: true, data: updated, message: '已退回修改' } as ApiResponse<Submission>);
  } catch (error) {
    res.status(500).json({ success: false, error: '操作失败' } as ApiResponse);
  }
});

router.get('/courses', authMiddleware, (req, res) => {
  try {
    const courses = findAllCourses();
    res.json({ success: true, data: courses } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: '获取课程列表失败' } as ApiResponse);
  }
});

router.get('/classes', authMiddleware, (req, res) => {
  try {
    const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
    const classes = findAllClasses(courseId);
    res.json({ success: true, data: classes } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: '获取班级列表失败' } as ApiResponse);
  }
});

export default router;
