const express = require('express');
const router = express.Router();
const { db } = require('../db');

router.get('/courses', (req, res) => {
  try {
    const courses = db.prepare('SELECT * FROM courses ORDER BY created_at DESC LIMIT 20').all();

    if (courses.length === 0) {
      const defaultCourses = [
        { id: 1, title: '英语口语入门', cover: '', description: '从零开始学习英语口语', instructor: '张老师', is_vip: 0, price: 0 },
        { id: 2, title: '商务英语进阶', cover: '', description: '职场必备商务英语', instructor: '李老师', is_vip: 1, price: 99 },
        { id: 3, title: '雅思听力突破', cover: '', description: '雅思听力高分技巧', instructor: '王老师', is_vip: 1, price: 199 }
      ];
      return res.json({ success: true, data: defaultCourses });
    }

    res.json({ success: true, data: courses });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ success: false, message: '获取课程列表失败' });
  }
});

router.get('/books', (req, res) => {
  try {
    const books = db.prepare('SELECT * FROM books ORDER BY created_at DESC LIMIT 20').all();

    if (books.length === 0) {
      const defaultBooks = [
        { id: 1, title: '小王子', author: 'Antoine de Saint-Exupéry', cover: '', description: '一本温暖心灵的童话', chapters: 27, is_vip: 0 },
        { id: 2, title: '傲慢与偏见', author: 'Jane Austen', cover: '', description: '经典爱情小说', chapters: 61, is_vip: 1 },
        { id: 3, title: '老人与海', author: 'Ernest Hemingway', cover: '', description: '诺贝尔文学奖作品', chapters: 1, is_vip: 1 }
      ];
      return res.json({ success: true, data: defaultBooks });
    }

    res.json({ success: true, data: books });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ success: false, message: '获取书籍列表失败' });
  }
});

router.get('/book/:id/chapter/:chapterNumber', (req, res) => {
  try {
    const bookId = req.params.id;
    const chapterNumber = parseInt(req.params.chapterNumber);

    if (!req.user && chapterNumber > 2) {
      return res.status(403).json({
        success: false,
        message: '请登录后阅读更多章节'
      });
    }

    if (req.user && !req.user.is_vip && chapterNumber > 2) {
      return res.status(403).json({
        success: false,
        message: 'VIP会员可阅读全文'
      });
    }

    const chapter = {
      book_id: bookId,
      chapter_number: chapterNumber,
      title: `第${chapterNumber}章`,
      content: '(书籍内容模拟) The quick brown fox jumps over the lazy dog. This is a sample chapter content for demonstration purposes.'
    };

    res.json({ success: true, data: chapter });
  } catch (error) {
    console.error('Get chapter error:', error);
    res.status(500).json({ success: false, message: '获取章节内容失败' });
  }
});

module.exports = router;
