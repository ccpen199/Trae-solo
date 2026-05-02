require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./memoryStore');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const JWT_SECRET = process.env.JWT_SECRET || 'online-learning-platform-jwt-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: '未授权' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.findById('users', decoded.userId);
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: '无效的 token' });
  }
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    const existingUser = db.findOne('users', { email }) || db.findOne('users', { username });
    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email ? '邮箱已被注册' : '用户名已被使用' 
      });
    }

    const user = db.create('users', {
      username,
      email,
      password: db._hashPassword(password),
      role: role || 'student',
      avatar: '',
      bio: '',
      phone: '',
      status: 'active'
    });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ message: '注册失败', error: error.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    const user = db.findOne('users', { email });
    if (!user) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    const isMatch = db.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: '账户已被禁用' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ message: '登录失败', error: error.message });
  }
});

app.get('/api/auth/me', verifyToken, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar,
      bio: req.user.bio,
      phone: req.user.phone
    }
  });
});

app.get('/api/courses', (req, res) => {
  const courses = db.find('courses', { status: 'published' });
  res.json({
    courses,
    total: courses.length
  });
});

app.get('/api/courses/:id', (req, res) => {
  const course = db.findById('courses', req.params.id);
  if (!course) {
    return res.status(404).json({ message: '课程不存在' });
  }
  res.json({ course });
});

app.get('/api/enrollments/my', verifyToken, (req, res) => {
  const enrollments = db.find('enrollments', { user: req.user._id });
  res.json({
    enrollments,
    total: enrollments.length
  });
});

app.post('/api/enrollments', verifyToken, (req, res) => {
  const { courseId } = req.body;
  const course = db.findById('courses', courseId);
  
  if (!course) {
    return res.status(404).json({ message: '课程不存在' });
  }

  const existing = db.findOne('enrollments', { user: req.user._id, course: courseId });
  if (existing) {
    return res.status(400).json({ message: '已选修该课程' });
  }

  const enrollment = db.create('enrollments', {
    user: req.user._id,
    userInfo: { username: req.user.username, avatar: req.user.avatar },
    course: courseId,
    courseInfo: { title: course.title, coverImage: course.coverImage },
    status: 'active',
    progress: 0,
    totalWatchTime: 0,
    completedLessons: [],
    completedChapters: []
  });

  res.status(201).json({
    message: '选课成功',
    enrollment
  });
});

app.get('/api/assignments', verifyToken, (req, res) => {
  let assignments;
  if (req.user.role === 'student') {
    assignments = db.find('assignments', { status: 'published' });
  } else {
    assignments = db.find('assignments', {});
  }
  res.json({
    assignments,
    total: assignments.length
  });
});

app.get('/api/assignments/:id', verifyToken, (req, res) => {
  const assignment = db.findById('assignments', req.params.id);
  if (!assignment) {
    return res.status(404).json({ message: '作业不存在' });
  }
  res.json({ assignment });
});

app.get('/api/questions', verifyToken, (req, res) => {
  const questions = db.find('questions', {});
  res.json({
    questions,
    total: questions.length
  });
});

app.get('/api/questions/:id', verifyToken, (req, res) => {
  const question = db.findById('questions', req.params.id);
  if (!question) {
    return res.status(404).json({ message: '问题不存在' });
  }
  
  const updatedQuestion = db.findByIdAndUpdate('questions', question._id, {
    views: (question.views || 0) + 1
  });
  
  res.json({ question: updatedQuestion });
});

app.post('/api/questions', verifyToken, (req, res) => {
  const { title, content, courseId, tags } = req.body;
  const course = courseId ? db.findById('courses', courseId) : null;

  const question = db.create('questions', {
    title,
    content,
    course: courseId,
    courseInfo: course ? { title: course.title } : null,
    user: req.user._id,
    userInfo: { username: req.user.username, avatar: req.user.avatar },
    tags: tags || [],
    status: 'open',
    views: 0,
    likeCount: 0,
    likes: [],
    answerCount: 0,
    answers: []
  });

  res.status(201).json({
    message: '提问成功',
    question
  });
});

app.post('/api/questions/:id/answers', verifyToken, (req, res) => {
  const { content } = req.body;
  const question = db.findById('questions', req.params.id);
  
  if (!question) {
    return res.status(404).json({ message: '问题不存在' });
  }

  const answer = {
    _id: db._generateId(),
    user: req.user._id,
    userInfo: { 
      username: req.user.username, 
      avatar: req.user.avatar,
      role: req.user.role 
    },
    content,
    likeCount: 0,
    likes: [],
    isAccepted: false,
    createdAt: new Date().toISOString()
  };

  const updatedQuestion = db.findByIdAndUpdate('questions', question._id, {
    answers: [...(question.answers || []), answer],
    answerCount: (question.answerCount || 0) + 1
  });

  res.status(201).json({
    message: '回答成功',
    answer,
    question: updatedQuestion
  });
});

app.get('/api/certificates/my', verifyToken, (req, res) => {
  const certificates = db.find('certificates', { user: req.user._id });
  res.json({
    certificates,
    total: certificates.length
  });
});

