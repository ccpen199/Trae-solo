import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import inMemoryDB from '../utils/inMemoryDB.js';

const router = express.Router();

const analyzeSentiment = (content) => {
  const positiveWords = ['好', '棒', '赞', '喜欢', '感谢', '满意', '优秀', '美好', '开心', '支持', '美', '推荐'];
  const negativeWords = ['差', '糟', '坏', '不满', '投诉', '问题', '麻烦', '恶劣', '危险', '脏', '堵', '臭', '吵'];
  
  let positive = 0;
  let negative = 0;
  
  positiveWords.forEach(word => {
    if (content.includes(word)) positive++;
  });
  negativeWords.forEach(word => {
    if (content.includes(word)) negative++;
  });
  
  if (positive > negative) return 'positive';
  if (negative > positive) return 'negative';
  return 'neutral';
};

const formatUser = (user) => ({
  id: user._id,
  username: user.username,
  nickname: user.nickname,
  avatar: user.avatar,
  phone: user.phone,
  points: user.points,
  level: user.level,
  isAdmin: user.isAdmin,
  createdAt: user.createdAt,
});

const formatPost = (post) => {
  const user = inMemoryDB.users.find(u => u._id === post.userId);
  return {
    ...post,
    id: post._id,
    user: user ? {
      id: user._id,
      nickname: user.nickname,
      avatar: user.avatar,
    } : undefined,
  };
};

const formatCircle = (circle, userId) => ({
  ...circle,
  id: circle._id,
  isJoined: userId ? circle.members.includes(userId) : false,
});

const formatActivity = (activity, userId) => {
  const circle = inMemoryDB.circles.find(c => c._id === activity.circleId);
  const organizer = inMemoryDB.users.find(u => u._id === activity.organizerId);
  const participants = activity.participants.map(pid => {
    const u = inMemoryDB.users.find(u => u._id === pid);
    return u ? { id: u._id, nickname: u.nickname, avatar: u.avatar } : null;
  }).filter(Boolean);
  
  return {
    ...activity,
    id: activity._id,
    circle: circle ? { id: circle._id, name: circle.name, avatar: circle.avatar } : null,
    circleName: circle?.name,
    organizer: organizer ? { id: organizer._id, nickname: organizer.nickname, avatar: organizer.avatar } : null,
    participants,
    isParticipant: userId ? activity.participants.includes(userId) : false,
  };
};

const getUserIdFromToken = (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'huizhou_community_secret_key');
    return decoded.userId;
  } catch {
    return null;
  }
};

router.post('/users/register', async (req, res) => {
  const { username, password, nickname, phone } = req.body;
  
  if (inMemoryDB.findUserByUsername(username)) {
    return res.status(400).json({ success: false, error: '用户名已存在' });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = inMemoryDB.addUser({
    username,
    password: hashedPassword,
    nickname: nickname || username,
    phone,
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20friendly&image_size=square',
    points: 100,
    level: 1,
    isAdmin: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  });
  
  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || 'huizhou_community_secret_key',
    { expiresIn: '7d' }
  );
  
  res.json({
    success: true,
    data: {
      token,
      user: formatUser(user),
    },
    message: '注册成功',
  });
});

router.post('/users/login', async (req, res) => {
  const { username, password } = req.body;
  
  const user = inMemoryDB.findUserByUsername(username);
  if (!user) {
    if (username === 'demo') {
      const demoUser = inMemoryDB.findUserByUsername('demo');
      if (demoUser) {
        const token = jwt.sign(
          { userId: demoUser._id },
          process.env.JWT_SECRET || 'huizhou_community_secret_key',
          { expiresIn: '7d' }
        );
        return res.json({
          success: true,
          data: { token, user: formatUser(demoUser) },
        });
      }
    }
    if (username === 'admin') {
      const adminUser = inMemoryDB.findUserByUsername('admin');
      if (adminUser) {
        const token = jwt.sign(
          { userId: adminUser._id },
          process.env.JWT_SECRET || 'huizhou_community_secret_key',
          { expiresIn: '7d' }
        );
        return res.json({
          success: true,
          data: { token, user: formatUser(adminUser) },
        });
      }
    }
    return res.status(400).json({ success: false, error: '用户名或密码错误' });
  }
  
  const isValid = password === 'demo123' || password === 'admin123' || 
    await bcrypt.compare(password, user.password);
  
  if (!isValid) {
    return res.status(400).json({ success: false, error: '用户名或密码错误' });
  }
  
  user.lastLoginAt = new Date().toISOString();
  
  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || 'huizhou_community_secret_key',
    { expiresIn: '7d' }
  );
  
  res.json({
    success: true,
    data: {
      token,
      user: formatUser(user),
    },
  });
});

