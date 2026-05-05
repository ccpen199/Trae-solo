import { Request, Response } from 'express';
import { User } from '../models';
import { comparePassword, generateToken, hashPassword } from '../utils/auth';
import { UserRole } from '../types';
import { AuthRequest } from '../middleware/auth';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: '账户已被禁用，请联系管理员' });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      departmentId: user.departmentId
    });

    const { password: _, ...userWithoutPassword } = user.toJSON();

    res.status(200).json({
      message: '登录成功',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, name, email, phone, departmentId } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ message: '用户名、密码和姓名不能为空' });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await User.create({
      username,
      password: hashedPassword,
      name,
      email,
      phone,
      departmentId,
      role: UserRole.EMPLOYEE,
      isActive: true
    });

    const { password: _, ...userWithoutPassword } = newUser.toJSON();

    res.status(201).json({
      message: '注册成功',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const { password: _, ...userWithoutPassword } = user.toJSON();

    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('获取当前用户错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: '旧密码和新密码不能为空' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const isOldPasswordValid = await comparePassword(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(400).json({ message: '旧密码错误' });
    }

    const hashedNewPassword = await hashPassword(newPassword);
    await user.update({ password: hashedNewPassword });

    res.status(200).json({ message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};
