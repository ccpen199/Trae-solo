const express = require('express');
const db = require('../database');
const { authenticateToken } = require('./users');

const router = express.Router();

router.get('/types', (req, res) => {
  const { category } = req.query;
  
  let query = 'SELECT * FROM game_types WHERE is_active = 1';
  const params = [];
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  
  const gameTypes = db.prepare(query).all(...params);
  
  const result = gameTypes.map(game => {
    const levelCount = db.prepare('SELECT COUNT(*) as count FROM levels WHERE game_type_id = ? AND is_active = 1').get(game.id);
    return {
      ...game,
      levelCount: levelCount.count
    };
  });
  
  res.json(result);
});

router.get('/types/:code', (req, res) => {
  const { code } = req.params;
  
  const gameType = db.prepare('SELECT * FROM game_types WHERE code = ? AND is_active = 1').get(code);
  
  if (!gameType) {
    return res.status(404).json({ error: '游戏类型不存在' });
  }
  
  const levels = db.prepare('SELECT * FROM levels WHERE game_type_id = ? AND is_active = 1 ORDER BY level_number').all(gameType.id);
  
  res.json({
    gameType,
    levels
  });
});

router.get('/levels/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  const level = db.prepare(`
    SELECT l.*, gt.name as game_name, gt.code as game_code, gt.icon
    FROM levels l
    JOIN game_types gt ON l.game_type_id = gt.id
    WHERE l.id = ?
  `).get(id);
  
  if (!level) {
    return res.status(404).json({ error: '关卡不存在' });
  }
  
  res.json(level);
});

const quizQuestions = {
  easy: [
    { id: 1, question: '中国的首都是哪里？', options: ['北京', '上海', '广州', '深圳'], answer: 0 },
    { id: 2, question: '1 + 1 = ?', options: ['1', '2', '3', '4'], answer: 1 },
    { id: 3, question: '太阳从哪个方向升起？', options: ['东方', '西方', '南方', '北方'], answer: 0 },
    { id: 4, question: '水的化学式是什么？', options: ['CO2', 'H2O', 'O2', 'N2'], answer: 1 },
    { id: 5, question: '一年有多少个月？', options: ['10', '11', '12', '13'], answer: 2 },
  ],
  medium: [
    { id: 6, question: '世界上最高的山峰是？', options: ['喜马拉雅山', '珠穆朗玛峰', '乔戈里峰', '干城章嘉峰'], answer: 1 },
    { id: 7, question: '光速约为每秒多少公里？', options: ['30万', '10万', '50万', '100万'], answer: 0 },
    { id: 8, question: '人体最大的器官是？', options: ['心脏', '肝脏', '皮肤', '大脑'], answer: 2 },
    { id: 9, question: '圆周率π约等于多少？', options: ['3.14', '2.72', '1.41', '1.73'], answer: 0 },
    { id: 10, question: '地球绕太阳公转的周期是？', options: ['24小时', '30天', '365天', '12小时'], answer: 2 },
  ],
  hard: [
    { id: 11, question: '量子力学的创立者之一是？', options: ['爱因斯坦', '牛顿', '伽利略', '达尔文'], answer: 0 },
    { id: 12, question: 'DNA的中文名称是？', options: ['核糖核酸', '脱氧核糖核酸', '蛋白质', '氨基酸'], answer: 1 },
    { id: 13, question: '万有引力定律是谁发现的？', options: ['爱因斯坦', '牛顿', '伽利略', '开普勒'], answer: 1 },
    { id: 14, question: '元素周期表的发明者是？', options: ['门捷列夫', '拉瓦锡', '道尔顿', '玻尔'], answer: 0 },
    { id: 15, question: '相对论是关于什么的理论？', options: ['时间和空间', '力和运动', '能量和物质', '光和声音'], answer: 0 },
  ]
};

router.get('/quiz/questions', authenticateToken, (req, res) => {
  const { difficulty = 'easy', count = 5 } = req.query;
  
  let questions = quizQuestions[difficulty] || quizQuestions.easy;
  
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, parseInt(count));
  
  const result = selected.map(q => ({
    id: q.id,
    question: q.question,
    options: q.options
  }));
  
  res.json(result);
});

router.post('/quiz/check', authenticateToken, (req, res) => {
  const { answers, game_type_id, level_id } = req.body;
  
  let correctCount = 0;
  const allQuestions = [...quizQuestions.easy, ...quizQuestions.medium, ...quizQuestions.hard];
  
  const results = answers.map(answer => {
    const question = allQuestions.find(q => q.id === answer.questionId);
    const isCorrect = question && question.answer === answer.selectedIndex;
    if (isCorrect) correctCount++;
    return {
      questionId: answer.questionId,
      isCorrect,
      correctIndex: question ? question.answer : null
    };
  });
  
  const baseScore = 100;
  const score = Math.floor(correctCount / answers.length * baseScore);
  
  try {
    db.prepare(`
      INSERT INTO score_records (user_id, game_type_id, level_id, score)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, game_type_id || 1, level_id || 1, score);
    
    db.prepare(`
      UPDATE users SET total_score = total_score + ? WHERE id = ?
    `).run(score, req.user.id);
  } catch (err) {
    console.error('保存积分失败:', err);
  }
  
  res.json({
    correctCount,
    totalCount: answers.length,
    score,
    results
  });
});

module.exports = router;