app.get('/api/orders/my', verifyToken, (req, res) => {
  const orders = db.find('orders', { user: req.user._id });
  res.json({
    orders,
    total: orders.length
  });
});

app.post('/api/orders', verifyToken, (req, res) => {
  const { courseId } = req.body;
  const course = db.findById('courses', courseId);
  
  if (!course) {
    return res.status(404).json({ message: '课程不存在' });
  }

  const orderNo = 'ORD' + Date.now().toString().slice(-10);
  const order = db.create('orders', {
    orderNo,
    user: req.user._id,
    userInfo: { 
      username: req.user.username, 
      avatar: req.user.avatar,
      email: req.user.email 
    },
    course: courseId,
    courseInfo: { 
      title: course.title, 
      price: course.price,
      originalPrice: course.originalPrice,
      coverImage: course.coverImage 
    },
    totalAmount: course.price,
    discountAmount: 0,
    payAmount: course.price,
    status: 'pending',
    paymentMethod: null,
    timeline: [
      { time: new Date().toISOString(), description: '订单创建' }
    ]
  });

  res.status(201).json({
    message: '订单创建成功',
    order
  });
});

app.post('/api/orders/:id/pay', verifyToken, (req, res) => {
  const { paymentMethod } = req.body;
  const order = db.findById('orders', req.params.id);
  
  if (!order) {
    return res.status(404).json({ message: '订单不存在' });
  }

  if (order.user !== req.user._id) {
    return res.status(403).json({ message: '无权限操作此订单' });
  }

  if (order.status === 'completed') {
    return res.status(400).json({ message: '订单已支付' });
  }

  const now = new Date().toISOString();
  const updatedOrder = db.findByIdAndUpdate('orders', order._id, {
    status: 'completed',
    paymentMethod: paymentMethod || 'alipay',
    paymentInfo: { tradeNo: '2024' + Date.now().toString() },
    paidAt: now,
    timeline: [
      ...order.timeline,
      { time: now, description: '支付成功' }
    ]
  });

  const course = db.findById('courses', order.course);
  if (course) {
    const existingEnrollment = db.findOne('enrollments', { 
      user: req.user._id, 
      course: order.course 
    });
    
    if (!existingEnrollment) {
      db.create('enrollments', {
        user: req.user._id,
        userInfo: { username: req.user.username, avatar: req.user.avatar },
        course: order.course,
        courseInfo: { title: course.title, coverImage: course.coverImage },
        status: 'active',
        progress: 0,
        totalWatchTime: 0,
        completedLessons: [],
        completedChapters: []
      });
    }
  }

  res.json({
    message: '支付成功',
    order: updatedOrder
  });
});

app.get('/api/stats/overview', verifyToken, (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const isTeacher = req.user.role === 'teacher';
  
  const courses = db.find('courses', { status: 'published' });
  const orders = db.find('orders', { status: 'completed' });
  const enrollments = db.find('enrollments', {});
  const users = db.find('users', { role: 'student' });
  const assignments = db.find('assignments', {});
  const questions = db.find('questions', {});

  const totalRevenue = orders.reduce((sum, o) => sum + (o.payAmount || 0), 0);
  const totalStudents = users.length;
  const totalCourses = courses.length;

  res.json({
    overview: {
      totalRevenue,
      totalStudents,
      totalCourses,
      totalOrders: orders.length,
      totalEnrollments: enrollments.length,
      totalAssignments: assignments.length,
      totalQuestions: questions.length
    }
  });
});

app.get('/api/stats/course/:id', verifyToken, (req, res) => {
  const course = db.findById('courses', req.params.id);
  if (!course) {
    return res.status(404).json({ message: '课程不存在' });
  }

  const enrollments = db.find('enrollments', { course: course._id });
  const orders = db.find('orders', { course: course._id, status: 'completed' });
  const assignments = db.find('assignments', { course: course._id });

  const revenue = orders.reduce((sum, o) => sum + (o.payAmount || 0), 0);
  const avgProgress = enrollments.length > 0 
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length)
    : 0;

  res.json({
    stats: {
      course,
      totalStudents: enrollments.length,
      revenue,
      avgProgress,
      totalAssignments: assignments.length
    }
  });
});

app.all('/api/*', (req, res) => {
  res.status(404).json({ message: 'API接口不存在' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器内部错误', error: err.message });
});

const PORT = process.env.PORT || 9456;

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  在线课程学习平台 - 后端服务`);
  console.log(`========================================`);
  console.log(`  服务器运行在端口: ${PORT}`);
  console.log(`  健康检查: http://localhost:${PORT}/api/health`);
  console.log(`========================================`);
  console.log(`  默认账号 (已在内存存储中初始化):`);
  console.log(`  - 管理员: admin@learning.com / admin123456`);
  console.log(`  - 教师: teacher@learning.com / teacher123456`);
  console.log(`  - 助教: ta@learning.com / ta123456`);
  console.log(`  - 学员: student@learning.com / student123456`);
  console.log(`========================================`);
});
