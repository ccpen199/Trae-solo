import type {
  ChatMessage,
  Conversation,
  ChatMemoryEntry,
  TopicSuggestion,
  FriendRelationship
} from '../types';
import { db } from '../data/database';
import { RiskControlEngine } from '../core/riskControlEngine';

export class AIChatService {
  private static readonly MEMORY_WINDOW_DAYS = 30;
  private static readonly TOPIC_KEYWORDS: Record<string, string[]> = {
    food: ['火锅', '烤肉', '日料', '餐厅', '咖啡', '奶茶', '美食'],
    sports: ['篮球', '足球', '健身', '跑步', '瑜伽', '游泳', '骑行'],
    travel: ['旅行', '旅游', '出去玩', '景点', '机票', '酒店', '徒步'],
    work: ['工作', '加班', '项目', '会议', '产品', '技术'],
    music: ['音乐', '演唱会', '歌手', '专辑', '钢琴', '吉他'],
    movie: ['电影', '追剧', '演员', '导演', '院线'],
    study: ['学习', '读书', '考试', '考研', '英语', '专业']
  };

  private static getOrCreateConversation(userA: string, userB: string): Conversation {
    const pair = [userA, userB].sort();
    let conv = Array.from(db.conversations.values()).find(
      c => c.participants.length === 2 &&
        c.participants.slice().sort().join(',') === pair.join(',')
    );
    if (conv) return conv;

    conv = {
      id: db.generateId(),
      participants: [userA, userB],
      createdAt: new Date(),
      updatedAt: new Date(),
      unreadCount: { [userA]: 0, [userB]: 0 },
      isMutualMatch: false
    };
    db.conversations.set(conv.id, conv);
    return conv;
  }

  static sendMessage(
    senderId: string,
    receiverId: string,
    content: string
  ): { success: boolean; message?: ChatMessage; conversationId?: string } {
    if (senderId === receiverId) return { success: false };

    const evalResult = RiskControlEngine.evaluateContent(senderId, content, 'message');
    if (!evalResult.allowed) return { success: false };

    const freq = RiskControlEngine.recordAndCheckHighFrequency(senderId, 'message');
    if (!freq.allowed) return { success: false };

    const conv = this.getOrCreateConversation(senderId, receiverId);
    const now = new Date();

    const msg: ChatMessage = {
      id: db.generateId(),
      conversationId: conv.id,
      senderId,
      receiverId,
      type: 'text',
      content: evalResult.censoredContent,
      riskFlagged: evalResult.hits.length > 0,
      riskReason: evalResult.hits.length > 0 ? `敏感词:${evalResult.hits.map(h => h.word).join(',')}` : undefined,
      createdAt: now,
      read: false
    };

    db.chatMessages.set(msg.id, msg);
    conv.lastMessage = msg;
    conv.updatedAt = now;
    conv.unreadCount[receiverId] = (conv.unreadCount[receiverId] || 0) + 1;

    this.extractAndStoreMemory(conv.id, senderId, receiverId, content);

    return { success: true, message: msg, conversationId: conv.id };
  }

  private static extractAndStoreMemory(
    conversationId: string,
    senderId: string,
    receiverId: string,
    content: string
  ): void {
    const topics: string[] = [];
    const entities: string[] = [];

    for (const [topic, keywords] of Object.entries(this.TOPIC_KEYWORDS)) {
      if (keywords.some(k => content.includes(k))) {
        topics.push(topic);
      }
    }

    const datePattern = /(今天|昨天|明天|后天|周一|周二|周三|周四|周五|周六|周日|[上下]午|晚上|周末)/g;
    const dates = content.match(datePattern);
    if (dates) entities.push(...dates);

    if (topics.length > 0 || entities.length > 0) {
      const tones: ChatMemoryEntry['emotionalTone'][] = ['positive', 'neutral', 'excited', 'negative', 'anxious'];
      const entry: ChatMemoryEntry = {
        id: db.generateId(),
        conversationId,
        userId: senderId,
        topic: topics[0] || 'general',
        entities,
        mentionedInterests: topics,
        emotionalTone: tones[Math.floor(Math.random() * 3)],
        timestamp: new Date(),
        summary: content.substring(0, 80) + (content.length > 80 ? '...' : '')
      };
      db.chatMemories.set(entry.id, entry);
    }
  }

  static getConversationMessages(conversationId: string, userId: string, limit: number = 50): ChatMessage[] {
    const conv = db.conversations.get(conversationId);
    if (!conv || !conv.participants.includes(userId)) return [];
    const allMessages = Array.from(db.chatMessages.values())
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .reverse();
    conv.unreadCount[userId] = 0;
    for (const msg of allMessages) {
      if (msg.receiverId === userId && !msg.read) {
      msg.read = true;
      msg.readAt = new Date();
      }
    }
    return allMessages;
  }

