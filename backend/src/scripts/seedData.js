require('dotenv').config();
const { db } = require('../models/database');
const bcrypt = require('bcryptjs');

async function seedData() {
  console.log('开始初始化模拟数据...\n');

  db.prepare('BEGIN').run();

  try {
    const hashPassword = async (pwd) => await bcrypt.hash(pwd, 10);

    const pwd123456 = await hashPassword('123456');

    console.log('1. 创建企业用户和企业...');
    const companies = [
      {
        username: 'tencent',
        email: 'hr@tencent.com',
        password: pwd123456,
        name: '腾讯科技',
        industry: '互联网',
        size: '10000人以上',
        description: '腾讯是中国最大的互联网综合服务提供商之一，通过技术丰富互联网用户的生活。',
        location: '深圳',
        credit_score: 95,
        social_insurance_rate: 100,
        turnover_rate: 8,
        verified: 1
      },
      {
        username: 'alibaba',
        email: 'hr@alibaba.com',
        password: pwd123456,
        name: '阿里巴巴',
        industry: '电子商务',
        size: '10000人以上',
        description: '阿里巴巴集团经营多项业务，另外也从关联公司的业务和服务中取得经营商业生态系统上的支援。',
        location: '杭州',
        credit_score: 92,
        social_insurance_rate: 100,
        turnover_rate: 12,
        verified: 1
      },
      {
        username: 'bytedance',
        email: 'hr@bytedance.com',
        password: pwd123456,
        name: '字节跳动',
        industry: '互联网',
        size: '10000人以上',
        description: '字节跳动是一家全球化的科技公司，旗下产品包括今日头条、抖音、TikTok等。',
        location: '北京',
        credit_score: 90,
        social_insurance_rate: 100,
        turnover_rate: 15,
        verified: 1
      },
      {
        username: 'meituan',
        email: 'hr@meituan.com',
        password: pwd123456,
        name: '美团',
        industry: '生活服务',
        size: '10000人以上',
        description: '美团是中国领先的生活服务电子商务平台，提供外卖、酒店、旅游等多种服务。',
        location: '北京',
        credit_score: 88,
        social_insurance_rate: 98,
        turnover_rate: 18,
        verified: 1
      },
      {
        username: 'xiaohongshu',
        email: 'hr@xiaohongshu.com',
        password: pwd123456,
        name: '小红书',
        industry: '互联网',
        size: '1000-9999人',
        description: '小红书是年轻人的生活方式平台，用户可以通过短视频、图文等形式记录生活点滴。',
        location: '上海',
        credit_score: 85,
        social_insurance_rate: 100,
        turnover_rate: 14,
        verified: 1
      }
    ];

    const companyUserIds = [];
    const companyIds = [];

    for (const c of companies) {
      const userResult = db.prepare(`
        INSERT INTO users (username, email, password, role)
        VALUES (?, ?, ?, 'company')
      `).run(c.username, c.email, c.password);
      
      const userId = userResult.lastInsertRowid;
      companyUserIds.push(userId);

      const companyResult = db.prepare(`
        INSERT INTO companies (user_id, name, industry, size, description, location, credit_score, social_insurance_rate, turnover_rate, verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, c.name, c.industry, c.size, c.description, c.location, c.credit_score, c.social_insurance_rate, c.turnover_rate, c.verified);
      
      companyIds.push(companyResult.lastInsertRowid);
    }

    console.log('   ✓ 创建了', companies.length, '家企业\n');

    console.log('2. 创建视频（岗位介绍视频）...');
    const videos = [
      { user_idx: 0, type: 'job', title: '腾讯前端开发团队介绍', desc: '展示腾讯前端团队的工作环境和团队文化', status: 'approved', duration: 120 },
      { user_idx: 0, type: 'job', title: '微信支付事业部工作实拍', desc: '带你走进微信支付的日常工作', status: 'approved', duration: 95 },
      { user_idx: 1, type: 'job', title: '阿里云技术团队访谈', desc: '阿里云工程师分享工作心得', status: 'approved', duration: 150 },
      { user_idx: 1, type: 'job', title: '淘宝双11技术大揭秘', desc: '双11背后的技术故事', status: 'approved', duration: 180 },
      { user_idx: 2, type: 'job', title: '抖音推荐算法团队介绍', desc: '了解抖音推荐算法是如何工作的', status: 'approved', duration: 110 },
      { user_idx: 2, type: 'job', title: '字节跳动办公环境展示', desc: '参观字节跳动北京总部', status: 'approved', duration: 85 },
      { user_idx: 3, type: 'job', title: '美团外卖技术团队', desc: '美团外卖技术架构介绍', status: 'pending', duration: 130 },
      { user_idx: 4, type: 'job', title: '小红书内容社区运营', desc: '小红书社区运营团队介绍', status: 'approved', duration: 90 }
    ];

    const videoIds = [];

    for (let i = 0; i < videos.length; i++) {
      const v = videos[i];
      const result = db.prepare(`
        INSERT INTO videos (user_id, type, title, description, file_path, status, duration, reviewed_by, reviewed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
      `).run(
        companyUserIds[v.user_idx],
        v.type,
        v.title,
        v.desc,
        `/uploads/sample_job_${i + 1}.mp4`,
        v.status,
        v.duration
      );
      videoIds.push(result.lastInsertRowid);
    }

    console.log('   ✓ 创建了', videos.length, '个视频\n');

    console.log('3. 创建岗位...');
    const jobs = [
      {
        company_idx: 0, video_idx: 0, title: '高级前端开发工程师',
        desc: '负责腾讯核心产品的前端开发工作，参与技术架构设计和性能优化。',
        salary_min: 25, salary_max: 50, location: '深圳',
        skills: ['React', 'Vue', 'TypeScript', 'Node.js', 'Webpack'],
        experience: '3-5年', education: '本科', video_resume_enabled: 1
      },
      {
        company_idx: 0, video_idx: 1, title: '微信支付后端开发工程师',
        desc: '负责微信支付系统的设计与开发，保障支付系统的稳定性和安全性。',
        salary_min: 30, salary_max: 60, location: '深圳',
        skills: ['Go', 'MySQL', 'Redis', '分布式系统', '微服务'],
        experience: '5-10年', education: '本科', video_resume_enabled: 1
      },
      {
        company_idx: 1, video_idx: 2, title: '阿里云P7架构师',
        desc: '负责阿里云核心产品的架构设计，带领团队完成技术攻坚。',
        salary_min: 40, salary_max: 80, location: '杭州',
        skills: ['Java', 'Spring', 'Kubernetes', 'Docker', '分布式架构'],
        experience: '5-10年', education: '硕士', video_resume_enabled: 1
      },
      {
        company_idx: 1, video_idx: 3, title: '淘宝前端技术专家',
        desc: '负责淘宝大促活动的前端技术支撑，优化用户体验。',
        salary_min: 35, salary_max: 70, location: '杭州',
        skills: ['React', 'Node.js', '性能优化', '工程化', 'SSR'],
        experience: '5-10年', education: '本科', video_resume_enabled: 1
      },
      {
        company_idx: 2, video_idx: 4, title: '抖音推荐算法工程师',
        desc: '负责抖音短视频推荐算法的研究与优化，提升用户体验。',
        salary_min: 35, salary_max: 75, location: '北京',
        skills: ['Python', 'TensorFlow', '机器学习', '深度学习', '推荐系统'],
        experience: '3-5年', education: '硕士', video_resume_enabled: 1
      },
      {
        company_idx: 2, video_idx: 5, title: '字节跳动客户端开发',
        desc: '负责今日头条/抖音客户端的功能开发和性能优化。',
        salary_min: 28, salary_max: 55, location: '北京',
        skills: ['Kotlin', 'Swift', 'Flutter', 'React Native', '移动架构'],
        experience: '3-5年', education: '本科', video_resume_enabled: 1
      },
      {
        company_idx: 3, video_idx: null, title: '美团外卖产品经理',
        desc: '负责美团外卖核心功能的产品设计和迭代。',
        salary_min: 20, salary_max: 45, location: '北京',
        skills: ['产品设计', '数据分析', 'Axure', '用户研究', '项目管理'],
        experience: '3-5年', education: '本科', video_resume_enabled: 0
      },
      {
        company_idx: 4, video_idx: 7, title: '小红书社区运营主管',
        desc: '负责小红书社区内容生态的建设和运营，提升用户活跃度。',
        salary_min: 18, salary_max: 35, location: '上海',
        skills: ['内容运营', '社区运营', '数据分析', '活动策划', '用户增长'],
        experience: '3-5年', education: '本科', video_resume_enabled: 1
      },
      {
        company_idx: 0, video_idx: null, title: '腾讯云解决方案架构师',
        desc: '为企业客户提供云计算解决方案，支持业务上云。',
        salary_min: 35, salary_max: 65, location: '深圳',
        skills: ['云计算', 'AWS', '腾讯云', '架构设计', '行业解决方案'],
        experience: '5-10年', education: '本科', video_resume_enabled: 1
      },
      {
        company_idx: 2, video_idx: null, title: '飞书产品设计师',
        desc: '负责飞书产品的交互设计和视觉设计，打造极致用户体验。',
        salary_min: 22, salary_max: 45, location: '北京',
        skills: ['Figma', 'Sketch', '交互设计', '视觉设计', '设计系统'],
        experience: '3-5年', education: '本科', video_resume_enabled: 1
      },
      {
        company_idx: 1, video_idx: null, title: '菜鸟网络数据分析师',
        desc: '负责菜鸟物流网络的数据分析，支持业务决策。',
        salary_min: 18, salary_max: 35, location: '杭州',
        skills: ['SQL', 'Python', '数据分析', '数据可视化', '统计学'],
        experience: '1-3年', education: '本科', video_resume_enabled: 1
      },
      {
        company_idx: 3, video_idx: 6, title: '美团到店Java开发工程师',
        desc: '负责美团到店业务的后端系统开发和维护。',
        salary_min: 25, salary_max: 50, location: '北京',
        skills: ['Java', 'Spring Boot', 'MySQL', 'Redis', 'MQ'],
        experience: '3-5年', education: '本科', video_resume_enabled: 1
      }
    ];

    const jobIds = [];

    for (const j of jobs) {
      const result = db.prepare(`
        INSERT INTO jobs (company_id, video_id, title, description, salary_min, salary_max, location, skills, experience_required, education_required, video_resume_enabled, views_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        companyIds[j.company_idx],
        j.video_idx !== null ? videoIds[j.video_idx] : null,
        j.title,
        j.desc,
        j.salary_min,
        j.salary_max,
        j.location,
        JSON.stringify(j.skills),
        j.experience,
        j.education,
        j.video_resume_enabled,
        Math.floor(Math.random() * 500) + 50
      );
      jobIds.push(result.lastInsertRowid);
    }

    console.log('   ✓ 创建了', jobs.length, '个岗位\n');

    console.log('4. 创建求职者用户和简历...');
    const jobseekers = [
      {
        username: 'zhangsan',
        email: 'zhangsan@email.com',
        password: pwd123456,
        name: '张三',
        phone: '13800138001',
        education: '硕士',
        experience: '3-5年',
        salary_min: 25,
        salary_max: 40,
        skills: ['React', 'Vue', 'TypeScript', 'Node.js'],
        bio: '5年前端开发经验，精通React和Vue，有大型项目架构经验。'
      },
      {
        username: 'lisi',
        email: 'lisi@email.com',
        password: pwd123456,
        name: '李四',
        phone: '13800138002',
        education: '本科',
        experience: '1-3年',
        salary_min: 15,
        salary_max: 25,
        skills: ['Java', 'Spring Boot', 'MySQL'],
        bio: '2年Java开发经验，熟悉Spring生态，有电商项目经验。'
      },
      {
        username: 'wangwu',
        email: 'wangwu@email.com',
        password: pwd123456,
        name: '王五',
        phone: '13800138003',
        education: '博士',
        experience: '5-10年',
        salary_min: 50,
        salary_max: 80,
        skills: ['Python', 'TensorFlow', '机器学习', '深度学习'],
        bio: '机器学习博士，8年算法研究经验，曾在顶会发表多篇论文。'
      },
      {
        username: 'zhaoliu',
        email: 'zhaoliu@email.com',
        password: pwd123456,
        name: '赵六',
        phone: '13800138004',
        education: '本科',
        experience: '1-3年',
        salary_min: 18,
        salary_max: 30,
        skills: ['产品设计', 'Axure', '数据分析'],
        bio: '2年产品经理经验，主导过3个C端产品从0到1。'
      },
      {
        username: 'qianqi',
        email: 'qianqi@email.com',
        password: pwd123456,
        name: '钱七',
        phone: '13800138005',
        education: '本科',
        experience: '3-5年',
        salary_min: 22,
        salary_max: 38,
        skills: ['Kotlin', 'Android', 'Flutter'],
        bio: '4年移动端开发经验，精通Android原生和Flutter跨平台开发。'
      },
      {
        username: 'sunba',
        email: 'sunba@email.com',
        password: pwd123456,
        name: '孙八',
        phone: '13800138006',
        education: '硕士',
        experience: '3-5年',
        salary_min: 28,
        salary_max: 45,
        skills: ['Go', 'Docker', 'Kubernetes', '微服务'],
        bio: '5年后端开发经验，精通Go语言和云原生技术栈。'
      }
    ];

    const jobseekerUserIds = [];
    const jobseekerIds = [];
    const resumeIds = [];

    for (let i = 0; i < jobseekers.length; i++) {
      const js = jobseekers[i];
      const userResult = db.prepare(`
        INSERT INTO users (username, email, password, role)
        VALUES (?, ?, ?, 'jobseeker')
      `).run(js.username, js.email, js.password);
      
      const userId = userResult.lastInsertRowid;
      jobseekerUserIds.push(userId);

      const jsResult = db.prepare(`
        INSERT INTO jobseekers (user_id, name, phone, education, experience, expected_salary_min, expected_salary_max, skills, bio)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, js.name, js.phone, js.education, js.experience, js.salary_min, js.salary_max, JSON.stringify(js.skills), js.bio);
      
      const jsId = jsResult.lastInsertRowid;
      jobseekerIds.push(jsId);

      const videoResult = db.prepare(`
        INSERT INTO videos (user_id, type, title, description, file_path, status, duration)
        VALUES (?, 'resume', ?, ?, ?, 'approved', ?)
      `).run(userId, `${js.name}的视频简历`, js.bio, `/uploads/sample_resume_${i + 1}.mp4`, 90);

      const resumeResult = db.prepare(`
        INSERT INTO resumes (jobseeker_id, video_id, title, skills, ai_tags)
        VALUES (?, ?, ?, ?, ?)
      `).run(jsId, videoResult.lastInsertRowid, `${js.name}的视频简历`, JSON.stringify(js.skills), JSON.stringify(['优秀', '潜力大', '技术扎实']));
      
      resumeIds.push(resumeResult.lastInsertRowid);
    }

    console.log('   ✓ 创建了', jobseekers.length, '位求职者\n');

    console.log('5. 创建投递记录（招聘漏斗数据）...');
    const applications = [];
    const statuses = ['pending', 'viewed', 'interview', 'offer', 'rejected', 'hired'];

    for (let i = 0; i < 30; i++) {
      const jobIdx = i % jobIds.length;
      const jsIdx = Math.floor(Math.random() * jobseekerIds.length);
      
      const jobSkills = jobs[jobIdx].skills;
      const jsSkills = jobseekers[jsIdx].skills;
      const matchCount = jobSkills.filter(s => jsSkills.includes(s)).length;
      const matchScore = Math.min(100, Math.max(50, Math.floor(matchCount / jobSkills.length * 50 + 50)));

      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      try {
        db.prepare(`
          INSERT INTO applications (job_id, jobseeker_id, resume_id, match_score, match_reason, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          jobIds[jobIdx],
          jobseekerIds[jsIdx],
          resumeIds[jsIdx],
          matchScore,
          matchScore >= 80 ? '技能高度匹配，经历符合要求' : matchScore >= 65 ? '部分技能匹配，可进一步了解' : '技能匹配度一般',
          status
        );
        applications.push(status);
      } catch (e) {
        // 忽略唯一约束重复
      }
    }

    const statusCounts = {};
    applications.forEach(s => {
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    console.log('   ✓ 创建了', applications.length, '条投递记录');
    console.log('   投递状态分布:', JSON.stringify(statusCounts), '\n');

    console.log('6. 创建消息记录...');
    for (let i = 0; i < 15; i++) {
      const senderIsCompany = Math.random() > 0.5;
      const senderIdx = senderIsCompany ? Math.floor(Math.random() * companyUserIds.length) : Math.floor(Math.random() * jobseekerUserIds.length);
      const receiverIdx = senderIsCompany ? Math.floor(Math.random() * jobseekerUserIds.length) : Math.floor(Math.random() * companyUserIds.length);
      
      const messages = [
        '您好，我对您的岗位很感兴趣，请问可以详细聊聊吗？',
        '您好，已收到您的投递，我们正在评估您的简历。',
        '请问方便安排一次视频面试吗？',
        '看了您的视频简历，印象很深刻！',
        '感谢您的申请，我们会尽快回复。',
        '请问您目前的薪资期望是多少？',
        '我有5年相关经验，非常适合这个岗位。',
        '方便发一下您的详细作品集吗？',
        '我们公司的福利包括五险一金、年终奖等。',
        '请问最快什么时候可以到岗？'
      ];

      db.prepare(`
        INSERT INTO messages (sender_id, receiver_id, type, content, is_read)
        VALUES (?, ?, 'text', ?, ?)
      `).run(
        senderIsCompany ? companyUserIds[senderIdx] : jobseekerUserIds[senderIdx],
        senderIsCompany ? jobseekerUserIds[receiverIdx] : companyUserIds[receiverIdx],
        messages[Math.floor(Math.random() * messages.length)],
        Math.random() > 0.5 ? 1 : 0
      );
    }

    console.log('   ✓ 创建了15条消息记录\n');

    console.log('7. 创建观看记录...');
    for (let i = 0; i < 100; i++) {
      const jobIdx = Math.floor(Math.random() * jobIds.length);
      const jsIdx = Math.random() > 0.3 ? Math.floor(Math.random() * jobseekerIds.length) : null;
      const actions = ['view', 'watch_video', 'like', 'share'];
      
      db.prepare(`
        INSERT INTO view_logs (user_id, job_id, action, duration)
        VALUES (?, ?, ?, ?)
      `).run(
        jsIdx ? jobseekerUserIds[jsIdx] : null,
        jobIds[jobIdx],
        actions[Math.floor(Math.random() * actions.length)],
        Math.floor(Math.random() * 180) + 10
      );
    }

    console.log('   ✓ 创建了100条观看记录\n');

    db.prepare('COMMIT').run();

    console.log('========================================');
    console.log('🎉 模拟数据初始化完成！');
    console.log('========================================\n');
    console.log('测试账号：');
    console.log('  管理员: admin@videocareer.com / admin123');
    console.log('  企业账号:');
    companies.forEach(c => console.log(`    ${c.name}: ${c.email} / 123456`));
    console.log('  求职者账号:');
    jobseekers.forEach(js => console.log(`    ${js.name}: ${js.email} / 123456`));
    console.log('\n数据概览:');
    console.log(`  企业: ${companies.length}家`);
    console.log(`  岗位: ${jobs.length}个`);
    console.log(`  视频: ${videos.length}个`);
    console.log(`  求职者: ${jobseekers.length}人`);
    console.log(`  投递记录: ${applications.length}条`);

  } catch (err) {
    db.prepare('ROLLBACK').run();
    console.error('数据初始化失败:', err);
    throw err;
  }
}

seedData().then(() => {
  process.exit(0);
}).catch(() => {
  process.exit(1);
});
