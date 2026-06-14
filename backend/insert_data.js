const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../data/app.sqlite');
const db = new Database(DB_PATH);

db.pragma('foreign_keys = OFF');

const insertTrades = db.prepare(`
  INSERT OR IGNORE INTO trades (id, name, category, description, skill_level)
  VALUES (?, ?, ?, ?, ?)
`);

const trades = [
  [1, '钢筋工', '结构施工', '负责钢筋的加工、绑扎等工作', 2],
  [2, '模板工', '结构施工', '负责模板的制作、安装、拆除', 2],
  [3, '混凝土工', '结构施工', '负责混凝土的浇筑、养护', 2],
  [4, '架子工', '结构施工', '负责脚手架的搭设、拆除', 3],
  [5, '起重工', '结构施工', '负责建筑材料的吊装', 3],
  [6, '抹灰工', '装饰装修', '负责墙面、地面抹灰', 2],
  [7, '瓦工', '装饰装修', '负责砌砖、贴砖', 2],
  [8, '木工', '装饰装修', '负责木制品制作安装', 2],
  [10, '电工', '机电安装', '负责电气线路铺设安装', 3],
  [11, '焊工', '机电安装', '负责金属构件焊接', 3],
  [19, '装配式工', '装配式建筑', '负责预制构件安装', 3],
  [20, '灌浆工', '装配式建筑', '负责预制构件灌浆', 2],
  [28, '安全员', '安全管理', '负责施工现场安全管理', 3]
];

for (const trade of trades) {
  insertTrades.run(...trade);
}

