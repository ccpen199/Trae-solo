import { Router, Request, Response } from 'express';
import Joi from 'joi';
import db from '../database';
import { success, error, logAudit, normalizeProvider, normalizeUser } from '../utils/common';
import { auth } from '../middleware/auth';

const router = Router();

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  avatar: Joi.string().optional().allow(''),
  phone: Joi.string().optional().allow('')
});

const verifyRealNameSchema = Joi.object({
  realName: Joi.string().min(2).required(),
  idCardNo: Joi.string().length(18).required(),
  idCardFront: Joi.string().required(),
  idCardBack: Joi.string().required()
});

const getUserProfile = (userId: number) => {
  const user = db.prepare(`
    SELECT u.id, u.email, u.name, u.avatar, u.phone, u.userType, u.status,
           u.realNameVerified, u.idCardNo, u.createdAt, u.updatedAt,
           p.id as providerId, p.categoryId, p.bio, p.skills, p.rating,
           p.level, p.completedTasks, p.totalEarnings, p.location,
           p.verificationStatus
    FROM users u
    LEFT JOIN providers p ON u.id = p.userId
    WHERE u.id = ?
  `).get(userId) as any;

  if (!user) return null;
  if (user.providerId) return normalizeProvider(user);
  return normalizeUser(user);
};

router.get('/me', auth, async (req: Request, res: Response) => {
  try {
    const user = getUserProfile(req.user!.id);

    if (!user) {
      return res.json(error('用户不存在', 404));
    }

    res.json(success(user, '获取用户信息成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取用户信息失败', 500));
  }
});

router.get('/profile', auth, async (req: Request, res: Response) => {
  try {
    const user = getUserProfile(req.user!.id);
    if (!user) {
      return res.json(error('用户不存在', 404));
    }
    res.json(success(user, '获取用户信息成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取用户信息失败', 500));
  }
});

router.get('/provider-profile', auth, async (req: Request, res: Response) => {
  try {
    const provider = db.prepare(`
      SELECT p.*, u.name, u.email, u.avatar, u.phone, u.realNameVerified,
             c.name as categoryName
      FROM providers p
      LEFT JOIN users u ON p.userId = u.id
      LEFT JOIN categories c ON p.categoryId = c.id
      WHERE p.userId = ?
    `).get(req.user!.id) as any;

    if (!provider) {
      return res.json(error('服务商信息不存在', 404));
    }

    res.json(success(normalizeProvider(provider), '获取服务商信息成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取服务商信息失败', 500));
  }
});

const updateProfile = async (req: Request, res: Response) => {
  try {
    const { error: validationError, value } = updateProfileSchema.validate(req.body);
    if (validationError) {
      return res.json(error(validationError.details[0].message, 400));
    }

    const userId = req.user!.id;

    const fields = [];
    const values = [];

    if (value.name !== undefined) {
      fields.push('name = ?');
      values.push(value.name);
    }
    if (value.avatar !== undefined) {
      fields.push('avatar = ?');
      values.push(value.avatar);
    }
    if (value.phone !== undefined) {
      fields.push('phone = ?');
      values.push(value.phone);
    }

    fields.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(userId);

    if (fields.length > 1) {
      db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    const user = db.prepare(`
      SELECT id, email, name, avatar, phone, userType, status,
             realNameVerified, createdAt, updatedAt
      FROM users WHERE id = ?
    `).get(userId);

    logAudit(userId, 'user', 'update_profile', {
      targetId: userId,
      targetType: 'user',
      details: value,
      ip: req.ip
    });

    res.json(success(normalizeUser(user), '更新用户信息成功'));
  } catch (err: any) {
    res.json(error(err.message || '更新用户信息失败', 500));
  }
};

router.put('/me', auth, updateProfile);
router.put('/profile', auth, updateProfile);

router.post('/verify-realname', auth, async (req: Request, res: Response) => {
  try {
    const { error: validationError, value } = verifyRealNameSchema.validate(req.body);
    if (validationError) {
      return res.json(error(validationError.details[0].message, 400));
    }

    const userId = req.user!.id;

    db.prepare(`
      UPDATE users SET
        name = ?,
        idCardNo = ?,
        idCardFront = ?,
        idCardBack = ?,
        realNameVerified = 1,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(value.realName, value.idCardNo, value.idCardFront, value.idCardBack, userId);

    const user = db.prepare(`
      SELECT id, email, name, realNameVerified, idCardNo, updatedAt
      FROM users WHERE id = ?
    `).get(userId);

    logAudit(userId, 'user', 'verify_realname', {
      targetId: userId,
      targetType: 'user',
      riskLevel: 'medium',
      ip: req.ip
    });

    res.json(success(user, '实名认证提交成功'));
  } catch (err: any) {
    res.json(error(err.message || '实名认证提交失败', 500));
  }
});

export default router;
