const express = require('express');
const { db } = require('../database/init');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const questions = [
  { id: 1, question: '在社交聚会中，你通常是', options: ['主动与人交谈', '等待别人来找你'] },
  { id: 2, question: '你更倾向于', options: ['关注外部世界', '关注内心世界'] },
  { id: 3, question: '做决定时，你更看重', options: ['逻辑和客观', '个人价值观和情感'] },
  { id: 4, question: '面对计划，你更喜欢', options: ['按计划行事', '灵活应变'] },
  { id: 5, question: '处理问题时，你更倾向于', options: ['先行动再思考', '先思考再行动'] }
];

router.get('/questions', authMiddleware, (req, res) => {
  try {
    res.json({ success: true, data: { questions } });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/submit', authMiddleware, (req, res) => {
  try {
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length !== questions.length) {
      return res.status(400).json({ success: false, message: '请完成所有问题' });
    }

    const traits = {
      e_i: answers.filter(a => a.optionIndex === 0).length > answers.filter(a => a.optionIndex === 1).length ? 'E' : 'I',
      t_f: answers.filter(a => a.questionId === 3 && a.optionIndex === 0).length > 0 ? 'T' : 'F',
      j_p: answers.filter(a => a.questionId === 4 && a.optionIndex === 0).length > 0 ? 'J' : 'P'
    };

    const existingTest = db.prepare('SELECT id FROM personality_tests WHERE user_id = ?').get(req.user.id);

    if (existingTest) {
      db.prepare('UPDATE personality_tests SET answers = ?, traits = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(
        JSON.stringify(answers),
        JSON.stringify(traits),
        req.user.id
      );
    } else {
      db.prepare('INSERT INTO personality_tests (user_id, answers, traits) VALUES (?, ?, ?)').run(
        req.user.id,
        JSON.stringify(answers),
        JSON.stringify(traits)
      );
    }

    db.prepare('UPDATE users SET personality_traits = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      JSON.stringify(traits),
      req.user.id
    );

    db.prepare('INSERT INTO analytics (user_id, event_type, event_data, page) VALUES (?, ?, ?, ?)').run(
      req.user.id,
      'complete_personality_test',
      JSON.stringify({ traits }),
      'planet'
    );

    res.json({ success: true, data: { traits }, message: '测试完成' });
  } catch (error) {
    console.error('Submit test error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
