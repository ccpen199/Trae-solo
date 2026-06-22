import { Router } from 'express';
import { db } from '../data/database';
import { asyncHandler, getAuthUserId } from '../middleware';
import { RiskControlEngine } from '../core/riskControlEngine';
import type { UserCreateInput } from '../types';

const router = Router();

router.get('/me', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const user = db.users.get(userId);
  if (!user) {
    res.status(404);
    res.locals.error = { code: 'USER_NOT_FOUND', message: '用户不存在' };
    return res.json(null);
  }
  const riskLevel = RiskControlEngine.getUserRiskLevel(userId);
  return res.json({ ...user, riskLevel });
}));

router.get('/:id', asyncHandler((req, res) => {
  const user = db.users.get(req.params.id);
  if (!user) {
    res.status(404);
    res.locals.error = { code: 'USER_NOT_FOUND', message: '用户不存在' };
    return res.json(null);
  }
  const { phone, verification, email, emergencyContact, ...safeUser } = user;
  void phone; void verification; void email; void emergencyContact;
  const profile = {
    ...safeUser,
    showRealName: user.privacySettings.showRealName,
    showEducation: user.privacySettings.showEducation,
    showCareer: user.privacySettings.showCareer,
    showLocation: user.privacySettings.showLocation
  };
  return res.json(profile);
}));

router.post('/', asyncHandler((req, res) => {
  const input = req.body as UserCreateInput;
  const existing = Array.from(db.users.values()).find(u => u.phone === input.phone);
  if (existing) {
    res.status(400);
    res.locals.error = { code: 'PHONE_EXISTS', message: '手机号已注册' };
    return res.json(null);
  }
  const userId = db.generateId();
  const now = new Date();
  const user = {
    id: userId,
    nickname: input.nickname,
    avatar: input.avatar,
    gender: input.gender,
    age: input.age,
    bio: input.bio || '',
    phone: input.phone,
    email: undefined,
    location: { ...input.location, lastUpdated: now },
    verification: {
      realName: '***',
      idCardLast4: '0000',
      verifiedAt: null,
      verified: false,
      faceVerified: false
    },
    education: input.education,
    career: input.career,
    interestTags: input.interestTags || [],
    creditScore: 700,
    creditRecords: [{
      id: db.generateId(),
      type: 'initial_score',
      scoreChange: 700,
      reason: '初始信用分',
      createdAt: now
    }],
    emergencyContact: input.emergencyContact,
    privacySettings: {
      showRealName: false,
      showEducation: true,
      showCareer: true,
      showLocation: true,
      allowMatch: true
    },
    createdAt: now,
    lastActiveAt: now
  };
  db.users.set(userId, user);
  return res.json(user);
}));

router.put('/:id', asyncHandler((req, res) => {
  const userId = req.params.id;
  const user = db.users.get(userId);
  if (!user) {
    res.status(404);
    res.locals.error = { code: 'USER_NOT_FOUND', message: '用户不存在' };
    return res.json(null);
  }
  const updates = req.body as Partial<typeof user>;
  if (updates.interestTags) user.interestTags = updates.interestTags;
  if (updates.bio !== undefined) user.bio = updates.bio;
  if (updates.nickname) user.nickname = updates.nickname;
  if (updates.avatar) user.avatar = updates.avatar;
  if (updates.location) user.location = { ...updates.location, lastUpdated: new Date() };
  if (updates.privacySettings) user.privacySettings = { ...user.privacySettings, ...updates.privacySettings };
  if (updates.emergencyContact) user.emergencyContact = updates.emergencyContact;
  user.lastActiveAt = new Date();
  return res.json(user);
}));

router.get('/:id/credit-records', asyncHandler((req, res) => {
  const user = db.users.get(req.params.id);
  if (!user) {
    res.status(404);
    res.locals.error = { code: 'USER_NOT_FOUND', message: '用户不存在' };
    return res.json(null);
  }
  const records = user.creditRecords
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50);
  return res.json({ score: user.creditScore, records });
}));

router.get('/search/list', asyncHandler((req, res) => {
  const keyword = (req.query.keyword as string || '').toLowerCase();
  const city = req.query.city as string;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  let users = Array.from(db.users.values());
  if (city) users = users.filter(u => u.location.city === city);
  if (keyword) {
    users = users.filter(u =>
      u.nickname.toLowerCase().includes(keyword) ||
      u.interestTags.some(t => t.toLowerCase().includes(keyword)) ||
      u.education.school.toLowerCase().includes(keyword) ||
      u.career.industry.toLowerCase().includes(keyword)
    );
  }
  users.sort((a, b) => b.creditScore - a.creditScore);
  const total = users.length;
  const items = users.slice((page - 1) * pageSize, page * pageSize).map(u => {
    const { phone, verification, email, emergencyContact, ...safe } = u;
    void phone; void verification; void email; void emergencyContact;
    return safe;
  });
  return res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize), hasMore: page * pageSize < total });
}));

export default router;
