import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Project } from '../entities/Project';
import { v4 as uuidv4 } from 'uuid';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.get('/', auth(), async (req: AuthRequest, res, next) => {
  try {
    const { communityId } = req.params;
    const repo = AppDataSource.getRepository(Project);
    const projects = await repo.find({
      where: { communityId },
      order: { createdAt: 'DESC' },
    });
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', auth(), async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Project);
    const project = await repo.findOne({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ message: '项目不存在' });
    res.json(project);
  } catch (err) {
    next(err);
  }
});

router.post('/', auth(['admin', 'property']), async (req, res, next) => {
  try {
    const { communityId } = req.params;
    const repo = AppDataSource.getRepository(Project);
    const project = repo.create({
      id: uuidv4(),
      communityId,
      ...req.body,
    });
    await repo.save(project);
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', auth(['admin', 'property']), async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Project);
    const project = await repo.findOne({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ message: '项目不存在' });
    repo.merge(project, req.body);
    await repo.save(project);
    res.json(project);
  } catch (err) {
    next(err);
  }
});

export default router;
