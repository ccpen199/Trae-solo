import { Router, Response } from 'express';
import db from '../models/database';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import * as crypto from 'crypto';

const router = Router();

router.get('/courses', authMiddleware(), (req: AuthRequest, res: Response) => {
  const { category, level, keyword } = req.query;

  let where = [];
  let params: any[] = [];

  if (category) {
    where.push('category = ?');
    params.push(category);
  }
  if (level) {
    where.push('level = ?');
    params.push(level);
  }
  if (keyword) {
    where.push('(title LIKE ? OR description LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const whereSql = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const list = db.prepare(`
    SELECT tc.*,
      (SELECT COUNT(*) FROM training_progress tp WHERE tp.course_id = tc.id AND tp.completed = 1) as completed_count
    FROM training_courses tc
    ${whereSql}
    ORDER BY tc.created_at DESC
  `).all(...params);

  res.json({ list });
});

router.get('/courses/:id', authMiddleware(), (req: AuthRequest, res: Response) => {
  const course = db.prepare('SELECT * FROM training_courses WHERE id = ?').get(req.params.id) as any;
  if (!course) {
    return res.status(404).json({ error: '课程不存在' });
  }

  const quizzes = db.prepare('SELECT * FROM training_quizzes WHERE course_id = ?').all(req.params.id);

  let progress = null;
  if (req.user!.role === 'worker') {
    const workerId = (db.prepare('SELECT id FROM workers WHERE user_id = ?').get(req.user!.id) as any)?.id;
    if (workerId) {
      progress = db.prepare('SELECT * FROM training_progress WHERE worker_id = ? AND course_id = ?').get(workerId, req.params.id);
    }
  }

  res.json({ course, quizzes, progress });
});

router.post('/progress/:courseId', authMiddleware(['worker']), (req: AuthRequest, res: Response) => {
  const { progress } = req.body;
  const courseId = req.params.courseId;
  const workerId = (db.prepare('SELECT id FROM workers WHERE user_id = ?').get(req.user!.id) as any)?.id;

  if (!workerId) {
    return res.status(400).json({ error: '未找到阿姨档案' });
  }

  const existing = db.prepare('SELECT * FROM training_progress WHERE worker_id = ? AND course_id = ?').get(workerId, courseId);

  if (existing) {
    db.prepare('UPDATE training_progress SET progress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(progress, (existing as any).id);
  } else {
    db.prepare(`
      INSERT INTO training_progress (id, worker_id, course_id, progress, completed, updated_at)
      VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `).run(uuidv4(), workerId, courseId, progress);
  }

  res.json({ success: true, message: '进度已更新' });
});

router.post('/quiz/:courseId/submit', authMiddleware(['worker']), (req: AuthRequest, res: Response) => {
  const { answers } = req.body;
  const courseId = req.params.courseId;
  const workerId = (db.prepare('SELECT id FROM workers WHERE user_id = ?').get(req.user!.id) as any)?.id;

  if (!workerId) {
    return res.status(400).json({ error: '未找到阿姨档案' });
  }

  const quizzes = db.prepare('SELECT * FROM training_quizzes WHERE course_id = ?').all(courseId);
  if (quizzes.length === 0) {
    return res.status(400).json({ error: '该课程没有测验' });
  }

  let correctCount = 0;
  quizzes.forEach((quiz: any) => {
    const userAnswer = answers.find((a: any) => a.quiz_id === quiz.id);
    if (userAnswer && userAnswer.answer === quiz.correct_answer) {
      correctCount++;
    }
  });

  const score = Math.round((correctCount / quizzes.length) * 100);
  const passed = score >= 60;

  const existing = db.prepare('SELECT * FROM training_progress WHERE worker_id = ? AND course_id = ?').get(workerId, courseId) as any;

  if (passed) {
    const certificateHash = crypto.createHash('sha256').update(`${workerId}-${courseId}-${Date.now()}`).digest('hex');
    const certificateUrl = `/certificates/${workerId}-${courseId}.pdf`;

    if (existing) {
      db.prepare(`
        UPDATE training_progress SET
          quiz_score = ?,
          completed = 1,
          certificate_url = ?,
          certificate_hash = ?,
          completed_at = CURRENT_TIMESTAMP,
          progress = 100
        WHERE id = ?
      `).run(score, certificateUrl, certificateHash, existing.id);
    } else {
      db.prepare(`
        INSERT INTO training_progress (id, worker_id, course_id, progress, quiz_score, completed, certificate_url, certificate_hash, completed_at)
        VALUES (?, ?, ?, 100, ?, 1, ?, ?, CURRENT_TIMESTAMP)
      `).run(uuidv4(), workerId, courseId, score, certificateUrl, certificateHash);
    }

    res.json({ success: true, score, passed, certificateHash, message: '测验通过,证书已生成并存证' });
  } else {
    if (existing) {
      db.prepare('UPDATE training_progress SET quiz_score = ? WHERE id = ?').run(score, existing.id);
    }
    res.json({ success: true, score, passed, message: '测验未通过,请重新学习后再试' });
  }
});

router.get('/my-progress', authMiddleware(['worker']), (req: AuthRequest, res: Response) => {
  const workerId = (db.prepare('SELECT id FROM workers WHERE user_id = ?').get(req.user!.id) as any)?.id;
  if (!workerId) {
    return res.status(400).json({ error: '未找到阿姨档案' });
  }

  const list = db.prepare(`
    SELECT tp.*, tc.title, tc.category, tc.level, tc.duration, tc.cover_image,
      COALESCE(tp.updated_at, tp.created_at) as updated_at
    FROM training_progress tp
    LEFT JOIN training_courses tc ON tp.course_id = tc.id
    WHERE tp.worker_id = ?
    ORDER BY updated_at DESC
  `).all(workerId);

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_courses,
      SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_courses,
      AVG(quiz_score) as avg_score
    FROM training_progress WHERE worker_id = ?
  `).get(workerId);

  res.json({ list, stats });
});

router.get('/certificates/:workerId/verify/:hash', (req: AuthRequest, res: Response) => {
  const { workerId, hash } = req.params;
  const cert = db.prepare('SELECT * FROM training_progress WHERE worker_id = ? AND certificate_hash = ?').get(workerId, hash);

  if (cert) {
    res.json({ valid: true, data: cert });
  } else {
    res.json({ valid: false, error: '证书不存在或已失效' });
  }
});

export default router;
