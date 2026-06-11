import { db, generateId, now } from '../data/database';
import type { User, Role, Permission, UserRole, PageResponse } from '../../shared/types';

export interface UserWithPassword extends User {
  password_hash: string;
}

export interface UserQueryParams {
  page?: number;
  pageSize?: number;
  role?: UserRole;
  status?: 'active' | 'inactive' | 'pending';
  keyword?: string;
}

export interface CreateUserParams {
  username: string;
  password_hash: string;
  realName: string;
  email: string;
  phone: string;
  role: UserRole;
  organization: string;
  avatar?: string;
}

export class UserRepository {
  async findById(id: string): Promise<User | undefined> {
    const user = db.users.get(id) as UserWithPassword | undefined;
    if (!user) return undefined;
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByIdWithPassword(id: string): Promise<UserWithPassword | undefined> {
    return db.users.get(id) as UserWithPassword | undefined;
  }

  async findByUsername(username: string): Promise<User | undefined> {
    const users = Array.from(db.users.values()) as UserWithPassword[];
    const user = users.find(u => u.username === username);
    if (!user) return undefined;
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByUsernameWithPassword(username: string): Promise<UserWithPassword | undefined> {
    const users = Array.from(db.users.values()) as UserWithPassword[];
    return users.find(u => u.username === username);
  }

  async findAll(params: UserQueryParams = {}): Promise<PageResponse<User>> {
    const { page = 1, pageSize = 10, role, status, keyword } = params;
    
    let users = Array.from(db.users.values()) as UserWithPassword[];

    if (role) {
      users = users.filter(u => u.role === role);
    }
    if (status) {
      users = users.filter(u => u.status === status);
    }
    if (keyword) {
      const kw = keyword.toLowerCase();
      users = users.filter(u => 
        u.username.toLowerCase().includes(kw) || 
        u.realName.toLowerCase().includes(kw) ||
        u.email.toLowerCase().includes(kw) ||
        u.phone.includes(kw)
      );
    }

    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = users.length;
    const start = (page - 1) * pageSize;
    const list = users.slice(start, start + pageSize).map(({ password_hash, ...user }) => user);

    return { list, total, page, pageSize };
  }

  async create(userData: CreateUserParams): Promise<User> {
    const user: UserWithPassword = {
      id: generateId(),
      username: userData.username,
      password_hash: userData.password_hash,
      realName: userData.realName,
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      organization: userData.organization,
      avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
      status: 'active',
      createdAt: now(),
      lastLoginAt: now(),
    };
    db.users.set(user.id, user as any);
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async update(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = db.users.get(id) as UserWithPassword | undefined;
    if (!user) return undefined;

    const updated: UserWithPassword = {
      ...user,
      ...updates,
    };
    db.users.set(id, updated as any);
    const { password_hash, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  async updatePassword(id: string, password_hash: string): Promise<boolean> {
    const user = db.users.get(id) as UserWithPassword | undefined;
    if (!user) return false;

    user.password_hash = password_hash;
    db.users.set(id, user as any);
    return true;
  }

  async delete(id: string): Promise<boolean> {
    return db.users.delete(id);
  }

  async updateStatus(id: string, status: 'active' | 'inactive' | 'pending'): Promise<User | undefined> {
    return this.update(id, { status });
  }

  async updateLastLogin(id: string): Promise<void> {
    const user = db.users.get(id) as UserWithPassword | undefined;
    if (user) {
      user.lastLoginAt = now();
      db.users.set(id, user as any);
    }
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const roleIds = db.userRoles.get(userId) || [];
    const roles: Role[] = [];
    for (const roleId of roleIds) {
      const role = db.roles.get(roleId);
      if (role) roles.push(role);
    }
    return roles;
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const roleIds = db.userRoles.get(userId) || [];
    const permissionIds: string[] = [];
    
    for (const roleId of roleIds) {
      const perms = db.rolePermissions.get(roleId) || [];
      permissionIds.push(...perms);
    }
    
    const uniquePermissionIds = [...new Set(permissionIds)];
    const permissions: Permission[] = [];
    
    for (const permId of uniquePermissionIds) {
      const perm = db.permissions.get(permId);
      if (perm) permissions.push(perm);
    }
    
    return permissions;
  }

  async getUserPermissionCodes(userId: string): Promise<string[]> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.map(p => p.code);
  }

  async assignRole(userId: string, roleId: string): Promise<boolean> {
    const user = db.users.get(userId);
    const role = db.roles.get(roleId);
    
    if (!user || !role) return false;
    
    const roleIds = db.userRoles.get(userId) || [];
    if (!roleIds.includes(roleId)) {
      roleIds.push(roleId);
      db.userRoles.set(userId, roleIds);
    }
    return true;
  }

  async removeRole(userId: string, roleId: string): Promise<boolean> {
    const roleIds = db.userRoles.get(userId) || [];
    const index = roleIds.indexOf(roleId);
    if (index > -1) {
      roleIds.splice(index, 1);
      db.userRoles.set(userId, roleIds);
      return true;
    }
    return false;
  }
}

export const userRepository = new UserRepository();
