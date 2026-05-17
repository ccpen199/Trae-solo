require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 48292;

app.use(cors({
  origin: ['http://localhost:48291', 'http://127.0.0.1:48291'],
  credentials: true
}));

app.use(express.json());

// 模拟数据
const stores = [
  { id: 1, name: 'FITLIFE旗舰店', address: '北京市朝阳区健身路88号', phone: '400-888-8888', business_hours: '09:00-22:00', status: 1 },
  { id: 2, name: 'FITLIFE中关村店', address: '北京市海淀区中关村大街1号', phone: '400-999-9999', business_hours: '08:00-23:00', status: 1 }
];

const groupClasses = [
  { id: 1, name: '瑜伽入门', description: '适合初学者的瑜伽课程，放松身心，提升柔韧性', duration: 60, difficulty: 1, status: 1 },
  { id: 2, name: '动感单车', description: '高强度有氧训练，燃烧脂肪', duration: 45, difficulty: 3, status: 1 },
  { id: 3, name: '力量训练', description: '专业器械训练，塑造完美身材', duration: 60, difficulty: 3, status: 1 },
  { id: 4, name: 'HIIT燃脂', description: '高强度间歇训练，快速燃脂', duration: 30, difficulty: 4, status: 1 },
  { id: 5, name: '普拉提', description: '核心力量训练，改善体态', duration: 50, difficulty: 2, status: 1 }
];

const today = new Date().toISOString().split('T')[0];
const schedules = [
  { id: 1, class_id: 1, store_id: 1, coach_name: '王教练', start_time: `${today} 10:00:00`, end_time: `${today} 11:00:00`, capacity: 20, booked_count: 5 },
  { id: 2, class_id: 2, store_id: 1, coach_name: '李教练', start_time: `${today} 14:00:00`, end_time: `${today} 15:00:00`, capacity: 20, booked_count: 8 },
  { id: 3, class_id: 3, store_id: 1, coach_name: '张教练', start_time: `${today} 19:00:00`, end_time: `${today} 20:00:00`, capacity: 20, booked_count: 12 },
  { id: 4, class_id: 4, store_id: 2, coach_name: '赵教练', start_time: `${today} 11:00:00`, end_time: `${today} 12:00:00`, capacity: 20, booked_count: 3 },
  { id: 5, class_id: 5, store_id: 2, coach_name: '刘教练', start_time: `${today} 15:00:00`, end_time: `${today} 16:00:00`, capacity: 20, booked_count: 7 }
];

const coaches = [
  { id: 1, name: '张教练', title: '高级私人教练', specialty: '减脂塑形,力量训练', description: '10年健身教练经验，国家一级运动员，擅长减脂塑形和力量训练', price: 300, rating: 5.0 },
  { id: 2, name: '李教练', title: '明星教练', specialty: '瑜伽,普拉提', description: '国际瑜伽联盟认证教练，专注女性塑形和产后恢复', price: 350, rating: 4.9 },
  { id: 3, name: '王教练', title: '资深教练', specialty: '搏击,体能训练', description: '前国家队运动员，擅长搏击和功能性训练', price: 400, rating: 4.8 }
];

const cards = [
  { id: 1, name: '月卡', type: 1, price: 299, original_price: 399, value: 299, description: '30天全场通用会员卡', benefits: '全场通用,团课不限,私教9折', valid_days: 30 },
  { id: 2, name: '季卡', type: 1, price: 799, original_price: 1199, value: 799, description: '90天全场通用会员卡', benefits: '全场通用,团课不限,私教8折,送1节私教课', valid_days: 90 },
  { id: 3, name: '年卡', type: 1, price: 2999, original_price: 4999, value: 2999, description: '365天全场通用会员卡', benefits: '全场通用,团课不限,私教7折,送10节私教课,专属储物柜', valid_days: 365 },
  { id: 4, name: '10次卡', type: 2, price: 500, original_price: 600, value: 10, description: '10次团课卡', benefits: '团课通用,有效期180天', valid_days: 180 },
  { id: 5, name: '储值卡1000', type: 3, price: 1000, original_price: 1000, value: 1200, description: '储值1000送200', benefits: '全场通用,余额永不过期', valid_days: 9999 }
];

