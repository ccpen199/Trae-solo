import { Router } from 'express';
import { PrismaClient, MatchStatus, UserRole } from '@prisma/client';
import { authenticate, AuthRequest, requireRole, getCurrentUser } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  const currentUser = await getCurrentUser(req);
  const { status, page = 1, pageSize = 20 } = req.query;

  let where: any = {};
  
  if (status) where.status = status;

  if (currentUser?.role === UserRole.JOBSEEKER && currentUser.jobseekerProfile) {
    where.jobseekerId = currentUser.jobseekerProfile.id;
  } else if (currentUser?.role === UserRole.HR && currentUser.hrProfile?.companyId) {
    where.job = { companyId: currentUser.hrProfile.companyId };
  }

  const skip = (parseInt(String(page)) - 1) * parseInt(String(pageSize));
  const take = parseInt(String(pageSize));

  const [matches, total] = await Promise.all([
    prisma.jobMatch.findMany({
      where,
      include: {
        job: { include: { company: true, city: true, skills: { include: { skill: true } } } },
        jobseeker: {
          include: {
            user: { select: { id: true, username: true, realName: true, phone: true, avatar: true } },
            city: true,
          },
        },
        resume: { include: { skills: { include: { skill: true } } } },
        interviews: true,
        offers: true,
      },
      skip,
      take,
      orderBy: [{ createdAt: 'desc' }],
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

router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  const match = await prisma.jobMatch.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      job: { include: { company: true, city: true, skills: { include: { skill: true } } } },
      jobseeker: {
        include: {
          user: { select: { id: true, username: true, realName: true, phone: true, email: true, avatar: true } },
          city: true,
          industry: true,
          resumes: { where: { isDefault: true }, include: { skills: { include: { skill: true } } } },
        },
      },
      resume: { include: { skills: { include: { skill: true } } } },
      interviews: { include: { interviewer: { select: { id: true, realName: true } } } },
      offers: true,
    },
  });

  if (!match) {
    return res.status(404).json({ error: '匹配记录不存在' });
  }

  res.json(match);
});

router.put('/:id/status', authenticate, async (req: AuthRequest, res) => {
  const matchId = parseInt(req.params.id);
  const { status, remark } = req.body;

  const currentUser = await getCurrentUser(req);
  const match = await prisma.jobMatch.findUnique({
    where: { id: matchId },
    include: { job: true },
  });

  if (!match) {
    return res.status(404).json({ error: '匹配记录不存在' });
  }

  if (!Object.values(MatchStatus).includes(status)) {
    return res.status(400).json({ error: '无效的状态值' });
  }

  const updateData: any = { status };

  if (currentUser?.role === UserRole.JOBSEEKER) {
    if (match.jobseekerId !== currentUser.jobseekerProfile?.id) {
      return res.status(403).json({ error: '无权修改此匹配记录' });
    }
    updateData.jobseekerRemark = remark;
  } else if (currentUser?.role === UserRole.HR) {
    if (currentUser.hrProfile?.companyId !== match.job.companyId) {
      return res.status(403).json({ error: '无权修改此匹配记录' });
    }
    updateData.hrRemark = remark;
  }

  const updatedMatch = await prisma.jobMatch.update({
    where: { id: matchId },
    data: updateData,
    include: {
      job: { include: { company: true } },
      jobseeker: { include: { user: true } },
    },
  });

  res.json(updatedMatch);
});

router.post('/:id/interested', authenticate, requireRole(UserRole.HR), async (req: AuthRequest, res) => {
  const matchId = parseInt(req.params.id);
  const currentUser = await getCurrentUser(req);

  const match = await prisma.jobMatch.findUnique({
    where: { id: matchId },
    include: { job: true },
  });

  if (!match || match.job.companyId !== currentUser?.hrProfile?.companyId) {
    return res.status(403).json({ error: '无权操作此匹配记录' });
  }

  const updatedMatch = await prisma.jobMatch.update({
    where: { id: matchId },
    data: {
      status: MatchStatus.INTERESTED,
      hrRemark: req.body.remark,
    },
    include: {
      job: { include: { company: true } },
      jobseeker: { include: { user: true } },
    },
  });

  res.json(updatedMatch);
});

router.post('/ai-match', authenticate, requireRole(UserRole.JOBSEEKER), async (req: AuthRequest, res) => {
  const currentUser = await getCurrentUser(req);
  if (!currentUser?.jobseekerProfile) {
    return res.status(400).json({ error: '请先完善求职者档案' });
  }

  const profile = currentUser.jobseekerProfile;
  const resume = await prisma.resume.findFirst({
    where: { jobseekerId: profile.id, isDefault: true },
    include: { skills: { include: { skill: true } } },
  });

  if (!resume) {
    return res.status(400).json({ error: '请先创建简历' });
  }

  const jobs = await prisma.job.findMany({
    where: {
      status: 'ACTIVE',
      auditStatus: 'APPROVED',
      ...(profile.cityId ? { cityId: profile.cityId } : {}),
      ...(profile.industryId ? { industryId: profile.industryId } : {}),
    },
    include: {
      company: true,
      city: true,
      skills: { include: { skill: true } },
    },
    take: 50,
  });

  const matchedJobs = jobs.map(job => {
    let score = 0;
    let reasons: string[] = [];

    if (job.educationLevel && profile.educationLevel) {
      const eduLevels = ['HIGH_SCHOOL', 'COLLEGE', 'BACHELOR', 'MASTER', 'DOCTOR', 'OTHER'];
      if (eduLevels.indexOf(profile.educationLevel) >= eduLevels.indexOf(job.educationLevel)) {
        score += 25;
        reasons.push('学历符合');
      }
    }

    if (job.experienceLevel && profile.experienceLevel) {
      const expLevels = ['FRESHER', 'ONE_TO_THREE', 'THREE_TO_FIVE', 'FIVE_TO_TEN', 'TEN_PLUS'];
      if (expLevels.indexOf(profile.experienceLevel) >= expLevels.indexOf(job.experienceLevel)) {
        score += 20;
        reasons.push('经验匹配');
      }
    }

    const resumeSkillIds = resume.skills.map(s => s.skillId);
    const jobSkillIds = job.skills.map(s => s.skillId);
    const matchedSkills = jobSkillIds.filter(id => resumeSkillIds.includes(id));
    if (job.skills.length > 0) {
      const skillRate = matchedSkills.length / job.skills.length;
      score += skillRate * 35;
      reasons.push(`技能匹配 ${matchedSkills.length}/${job.skills.length}`);
    }

    if (profile.expectedSalary && job.salaryMax && profile.expectedSalary <= job.salaryMax) {
      score += 20;
      reasons.push('薪资匹配');
    }

    return {
      job,
      matchScore: Math.round(score),
      matchReason: reasons.join('；'),
      skillMatchCount: matchedSkills.length,
    };
  }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);

  res.json({
    total: matchedJobs.length,
    recommendations: matchedJobs,
    message: `为您智能匹配到 ${matchedJobs.length} 个优质岗位`,
  });
});

export default router;
