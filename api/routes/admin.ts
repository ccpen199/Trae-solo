import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { findAll, create, update, findById } from '../repositories/userRepository.js';
import type { ApiResponse, User, UserRole } from '../types/index.js';

const router = Router();

router.get('/users', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const role = req.query.role as UserRole | undefined;
    const users = findAll(role);
    res.json({ success: true, data: users } as ApiResponse<User[]>);
  } catch (error) {
    res.status(500).json({ success: false, error: '获取用户列表失败' } as ApiResponse);
  }
});

router.post('/users', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const { username, password, name, role, email, studentId } = req.body;
    
    if (!username || !password || !name || !role) {
      return res.status(400).json({ success: false, error: '缺少必填字段' } as ApiResponse);
    }
    
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    
    const user = create({
      username,
      passwordHash,
      name,
      role,
      email,
      studentId,
    });
    
    res.json({ success: true, data: user, message: '用户创建成功' } as ApiResponse<User>);
  } catch (error) {
    res.status(500).json({ success: false, error: '创建用户失败' } as ApiResponse);
  }
});

router.put('/users/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = findById(id);
    
    if (!existing) {
      return res.status(404).json({ success: false, error: '用户不存在' } as ApiResponse);
    }
    
    const { name, email, studentId, role } = req.body;
    const user = update(id, { name, email, studentId, role });
    
    res.json({ success: true, data: user, message: '用户更新成功' } as ApiResponse<User>);
  } catch (error) {
    res.status(500).json({ success: false, error: '更新用户失败' } as ApiResponse);
  }
});

export default router;
