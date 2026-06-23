import { Request, Response } from 'express';
import db from '@/db/index.js';
import type {
  ChatMessage,
  ChatResponse,
  EmotionType,
  PsychologyReport,
  EmotionTrend,
} from '@shared/types';

const CRISIS_KEYWORDS = [
  '自杀',
  '不想活',
  '活不下去',
  '结束生命',
  '跳楼',
  '割腕',
  '抑郁',
  '抑郁症',
  '绝望',
  '崩溃',
  '想死',
  '一了百了',
  '离开这个世界',
  '没有希望',
  '生不如死',
];

const NEGATIVE_KEYWORDS = [
  '难过',
  '伤心',
  '痛苦',
  '焦虑',
  '压力',
  '失眠',
  '烦躁',
  '生气',
  '愤怒',
  '委屈',
  '孤独',
  '无助',
  '失望',
  '沮丧',
  '害怕',
  '恐惧',
  '担心',
  '后悔',
  '内疚',
  '自卑',
];

const POSITIVE_KEYWORDS = [
  '开心',
  '高兴',
  '快乐',
  '幸福',
  '满足',
  '感谢',
  '感激',
  '希望',
  '期待',
  '乐观',
  '自信',
  '平静',
  '放松',
  '愉快',
  '喜悦',
  '满足',
];

const detectCrisisKeywords = (message: string): string[] => {
  const found: string[] = [];
  for (const keyword of CRISIS_KEYWORDS) {
    if (message.includes(keyword)) {
      found.push(keyword);
    }
  }
  return found;
};

const analyzeEmotion = (message: string): { emotion: EmotionType; score: number } => {
  let positiveCount = 0;
  let negativeCount = 0;

  for (const keyword of POSITIVE_KEYWORDS) {
    if (message.includes(keyword)) {
      positiveCount++;
    }
  }

  for (const keyword of NEGATIVE_KEYWORDS) {
    if (message.includes(keyword)) {
      negativeCount++;
    }
  }

  const crisisKeywords = detectCrisisKeywords(message);
  if (crisisKeywords.length > 0) {
    return { emotion: 'crisis', score: 0.1 + Math.random() * 0.2 };
  }

  const total = positiveCount + negativeCount;
  if (total === 0) {
    return { emotion: 'neutral', score: 0.4 + Math.random() * 0.2 };
  }

  const positiveRatio = positiveCount / total;
  const negativeRatio = negativeCount / total;

  if (positiveRatio > 0.6) {
    return { emotion: 'positive', score: 0.7 + positiveRatio * 0.3 };
  } else if (negativeRatio > 0.6) {
    return { emotion: 'negative', score: 0.1 + negativeRatio * 0.3 };
  } else {
    return { emotion: 'neutral', score: 0.4 + Math.random() * 0.2 };
  }
};

