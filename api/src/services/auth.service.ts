import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserRepository } from '../repositories/user.repository';
import type { User, LoginRequest, RegisterRequest, LoginResponse } from '@shared/types';

export class AuthService {
  private userRepository = new UserRepository();

  async login(data: LoginRequest): Promise<LoginResponse> {
    let user;
    
    if (data.email) {
      user = this.userRepository.findByEmail(data.email);
      if (!user) {
        throw new Error('邮箱或密码错误');
      }
    } else if (data.username) {
      user = this.userRepository.findByUsername(data.username);
      if (!user) {
        throw new Error('用户名或密码错误');
      }
    } else {
      throw new Error('请提供邮箱或用户名');
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    
    if (!isValid) {
      throw new Error('密码错误');
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  async register(data: RegisterRequest): Promise<User> {
    const existingUser = this.userRepository.findByUsername(data.username);
    
    if (existingUser) {
      throw new Error('用户名已存在');
    }

    const existingEmail = this.userRepository.findByEmail(data.email);
    
    if (existingEmail) {
      throw new Error('邮箱已被注册');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    return this.userRepository.create({
      username: data.username,
      email: data.email,
      passwordHash,
    });
  }

  getCurrentUser(userId: number): User | null {
    return this.userRepository.findById(userId);
  }

  getAllUsers(): User[] {
    return this.userRepository.findAll();
  }
}
