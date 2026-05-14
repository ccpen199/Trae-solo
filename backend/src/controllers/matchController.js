const db = require('../models/db');

const getSoulTestQuestions = (req, res) => {
  const questions = [
    {
      id: 1,
      question: '周末你更倾向于？',
      options: [
        { value: 1, label: '宅在家里' },
        { value: 2, label: '和朋友聚会' },
        { value: 3, label: '独自出门探索' },
        { value: 4, label: '参加兴趣活动' }
      ]
    },
    {
      id: 2,
      question: '遇到困难时你会？',
      options: [
        { value: 1, label: '自己默默解决' },
        { value: 2, label: '立刻找朋友帮忙' },
        { value: 3, label: '先冷静分析再决定' },
        { value: 4, label: '发朋友圈寻求安慰' }
      ]
    },
    {
      id: 3,
      question: '你更喜欢哪种旅行方式？',
      options: [
        { value: 1, label: '精心规划的跟团游' },
        { value: 2, label: '说走就走的自由行' },
        { value: 3, label: '深度体验的慢旅行' },
        { value: 4, label: '户外探险' }
      ]
    },
    {
      id: 4,
      question: '和朋友相处时你通常是？',
      options: [
        { value: 1, label: '倾听者' },
        { value: 2, label: '活跃气氛的人' },
        { value: 3, label: '组织安排的人' },
        { value: 4, label: '随缘参与' }
      ]
    },
    {
      id: 5,
      question: '你觉得灵魂伴侣最重要的是？',
      options: [
        { value: 1, label: '三观一致' },
        { value: 2, label: '性格互补' },
        { value: 3, label: '兴趣相投' },
        { value: 4, label: '互相包容' }
      ]
    }
  ];

  res.json({
    success: true,
    data: { questions }
  });
};

const submitSoulTest = (req, res) => {
  const userId = req.user.userId;
  const { answers } = req.body;

  if (!answers || answers.length !== 5) {
    return res.status(400).json({
      success: false,
      message: '请完成所有题目'
    });
  }

  const types = ['温暖治愈型', '热情活力型', '沉稳思考型', '浪漫理想型'];
  const sum = answers.reduce((a, b) => a + b, 0);
  const typeIndex = (sum - 5) % 4;
  const personalityType = types[typeIndex];

  const checkExisting = db.prepare('SELECT id FROM soul_test WHERE user_id = ?');
  const existing = checkExisting.get(userId);

  if (existing) {
    const updateTest = db.prepare(`
      UPDATE soul_test SET 
        question1 = ?, question2 = ?, question3 = ?, question4 = ?, question5 = ?, personality_type = ?
      WHERE user_id = ?
    `);
    updateTest.run(...answers, personalityType, userId);
  } else {
    const insertTest = db.prepare(`
      INSERT INTO soul_test (user_id, question1, question2, question3, question4, question5, personality_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertTest.run(userId, ...answers, personalityType);
  }

  res.json({
    success: true,
    message: '测试完成',
    data: { personalityType }
  });
};

const getRecommendedUsers = (req, res) => {
  const userId = req.user.userId;
  const { gender } = req.query;

  let query = `
    SELECT 
      u.id, u.nickname, u.avatar, u.gender, u.bio, u.location,
      s.personality_type
    FROM users u
    LEFT JOIN soul_test s ON u.id = s.user_id
    WHERE u.id != ?
  `;

  const params = [userId];

  if (gender) {
    query += ' AND u.gender = ?';
    params.push(gender);
  }

  query += ' ORDER BY RANDOM() LIMIT 20';

  const stmt = db.prepare(query);
  const users = stmt.all(...params);

  const usersWithScore = users.map(user => ({
    ...user,
    match_score: Math.min(98, 60 + Math.floor(Math.random() * 35))
  }));

  res.json({
    success: true,
    data: { users: usersWithScore }
  });
};

const createMatch = (req, res) => {
  const userId = req.user.userId;
  const { targetUserId } = req.body;

  if (!targetUserId) {
    return res.status(400).json({
      success: false,
      message: '请选择匹配对象'
    });
  }

  const matchScore = 65 + Math.floor(Math.random() * 30);

  const insertMatch = db.prepare(`
    INSERT OR IGNORE INTO matches (user1_id, user2_id, match_score) VALUES (?, ?, ?)
  `);
  insertMatch.run(userId, targetUserId, matchScore);

  res.json({
    success: true,
    message: '匹配成功！',
    data: { match_score: matchScore }
  });
};

module.exports = { getSoulTestQuestions, submitSoulTest, getRecommendedUsers, createMatch };
