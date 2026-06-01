import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest, requireRoles } from '../middleware/auth';
import { findAll, findById, create, update, count } from '../dao/base';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const page_size = parseInt(req.query.page_size as string) || 20;
  const course_id = req.query.course_id as string;
  const review_status = req.query.review_status as string;

  const where: Record<string, any> = {};
  if (course_id) where.course_id = parseInt(course_id);
  if (review_status) where.review_status = review_status;

  const total = count('publication_reviews', { where });
  const data = findAll('publication_reviews', {
    where,
    orderBy: 'created_at',
    orderDir: 'DESC',
    limit: page_size,
    offset: (page - 1) * page_size,
  });

  const result = data.map((review: any) => {
    const course = review.course_id ? findById('courses', review.course_id) : null;
    const reviewer = review.reviewer_id ? findById('users', review.reviewer_id) : null;
    return { ...review, course, reviewer };
  });

  res.json({
    data: result,
    total,
    page,
    page_size,
  });
});

router.post('/check/:courseId', authMiddleware, requireRoles('admin', 'operation', 'legal'), (req: AuthRequest, res: Response) => {
  const courseId = parseInt(req.params.courseId);
  const course = findById('courses', courseId);

  if (!course) {
    res.status(404).json({ error: '课程不存在' });
    return;
  }

  const materials = findAll('materials', { where: { course_id: courseId } });

  const checks = {
    authorization_verified: materials.length > 0 && materials.every((m: any) => m.authorization_status === 'authorized'),
    source_verified: materials.every((m: any) => m.source && m.source !== 'unknown'),
    watermark_configured: materials.filter((m: any) => m.type === 'video').every((m: any) => m.watermark_strategy && m.watermark_strategy !== 'none'),
    download_permission_set: materials.every((m: any) => m.download_permission !== null),
    validity_verified: materials.every((m: any) => {
      if (!m.authorization_end_date) return true;
      return new Date(m.authorization_end_date) > new Date();
    }),
  };

  const issues: string[] = [];
  if (!checks.authorization_verified) issues.push('存在未授权的素材');
  if (!checks.source_verified) issues.push('存在来源不明的素材');
  if (!checks.watermark_configured) issues.push('视频素材未配置水印策略');
  if (!checks.validity_verified) issues.push('存在已过期或即将过期的授权');

  const can_publish = Object.values(checks).every(Boolean);

  res.json({
    course_id: courseId,
    course_name: course.name,
    checks,
    issues,
    can_publish,
    material_count: materials.length,
  });
});

router.post('/review/:courseId', authMiddleware, requireRoles('admin', 'legal'), (req: AuthRequest, res: Response) => {
  const courseId = parseInt(req.params.courseId);
  const { review_status, issues, suggestions } = req.body;

  const course = findById('courses', courseId);
  if (!course) {
    res.status(404).json({ error: '课程不存在' });
    return;
  }

  if (!['approved', 'rejected'].includes(review_status)) {
    res.status(400).json({ error: '无效的审核状态' });
    return;
  }

  const checks = req.body.checks || {};

  const reviewId = create('publication_reviews', {
    course_id: courseId,
    reviewer_id: req.user?.id,
    review_status,
    authorization_verified: checks.authorization_verified ? 1 : 0,
    source_verified: checks.source_verified ? 1 : 0,
    watermark_configured: checks.watermark_configured ? 1 : 0,
    download_permission_set: checks.download_permission_set ? 1 : 0,
    validity_verified: checks.validity_verified ? 1 : 0,
    issues,
    suggestions,
    reviewed_at: new Date().toISOString(),
  });

  const newCourseStatus = review_status === 'approved' ? 'approved' : 'rejected';
  update('courses', courseId, { status: newCourseStatus, updated_at: new Date().toISOString() });

  db.prepare(
    'INSERT INTO audit_logs (user_id, action, module, record_id, new_value) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user?.id, `review_${review_status}`, 'publication_reviews', reviewId, JSON.stringify({ course_id: courseId, review_status }));

  res.json({ id: reviewId, message: `审核${review_status === 'approved' ? '通过' : '拒绝'}`, course_status: newCourseStatus });
});

router.post('/publish/:courseId', authMiddleware, requireRoles('admin', 'operation'), (req: AuthRequest, res: Response) => {
  const courseId = parseInt(req.params.courseId);
  const course = findById('courses', courseId);

  if (!course) {
    res.status(404).json({ error: '课程不存在' });
    return;
  }

  const approvedReview = db.prepare(
    'SELECT * FROM publication_reviews WHERE course_id = ? AND review_status = ? ORDER BY created_at DESC LIMIT 1'
  ).get(courseId, 'approved');

  if (!approvedReview) {
    res.status(400).json({ error: '课程尚未通过审核，不能发布' });
    return;
  }

  update('courses', courseId, { status: 'published', updated_at: new Date().toISOString() });

  db.prepare(
    'INSERT INTO audit_logs (user_id, action, module, record_id, new_value) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user?.id, 'publish', 'courses', courseId, JSON.stringify({ status: 'published' }));

  res.json({ message: '课程已发布' });
});

export default router;