const insertEmployers = db.prepare(`
  INSERT OR IGNORE INTO employers (id, company_name, legal_person, business_license, qualification_level, contact_name, contact_phone, address, credit_rating, verified)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const employers = [
  [1, '中建集团第一工程有限公司', '张三', '911100001234567890', '特级', '李经理', '13800138001', '北京市朝阳区建国路100号', 95, 1],
  [2, '上海建工集团', '王五', '913100002345678901', '一级', '赵经理', '13800138002', '上海市浦东新区陆家嘴金融中心', 92, 1],
  [3, '广州建筑集团', '钱六', '914400003456789012', '一级', '孙经理', '13800138003', '广州市天河区珠江新城', 88, 1]
];

for (const emp of employers) {
  insertEmployers.run(...emp);
}

const insertJobs = db.prepare(`
  INSERT OR IGNORE INTO job_requirements (id, employer_id, project_name, project_address, latitude, longitude, trade_id, trade_name, quantity, start_date, end_date, daily_wage, work_hours, qualification_required, description, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const jobs = [
  [1, 1, '北京CBD核心区商业综合体项目', '北京市朝阳区建国路88号', 39.9147, 116.4607, 1, '钢筋工', 15, '2026-07-01', '2026-12-31', 380, '8:00-18:00', '高级技工证', '需熟练掌握钢筋绑扎、下料工艺，有大型商业项目经验优先', 'published'],
  [2, 1, '北京CBD核心区商业综合体项目', '北京市朝阳区建国路88号', 39.9147, 116.4607, 2, '模板工', 10, '2026-07-01', '2026-12-31', 360, '8:00-18:00', '高级技工证', '需熟练掌握木模、铝模安装工艺', 'published'],
  [3, 2, '上海张江科技园标准厂房项目', '上海市浦东新区张江高科技园区', 31.2001, 121.5892, 19, '装配式工', 20, '2026-07-15', '2027-03-31', 420, '7:30-17:30', '特种作业操作证', '需有装配式建筑施工经验，熟悉预制构件吊装、灌浆工艺', 'pending_review'],
  [4, 2, '上海张江科技园标准厂房项目', '上海市浦东新区张江高科技园区', 31.2001, 121.5892, 1, '钢筋工', 8, '2024-07-10', '2025-03-31', 390, '7:30-17:30', '高级技工证', '需有5年以上钢筋工经验，能看懂复杂图纸', 'published'],
  [5, 3, '广州天河智慧城办公楼项目', '广州市天河区高唐路', 23.1671, 113.3830, 10, '电工', 6, '2026-08-01', '2027-06-30', 400, '8:00-18:00', '特种作业操作证', '需有电工证，熟悉强弱电系统安装', 'published'],
  [6, 3, '广州天河智慧城办公楼项目', '广州市天河区高唐路', 23.1671, 113.3830, 11, '焊工', 4, '2026-08-01', '2027-06-30', 420, '8:00-18:00', '特种作业操作证', '需有焊工证，能进行氩弧焊、二保焊作业', 'ai_reviewed'],
  [7, 1, '北京通州副中心住宅项目', '北京市通州区潞城镇', 39.9087, 116.7129, 4, '架子工', 12, '2026-07-20', '2027-05-31', 450, '6:00-16:00', '特种作业操作证', '需有高空作业证，有5年以上架子工经验', 'manual_reviewed'],
  [8, 2, '上海临港新片区安置房项目', '上海市浦东新区临港新城', 30.9000, 121.9000, 6, '抹灰工', 25, '2026-08-15', '2027-04-30', 340, '7:00-17:00', '', '需熟练掌握内墙、外墙抹灰工艺，有住宅项目经验优先', 'published']
];

for (const job of jobs) {
  insertJobs.run(...job);
}

const insertReviews = db.prepare(`
  INSERT OR IGNORE INTO review_records (id, job_id, review_level, reviewer, result, comment, review_date, details)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const reviews = [
  [1, 1, 'ai', 'AI系统', 'pass', 'AI自动审核通过：信息完整、资质符合要求', '2024-06-15', '{"checkItems":["资质验证","信息完整性","风险评估"],"score":92}'],
  [2, 1, 'manual', '住建部门-李审核员', 'pass', '人工复核通过：项目真实有效，用工需求合理', '2024-06-16', '{"checkItems":["企业资质","项目审批文件","工资保证金"],"score":95}'],
  [3, 1, 'site', '工地管理员-王工长', 'pass', '工地实名核验通过：工人信息与身份证一致', '2024-06-18', '{"checkItems":["身份证核验","人脸比对","健康码检查"],"verifiedCount":10}'],
  [4, 2, 'ai', 'AI系统', 'pass', 'AI自动审核通过', '2024-06-15', '{"score":88}'],
  [5, 2, 'manual', '住建部门-张审核员', 'pass', '人工复核通过', '2024-06-16', '{"score":90}'],
  [6, 2, 'site', '工地管理员-刘工长', 'pending', '等待工地实名核验', '2024-06-17', '{}'],
  [7, 6, 'ai', 'AI系统', 'pass', 'AI自动审核通过', '2024-06-17', '{"score":85}'],
  [8, 7, 'ai', 'AI系统', 'pass', 'AI自动审核通过', '2024-06-16', '{"score":91}'],
  [9, 7, 'manual', '住建部门-王审核员', 'pass', '人工复核通过', '2024-06-17', '{"score":89}'],
  [10, 8, 'ai', 'AI系统', 'pass', 'AI自动审核通过', '2024-06-15', '{"score":87}'],
  [11, 8, 'manual', '住建部门-李审核员', 'pass', '人工复核通过', '2024-06-16', '{"score":93}'],
  [12, 8, 'site', '工地管理员-赵工长', 'pass', '工地实名核验通过', '2024-06-18', '{"verifiedCount":20}']
];

for (const review of reviews) {
  insertReviews.run(...review);
}

db.pragma('foreign_keys = ON');

const jobCount = db.prepare('SELECT COUNT(*) as count FROM job_requirements').get();
const reviewCount = db.prepare('SELECT COUNT(*) as count FROM review_records').get();

console.log(`✓ Data inserted successfully!`);
console.log(`  Jobs: ${jobCount.count}`);
console.log(`  Review records: ${reviewCount.count}`);

const sampleReviews = db.prepare(`
  SELECT r.*, j.project_name 
  FROM review_records r 
  LEFT JOIN job_requirements j ON r.job_id = j.id 
  ORDER BY r.review_date DESC 
  LIMIT 5
`).all();

console.log('\nSample review records with project names:');
console.log(JSON.stringify(sampleReviews, null, 2));

db.close();
