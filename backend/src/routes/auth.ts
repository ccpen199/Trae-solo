import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';
import { authenticate, AuthRequest, getCurrentUser } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      jobseekerProfile: { include: { city: true, industry: true } },
      hrProfile: { include: { company: true } },
      schoolProfile: { include: { school: true } },
      regulatorProfile: true,
    },
  });

  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || 'talent-platform-shandong-2024-secret-key',
    { expiresIn: '7d' }
  );

  const { password: _, ...userWithoutPassword } = user;

  res.json({
    token,
    user: userWithoutPassword,
  });
});

router.post('/register', async (req, res) => {
  const { username, email, password, role, phone, realName } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  if (!Object.values(UserRole).includes(role as UserRole)) {
    return res.status(400).json({ error: '无效的用户角色' });
  }

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });

  if (existingUser) {
    return res.status(400).json({ error: '用户名或邮箱已存在' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      role: role as UserRole,
      phone,
      realName,
    },
  });

  if (role === UserRole.JOBSEEKER) {
    await prisma.jobseekerProfile.create({
      data: { userId: user.id },
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || 'talent-platform-shandong-2024-secret-key',
    { expiresIn: '7d' }
  );

  const { password: _, ...userWithoutPassword } = user;

  res.status(201).json({
    token,
    user: userWithoutPassword,
  });
});

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

router.post('/logout', authenticate, (req, res) => {
  res.json({ message: '登出成功' });
});

export default router;
