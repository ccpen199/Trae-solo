const express = require('express');
const { runAsync, getAsync, allAsync } = require('../utils/db');
const { successResponse, errorResponse, handleError } = require('../utils/response');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const zhToEnFull = {
  '你好': 'Hello',
  '您好': 'Hello',
  '哈喽': 'Hello',
  '嗨': 'Hi',
  '谢谢': 'Thank you',
  '谢谢你': 'Thank you',
  '非常感谢': 'Thank you very much',
  '感谢': 'Thanks',
  '再见': 'Goodbye',
  '拜拜': 'Bye',
  '回头见': 'See you',
  '待会儿见': 'See you later',
  '是的': 'Yes',
  '对': 'Yes',
  '对的': 'Yes',
  '正确': 'Correct',
  '不是': 'No',
  '不对': 'No',
  '错误': 'Wrong',
  '好的': 'OK',
  '可以': 'OK',
  '行': 'OK',
  '没问题': 'No problem',
  '对不起': 'Sorry',
  '抱歉': 'Sorry',
  '不好意思': 'Excuse me',
  '请': 'Please',
  '麻烦': 'Please',
  '帮助': 'Help',
  '帮忙': 'Help',
  '我': 'I',
  '我是': 'I am',
  '我的': 'My',
  '你': 'You',
  '你的': 'Your',
  '您': 'You',
  '他': 'He',
  '他的': 'His',
  '她': 'She',
  '她的': 'Her',
  '它': 'It',
  '我们': 'We',
  '我们的': 'Our',
  '他们': 'They',
  '他们的': 'Their',
  '她们': 'They',
  '什么': 'What',
  '什么事': 'What',
  '什么时候': 'When',
  '何时': 'When',
  '哪里': 'Where',
  '在哪': 'Where',
  '为什么': 'Why',
  '为何': 'Why',
  '怎样': 'How',
  '怎么': 'How',
  '如何': 'How',
  '怎么样': 'How about',
  '今天': 'Today',
  '今天的': "Today's",
  '明天': 'Tomorrow',
  '明天的': "Tomorrow's",
  '昨天': 'Yesterday',
  '昨天的': "Yesterday's",
  '早上': 'Morning',
  '上午': 'Morning',
  '下午': 'Afternoon',
  '晚上': 'Evening',
  '今晚': 'Tonight',
  '好': 'Good',
  '很好': 'Very good',
  '棒': 'Great',
  '优秀': 'Excellent',
  '坏': 'Bad',
  '糟糕': 'Bad',
  '不好': 'Not good',
  '大': 'Big',
  '大的': 'Big',
  '巨大': 'Huge',
  '小': 'Small',
  '小的': 'Small',
  '小的': 'Little',
  '多': 'Many',
  '很多': 'Many',
  '许多': 'A lot',
  '少': 'Few',
  '很少': 'Few',
  '少的': 'Little',
  '喜欢': 'Like',
  '喜爱': 'Love',
  '爱': 'Love',
  '我爱你': 'I love you',
  '我喜欢你': 'I like you',
  '想要': 'Want',
  '我想要': 'I want',
  '需要': 'Need',
  '我需要': 'I need',
  '可以': 'Can',
  '能': 'Able',
  '能够': 'Can',
  '可能': 'Maybe',
  '也许': 'Perhaps',
  '去': 'Go',
  '去学校': 'Go to school',
  '去上学': 'Go to school',
  '去上班': 'Go to work',
  '回家': 'Go home',
  '回去': 'Go back',
  '来': 'Come',
  '过来': 'Come here',
  '吃': 'Eat',
  '吃饭': 'Eat',
  '喝': 'Drink',
  '喝水': 'Drink water',
  '学习': 'Study',
  '工作': 'Work',
  '工作的': 'Work',
  '家': 'Home',
  '家的': 'Home',
  '学校': 'School',
  '在学校': 'At school',
  '朋友': 'Friend',
  '好朋友': 'Good friend',
  '家人': 'Family',
  '家庭': 'Family',
  '手机': 'Mobile phone',
  '电话': 'Phone',
  '电脑': 'Computer',
  '笔记本': 'Laptop',
  '水': 'Water',
  '喝水': 'Drink water',
  '食物': 'Food',
  '吃的': 'Food',
  '时间': 'Time',
  '钱': 'Money',
  '金钱': 'Money',
  '快乐': 'Happy',
  '开心': 'Happy',
  '高兴': 'Happy',
  '难过': 'Sad',
  '伤心': 'Sad',
  '不开心': 'Unhappy',
  '漂亮': 'Beautiful',
  '好看': 'Beautiful',
  '美丽': 'Beautiful',
  '帅': 'Handsome',
  '帅气': 'Handsome',
  '好吗': 'How are you',
  '你好吗': 'How are you',
  '怎么样了': 'How is it going',
  '我很好': 'I am fine',
  '我很好，谢谢': 'I am fine, thank you',
  '很高兴认识你': 'Nice to meet you',
  '见到你很高兴': 'Nice to meet you',
  '早上好': 'Good morning',
  '早': 'Good morning',
  '早安': 'Good morning',
  '下午好': 'Good afternoon',
  '晚上好': 'Good evening',
  '晚安': 'Good night',
  '祝你晚安': 'Good night',
  '不客气': "You're welcome",
  '不用谢': "You're welcome",
  '没关系': "It's OK",
  '没事': "It's fine",
  '请进': 'Come in',
  '请坐': 'Sit down please',
  '请用': 'Help yourself',
  '早上好！': 'Good morning!',
  '下午好！': 'Good afternoon!',
  '晚上好！': 'Good evening!',
  '晚安！': 'Good night!',
  '你好！': 'Hello!',
  '您好！': 'Hello!',
  '嗨！': 'Hi!',
  '哈喽！': 'Hello!',
  '谢谢！': 'Thank you!',
  '谢谢你！': 'Thank you!',
  '非常感谢！': 'Thank you very much!',
  '再见！': 'Goodbye!',
  '拜拜！': 'Bye!',
  '对不起！': 'Sorry!',
  '抱歉！': 'Sorry!'
};

