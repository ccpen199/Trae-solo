import { Router } from 'express';
import { getDb } from '../db';
import { success, error } from '../utils/response';
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/banners', (req, res) => {
  try {
    const db = getDb();
    const banners = db.prepare('SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order ASC').all();
    success(res, banners);
  } catch (err) {
    console.error(err);
    error(res, '获取轮播图失败');
  }
});

router.get('/books', optionalAuthMiddleware, (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const books = db.prepare(`
      SELECT b.*, 
        CASE WHEN ub.user_id IS NOT NULL THEN 1 ELSE 0 END as owned
      FROM books b
      LEFT JOIN user_books ub ON b.id = ub.book_id AND ub.user_id = ?
      ORDER BY b.id DESC
      LIMIT 10
    `).all(req.user?.id || 0);
    success(res, books);
  } catch (err) {
    console.error(err);
    error(res, '获取书籍列表失败');
  }
});

router.get('/books/:id', optionalAuthMiddleware, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const book = db.prepare(`
      SELECT b.*,
        CASE WHEN ub.user_id IS NOT NULL THEN 1 ELSE 0 END as owned
      FROM books b
      LEFT JOIN user_books ub ON b.id = ub.book_id AND ub.user_id = ?
      WHERE b.id = ?
    `).get(req.user?.id || 0, id);

    if (!book) {
      return error(res, '书籍不存在', 404);
    }

    db.prepare('UPDATE books SET play_count = play_count + 1 WHERE id = ?').run(id);

    success(res, book);
  } catch (err) {
    console.error(err);
    error(res, '获取书籍详情失败');
  }
});

router.get('/courses', (req, res) => {
  try {
    const db = getDb();
    const courses = db.prepare('SELECT * FROM courses ORDER BY id DESC').all();
    success(res, courses);
  } catch (err) {
    console.error(err);
    error(res, '获取课程列表失败');
  }
});

router.get('/courses/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
    
    if (!course) {
      return error(res, '课程不存在', 404);
    }

    const lessons = db.prepare('SELECT * FROM course_lessons WHERE course_id = ? ORDER BY sort_order ASC').all(id);
    const comments = db.prepare(`
      SELECT c.*, u.nickname, u.avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.type = 'course' AND c.item_id = ?
      ORDER BY c.created_at DESC
      LIMIT 10
    `).all(id);

    success(res, { course, lessons, comments });
  } catch (err) {
    console.error(err);
    error(res, '获取课程详情失败');
  }
});

router.get('/ebooks', (req, res) => {
  try {
    const db = getDb();
    const ebooks = db.prepare('SELECT * FROM ebooks ORDER BY id DESC').all();
    success(res, ebooks);
  } catch (err) {
    console.error(err);
    error(res, '获取电子书列表失败');
  }
});

router.get('/ebooks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const ebook = db.prepare('SELECT * FROM ebooks WHERE id = ?').get(id);
    
    if (!ebook) {
      return error(res, '电子书不存在', 404);
    }

    success(res, ebook);
  } catch (err) {
    console.error(err);
    error(res, '获取电子书详情失败');
  }
});

router.get('/products', (req, res) => {
  try {
    const db = getDb();
    const products = db.prepare('SELECT * FROM products ORDER BY sales DESC').all();
    success(res, products);
  } catch (err) {
    console.error(err);
    error(res, '获取商品列表失败');
  }
});

router.get('/vip-info', (req, res) => {
  success(res, {
    price: 365,
    original_price: 488,
    benefits: [
      '畅听全场2000+精选书籍',
      '观看全部付费课程',
      '专属会员标识',
      '每月赠送智慧币',
      '优先参与线下活动'
    ]
  });
});

export default router;
