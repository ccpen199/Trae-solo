import { Router } from 'express';
import { PrismaClient, AuditStatus, UserRole } from '@prisma/client';
import { authenticate, AuthRequest, requireRole, getCurrentUser } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

router.get('/', async (req, res) => {
  const {
    keyword,
    cityId,
    industryId,
    salaryMin,
    salaryMax,
    educationLevel,
    experienceLevel,
    skillIds,
    isRemote,
    isUrgent,
    distanceKm,
    userLat,
    userLon,
    page = 1,
    pageSize = 20,
  } = req.query;

  const where: any = {
    status: 'ACTIVE',
    auditStatus: AuditStatus.APPROVED,
  };

  if (keyword) {
    where.OR = [
      { title: { contains: String(keyword) } },
      { description: { contains: String(keyword) } },
      { requirements: { contains: String(keyword) } },
      { company: { name: { contains: String(keyword) } } },
    ];
  }

  if (cityId) where.cityId = parseInt(String(cityId));
  if (industryId) where.industryId = parseInt(String(industryId));
  if (salaryMin) where.salaryMax = { gte: parseInt(String(salaryMin)) };
  if (salaryMax) where.salaryMin = { lte: parseInt(String(salaryMax)) };
  if (educationLevel) where.educationLevel = educationLevel;
  if (experienceLevel) where.experienceLevel = experienceLevel;
  if (isRemote === 'true') where.isRemote = true;
  if (isUrgent === 'true') where.isUrgent = true;

  if (skillIds && Array.isArray(skillIds)) {
    where.skills = {
      some: {
        skillId: { in: skillIds.map(Number) },
      },
    };
  }

  const skip = (parseInt(String(page)) - 1) * parseInt(String(pageSize));
  const take = parseInt(String(pageSize));

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, logo: true, city: true } },
        city: true,
        industry: true,
        skills: { include: { skill: true } },
        _count: { select: { matches: true } },
      },
      skip,
      take,
      orderBy: [
        { isUrgent: 'desc' },
        { createdAt: 'desc' },
      ],
    }),
    prisma.job.count({ where }),
  ]);

  let jobsWithDistance = jobs;
  if (distanceKm && userLat && userLon) {
    const maxDistance = parseFloat(String(distanceKm));
    const lat = parseFloat(String(userLat));
    const lon = parseFloat(String(userLon));
    
    jobsWithDistance = jobs
      .map(job => {
        if (job.latitude && job.longitude) {
          const distance = calculateDistance(lat, lon, job.latitude, job.longitude);
          return { ...job, distanceKm: distance };
        }
        return { ...job, distanceKm: null };
      })
      .filter(job => job.distanceKm === null || job.distanceKm <= maxDistance);
  }

  res.json({
    data: jobsWithDistance,
    total,
    page: parseInt(String(page)),
    pageSize: parseInt(String(pageSize)),
    totalPages: Math.ceil(total / parseInt(String(pageSize))),
  });
});

router.get('/:id', async (req, res) => {
  const job = await prisma.job.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      company: { include: { city: true, industry: true } },
      city: true,
      industry: true,
      skills: { include: { skill: true } },
      creator: { select: { id: true, username: true, realName: true } },
      _count: { select: { matches: true, interviews: true } },
    },
  });

  if (!job) {
    return res.status(404).json({ error: '岗位不存在' });
  }

  res.json(job);
});