const enToZhFull = {};
for (const [zh, en] of Object.entries(zhToEnFull)) {
  const key = en.toLowerCase().trim().replace(/[.!?]/g, '');
  if (!enToZhFull[key]) {
    enToZhFull[key] = zh.replace(/[.!?！？。]/g, '');
  }
}

const translateZhToEn = (text) => {
  let result = text;
  const sortedKeys = Object.keys(zhToEnFull).sort((a, b) => b.length - a.length);
  let replaced = false;
  const replacedWords = new Set();
  
  for (const zh of sortedKeys) {
    if (result.includes(zh)) {
      const placeholder = `__${replacedWords.size}__`;
      result = result.split(zh).join(placeholder);
      replacedWords.add(placeholder);
      replaced = true;
    }
  }
  
  let finalResult = result;
  let idx = 0;
  for (const zh of sortedKeys) {
    if (text.includes(zh)) {
      finalResult = finalResult.replace(`__${idx}__`, zhToEnFull[zh]);
      idx++;
    }
  }
  
  if (!replaced) {
    return `Translation: ${text}`;
  }
  
  return finalResult;
};

const translateEnToZh = (text) => {
  const lowerText = text.toLowerCase().trim().replace(/[.!?，。！？]/g, '');
  const cleanText = lowerText;
  
  if (enToZhFull[cleanText]) {
    return enToZhFull[cleanText];
  }
  
  const sortedKeys = Object.keys(enToZhFull).sort((a, b) => b.length - a.length);
  let result = text;
  let replaced = false;
  
  for (const en of sortedKeys) {
    if (en.includes(' ')) {
      const regex = new RegExp('\\b' + en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
      if (regex.test(result)) {
        result = result.replace(regex, enToZhFull[en]);
        replaced = true;
      }
    }
  }
  
  for (const en of sortedKeys) {
    if (!en.includes(' ')) {
      const regex = new RegExp('\\b' + en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
      if (regex.test(result)) {
        result = result.replace(regex, enToZhFull[en]);
        replaced = true;
      }
    }
  }
  
  if (!replaced) {
    return `【翻译】${text}`;
  }
  
  return result;
};

const mockTranslate = async (text, sourceLang, targetLang) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const isChinese = /[\u4e00-\u9fa5]/.test(text);
  
  if (sourceLang === 'zh' || (sourceLang === 'auto' && isChinese)) {
    if (targetLang === 'en') {
      return translateZhToEn(text);
    }
  }
  
  if (sourceLang === 'en' || (sourceLang === 'auto' && !isChinese)) {
    if (targetLang === 'zh') {
      return translateEnToZh(text);
    }
  }
  
  if (targetLang === 'zh') {
    return `【翻译】${text}`;
  }
  
  return `Translation: ${text}`;
};

router.post('/translate', async (req, res) => {
  try {
    const { source_text, source_lang = 'auto', target_lang = 'zh' } = req.body;

    if (!source_text) {
      return res.status(400).json(errorResponse('翻译文本不能为空'));
    }

    const targetText = await mockTranslate(source_text, source_lang, target_lang);

    if (req.user) {
      await runAsync(
        'INSERT INTO translation_history (user_id, source_text, target_text, source_lang, target_lang, type) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, source_text, targetText, source_lang, target_lang, 'text']
      );
    }

    res.json(successResponse({
      source_text,
      target_text: targetText,
      source_lang: source_lang,
      target_lang
    }, '翻译成功'));
  } catch (error) {
    handleError(res, error, '翻译失败');
  }
});

router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let history = [];
    if (req.user) {
      history = await allAsync(
        'SELECT * FROM translation_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [req.user.id, parseInt(limit), parseInt(offset)]
      );
    }

    res.json(successResponse({ history, total: history.length }));
  } catch (error) {
    handleError(res, error, '获取历史记录失败');
  }
});

