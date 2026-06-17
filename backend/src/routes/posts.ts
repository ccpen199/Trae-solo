import express from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { auth, AuthRequest, requireRole } from '../middleware/auth';
import { getBoundingBox, calculateDistance, calculateHotScore, aiContentScreen, getSourceLevelPriority } from '../utils/lbs';
import { parseJson, toJson } from '../utils/json';

const router = express.Router();

const parsePostImages = (p: any) => ({
  ...p,
  images: parseJson<string[]>(p.images, []),
  auditLogs: p.auditLogs?.map((a: any) => ({
    ...a,
    matchedKeywords: parseJson<string[]>(a.matchedKeywords, []),
  })),
});

router.post(
  '/',
  auth,
  [body('title').isLength({ min: 1 }), body('content').isLength({ min: 1 }), body('type').exists()],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { topics, images, ...rawData } = req.body;
      const postData: any = { ...rawData };
      if (postData.priceAnchor === '' || postData.priceAnchor === undefined) postData.priceAnchor = null;
      if (postData.sourceOrg === '' || postData.sourceOrg === undefined) postData.sourceOrg = null;
      const unknownFields = ['pushScope', 'officialDoc', 'proofImage', 'riskLevel', 'urgency', 'expireHours', 'radiusMeters', 'enableResponseChain', 'enableSubscription'];
      unknownFields.forEach(f => delete postData[f]);
      const user = req.user;

      let sourceLevel = user.role === 'ADMIN' || user.role === 'GOVERNMENT' ? 'OFFICIAL' : 'ORDINARY';
      if (user.isVerified && sourceLevel === 'ORDINARY') sourceLevel = 'V';
      if (user.role === 'GOVERNMENT') sourceLevel = 'GOV';

      const screen = aiContentScreen(postData.content, postData.title);
      const status = screen.level === 'CRITICAL' || screen.level === 'HIGH' ? 'PENDING' :
                     screen.level === 'MEDIUM' ? 'PENDING' : 'APPROVED';

      const post = await prisma.post.create({
        data: {
          ...postData,
          images: toJson(images),
          userId: req.userId!,
          sourceLevel,
          status,
          expireAt: postData.type === 'NOTICE' || postData.type === 'EMERGENCY'
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            : undefined,
          topics: topics
            ? {
                create: topics.map((topicName: string) => ({
                  topic: {
                    connectOrCreate: {
                      where: { name: topicName },
                      create: { name: topicName },
                    },
                  },
                })),
              }
            : undefined,
        },
        include: { topics: { include: { topic: true } }, user: true },
      });

      await prisma.auditLog.create({
        data: {
          postId: post.id,
          auditorId: req.userId!,
          action: screen.level === 'LOW' ? 'AI_PASS' : 'AI_FLAG',
          riskLevel: screen.level,
          aiScore: screen.score,
          matchedKeywords: toJson(screen.keywords),
        },
      });

      res.json({ post: parsePostImages(post) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get(
  '/feed',
  [query('latitude').optional().isFloat(), query('longitude').optional().isFloat()],
  async (req, res) => {
    try {
      const latitude = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
      const longitude = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined;
      const type = req.query.type as string | undefined;
      const topic = req.query.topic as string | undefined;
      const keyword = (req.query.keyword as string | undefined)?.trim();
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      let where: any = { status: 'APPROVED' };
      if (type) where.type = type;

      if (latitude && longitude) {
        const bbox = getBoundingBox(latitude, longitude, 10000);
        where.latitude = { gte: bbox.minLat, lte: bbox.maxLat };
        where.longitude = { gte: bbox.minLon, lte: bbox.maxLon };
      }

      if (topic) {
        where.topics = { some: { topic: { name: topic } } };
      }

      if (keyword) {
        where.OR = [
          { title: { contains: keyword } },
          { content: { contains: keyword } },
          { sourceOrg: { contains: keyword } },
          { locationName: { contains: keyword } },
          {
            topics: {
              some: {
                topic: {
                  OR: [
                    { name: { contains: keyword } },
                    { description: { contains: keyword } },
                  ],
                },
              },
            },
          },
        ];
      }

      const posts = await prisma.post.findMany({
        where,
        include: {
          user: { select: { id: true, nickname: true, avatar: true, isVerified: true } },
          topics: { include: { topic: true } },
          merchant: { select: { id: true, businessName: true, logo: true } },
          likes: { select: { userId: true } },
          auditLogs: {
            orderBy: { createdAt: 'desc' },
            take: 2,
            include: {
              auditor: { select: { id: true, nickname: true, avatar: true, role: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit * 3,
      });

      const enhancedPosts = posts.map(p => {
        const hotScore = calculateHotScore(p.likeCount, p.commentCount, p.shareCount, p.viewCount, p.createdAt);
        let distance: number | null = null;
        if (latitude && longitude && p.latitude && p.longitude) {
          distance = calculateDistance(latitude, longitude, p.latitude, p.longitude);
        }
        return { ...parsePostImages(p), hotScore, distance, isLiked: false };
      }).sort((a, b) => {
        const priorityA = getSourceLevelPriority(a.sourceLevel);
        const priorityB = getSourceLevelPriority(b.sourceLevel);
        if (priorityA !== priorityB) return priorityB - priorityA;
        return (b.hotScore || 0) - (a.hotScore || 0);
      }).slice(0, limit);

      const hasMore = posts.length >= limit * 3 || (posts.length > limit);
      res.json({ posts: enhancedPosts, page, hasMore });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        topics: { include: { topic: true } },
        merchant: true,
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          include: {
            auditor: { select: { id: true, nickname: true, avatar: true, role: true } },
          },
        },
        comments: {
          where: { parentId: null, status: 'NORMAL' },
          include: {
            user: { select: { id: true, nickname: true, avatar: true } },
            children: {
              where: { status: 'NORMAL' },
              include: { user: { select: { id: true, nickname: true, avatar: true } } },
            },
          },
          orderBy: [{ isTop: 'desc' }, { createdAt: 'desc' }],
        },
      },
    });

    if (!post) return res.status(404).json({ error: '帖子不存在' });

    await prisma.post.update({
      where: { id: req.params.id },
      data: { viewCount: { increment: 1 } },
    });

    const isLiked = req.userId ? !!await prisma.like.findFirst({
      where: { userId: req.userId, postId: req.params.id },
    }) : false;

    res.json({ post: { ...parsePostImages(post), isLiked: !!isLiked } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/like', auth, async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.like.findFirst({
      where: { userId: req.userId, postId: req.params.id },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      await prisma.post.update({ where: { id: req.params.id }, data: { likeCount: { decrement: 1 } } });
      return res.json({ liked: false });
    }

    await prisma.like.create({ data: { userId: req.userId!, postId: req.params.id } });
    await prisma.post.update({ where: { id: req.params.id }, data: { likeCount: { increment: 1 } } });
    res.json({ liked: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  '/:id/comments',
  auth,
  [body('content').isLength({ min: 1 })],
  async (req: AuthRequest, res) => {
    try {
      const comment = await prisma.comment.create({
        data: {
          postId: req.params.id,
          userId: req.userId!,
          content: req.body.content,
          parentId: req.body.parentId || undefined,
        },
        include: { user: { select: { id: true, nickname: true, avatar: true } } },
      });

      await prisma.post.update({
        where: { id: req.params.id },
        data: { commentCount: { increment: 1 } },
      });

      if (req.body.parentId) {
        await prisma.comment.update({
          where: { id: req.body.parentId },
          data: { likeCount: { increment: 0 } },
        });
      }

      res.json({ comment });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.delete('/:id', auth, async (req: AuthRequest, res) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: '帖子不存在' });
    if (post.userId !== req.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: '无权删除' });
    }

    await prisma.post.update({ where: { id: req.params.id }, data: { status: 'REMOVED' } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