router.post('/', authenticate, requireRole(UserRole.HR), async (req: AuthRequest, res) => {
  const currentUser = await getCurrentUser(req);
  if (!currentUser?.hrProfile?.companyId) {
    return res.status(400).json({ error: '请先完善企业信息' });
  }

  const {
    title,
    cityId,
    industryId,
    salaryMin,
    salaryMax,
    educationLevel,
    experienceLevel,
    description,
    requirements,
    benefits,
    workAddress,
    latitude,
    longitude,
    jobType,
    recruitCount,
    isRemote,
    isUrgent,
    skillIds,
  } = req.body;

  const job = await prisma.job.create({
    data: {
      title,
      companyId: currentUser.hrProfile.companyId,
      creatorId: currentUser.id,
      cityId: parseInt(cityId),
      industryId: parseInt(industryId),
      salaryMin: parseInt(salaryMin),
      salaryMax: parseInt(salaryMax),
      educationLevel,
      experienceLevel,
      description,
      requirements,
      benefits,
      workAddress,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      jobType,
      recruitCount: parseInt(recruitCount) || 1,
      isRemote: !!isRemote,
      isUrgent: !!isUrgent,
      auditStatus: AuditStatus.PENDING,
    },
  });

  if (skillIds && Array.isArray(skillIds)) {
    for (let i = 0; i < skillIds.length; i++) {
      await prisma.jobSkill.create({
        data: {
          jobId: job.id,
          skillId: parseInt(skillIds[i]),
          isRequired: i < 3,
          priority: i + 1,
        },
      });
    }
  }

  await prisma.auditRecord.create({
    data: {
      targetType: 'JOB',
      targetId: job.id,
      status: AuditStatus.PENDING,
      reason: '新岗位发布，等待审核',
    },
  });

  const jobWithDetails = await prisma.job.findUnique({
    where: { id: job.id },
    include: { company: true, city: true, industry: true, skills: { include: { skill: true } } },
  });

  res.status(201).json(jobWithDetails);
});

router.put('/:id', authenticate, requireRole(UserRole.HR), async (req: AuthRequest, res) => {
  const job = await prisma.job.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { company: true },
  });

  if (!job) {
    return res.status(404).json({ error: '岗位不存在' });
  }

  const currentUser = await getCurrentUser(req);
  if (job.companyId !== currentUser?.hrProfile?.companyId) {
    return res.status(403).json({ error: '无权修改此岗位' });
  }

  const { skillIds, ...updateData } = req.body;

  if (updateData.salaryMin) updateData.salaryMin = parseInt(updateData.salaryMin);
  if (updateData.salaryMax) updateData.salaryMax = parseInt(updateData.salaryMax);
  if (updateData.cityId) updateData.cityId = parseInt(updateData.cityId);
  if (updateData.industryId) updateData.industryId = parseInt(updateData.industryId);
  if (updateData.recruitCount) updateData.recruitCount = parseInt(updateData.recruitCount);
  if (updateData.latitude) updateData.latitude = parseFloat(updateData.latitude);
  if (updateData.longitude) updateData.longitude = parseFloat(updateData.longitude);

  const updatedJob = await prisma.job.update({
    where: { id: parseInt(req.params.id) },
    data: {
      ...updateData,
      auditStatus: AuditStatus.PENDING,
    },
    include: { company: true, city: true, industry: true },
  });

  if (skillIds && Array.isArray(skillIds)) {
    await prisma.jobSkill.deleteMany({ where: { jobId: updatedJob.id } });
    for (let i = 0; i < skillIds.length; i++) {
      await prisma.jobSkill.create({
        data: {
          jobId: updatedJob.id,
          skillId: parseInt(skillIds[i]),
          isRequired: i < 3,
          priority: i + 1,
        },
      });
    }
  }

  res.json(updatedJob);
});

