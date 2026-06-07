require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env'), override: true });
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const dbPath = process.env.DB_PATH || path.join(dbDir, 'app.sqlite');
const db = new Database(path.resolve(__dirname, '..', dbPath));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('driver','technician','supplier','admin')),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
  license_number TEXT,
  vehicle_model TEXT,
  vehicle_plate TEXT,
  gps_lat REAL DEFAULT 0,
  gps_lng REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS technicians (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
  certification_level TEXT DEFAULT 'junior',
  skill_tags TEXT DEFAULT '[]',
  vehicle_specialties TEXT DEFAULT '[]',
  credit_score REAL DEFAULT 60,
  gps_lat REAL DEFAULT 0,
  gps_lng REAL DEFAULT 0,
  availability_status TEXT DEFAULT 'online',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
  company_name TEXT,
  business_license TEXT,
  address TEXT,
  contact_person TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rescue_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  driver_id INTEGER NOT NULL REFERENCES drivers(id),
  gps_lat REAL NOT NULL,
  gps_lng REAL NOT NULL,
  vehicle_info TEXT,
  fault_description TEXT,
  urgency_level TEXT DEFAULT 'normal' CHECK(urgency_level IN ('low','normal','high','critical')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','dispatched','in_progress','completed','cancelled')),
  assigned_technician_id INTEGER REFERENCES technicians(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

CREATE TABLE IF NOT EXISTS mentor_apprentice (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mentor_id INTEGER NOT NULL REFERENCES technicians(id),
  apprentice_id INTEGER NOT NULL REFERENCES technicians(id),
  status TEXT DEFAULT 'active' CHECK(status IN ('active','completed','terminated')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mentor_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mentor_apprentice_id INTEGER NOT NULL REFERENCES mentor_apprentice(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'published' CHECK(status IN ('published','accepted','in_progress','completed')),
  apprentice_id INTEGER REFERENCES technicians(id),
  mentor_guidance TEXT,
  rating INTEGER CHECK(rating BETWEEN 1 AND 5),
  feedback TEXT,
  accepted_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS community_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK(type IN ('repair_case','fault_code','authenticity_guide','general')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fault_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  description TEXT,
  vehicle_model TEXT,
  severity TEXT DEFAULT 'medium',
  solution TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  instructor_id INTEGER REFERENCES technicians(id),
  category TEXT,
  duration_minutes INTEGER DEFAULT 0,
  difficulty TEXT DEFAULT 'beginner',
  cover_image TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS course_lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL REFERENCES courses(id),
  title TEXT NOT NULL,
  content_type TEXT DEFAULT 'video' CHECK(content_type IN ('video','text','interactive')),
  content_url TEXT,
  duration_minutes INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  progress_percent REAL DEFAULT 0,
  enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enrollment_id INTEGER NOT NULL REFERENCES enrollments(id),
  lesson_id INTEGER NOT NULL REFERENCES course_lessons(id),
  status TEXT DEFAULT 'not_started' CHECK(status IN ('not_started','in_progress','completed')),
  completed_at DATETIME
);

CREATE TABLE IF NOT EXISTS certifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  technician_id INTEGER NOT NULL REFERENCES technicians(id),
  cert_name TEXT NOT NULL,
  cert_type TEXT,
  exam_score REAL,
  issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME
);

CREATE TABLE IF NOT EXISTS certification_exams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cert_name TEXT NOT NULL,
  questions TEXT DEFAULT '[]',
  passing_score REAL DEFAULT 60,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER NOT NULL REFERENCES certification_exams(id),
  technician_id INTEGER NOT NULL REFERENCES technicians(id),
  answers TEXT DEFAULT '[]',
  score REAL DEFAULT 0,
  passed INTEGER DEFAULT 0,
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  part_number TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  compatible_vehicles TEXT DEFAULT '[]',
  price REAL DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  description TEXT,
  image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vin_bom (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vin_prefix TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  year_range TEXT,
  part_ids TEXT DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parts_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requester_id INTEGER NOT NULL REFERENCES users(id),
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  part_id INTEGER NOT NULL REFERENCES parts(id),
  quantity INTEGER DEFAULT 1,
  total_price REAL DEFAULT 0,
  status TEXT DEFAULT 'ordered' CHECK(status IN ('ordered','shipped','delivered','installed','cancelled')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parts_traceability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_id INTEGER NOT NULL REFERENCES parts(id),
  order_id INTEGER REFERENCES parts_orders(id),
  action TEXT NOT NULL CHECK(action IN ('factory_out','warehouse_in','warehouse_out','delivered','installed')),
  operator_id INTEGER REFERENCES users(id),
  location TEXT,
  scan_code TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credit_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  technician_id INTEGER NOT NULL REFERENCES technicians(id),
  action TEXT NOT NULL,
  score_change REAL NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rescue_heatmap (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_code TEXT NOT NULL,
  region_name TEXT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  request_count INTEGER DEFAULT 0,
  avg_response_minutes REAL DEFAULT 0,
  period TEXT DEFAULT 'monthly',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (userCount === 0) {
  const insertUser = db.prepare('INSERT INTO users (username, password, role, name, phone) VALUES (?,?,?,?,?)');
  const insertDriver = db.prepare('INSERT INTO drivers (user_id, license_number, vehicle_model, vehicle_plate, gps_lat, gps_lng) VALUES (?,?,?,?,?,?)');
  const insertTechnician = db.prepare('INSERT INTO technicians (user_id, certification_level, skill_tags, vehicle_specialties, credit_score, gps_lat, gps_lng, availability_status) VALUES (?,?,?,?,?,?,?,?)');
  const insertSupplier = db.prepare('INSERT INTO suppliers (user_id, company_name, business_license, address, contact_person) VALUES (?,?,?,?,?)');

  const adminId = insertUser.run('admin', 'admin123', 'admin', '系统管理员', '13800000000').lastInsertRowid;

  const d1 = insertUser.run('driver1', 'pass123', 'driver', '张伟', '13800001001').lastInsertRowid;
  insertDriver.run(d1, 'DL20180001', '东风天龙', '京A12345', 39.9042, 116.4074);
  const d2 = insertUser.run('driver2', 'pass123', 'driver', '李强', '13800001002').lastInsertRowid;
  insertDriver.run(d2, 'DL20190002', '解放J6', '沪B67890', 31.2304, 121.4737);
  const d3 = insertUser.run('driver3', 'pass123', 'driver', '王磊', '13800001003').lastInsertRowid;
  insertDriver.run(d3, 'DL20200003', '重汽豪沃', '粤C11111', 23.1291, 113.2644);
  const d4 = insertUser.run('driver4', 'pass123', 'driver', '赵鹏', '13800001004').lastInsertRowid;
  insertDriver.run(d4, 'DL20210004', '陕汽德龙', '川D22222', 30.5728, 104.0668);

  const t1 = insertUser.run('tech1', 'pass123', 'technician', '刘师傅', '13800002001').lastInsertRowid;
  insertTechnician.run(t1, 'senior', JSON.stringify(['发动机','变速箱','电控系统']), JSON.stringify(['东风天龙','解放J6']), 92, 39.9142, 116.4174, 'online');
  const t2 = insertUser.run('tech2', 'pass123', 'technician', '陈师傅', '13800002002').lastInsertRowid;
  insertTechnician.run(t2, 'senior', JSON.stringify(['底盘','制动系统','悬挂']), JSON.stringify(['重汽豪沃','陕汽德龙']), 88, 31.2404, 121.4837, 'online');
  const t3 = insertUser.run('tech3', 'pass123', 'technician', '周师傅', '13800002003').lastInsertRowid;
  insertTechnician.run(t3, 'intermediate', JSON.stringify(['电路','空调','传感器']), JSON.stringify(['东风天龙']), 75, 23.1391, 113.2744, 'online');
  const t4 = insertUser.run('tech4', 'pass123', 'technician', '吴学徒', '13800002004').lastInsertRowid;
  insertTechnician.run(t4, 'junior', JSON.stringify(['基础保养','轮胎']), JSON.stringify([]), 55, 39.9242, 116.4274, 'online');
  const t5 = insertUser.run('tech5', 'pass123', 'technician', '郑学徒', '13800002005').lastInsertRowid;
  insertTechnician.run(t5, 'junior', JSON.stringify(['基础保养','润滑']), JSON.stringify([]), 50, 31.2504, 121.4937, 'offline');

  const s1User = insertUser.run('supplier1', 'pass123', 'supplier', '中配源汽配', '13800003001').lastInsertRowid;
  insertSupplier.run(s1User, '中配源汽配有限公司', 'BL202001', '北京市朝阳区汽配城A区', '孙经理');
  const s1 = db.prepare('SELECT id FROM suppliers WHERE user_id = ?').get(s1User).id;
  const s2User = insertUser.run('supplier2', 'pass123', 'supplier', '潍柴正品配件', '13800003002').lastInsertRowid;
  insertSupplier.run(s2User, '潍柴动力配件销售公司', 'BL202002', '上海市嘉定区汽车产业园', '钱经理');
  const s2 = db.prepare('SELECT id FROM suppliers WHERE user_id = ?').get(s2User).id;

  const insertPart = db.prepare('INSERT INTO parts (supplier_id, part_number, name, category, compatible_vehicles, price, stock_quantity, description) VALUES (?,?,?,?,?,?,?,?)');
  insertPart.run(s1, 'WP10-001', '潍柴WP10发动机活塞环', '发动机', JSON.stringify(['东风天龙','解放J6']), 1280, 50, '潍柴WP10系列原厂活塞环组件');
  insertPart.run(s1, 'WP10-002', '潍柴WP10缸套组件', '发动机', JSON.stringify(['东风天龙','解放J6']), 2560, 30, '潍柴WP10系列缸套组件');
  insertPart.run(s1, 'BRK-001', '威伯科制动阀总成', '制动系统', JSON.stringify(['重汽豪沃','陕汽德龙','东风天龙']), 3500, 20, '威伯科原装制动阀总成');
  insertPart.run(s1, 'FLT-001', '曼胡默尔机油滤清器', '滤清器', JSON.stringify(['东风天龙','解放J6','重汽豪沃','陕汽德龙']), 180, 200, '曼胡默尔原厂机油滤清器');
  insertPart.run(s2, 'WP12-001', '潍柴WP12喷油器', '发动机', JSON.stringify(['陕汽德龙','重汽豪沃']), 4200, 15, '潍柴WP12电控喷油器');
  insertPart.run(s2, 'ALT-001', '博世发电机总成', '电气系统', JSON.stringify(['东风天龙','解放J6','重汽豪沃']), 5800, 10, '博世28V发电机总成');
  insertPart.run(s2, 'AC-001', '空调压缩机总成', '空调系统', JSON.stringify(['东风天龙','解放J6']), 3200, 8, '重卡空调压缩机总成');
  insertPart.run(s2, 'SUS-001', '钢板弹簧总成', '悬挂系统', JSON.stringify(['重汽豪沃','陕汽德龙']), 1800, 25, '后钢板弹簧总成');

  const insertVinBom = db.prepare('INSERT INTO vin_bom (vin_prefix, vehicle_model, year_range, part_ids) VALUES (?,?,?,?)');
  insertVinBom.run('LGAX4', '东风天龙', '2018-2023', JSON.stringify([1,2,4,6]));
  insertVinBom.run('LGAD4', '解放J6', '2019-2024', JSON.stringify([1,2,4,6,7]));
  insertVinBom.run('LZZ1A', '重汽豪沃', '2020-2024', JSON.stringify([3,4,5,8]));
  insertVinBom.run('LZGJ2', '陕汽德龙', '2019-2023', JSON.stringify([3,5,8]));

  const insertMentor = db.prepare('INSERT INTO mentor_apprentice (mentor_id, apprentice_id, status) VALUES (?,?,?)');
  const ma1 = insertMentor.run(1, 4, 'active').lastInsertRowid;
  const ma2 = insertMentor.run(2, 5, 'active').lastInsertRowid;

  const insertMentorTask = db.prepare('INSERT INTO mentor_tasks (mentor_apprentice_id, title, description, status, apprentice_id, mentor_guidance, rating, feedback, accepted_at, completed_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
  insertMentorTask.run(ma1, '发动机异响诊断', '客户反映发动机在1500转时有异常敲击声', 'completed', 4, '先检查机油压力，再判断是气门间隙还是连杆瓦问题', 5, '诊断准确，排查流程规范', '2026-05-25T09:30:00', '2026-05-25T15:00:00', '2026-05-25T08:00:00', '2026-05-25T15:00:00');
  insertMentorTask.run(ma1, '制动系统排气作业', '更换制动阀后需进行管路排气', 'in_progress', 4, '注意排气顺序：右后→左后→右前→左前', null, null, '2026-06-03T10:00:00', null, '2026-06-03T09:00:00', '2026-06-03T11:00:00');
  insertMentorTask.run(ma2, '悬挂系统检查', '钢板弹簧出现异响的检测步骤', 'published', null, null, null, null, null, null, '2026-06-04T08:00:00', '2026-06-04T08:00:00');

  const insertCourse = db.prepare('INSERT INTO courses (title, description, instructor_id, category, duration_minutes, difficulty, cover_image) VALUES (?,?,?,?,?,?,?)');
  const c1 = insertCourse.run('潍柴WP10发动机维修精讲', '深入讲解WP10发动机常见故障及维修方法', 1, '发动机', 120, 'intermediate', '').lastInsertRowid;
  const c2 = insertCourse.run('重卡制动系统原理与检修', '气制动系统工作原理、常见故障与维修实操', 2, '制动系统', 90, 'beginner', '').lastInsertRowid;
  const c3 = insertCourse.run('电控系统故障诊断入门', 'OBD诊断仪使用方法及故障码解读', 3, '电气系统', 60, 'beginner', '').lastInsertRowid;

  const insertLesson = db.prepare('INSERT INTO course_lessons (course_id, title, content_type, content_url, duration_minutes, sort_order) VALUES (?,?,?,?,?,?)');
  insertLesson.run(c1, 'WP10发动机结构概述', 'video', '', 25, 1);
  insertLesson.run(c1, '燃油系统故障排查', 'video', '', 30, 2);
  insertLesson.run(c1, '冷却系统维护保养', 'video', '', 20, 3);
  insertLesson.run(c1, '涡轮增压系统检修', 'text', '', 15, 4);
  insertLesson.run(c1, '发动机大修实操考核', 'interactive', '', 30, 5);
  insertLesson.run(c2, '气制动原理', 'video', '', 20, 1);
  insertLesson.run(c2, '制动阀检修', 'video', '', 25, 2);
  insertLesson.run(c2, 'ABS系统诊断', 'video', '', 25, 3);
  insertLesson.run(c2, '制动系统综合实训', 'interactive', '', 20, 4);
  insertLesson.run(c3, 'OBD诊断仪使用', 'video', '', 15, 1);
  insertLesson.run(c3, '故障码读取与清除', 'video', '', 15, 2);
  insertLesson.run(c3, '传感器检测方法', 'video', '', 15, 3);
  insertLesson.run(c3, '电路图识读基础', 'text', '', 15, 4);

  const insertEnrollment = db.prepare('INSERT INTO enrollments (user_id, course_id, progress_percent) VALUES (?,?,?)');
  insertEnrollment.run(t4, c1, 40);
  insertEnrollment.run(t4, c2, 10);
  insertEnrollment.run(t5, c3, 60);

  const insertExam = db.prepare('INSERT INTO certification_exams (cert_name, questions, passing_score) VALUES (?,?,?)');
  const e1 = insertExam.run('中级维修技师认证', JSON.stringify([
    {q:'WP10发动机标准机油压力范围为？', options:['200-400kPa','100-200kPa','400-600kPa','50-100kPa'], answer:0},
    {q:'气制动系统工作压力一般为？', options:['600-800kPa','200-400kPa','1000-1200kPa','100-200kPa'], answer:0},
    {q:'制动系统排气顺序应为？', options:['右后→左后→右前→左前','左前→右前→左后→右后','右前→左前→右后→左后','左后→右后→左前→右前'], answer:0},
    {q:'涡轮增压器的核心功能是？', options:['提高进气密度','降低排气温度','增加燃油喷射量','减少机油消耗'], answer:0},
    {q:'ABS系统的主要作用是？', options:['防止车轮抱死','增加制动力','缩短制动距离','减少制动噪声'], answer:0}
  ]), 60).lastInsertRowid;
  const e2 = insertExam.run('高级维修技师认证', JSON.stringify([
    {q:'电控共轨系统喷油压力可达？', options:['1600-2000bar','200-400bar','500-800bar','100-200bar'], answer:0},
    {q:'SCR后处理系统使用的是？', options:['尿素溶液','柴油添加剂','机油添加剂','冷却液'], answer:0},
    {q:'曲轴位置传感器类型通常为？', options:['磁电式或霍尔式','热敏电阻式','压电式','光电式'], answer:0},
    {q:'气缸磨损最大位置通常在？', options:['活塞上止点第一道环处','气缸中部','气缸底部','任意位置'], answer:0},
    {q:'双级压缩空压机的优点是？', options:['压力更高且稳定','结构更简单','成本更低','噪音更小'], answer:0}
  ]), 70).lastInsertRowid;

  const insertCommunityPost = db.prepare('INSERT INTO community_posts (author_id, type, title, content, tags, view_count, like_count) VALUES (?,?,?,?,?,?,?)');
  insertCommunityPost.run(t1, 'repair_case', '东风天龙WP10发动机异响排除案例', '客户车辆发动机在1500转时出现明显敲击声，经排查发现第三缸连杆瓦磨损严重，更换后故障消除。\n\n排查步骤：\n1. 断缸测试确认第三缸\n2. 拆检发现连杆瓦异常磨损\n3. 更换连杆瓦组件\n4. 复测机油压力正常', JSON.stringify(['发动机','WP10','异响']), 328, 45);
  insertCommunityPost.run(t2, 'fault_code', '故障码P0087——燃油压力过低解决方案', '故障码P0087表示燃油轨道压力低于设定值，常见原因：\n1. 燃油滤清器堵塞\n2. 高压油泵磨损\n3. 喷油器泄漏\n4. 燃油计量阀故障\n\n建议按顺序排查，先换滤清器再检查计量阀。', JSON.stringify(['P0087','燃油系统','故障码']), 562, 89);
  insertCommunityPost.run(t1, 'authenticity_guide', '潍柴原厂配件真伪鉴别指南', '如何辨别潍柴原厂配件真伪：\n1. 查看包装：原厂包装印刷清晰，有防伪标签\n2. 扫描二维码：官方防伪查询系统验证\n3. 看材质工艺：原厂件表面处理精细\n4. 比对价格：明显低于市场价的需警惕\n5. 查看供应渠道：只从授权经销商采购', JSON.stringify(['真伪鉴别','潍柴','原厂件']), 891, 120);

  const insertFaultCode = db.prepare('INSERT INTO fault_codes (code, description, vehicle_model, severity, solution) VALUES (?,?,?,?,?)');
  insertFaultCode.run('P0087', '燃油轨道压力过低', '通用', 'high', '检查燃油滤清器、高压油泵、喷油器');
  insertFaultCode.run('P0113', '进气温度传感器信号过高', '通用', 'medium', '检查传感器线路及传感器本体');
  insertFaultCode.run('P0401', 'EGR流量不足', '东风天龙', 'medium', '清洗EGR阀及管路');
  insertFaultCode.run('P0480', '风扇控制电路故障', '重汽豪沃', 'low', '检查风扇继电器及线路');
  insertFaultCode.run('P0544', '排气温度传感器电路', '陕汽德龙', 'medium', '检查传感器连接器及线束');
  insertFaultCode.run('P0611', '喷油器控制模块性能', '解放J6', 'high', '检查ECU供电及喷油器驱动线路');

  const insertRescue = db.prepare('INSERT INTO rescue_requests (driver_id, gps_lat, gps_lng, vehicle_info, fault_description, urgency_level, status, assigned_technician_id, created_at, updated_at, completed_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  insertRescue.run(1, 39.9142, 116.4174, '东风天龙 京A12345', '发动机无法启动，起动机正常运转', 'high', 'completed', 1, '2026-05-20T08:30:00', '2026-05-20T09:45:00', '2026-05-20T14:30:00');
  insertRescue.run(2, 31.2404, 121.4837, '解放J6 沪B67890', '制动系统气压不足', 'critical', 'completed', 2, '2026-05-22T07:15:00', '2026-05-22T08:20:00', '2026-05-22T10:15:00');
  insertRescue.run(3, 23.1291, 113.2644, '重汽豪沃 粤C11111', '变速箱异响，挂挡困难', 'normal', 'pending', null, '2026-06-04T10:00:00', '2026-06-04T10:00:00', null);

  const insertHeatmap = db.prepare('INSERT INTO rescue_heatmap (region_code, region_name, lat, lng, request_count, avg_response_minutes, period) VALUES (?,?,?,?,?,?,?)');
  insertHeatmap.run('110000', '北京市', 39.9042, 116.4074, 45, 28, 'monthly');
  insertHeatmap.run('310000', '上海市', 31.2304, 121.4737, 38, 32, 'monthly');
  insertHeatmap.run('440000', '广东省', 23.1291, 113.2644, 62, 25, 'monthly');
  insertHeatmap.run('510000', '四川省', 30.5728, 104.0668, 35, 40, 'monthly');
  insertHeatmap.run('420000', '湖北省', 30.5928, 114.3055, 51, 30, 'monthly');
  insertHeatmap.run('370000', '山东省', 36.6512, 117.1201, 44, 27, 'monthly');

  const insertCredit = db.prepare('INSERT INTO credit_history (technician_id, action, score_change, description) VALUES (?,?,?,?)');
  insertCredit.run(1, 'rescue_complete', 5, '完成紧急救援任务');
  insertCredit.run(1, 'first_fix', 3, '一次修好率达标');
  insertCredit.run(2, 'rescue_complete', 5, '完成紧急救援任务');
  insertCredit.run(2, 'repurchase', 2, '客户配件复购');
  insertCredit.run(3, 'course_complete', 2, '完成进修课程');

  const insertTrace = db.prepare('INSERT INTO parts_traceability (part_id, order_id, action, operator_id, location, scan_code, notes) VALUES (?,?,?,?,?,?,?)');
  insertTrace.run(1, null, 'factory_out', s1User, '潍柴工厂', 'QR-WP10-001-F01', '出厂检验合格');
  insertTrace.run(1, null, 'warehouse_in', s1User, '中配源仓库A', 'QR-WP10-001-W01', '入库质检通过');
  insertTrace.run(2, null, 'factory_out', s1User, '潍柴工厂', 'QR-WP10-002-F01', '出厂检验合格');
  insertTrace.run(2, null, 'warehouse_in', s1User, '中配源仓库A', 'QR-WP10-002-W01', '入库质检通过');

  console.log('Database seeded successfully');
}

module.exports = db;
