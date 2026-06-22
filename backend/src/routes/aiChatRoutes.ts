import { Router } from 'express';
import { AIChatService } from '../services/aiChatService';
import { db } from '../data/database';
import { asyncHandler, getAuthUserId } from '../middleware';

const router = Router();

router.post('/messages', asyncHandler((req, res) => {
  const senderId = getAuthUserId(req);
  const { receiverId, content } = req.body as { receiverId: string; content: string };
  const result = AIChatService.sendMessage(senderId, receiverId, content);
  if (!result.success || !result.message) {
    res.status(400);
    res.locals.error = { code: 'SEND_FAILED', message: '发送失败或内容违规' };
    return res.json(null);
  }
  AIChatService.updateFriendship(senderId, receiverId);
  return res.json({
    message: result.message,
    conversationId: result.conversationId
  });
}));

router.get('/conversations', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const conversations = AIChatService.getUserConversations(userId).map(c => {
    const otherId = c.participants.find(p => p !== userId);
    const other = otherId ? db.users.get(otherId) : null;
    return {
      ...c,
      otherUser: other ? {
        id: other.id,
        nickname: other.nickname,
        avatar: other.avatar,
        age: other.age,
        city: other.location.city,
        creditScore: other.creditScore,
        online: Date.now() - new Date(other.lastActiveAt).getTime() < 300000
      } : null,
      unread: c.unreadCount[userId] || 0
    };
  });
  return res.json(conversations);
}));

router.get('/conversations/:id/messages', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const messages = AIChatService.getConversationMessages(req.params.id, userId);
  return res.json(messages);
}));

router.get('/conversations/:id/topic-suggestions', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const suggestions = AIChatService.generateTopicSuggestions(req.params.id, userId);
  return res.json(suggestions);
}));

router.get('/conversations/:id/context', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const conv = db.conversations.get(req.params.id);
  if (!conv || !conv.participants.includes(userId)) {
    res.status(404);
    res.locals.error = { code: 'NOT_FOUND', message: '会话不存在' };
    return res.json(null);
  }
  const otherId = conv.participants.find(p => p !== userId)!;
  const me = db.users.get(userId);
  const other = db.users.get(otherId);
  const recentMemories = Array.from(db.chatMemories.values())
    .filter(m => m.conversationId === conv.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
  const friendship = Array.from(db.friendships.values()).find(
    f => [f.userA, f.userB].sort().join(',') === [userId, otherId].sort().join(',')
  );
  return res.json({
    conversationId: conv.id,
    participants: [
      { userId, profileSummary: me ? `${me.education.school} - ${me.career.position}` : '', interests: me?.interestTags || [] },
      { userId: otherId, profileSummary: other ? `${other.education.school} - ${other.career.position}` : '', interests: other?.interestTags || [] }
    ],
    recentMemories,
    commonTopics: me && other ? me.interestTags.filter(t => other.interestTags.includes(t)) : [],
    suggestedTopics: AIChatService.generateTopicSuggestions(conv.id, userId),
    friendshipScore: friendship?.friendshipScore || 0,
    activitiesTogether: friendship?.activitiesTogether || 0,
    lastGeneratedAt: new Date()
  });
}));

router.get('/friends/list', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const friends = Array.from(db.friendships.values())
    .filter(f => (f.userA === userId || f.userB === userId) && f.status === 'accepted')
    .map(f => {
      const otherId = f.userA === userId ? f.userB : f.userA;
      const user = db.users.get(otherId);
      return {
        friendship: f,
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
    })
    .sort((a, b) => b.friendship.friendshipScore - a.friendship.friendshipScore);
  return res.json(friends);
}));

export default router;
