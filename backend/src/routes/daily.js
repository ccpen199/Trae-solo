const express = require('express');
const router = express.Router();
const { db } = require('../db');

router.get('/word', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const word = db.prepare('SELECT * FROM daily_words WHERE date = ?').get(today);
    
    if (!word) {
      const defaultWord = {
        date: today,
        word: 'ephemeral',
        phonetic: '/ɪˈfemərəl/',
        meaning: '短暂的;瞬息的',
        example: 'Fame is ephemeral in the entertainment industry.',
        example_translation: '在娱乐业，名声是转瞬即逝的。'
      };
      return res.json({ success: true, data: defaultWord });
    }

    res.json({ success: true, data: word });
  } catch (error) {
    console.error('Get daily word error:', error);
    res.status(500).json({ success: false, message: '获取每日热词失败' });
  }
});

router.get('/reading', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const reading = db.prepare('SELECT * FROM daily_readings WHERE date = ?').get(today);
    
    if (!reading) {
      const defaultReading = {
        date: today,
        title: 'The Power of Habit',
        content: 'Habits are the compound interest of self-improvement. The same way that money multiplies through compound interest, the effects of your habits multiply as you repeat them.',
        translation: '习惯是自我提升的复利。就像金钱通过复利增值一样，习惯的效果也会随着重复而倍增。',
        source: 'Atomic Habits'
      };
      return res.json({ success: true, data: defaultReading });
    }

    res.json({ success: true, data: reading });
  } catch (error) {
    console.error('Get daily reading error:', error);
    res.status(500).json({ success: false, message: '获取每日一读失败' });
  }
});

router.get('/movie', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const movie = db.prepare('SELECT * FROM daily_movies WHERE date = ?').get(today);
    
    if (!movie) {
      const defaultMovie = {
        date: today,
        movie_name: 'The Shawshank Redemption',
        line: 'Hope is a good thing, maybe the best of things, and no good thing ever dies.',
        line_translation: '希望是美好的，也许是人间至善，而美好的事物永不消逝。',
        cover: ''
      };
      return res.json({ success: true, data: defaultMovie });
    }

    res.json({ success: true, data: movie });
  } catch (error) {
    console.error('Get daily movie error:', error);
    res.status(500).json({ success: false, message: '获取每日抖英失败' });
  }
});

router.get('/all', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const word = db.prepare('SELECT * FROM daily_words WHERE date = ?').get(today);
    const reading = db.prepare('SELECT * FROM daily_readings WHERE date = ?').get(today);
    const movie = db.prepare('SELECT * FROM daily_movies WHERE date = ?').get(today);

    res.json({
      success: true,
      data: {
        word: word || { word: 'ephemeral', meaning: '短暂的;瞬息的' },
        reading: reading || { title: 'The Power of Habit' },
        movie: movie || { movie_name: 'The Shawshank Redemption' }
      }
    });
  } catch (error) {
    console.error('Get daily all error:', error);
    res.status(500).json({ success: false, message: '获取每日计划失败' });
  }
});

module.exports = router;
