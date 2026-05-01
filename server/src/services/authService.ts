import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Not } from 'typeorm';
import { AppDataSource } from '../database/dataSource';
import { UserEntity } from '../entities';
import { User, UserRole, AuditAction } from '../types';
import config from '../config';
import { auditService } from './auditService';

export interface LoginResult {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  error?: string;
}

export interface RegisterResult {
  success: boolean;
  user?: User;
  error?: string;
}

export class AuthService {
  private static instance: AuthService;
  private readonly saltRounds = 10;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(
    username: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResult> {
    const userRepository = AppDataSource.getRepository(UserEntity);
    
    const cleanUsername = username.trim();
    console.log('[Login Debug] Searching for username:', `[${cleanUsername}]`);
    
    const allUsers = await userRepository.find();
    console.log('[Login Debug] All users in DB:', allUsers.map(u => ({
      id: u.id,
      username: `[${u.username}]`,
      email: u.email,
      role: u.role
    })));
    
    const user = await userRepository.findOne({
      where: [
        { username: cleanUsername },
        { email: cleanUsername }
      ]
    });
    
    console.log('[Login Debug] Found user:', user ? `Found: ${user.username} (${user.role})` : 'NOT FOUND');
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    if (!user.isActive) {
      return { success: false, error: 'User account is disabled' };
    }
    
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      return { success: false, error: 'Invalid password' };
    }
    
    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);
    
    user.lastLoginAt = new Date();
    user.updatedAt = new Date();
    await userRepository.save(user);
    
    await auditService.log({
      action: AuditAction.LOGIN,
      userId: user.id,
      userRole: user.role,
      resourceType: 'user',
      resourceId: user.id,
      details: {
        username: user.username,
        email: user.email
      },
      ipAddress,
      userAgent
    });
    
    return {
      success: true,
      user: this.toUserDto(user),
      token,
      refreshToken
    };
  }

  async register(
    username: string,
    email: string,
    password: string,
    role: UserRole = UserRole.CUSTOMER,
    storeId?: string
  ): Promise<RegisterResult> {
    const userRepository = AppDataSource.getRepository(UserEntity);
    
    const existingUser = await userRepository.findOne({
      where: [
        { username },
        { email }
      ]
    });
    
    if (existingUser) {
      return {
        success: false,
        error: 'User with this username or email already exists'
      };
    }
    
    const passwordHash = await bcrypt.hash(password, this.saltRounds);
    
    const user = userRepository.create({
      username,
      email,
      passwordHash,
      role,
      storeId,
      isActive: true
    });
    
    await userRepository.save(user);
    
    return {
      success: true,
      user: this.toUserDto(user)
    };
  }

  async validateToken(token: string): Promise<{ valid: boolean; user?: User; error?: string }> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: string; role: UserRole };
      
      const userRepository = AppDataSource.getRepository(UserEntity);
      const user = await userRepository.findOne({ where: { id: decoded.userId } });
      
      if (!user) {
        return { valid: false, error: 'User not found' };
      }
      
      if (!user.isActive) {
        return { valid: false, error: 'User account is disabled' };
      }
      
      return { valid: true, user: this.toUserDto(user) };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { valid: false, error: 'Token expired' };
      }
      return { valid: false, error: 'Invalid token' };
    }
  }

  async refreshToken(refreshToken: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as { userId: string; isRefresh: boolean };
      
      if (!decoded.isRefresh) {
        return { success: false, error: 'Invalid refresh token' };
      }
      
      const userRepository = AppDataSource.getRepository(UserEntity);
      const user = await userRepository.findOne({ where: { id: decoded.userId } });
      
      if (!user || !user.isActive) {
        return { success: false, error: 'User not found or disabled' };
      }
      
      const newToken = this.generateToken(user);
      
      return { success: true, token: newToken };
    } catch (error) {
      return { success: false, error: 'Invalid or expired refresh token' };
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    const userRepository = AppDataSource.getRepository(UserEntity);
    const user = await userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      return null;
    }
    
    return this.toUserDto(user);
  }

  async listUsers(filters: {
    role?: UserRole;
    isActive?: boolean;
    storeId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; total: number; page: number; limit: number; totalPages: number }> {
    const userRepository = AppDataSource.getRepository(UserEntity);
    const queryBuilder = userRepository.createQueryBuilder('user');
    
    if (filters.role) {
      queryBuilder.andWhere('user.role = :role', { role: filters.role });
    }
    
    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: filters.isActive });
    }
    
    if (filters.storeId) {
      queryBuilder.andWhere('user.storeId = :storeId', { storeId: filters.storeId });
    }
    
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    
    const [users, total] = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    
    return {
      users: users.map(u => this.toUserDto(u)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async updateUser(
    userId: string,
    updates: {
      email?: string;
      isActive?: boolean;
      role?: UserRole;
      storeId?: string;
    },
    updatedBy: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const userRepository = AppDataSource.getRepository(UserEntity);
    const user = await userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    if (updates.email) {
      const existingUser = await userRepository.findOne({
        where: { 
          email: updates.email,
          id: Not(userId)
        }
      });
      
      if (existingUser) {
        return { success: false, error: 'Email already in use' };
      }
      
      user.email = updates.email;
    }
    
    if (updates.isActive !== undefined) {
      user.isActive = updates.isActive;
    }
    
    if (updates.role) {
      user.role = updates.role;
    }
    
    if (updates.storeId !== undefined) {
      user.storeId = updates.storeId;
    }
    
    user.updatedAt = new Date();
    await userRepository.save(user);
    
    return { success: true, user: this.toUserDto(user) };
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    const userRepository = AppDataSource.getRepository(UserEntity);
    const user = await userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    const isValidOldPassword = await bcrypt.compare(oldPassword, user.passwordHash);
    
    if (!isValidOldPassword) {
      return { success: false, error: 'Invalid current password' };
    }
    
    user.passwordHash = await bcrypt.hash(newPassword, this.saltRounds);
    user.updatedAt = new Date();
    
    await userRepository.save(user);
    
    return { success: true };
  }

  private generateToken(user: UserEntity): string {
    return jwt.sign(
      {
        userId: user.id,
        role: user.role,
        username: user.username
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  private generateRefreshToken(user: UserEntity): string {
    return jwt.sign(
      {
        userId: user.id,
        isRefresh: true
      },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  }

  private toUserDto(user: UserEntity): User {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      passwordHash: '',
      role: user.role,
      storeId: user.storeId,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}

export const authService = AuthService.getInstance();
