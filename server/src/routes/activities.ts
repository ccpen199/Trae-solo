import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Activity } from '../entities/Activity';
import { ActivityRegistration } from '../entities/ActivityRegistration';
import { v4 as uuidv4 } from 'uuid';
import { auth, AuthRequest } from '../middleware/auth';
import { MessageService } from '../services/messageService';
import { Message } from '../entities/Message';

const router = Router();

router.get('/', auth(), async (req: AuthRequest, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Activity);
    const user = req.user!;
    const where: any = { status: 'published' };
    where.communityId = user.communityId;
    const activities = await repo.find({
      where,
      relations: ['registrations'],
      order: { startDate: 'DESC' },
    });
    res.json(activities);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', auth(), async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Activity);
    const activity = await repo.findOne({
      where: { id: req.params.id },
      relations: ['registrations', 'registrations.user'],
    });
    if (!activity) return res.status(404).json({ message: '活动不存在' });
    res.json(activity);
  } catch (err) {
    next(err);
  }
});

router.post('/', auth(['admin', 'property']), async (req: AuthRequest, res, next) => {
  try {
    const user = req.user!;
    const repo = AppDataSource.getRepository(Activity);
    const activity = repo.create({
      id: uuidv4(),
      communityId: user.communityId,
      ...req.body,
      status: 'published',
    });
    const saved = await repo.save(activity);
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/register', auth(['owner']), async (req: AuthRequest, res, next) => {
  try {
    const user = req.user!;
    const activityRepo = AppDataSource.getRepository(Activity);
    const activity = await activityRepo.findOne({
      where: { id: req.params.id },
      relations: ['registrations'],
    });
    if (!activity) return res.status(404).json({ message: '活动不存在' });

    const regRepo = AppDataSource.getRepository(ActivityRegistration);
    const existing = await regRepo.findOne({
      where: { activityId: req.params.id, userId: user.id },
    });
    if (existing) return res.status(400).json({ message: '已报名' });

    if (activity.maxParticipants > 0 && activity.registrations.length >= activity.maxParticipants) {
      return res.status(400).json({ message: '名额已满' });
    }

    const registration = regRepo.create({
      id: uuidv4(),
      activityId: req.params.id,
      userId: user.id,
      ...req.body,
      status: 'registered',
    });
    const saved = await regRepo.save(registration);
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/registrations', auth(['admin', 'property']), async (req, res, next) => {
  try {
    const regRepo = AppDataSource.getRepository(ActivityRegistration);
    const registrations = await regRepo.find({
      where: { activityId: req.params.id },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
    res.json(registrations);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', auth(['admin', 'property']), async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Activity);
    const activity = await repo.findOne({ where: { id: req.params.id } });
    if (!activity) return res.status(404).json({ message: '活动不存在' });
    repo.merge(activity, req.body);
    await repo.save(activity);
    res.json(activity);
  } catch (err) {
    next(err);
  }
});

export default router;
