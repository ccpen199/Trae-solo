import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { GovDataChannel } from '../entities/GovDataChannel';
import { v4 as uuidv4 } from 'uuid';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', auth(['admin', 'property']), async (req: AuthRequest, res, next) => {
  try {
    const repo = AppDataSource.getRepository(GovDataChannel);
    const user = req.user!;
    const where: any = {};
    if (user.role !== 'admin') {
      where.communityId = user.communityId;
    }
    const channels = await repo.find({ where, order: { createdAt: 'DESC' } });
    res.json(channels);
  } catch (err) {
    next(err);
  }
});

router.post('/', auth(['admin']), async (req: AuthRequest, res, next) => {
  try {
    const repo = AppDataSource.getRepository(GovDataChannel);
    const channel = repo.create({
      id: uuidv4(),
      ...req.body,
      status: req.body.status || 'inactive',
    });
    const saved = await repo.save(channel);
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', auth(['admin']), async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(GovDataChannel);
    const channel = await repo.findOne({ where: { id: req.params.id } });
    if (!channel) return res.status(404).json({ message: '通道不存在' });
    repo.merge(channel, req.body);
    await repo.save(channel);
    res.json(channel);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/sync', auth(['admin', 'property']), async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(GovDataChannel);
    const channel = await repo.findOne({ where: { id: req.params.id } });
    if (!channel) return res.status(404).json({ message: '通道不存在' });
    channel.lastSyncAt = new Date().toISOString();
    await repo.save(channel);
    res.json({ message: '同步完成', lastSyncAt: channel.lastSyncAt });
  } catch (err) {
    next(err);
  }
});

export default router;
