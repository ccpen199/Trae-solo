import { Request, Response } from 'express';
import { UpdateProfileRequest, SearchUsersRequest, UserWithProfile } from '../types';
import { successResponse, errorResponse, notFoundResponse } from '../utils/response';
import { memoryStore } from '../models/memoryStore';

interface SafeUser extends Omit<UserWithProfile, 'password'> {}

const toSafeUser = (user: UserWithProfile): SafeUser => {
  const { password, ...safeUser } = user;
  return safeUser;
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json(errorResponse('未授权', 401));
    }
    
    const user = memoryStore.findUserById(userId);
    
    if (!user) {
      return res.status(404).json(notFoundResponse('用户不存在'));
    }
    
    return res.status(200).json(successResponse(toSafeUser(user)));
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json(errorResponse('获取用户信息失败'));
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json(errorResponse('未授权', 401));
    }
    
    const updates: UpdateProfileRequest = req.body;
    
    if (updates.age !== undefined && (updates.age < 1 || updates.age > 150)) {
      return res.status(400).json(errorResponse('年龄必须在1-150之间'));
    }
    
    if (updates.nickname !== undefined) {
      if (updates.nickname.trim().length < 1 || updates.nickname.trim().length > 20) {
        return res.status(400).json(errorResponse('昵称长度应在1-20个字符之间'));
      }
    }
    
    if (updates.signature !== undefined && updates.signature.length > 100) {
      return res.status(400).json(errorResponse('个性签名长度不能超过100个字符'));
    }
    
    const user = memoryStore.updateUser(userId, {
      ...(updates.nickname && { nickname: updates.nickname.trim() }),
      ...(updates.avatar && { avatar: updates.avatar }),
      ...(updates.gender && { gender: updates.gender }),
      ...(updates.age !== undefined && { age: updates.age }),
      ...(updates.signature !== undefined && { signature: updates.signature }),
      ...(updates.allowAddFriend !== undefined && { allowAddFriend: updates.allowAddFriend }),
      ...(updates.needVerification !== undefined && { needVerification: updates.needVerification })
    });
    
    if (!user) {
      return res.status(404).json(notFoundResponse('用户不存在'));
    }
    
    return res.status(200).json(successResponse(toSafeUser(user), '资料更新成功'));
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json(errorResponse('更新资料失败'));
  }
};

export const getUserByQQ = async (req: Request, res: Response) => {
  try {
    const { qqNumber } = req.params;
    
    if (!qqNumber || !/^\d{5,10}$/.test(qqNumber)) {
      return res.status(400).json(errorResponse('QQ号格式不正确'));
    }
    
    const user = memoryStore.findUserByQQNumber(qqNumber);
    
    if (!user) {
      return res.status(404).json(notFoundResponse('用户不存在'));
    }
    
    return res.status(200).json(successResponse(toSafeUser(user)));
  } catch (error) {
    console.error('Get user by QQ error:', error);
    return res.status(500).json(errorResponse('获取用户信息失败'));
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { qqNumber, nickname, age, gender, page = 1, pageSize = 20 }: SearchUsersRequest = req.query as unknown as SearchUsersRequest;
    const currentUserId = req.user?.userId;
    
    const users = memoryStore.searchUsers({
      qqNumber,
      nickname,
      age: age !== undefined ? parseInt(age as unknown as string, 10) : undefined,
      gender,
      excludeUserId: currentUserId
    });
    
    const pageNum = parseInt(page as unknown as string, 10) || 1;
    const size = parseInt(pageSize as unknown as string, 10) || 20;
    const start = (pageNum - 1) * size;
    const end = start + size;
    
    const paginatedUsers = users.slice(start, end).map(toSafeUser);
    
    return res.status(200).json(successResponse({
      users: paginatedUsers,
      total: users.length,
      page: pageNum,
      pageSize: size
    }));
  } catch (error) {
    console.error('Search users error:', error);
    return res.status(500).json(errorResponse('搜索用户失败'));
  }
};

export const getOnlineStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json(errorResponse('用户ID不能为空'));
    }
    
    const isOnline = memoryStore.isOnline(userId);
    
    return res.status(200).json(successResponse({ userId, isOnline }));
  } catch (error) {
    console.error('Get online status error:', error);
    return res.status(500).json(errorResponse('获取在线状态失败'));
  }
};

export default {
  getProfile,
  updateProfile,
  getUserByQQ,
  searchUsers,
  getOnlineStatus
};
