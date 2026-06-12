import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import { authMiddleware, AuthRequest, rbacMiddleware, auditMiddleware } from '../middleware/auth';
import { generateCertificateNo } from '../utils';

const router = Router();

router.get('/courses', authMiddleware, (req: AuthRequest, res) => {
  const { keyword, category } = req.query;
  let sql = 'SELECT c.*, u.name as trainer_name FROM courses c LEFT JOIN users u ON c.trainer_id = u.id WHERE 1=1';
  const params: any[] = [];
  if (req.user!.role !== 'trainer' && req.user!.role !== 'admin') {
    sql += ' AND c.status = ?'; params.push('published');
  } else {
    sql += ' AND c.tenant_id = ?'; params.push(req.user!.tenantId);
  }
  if (keyword) { sql += ' AND (c.title LIKE ? OR c.description LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
  if (category) { sql += ' AND c.category = ?'; params.push(category); }
  sql += ' ORDER BY c.created_at DESC LIMIT 100';
  const courses = db.prepare(sql).all(...params);
  res.json({ courses });
});

router.post('/courses', authMiddleware, rbacMiddleware('course', 'create'), auditMiddleware('create_course', 'course'), (req: AuthRequest, res) => {
  const { title, description, category, cover, duration, lessons = [] } = req.body;
  if (!title) return res.status(400).json({ error: '课程标题必填' });
  const id = uuidv4();
  db.prepare('INSERT INTO courses (id, tenant_id, trainer_id, title, description, category, cover, duration, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, req.user!.tenantId, req.user!.id, title, description, category, cover, duration || 0, 'draft');
  const insertLesson = db.prepare('INSERT INTO course_lessons (id, course_id, title, content, video_url, sort_order, duration) VALUES (?, ?, ?, ?, ?, ?, ?)');
  lessons.forEach((l: any, i: number) => {
    insertLesson.run(uuidv4(), id, l.title, l.content || '', l.video_url || '', i, l.duration || 0);
  });
  res.json({ id });
});

router.get('/courses/:id', authMiddleware, (req: AuthRequest, res) => {
  const course = db.prepare('SELECT c.*, u.name as trainer_name FROM courses c LEFT JOIN users u ON c.trainer_id = u.id WHERE c.id = ?').get(req.params.id) as any;
  if (!course) return res.status(404).json({ error: '课程不存在' });
  const lessons = db.prepare('SELECT * FROM course_lessons WHERE course_id = ? ORDER BY sort_order ASC').all(req.params.id);
  let progress = null;
  let myProgress: any[] = [];
  if (req.user!.role === 'jobseeker') {
    myProgress = db.prepare('SELECT * FROM learning_progress WHERE user_id = ? AND course_id = ?').all(req.user!.id, req.params.id);
    const totalLessons = lessons.length;
    const completedLessons = myProgress.filter((p: any) => p.completed).length;
    progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  }
  res.json({ course, lessons, progress, myProgress });
});

router.put('/courses/:id', authMiddleware, rbacMiddleware('course', 'update'), auditMiddleware('update_course', 'course'), (req: AuthRequest, res) => {
  const { title, description, category, cover, duration, status, lessons } = req.body;
  db.prepare('UPDATE courses SET title = COALESCE(?, title), description = COALESCE(?, description), category = COALESCE(?, category), cover = COALESCE(?, cover), duration = COALESCE(?, duration), status = COALESCE(?, status) WHERE id = ? AND tenant_id = ?')
    .run(title, description, category, cover, duration, status, req.params.id, req.user!.tenantId);
  if (lessons && Array.isArray(lessons)) {
    db.prepare('DELETE FROM course_lessons WHERE course_id = ?').run(req.params.id);
    const insertLesson = db.prepare('INSERT INTO course_lessons (id, course_id, title, content, video_url, sort_order, duration) VALUES (?, ?, ?, ?, ?, ?, ?)');
    lessons.forEach((l: any, i: number) => {
      insertLesson.run(l.id || uuidv4(), req.params.id, l.title, l.content || '', l.video_url || '', i, l.duration || 0);
    });
  }
  res.json({ success: true });
});

router.post('/courses/:courseId/lessons/:lessonId/progress', authMiddleware, (req: AuthRequest, res) => {
  const { progress, completed } = req.body;
  const existing = db.prepare('SELECT id FROM learning_progress WHERE user_id = ? AND course_id = ? AND lesson_id = ?').get(req.user!.id, req.params.courseId, req.params.lessonId) as any;
  if (existing) {
    db.prepare('UPDATE learning_progress SET progress = COALESCE(?, progress), completed = COALESCE(?, completed), last_study_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(progress, completed ? 1 : 0, existing.id);
  } else {
    db.prepare('INSERT INTO learning_progress (id, user_id, course_id, lesson_id, progress, completed, last_study_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)')
      .run(uuidv4(), req.user!.id, req.params.courseId, req.params.lessonId, progress || 0, completed ? 1 : 0);
  }
  const lessons = db.prepare('SELECT * FROM course_lessons WHERE course_id = ?').all(req.params.courseId);
  const myProgress = db.prepare('SELECT * FROM learning_progress WHERE user_id = ? AND course_id = ?').all(req.user!.id, req.params.courseId) as any[];
  const totalLessons = lessons.length;
  const completedLessons = myProgress.filter(p => p.completed).length;
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  if (overallProgress >= 100) {
    const existingCert = db.prepare('SELECT id FROM certificates WHERE user_id = ? AND course_id = ?').get(req.user!.id, req.params.courseId);
    if (!existingCert) {
      db.prepare('INSERT INTO certificates (id, user_id, course_id, certificate_no, score) VALUES (?, ?, ?, ?, ?)')
        .run(uuidv4(), req.user!.id, req.params.courseId, generateCertificateNo(), overallProgress);
    }
  }
  res.json({ success: true, overallProgress });
});

router.get('/my/progress', authMiddleware, (req: AuthRequest, res) => {
  const progress = db.prepare(`
    SELECT c.id, c.title, c.cover, 
      COUNT(cl.id) as total_lessons,
      SUM(CASE WHEN lp.completed = 1 THEN 1 ELSE 0 END) as completed_lessons,
      MAX(lp.last_study_at) as last_study_at
    FROM courses c
    LEFT JOIN course_lessons cl ON cl.course_id = c.id
    LEFT JOIN learning_progress lp ON lp.course_id = c.id AND lp.lesson_id = cl.id AND lp.user_id = ?
    WHERE lp.user_id = ?
    GROUP BY c.id
    ORDER BY last_study_at DESC NULLS LAST
  `).all(req.user!.id, req.user!.id);
  const result = progress.map((p: any) => ({
    ...p,
    progress: p.total_lessons > 0 ? Math.round((p.completed_lessons / p.total_lessons) * 100) : 0
  }));
  res.json({ progress: result });
});

router.get('/my/certificates', authMiddleware, (req: AuthRequest, res) => {
  const certs = db.prepare('SELECT cert.*, c.title as course_name, c.cover as course_cover FROM certificates cert LEFT JOIN courses c ON cert.course_id = c.id WHERE cert.user_id = ? ORDER BY cert.issued_at DESC').all(req.user!.id);
  res.json({ certificates: certs });
});

router.get('/certificates/:certNo/verify', (req, res) => {
  const cert = db.prepare('SELECT cert.*, u.name as user_name, c.title as course_name FROM certificates cert LEFT JOIN users u ON cert.user_id = u.id LEFT JOIN courses c ON cert.course_id = c.id WHERE cert.certificate_no = ?').get(req.params.certNo);
  if (!cert) return res.status(404).json({ valid: false, error: '证书不存在' });
  res.json({ valid: true, certificate: cert });
});

router.get('/lms/api/courses', authMiddleware, (_req: AuthRequest, res) => {
  const courses = db.prepare('SELECT id, title, description, category, duration, status, created_at FROM courses WHERE status = ?').all('published');
  res.json({ courses, source: 'LMS-API-v1', timestamp: Date.now() });
});

router.get('/lms/api/users/:userId/progress', authMiddleware, (req: AuthRequest, res) => {
  const progress = db.prepare(`
    SELECT c.id as course_id, c.title, 
      COUNT(cl.id) as total_lessons,
      SUM(CASE WHEN lp.completed = 1 THEN 1 ELSE 0 END) as completed_lessons,
      MAX(lp.last_study_at) as last_study_at
    FROM courses c
    LEFT JOIN course_lessons cl ON cl.course_id = c.id
    LEFT JOIN learning_progress lp ON lp.course_id = c.id AND lp.lesson_id = cl.id AND lp.user_id = ?
    GROUP BY c.id
  `).all(req.params.userId);
  res.json({ userId: req.params.userId, progress, source: 'LMS-API-v1' });
});

router.get('/stats/overview', authMiddleware, rbacMiddleware('progress', 'read'), (req: AuthRequest, res) => {
  const courseCount = db.prepare('SELECT COUNT(*) as cnt FROM courses WHERE tenant_id = ?').get(req.user!.tenantId) as { cnt: number };
  const studentCount = db.prepare('SELECT COUNT(DISTINCT user_id) as cnt FROM learning_progress lp JOIN courses c ON lp.course_id = c.id WHERE c.tenant_id = ?').get(req.user!.tenantId) as { cnt: number };
  const certCount = db.prepare('SELECT COUNT(*) as cnt FROM certificates cert JOIN courses c ON cert.course_id = c.id WHERE c.tenant_id = ?').get(req.user!.tenantId) as { cnt: number };
  const topCourses = db.prepare(`
    SELECT c.id, c.title, COUNT(DISTINCT lp.user_id) as student_count
    FROM courses c LEFT JOIN learning_progress lp ON lp.course_id = c.id
    WHERE c.tenant_id = ? GROUP BY c.id ORDER BY student_count DESC LIMIT 5
  `).all(req.user!.tenantId);
  res.json({ stats: { courseCount: courseCount.cnt, studentCount: studentCount.cnt, certCount: certCount.cnt, topCourses } });
});

export default router;
