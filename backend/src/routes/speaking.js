const express = require('express');
const { runAsync, getAsync, allAsync } = require('../utils/db');
const { successResponse, errorResponse, handleError } = require('../utils/response');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const practiceSentences = [
  { id: 1, text: 'Hello, nice to meet you!', language: 'en', difficulty: 'easy' },
  { id: 2, text: 'How are you doing today?', language: 'en', difficulty: 'easy' },
  { id: 3, text: 'I would like to order a coffee, please.', language: 'en', difficulty: 'medium' },
  { id: 4, text: 'Could you please repeat that more slowly?', language: 'en', difficulty: 'medium' },
  { id: 5, text: 'The weather is quite beautiful today.', language: 'en', difficulty: 'hard' }
];

router.get('/sentences', async (req, res) => {
  try {
    const { difficulty, limit = 10 } = req.query;
    
    let sentences = [...practiceSentences];
    if (difficulty) {
      sentences = sentences.filter(s => s.difficulty === difficulty);
    }
    
    res.json(successResponse({ sentences: sentences.slice(0, parseInt(limit)) }));
  } catch (error) {
    handleError(res, error, '获取练习句子失败');
  }
});

router.post('/practice', requireAuth, async (req, res) => {
  try {
    const { original_text, user_audio } = req.body;

    if (!original_text) {
      return res.status(400).json(errorResponse('原文不能为空'));
    }

    const mockScore = Math.round(70 + Math.random() * 30);
    const mockFeedback = mockScore >= 85 ? '发音很棒！继续保持！' : 
                        mockScore >= 70 ? '发音不错，继续努力！' : '多加练习，一定会更好！';

    const result = await runAsync(
      'INSERT INTO speaking_practice (user_id, original_text, user_audio, score, feedback) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, original_text, user_audio || null, mockScore, mockFeedback]
    );

    res.json(successResponse({
      id: result.lastID,
      score: mockScore,
      feedback: mockFeedback,
      original_text
    }, '评测完成'));
  } catch (error) {
    handleError(res, error, '提交练习失败');
  }
});

router.get('/history', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const history = await allAsync(
      'SELECT * FROM speaking_practice WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.user.id, parseInt(limit), parseInt(offset)]
    );

    const avgScore = history.length > 0 
      ? Math.round(history.reduce((sum, h) => sum + (h.score || 0), 0) / history.length)
      : 0;

    res.json(successResponse({ 
      history, 
      total: history.length,
      avg_score: avgScore
    }));
  } catch (error) {
    handleError(res, error, '获取练习历史失败');
  }
});

router.post('/publish', requireAuth, async (req, res) => {
  try {
    const { practice_id, title } = req.body;

    if (!practice_id) {
      return res.status(400).json(errorResponse('练习ID不能为空'));
    }

    const practice = await getAsync(
      'SELECT * FROM speaking_practice WHERE id = ? AND user_id = ?',
      [practice_id, req.user.id]
    );

    if (!practice) {
      return res.status(404).json(errorResponse('练习记录不存在'));
    }

    await runAsync(
      'INSERT INTO world_posts (user_id, title, content, language) VALUES (?, ?, ?, ?)',
      [req.user.id, title || '我的口语练习', practice.original_text, 'en']
    );

    res.json(successResponse(null, '发布成功'));
  } catch (error) {
    handleError(res, error, '发布失败');
  }
});

module.exports = router;
