import type { User } from '@shared/types/index.js';
import { mockUsers } from '@shared/mock/data.js';
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
  static async login(email: string, password: string): Promise<{ user: User; token: string }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      throw new Error('用户不存在');
    }
    
    const token = user.id;
    return { user, token };
  }
  
  static async register(userData: Partial<User> & { password: string }): Promise<{ user: User; token: string }> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
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