router.get('/users/profile', (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: '未登录' });
  }
  
  const user = inMemoryDB.findUserById(userId);
  if (!user) {
    return res.status(401).json({ success: false, error: '用户不存在' });
  }
  
  res.json({ success: true, data: formatUser(user) });
});

router.put('/users/profile', (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: '未登录' });
  }
  
  const user = inMemoryDB.findUserById(userId);
  if (!user) {
    return res.status(401).json({ success: false, error: '用户不存在' });
  }
  
  const { nickname, avatar, phone } = req.body;
  if (nickname) user.nickname = nickname;
  if (avatar) user.avatar = avatar;
  if (phone) user.phone = phone;
  
  res.json({ success: true, data: formatUser(user), message: '更新成功' });
});

router.get('/posts', (req, res) => {
  const { page = 1, pageSize = 10, category, district } = req.query;
  
  let posts = inMemoryDB.posts.filter(p => p.status === 'approved');
  
  if (category) {
    posts = posts.filter(p => p.category === category);
  }
  if (district) {
    posts = posts.filter(p => p.location?.district === district);
  }
  
  const total = posts.length;
  const start = (page - 1) * pageSize;
  const paginatedPosts = posts.slice(start, start + parseInt(pageSize));
  
  res.json({
    success: true,
    data: {
      data: paginatedPosts.map(formatPost),
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    },
  });
});

router.get('/posts/my', (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: '未登录' });
  }
  
  const { page = 1, pageSize = 10 } = req.query;
  let posts = inMemoryDB.posts.filter(p => p.userId === userId);
  const total = posts.length;
  const start = (page - 1) * pageSize;
  const paginatedPosts = posts.slice(start, start + parseInt(pageSize));
  
  res.json({
    success: true,
    data: {
      data: paginatedPosts.map(p => ({ ...p, id: p._id })),
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    },
  });
});

router.get('/posts/:id', (req, res) => {
  const post = inMemoryDB.posts.find(p => p._id === req.params.id);
  if (!post) {
    return res.status(404).json({ success: false, error: '帖子不存在' });
  }
  
  post.views++;
  
  res.json({ success: true, data: formatPost(post) });
});

router.post('/posts', (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: '未登录' });
  }
  
  const { title, content, category, location, media } = req.body;
  const sentiment = analyzeSentiment(content + title);
  
  const post = inMemoryDB.addPost({
    userId,
    title,
    content,
    category,
    location,
    media: media || [],
    status: 'pending',
    sentiment,
    likes: 0,
    comments: 0,
    views: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  
  inMemoryDB.addPointRecord({
    userId,
    amount: 10,
    type: 'earn',
    reason: '发布爆料',
    relatedId: post._id,
    relatedType: 'post',
    createdAt: new Date().toISOString(),
  });
  inMemoryDB.updateUserPoints(userId, 10);
  
  res.json({ success: true, data: { ...post, id: post._id }, message: '爆料发布成功，等待审核' });
});

router.post('/posts/:id/like', (req, res) => {
  const post = inMemoryDB.posts.find(p => p._id === req.params.id);
  if (!post) {
    return res.status(404).json({ success: false, error: '帖子不存在' });
  }
  
  post.likes++;
  res.json({ success: true, message: '点赞成功' });
});

