import express from 'express';
import prisma from '../utils/prisma';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const topics = await prisma.topic.findMany({
      orderBy: [{ isHot: 'desc' }, { heatScore: 'desc' }, { postCount: 'desc' }],
      take: limit,
    });
    res.json({ topics });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/hot', async (req, res) => {
  try {
    const topics = await prisma.topic.findMany({
      where: { isHot: true },
      orderBy: { heatScore: 'desc' },
      take: 20,
    });
    res.json({ topics });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:name/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const posts = await prisma.post.findMany({
      where: {
        status: 'APPROVED',
        topics: { some: { topic: { name: req.params.name } } },
      },
      include: {
        user: { select: { id: true, nickname: true, avatar: true } },
        topics: { include: { topic: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    });
    res.json({ posts, page, hasMore: posts.length === limit });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
