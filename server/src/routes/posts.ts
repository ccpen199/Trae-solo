import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Post } from '../entities/Post';
import { Comment } from '../entities/Comment';
import { v4 as uuidv4 } from 'uuid';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', auth(), async (req: AuthRequest, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Post);
    const user = req.user!;
    const where: any = { status: 'active' };
    where.communityId = user.communityId;
    const posts = await repo.find({
      where,
      relations: ['user', 'comments', 'comments.user'],
      order: { createdAt: 'DESC' },
    });
    res.json(posts);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', auth(), async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Post);
    const post = await repo.findOne({
      where: { id: req.params.id },
      relations: ['user', 'comments', 'comments.user'],
    });
    if (!post) return res.status(404).json({ message: '动态不存在' });
    res.json(post);
  } catch (err) {
    next(err);
  }
});

router.post('/', auth(['owner']), async (req: AuthRequest, res, next) => {
  try {
    const user = req.user!;
    const repo = AppDataSource.getRepository(Post);
    const post = repo.create({
      id: uuidv4(),
      userId: user.id,
      communityId: user.communityId,
      ...req.body,
      likeCount: 0,
      status: 'active',
    });
    const saved = await repo.save(post);
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/like', auth(), async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Post);
    const post = await repo.findOne({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ message: '动态不存在' });
    post.likeCount += 1;
    await repo.save(post);
    res.json(post);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/comments', auth(), async (req: AuthRequest, res, next) => {
  try {
    const user = req.user!;
    const commentRepo = AppDataSource.getRepository(Comment);
    const comment = commentRepo.create({
      id: uuidv4(),
      postId: req.params.id,
      userId: user.id,
      content: req.body.content,
      status: 'active',
    });
    const saved = await commentRepo.save(comment);
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
});

export default router;
