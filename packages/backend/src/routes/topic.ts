import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { recordSensitiveWordHit } from '../services/risk-engine.js';
import { getRecommendedTopics } from '../services/cross-community.js';

const router = Router();

const SENSITIVE_WORDS = ['赌博', '色情', '毒品', '枪支', '诈骗'];

function checkSensitiveWords(content: string): { hasSensitive: boolean; matchedWords: string[]; score: number } {
  const matchedWords: string[] = [];
  for (const word of SENSITIVE_WORDS) {
    if (content.includes(word)) {
      matchedWords.push(word);
    }
  }
  return {
    hasSensitive: matchedWords.length > 0,
    matchedWords,
    score: matchedWords.length * 30,
  };
}

const createTopicSchema = z.object({
  category: z.enum(['life', 'help', 'activity', 'notice', 'secondhand', 'complaint', 'chat', 'other']),
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(10000),
  images: z.array(z.string().url()).optional(),
  videos: z.array(z.string().url()).optional(),
  locationName: z.string().optional(),
  location: z.object({ lat: z.number(), lng: z.number(), address: z.string().optional() }).optional(),
  tags: z.array(z.string()).optional(),
  isAnonymous: z.boolean().optional(),
});

const updateTopicSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  content: z.string().min(1).max(10000).optional(),
  images: z.array(z.string().url()).optional(),
  videos: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'hidden']).optional(),
});

const addCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  images: z.array(z.string().url()).optional(),
  parentId: z.string().optional(),
  replyToUserId: z.string().optional(),
  isAnonymous: z.boolean().optional(),
});

const reportSchema = z.object({
  reason: z.string().min(1),
  description: z.string().optional(),
  evidenceImages: z.array(z.string().url()).optional(),
});

