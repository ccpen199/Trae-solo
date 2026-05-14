import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../database';
import { successResponse, errorResponse, badRequestResponse } from '../utils/response';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { AvatarConfig } from '../types';

const router = Router();

const avatarSchema = z.object({
  skinColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '颜色格式无效').optional(),
  hairStyle: z.string().min(1).max(50).optional(),
  hairColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '颜色格式无效').optional(),
  eyeStyle: z.string().min(1).max(50).optional(),
  outfit: z.string().min(1).max(50).optional(),
  accessory: z.string().max(50).optional(),
});

router.put('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json(errorResponse('未登录'));
    }
    
    const validation = avatarSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(badRequestResponse(validation.error.issues[0]?.message || '参数验证失败'));
    }
    
    const db = getDb();
    const existingUser = db
      .prepare('SELECT avatar_config FROM users WHERE id = ?')
      .get(req.userId) as { avatar_config: string } | undefined;
    
    if (!existingUser) {
      return res.status(404).json(errorResponse('用户不存在'));
    }
    
    const currentConfig: AvatarConfig = JSON.parse(existingUser.avatar_config || '{}');
    const newConfig: AvatarConfig = { ...currentConfig, ...validation.data };
    
    db.prepare(`
      UPDATE users
      SET avatar_config = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(JSON.stringify(newConfig), req.userId);
    
    return res.json(successResponse({ avatarConfig: newConfig }, '虚拟形象更新成功'));
  } catch (error) {
    console.error('Update avatar error:', error);
    return res.status(500).json(errorResponse('更新虚拟形象失败'));
  }
});

router.get('/options', (req, res) => {
  try {
    return res.json(
      successResponse({
        skinColors: ['#FFDBB4', '#F5CBA7', '#D4A574', '#C68642', '#8D5524', '#5C4033'],
        hairStyles: ['style1', 'style2', 'style3', 'style4', 'style5', 'style6'],
        hairColors: ['#4A4A4A', '#1C1C1C', '#8B4513', '#D2691E', '#FFD700', '#FF6B6B', '#9B59B6', '#3498DB'],
        eyeStyles: ['style1', 'style2', 'style3', 'style4'],
        outfits: ['casual', 'formal', 'sport', 'gamer', 'anime', 'fantasy'],
        accessories: ['none', 'glasses', 'hat', 'headphone', 'crown'],
      })
    );
  } catch (error) {
    console.error('Get avatar options error:', error);
    return res.status(500).json(errorResponse('获取选项失败'));
  }
});

export default router;