const generateReply = (message: string, emotion: EmotionType): string => {
  if (emotion === 'crisis') {
    return '我感受到你现在非常痛苦，这种感受一定很难熬。请记住，你不是一个人，有很多人愿意帮助你。请立即拨打心理援助热线：400-161-9995，或者联系你的家人朋友。生命很宝贵，一定有解决问题的办法。';
  }

  if (emotion === 'negative') {
    const replies = [
      '我能感受到你现在的心情不太好，愿意和我多说说发生了什么吗？',
      '听起来你最近压力很大，这种感觉确实很煎熬。你愿意和我聊聊具体是什么困扰着你吗？',
      '我理解你的感受，有时候生活确实会给我们带来很多挑战。你想从哪里开始说起呢？',
      '感谢你愿意和我分享这些，把感受说出来本身就是一种勇气。你现在最想解决的问题是什么？',
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  if (emotion === 'positive') {
    const replies = [
      '很高兴听到你这么说！保持这份积极的心态很重要。还有什么开心的事情想分享吗？',
      '你的心情听起来很棒！是什么让你这么开心呢？',
      '感受到你的快乐真好！希望这份好心情能一直陪伴你。',
      '太棒了！积极的心态会让生活更美好。还有什么想聊的吗？',
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  const replies = [
    '我在听，请继续说。',
    '好的，我了解了。你还有什么想和我聊聊的吗？',
    '感谢你的分享，我在这里陪伴你。今天过得怎么样？',
    '我理解，生活中总会有各种情绪。你想深入聊聊哪个方面呢？',
  ];
  return replies[Math.floor(Math.random() * replies.length)];
};

export const chat = (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const { message, sessionId } = req.body as ChatMessage;

    if (!message) {
      res.status(400).json({ success: false, message: '消息内容不能为空' });
      return;
    }

    let currentSessionId = sessionId;

    if (!currentSessionId) {
      currentSessionId = `SESSION-${Date.now()}-${userId}`;
      db.prepare(
        'INSERT INTO psychology_sessions (id, user_id, start_time) VALUES (?, ?, ?)'
      ).run(currentSessionId, userId, new Date().toISOString());
    } else {
      const session = db.prepare('SELECT * FROM psychology_sessions WHERE id = ?').get(currentSessionId);
      if (!session) {
        currentSessionId = `SESSION-${Date.now()}-${userId}`;
        db.prepare(
          'INSERT INTO psychology_sessions (id, user_id, start_time) VALUES (?, ?, ?)'
        ).run(currentSessionId, userId, new Date().toISOString());
      }
    }

    const crisisKeywords = detectCrisisKeywords(message);
    const { emotion, score } = analyzeEmotion(message);
    const crisisDetected = crisisKeywords.length > 0;
    const transferredToHuman = crisisDetected || emotion === 'crisis';

    const reply = generateReply(message, emotion);

    db.prepare(
      'INSERT INTO chat_messages (session_id, sender_type, content, emotion, emotion_score) VALUES (?, ?, ?, ?, ?)'
    ).run(currentSessionId, 'user', message, emotion, score);

    db.prepare(
      'INSERT INTO chat_messages (session_id, sender_type, content, emotion, emotion_score) VALUES (?, ?, ?, ?, ?)'
    ).run(currentSessionId, 'ai', reply, emotion, 1 - score);

    if (transferredToHuman) {
      db.prepare(
        'UPDATE psychology_sessions SET crisis_detected = ?, transferred_to_human = ?, risk_level = ? WHERE id = ?'
      ).run(true, true, 'high', currentSessionId);
    }

    const data: ChatResponse = {
      reply,
      emotion,
      emotionScore: score,
      crisisDetected,
      crisisKeywords,
      transferredToHuman,
    };

    res.status(200).json({
      success: true,
      data,
      message: crisisDetected ? '检测到危机情绪，已转接人工援助' : '消息发送成功',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '聊天失败，服务器错误' });
  }
};

export const getReport = (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { sessionId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const session = db
      .prepare('SELECT * FROM psychology_sessions WHERE id = ? AND user_id = ?')
      .get(sessionId, userId) as any;

    if (!session) {
      res.status(404).json({ success: false, message: '会话不存在' });
      return;
    }

    const messages = db
      .prepare(
        'SELECT * FROM chat_messages WHERE session_id = ? AND sender_type = ? ORDER BY created_at ASC'
      )
      .all(sessionId, 'user') as any[];

    if (messages.length === 0) {
      res.status(404).json({ success: false, message: '暂无对话记录' });
      return;
    }

    const emotionTrend: EmotionTrend[] = messages.map((m, index) => ({
      time: m.created_at,
      emotion: m.emotion,
      score: m.emotion_score,
    }));

    const emotionStats: Record<string, number> = {};
    messages.forEach((m) => {
      emotionStats[m.emotion] = (emotionStats[m.emotion] || 0) + 1;
    });

    const mainConcerns: string[] = [];
    const allContent = messages.map((m) => m.content).join('');

    if (allContent.includes('工作') || allContent.includes('加班') || allContent.includes('压力')) {
      mainConcerns.push('工作压力');
    }
    if (allContent.includes('感情') || allContent.includes('恋爱') || allContent.includes('分手')) {
      mainConcerns.push('情感问题');
    }
    if (allContent.includes('家庭') || allContent.includes('父母') || allContent.includes('孩子')) {
      mainConcerns.push('家庭关系');
    }
    if (allContent.includes('失眠') || allContent.includes('睡觉') || allContent.includes('焦虑')) {
      mainConcerns.push('睡眠问题');
    }
    if (allContent.includes('抑郁') || allContent.includes('不想活') || allContent.includes('自杀')) {
      mainConcerns.push('抑郁情绪');
    }
    if (mainConcerns.length === 0) {
      mainConcerns.push('情绪调节');
    }

    const suggestions: string[] = [];
    if (emotionStats['negative'] || emotionStats['crisis']) {
      suggestions.push('建议每天进行15分钟的深呼吸冥想练习');
      suggestions.push('保持规律的作息时间，每天至少7小时睡眠');
      suggestions.push('尝试记录情绪日记，了解自己的情绪变化规律');
      suggestions.push('每周进行3次以上的有氧运动，每次30分钟');
    }
    if (emotionStats['crisis']) {
      suggestions.push('建议尽快寻求专业心理咨询师的帮助');
      suggestions.push('请随时拨打心理援助热线：400-161-9995');
      suggestions.push('多与信任的家人朋友交流，不要独自承受');
    }
    if (suggestions.length === 0) {
      suggestions.push('继续保持良好的心态');
      suggestions.push('可以尝试培养新的兴趣爱好');
      suggestions.push('保持适度的社交活动');
    }

    const duration = Math.round(
      (new Date(messages[messages.length - 1].created_at).getTime() -
        new Date(session.start_time).getTime()) /
        60000
    );

    const riskLevel: 'low' | 'medium' | 'high' = session.risk_level === 'high'
      ? 'high'
      : emotionStats['negative'] && emotionStats['negative'] > 3
      ? 'medium'
      : 'low';

    const data: PsychologyReport = {
      sessionId,
      duration,
      emotionTrend,
      mainConcerns,
      suggestions,
      riskLevel,
    };

    res.status(200).json({ success: true, data, message: '获取情绪报告成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取情绪报告失败，服务器错误' });
  }
};