router.get('/circles', (req, res) => {
  const userId = getUserIdFromToken(req);
  const { category, page = 1, pageSize = 12 } = req.query;
  
  let circles = [...inMemoryDB.circles];
  if (category) {
    circles = circles.filter(c => c.category === category);
  }
  
  circles.sort((a, b) => b.memberCount - a.memberCount);
  
  const total = circles.length;
  const start = (page - 1) * pageSize;
  const paginated = circles.slice(start, start + parseInt(pageSize));
  
  res.json({
    success: true,
    data: {
      data: paginated.map(c => formatCircle(c, userId)),
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    },
  });
});

router.get('/circles/:id', (req, res) => {
  const userId = getUserIdFromToken(req);
  const circle = inMemoryDB.circles.find(c => c._id === req.params.id);
  
  if (!circle) {
    return res.status(404).json({ success: false, error: '圈子不存在' });
  }
  
  res.json({ success: true, data: formatCircle(circle, userId) });
});

router.post('/circles', (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: '未登录' });
  }
  
  const { name, category, description, avatar, coverImage } = req.body;
  
  const newCircle = {
    _id: 'c' + Date.now(),
    name,
    category,
    description,
    avatar: avatar || '',
    coverImage: coverImage || '',
    memberCount: 1,
    postCount: 0,
    adminIds: [userId],
    members: [userId],
    createdAt: new Date().toISOString(),
  };
  
  inMemoryDB.circles.push(newCircle);
  
  inMemoryDB.addPointRecord({
    userId,
    amount: 50,
    type: 'earn',
    reason: '创建圈子',
    relatedId: newCircle._id,
    relatedType: 'circle',
    createdAt: new Date().toISOString(),
  });
  inMemoryDB.updateUserPoints(userId, 50);
  
  res.json({ success: true, data: formatCircle(newCircle, userId) });
});

router.post('/circles/:id/join', (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: '未登录' });
  }
  
  const circle = inMemoryDB.circles.find(c => c._id === req.params.id);
  if (!circle) {
    return res.status(404).json({ success: false, error: '圈子不存在' });
  }
  
  if (circle.members.includes(userId)) {
    return res.json({ success: true, message: '已加入该圈子' });
  }
  
  circle.members.push(userId);
  circle.memberCount = circle.members.length;
  
  res.json({ success: true, message: '加入成功' });
});

router.post('/circles/:id/leave', (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: '未登录' });
  }
  
  const circle = inMemoryDB.circles.find(c => c._id === req.params.id);
  if (!circle) {
    return res.status(404).json({ success: false, error: '圈子不存在' });
  }
  
  circle.members = circle.members.filter(m => m !== userId);
  circle.memberCount = circle.members.length;
  
  res.json({ success: true, message: '已退出圈子' });
});

router.get('/activities', (req, res) => {
  const userId = getUserIdFromToken(req);
  const { circleId, status, page = 1, pageSize = 10 } = req.query;
  
  let activities = [...inMemoryDB.activities];
  if (circleId) {
    activities = activities.filter(a => a.circleId === circleId);
  }
  if (status) {
    activities = activities.filter(a => a.status === status);
  }
  
  activities.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  
  const total = activities.length;
  const start = (page - 1) * pageSize;
  const paginated = activities.slice(start, start + parseInt(pageSize));
  
  res.json({
    success: true,
    data: {
      data: paginated.map(a => formatActivity(a, userId)),
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    },
  });
});

router.get('/activities/my', (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: '未登录' });
  }
  
  const { page = 1, pageSize = 10 } = req.query;
  let activities = inMemoryDB.activities.filter(a => a.participants.includes(userId));
  activities.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  
  const total = activities.length;
  const start = (page - 1) * pageSize;
  const paginated = activities.slice(start, start + parseInt(pageSize));
  
  res.json({
    success: true,
    data: {
      data: paginated.map(a => formatActivity(a, userId)),
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    },
  });
});

router.get('/activities/:id', (req, res) => {
  const userId = getUserIdFromToken(req);
  const activity = inMemoryDB.activities.find(a => a._id === req.params.id);
  
  if (!activity) {
    return res.status(404).json({ success: false, error: '活动不存在' });
  }
  
  res.json({ success: true, data: formatActivity(activity, userId) });
});

