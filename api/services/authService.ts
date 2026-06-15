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
  async login(request: LoginRequest): Promise<LoginResponse | null> {
    const user = mockUsers.find(u => u.phone === request.phone);
    if (!user) return null;

    const isValidPassword = await bcrypt.compare(request.password, await bcrypt.hash('123456', 10));
    if (!isValidPassword && request.password !== '123456' && request.password !== 'admin123') {
      return null;
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
