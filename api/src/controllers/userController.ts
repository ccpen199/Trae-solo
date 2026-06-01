import { Request, Response } from 'express';
import { db } from '../config/database.js';
import crypto from 'crypto';
import type { ApiResponse, User } from '../types/index.js';

export const login = (req: Request, res: Response): void => {
  try {
    const { phone, code } = req.body;
    
    if (!phone || !code) {
      res.status(400).json({
        code: 400,
        data: null,
        message: '手机号和验证码不能为空'
      });
      return;
    }
    
    let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as User;
    
    if (!user) {
      const userId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO users (id, phone, nickname, avatar, is_vip, vip_level, view_history_vector, content_quality_score)
        VALUES (?, ?, ?, ?, 0, 0, ?, 0)
      `).run(
        userId,
        phone,
        `用户${phone.slice(-4)}`,
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Default%20user%20avatar&image_size=square',
        JSON.stringify([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5])
      );
      
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User;
    }
    
    const token = crypto.createHash('sha256').update(`${user.id}:${Date.now()}`).digest('hex');
    
    const response: ApiResponse = {
      code: 0,
      data: {
        user,
        token
      },
      message: '登录成功'
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '登录失败'
    });
  }
};

export const getUserInfo = (req: Request, res: Response): void => {
  try {
    const { userId } = req.params;
    
    const user = db.prepare(`
      SELECT id, phone, nickname, avatar, is_vip, vip_level, view_history_vector, content_quality_score, created_at
      FROM users WHERE id = ?
    `).get(userId) as User;
    
    if (!user) {
      res.status(404).json({
        code: 404,
        data: null,
        message: '用户不存在'
      });
      return;
    }
    
    const followStmt = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = ?) as follower_count
    `);
    const followCounts = followStmt.get(userId, userId) as { following_count: number; follower_count: number };
    
    const response: ApiResponse = {
      code: 0,
      data: {
        ...user,
        ...followCounts
      }
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取用户信息失败'
    });
  }
};

export const updateUserInfo = (req: Request, res: Response): void => {
  try {
    const { userId } = req.params;
    const { nickname, avatar } = req.body;
    
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    
    if (!user) {
      res.status(404).json({
        code: 404,
        data: null,
        message: '用户不存在'
      });
      return;
    }
    
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    if (nickname) {
      updateFields.push('nickname = ?');
      updateValues.push(nickname);
    }
    if (avatar) {
      updateFields.push('avatar = ?');
      updateValues.push(avatar);
    }
    
    if (updateFields.length > 0) {
      updateValues.push(userId);
      db.prepare(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`).run(...updateValues);
    }
    
    const updatedUser = db.prepare(`
      SELECT id, phone, nickname, avatar, is_vip, vip_level, view_history_vector, content_quality_score, created_at
      FROM users WHERE id = ?
    `).get(userId);
    
    const response: ApiResponse = {
      code: 0,
      data: updatedUser,
      message: '更新成功'
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '更新用户信息失败'
    });
  }
};

export const followUser = (req: Request, res: Response): void => {
  try {
    const { followerId, followingId } = req.body;
    
    if (followerId === followingId) {
      res.status(400).json({
        code: 400,
        data: null,
        message: '不能关注自己'
      });
      return;
    }
    
    const existing = db.prepare(`
      SELECT id FROM follows WHERE follower_id = ? AND following_id = ?
    `).get(followerId, followingId);
    
    if (existing) {
      db.prepare('DELETE FROM follows WHERE id = ?').run((existing as { id: string }).id);
      
      res.json({
        code: 0,
        data: { is_following: false },
        message: '取消关注成功'
      });
    } else {
      db.prepare(`
        INSERT INTO follows (id, follower_id, following_id)
        VALUES (?, ?, ?)
      `).run(crypto.randomUUID(), followerId, followingId);
      
      res.json({
        code: 0,
        data: { is_following: true },
        message: '关注成功'
      });
    }
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '操作失败'
    });
  }
};

export const getFollowList = (req: Request, res: Response): void => {
  try {
    const { userId } = req.params;
    const { type = 'following' } = req.query;
    
    let query: string;
    let params: string[];
    
    if (type === 'following') {
      query = `
        SELECT u.id, u.nickname, u.avatar
        FROM follows f
        INNER JOIN users u ON f.following_id = u.id
        WHERE f.follower_id = ?
      `;
      params = [userId];
    } else {
      query = `
        SELECT u.id, u.nickname, u.avatar
        FROM follows f
        INNER JOIN users u ON f.follower_id = u.id
        WHERE f.following_id = ?
      `;
      params = [userId];
    }
    
    const list = db.prepare(query).all(...params);
    
    const response: ApiResponse = {
      code: 0,
      data: list
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取关注列表失败'
    });
  }
};
