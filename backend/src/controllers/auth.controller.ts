import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../data-source';
import { User, UserRole } from '../models/User';
import { AuthRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'home-service-platform-secret-key-2024';

export const login = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: '手机号和密码不能为空' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const loginPhone = phone === 'admin' ? '13800000000' : phone;
    const user = await userRepository.findOneBy({ phone: loginPhone });

    if (!user) {
      return res.status(401).json({ error: '账号不存在，请检查手机号是否正确' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: '密码错误，请重新输入' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { phone, password, name, role = UserRole.CUSTOMER } = req.body;

    if (!phone || !password || !name) {
      return res.status(400).json({ error: '手机号、密码和姓名不能为空' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const existingUser = await userRepository.findOneBy({ phone });

    if (existingUser) {
      return res.status(400).json({ error: '该手机号已注册' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = userRepository.create({
      phone,
      password: hashedPassword,
      name,
      role,
    });

    await userRepository.save(user);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '注册失败' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    const { password: _, ...userWithoutPassword } = req.user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    const { name, avatar, address, latitude, longitude, workingHours, skills, tools } = req.body;

    const userRepository = AppDataSource.getRepository(User);
    
    if (name !== undefined) req.user.name = name;
    if (avatar !== undefined) req.user.avatar = avatar;
    if (address !== undefined) req.user.address = address;
    if (latitude !== undefined) req.user.latitude = latitude;
    if (longitude !== undefined) req.user.longitude = longitude;
    if (workingHours !== undefined) req.user.workingHours = workingHours;
    if (skills !== undefined) req.user.skills = skills;
    if (tools !== undefined) req.user.tools = tools;

    await userRepository.save(req.user);

    const { password: _, ...userWithoutPassword } = req.user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: '更新用户信息失败' });
  }
};
