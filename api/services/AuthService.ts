import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth';
import { userRepository } from '../repositories/UserRepository';
import type { User, LoginResponse } from '../../shared/types';

export interface LoginResult {
  success: boolean;
  message: string;
  data?: LoginResponse;
}

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async login(username: string, password: string): Promise<LoginResult> {
    const user = await userRepository.findByUsernameWithPassword(username);
    
    if (!user) {
      return { success: false, message: '用户名或密码错误' };
    }

    if (user.status !== 'active') {
      return { success: false, message: '账号已被禁用，请联系管理员' };
    }

    const isPasswordValid = await this.comparePassword(password, user.password_hash);
    
    if (!isPasswordValid) {
      return { success: false, message: '用户名或密码错误' };
    }

    await userRepository.updateLastLogin(user.id);

    const { token, refreshToken } = generateToken(user.id);
    const permissions = await userRepository.getUserPermissionCodes(user.id);

    const { password_hash, ...userWithoutPassword } = user;

    return {
      success: true,
      message: '登录成功',
      data: {
        token,
        refreshToken,
        user: userWithoutPassword,
        permissions,
      },
    };
  }

  async refreshToken(userId: string): Promise<LoginResult> {
    const user = await userRepository.findById(userId);
    
    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    if (user.status !== 'active') {
      return { success: false, message: '账号已被禁用，请联系管理员' };
    }

    const { token, refreshToken } = generateToken(userId);
    const permissions = await userRepository.getUserPermissionCodes(userId);

    return {
      success: true,
      message: '刷新成功',
      data: {
        token,
        refreshToken,
        user,
        permissions,
      },
    };
  }

  async getCurrentUser(userId: string): Promise<{ user: User; permissions: string[] } | null> {
    const user = await userRepository.findById(userId);
    if (!user) return null;

    const permissions = await userRepository.getUserPermissionCodes(userId);
    return { user, permissions };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const user = await userRepository.findByIdWithPassword(userId);
    
    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    const isOldPasswordValid = await this.comparePassword(oldPassword, user.password_hash);
    
    if (!isOldPasswordValid) {
      return { success: false, message: '原密码错误' };
    }

    const newPasswordHash = await this.hashPassword(newPassword);
    await userRepository.updatePassword(userId, newPasswordHash);

    return { success: true, message: '密码修改成功' };
  }

  async createUser(userData: {
    username: string;
    password: string;
    realName: string;
    email: string;
    phone: string;
    role: User['role'];
    organization: string;
    avatar?: string;
  }): Promise<{ success: boolean; message: string; user?: User }> {
    const existingUser = await userRepository.findByUsername(userData.username);
    
    if (existingUser) {
      return { success: false, message: '用户名已存在' };
    }

    const password_hash = await this.hashPassword(userData.password);
    const user = await userRepository.create({
      ...userData,
      password_hash,
    });

    return { success: true, message: '用户创建成功', user };
  }
}

export const authService = new AuthService();
