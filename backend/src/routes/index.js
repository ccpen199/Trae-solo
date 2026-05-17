const express = require('express');
const router = express.Router();
const { authMiddleware, adminAuthMiddleware } = require('../middleware/auth');
const userController = require('../controllers/userController');
const consultationController = require('../controllers/consultationController');
const lawyerController = require('../controllers/lawyerController');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');
const { db } = require('../models/database');

router.post('/user/login', userController.loginOrRegister);
router.get('/user/profile', authMiddleware, userController.getProfile);
router.get('/user/orders', authMiddleware, userController.getOrders);

router.get('/question-types', consultationController.getQuestionTypes);
router.post('/consult/quick', authMiddleware, consultationController.createQuickConsultOrder);
router.post('/consult/text', authMiddleware, consultationController.createTextConsultOrder);
router.get('/consult/:orderId', authMiddleware, consultationController.getConsultationDetail);
router.post('/consult/:consultationId/message', authMiddleware, consultationController.sendMessage);
router.post('/consult/:orderId/review', authMiddleware, consultationController.submitReview);

router.get('/lawyers', lawyerController.getLawyers);
router.get('/lawyers/:id', lawyerController.getLawyerDetail);
router.post('/lawyers/consult', authMiddleware, lawyerController.createLawyerConsultOrder);

router.get('/daily-law', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let law = db.prepare('SELECT * FROM daily_laws WHERE date = ?').get(today);
    
    if (!law) {
      const laws = [
        { title: '民法典亮点解读', content: '民法典是新中国第一部以法典命名的法律，共7编1260条，是民事权利的宣言书和保障书。' },
        { title: '劳动合同法要点', content: '用人单位自用工之日起超过一个月不满一年未与劳动者订立书面劳动合同的，应当向劳动者每月支付二倍的工资。' },
        { title: '交通事故赔偿标准', content: '交通事故赔偿项目包括医疗费、误工费、护理费、交通费、住宿费、住院伙食补助费、必要的营养费等。' },
        { title: '离婚财产分割原则', content: '离婚时，夫妻的共同财产由双方协议处理；协议不成的，由人民法院根据财产的具体情况，按照照顾子女、女方和无过错方权益的原则判决。' },
        { title: '消费者权益保护', content: '经营者提供商品或者服务有欺诈行为的，应当按照消费者的要求增加赔偿其受到的损失，增加赔偿的金额为消费者购买商品的价款或者接受服务的费用的三倍。' }
      ];
      const randomLaw = laws[Math.floor(Math.random() * laws.length)];
      db.prepare('INSERT OR IGNORE INTO daily_laws (title, content, date) VALUES (?, ?, ?)').run(randomLaw.title, randomLaw.content, today);
      law = db.prepare('SELECT * FROM daily_laws WHERE date = ?').get(today);
    }
    
    res.json({ success: true, data: law });
  } catch (error) {
    res.json({ success: false, message: '获取每日一法失败' });
  }
});

router.get('/consultations', authMiddleware, (req, res) => {
  try {
    const consultations = db.prepare(`
      SELECT c.*, o.type as order_type, l.name as lawyer_name, qt.name as question_type_name
      FROM consultations c
      LEFT JOIN orders o ON c.order_id = o.id
      LEFT JOIN lawyers l ON c.lawyer_id = l.id
      LEFT JOIN question_types qt ON o.question_type_id = qt.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `).all(req.user.id);
    
    res.json({ success: true, data: consultations });
  } catch (error) {
    console.error('获取咨询列表错误:', error);
    res.json({ success: false, message: '获取咨询列表失败' });
  }
});

router.post('/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.json({ success: false, message: '请输入用户名和密码' });
    }

    const admin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res.json({ success: false, message: '用户名或密码错误' });
    }

    const token = jwt.sign({ adminId: admin.id }, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      success: true,
      data: {
        admin: { id: admin.id, username: admin.username, role: admin.role },
        token
      }
    });
  } catch (error) {
    console.error('管理员登录错误:', error);
    res.json({ success: false, message: '登录失败' });
  }
});

router.get('/admin/stats', adminAuthMiddleware, (req, res) => {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const lawyerCount = db.prepare('SELECT COUNT(*) as count FROM lawyers').get().count;
    const todayRevenue = db.prepare("SELECT SUM(amount) as total FROM orders WHERE DATE(created_at) = DATE('now')").get().total || 0;
    
    res.json({
      success: true,
      data: {
        userCount,
        orderCount,
        lawyerCount,
        todayRevenue
      }
    });
  } catch (error) {
    res.json({ success: false, message: '获取统计数据失败' });
  }
});

router.get('/admin/orders', adminAuthMiddleware, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, u.nickname as user_name, l.name as lawyer_name, qt.name as question_type_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN lawyers l ON o.lawyer_id = l.id
      LEFT JOIN question_types qt ON o.question_type_id = qt.id
      ORDER BY o.created_at DESC
      LIMIT 100
    `).all();
    
    res.json({ success: true, data: orders });
  } catch (error) {
    res.json({ success: false, message: '获取订单列表失败' });
  }
});

module.exports = router;
