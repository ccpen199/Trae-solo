const express = require('express');
const crypto = require('crypto');
const { runAsync, getAsync, allAsync } = require('../utils/db');
const { successResponse, errorResponse, handleError } = require('../utils/response');

const router = express.Router();

const mockTranslate = (text, sourceLang, targetLang) => {
  return `[${sourceLang}->${targetLang}] ${text}`;
};

router.post('/session/start', async (req, res) => {
  try {
    const { source_lang = 'zh', target_lang = 'en' } = req.body;
    const sessionId = crypto.randomUUID();

    await runAsync(
      'INSERT INTO simultaneous_sessions (user_id, session_id, source_lang, target_lang, status) VALUES (?, ?, ?, ?, ?)',
      [req.user?.id || null, sessionId, source_lang, target_lang, 'active']
    );

    res.json(successResponse({
      session_id: sessionId,
      source_lang,
      target_lang
    }, '同声传译会话已开始'));
  } catch (error) {
    handleError(res, error, '创建会话失败');
  }
});

router.post('/session/:sessionId/translate', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { source_text } = req.body;

    if (!source_text) {
      return res.status(400).json(errorResponse('文本不能为空'));
    }

    const session = await getAsync('SELECT * FROM simultaneous_sessions WHERE session_id = ?', [sessionId]);
    if (!session) {
      return res.status(404).json(errorResponse('会话不存在'));
    }

    if (session.status !== 'active') {
      return res.status(400).json(errorResponse('会话已结束'));
    }

    const targetText = mockTranslate(source_text, session.source_lang, session.target_lang);

    await runAsync(
      'INSERT INTO simultaneous_translations (session_id, source_text, target_text) VALUES (?, ?, ?)',
      [sessionId, source_text, targetText]
    );

    res.json(successResponse({
      source_text,
      target_text: targetText,
      timestamp: new Date().toISOString()
    }, '翻译成功'));
  } catch (error) {
    handleError(res, error, '翻译失败');
  }
});

router.get('/session/:sessionId/translations', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50 } = req.query;

    const translations = await allAsync(
      'SELECT * FROM simultaneous_translations WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?',
      [sessionId, parseInt(limit)]
    );

    res.json(successResponse({ translations: translations.reverse() }));
  } catch (error) {
    handleError(res, error, '获取翻译记录失败');
  }
});

router.post('/session/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;

    await runAsync(
      'UPDATE simultaneous_sessions SET status = ?, ended_at = CURRENT_TIMESTAMP WHERE session_id = ?',
      ['ended', sessionId]
    );

    res.json(successResponse(null, '会话已结束'));
  } catch (error) {
    handleError(res, error, '结束会话失败');
  }
});

module.exports = router;
