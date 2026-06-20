import { userRepository } from '../repositories/user.repository';
import { comparePassword, hashPassword } from '../utils/password';
import { signToken } from '../utils/token';
import { AppError } from '../middleware/error';
import type { User } from '../../../shared/types';

export const authService = {
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const userWithPassword = userRepository.findByUsername(username);
    if (!userWithPassword) {
      throw new AppError('用户名或密码错误', 401);
    }

    const isValid = await comparePassword(password, userWithPassword.passwordHash);
    if (!isValid) {
      throw new AppError('用户名或密码错误', 401);
    }

    if (userWithPassword.certificationStatus !== 'approved') {
      throw new AppError('账号尚未审核通过，请联系管理员', 403);
    }

    userRepository.updateLastLogin(userWithPassword.id);

    const token = signToken({
      userId: userWithPassword.id,
      username: userWithPassword.username,
      role: userWithPassword.role,
      outletId: userWithPassword.outletId,
    });

    const { passwordHash, ...user } = userWithPassword;
    return { token, user };
  },

  getCurrentUser(userId: string): User | null {
    return userRepository.findById(userId);
  },

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const userWithPassword = userRepository.findByUsername(
      userRepository.findById(userId)!.username
    );
    if (!userWithPassword) {
      throw new AppError('用户不存在', 404);
    }

    const isValid = await comparePassword(oldPassword, userWithPassword.passwordHash);
    if (!isValid) {
      throw new AppError('原密码错误', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('新密码长度不能少于6位', 400);
    }

    const hashedPassword = await hashPassword(newPassword);
    userRepository.update(userId, { password: hashedPassword });
  },
};
