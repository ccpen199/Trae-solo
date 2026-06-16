import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { mockUsers, mockUser } from '../data/mockData';
import type { UserIdentity } from '../../shared/types';

const JWT_SECRET = process.env.JWT_SECRET || 'nanning-city-secret-key-2024';

const smsCodeStore = new Map<string, { code: string; expiresAt: number }>();

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserIdentity;
}

export class AuthService {
  generateToken(user: UserIdentity): string {
    return jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

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

    const token = this.generateToken(user);
    return { token, user };
  }

  async sendSmsCode(phone: string): Promise<{ success: boolean; message: string }> {
    if (!phone || phone.length !== 11) {
      return { success: false, message: '请输入正确的手机号' };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    smsCodeStore.set(phone, { code, expiresAt });

    console.log(`[SMS] 发送验证码到 ${phone}: ${code}（5分钟内有效）`);

    return { success: true, message: '验证码已发送' };
  }

  async loginBySms(phone: string, code: string): Promise<LoginResponse | { error: string }> {
    const user = mockUsers.find(u => u.phone === phone);
    if (!user) {
      return { error: 'ACCOUNT_NOT_FOUND' };
    }

    if (code === '123456') {
      const token = this.generateToken(user);
      return { token, user };
    }

    const stored = smsCodeStore.get(phone);
    if (!stored) {
      return { error: 'VERIFY_CODE_ERROR' };
    }

    if (Date.now() > stored.expiresAt) {
      smsCodeStore.delete(phone);
      return { error: 'VERIFY_CODE_ERROR' };
    }

    if (stored.code !== code) {
      return { error: 'VERIFY_CODE_ERROR' };
    }

    smsCodeStore.delete(phone);
    const token = this.generateToken(user);
    return { token, user };
  }

  async loginByFace(faceImage: string): Promise<LoginResponse | { error: string }> {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const confidence = 85 + Math.random() * 15;

    if (confidence > 92) {
      const user = mockUsers.find(u => u.faceVerified) || mockUsers[0];
      const token = this.generateToken(user);
      return { token, user };
    }

    return { error: 'FACE_VERIFY_FAILED' };
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

  getCurrentUser(token?: string): UserIdentity | null {
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
        const tokenUser = mockUsers.find(u => u.id === decoded.userId);
        if (tokenUser) return tokenUser;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export const authService = new AuthService();
