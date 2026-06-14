import { Router } from 'express';
import { PrismaClient, InterviewStatus, UserRole, MatchStatus } from '@prisma/client';
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

  const [interviews, total] = await Promise.all([
    prisma.interview.findMany({
      where,
      include: {
        job: { include: { company: true, city: true } },
        jobseeker: {
          include: { user: { select: { id: true, username: true, realName: true, phone: true, avatar: true } } },
        },
        interviewer: { select: { id: true, username: true, realName: true } },
        match: true,
      },
      skip,
      take,
      orderBy: [{ scheduledAt: 'asc' }],
    }),
    prisma.interview.count({ where }),
  ]);

  res.json({
    data: interviews,
    total,
    page: parseInt(String(page)),
    pageSize: parseInt(String(pageSize)),
  });
});

router.post('/', authenticate, requireRole(UserRole.HR), async (req: AuthRequest, res) => {
  const currentUser = await getCurrentUser(req);
  const {
    matchId,
    scheduledAt,
    durationMinutes,
    interviewType,
    location,
    meetingLink,
    hrNotes,
  } = req.body;

  const match = await prisma.jobMatch.findUnique({
    where: { id: parseInt(matchId) },
    include: { job: true },
  });

  if (!match || match.job.companyId !== currentUser?.hrProfile?.companyId) {
    return res.status(403).json({ error: '无权安排面试' });
  }

  const interview = await prisma.interview.create({
    data: {
      matchId: parseInt(matchId),
      jobId: match.jobId,
      jobseekerId: match.jobseekerId,
      interviewerId: currentUser.id,
      scheduledAt: new Date(scheduledAt),
      durationMinutes: parseInt(durationMinutes) || 60,
      interviewType,
      location,
      meetingLink,
      hrNotes,
    },
    include: {
      job: { include: { company: true } },
      jobseeker: { include: { user: true } },
      interviewer: { select: { id: true, realName: true } },
    },
  });

  await prisma.jobMatch.update({
    where: { id: parseInt(matchId) },
    data: { status: MatchStatus.INTERVIEW_SCHEDULED },
  });

  res.status(201).json(interview);
});

router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  const interview = await prisma.interview.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      job: { include: { company: true, city: true } },
      jobseeker: {
        include: {
          user: { select: { id: true, username: true, realName: true, phone: true, email: true, avatar: true } },
          city: true,
        },
      },
      interviewer: { select: { id: true, username: true, realName: true, phone: true } },
      match: { include: { resume: { include: { skills: { include: { skill: true } } } } },
    },
  });

  if (!interview) {
    return res.status(404).json({ error: '面试记录不存在' });
  }

  res.json(interview);
});

router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  const interviewId = parseInt(req.params.id);
  const currentUser = await getCurrentUser(req);

  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { job: true },
  });

  if (!interview) {
    return res.status(404).json({ error: '面试记录不存在' });
  }

  if (currentUser?.role === UserRole.HR) {
    if (interview.job.companyId !== currentUser.hrProfile?.companyId) {
      return res.status(403).json({ error: '无权修改此面试' });
    }
  } else if (currentUser?.role === UserRole.JOBSEEKER) {
    if (interview.jobseekerId !== currentUser.jobseekerProfile?.id) {
      return res.status(403).json({ error: '无权修改此面试' });
    }
  }

  const updateData: any = {};
  if (req.body.scheduledAt) updateData.scheduledAt = new Date(req.body.scheduledAt);
  if (req.body.durationMinutes) updateData.durationMinutes = parseInt(req.body.durationMinutes);
  if (req.body.interviewType) updateData.interviewType = req.body.interviewType;
  if (req.body.location) updateData.location = req.body.location;
  if (req.body.meetingLink) updateData.meetingLink = req.body.meetingLink;
  if (req.body.hrNotes && currentUser?.role === UserRole.HR) updateData.hrNotes = req.body.hrNotes;
  if (req.body.candidateNotes && currentUser?.role === UserRole.JOBSEEKER) updateData.candidateNotes = req.body.candidateNotes;

  const updatedInterview = await prisma.interview.update({
    where: { id: interviewId },
    data: updateData,
    include: {
      job: { include: { company: true } },
      jobseeker: { include: { user: true } },
      interviewer: { select: { id: true, realName: true } },
    },
  });

  res.json(updatedInterview);
});

router.put('/:id/status', authenticate, async (req: AuthRequest, res) => {
  const interviewId = parseInt(req.params.id);
  const { status } = req.body;

  if (!Object.values(InterviewStatus).includes(status)) {
    return res.status(400).json({ error: '无效的面试状态' });
  }

  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
  });

  if (!interview) {
    return res.status(404).json({ error: '面试记录不存在' });
  }

  const updatedInterview = await prisma.interview.update({
    where: { id: interviewId },
    data: { status },
    include: {
      job: { include: { company: true } },
      jobseeker: { include: { user: true } },
    },
  });

  res.json(updatedInterview);
});

router.post('/:id/feedback', authenticate, requireRole(UserRole.HR), async (req: AuthRequest, res) => {
  const interviewId = parseInt(req.params.id);
  const { feedback, rating, result } = req.body;

  const currentUser = await getCurrentUser(req);
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { job: true },
  });

  if (!interview || interview.job.companyId !== currentUser?.hrProfile?.companyId) {
    return res.status(403).json({ error: '无权提交面试反馈' });
  }

  const updatedInterview = await prisma.interview.update({
    where: { id: interviewId },
    data: {
      feedback,
      rating: rating ? parseInt(rating) : null,
      result,
      status: InterviewStatus.COMPLETED,
    },
    include: {
      job: { include: { company: true } },
      jobseeker: { include: { user: true } },
    },
  });

  if (result === 'PASS') {
    await prisma.jobMatch.update({
      where: { id: interview.matchId },
      data: { status: MatchStatus.OFFER_SENT },
    });
  } else if (result === 'FAIL') {
    await prisma.jobMatch.update({
      where: { id: interview.matchId },
      data: { status: MatchStatus.REJECTED },
    });
  }

  res.json(updatedInterview);
});

export default router;
