import { Router } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
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
    educationLevel,
    experienceLevel,
    skillIds,
    isLookingForJob,
    distanceKm,
    jobLat,
    jobLon,
    page = 1,
    pageSize = 20,
  } = req.query;

  const where: any = {};

  if (isLookingForJob !== undefined) {
    where.isLookingForJob = isLookingForJob === 'true';
  } else {
    where.isLookingForJob = true;
  }

  if (keyword) {
    where.OR = [
      { selfIntroduction: { contains: String(keyword) } },
      { jobIntention: { contains: String(keyword) } },
      { user: { realName: { contains: String(keyword) } } },
    ];
  }

  if (cityId) where.cityId = parseInt(String(cityId));
  if (industryId) where.industryId = parseInt(String(industryId));
  if (salaryMin) where.expectedSalary = { gte: parseInt(String(salaryMin)) };
  if (educationLevel) where.educationLevel = educationLevel;
  if (experienceLevel) where.experienceLevel = experienceLevel;

  if (skillIds && Array.isArray(skillIds)) {
    where.resumes = {
      some: {
        skills: {
          some: {
            skillId: { in: skillIds.map(Number) },
          },
        },
      },
    };
  }

  const skip = (parseInt(String(page)) - 1) * parseInt(String(pageSize));
  const take = parseInt(String(pageSize));

  const [jobseekers, total] = await Promise.all([
    prisma.jobseekerProfile.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, realName: true, avatar: true, isVerified: true } },
        city: true,
        industry: true,
        resumes: {
          where: { isDefault: true },
          include: { skills: { include: { skill: true } } },
        },
        _count: { select: { matches: true } },
      },
      skip,
      take,
      orderBy: [{ updatedAt: 'desc' }],
    }),
    prisma.jobseekerProfile.count({ where }),
  ]);

  let jobseekersWithDistance = jobseekers;
  if (distanceKm && jobLat && jobLon) {
    const maxDistance = parseFloat(String(distanceKm));
    const lat = parseFloat(String(jobLat));
    const lon = parseFloat(String(jobLon));
    
    jobseekersWithDistance = jobseekers
      .map(js => {
        if (js.latitude && js.longitude) {
          const distance = calculateDistance(lat, lon, js.latitude, js.longitude);
          return { ...js, distanceKm: distance };
        }
        return { ...js, distanceKm: null };
      })
      .filter(js => js.distanceKm === null || js.distanceKm <= maxDistance);
  }

  res.json({
    data: jobseekersWithDistance,
    total,
    page: parseInt(String(page)),
    pageSize: parseInt(String(pageSize)),
    totalPages: Math.ceil(total / parseInt(String(pageSize))),
  });
});