// API路由
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'FITLIFE API is running', timestamp: new Date().toISOString() });
});

app.get('/api/home/data', (req, res) => {
  res.json({
    success: true,
    data: {
      banners: [
        { id: 1, title: '夏日减脂季' },
        { id: 2, title: '新人专享优惠' },
        { id: 3, title: '私教体验课' }
      ],
      categories: [
        { id: 1, name: '团课预约', icon: '📅', link: '/group-classes' },
        { id: 2, name: '私教预约', icon: '🏋️', link: '/coaches' },
        { id: 3, name: '购买会员卡', icon: '💳', link: '/cards' },
        { id: 4, name: '我的预约', icon: '📋', link: '/my/bookings' },
        { id: 5, name: '门店查询', icon: '📍', link: '/stores' },
        { id: 6, name: '优惠券', icon: '🎫', link: '/my/coupons' },
        { id: 7, name: '运动数据', icon: '📊', link: '/my/stats' },
        { id: 8, name: '更多服务', icon: '⋯', link: '/services' }
      ],
      hotClasses: groupClasses,
      recommendCoaches: coaches
    }
  });
});

app.get('/api/home/stores', (req, res) => {
  res.json({ success: true, data: stores });
});

app.get('/api/group/classes', (req, res) => {
  const scheduleList = schedules.map(s => {
    const cls = groupClasses.find(c => c.id === s.class_id);
    const store = stores.find(st => st.id === s.store_id);
    return {
      ...s,
      class_name: cls?.name || '',
      store_name: store?.name || '',
      store_address: store?.address || ''
    };
  });
  res.json({ success: true, data: { schedules: scheduleList, classes: groupClasses } });
});

app.get('/api/group/class/:id', (req, res) => {
  const cls = groupClasses.find(c => c.id === parseInt(req.params.id));
  const scheduleList = schedules
    .filter(s => s.class_id === parseInt(req.params.id))
    .map(s => {
      const store = stores.find(st => st.id === s.store_id);
      return {
        ...s,
        store_name: store?.name || '',
        store_address: store?.address || ''
      };
    });
  res.json({ success: true, data: { class: cls, schedules: scheduleList } });
});

app.get('/api/coach/coaches', (req, res) => {
  res.json({ success: true, data: coaches });
});

app.get('/api/coach/coach/:id', (req, res) => {
  const coach = coaches.find(c => c.id === parseInt(req.params.id));
  const coachSchedules = [];
  for (let i = 0; i < 3; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    coachSchedules.push({
      date: dateStr,
      weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()],
      times: [
        { id: i * 3 + 1, start_time: '09:00', end_time: '10:00', is_booked: 0 },
        { id: i * 3 + 2, start_time: '14:00', end_time: '15:00', is_booked: 0 },
        { id: i * 3 + 3, start_time: '19:00', end_time: '20:00', is_booked: 0 }
      ]
    });
  }
  res.json({ success: true, data: { coach, schedules: coachSchedules } });
});

app.get('/api/card/cards', (req, res) => {
  res.json({ success: true, data: cards });
});

// 登录和注册（简化版）
app.post('/api/user/login', (req, res) => {
  res.json({
    success: true,
    data: {
      token: 'demo_token_' + Date.now(),
      user: { id: 1, phone: req.body.phone, nickname: '健身达人' }
    },
    message: '登录成功'
  });
});

app.post('/api/user/register', (req, res) => {
  res.json({
    success: true,
    data: {
      token: 'demo_token_' + Date.now(),
      user: { id: 1, phone: req.body.phone, nickname: req.body.nickname || '新用户' }
    },
    message: '注册成功'
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`FITLIFE Backend Server Started`);
  console.log(`Port: ${PORT}`);
  console.log(`API Base: http://localhost:${PORT}/api`);
  console.log(`========================================\n`);
});
