import { Router, type Request, type Response } from 'express';
import {
  MOCK_EDUCATION_COURSES,
  generateCreditBankRecords,
} from '../mock/mockData.js';
import {
  ApiResponse,
  EducationCourse,
  CreditBankRecord,
} from '../../shared/types/index.js';

const router = Router();

const DEFAULT_SEEKER_ID = 'js_00001';

function ok<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

function fail(error: string): ApiResponse {
  return { success: false, error };
}

router.get('/courses', async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 12;
  const type = req.query.type as string;
  const major = (req.query.major as string)?.trim();
  const creditBankOnly = req.query.creditBankOnly === 'true';
  const priceMin = parseInt(req.query.priceMin as string) || 0;
  const priceMax = parseInt(req.query.priceMax as string) || 999999;
  const sortBy = (req.query.sortBy as string) || 'price';
  const sortOrder = (req.query.sortOrder as string) || 'asc';

  let courses = [...MOCK_EDUCATION_COURSES];

  if (type) {
    courses = courses.filter(c => c.type === type);
  }
  if (major) {
    courses = courses.filter(c => c.major.includes(major) || c.title.includes(major));
  }
  if (creditBankOnly) {
    courses = courses.filter(c => c.creditBankEligible);
  }
  if (priceMin > 0) {
    courses = courses.filter(c => c.price >= priceMin);
  }
  if (priceMax < 999999) {
    courses = courses.filter(c => c.price <= priceMax);
  }

  courses.sort((a, b) => {
    let result = 0;
    switch (sortBy) {
      case 'duration':
        result = parseInt(a.duration) - parseInt(b.duration);
        break;
      case 'price':
      default:
        result = a.price - b.price;
    }
    return sortOrder === 'asc' ? result : -result;
  });

  const total = courses.length;
  const startIdx = (page - 1) * pageSize;
  const paginated = courses.slice(startIdx, startIdx + pageSize);
  const totalPages = Math.ceil(total / pageSize);

  res.json({
    success: true,
    data: paginated,
    pagination: { page, pageSize, total, totalPages },
  });
});

router.get('/courses/:id', async (req: Request, res: Response): Promise<void> => {
  const courseId = req.params.id;
  const course = MOCK_EDUCATION_COURSES.find(c => c.id === courseId);

  if (!course) {
    res.status(404).json(fail('课程不存在'));
    return;
  }

  const relatedCourses = MOCK_EDUCATION_COURSES
    .filter(c => c.id !== courseId && (c.major === course.major || c.type === course.type))
    .slice(0, 4);

  res.json(ok({
    course,
    relatedCourses,
  }));
});

router.post('/courses/:id/enroll', async (req: Request, res: Response): Promise<void> => {
  const courseId = req.params.id;
  const course = MOCK_EDUCATION_COURSES.find(c => c.id === courseId);
  const seekerId = (req.body.seekerId as string) || DEFAULT_SEEKER_ID;

  if (!course) {
    res.status(404).json(fail('课程不存在'));
    return;
  }

  const record: CreditBankRecord = {
    id: `credit_new_${Date.now()}`,
    jobSeekerId: seekerId,
    courseId,
    courseTitle: course.title,
    earnedCredits: 0,
    totalCredits: 60,
    progress: 0,
    estimatedCertDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    syncStatus: (course.creditBankEligible ? 'NOT_SYNCED' : 'SYNCING') as any,
  };

  res.json(ok<{ enrollmentId: string; record: CreditBankRecord }>({
    enrollmentId: `ENR_${Date.now()}`,
    record,
  }, `成功报名《${course.title}》`));
});

router.get('/credit-bank', async (req: Request, res: Response): Promise<void> => {
  const seekerId = (req.query.seekerId as string) || DEFAULT_SEEKER_ID;
  const syncStatus = req.query.syncStatus as string;

  let records = generateCreditBankRecords(seekerId, 5);

  if (syncStatus) {
    records = records.filter(r => r.syncStatus === syncStatus);
  }

  const summary = {
    totalCourses: records.length,
    totalCredits: records.reduce((s, r) => s + r.totalCredits, 0),
    earnedCredits: records.reduce((s, r) => s + r.earnedCredits, 0),
    overallProgress: records.length > 0
      ? Math.round(records.reduce((s, r) => s + r.progress, 0) / records.length)
      : 0,
    certifiedCount: records.filter(r => r.syncStatus === '已认证').length,
    inProgressCount: records.filter(r => r.progress > 0 && r.progress < 100).length,
  };

  res.json(ok({ records, summary }));
});

router.post('/credit-bank/:recordId/sync', async (req: Request, res: Response): Promise<void> => {
  const { recordId } = req.params;

  res.json(ok({
    recordId,
    syncStatus: '已同步',
    syncedAt: new Date().toISOString(),
    txId: `TX_${Date.now()}`,
  }, '学分同步成功'));
});

router.get('/categories', async (req: Request, res: Response): Promise<void> => {
  const categories = [
    { type: '自考', name: '自考学历', count: MOCK_EDUCATION_COURSES.filter(c => c.type === '自考').length, avgPrice: 10000 },
    { type: '成考', name: '成人高考', count: MOCK_EDUCATION_COURSES.filter(c => c.type === '成考').length, avgPrice: 9000 },
    { type: '职业资格', name: '职业资格证书', count: MOCK_EDUCATION_COURSES.filter(c => c.type === '职业资格').length, avgPrice: 5500 },
  ];

  const majors = Array.from(new Set(MOCK_EDUCATION_COURSES.map(c => c.major))).map(major => ({
    name: major,
    count: MOCK_EDUCATION_COURSES.filter(c => c.major === major).length,
  }));

  res.json(ok({ categories, majors }));
});

router.get('/recommendations', async (req: Request, res: Response): Promise<void> => {
  const seekerId = (req.query.seekerId as string) || DEFAULT_SEEKER_ID;
  const budget = parseInt(req.query.budget as string) || 15000;
  const targetType = req.query.targetType as string;

  let recommended = [...MOCK_EDUCATION_COURSES]
    .filter(c => c.price <= budget)
    .sort((a, b) => (b.tags.length * 100 + b.price / a.price) - (a.tags.length * 100 + a.price / b.price));

  if (targetType) {
    recommended = recommended.filter(c => c.type === targetType);
  }

  res.json(ok<EducationCourse[]>(recommended.slice(0, 6), '根据您的背景推荐'));
});

export default router;
