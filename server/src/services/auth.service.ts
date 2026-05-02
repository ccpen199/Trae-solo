import { UserRole, AuditAction } from '../types/constants';
import prisma from '../lib/prisma';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { JWTPayload } from '../types';
import { createAuditLog } from '../services/audit.service';

interface RegisterParams {
  username: string;
  password: string;
  name: string;
  phone?: string;
  email?: string;
  role?: UserRole;
  agencyId?: string;
}

interface LoginParams {
  username: string;
  password: string;
}

interface LoginResult {
  user: {
    id: string;
    username: string;
    name: string;
    phone: string | null;
    email: string | null;
    role: UserRole;
    avatar: string | null;
    agencyId: string | null;
  };
  token: string;
}

export class AuthService {
  async register(params: RegisterParams): Promise<LoginResult> {
    const { username, password, name, phone, email, role = UserRole.TOURIST, agencyId } = params;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: email || undefined },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new Error('用户名已存在');
      }
      if (existingUser.email === email) {
        throw new Error('邮箱已被使用');
      }
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        phone,
        email,
        role,
        agencyId,
      },
    });

    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    const token = generateToken(payload);

    await createAuditLog({
      user: payload,
      action: AuditAction.CREATE,
      entityType: 'User',
      entityId: user.id,
      entityName: user.username,
      newValue: {
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        agencyId: user.agencyId,
      },
      token,
    };
  }

  async login(params: LoginParams): Promise<LoginResult> {
    const { username, password } = params;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    const passwordValid = await comparePassword(password, user.password);

    if (!passwordValid) {
      throw new Error('密码错误');
    }

    if (!user.isActive) {
      throw new Error('账户已被禁用');
    }

    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    const token = generateToken(payload);

    await createAuditLog({
      user: payload,
      action: AuditAction.UPDATE,
      entityType: 'User',
      entityId: user.id,
      entityName: user.username,
      changes: { login: '用户登录' },
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        agencyId: user.agencyId,
      },
      token,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        agency: true,
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      agencyId: user.agencyId,
      agency: user.agency ? {
        id: user.agency.id,
        name: user.agency.name,
        code: user.agency.code,
      } : null,
    };
  }

  async updateUser(userId: string, data: {
    name?: string;
    phone?: string;
    email?: string;
    avatar?: string;
  }) {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error('用户不存在');
    }

    if (data.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: data.email,
          id: { not: userId },
        },
      });

      if (emailExists) {
        throw new Error('邮箱已被使用');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      name: updatedUser.name,
      phone: updatedUser.phone,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      agencyId: updatedUser.agencyId,
    };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    const oldPasswordValid = await comparePassword(oldPassword, user.password);

    if (!oldPasswordValid) {
      throw new Error('原密码错误');
    }

    const newHashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: newHashedPassword },
    });

    return true;
  }
}

export const authService = new AuthService();