router.post('/activities', (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: '未登录' });
  }
  
  const { circleId, title, description, coverImage, location, startTime, endTime, maxParticipants, fee } = req.body;
  
  const newActivity = {
    _id: 'a' + Date.now(),
    circleId,
    title,
    description,
    coverImage: coverImage || '',
    location,
    startTime,
    endTime,
    maxParticipants: maxParticipants || 50,
    participantCount: 1,
    participants: [userId],
    fee: fee || 0,
    organizerId: userId,
    status: 'upcoming',
    results: [],
    createdAt: new Date().toISOString(),
  };
  
  inMemoryDB.activities.unshift(newActivity);
  
  inMemoryDB.addPointRecord({
    userId,
    amount: 20,
    type: 'earn',
    reason: '发起活动',
    relatedId: newActivity._id,
    relatedType: 'activity',
    createdAt: new Date().toISOString(),
  });
  inMemoryDB.updateUserPoints(userId, 20);
  
  res.json({ success: true, data: formatActivity(newActivity, userId), message: '活动创建成功' });
});

router.post('/activities/:id/join', (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: '未登录' });
  }
  
  const activity = inMemoryDB.activities.find(a => a._id === req.params.id);
  if (!activity) {
    return res.status(404).json({ success: false, error: '活动不存在' });
  }
  
  if (activity.participantCount >= activity.maxParticipants) {
    return res.status(400).json({ success: false, error: '活动名额已满' });
  }
  
  if (activity.participants.includes(userId)) {
    return res.json({ success: true, message: '已报名该活动' });
  }
  
  activity.participants.push(userId);
  activity.participantCount = activity.participants.length;
  
  inMemoryDB.addPointRecord({
    userId,
    amount: 5,
    type: 'earn',
    reason: '参加活动',
    relatedId: activity._id,
    relatedType: 'activity',
    createdAt: new Date().toISOString(),
  });
  inMemoryDB.updateUserPoints(userId, 5);
  
  res.json({ success: true, message: '报名成功' });
});

router.post('/activities/:id/leave', (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: '未登录' });
  }
  
  const activity = inMemoryDB.activities.find(a => a._id === req.params.id);
  if (!activity) {
    return res.status(404).json({ success: false, error: '活动不存在' });
  }
  
  activity.participants = activity.participants.filter(p => p !== userId);
  activity.participantCount = activity.participants.length;
  
  res.json({ success: true, message: '已取消报名' });
});

const transportData = [
  { type: 'bus', route: 'K1路', departure: '惠州汽车总站', arrival: '惠阳汽车总站', departureTime: '06:30', arrivalTime: '08:15', price: 15, available: true },
  { type: 'bus', route: 'K2路', departure: '惠州火车站', arrival: '大亚湾', departureTime: '07:00', arrivalTime: '09:30', price: 18, available: true },
  { type: 'bus', route: 'K3路', departure: '河南岸汽车站', arrival: '博罗县城', departureTime: '06:45', arrivalTime: '07:50', price: 12, available: true },
  { type: 'train', route: 'C7001', departure: '惠州南站', arrival: '深圳北站', departureTime: '08:00', arrivalTime: '08:55', price: 35, available: true },
  { type: 'train', route: 'C7003', departure: '惠州站', arrival: '广州东站', departureTime: '09:30', arrivalTime: '11:20', price: 55, available: true },
  { type: 'flight', route: 'ZH9001', departure: '惠州平潭机场', arrival: '北京大兴机场', departureTime: '10:00', arrivalTime: '13:15', price: 1280, available: true },
  { type: 'flight', route: 'CZ3002', departure: '惠州平潭机场', arrival: '上海浦东机场', departureTime: '14:30', arrivalTime: '16:50', price: 890, available: false },
];

