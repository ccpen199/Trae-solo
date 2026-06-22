import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User from '../models/User';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/authMiddleware';

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

    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱或手机号已被注册'
      });
    }

    const user = await User.create({
      username,
      email,
      phone,
      password,
      role: role || 'homeowner'
    });

    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          nickname: user.nickname
        }
      }
    });
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

    const user = await User.findOne({
      $or: [{ email: account }, { username: account }, { phone: account }]
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '账号不存在'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '密码错误'
      });
    }

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          nickname: user.nickname,
          bio: user.bio,
          designerStatus: user.designerStatus
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '登录失败：' + (error as Error).message
    });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: user
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
    const allowedUpdates = ['nickname', 'bio', 'avatar', 'preferences'];
    const updates: any = {};

    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (req.file) {
      updates.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: '个人信息更新成功',
      data: user
    });
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
