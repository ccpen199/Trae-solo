import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { auth, AuthRequest } from '../middleware/auth';
import { parseJson, toJson } from '../utils/json';

const router = express.Router();

router.post(
  '/register',
  [
    body('phone').isMobilePhone('zh-CN'),
    body('password').isLength({ min: 6 }),
    body('nickname').isLength({ min: 1, max: 20 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { phone, password, nickname, role = 'CITIZEN' } = req.body;
      const existing = await prisma.user.findUnique({ where: { phone } });
      if (existing) {
        return res.status(400).json({ error: '手机号已注册' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          phone,
          passwordHash,
          nickname,
          role,
        },
        select: {
          id: true,
          phone: true,
          nickname: true,
          avatar: true,
          role: true,
          createdAt: true,
        },
      });

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
        expiresIn: '30d',
      });

      res.json({ user, token });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.post(
  '/login',
  [body('phone').isMobilePhone('zh-CN'), body('password').exists()],
  async (req, res) => {
    try {
      const { phone, password } = req.body;
      const user = await prisma.user.findUnique({ where: { phone } });
      if (!user) {
        return res.status(400).json({ error: '用户不存在' });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(400).json({ error: '密码错误' });
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
        expiresIn: '30d',
      });

      const userData = {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
        interestTags: parseJson<string[]>(user.interestTags, []),
        latitude: user.latitude,
        longitude: user.longitude,
        locationName: user.locationName,
        isVerified: user.isVerified,
        creditScore: user.creditScore,
      };

      res.json({ user: userData, token });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/me', auth, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

router.put('/profile', auth, async (req: AuthRequest, res) => {
  try {
    const { nickname, avatar, interestTags, latitude, longitude, locationName } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        nickname: nickname || undefined,
        avatar: avatar || undefined,
        interestTags: toJson(interestTags),
        latitude: latitude !== undefined ? latitude : undefined,
        longitude: longitude !== undefined ? longitude : undefined,
        locationName: locationName || undefined,
      },
      select: {
        id: true,
        phone: true,
        nickname: true,
        avatar: true,
        role: true,
        interestTags: true,
        latitude: true,
        longitude: true,
        locationName: true,
        isVerified: true,
        creditScore: true,
      },
    });
    res.json({ user: { ...user, interestTags: parseJson<string[]>(user.interestTags, []) } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