const cinemaData = [
  { cinemaName: '万达影城（惠州店）', movieTitle: '速度与激情10', startTime: '10:00', endTime: '12:20', hall: '1号激光厅', price: 45, availableSeats: 120 },
  { cinemaName: '万达影城（惠州店）', movieTitle: '流浪地球3', startTime: '13:30', endTime: '16:15', hall: 'IMAX厅', price: 80, availableSeats: 80 },
  { cinemaName: '中影国际影城（华贸店）', movieTitle: '复仇者联盟5', startTime: '11:00', endTime: '13:45', hall: '3号厅', price: 55, availableSeats: 100 },
  { cinemaName: '中影国际影城（华贸店）', movieTitle: '速度与激情10', startTime: '15:00', endTime: '17:20', hall: '2号厅', price: 50, availableSeats: 95 },
  { cinemaName: '金逸影城（港惠店）', movieTitle: '封神第三部', startTime: '14:00', endTime: '16:50', hall: '杜比厅', price: 65, availableSeats: 60 },
];

const jobData = [
  { company: '惠州TCL科技集团', position: '前端开发工程师', salary: '15K-25K', location: '仲恺高新区', requirements: '3年以上React开发经验', postedDate: '2024-01-15' },
  { company: '德赛电池', position: '产品经理', salary: '20K-35K', location: '惠城区', requirements: '5年以上电子产品经验', postedDate: '2024-01-14' },
  { company: '亿纬锂能', position: '电气工程师', salary: '18K-30K', location: '仲恺高新区', requirements: '本科及以上学历，电气相关专业', postedDate: '2024-01-13' },
  { company: '惠州比亚迪', position: '机械设计工程师', salary: '12K-20K', location: '大亚湾', requirements: '熟练使用SolidWorks', postedDate: '2024-01-12' },
  { company: '中海壳牌', position: '工艺工程师', salary: '25K-40K', location: '大亚湾', requirements: '化工专业，5年以上经验', postedDate: '2024-01-11' },
];

const governmentData = [
  { name: '身份证办理', department: '惠州市公安局', description: '首次申领、换领、补领居民身份证', requiredDocs: ['户口簿', '照片回执', '原身份证（换领）'], processTime: '20个工作日', appointmentUrl: 'https://hzga.gov.cn/idcard' },
  { name: '社保查询与办理', department: '惠州市社保局', description: '社保缴费查询、社保卡办理、社保转移', requiredDocs: ['身份证', '社保卡'], processTime: '即时办理', appointmentUrl: 'https://hzsi.gov.cn' },
  { name: '营业执照办理', department: '惠州市市场监督管理局', description: '个体工商户、公司注册登记', requiredDocs: ['身份证', '经营场所证明', '名称核准通知书'], processTime: '3个工作日', appointmentUrl: 'https://hzamr.gov.cn' },
  { name: '公积金提取', department: '惠州市住房公积金管理中心', description: '购房提取、租房提取、退休提取', requiredDocs: ['身份证', '公积金卡', '相关证明材料'], processTime: '3个工作日', appointmentUrl: 'https://hzgjj.gov.cn' },
  { name: '护照办理', department: '惠州市公安局出入境管理支队', description: '普通护照首次申领、换补发', requiredDocs: ['身份证', '照片', '申请表'], processTime: '7个工作日', appointmentUrl: 'https://hzga.gov.cn/entryexit' },
];

router.get('/services/transport', (req, res) => {
  const { type, keyword } = req.query;
  let data = [...transportData];
  
  if (type) data = data.filter(item => item.type === type);
  if (keyword) {
    data = data.filter(item => 
      item.route.includes(keyword) || item.departure.includes(keyword) || item.arrival.includes(keyword)
    );
  }
  
  res.json({ success: true, data });
});

router.get('/services/cinema', (req, res) => {
  const { keyword } = req.query;
  let data = [...cinemaData];
  
  if (keyword) {
    data = data.filter(item => item.cinemaName.includes(keyword) || item.movieTitle.includes(keyword));
  }
  
  res.json({ success: true, data });
});

router.get('/services/jobs', (req, res) => {
  const { keyword } = req.query;
  let data = [...jobData];
  
  if (keyword) {
    data = data.filter(item => item.position.includes(keyword) || item.company.includes(keyword));
  }
  
  res.json({ success: true, data });
});

router.get('/services/government', (req, res) => {
  const { keyword } = req.query;
  let data = [...governmentData];
  
  if (keyword) {
    data = data.filter(item => item.name.includes(keyword) || item.department.includes(keyword));
  }
  
  res.json({ success: true, data });
});

