import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User from '../models/User';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/authMiddleware';
import { findMockUser, findMockUserById, MOCK_USERS } from '../utils/mockData';
import mongoose from 'mongoose';

const DEMO_PASSWORDS: Record<string, string> = {
  admin: '123456',
  homeowner1: '123456',
  homeowner2: '123456',
  designer1: '123456',
  designer2: '123456',
  designer3: '123456',
  designer4: '123456',
};

function buildEnvelope(success: boolean, message: string, user: any, token?: string) {
  return {
    success,
    message,
    data: {
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        avatar: user.avatar || '',
        nickname: user.nickname || user.username,
        bio: user.bio || '',
        designerStatus: user.designerStatus,
        serviceAreas: user.serviceAreas || [],
        qualifications: user.qualifications,
        portfolio: user.portfolio || [],
        statistics: user.statistics,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    }
  };
}

export const register = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: errors.array()
      });
    }

    const { username, email, phone, password, role } = req.body;

    let existingUser: any = null;
    try {
      existingUser = await User.findOne({
        $or: [{ email }, { username }, { phone }]
      });
    } catch (_) { /* DB不可用时忽略 */ }

    const mockUser = findMockUser(username) || findMockUser(email) || findMockUser(phone);
    if (existingUser || mockUser) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱或手机号已被注册'
      });
    }

    try {
      const user = await User.create({
        username,
        email,
        phone,
        password,
        role: role || 'homeowner'
      });

      return res.status(201).json(
        buildEnvelope(true, '注册成功', user, generateToken(user._id.toString()))
      );
    } catch (dbErr) {
      const tempUser = {
        _id: `tmp-${Date.now()}`,
        username,
        email,
        phone,
        role: role || 'homeowner',
        avatar: '',
        nickname: username,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return res.status(201).json(
        buildEnvelope(true, '注册成功（演示模式）', tempUser, generateToken(tempUser._id))
      );
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '注册失败：' + (error as Error).message
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { account, password } = req.body;

    if (!account || !password) {
      return res.status(400).json({
        success: false,
        message: '请输入账号和密码'
      });
    }

    // 1. 演示账号兜底（第一优先级）
    const mockUser = findMockUser(account);
    if (mockUser) {
      const mockPass = DEMO_PASSWORDS[mockUser.username];
      if (mockPass === password) {
        const roleName = mockUser.role === 'homeowner' ? '业主' : mockUser.role === 'designer' ? '设计师' : '管理员';
        return res.json(
          buildEnvelope(true, `登录成功（演示模式 - ${roleName}）`, mockUser, generateToken(String(mockUser._id)))
        );
      }
      return res.status(401).json({
        success: false,
        message: mockPass ? `演示账号「${mockUser.username}」密码为 123456` : '密码错误'
      });
    }

    // 2. 真实数据库
    try {
      const user = await User.findOne({
        $or: [{ email: account }, { username: account }, { phone: account }]
      }).select('+password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: '账号不存在，可使用演示账号：homeowner1 / designer1 / admin，密码123456'
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: '密码错误'
        });
      }

      return res.json(
        buildEnvelope(true, '登录成功', user, generateToken(user._id.toString()))
      );
    } catch (dbErr: any) {
      return res.status(503).json({
        success: false,
        message: '数据库暂不可用，请使用演示账号登录（homeowner1 / designer1 / admin，密码123456）'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '登录失败：' + (error as Error).message
    });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    let user: any = null;
    const uid = String(req.user?._id);

    // 1. 查数据库
    if (uid && mongoose.Types.ObjectId.isValid(uid)) {
      try {
        user = await User.findById(uid);
      } catch (_) { /* DB不可用 */ }
    }

    // 2. 查内存mock
    if (!user) {
      user = findMockUserById(uid);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const env = buildEnvelope(true, '', user);
    return res.json({
      success: true,
      data: env.data.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const allowedUpdates = ['nickname', 'bio', 'avatar', 'preferences', 'serviceAreas'];
    const updates: any = {};

    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (req.file) {
      updates.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    // mock用户也能返回成功（内存模式）
    const uid = String(req.user?._id);
    if (uid && uid.startsWith('demo-')) {
      const mockUser = findMockUserById(uid);
      if (mockUser) {
        Object.assign(mockUser, updates);
        return res.json({
          success: true,
          message: '个人信息更新成功（演示模式）',
          data: mockUser
        });
      }
    }

    try {
      const user = await User.findByIdAndUpdate(
        req.user?._id,
        updates,
        { new: true, runValidators: true }
      );

      return res.json({
        success: true,
        message: '个人信息更新成功',
        data: user
      });
    } catch (dbErr) {
      return res.json({
        success: true,
        message: '个人信息更新成功（演示模式）',
        data: updates
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新失败：' + (error as Error).message
    });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const uid = String(req.user?._id);
    // mock用户改密码
    if (uid && uid.startsWith('demo-')) {
      const mockUser = findMockUserById(uid);
      if (mockUser) {
        const demoPass = DEMO_PASSWORDS[mockUser.username];
        if (demoPass !== oldPassword) {
          return res.status(400).json({ success: false, message: '原密码错误（演示账号密码不可修改）' });
        }
        return res.json({ success: true, message: '演示账号密码校验通过（演示模式不实际修改）' });
      }
    }

    const user = await User.findById(req.user?._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: '原密码错误' });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '密码修改失败：' + (error as Error).message
    });
  }
};