router.delete('/history', requireAuth, async (req, res) => {
  try {
    await runAsync('DELETE FROM translation_history WHERE user_id = ?', [req.user.id]);
    res.json(successResponse(null, '清空历史记录成功'));
  } catch (error) {
    handleError(res, error, '清空历史记录失败');
  }
});

router.post('/favorite', requireAuth, async (req, res) => {
  try {
    const { source_text, target_text, source_lang, target_lang } = req.body;

    if (!source_text || !target_text) {
      return res.status(400).json(errorResponse('参数不完整'));
    }

    await runAsync(
      'INSERT OR IGNORE INTO favorite_translations (user_id, source_text, target_text, source_lang, target_lang) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, source_text, target_text, source_lang, target_lang]
    );

    res.json(successResponse(null, '收藏成功'));
  } catch (error) {
    handleError(res, error, '收藏失败');
  }
});

router.get('/favorites', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const favorites = await allAsync(
      'SELECT * FROM favorite_translations WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.user.id, parseInt(limit), parseInt(offset)]
    );

    res.json(successResponse({ favorites, total: favorites.length }));
  } catch (error) {
    handleError(res, error, '获取收藏失败');
  }
});

router.post('/voice', async (req, res) => {
  try {
    const { audio_data, source_lang = 'auto', target_lang = 'zh' } = req.body;

    if (!audio_data) {
      return res.status(400).json(errorResponse('音频数据不能为空'));
    }

    const mockRecognizedText = audio_data.text || audio_data;
    
    const targetText = await mockTranslate(mockRecognizedText, source_lang, target_lang);

    if (req.user) {
      await runAsync(
        'INSERT INTO translation_history (user_id, source_text, target_text, source_lang, target_lang, type) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, mockRecognizedText, targetText, source_lang, target_lang, 'voice']
      );
    }

    res.json(successResponse({
      source_text: mockRecognizedText,
      target_text: targetText,
      source_lang,
      target_lang,
      audio_url: null
    }, '语音翻译成功'));
  } catch (error) {
    handleError(res, error, '语音翻译失败');
  }
});

module.exports = router;
