import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Announcement } from '../entities/Announcement';
import { v4 as uuidv4 } from 'uuid';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', auth(), async (req: AuthRequest, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Announcement);
    const user = req.user!;
    const where: any = { status: 'published' };
    if (user.role !== 'admin') {
      where.communityId = user.communityId;
    }
    if (req.query.category) where.category = req.query.category;
    const announcements = await repo.find({
      where,
      order: { createdAt: 'DESC' },
    });
    res.json(announcements);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', auth(), async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Announcement);
    const announcement = await repo.findOne({ where: { id: req.params.id } });
    if (!announcement) return res.status(404).json({ message: '公告不存在' });
    announcement.viewCount += 1;
    await repo.save(announcement);
    res.json(announcement);
  } catch (err) {
    next(err);
  }
});

router.post('/', auth(['admin', 'property']), async (req: AuthRequest, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Announcement);
    const announcement = repo.create({
      id: uuidv4(),
      ...req.body,
    });
    await repo.save(announcement);
    res.status(201).json(announcement);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', auth(['admin', 'property']), async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Announcement);
    const announcement = await repo.findOne({ where: { id: req.params.id } });
    if (!announcement) return res.status(404).json({ message: '公告不存在' });
    repo.merge(announcement, req.body);
    await repo.save(announcement);
    res.json(announcement);
  } catch (err) {
    next(err);
  }
});

export default router;
