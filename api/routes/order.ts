import { Router } from 'express';
import { getDb, withTransaction } from '../db';
import { success, error } from '../utils/response';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

function generateOrderNo(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `FD${timestamp}${random}`;
}

router.post('/create', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { type, item_id } = req.body;

    if (!type || !item_id) {
      return error(res, '参数不完整', 400);
    }

    const db = getDb();
    let price = 0;
    let itemTitle = '';
    let itemCover = '';

    switch (type) {
      case 'vip':
        price = 365;
        itemTitle = '樊登读书年度VIP会员';
        break;
      case 'book':
        const book = db.prepare('SELECT title, cover, is_free FROM books WHERE id = ?').get(item_id);
        if (!book) return error(res, '书籍不存在', 404);
        if (book.is_free) return error(res, '该书籍可免费收听', 400);
        itemTitle = book.title;
        itemCover = book.cover;
        price = 19.9;
        break;
      case 'course':
        const course = db.prepare('SELECT title, cover, price, is_free FROM courses WHERE id = ?').get(item_id);
        if (!course) return error(res, '课程不存在', 404);
        if (course.is_free) return error(res, '该课程可免费观看', 400);
        itemTitle = course.title;
        itemCover = course.cover;
        price = course.price;
        break;
      case 'ebook':
        const ebook = db.prepare('SELECT title, cover, price, is_free FROM ebooks WHERE id = ?').get(item_id);
        if (!ebook) return error(res, '电子书不存在', 404);
        if (ebook.is_free) return error(res, '该电子书可免费阅读', 400);
        itemTitle = ebook.title;
        itemCover = ebook.cover;
        price = ebook.price;
        break;
      case 'product':
        const product = db.prepare('SELECT title, cover, price FROM products WHERE id = ?').get(item_id);
        if (!product) return error(res, '商品不存在', 404);
        itemTitle = product.title;
        itemCover = product.cover;
        price = product.price;
        break;
      default:
        return error(res, '无效的订单类型', 400);
    }

    const orderNo = generateOrderNo();
    const result = db.prepare(`
      INSERT INTO orders (order_no, user_id, type, item_id, item_title, item_cover, amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `).run(orderNo, req.user!.id, type, item_id, itemTitle, itemCover, price);

    success(res, {
      order_id: result.lastInsertRowid,
      order_no: orderNo,
      amount: price
    }, '订单创建成功');
  } catch (err) {
    console.error(err);
    error(res, '创建订单失败');
  }
});

router.post('/pay', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { order_no } = req.body;

    if (!order_no) {
      return error(res, '订单号不能为空', 400);
    }

    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE order_no = ? AND user_id = ?').get(order_no, req.user!.id);

    if (!order) {
      return error(res, '订单不存在', 404);
    }

    if (order.status === 1) {
      return success(res, null, '订单已支付');
    }

    withTransaction(() => {
      db.prepare('UPDATE orders SET status = 1, paid_at = CURRENT_TIMESTAMP WHERE id = ?').run(order.id);

      switch (order.type) {
        case 'vip':
          db.prepare('UPDATE users SET is_vip = 1, vip_expire_at = DATETIME(\'now\', \'+1 year\') WHERE id = ?').run(req.user!.id);
          break;
        case 'book':
          const bookExists = db.prepare('SELECT id FROM user_books WHERE user_id = ? AND book_id = ?').get(req.user!.id, order.item_id);
          if (!bookExists) {
            db.prepare('INSERT INTO user_books (user_id, book_id) VALUES (?, ?)').run(req.user!.id, order.item_id);
          }
          break;
        case 'course':
          const courseExists = db.prepare('SELECT id FROM user_courses WHERE user_id = ? AND course_id = ?').get(req.user!.id, order.item_id);
          if (!courseExists) {
            db.prepare('INSERT INTO user_courses (user_id, course_id) VALUES (?, ?)').run(req.user!.id, order.item_id);
          }
          break;
        case 'ebook':
          const ebookExists = db.prepare('SELECT id FROM user_ebooks WHERE user_id = ? AND ebook_id = ?').get(req.user!.id, order.item_id);
          if (!ebookExists) {
            db.prepare('INSERT INTO user_ebooks (user_id, ebook_id) VALUES (?, ?)').run(req.user!.id, order.item_id);
          }
          break;
      }
    });

    success(res, null, '支付成功');
  } catch (err) {
    console.error(err);
    error(res, '支付失败');
  }
});

router.get('/list', authMiddleware, (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.id);
    success(res, orders);
  } catch (err) {
    console.error(err);
    error(res, '获取订单列表失败');
  }
});

export default router;
