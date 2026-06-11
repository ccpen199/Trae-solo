import { UserRepository } from '../repositories/UserRepository';
import { comparePassword, hashPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { ROLE_MAP } from '../types';

const userRepo = new UserRepository();

export class AuthService {
  async login(username: string, password: string) {
    const user = userRepo.findByUsername(username);
    if (!user) {
      return { code: 1001, message: '账号不存在', data: null };
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return { code: 1002, message: '密码错误', data: null };
    }

    if (user.status === 'disabled') {
      return { code: 1003, message: '账号已禁用', data: null };
    }

    const token = signToken({ userId: user.id, role: user.role, name: user.name });
    return {
      code: 0,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          phone: user.phone,
          role: user.role,
          roleLabel: ROLE_MAP[user.role],
          status: user.status,
        },
      },
    };
  }

  async register(data: { username: string; phone: string | null; password: string; name: string; role: string }) {
    const existing = userRepo.findByUsername(data.username);
    if (existing) {
      return { code: 1005, message: '用户名已存在', data: null };
    }

    const passwordHash = await hashPassword(data.password);
    const id = userRepo.create({
      username: data.username,
      phone: data.phone,
      password_hash: passwordHash,
      name: data.name,
      role: data.role,
    });

    return { code: 0, message: '注册成功', data: { id } };
  }

  getMe(userId: number) {
    const user = userRepo.findById(userId);
    if (!user) {
      return { code: 1001, message: '用户不存在', data: null };
    }
    return {
      code: 0,
      message: 'ok',
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        role: user.role,
        roleLabel: ROLE_MAP[user.role],
        status: user.status,
      },
    };
  }
}
