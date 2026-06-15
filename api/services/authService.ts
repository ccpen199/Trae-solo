import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { mockUsers, mockUser } from '../data/mockData';
import type { UserIdentity } from '../../shared/types';

const JWT_SECRET = process.env.JWT_SECRET || 'nanning-city-secret-key-2024';

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserIdentity;
}

export class AuthService {
  async login(request: LoginRequest): Promise<LoginResponse | { error: string }> {
    const user = mockUsers.find(u => u.phone === request.phone);
    if (!user) {
      return { error: 'ACCOUNT_NOT_FOUND' };
    }

    const validPasswords = user.role === 'admin' 
      ? ['admin123', '123456'] 
      : ['123456', 'admin123'];

    if (!validPasswords.includes(request.password)) {
      return { error: 'PASSWORD_ERROR' };
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return { token, user };
  }

  async verifyToken(token: string): Promise<UserIdentity | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
      const user = mockUsers.find(u => u.id === decoded.userId);
      return user || null;
    } catch {
      return null;
    }
  }

  async faceVerify(faceImage: string): Promise<{ verified: boolean; confidence: number }> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const confidence = 85 + Math.random() * 15;
    return {
      verified: confidence > 90,
      confidence: Math.round(confidence * 100) / 100,
    };
  }

  getCurrentUser(): UserIdentity {
    return mockUser;
  }
}

export const authService = new AuthService();
