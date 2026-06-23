import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const { phone, password, role } = req.body;
    const userRepo = AppDataSource.getRepository(User);
    const where: any = { phone };
    if (role) where.role = role;
    const user = await userRepo.findOne({ where });

    if (!user) {
      return res.status(401).json({ message: '手机号或密码错误' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ message: '账户已被禁用' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: '手机号或密码错误' });
    }
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        communityId: user.communityId,
        projectId: user.projectId,
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        communityId: user.communityId,
        projectId: user.projectId,
        address: user.address,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const { phone, password, name, role, communityId, projectId, address } = req.body;
    const userRepo = AppDataSource.getRepository(User);
    const exists = await userRepo.findOne({ where: { phone } });
    if (exists) {
      return res.status(400).json({ message: '该手机号已注册' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = userRepo.create({
      id: uuidv4(),
      phone,
      password: hashed,
      name,
      role: role || 'owner',
      communityId,
      projectId,
      address,
      status: 'active',
    });
    await userRepo.save(user);
    res.status(201).json({ message: '注册成功' });
  } catch (err) {
    next(err);
  }
});

router.get('/me', auth(), async (req: AuthRequest, res, next) => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ message: '用户不存在' });
    res.json({
      id: user.id,
      phone: user.phone,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      communityId: user.communityId,
      projectId: user.projectId,
      address: user.address,
      merchantInfo: user.merchantInfo,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