router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const category = req.query.category as string | undefined;
    const crossCommunity = req.query.crossCommunity === 'true';

    if (crossCommunity && req.user) {
      const tenantId = req.tenant?.id ?? req.user.tenantId;
      const result = await getRecommendedTopics(req.user.id, tenantId, page, pageSize);
      return res.json({ code: 0, data: result });
    }

    const tenantId = req.tenant?.id ?? req.user?.tenantId;
    const where: Record<string, unknown> = { status: 'published' };
    if (tenantId) where.tenantId = tenantId;
    if (category) where.category = category;

    const [topics, total] = await Promise.all([
      prisma.topic.findMany({
        where,
        orderBy: [{ isTop: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { author: { select: { id: true, nickname: true, avatar: true } } },
      }),
      prisma.topic.count({ where }),
    ]);

    return res.json({ code: 0, data: { list: topics, total, page, pageSize } });
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, validate(createTopicSchema), async (req, res, next) => {
  try {
    const { category, title, content, images, videos, location, locationName, tags, isAnonymous } = req.body;
    const tenantId = req.tenant?.id ?? req.user!.tenantId;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const settings = tenant?.settings as Record<string, unknown> | null;

    let sensitiveScore = 0;
    let matchedSensitiveWords: string[] = [];
    let isBlocked = false;

    if (settings?.topicSensitiveWordFilter) {
      const check = checkSensitiveWords(`${title} ${content}`);
      sensitiveScore = check.score;
      matchedSensitiveWords = check.matchedWords;
      isBlocked = check.score >= 80;

      if (check.hasSensitive) {
        await recordSensitiveWordHit(null, null, req.user!.id, matchedSensitiveWords, sensitiveScore, isBlocked);
      }
    }

    if (isBlocked) {
      return res.status(400).json({ code: 400, message: 'Content contains sensitive words and has been blocked' });
    }

    const topic = await prisma.topic.create({
      data: {
        tenantId,
        authorId: req.user!.id,
        category,
        title,
        content,
        images,
        videos,
        location: location ?? undefined,
        locationName,
        tags,
        isAnonymous: isAnonymous ?? false,
        isTop: false,
        isEssence: false,
        status: 'published',
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        reportCount: 0,
        sensitiveScore,
        sensitiveWords: matchedSensitiveWords.length > 0 ? matchedSensitiveWords : undefined,
        publishedAt: new Date(),
      },
    });

    return res.status(201).json({ code: 0, data: topic });
  } catch (error) {
    next(error);
  }
});

router.get('/recommended', authMiddleware, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const tenantId = req.tenant?.id ?? req.user!.tenantId;

    const result = await getRecommendedTopics(req.user!.id, tenantId, page, pageSize);
    return res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const topic = await prisma.topic.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { id: true, nickname: true, avatar: true } },
      },
    });

    if (!topic || topic.status === 'deleted') {
      return res.status(404).json({ code: 404, message: 'Topic not found' });
    }

    await prisma.topic.update({
      where: { id: req.params.id },
      data: { viewCount: { increment: 1 } },
    });

    return res.json({ code: 0, data: topic });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authMiddleware, validate(updateTopicSchema), async (req, res, next) => {
  try {
    const topic = await prisma.topic.findUnique({ where: { id: req.params.id } });
    if (!topic) {
      return res.status(404).json({ code: 404, message: 'Topic not found' });
    }

    if (topic.authorId !== req.user!.id && req.user!.role !== 'tenant_admin' && req.user!.role !== 'platform_admin') {
      return res.status(403).json({ code: 403, message: 'No permission to edit this topic' });
    }

    const updated = await prisma.topic.update({
      where: { id: req.params.id },
      data: req.body,
    });

    return res.json({ code: 0, data: updated });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const topic = await prisma.topic.findUnique({ where: { id: req.params.id } });
    if (!topic) {
      return res.status(404).json({ code: 404, message: 'Topic not found' });
    }

    if (topic.authorId !== req.user!.id && req.user!.role !== 'tenant_admin' && req.user!.role !== 'platform_admin') {
      return res.status(403).json({ code: 403, message: 'No permission to delete this topic' });
    }

    await prisma.topic.update({
      where: { id: req.params.id },
      data: { status: 'deleted' },
    });

    return res.json({ code: 0, data: null });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/like', authMiddleware, async (req, res, next) => {
  try {
    const existing = await prisma.topicLike.findUnique({
      where: { topicId_userId: { topicId: req.params.id, userId: req.user!.id } },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.topicLike.delete({ where: { id: existing.id } }),
        prisma.topic.update({ where: { id: req.params.id }, data: { likeCount: { decrement: 1 } } }),
      ]);
      return res.json({ code: 0, data: { liked: false } });
    }

    await prisma.$transaction([
      prisma.topicLike.create({
        data: { topicId: req.params.id, userId: req.user!.id },
      }),
      prisma.topic.update({ where: { id: req.params.id }, data: { likeCount: { increment: 1 } } }),
    ]);

    return res.json({ code: 0, data: { liked: true } });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/comments', authMiddleware, validate(addCommentSchema), async (req, res, next) => {
  try {
    const topic = await prisma.topic.findUnique({ where: { id: req.params.id } });
    if (!topic || topic.status === 'deleted') {
      return res.status(404).json({ code: 404, message: 'Topic not found' });
    }

    const { content, images, parentId, replyToUserId, isAnonymous } = req.body;
    const tenantId = req.tenant?.id ?? req.user!.tenantId;

    const comment = await prisma.topicComment.create({
      data: {
        topicId: req.params.id,
        tenantId,
        authorId: req.user!.id,
        parentId,
        replyToUserId,
        content,
        images,
        isAnonymous: isAnonymous ?? false,
        likeCount: 0,
        status: 'normal',
      },
    });

    await prisma.topic.update({
      where: { id: req.params.id },
      data: { commentCount: { increment: 1 } },
    });

    return res.status(201).json({ code: 0, data: comment });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/comments', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const [comments, total] = await Promise.all([
      prisma.topicComment.findMany({
        where: { topicId: req.params.id, status: 'normal' },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { author: { select: { id: true, nickname: true, avatar: true } } },
      }),
      prisma.topicComment.count({ where: { topicId: req.params.id, status: 'normal' } }),
    ]);

    return res.json({ code: 0, data: { list: comments, total, page, pageSize } });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/report', authMiddleware, validate(reportSchema), async (req, res, next) => {
  try {
    const { reason, description, evidenceImages } = req.body;

    const topic = await prisma.topic.findUnique({ where: { id: req.params.id } });
    if (!topic) {
      return res.status(404).json({ code: 404, message: 'Topic not found' });
    }

    const report = await prisma.topicReport.create({
      data: {
        topicId: req.params.id,
        reporterId: req.user!.id,
        reason,
        description,
        evidenceImages,
        status: 'pending',
      },
    });

    await prisma.topic.update({
      where: { id: req.params.id },
      data: { reportCount: { increment: 1 } },
    });

    return res.status(201).json({ code: 0, data: report });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/trace', authMiddleware, async (req, res, next) => {
  try {
    const { action, beforeContent, afterContent, metadata } = req.body as {
      action: 'create' | 'edit' | 'publish' | 'hide' | 'delete' | 'report' | 'restore';
      beforeContent?: string;
      afterContent?: string;
      metadata?: Record<string, unknown>;
    };

    const traceLog = await prisma.topicTraceLog.create({
      data: {
        topicId: req.params.id,
        userId: req.user!.id,
        action,
        beforeContent,
        afterContent,
        ip: req.ip,
        metadata: metadata as Record<string, unknown> | undefined,
      },
    });

    return res.status(201).json({ code: 0, data: traceLog });
  } catch (error) {
    next(error);
  }
});

export default router;
