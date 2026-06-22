import { Router } from 'express';
import { MatchingAlgorithm } from '../core/matchingAlgorithm';
import { db } from '../data/database';
import { asyncHandler, getAuthUserId } from '../middleware';
import type { MatchCriteria, MutualMatch } from '../types';

const router = Router();

router.post('/', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const criteria: MatchCriteria = { ...req.body, userId };
  const history = MatchingAlgorithm.findMatches(criteria);
  const resultsWithUsers = history.results.map(r => {
    const user = db.users.get(r.targetUserId);
    if (!user) return null;
    return {
      ...r,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        age: user.age,
        gender: user.gender,
        city: user.location.city,
        school: user.education.school,
        industry: user.career.industry,
        position: user.career.position,
        interests: user.interestTags,
        creditScore: user.creditScore,
        verified: user.verification.verified,
        bio: user.bio
      }
    };
  }).filter(Boolean);
  return res.json({ ...history, results: resultsWithUsers });
}));

router.post('/quick', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const user = db.users.get(userId);
  if (!user) {
    res.status(404);
    res.locals.error = { code: 'NOT_FOUND', message: '用户不存在' };
    return res.json(null);
  }
  const criteria: MatchCriteria = {
    userId,
    location: { city: user.location.city, radiusKm: 50 },
    ageRange: { min: Math.max(18, user.age - 5), max: user.age + 5 },
    gender: user.gender === 'male' ? 'female' : user.gender === 'female' ? 'male' : 'any',
    interestTags: user.interestTags,
    minCreditScore: 600,
    verifiedOnly: true,
    maxMatches: 20
  };
  const history = MatchingAlgorithm.findMatches(criteria);
  const resultsWithUsers = history.results.map(r => {
    const u = db.users.get(r.targetUserId);
    if (!u) return null;
    return {
      ...r,
      user: {
        id: u.id,
        nickname: u.nickname,
        avatar: u.avatar,
        age: u.age,
        gender: u.gender,
        city: u.location.city,
        school: u.education.school,
        industry: u.career.industry,
        interests: u.interestTags,
        creditScore: u.creditScore,
        verified: u.verification.verified,
        bio: u.bio
      }
    };
  }).filter(Boolean);
  return res.json({ ...history, results: resultsWithUsers });
}));

router.post('/mutual/:targetUserId/like', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const targetId = req.params.targetUserId;
  if (!db.users.get(targetId)) {
    res.status(404);
    res.locals.error = { code: 'NOT_FOUND', message: '目标用户不存在' };
    return res.json(null);
  }
  const pair = [userId, targetId].sort();
  let mutual = Array.from(db.mutualMatches.values()).find(
    m => [m.userA, m.userB].sort().join(',') === pair.join(',')
  );
  if (!mutual) {
    mutual = {
      id: db.generateId(),
      userA: pair[0],
      userB: pair[1],
      userALiked: false,
      userBLiked: false,
      matched: false,
      createdAt: new Date()
    };
    db.mutualMatches.set(mutual.id, mutual);
  }
  if (userId === mutual.userA) mutual.userALiked = true;
  else mutual.userBLiked = true;
  if (mutual.userALiked && mutual.userBLiked && !mutual.matched) {
    mutual.matched = true;
    mutual.matchedAt = new Date();
  }
  return res.json({
    ...mutual,
    isMutualMatch: mutual.matched
  });
}));

router.get('/mutual/list', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const list = Array.from(db.mutualMatches.values())
    .filter(m => (m.userA === userId || m.userB === userId) && m.matched)
    .map(m => {
      const otherId = m.userA === userId ? m.userB : m.userA;
      const user = db.users.get(otherId);
      return {
        matchId: m.id,
        matchedAt: m.matchedAt,
        user: user ? {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          age: user.age,
          city: user.location.city,
          school: user.education.school,
          creditScore: user.creditScore
        } : null
      };
    });
  return res.json(list);
}));

router.get('/history', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const histories = Array.from(db.matchHistories.values())
    .filter(h => h.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);
  return res.json(histories);
}));

export default router;