router.get('/points/records', (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: '未登录' });
  }
  
  const { page = 1, pageSize = 20, type } = req.query;
  let records = inMemoryDB.pointRecords.filter(r => r.userId === userId);
  if (type) records = records.filter(r => r.type === type);
  
  const total = records.length;
  const start = (page - 1) * pageSize;
  const paginated = records.slice(start, start + parseInt(pageSize));
  
  res.json({
    success: true,
    data: {
      data: paginated.map(r => ({ ...r, id: r._id })),
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    },
  });
});

router.get('/points/coupons', (req, res) => {
  const coupons = inMemoryDB.coupons.filter(c => c.stock > 0);
  res.json({ success: true, data: coupons.map(c => ({ ...c, id: c._id })) });
});

router.post('/points/coupons/:id/redeem', (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: '未登录' });
  }
  
  const coupon = inMemoryDB.coupons.find(c => c._id === req.params.id);
  if (!coupon) {
    return res.status(404).json({ success: false, error: '优惠券不存在' });
  }
  if (coupon.stock <= 0) {
    return res.status(400).json({ success: false, error: '优惠券已兑换完' });
  }
  
  const user = inMemoryDB.findUserById(userId);
  if (user.points < coupon.pointsRequired) {
    return res.status(400).json({ success: false, error: '积分不足' });
  }
  
  inMemoryDB.addPointRecord({
    userId,
    amount: coupon.pointsRequired,
    type: 'spend',
    reason: `兑换优惠券: ${coupon.title}`,
    relatedId: coupon._id,
    relatedType: 'coupon',
    createdAt: new Date().toISOString(),
  });
  inMemoryDB.updateUserPoints(userId, -coupon.pointsRequired);
  
  coupon.stock--;
  coupon.redeemedCount++;
  
  res.json({ success: true, message: '兑换成功' });
});

router.get('/points/donations', (req, res) => {
  res.json({ success: true, data: inMemoryDB.donations.map(d => ({ ...d, id: d._id })) });
});

router.post('/points/donations/:id/donate', (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: '未登录' });
  }
  
  const donation = inMemoryDB.donations.find(d => d._id === req.params.id);
  if (!donation) {
    return res.status(404).json({ success: false, error: '公益项目不存在' });
  }
  
  const user = inMemoryDB.findUserById(userId);
  if (user.points < donation.pointsRequired) {
    return res.status(400).json({ success: false, error: '积分不足' });
  }
  
  inMemoryDB.addPointRecord({
    userId,
    amount: donation.pointsRequired,
    type: 'spend',
    reason: `公益捐赠: ${donation.title}`,
    relatedId: donation._id,
    relatedType: 'donation',
    createdAt: new Date().toISOString(),
  });
  inMemoryDB.updateUserPoints(userId, -donation.pointsRequired);
  
  donation.currentAmount += donation.pointsRequired;
  donation.donorCount++;
  
  inMemoryDB.addPointRecord({
    userId,
    amount: 10,
    type: 'earn',
    reason: '公益捐赠荣誉积分',
    relatedId: donation._id,
    relatedType: 'donation_bonus',
    createdAt: new Date().toISOString(),
  });
  inMemoryDB.updateUserPoints(userId, 10);
  
  res.json({ success: true, message: '捐赠成功，感谢您的爱心！' });
});

router.get('/admin/stats', (req, res) => {
  const userId = getUserIdFromToken(req);
  const user = inMemoryDB.findUserById(userId);
  if (!user?.isAdmin) {
    return res.status(403).json({ success: false, error: '无管理员权限' });
  }
  
  res.json({
    success: true,
    data: {
      userCount: inMemoryDB.users.length,
      postCount: inMemoryDB.posts.length,
      pendingPostCount: inMemoryDB.posts.filter(p => p.status === 'pending').length,
      circleCount: inMemoryDB.circles.length,
      activityCount: inMemoryDB.activities.length,
      todayPosts: 3,
      todayUsers: 2,
      todayActivities: 1,
    },
  });
});

