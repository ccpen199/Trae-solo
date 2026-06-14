require('dotenv').config({ path: '../.env' });
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const resolvedPath = path.resolve(__dirname, dbPath);
const db = new Database(resolvedPath);

const hashedPassword = bcrypt.hashSync('123456', 10);

const insertUser = db.prepare(`
  INSERT INTO users (username, password, phone, email, user_type, real_name, id_verified, skills, location, latitude, longitude, available_hours, credit_score, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertEmployer = db.prepare(`
  INSERT INTO employers (user_id, company_name, business_license, contact_name, contact_phone, verified, credit_rating)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertTask = db.prepare(`
  INSERT INTO tasks (employer_id, title, description, task_type, category, skills_required, location, latitude, longitude, radius, budget, unit, total_count, start_time, end_time, status, risk_level)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertVerification = db.prepare(`
  INSERT INTO id_verifications (user_id, real_name, id_card, id_card_front, id_card_back, status)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const employers = [
  { username: 'employer_alibaba', company: '阿里巴巴信息服务有限公司', license: '91330000716150767W', rating: 'AA' },
  { username: 'employer_tencent', company: '腾讯科技有限公司', license: '91440300770880201G', rating: 'AA' },
  { username: 'employer_meituan', company: '美团点评有限公司', license: '91110000MA00C0FF7A', rating: 'A' },
  { username: 'employer_pinduoduo', company: '拼多多信息技术有限公司', license: '91310000MA1FR78K3T', rating: 'A' },
  { username: 'employer_didi', company: '滴滴出行科技有限公司', license: '91120116MA05J6G13K', rating: 'BBB' },
];

console.log('Adding extra employers...');
employers.forEach((emp, idx) => {
  const count = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get(emp.username).count;
  if (count === 0) {
    const result = insertUser.run(
      emp.username, hashedPassword, `1390013800${idx + 3}`, `${emp.username}@company.com`,
      'employer', `${emp.company}联系人`, 1, null, '北京市朝阳区',
      39.9042, 116.4074, null, 90, 'active'
    );
    insertEmployer.run(
      result.lastInsertRowid, emp.company, emp.license,
      `${['王', '李', '张', '刘', '陈'][idx]}总`,
      `1390013800${idx + 3}`, 1, emp.rating
    );
    console.log(`  Created: ${emp.username} (${emp.company})`);
  }
});

const workers = [
  { username: 'student_xiaoming', type: 'student', name: '王小明', skills: '["问卷填写","内容审核","数据录入"]', location: '北京市海淀区', lat: 39.9599, lng: 116.3268 },
  { username: 'student_xiaohong', type: 'student', name: '李小红', skills: '["文案写作","社交媒体","图片处理"]', location: '北京市朝阳区', lat: 39.9219, lng: 116.4433 },
  { username: 'homemaker_zhang', type: 'homemaker', name: '张宝妈', skills: '["社区运营","手工制作","客服服务"]', location: '北京市丰台区', lat: 39.8586, lng: 116.2869 },
  { username: 'homemaker_li', type: 'homemaker', name: '李宝妈', skills: '["家政服务","育儿陪伴","美食制作"]', location: '北京市西城区', lat: 39.9153, lng: 116.3665 },
  { username: 'parttime_wang', type: 'parttime', name: '王兼职', skills: '["地推活动","促销销售","物流配送"]', location: '北京市东城区', lat: 39.9389, lng: 116.4155 },
  { username: 'parttime_chen', type: 'parttime', name: '陈兼职', skills: '["摄影摄像","活动执行","礼仪服务"]', location: '北京市通州区', lat: 39.9087, lng: 116.6561 },
];

console.log('\nAdding extra workers...');
workers.forEach((w, idx) => {
  const count = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get(w.username).count;
  if (count === 0) {
    const result = insertUser.run(
      w.username, hashedPassword, `1360013800${idx + 1}`, `${w.username}@demo.com`,
      w.type, w.name, 1, w.skills, w.location,
      w.lat, w.lng,
      '["周一至周五 18:00-22:00","周末全天"]',
      85 + idx * 2, 'active'
    );
    insertVerification.run(
      result.lastInsertRowid,
      w.name,
      `110101199${idx}0101${1000 + idx}`,
      '/uploads/id_front_demo.jpg',
      '/uploads/id_back_demo.jpg',
      'approved'
    );
    console.log(`  Created: ${w.username} (${w.name})`);
  }
});

const extraTasks = [
  { type: 'online', category: '内容审核', title: '短视频内容审核', desc: '对平台上传的短视频进行内容合规性审核，判断是否包含违规内容', skills: '["内容审核","视频编辑"]', budget: 0.05, unit: 'per_item', count: 1000, risk: 'low' },
  { type: 'online', category: '问卷填写', title: '大学生消费习惯调研', desc: '针对在校大学生的消费习惯调查问卷，约15分钟完成', skills: '["问卷填写"]', budget: 20, unit: 'per_task', count: 200, risk: 'low' },
  { type: 'online', category: '数据录入', title: '电商平台数据录入', desc: '将纸质销售数据录入到电商平台后台系统，要求准确率99%以上', skills: '["数据录入","打字速度","Excel"]', budget: 0.1, unit: 'per_item', count: 5000, risk: 'medium' },
  { type: 'online', category: '文案写作', title: '产品宣传文案撰写', desc: '为新产品撰写朋友圈推广文案，每条50-100字', skills: '["文案写作","创意策划"]', budget: 30, unit: 'per_task', count: 50, risk: 'low' },
  { type: 'online', category: '图片处理', title: '商品图片美化处理', desc: '对电商平台商品图片进行修图、调色、添加水印等处理', skills: '["图片处理","Photoshop"]', budget: 15, unit: 'per_task', count: 300, risk: 'low' },
  { type: 'online', category: '客服服务', title: '在线客服兼职', desc: '回答平台用户的咨询问题，要求打字速度快，态度友好', skills: '["客服服务","沟通表达"]', budget: 25, unit: 'per_hour', count: 100, risk: 'medium' },
  { type: 'online', category: '试玩推广', title: '新游戏试玩体验', desc: '下载试玩新上线的手机游戏，达到指定等级并提交体验报告', skills: '["试玩推广","游戏体验"]', budget: 35, unit: 'per_task', count: 500, risk: 'low' },
  { type: 'online', category: '翻译服务', title: '英文文档翻译', desc: '将产品说明书从英文翻译成中文，约5000字', skills: '["翻译服务","英语专业"]', budget: 200, unit: 'per_task', count: 20, risk: 'medium' },
  { type: 'offline', category: '地推', title: 'APP地推活动', desc: '在商圈/地铁站推广新APP，引导用户下载注册，底薪+提成', skills: '["地推活动","沟通表达"]', budget: 150, unit: 'per_day', count: 50, risk: 'medium' },
  { type: 'offline', category: '门店驻点', title: '手机门店促销', desc: '在手机卖场协助销售新款手机，提供产品讲解和演示', skills: '["促销活动","产品知识"]', budget: 180, unit: 'per_day', count: 30, risk: 'low' },
  { type: 'offline', category: '快闪活动', title: '品牌快闪店协助', desc: '协助品牌快闪店的搭建、顾客引导、活动执行', skills: '["活动执行","快闪活动"]', budget: 220, unit: 'per_day', count: 40, risk: 'low' },
  { type: 'offline', category: '物流配送', title: '同城快递兼职配送', desc: '在指定区域内进行快递包裹配送，要求熟悉路况', skills: '["物流配送","熟悉路况"]', budget: 5, unit: 'per_order', count: 200, risk: 'low' },
  { type: 'offline', category: '市场调研', title: '街头问卷调查', desc: '在商圈进行街头问卷调研，完成指定数量的有效问卷', skills: '["市场调研","沟通表达"]', budget: 15, unit: 'per_questionnaire', count: 300, risk: 'low' },
  { type: 'offline', category: '活动执行', title: '展会现场协助', desc: '在展会现场协助参展商进行观众登记、资料派发等工作', skills: '["活动执行","会展服务"]', budget: 200, unit: 'per_day', count: 25, risk: 'medium' },
  { type: 'offline', category: '家政服务', title: '家庭保洁服务', desc: '为客户提供家庭日常保洁服务，3小时/次', skills: '["家政服务","清洁工作"]', budget: 60, unit: 'per_hour', count: 100, risk: 'low' },
  { type: 'hybrid', category: '校园代理', title: '校园信用卡代理', desc: '在大学校园推广信用卡产品，负责意向客户对接和资料收集', skills: '["校园代理","销售推广"]', budget: 100, unit: 'commission', count: 50, risk: 'high' },
  { type: 'hybrid', category: '社区团购', title: '社区团购团长', desc: '负责社区微信群运营，推广团购商品，统计订单，佣金结算', skills: '["社区运营","销售推广"]', budget: 0, unit: 'commission', count: 100, risk: 'medium' },
  { type: 'hybrid', category: '微商代理', title: '美妆产品代理', desc: '代理美妆产品，通过社交媒体进行销售，无需囤货', skills: '["社交媒体","销售推广"]', budget: 0, unit: 'commission', count: 200, risk: 'medium' },
  { type: 'hybrid', category: '家教辅导', title: '在线家教辅导', desc: '为中小学生提供在线一对一辅导服务，科目不限', skills: '["家教辅导","学科专业"]', budget: 80, unit: 'per_hour', count: 80, risk: 'low' },
  { type: 'hybrid', category: '摄影服务', title: '活动跟拍服务', desc: '为各类活动提供摄影摄像服务，包括后期处理', skills: '["摄影摄像","后期制作"]', budget: 500, unit: 'per_event', count: 30, risk: 'low' },
  { type: 'hybrid', category: '设计服务', title: 'LOGO设计兼职', desc: '为企业客户设计LOGO，提供3个方案供选择', skills: '["设计服务","平面设计"]', budget: 300, unit: 'per_task', count: 40, risk: 'low' },
  { type: 'online', category: '编程开发', title: '小程序开发兼职', desc: '开发一个简单的展示类小程序，5个页面以内', skills: '["编程开发","小程序"]', budget: 2000, unit: 'per_task', count: 10, risk: 'high' },
];

console.log('\nAdding extra tasks...');
let taskCount = 0;
extraTasks.forEach((task, idx) => {
  const employer = db.prepare('SELECT id FROM employers ORDER BY RANDOM() LIMIT 1').get();
  if (employer) {
    insertTask.run(
      employer.id,
      task.title,
      task.desc,
      task.type,
      task.category,
      task.skills,
      task.type === 'offline' ? `北京市${['朝阳区', '海淀区', '丰台区', '东城区', '西城区'][idx % 5]}` : null,
      task.type === 'offline' ? (39.8 + Math.random() * 0.3) : null,
      task.type === 'offline' ? (116.2 + Math.random() * 0.5) : null,
      10,
      task.budget,
      task.unit,
      task.count,
      null, null,
      'published',
      task.risk
    );
    taskCount++;
  }
});
console.log(`  Created ${taskCount} extra tasks`);

console.log('\n=== 数据补充完成 ===');
console.log(`雇主: ${db.prepare('SELECT COUNT(*) as count FROM employers').get().count} 家`);
console.log(`用户: ${db.prepare('SELECT COUNT(*) as count FROM users').get().count} 人`);
console.log(`任务: ${db.prepare('SELECT COUNT(*) as count FROM tasks').get().count} 个`);

db.close();
