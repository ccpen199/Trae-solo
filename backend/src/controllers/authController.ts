import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RegisterRequest, LoginRequest, UserWithProfile } from '../types';
import { config } from '../utils/config';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '../utils/response';
import { memoryStore } from '../models/memoryStore';

const SALT_ROUNDS = 10;

interface SafeUser extends Omit<UserWithProfile, 'password'> {}

const toSafeUser = (user: UserWithProfile): SafeUser => {
  const { password, ...safeUser } = user;
  return safeUser;
};

const generateToken = (user: UserWithProfile): string => {
  return jwt.sign(
    { userId: user.id, qqNumber: user.qqNumber },
    config.jwt.secret as string,
    { expiresIn: '7d' }
  );
};

export const register = async (req: Request, res: Response) => {
  try {
    const { nickname, password, confirmPassword, gender, age }: RegisterRequest = req.body;
    
    if (!nickname || !password || !confirmPassword) {
      return res.status(400).json(errorResponse('昵称、密码和确认密码为必填项'));
    }
    
    if (nickname.trim().length < 1 || nickname.trim().length > 20) {
      return res.status(400).json(errorResponse('昵称长度应在1-20个字符之间'));
    }
    
    if (password.length < 6) {
      return res.status(400).json(errorResponse('密码长度至少为6位'));
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json(errorResponse('两次输入的密码不一致'));
    }
    
    if (age !== undefined && (age < 1 || age > 150)) {
      return res.status(400).json(errorResponse('年龄必须在1-150之间'));
    }
    
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    const user = memoryStore.createUser({
      password: hashedPassword,
      nickname: nickname.trim(),
      avatar: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('abstract avatar icon simple cartoon')}&image_size=square`,
      gender: gender || 'unknown',
      age: age || 0,
      signature: '',
      allowAddFriend: true,
      needVerification: true
    });
    
    const token = generateToken(user);
    
    return res.status(200).json(successResponse(
      { user: toSafeUser(user), token },
      '注册成功'
    ));
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json(errorResponse('注册失败，请稍后重试'));
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { qqNumber, password }: LoginRequest = req.body;
    
    if (!qqNumber || !password) {
      return res.status(400).json(errorResponse('QQ号和密码为必填项'));
    }
    
    if (!/^\d{5,10}$/.test(qqNumber)) {
      return res.status(400).json(errorResponse('QQ号必须是5-10位数字'));
    }
    
    const user = memoryStore.findUserByQQNumber(qqNumber);
    
    if (!user) {
      return res.status(404).json(notFoundResponse('该QQ号未注册，请先注册'));
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json(unauthorizedResponse('密码错误'));
    }
    
    const token = generateToken(user);
    
    return res.status(200).json(successResponse(
      { user: toSafeUser(user), token },
      '登录成功'
    ));
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json(errorResponse('登录失败，请稍后重试'));
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json(unauthorizedResponse());
    }
    
    const user = memoryStore.findUserById(userId);
    
    if (!user) {
      return res.status(404).json(notFoundResponse('用户不存在'));
    }
    
    return res.status(200).json(successResponse(toSafeUser(user)));
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json(errorResponse('获取用户信息失败'));
  }
};

export default {
  register,
  login,
  getCurrentUser
};
