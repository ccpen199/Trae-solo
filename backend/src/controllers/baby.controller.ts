
import { Request, Response } from 'express';
import Joi from 'joi';
import db from '../database';
import logger from '../utils/logger';

const babySchema = Joi.object({
  name: Joi.string().required().max(50),
  gender: Joi.string().valid('male', 'female'),
  birthday: Joi.string().isoDate(),
  avatar: Joi.string().uri().allow(''),
  birth_weight: Joi.number().min(0).max(20),
  birth_height: Joi.number().min(0).max(100)
});

export async function getBabies(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const babies = db.prepare(`
      SELECT * FROM babies WHERE user_id = ? ORDER BY created_at DESC
    `).all(userId);

    res.json({
      success: true,
      message: '获取成功',
      data: babies
    });
  } catch (error) {
    logger.error('获取宝宝列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

export async function getBabyDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    
    const baby = db.prepare('SELECT * FROM babies WHERE id = ? AND user_id = ?').get(id, userId);
    
    if (!baby) {
      res.status(404).json({ success: false, message: '宝宝不存在' });
      return;
    }

    res.json({
      success: true,
      data: baby
    });
  } catch (error) {
    logger.error('获取宝宝详情错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

export async function createBaby(req: Request, res: Response) {
  try {
    const { error, value } = babySchema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, message: error.details[0].message });
      return;
    }

    const userId = (req as any).userId;
    const result = db.prepare(`
      INSERT INTO babies (user_id, name, gender, birthday, avatar, birth_weight, birth_height)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      value.name,
      value.gender || null,
      value.birthday || null,
      value.avatar || null,
      value.birth_weight || null,
      value.birth_height || null
    );

    res.json({
      success: true,
      message: '创建成功',
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    logger.error('创建宝宝错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

export async function updateBaby(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { error, value } = babySchema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, message: error.details[0].message });
      return;
    }

    const userId = (req as any).userId;
    const baby = db.prepare('SELECT * FROM babies WHERE id = ? AND user_id = ?').get(id, userId);
    
    if (!baby) {
      res.status(404).json({ success: false, message: '宝宝不存在' });
      return;
    }

    db.prepare(`
      UPDATE babies 
      SET name = ?, gender = ?, birthday = ?, avatar = ?, birth_weight = ?, birth_height = ?
      WHERE id = ?
    `).run(
      value.name,
      value.gender || null,
      value.birthday || null,
      value.avatar || null,
      value.birth_weight || null,
      value.birth_height || null,
      id
    );

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    logger.error('更新宝宝错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

export async function deleteBaby(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const baby = db.prepare('SELECT * FROM babies WHERE id = ? AND user_id = ?').get(id, userId);
    if (!baby) {
      res.status(404).json({ success: false, message: '宝宝不存在' });
      return;
    }

    db.prepare('DELETE FROM babies WHERE id = ?').run(id);

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    logger.error('删除宝宝错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}
