import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Community } from '../entities/Community';
import { v4 as uuidv4 } from 'uuid';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', auth(), async (req: AuthRequest, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Community);
    const communities = await repo.find({
      relations: ['projects'],
      order: { createdAt: 'DESC' },
    });
    res.json(communities);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', auth(), async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Community);
    const community = await repo.findOne({
      where: { id: req.params.id },
      relations: ['projects'],
    });
    if (!community) return res.status(404).json({ message: '小区不存在' });
    res.json(community);
  } catch (err) {
    next(err);
  }
});

router.post('/', auth(['admin', 'property']), async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Community);
    const community = repo.create({
      id: uuidv4(),
      ...req.body,
    });
    await repo.save(community);
    res.status(201).json(community);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', auth(['admin', 'property']), async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Community);
    const community = await repo.findOne({ where: { id: req.params.id } });
    if (!community) return res.status(404).json({ message: '小区不存在' });
    repo.merge(community, req.body);
    await repo.save(community);
    res.json(community);
  } catch (err) {
    next(err);
  }
});

export default router;
