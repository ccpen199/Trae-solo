import { Router } from 'express';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth.js';
import { success, error, paginated } from '../utils/response.js';
import { queryMany, queryOne, execute } from '../db.js';
import type { Course, Exam, ExamQuestion, RankingItem, ExamSubmission } from '../../shared/types.js';

const router = Router();

router.get('/courses', authMiddleware, (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const category = req.query.category as string;

    let whereClause = '';
    const params: unknown[] = [];

    if (category) {
      whereClause = 'WHERE category = ?';
      params.push(category);
    }

    const offset = (page - 1) * pageSize;

    const courses = queryMany<Course>(
      `SELECT * FROM courses ${whereClause} ORDER BY publish_time DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const countResult = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM courses ${whereClause}`,
      params
    );

    const transformed = courses.map(c => ({
      ...c,
      contentType: (c as unknown as { content_type: string }).content_type,
      contentUrl: (c as unknown as { content_url: string }).content_url,
      publishedBy: (c as unknown as { published_by: string }).published_by,
      publishTime: (c as unknown as { publish_time: string }).publish_time,
      viewCount: (c as unknown as { view_count: number }).view_count,
    }));

    res.json(paginated(transformed, countResult?.count || 0, page, pageSize));
  } catch {
    res.status(500).json(error('获取课件列表失败', 500));
  }
});

router.get('/courses/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    const course = queryOne<Course>('SELECT * FROM courses WHERE id = ?', [id]);

    if (!course) {
      res.status(404).json(error('课件不存在', 404));
      return;
    }

    execute('UPDATE courses SET view_count = view_count + 1 WHERE id = ?', [id]);

    const transformed: Course = {
      ...course,
      contentType: (course as unknown as { content_type: string }).content_type as 'video' | 'document' | 'audio',
      contentUrl: (course as unknown as { content_url: string }).content_url,
      publishedBy: (course as unknown as { published_by: string }).published_by,
      publishTime: (course as unknown as { publish_time: string }).publish_time,
      viewCount: (course as unknown as { view_count: number }).view_count + 1,
    };

    res.json(success(transformed));
  } catch {
    res.status(500).json(error('获取课件详情失败', 500));
  }
});

router.get('/exams', authMiddleware, roleMiddleware(['sales', 'store_owner', 'operator', 'admin']), (req, res) => {
  try {
    const exams = queryMany<Exam>(
      'SELECT * FROM exams ORDER BY created_at DESC'
    );

    res.json(success(exams));
  } catch {
    res.status(500).json(error('获取考试列表失败', 500));
  }
});

router.get('/exams/:id', authMiddleware, roleMiddleware(['sales', 'store_owner']), (req, res) => {
  try {
    const { id } = req.params;

    const exam = queryOne<Exam>('SELECT * FROM exams WHERE id = ?', [id]);

    if (!exam) {
      res.status(404).json(error('考试不存在', 404));
      return;
    }

    const questions = queryMany<ExamQuestion>(
      'SELECT id, type, question, options_json, score FROM exam_questions WHERE exam_id = ?',
      [id]
    );

    const transformedQuestions = questions.map(q => ({
      ...q,
      options: (q as unknown as { options_json: string }).options_json ? JSON.parse((q as unknown as { options_json: string }).options_json) : [],
    }));

    const transformed: Exam = {
      ...exam,
      questions: transformedQuestions,
    };

    res.json(success(transformed));
  } catch {
    res.status(500).json(error('获取考试详情失败', 500));
  }
});

router.post('/exams/:id/submit', authMiddleware, roleMiddleware(['sales', 'store_owner']), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const userId = req.user?.userId;

    const questions = queryMany<{ id: number; answer_json: string; score: number }>(
      'SELECT id, answer_json, score FROM exam_questions WHERE exam_id = ?',
      [id]
    );

    let totalScore = 0;
    for (const q of questions) {
      const correctAnswer = JSON.parse(q.answer_json);
      const userAnswer = answers[q.id];
      
      if (JSON.stringify(correctAnswer) === JSON.stringify(userAnswer)) {
        totalScore += q.score;
      }
    }

    const exam = queryOne<{ passing_score: number; total_score: number }>(
      'SELECT passing_score, total_score FROM exams WHERE id = ?',
      [id]
    );

    const passed = totalScore >= (exam?.passing_score || 60);

    execute(
      'INSERT INTO exam_submissions (exam_id, user_id, answers_json, score, passed) VALUES (?, ?, ?, ?, ?)',
      [id, userId, JSON.stringify(answers), totalScore, passed]
    );

    res.json(success({
      score: totalScore,
      totalScore: exam?.total_score || 100,
      passingScore: exam?.passing_score || 60,
      passed,
    }, passed ? '考试通过！' : '未通过，请继续努力！'));
  } catch {
    res.status(500).json(error('提交失败', 500));
  }
});

router.get('/ranking', authMiddleware, (req, res) => {
  try {
    const type = req.query.type as string || 'personal';
    const period = req.query.period as string || 'month';
    const limit = parseInt(req.query.limit as string) || 20;

    const users = queryMany<{ id: number; real_name: string; avatar: string; region: string; role: string }>(
      'SELECT id, real_name, avatar, region, role FROM users WHERE role IN (?, ?) AND status = ?',
      ['sales', 'store_owner', 'active']
    );

    const rankings: RankingItem[] = users.map((user, idx) => {
      const baseAmount = 10000 + Math.floor(Math.random() * 100000);
      const teamSize = user.role === 'store_owner' ? 5 + Math.floor(Math.random() * 20) : 0;
      const growthRate = Math.floor(Math.random() * 50) - 10;

      return {
        rank: idx + 1,
        userId: user.id,
        userName: user.real_name,
        avatar: user.avatar,
        region: user.region || '未知',
        salesAmount: baseAmount,
        teamSize,
        growthRate,
        score: Math.floor(Math.random() * 100),
        completionRate: Math.floor(Math.random() * 100),
      };
    }).sort((a, b) => b.salesAmount - a.salesAmount)
      .map((r, idx) => ({ ...r, rank: idx + 1 }))
      .slice(0, limit);

    res.json(success(rankings));
  } catch {
    res.status(500).json(error('获取排行榜失败', 500));
  }
});

export default router;
