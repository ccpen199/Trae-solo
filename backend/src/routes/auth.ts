import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../database';
import { generateId, hashPassword, verifyPassword } from '../utils/crypto';
import { signToken } from '../utils/jwt';
import { successResponse, errorResponse, badRequestResponse } from '../utils/response';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { AvatarConfig } from '../types';

const router = Router();

const defaultAvatar: AvatarConfig = {
  skinColor: '#FFDBB4',
  hairStyle: 'style1',
  hairColor: '#4A4A4A',
  eyeStyle: 'style1',
  outfit: 'casual',
};

const registerSchema = z.object({
  username: z.string().min(3, '用户名至少3个字符').max(20, '用户名最多20个字符').regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  password: z.string().min(6, '密码至少6个字符').max(50, '密码最多50个字符'),
  nickname: z.string().min(1, '昵称不能为空').max(30, '昵称最多30个字符'),
});

const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

router.post('/register', async (req, res) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(badRequestResponse(validation.error.issues[0]?.message || '参数验证失败'));
    }
    
    const { username, password, nickname } = validation.data;
    const db = getDb();
    
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json(badRequestResponse('用户名已存在'));
    }
    
    const userId = generateId();
    const passwordHash = await hashPassword(password);
    
    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO users (id, username, password_hash, nickname, avatar_config)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, username, passwordHash, nickname, JSON.stringify(defaultAvatar));
    });
    
    transaction();
    
    const token = signToken({ userId, username });
    
    return res.status(201).json(
      successResponse(
        {
          token,
          user: {
            id: userId,
            username,
            nickname,
            avatarConfig: defaultAvatar,
          },
        },
        '注册成功'
      )
    );
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json(errorResponse('注册失败，请稍后重试'));
  }
});

router.post('/login', async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(badRequestResponse(validation.error.issues[0]?.message || '参数验证失败'));
    }
    
    const { username, password } = validation.data;
    const db = getDb();
    
    const user = db
      .prepare('SELECT * FROM users WHERE username = ?')
      .get(username) as { id: string; username: string; password_hash: string; nickname: string; avatar_config: string } | undefined;
    
    if (!user) {
      return res.status(401).json(errorResponse('用户名或密码错误'));
    }
    
    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json(errorResponse('用户名或密码错误'));
    }
    
    const token = signToken({ userId: user.id, username: user.username });
    
    return res.json(
      successResponse(
        {
          token,
          user: {
            id: user.id,
            username: user.username,
            nickname: user.nickname,
            avatarConfig: JSON.parse(user.avatar_config || '{}'),
          },
        },
        '登录成功'
      )
    );
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json(errorResponse('登录失败，请稍后重试'));
  }
});

router.get('/me', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json(errorResponse('未登录'));
    }
    
    return res.json(
      successResponse({
        user: {
          id: req.user.id,
          username: req.user.username,
          nickname: req.user.nickname,
          avatarConfig: JSON.parse(req.user.avatar_config || '{}'),
        },
      })
    );
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json(errorResponse('获取用户信息失败'));
  }
});

router.put('/me', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.userId || !req.user) {
      return res.status(401).json(errorResponse('未登录'));
    }
    
    const { nickname } = req.body;
    
    if (nickname && !nickname.trim()) {
      return res.status(400).json(errorResponse('昵称不能为空'));
    }
    
    const db = getDb();
    
    if (nickname) {
      db.prepare(`
        UPDATE users
        SET nickname = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(nickname.trim(), req.userId);
    }
    
    const updatedUser = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(req.userId) as {
        id: string;
        username: string;
        nickname: string;
        avatar_config: string;
        created_at: string;
        updated_at: string;
      } | undefined;
    
    if (!updatedUser) {
      return res.status(404).json(errorResponse('用户不存在'));
    }
    
    return res.json(
      successResponse({
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          nickname: updatedUser.nickname,
          avatarConfig: JSON.parse(updatedUser.avatar_config || '{}'),
        },
      }, '更新成功')
    );
  } catch (error) {
    console.error('Update me error:', error);
    return res.status(500).json(errorResponse('更新失败，请稍后重试'));
  }
});

export default router;
