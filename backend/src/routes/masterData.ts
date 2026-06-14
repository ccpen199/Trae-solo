import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/cities', async (req, res) => {
  const cities = await prisma.city.findMany({
    orderBy: { name: 'asc' },
  });
  res.json(cities);
});

router.get('/cities/:id', async (req, res) => {
  const city = await prisma.city.findUnique({
    where: { id: parseInt(req.params.id) },
  });
  if (!city) {
    return res.status(404).json({ error: '城市不存在' });
  }
  res.json(city);
});

router.get('/industries', async (req, res) => {
  const industries = await prisma.industry.findMany({
    orderBy: { name: 'asc' },
  });
  res.json(industries);
});

router.get('/industries/:id', async (req, res) => {
  const industry = await prisma.industry.findUnique({
    where: { id: parseInt(req.params.id) },
  });
  if (!industry) {
    return res.status(404).json({ error: '行业不存在' });
  }
  res.json(industry);
});

router.get('/skills', async (req, res) => {
  const { search } = req.query;
  const where = search ? {
    name: { contains: String(search) }
  } : {};
  
  const skills = await prisma.skill.findMany({
    where,
    orderBy: { name: 'asc' },
    take: 100,
  });
  res.json(skills);
});

router.get('/skills/:id', async (req, res) => {
  const skill = await prisma.skill.findUnique({
    where: { id: parseInt(req.params.id) },
  });
  if (!skill) {
    return res.status(404).json({ error: '技能不存在' });
  }
  res.json(skill);
});

router.get('/education-levels', (req, res) => {
  res.json([
    { value: 'HIGH_SCHOOL', label: '高中及以下' },
    { value: 'COLLEGE', label: '大专' },
    { value: 'BACHELOR', label: '本科' },
    { value: 'MASTER', label: '硕士' },
    { value: 'DOCTOR', label: '博士' },
    { value: 'OTHER', label: '其他' },
  ]);
});

router.get('/experience-levels', (req, res) => {
  res.json([
    { value: 'FRESHER', label: '应届生', years: [0, 1] },
    { value: 'ONE_TO_THREE', label: '1-3年', years: [1, 3] },
    { value: 'THREE_TO_FIVE', label: '3-5年', years: [3, 5] },
    { value: 'FIVE_TO_TEN', label: '5-10年', years: [5, 10] },
    { value: 'TEN_PLUS', label: '10年以上', years: [10, 100] },
  ]);
});

router.get('/match-statuses', (req, res) => {
  res.json([
    { value: 'PENDING', label: '待处理' },
    { value: 'MATCHED', label: '已匹配' },
    { value: 'INTERESTED', label: '感兴趣' },
    { value: 'NOT_INTERESTED', label: '不感兴趣' },
    { value: 'INTERVIEW_SCHEDULED', label: '已安排面试' },
    { value: 'OFFER_SENT', label: '已发Offer' },
    { value: 'HIRED', label: '已录用' },
    { value: 'REJECTED', label: '已拒绝' },
  ]);
});

router.get('/heatmap', async (req, res) => {
  const { type = 'jobs', period = 'current' } = req.query;

  const cityData = await prisma.city.findMany({
    include: {
      _count: {
        select: { jobs: true, jobseekers: true },
      },
    },
  });

  const heatmap = cityData.map(city => ({
    cityId: city.id,
    cityName: city.name,
    latitude: city.latitude,
    longitude: city.longitude,
    jobCount: city._count.jobs,
    jobseekerCount: city._count.jobseekers,
    value: type === 'jobs' ? city._count.jobs : city._count.jobseekers,
  }));

  res.json(heatmap);
});

router.get('/statistics/overview', async (req, res) => {
  const [totalJobs, totalJobseekers, totalCompanies, totalMatches] = await Promise.all([
    prisma.job.count({ where: { status: 'ACTIVE', auditStatus: 'APPROVED' } }),
    prisma.jobseekerProfile.count({ where: { isLookingForJob: true } }),
    prisma.company.count({ where: { auditStatus: 'APPROVED' } }),
    prisma.jobMatch.count(),
  ]);

  res.json({
    totalJobs,
    totalJobseekers,
    totalCompanies,
    totalMatches,
    updatedAt: new Date().toISOString(),
  });
});

export default router;
