import { Request, Response } from 'express';
import Joi from 'joi';
import db from '../database';
import logger from '../utils/logger';

const updateProfileSchema = Joi.object({
  nickname: Joi.string().max(50),
  avatar: Joi.string().max(255)
});

const addFamilyMemberSchema = Joi.object({
  familyId: Joi.number().required(),
  relation: Joi.string().max(50)
});

export async function getProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const user = db.prepare('SELECT id, phone, nickname, avatar, role, storage_used, storage_limit FROM users WHERE id = ?').get(userId) as any;

    if (!user) {
      res.status(404).json({ success: false, message: '用户不存在' });
      return;
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('获取用户信息错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { error, value } = updateProfileSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({ success: false, message: error.details[0].message });
      return;
    }

    const fields = Object.keys(value).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(value), userId];

    if (fields) {
      db.prepare(`UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);
    }

    const user = db.prepare('SELECT id, phone, nickname, avatar, role FROM users WHERE id = ?').get(userId);

    res.json({
      success: true,
      message: '更新成功',
      data: user
    });
  } catch (error) {
    logger.error('更新用户信息错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

export async function getFamilyMembers(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const members = db.prepare(`
      SELECT u.id, u.nickname, u.avatar, u.role, fm.relation
      FROM family_members fm
      JOIN users u ON fm.family_id = u.id
      WHERE fm.user_id = ?
    `).all(userId);

    res.json({
      success: true,
      data: members
    });
  } catch (error) {
    logger.error('获取家庭成员错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

export async function addFamilyMember(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { error, value } = addFamilyMemberSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({ success: false, message: error.details[0].message });
      return;
    }

    const { familyId, relation } = value;

    try {
      db.prepare(`
        INSERT INTO family_members (user_id, family_id, relation)
        VALUES (?, ?, ?)
      `).run(userId, familyId, relation);
    } catch (e) {
      res.status(400).json({ success: false, message: '该家庭成员已存在' });
      return;
    }

    res.json({
      success: true,
      message: '添加家庭成员成功'
    });
  } catch (error) {
    logger.error('添加家庭成员错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}
