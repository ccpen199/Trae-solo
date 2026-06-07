
require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { initDatabase, db } = require('./database');
const { authenticateToken } = require('./middleware/auth');
const { checkRateLimit } = require('./middleware/rateLimit');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const companyRoutes = require('./routes/companies');
const jobRoutes = require('./routes/jobs');
const referralRoutes = require('./routes/referrals');
const messageRoutes = require('./routes/messages');
const onboardingRoutes = require('./routes/onboarding');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT) || 59065;

const corsOptions = {
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 49065}`,
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api/seed', checkRateLimit('seed', 1, 60), async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');

    const hashedPassword = await bcrypt.hash('123456', 10);

    db.prepare(`
      INSERT OR IGNORE INTO users (id, username, phone, password, role, wechat_id)
      VALUES 
        (1, 'admin', '13800000000', ?, 'admin', 'admin_wechat'),
        (2, 'employer1', '13800000001', ?, 'employer', 'employer1_wechat'),
        (3, 'jobseeker1', '13800000002', ?, 'jobseeker', 'jobseeker1_wechat'),
        (4, 'jobseeker2', '13800000003', ?, 'jobseeker', 'jobseeker2_wechat'),
        (5, 'employer2', '13800000004', ?, 'employer', 'employer2_wechat')
    `).run(hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword);

    db.prepare(`
      INSERT OR IGNORE INTO companies (id, name, license_number, address, latitude, longitude, verified, owner_id)
      VALUES 
        (1, '科技创新有限公司', '91110000MA001ABC12', '北京市朝阳区科技园区88号', 39.9042, 116.4074, 1, 2),
        (2, '智慧零售集团', '91310000MA002DEF34', '上海市浦东新区陆家嘴金融中心100号', 31.2304, 121.4737, 1, 5)
    `).run();

    db.prepare('UPDATE users SET current_company_id = 2 WHERE id = 5').run();
    db.prepare('UPDATE users SET current_company_id = 1 WHERE id = 2').run();

    db.prepare(`
      INSERT OR IGNORE INTO friendships (user_id, friend_id, wechat_verified, status)
      VALUES 
        (3, 4, 1, 'accepted'),
        (4, 3, 1, 'accepted'),
        (3, 2, 0, 'accepted'),
        (2, 3, 0, 'accepted'),
        (4, 5, 1, 'accepted'),
        (5, 4, 1, 'accepted')
    `).run();

    db.prepare(`
      INSERT OR IGNORE INTO referral_rewards (company_id, position_level, reward_type, reward_amount, description)
      VALUES 
        (1, 'senior', 'cash', 5000, '高级岗位内推奖励5000元现金'),
        (1, 'middle', 'cash', 3000, '中级岗位内推奖励3000元现金'),
        (1, 'junior', 'vacation', NULL, '初级岗位内推奖励3天带薪假期'),
        (2, 'senior', 'cash', 8000, '高级岗位内推奖励8000元现金'),
        (2, 'middle', 'cash', 5000, '中级岗位内推奖励5000元现金')
    `).run();

    db.prepare(`
      INSERT OR IGNORE INTO company_photos (company_id, image_url, latitude, longitude, geofence_hash, uploaded_by)
      VALUES 
        (1, 'https://picsum.photos/seed/tech1/800/600', 39.9042, 116.4074, 'geo_hash_1', 2),
        (1, 'https://picsum.photos/seed/tech2/800/600', 39.9043, 116.4075, 'geo_hash_2', 2),
        (2, 'https://picsum.photos/seed/retail1/800/600', 31.2304, 121.4737, 'geo_hash_3', 5)
    `).run();

    db.prepare(`
      INSERT OR IGNORE INTO jobs (id, company_id, title, description, salary_min, salary_max, location, position_level, requirements, status, posted_by)
      VALUES 
        (1, 1, '高级前端工程师', '负责公司核心产品的前端开发工作，参与技术架构设计，优化用户体验。需要具备3年以上React开发经验，熟悉TypeScript和Node.js。', 25000, 40000, '北京', 'senior', '本科及以上学历，3年以上前端开发经验，熟悉React/Vue框架', 'active', 2),
        (2, 1, '中级后端工程师', '负责公司后端服务的设计与开发，维护系统稳定性，优化性能。需要熟悉Java或Python，有微服务架构经验。', 18000, 28000, '北京', 'middle', '本科及以上学历，2年以上后端开发经验，熟悉MySQL数据库', 'active', 2),
        (3, 1, '产品助理', '协助产品经理进行需求分析、产品设计和项目跟进。需要良好的沟通能力和文档能力。', 8000, 12000, '北京', 'junior', '本科及以上学历，有产品实习经验优先', 'active', 2),
        (4, 2, '门店店长', '负责门店日常运营管理，团队建设，达成销售目标。需要有零售行业管理经验。', 15000, 25000, '上海', 'middle', '大专及以上学历，3年以上零售门店管理经验', 'active', 5),
        (5, 2, '高级数据分析经理', '负责公司数据体系建设，数据分析和业务洞察，支持决策。需要熟悉SQL和Python，有大数据处理经验。', 30000, 50000, '上海', 'senior', '本科及以上学历，5年以上数据分析经验，熟悉机器学习优先', 'active', 5)
    `).run();

    const jobBenefits = [
      [1, '五险一金', null], [1, '年终奖', '2个月工资'], [1, '带薪年假', '10天'], [1, '员工体检', '每年1次'],
      [2, '五险一金', null], [2, '年终奖', '1.5个月工资'], [2, '通勤班车', '公司-地铁站'],
      [3, '五险一金', null], [3, '包住', '员工宿舍'], [3, '节日福利', null],
      [4, '五险一金', null], [4, '包住', '员工宿舍'], [4, '年终奖', '3个月工资'],
      [5, '五险一金', null], [5, '年终奖', '3个月工资'], [5, '带薪年假', '15天'], [5, '团建活动', '每月1次']
    ];

    const insertBenefit = db.prepare(`
      INSERT OR IGNORE INTO job_benefits (job_id, benefit_type, benefit_value)
      VALUES (?, ?, ?)
    `);

    jobBenefits.forEach(b => insertBenefit.run(b[0], b[1], b[2]));

    db.prepare(`
      INSERT OR IGNORE INTO referrals (id, job_id, candidate_id, referrer_id, status, wechat_verified, reward_id)
      VALUES 
        (1, 4, 4, 5, 'reviewing', 1, 5)
    `).run();

    db.prepare(`
      INSERT OR IGNORE INTO referral_status_logs (referral_id, old_status, new_status, operator_id, note)
      VALUES 
        (1, NULL, 'pending', 5, '好友张三发起内推'),
        (1, 'pending', 'reviewing', 5, '简历已初审通过')
    `).run();

    res.json({ message: '测试数据已初始化' });
  } catch (err) {
    console.error('初始化测试数据失败:', err);
    res.status(500).json({ error: '初始化测试数据失败' });
  }
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

initDatabase();

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 后端服务已启动: http://127.0.0.1:${PORT}`);
  console.log(`📁 API 基础路径: http://127.0.0.1:${PORT}/api`);
  console.log(`💾 数据库路径: ${path.join(__dirname, '..', 'data', 'app.sqlite')}`);
});

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
