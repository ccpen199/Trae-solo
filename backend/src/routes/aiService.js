const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const router = express.Router();
const prisma = new PrismaClient();

const interviewQuestions = {
  frontend: [
    '请介绍一下你自己和你的前端开发经验。',
    '请解释一下React的虚拟DOM是如何工作的。',
    '如何优化前端性能？请列举至少3种方法。',
    '请描述一次你解决复杂前端问题的经历。',
    '你对前端工程化有什么理解？',
  ],
  backend: [
    '请介绍一下你的后端开发技术栈。',
    '如何设计一个高并发的API系统？',
    '请解释数据库索引的原理和使用场景。',
    '如何处理分布式系统中的数据一致性问题？',
    '请描述一次你处理线上故障的经历。',
  ],
  product: [
    '请介绍一下你做过的最成功的产品。',
    '如何进行用户需求调研和分析？',
    '请描述一个产品从0到1的完整过程。',
    '如何平衡用户需求和技术实现？',
    '你认为一个好的产品经理应该具备哪些素质？',
  ],
  design: [
    '请介绍一下你的设计理念和风格。',
    '如何进行用户体验设计？',
    '请描述你的设计流程。',
    '如何评估一个设计的好坏？',
    '你最近关注了哪些设计趋势？',
  ],
};

const generateInterviewFeedback = (answers) => {
  const score = Math.round((70 + Math.random() * 30) * 10) / 10;
  const strengths = [
    '回答逻辑清晰，表达能力强',
    '技术基础扎实，理解深入',
    '有实际项目经验，案例丰富',
    '思维敏捷，应变能力强',
  ];
  const improvements = [
    '可以增加更多具体数据支撑',
    '建议深入了解底层原理',
    '可以提升系统设计能力',
    '建议多关注行业最新动态',
  ];

  return {
    score,
    strengths: strengths.slice(0, 2),
    improvements: improvements.slice(0, 2),
    overall: score >= 85 ? '表现优秀，继续保持' : score >= 70 ? '表现良好，有提升空间' : '需要加强练习',
  };
};

router.post('/interview/start', authenticateToken, auditLog('INTERVIEW_START', 'ai_service'), async (req, res) => {
  try {
    const { position } = req.body;

    const session = await prisma.interviewSession.create({
      data: {
        userId: req.user.id,
        position,
        status: 'active',
      },
    });

    const questionList = interviewQuestions[position] || interviewQuestions.frontend;
    const firstQuestion = questionList[0];

    await prisma.interviewMessage.create({
      data: {
        sessionId: session.id,
        role: 'interviewer',
        content: `欢迎参加${position}岗位模拟面试！我是面试官，现在开始提问。${firstQuestion}`,
      },
    });

    res.json({
      sessionId: session.id,
      message: firstQuestion,
      questionIndex: 0,
      totalQuestions: questionList.length,
    });
  } catch (error) {
    console.error('Start interview error:', error);
    res.status(500).json({ error: '开始面试失败' });
  }
});

router.post('/interview/message', authenticateToken, auditLog('INTERVIEW_MESSAGE', 'ai_service'), async (req, res) => {
  try {
    const { sessionId, answer, questionIndex } = req.body;

    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.status !== 'active') {
      return res.status(400).json({ error: '面试会话无效或已结束' });
    }

    await prisma.interviewMessage.create({
      data: {
        sessionId,
        role: 'candidate',
        content: answer,
      },
    });

    const questionList = interviewQuestions[session.position] || interviewQuestions.frontend;
    const nextIndex = questionIndex + 1;

    if (nextIndex >= questionList.length) {
      const feedback = generateInterviewFeedback([]);

      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          score: feedback.score,
          feedback: JSON.stringify(feedback),
        },
      });

      await prisma.interviewMessage.create({
        data: {
          sessionId,
          role: 'interviewer',
          content: `面试结束！你的得分是${feedback.score}分。${feedback.overall}。优点：${feedback.strengths.join('；')}。改进建议：${feedback.improvements.join('；')}。`,
        },
      });

      res.json({
        completed: true,
        message: '面试已完成',
        feedback,
      });
    } else {
      const nextQuestion = questionList[nextIndex];

      await prisma.interviewMessage.create({
        data: {
          sessionId,
          role: 'interviewer',
          content: `很好，下一个问题：${nextQuestion}`,
        },
      });

      res.json({
        completed: false,
        message: nextQuestion,
        questionIndex: nextIndex,
        totalQuestions: questionList.length,
      });
    }
  } catch (error) {
    console.error('Interview message error:', error);
    res.status(500).json({ error: '发送消息失败' });
  }
});

router.get('/interview/sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await prisma.interviewSession.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    res.json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: '获取会话列表失败' });
  }
});

router.post('/resume/analyze', authenticateToken, auditLog('RESUME_ANALYZE', 'ai_service'), async (req, res) => {
  try {
    const { content } = req.body;

    const keywords = [];
    const keywordSuggestions = [];

    if (content.includes('前端') || content.includes('React') || content.includes('Vue')) {
      keywords.push('前端开发', 'React', 'Vue', 'JavaScript', 'TypeScript');
      keywordSuggestions.push('建议添加"组件化开发"、"性能优化"、"工程化"等关键词');
      keywordSuggestions.push('可以补充具体的项目技术栈描述');
    }
    if (content.includes('后端') || content.includes('Java') || content.includes('Python')) {
      keywords.push('后端开发', '微服务', '数据库', '系统设计');
      keywordSuggestions.push('建议添加"高并发"、"分布式"、"性能调优"等关键词');
    }
    if (content.includes('产品') || content.includes('产品经理')) {
      keywords.push('产品设计', '需求分析', '用户研究', '数据分析');
      keywordSuggestions.push('建议添加"产品规划"、"增长策略"、"AB测试"等关键词');
    }
    if (content.includes('设计') || content.includes('UI') || content.includes('UX')) {
      keywords.push('UI设计', '用户体验', '交互设计', '设计系统');
      keywordSuggestions.push('建议添加"设计思维"、"可用性测试"、"原型设计"等关键词');
    }

    if (keywords.length === 0) {
      keywords.push('项目经验', '团队协作', '沟通能力', '学习能力');
      keywordSuggestions.push('建议突出专业技能和核心竞争力');
      keywordSuggestions.push('可以量化项目成果，如"提升性能30%"');
    }

    const scores = {
      overall: Math.round((60 + Math.random() * 35) * 10) / 10,
      keywordRichness: Math.round((55 + Math.random() * 40) * 10) / 10,
      structure: Math.round((65 + Math.random() * 30) * 10) / 10,
      experience: Math.round((60 + Math.random() * 35) * 10) / 10,
    };

    const suggestions = [
      ...keywordSuggestions,
      '建议控制简历长度在1-2页',
      '使用STAR法则描述项目经验',
      '突出个人贡献和具体成果',
    ];

    res.json({
      keywords,
      scores,
      suggestions,
    });
  } catch (error) {
    console.error('Resume analyze error:', error);
    res.status(500).json({ error: '简历分析失败' });
  }
});

module.exports = router;
