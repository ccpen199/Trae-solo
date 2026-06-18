import prisma from '../config/prisma';
import { hash, compare } from '../utils/password';
import { sign } from '../utils/jwt';
import logger from '../utils/logger';

export interface RegisterParams {
  phone: string;
  password: string;
  nickname?: string;
}

export interface LoginParams {
  phone: string;
  password: string;
}

export interface UpdateUserParams {
  nickname?: string;
  avatar?: string;
  vin?: string;
  plateNumber?: string;
  realName?: string;
  idCard?: string;
}

export const register = async (params: RegisterParams) => {
  const { phone, password, nickname } = params;

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    throw new Error('手机号已注册');
  }

  const hashedPassword = await hash(password);

  const user = await prisma.user.create({
    data: {
      phone,
      password: hashedPassword,
      nickname: nickname || `用户${phone.slice(-4)}`,
    },
  });

  await prisma.userProfile.create({
    data: {
      userId: user.id,
    },
  });

  const token = sign({ userId: user.id, phone: user.phone });

  return {
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      vipLevel: user.vipLevel,
      balance: user.balance,
    },
    token,
  };
};

export const login = async (params: LoginParams) => {
  const { phone, password } = params;

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    throw new Error('用户不存在');
  }

  const isPasswordValid = await compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('密码错误');
  }

  const token = sign({ userId: user.id, phone: user.phone });

  return {
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      vipLevel: user.vipLevel,
      balance: user.balance,
    },
    token,
  };
};

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    throw new Error('用户不存在');
  }

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const updateUser = async (userId: string, params: UpdateUserParams) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: params,
  });

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const getProfile = async (userId: string) => {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return prisma.userProfile.create({
      data: { userId },
    });
  }

  return profile;
};

export default {
  register,
  login,
  getUserById,
  updateUser,
  getProfile,
};
