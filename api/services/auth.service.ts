import type { User, LoginResult, AuthErrorCode } from '@shared/types/index.js';
import { AuthError } from '@shared/types/index.js';
import { mockUsers, mockUserPasswords } from '@shared/mock/data.js';
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
  private static findUserByEmailOrPhone(loginId: string): User | undefined {
    return mockUsers.find(
      u => u.email === loginId || u.phone === loginId
    );
  }

  private static verifyPassword(userId: string, password: string): boolean {
    const storedPassword = mockUserPasswords[userId];
    return storedPassword === password;
  }

  static async login(
    loginId: string, password: string, expectedRole?: string): Promise<LoginResult> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = this.findUserByEmailOrPhone(loginId);
    
    if (!user) {
      throw new AuthError('账号不存在，请检查您的邮箱或手机号', 'USER_NOT_FOUND');
    }
    
    if (!this.verifyPassword(user.id, password)) {
      throw new AuthError('密码错误，请重新输入', 'INVALID_PASSWORD');
    }
    
    if (expectedRole && user.role !== expectedRole) {
      const roleLabel = expectedRole === 'hr' ? 'HR' : expectedRole === 'admin' ? '管理员' : '求职者';
      throw new AuthError(`该账号不是${roleLabel}账号，请选择正确的登录角色`, 'ROLE_MISMATCH');
    }
    
    const token = user.id;
    return { user, token };
  }
  
  static async register(userData: Partial<User> & { password: string }): Promise<LoginResult> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const existingUser = this.findUserByEmailOrPhone(userData.email || '');
    if (existingUser) {
      throw new AuthError('该邮箱已被注册', 'USER_NOT_FOUND');
    }
    
    const newUser: User = {
      id: uuidv4(),
      role: userData.role || 'talent',
      name: userData.name || '',
      email: userData.email || '',
      phone: userData.phone || '',
      avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uuidv4()}`,
      companyId: userData.companyId,
    };
    
    mockUsers.push(newUser);
    mockUserPasswords[newUser.id] = userData.password;
    
    return { user: newUser, token: newUser.id };
  }
  
  static async getCurrentUser(token: string): Promise<User | null> {
    const user = mockUsers.find(u => u.id === token);
    return user || null;
  }
  
  static async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}
