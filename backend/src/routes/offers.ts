import { Router } from 'express';
import { PrismaClient, UserRole, MatchStatus } from '@prisma/client';
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

  const [offers, total] = await Promise.all([
    prisma.jobOffer.findMany({
      where,
      include: {
        job: { include: { company: true, city: true } },
        jobseeker: {
          include: { user: { select: { id: true, username: true, realName: true, phone: true, avatar: true } } },
        },
        match: true,
      },
      skip,
      take,
      orderBy: [{ createdAt: 'desc' }],
    }),
    prisma.jobOffer.count({ where }),
  ]);

  res.json({
    data: offers,
    total,
    page: parseInt(String(page)),
    pageSize: parseInt(String(pageSize)),
  });
});

router.post('/', authenticate, requireRole(UserRole.HR), async (req: AuthRequest, res) => {
  const currentUser = await getCurrentUser(req);
  const {
    matchId,
    salary,
    benefits,
    startDate,
    deadline,
    hrRemark,
  } = req.body;

  const match = await prisma.jobMatch.findUnique({
    where: { id: parseInt(matchId) },
    include: { job: true },
  });

  if (!match || match.job.companyId !== currentUser?.hrProfile?.companyId) {
    return res.status(403).json({ error: '无权发送录用通知' });
  }

  const offer = await prisma.jobOffer.create({
    data: {
      matchId: parseInt(matchId),
      jobId: match.jobId,
      jobseekerId: match.jobseekerId,
      salary: parseInt(salary),
      benefits,
      startDate: startDate ? new Date(startDate) : null,
      deadline: new Date(deadline),
      hrRemark,
    },
    include: {
      job: { include: { company: true } },
      jobseeker: { include: { user: true } },
      match: true,
    },
  });

  await prisma.jobMatch.update({
    where: { id: parseInt(matchId) },
    data: { status: MatchStatus.OFFER_SENT },
  });

  res.status(201).json(offer);
});

router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  const offer = await prisma.jobOffer.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      job: { include: { company: { include: { city: true } }, city: true } },
      jobseeker: {
        include: {
          user: { select: { id: true, username: true, realName: true, phone: true, email: true, avatar: true } },
          city: true,
        },
      },
      match: { include: { resume: true } },
    },
  });

  if (!offer) {
    return res.status(404).json({ error: '录用通知不存在' });
  }

  res.json(offer);
});

router.put('/:id/accept', authenticate, requireRole(UserRole.JOBSEEKER), async (req: AuthRequest, res) => {
  const offerId = parseInt(req.params.id);
  const currentUser = await getCurrentUser(req);

  const offer = await prisma.jobOffer.findUnique({
    where: { id: offerId },
  });

  if (!offer || offer.jobseekerId !== currentUser?.jobseekerProfile?.id) {
    return res.status(403).json({ error: '无权操作此录用通知' });
  }

  if (offer.status !== 'PENDING') {
    return res.status(400).json({ error: '此录用通知已处理' });
  }

  const updatedOffer = await prisma.jobOffer.update({
    where: { id: offerId },
    data: {
      status: 'ACCEPTED',
      candidateRemark: req.body.remark,
      acceptedAt: new Date(),
    },
    include: {
      job: { include: { company: true } },
      jobseeker: { include: { user: true } },
    },
  });

  await prisma.jobMatch.update({
    where: { id: offer.matchId },
    data: { status: MatchStatus.HIRED },
  });

  res.json(updatedOffer);
});

router.put('/:id/reject', authenticate, requireRole(UserRole.JOBSEEKER), async (req: AuthRequest, res) => {
  const offerId = parseInt(req.params.id);
  const currentUser = await getCurrentUser(req);

  const offer = await prisma.jobOffer.findUnique({
    where: { id: offerId },
  });

  if (!offer || offer.jobseekerId !== currentUser?.jobseekerProfile?.id) {
    return res.status(403).json({ error: '无权操作此录用通知' });
  }

  if (offer.status !== 'PENDING') {
    return res.status(400).json({ error: '此录用通知已处理' });
  }

  const updatedOffer = await prisma.jobOffer.update({
    where: { id: offerId },
    data: {
      status: 'REJECTED',
      candidateRemark: req.body.remark,
      rejectedAt: new Date(),
    },
    include: {
      job: { include: { company: true } },
      jobseeker: { include: { user: true } },
    },
  });

  await prisma.jobMatch.update({
    where: { id: offer.matchId },
    data: { status: MatchStatus.REJECTED },
  });

  res.json(updatedOffer);
});

export default router;