router.get('/profile', authenticate, requireRole(UserRole.JOBSEEKER), async (req: AuthRequest, res) => {
  const currentUser = await getCurrentUser(req);
  
  if (!currentUser?.jobseekerProfile) {
    return res.status(404).json({ error: '求职者档案不存在' });
  }

  const profile = await prisma.jobseekerProfile.findUnique({
    where: { id: currentUser.jobseekerProfile.id },
    include: {
      user: { select: { id: true, username: true, email: true, phone: true, realName: true, avatar: true, isVerified: true } },
      city: true,
      industry: true,
      resumes: { include: { skills: { include: { skill: true } } } },
      matches: {
        include: {
          job: { include: { company: true, city: true } },
          interviews: true,
          offers: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  res.json(profile);
});

router.get('/:id', async (req, res) => {
  const profile = await prisma.jobseekerProfile.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      user: { select: { id: true, username: true, realName: true, avatar: true, isVerified: true } },
      city: true,
      industry: true,
      resumes: {
        where: { isDefault: true },
        include: { skills: { include: { skill: true } } },
      },
    },
  });

  if (!profile) {
    return res.status(404).json({ error: '求职者不存在' });
  }

  res.json(profile);
});

router.put('/profile', authenticate, requireRole(UserRole.JOBSEEKER), async (req: AuthRequest, res) => {
  const currentUser = await getCurrentUser(req);
  
  if (!currentUser?.jobseekerProfile) {
    return res.status(404).json({ error: '求职者档案不存在' });
  }

  const updateData: any = { ...req.body };
  
  if (updateData.cityId) updateData.cityId = parseInt(updateData.cityId);
  if (updateData.industryId) updateData.industryId = parseInt(updateData.industryId);
  if (updateData.expectedSalary) updateData.expectedSalary = parseInt(updateData.expectedSalary);
  if (updateData.currentSalary) updateData.currentSalary = parseInt(updateData.currentSalary);
  if (updateData.workYears) updateData.workYears = parseFloat(updateData.workYears);
  if (updateData.latitude) updateData.latitude = parseFloat(updateData.latitude);
  if (updateData.longitude) updateData.longitude = parseFloat(updateData.longitude);
  if (updateData.birthDate) updateData.birthDate = new Date(updateData.birthDate);

  const profile = await prisma.jobseekerProfile.update({
    where: { id: currentUser.jobseekerProfile.id },
    data: updateData,
    include: {
      user: { select: { id: true, username: true, realName: true } },
      city: true,
      industry: true,
    },
  });

  res.json(profile);
});

router.post('/resumes', authenticate, requireRole(UserRole.JOBSEEKER), async (req: AuthRequest, res) => {
  const currentUser = await getCurrentUser(req);
  
  if (!currentUser?.jobseekerProfile) {
    return res.status(400).json({ error: '请先完善求职者档案' });
  }

  const { title, content, education, workExperience, projectExperience, skillIds, isDefault, ocrData } = req.body;

  if (isDefault) {
    await prisma.resume.updateMany({
      where: { jobseekerId: currentUser.jobseekerProfile.id },
      data: { isDefault: false },
    });
  }

  const resume = await prisma.resume.create({
    data: {
      jobseekerId: currentUser.jobseekerProfile.id,
      title,
      content,
      education,
      workExperience,
      projectExperience,
      isDefault: !!isDefault,
      ocrData,
      isOcrCompleted: !!ocrData,
    },
  });

  if (skillIds && Array.isArray(skillIds)) {
    for (const skillId of skillIds) {
      await prisma.resumeSkill.create({
        data: {
          resumeId: resume.id,
          skillId: parseInt(skillId),
        },
      });
    }
  }

  const resumeWithSkills = await prisma.resume.findUnique({
    where: { id: resume.id },
    include: { skills: { include: { skill: true } } },
  });

  res.status(201).json(resumeWithSkills);
});

router.get('/resumes/:id', authenticate, async (req: AuthRequest, res) => {
  const resume = await prisma.resume.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      jobseeker: { include: { user: true } },
      skills: { include: { skill: true } },
    },
  });

  if (!resume) {
    return res.status(404).json({ error: '简历不存在' });
  }

  res.json(resume);
});

router.put('/resumes/:id', authenticate, requireRole(UserRole.JOBSEEKER), async (req: AuthRequest, res) => {
  const resumeId = parseInt(req.params.id);
  const currentUser = await getCurrentUser(req);
  
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
  });

  if (!resume || resume.jobseekerId !== currentUser?.jobseekerProfile?.id) {
    return res.status(403).json({ error: '无权修改此简历' });
  }

  const { skillIds, isDefault, ...updateData } = req.body;

  if (isDefault) {
    await prisma.resume.updateMany({
      where: { jobseekerId: currentUser!.jobseekerProfile!.id, id: { not: resumeId } },
      data: { isDefault: false },
    });
    updateData.isDefault = true;
  }

  const updatedResume = await prisma.resume.update({
    where: { id: resumeId },
    data: updateData,
  });

  if (skillIds && Array.isArray(skillIds)) {
    await prisma.resumeSkill.deleteMany({ where: { resumeId } });
    for (const skillId of skillIds) {
      await prisma.resumeSkill.create({
        data: {
          resumeId,
          skillId: parseInt(skillId),
        },
      });
    }
  }

  const resumeWithSkills = await prisma.resume.findUnique({
    where: { id: resumeId },
    include: { skills: { include: { skill: true } } },
  });

  res.json(resumeWithSkills);
});

router.post('/resumes/ocr-parse', authenticate, requireRole(UserRole.JOBSEEKER), async (req: AuthRequest, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: '请提供简历文本' });
  }

  const parsedData: any = {
    name: null,
    phone: null,
    email: null,
    education: [],
    workExperience: [],
    skills: [],
  };

  const phoneMatch = text.match(/1[3-9]\d{9}/);
  if (phoneMatch) parsedData.phone = phoneMatch[0];

  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) parsedData.email = emailMatch[0];

  const skillKeywords = ['JavaScript', 'TypeScript', 'React', 'Vue', 'Java', 'Python', 'MySQL', 'Redis', 'Docker', 'Git'];
  parsedData.skills = skillKeywords.filter(skill => text.includes(skill));

  res.json({
    success: true,
    parsedData,
    message: '简历OCR解析完成，请核对并完善信息',
  });
});

export default router;
