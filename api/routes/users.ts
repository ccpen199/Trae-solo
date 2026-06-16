import { Router } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/auth.ts';
import { 
  findUserById, 
  updateUserProfile, 
  followUser, 
  unfollowUser, 
  isFollowing,
  getCreators,
  searchUsers,
} from '../services/userService.ts';
import { success, error, paginatedSuccess, parsePagination } from '../utils/response.ts';

const router = Router();

const localAdminProfile = {
  id: 'local-admin',
  username: 'admin',
  avatar: '',
  role: 'admin',
  bio: 'SkillVerse 本地演示管理员，负责课程审核、订单管理、财务看板和平台治理。',
  followerCount: 0,
  followingCount: 0,
  rating: 5,
  verified: true,
  location: '本地演示',
  createdAt: new Date().toISOString(),
};

router.get('/creators', (req, res) => {
  const { page, pageSize, offset } = parsePagination(req.query);
  const { category } = req.query;
  
  const result = getCreators(page, pageSize, category as string);
  return paginatedSuccess(res, result.items, result.total, page, pageSize);
});

router.get('/search', (req, res) => {
  const { page, pageSize } = parsePagination(req.query);
  const { keyword } = req.query;
  
  if (!keyword) {
    return error(res, '搜索关键词不能为空', 400, 400);
  }
  
  const result = searchUsers(keyword as string, page, pageSize);
  return paginatedSuccess(res, result.items, result.total, page, pageSize);
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  if (id === 'local-admin') {
    return success(res, localAdminProfile);
  }

  const user = findUserById(id);
  
  if (!user) {
    return error(res, '用户不存在', 404, 404);
  }
  
  return success(res, user);
});

router.put('/profile', authMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const user = updateUserProfile(req.userId, req.body);
  return success(res, user, '更新成功');
});

router.post('/:id/follow', authMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const { id } = req.params;
  if (req.userId === id) {
    return error(res, '不能关注自己', 400, 400);
  }
  
  const result = followUser(req.userId, id);
  if (result) {
    return success(res, { following: true }, '关注成功');
  }
  return success(res, { following: true }, '已关注');
});

router.delete('/:id/follow', authMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const { id } = req.params;
  unfollowUser(req.userId, id);
  return success(res, { following: false }, '取消关注成功');
});

router.get('/:id/follow-status', authMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const { id } = req.params;
  const following = isFollowing(req.userId, id);
  return success(res, { following });
});

export default router;