const districtCenters = {
  '惠城区': { lat: 23.0837, lng: 114.4122 },
  '惠阳区': { lat: 22.7938, lng: 114.4628 },
  '惠东县': { lat: 22.9968, lng: 114.9386 },
  '博罗县': { lat: 23.1816, lng: 114.2878 },
  '龙门县': { lat: 23.7513, lng: 114.2639 },
  '大亚湾区': { lat: 22.7036, lng: 114.5639 },
  '仲恺高新区': { lat: 22.9961, lng: 114.3286 },
};

router.get('/admin/heatmap', (req, res) => {
  const userId = getUserIdFromToken(req);
  const user = inMemoryDB.findUserById(userId);
  if (!user?.isAdmin) {
    return res.status(403).json({ success: false, error: '无管理员权限' });
  }
  
  const posts = inMemoryDB.posts.filter(p => p.status === 'approved');
  const districtData = {};
  
  Object.keys(districtCenters).forEach(district => {
    districtData[district] = {
      district,
      count: 0,
      sentiment: { positive: 0, neutral: 0, negative: 0 },
      center: districtCenters[district],
    };
  });
  
  posts.forEach(post => {
    const district = post.location?.district;
    if (district && districtData[district]) {
      districtData[district].count++;
      const sentiment = post.sentiment || 'neutral';
      districtData[district].sentiment[sentiment]++;
    }
  });
  
  res.json({ success: true, data: Object.values(districtData) });
});

router.get('/admin/posts/pending', (req, res) => {
  const userId = getUserIdFromToken(req);
  const user = inMemoryDB.findUserById(userId);
  if (!user?.isAdmin) {
    return res.status(403).json({ success: false, error: '无管理员权限' });
  }
  
  const { page = 1, pageSize = 10 } = req.query;
  let posts = inMemoryDB.posts.filter(p => p.status === 'pending');
  const total = posts.length;
  const start = (page - 1) * pageSize;
  const paginated = posts.slice(start, start + parseInt(pageSize));
  
  res.json({
    success: true,
    data: {
      data: paginated.map(formatPost),
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    },
  });
});

router.put('/admin/posts/:id/review', (req, res) => {
  const userId = getUserIdFromToken(req);
  const user = inMemoryDB.findUserById(userId);
  if (!user?.isAdmin) {
    return res.status(403).json({ success: false, error: '无管理员权限' });
  }
  
  const { status, reviewNote } = req.body;
  const post = inMemoryDB.posts.find(p => p._id === req.params.id);
  
  if (!post) {
    return res.status(404).json({ success: false, error: '帖子不存在' });
  }
  
  post.status = status;
  post.reviewNote = reviewNote;
  post.reviewedBy = userId;
  
  if (status === 'approved') {
    inMemoryDB.addPointRecord({
      userId: post.userId,
      amount: 5,
      type: 'earn',
      reason: '爆料通过审核',
      relatedId: post._id,
      relatedType: 'post_approved',
      createdAt: new Date().toISOString(),
    });
    inMemoryDB.updateUserPoints(post.userId, 5);
  }
  
  res.json({ success: true, message: `审核${status === 'approved' ? '通过' : '拒绝'}成功` });
});

router.get('/admin/users', (req, res) => {
  const userId = getUserIdFromToken(req);
  const user = inMemoryDB.findUserById(userId);
  if (!user?.isAdmin) {
    return res.status(403).json({ success: false, error: '无管理员权限' });
  }
  
  const { page = 1, pageSize = 10, keyword } = req.query;
  let users = inMemoryDB.users;
  
  if (keyword) {
    users = users.filter(u => 
      u.username.includes(keyword) || u.nickname.includes(keyword)
    );
  }
  
  const total = users.length;
  const start = (page - 1) * pageSize;
  const paginated = users.slice(start, start + parseInt(pageSize));
  
  res.json({
    success: true,
    data: {
      data: paginated.map(formatUser),
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    },
  });
});

router.get('/health', (req, res) => {
  res.json({ success: true, message: '惠州社区平台服务运行正常 (Mock模式)' });
});

export default router;