  static getUserConversations(userId: string): Conversation[] {
    return Array.from(db.conversations.values())
      .filter(c => c.participants.includes(userId))
      .sort((a, b) => (b.lastMessage?.createdAt.getTime() || b.updatedAt.getTime()) - (a.lastMessage?.createdAt.getTime() || a.updatedAt.getTime()));
  }

  static generateTopicSuggestions(conversationId: string, userId: string): TopicSuggestion[] {
    const conv = db.conversations.get(conversationId);
    if (!conv) return [];
    const otherUserId = conv.participants.find(p => p !== userId);
    if (!otherUserId) return [];

    const me = db.users.get(userId);
    const other = db.users.get(otherUserId);
    if (!me || !other) return [];

    const suggestions: TopicSuggestion[] = [];
    const now = new Date();

    const recentMemories = Array.from(db.chatMemories.values())
      .filter(m =>
        m.conversationId === conversationId &&
        now.getTime() - new Date(m.timestamp).getTime() < this.MEMORY_WINDOW_DAYS * 86400000
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    const commonInterests = me.interestTags.filter(t => other.interestTags.includes(t));

    if (commonInterests.length >= 2) {
      suggestions.push({
        id: db.generateId(),
        suggestion: `你们都喜欢 ${commonInterests.slice(0, 3).join('、')}，要不要约着一起体验？`,
        category: 'interest_based',
        confidence: 0.9,
        reasoning: `匹配到${commonInterests.length}个共同兴趣标签`,
        referencedMemoryIds: recentMemories.slice(0, 3).map(m => m.id)
      });
    }

    if (recentMemories.length > 0) {
      const lastTopic = recentMemories[0];
      suggestions.push({
        id: db.generateId(),
        suggestion: `上次聊到「${lastTopic.summary.substring(0, 20)}」，可以继续深入聊聊～`,
        category: 'memory_based',
        confidence: 0.85,
        reasoning: '基于最近聊天上下文记忆生成',
        referencedMemoryIds: [lastTopic.id]
      });
    }

    const activityTitles = Array.from(db.activities.values())
      .filter(a =>
        a.location.city === me.location.city &&
        a.status === 'recruiting' &&
        a.participants.length < a.maxParticipants
      )
      .slice(0, 2);

    if (activityTitles.length > 0 && commonInterests.length > 0) {
      suggestions.push({
        id: db.generateId(),
        suggestion: `最近有个「${activityTitles[0].title}」挺适合你们，要不要一起报名？`,
        category: 'activity_based',
        confidence: 0.75,
        reasoning: `匹配到同城活动 + ${commonInterests.length}个共同兴趣`
      });
    }

    const icebreakers = [
      '最近周末一般怎么安排呀？',
      '有没有什么最近特别想尝试的新事物？',
      '如果现在有一周假期，最想去哪里？'
    ];
    suggestions.push({
      id: db.generateId(),
      suggestion: icebreakers[Math.floor(Math.random() * icebreakers.length)],
      category: 'icebreaker',
      confidence: 0.6,
      reasoning: '通用破冰话题库推荐'
    });

    if (recentMemories.length >= 5) {
      suggestions.push({
        id: db.generateId(),
        suggestion: `感觉你之前提到对${recentMemories[0].topic}很感兴趣，最近在这方面有什么新进展吗？`,
        category: 'deep_talk',
        confidence: 0.8,
        reasoning: '基于历史话题偏好分析',
        referencedMemoryIds: recentMemories.slice(0, 5).map(m => m.id)
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  static updateFriendship(userA: string, userB: string): FriendRelationship | null {
    const pair = [userA, userB].sort();
    let friendship = Array.from(db.friendships.values()).find(
      f => [f.userA, f.userB].sort().join(',') === pair.join(',')
    );

    const mutualActivities = Array.from(db.activities.values()).filter(
      a => a.participants.some(p => p.userId === userA && p.status === 'attended') &&
           a.participants.some(p => p.userId === userB && p.status === 'attended')
    ).length;

    const mutualMatches = Array.from(db.mutualMatches.values()).filter(
      m =>
        (m.userA === userA && m.userB === userB) ||
        (m.userA === userB && m.userB === userA)
    ).length;

    const score = Math.min(100, mutualActivities * 15 + mutualMatches * 10 + Math.floor(Math.random() * 30));

    if (friendship) {
      friendship.activitiesTogether = mutualActivities;
      friendship.mutualMatches = mutualMatches;
      friendship.friendshipScore = score;
      return friendship;
    }

    friendship = {
      id: db.generateId(),
      userA,
      userB,
      status: 'accepted',
      mutualMatches,
      activitiesTogether: mutualActivities,
      friendshipScore: score,
      createdAt: new Date(),
      acceptedAt: new Date()
    };
    db.friendships.set(friendship.id, friendship);
    return friendship;
  }
}