router.post('/:id/match', authenticate, requireRole(UserRole.JOBSEEKER), async (req: AuthRequest, res) => {
  const jobId = parseInt(req.params.id);
  const currentUser = await getCurrentUser(req);
  
  if (!currentUser?.jobseekerProfile) {
    return res.status(400).json({ error: '请先完善求职者档案' });
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { skills: { include: { skill: true } }, company: true, city: true },
  });

  if (!job) {
    return res.status(404).json({ error: '岗位不存在' });
  }

  const existingMatch = await prisma.jobMatch.findFirst({
    where: {
      jobId,
      jobseekerId: currentUser.jobseekerProfile.id,
    },
  });

  if (existingMatch) {
    return res.status(400).json({ error: '您已经投递过这个岗位了' });
  }

  const profile = currentUser.jobseekerProfile;
  const resume = await prisma.resume.findFirst({
    where: { jobseekerId: profile.id, isDefault: true },
    include: { skills: { include: { skill: true } } },
  });

  let matchScore = 0;
  let matchReason = '';
  let skillMatchCount = 0;

  if (job.educationLevel && profile.educationLevel) {
    const eduLevels = ['HIGH_SCHOOL', 'COLLEGE', 'BACHELOR', 'MASTER', 'DOCTOR', 'OTHER'];
    const jobEduIdx = eduLevels.indexOf(job.educationLevel);
    const seekerEduIdx = eduLevels.indexOf(profile.educationLevel);
    if (seekerEduIdx >= jobEduIdx) {
      matchScore += 25;
      matchReason += '学历符合要求；';
    }
  }

  if (job.experienceLevel && profile.experienceLevel) {
    const expLevels = ['FRESHER', 'ONE_TO_THREE', 'THREE_TO_FIVE', 'FIVE_TO_TEN', 'TEN_PLUS'];
    const jobExpIdx = expLevels.indexOf(job.experienceLevel);
    const seekerExpIdx = expLevels.indexOf(profile.experienceLevel);
    if (seekerExpIdx >= jobExpIdx) {
      matchScore += 25;
      matchReason += '经验符合要求；';
    }
  }

  if (resume && job.skills.length > 0) {
    const jobSkillIds = job.skills.map(js => js.skillId);
    const resumeSkillIds = resume.skills.map(rs => rs.skillId);
    skillMatchCount = jobSkillIds.filter(id => resumeSkillIds.includes(id)).length;
    const skillMatchRate = skillMatchCount / job.skills.length;
    matchScore += skillMatchRate * 35;
    matchReason += `技能匹配 ${skillMatchCount}/${job.skills.length}；`;
  }

  if (profile.expectedSalary && job.salaryMax) {
    if (profile.expectedSalary <= job.salaryMax && profile.expectedSalary >= job.salaryMin) {
      matchScore += 15;
      matchReason += '薪资期望匹配；';
    } else if (profile.expectedSalary <= job.salaryMax * 1.2) {
      matchScore += 8;
      matchReason += '薪资期望接近范围；';
    }
  }

  let distanceKm = null;
  if (job.latitude && job.longitude && profile.latitude && profile.longitude) {
    distanceKm = calculateDistance(profile.latitude, profile.longitude, job.latitude, job.longitude);
    if (distanceKm <= 20) {
      matchScore += 10;
      matchReason += `距离仅${distanceKm.toFixed(1)}公里；`;
    } else if (distanceKm <= 50) {
      matchScore += 5;
    }
  }

  const match = await prisma.jobMatch.create({
    data: {
      jobId,
      jobseekerId: profile.id,
      resumeId: resume?.id,
      status: 'PENDING',
      matchScore: Math.round(matchScore),
      matchReason,
      distanceKm,
      skillMatchCount,
    },
    include: {
      job: { include: { company: true, city: true } },
      jobseeker: { include: { user: true } },
      resume: true,
    },
  });

  res.status(201).json(match);
});

router.get('/:id/matches', authenticate, requireRole(UserRole.HR), async (req: AuthRequest, res) => {
  const jobId = parseInt(req.params.id);
  const { status, page = 1, pageSize = 20 } = req.query;

  const where: any = { jobId };
  if (status) where.status = status;

  const [matches, total] = await Promise.all([
    prisma.jobMatch.findMany({
      where,
      include: {
        jobseeker: {
          include: {
            user: { select: { id: true, username: true, realName: true, phone: true, avatar: true } },
            city: true,
            industry: true,
          },
        },
        resume: { include: { skills: { include: { skill: true } } } },
        interviews: true,
      },
      skip: (parseInt(String(page)) - 1) * parseInt(String(pageSize)),
      take: parseInt(String(pageSize)),
      orderBy: [{ matchScore: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.jobMatch.count({ where }),
  ]);

  res.json({
    data: matches,
    total,
    page: parseInt(String(page)),
    pageSize: parseInt(String(pageSize)),
  });
});

export default router;
