import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS processes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      equipment TEXT,
      position TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      process_id INTEGER NOT NULL,
      version TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      reviewer_id INTEGER,
      reviewed_at DATETIME,
      effective_date DATE,
      expiry_date DATE,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (process_id) REFERENCES processes(id),
      UNIQUE(product_id, process_id, version)
    );

    CREATE TABLE IF NOT EXISTS sop_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sop_id INTEGER NOT NULL,
      step_order INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      video_url TEXT,
      attention TEXT,
      quality_standard TEXT,
      key_params TEXT,
      is_mandatory INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sop_id) REFERENCES sops(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      current_process_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS work_order_processes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_id INTEGER NOT NULL,
      process_id INTEGER NOT NULL,
      process_order INTEGER NOT NULL,
      sop_id INTEGER,
      operator_id INTEGER,
      started_at DATETIME,
      completed_at DATETIME,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (process_id) REFERENCES processes(id),
      FOREIGN KEY (sop_id) REFERENCES sops(id)
    );

    CREATE TABLE IF NOT EXISTS execution_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_process_id INTEGER NOT NULL,
      sop_step_id INTEGER NOT NULL,
      operator_id INTEGER NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      key_params_value TEXT,
      exception_note TEXT,
      is_skipped INTEGER DEFAULT 0,
      skip_reason TEXT,
      FOREIGN KEY (work_order_process_id) REFERENCES work_order_processes(id) ON DELETE CASCADE,
      FOREIGN KEY (sop_step_id) REFERENCES sop_steps(id)
    );

    CREATE TABLE IF NOT EXISTS change_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sop_id INTEGER NOT NULL,
      old_version TEXT,
      new_version TEXT,
      change_description TEXT,
      affected_work_order_ids TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sop_id) REFERENCES sops(id)
    );

    CREATE TABLE IF NOT EXISTS training_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      sop_id INTEGER NOT NULL,
      change_notification_id INTEGER,
      trained_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      confirmed_at DATETIME,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (sop_id) REFERENCES sops(id),
      FOREIGN KEY (change_notification_id) REFERENCES change_notifications(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      password TEXT DEFAULT '123456',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const insertUser = db.prepare('INSERT INTO users (username, name, role, password) VALUES (?, ?, ?, ?)');
    insertUser.run('worker1', '张三', 'worker', '123456');
    insertUser.run('worker2', '李四', 'worker', '123456');
    insertUser.run('engineer1', '王工', 'engineer', '123456');
    insertUser.run('leader1', '陈组长', 'leader', '123456');
  }

  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (productCount.count === 0) {
    const insertProduct = db.prepare('INSERT INTO products (code, name, description) VALUES (?, ?, ?)');
    insertProduct.run('P001', '电机组件A', '标准电机组件');
    insertProduct.run('P002', '控制器B', '智能控制器');
  }

  const processCount = db.prepare('SELECT COUNT(*) as count FROM processes').get();
  if (processCount.count === 0) {
    const insertProcess = db.prepare('INSERT INTO processes (code, name, description, equipment, position) VALUES (?, ?, ?, ?, ?)');
    insertProcess.run('PR001', '零件准备', '准备所需零部件', '工作台', '装配岗');
    insertProcess.run('PR002', '组件装配', '进行组件装配', '装配机', '装配岗');
    insertProcess.run('PR003', '质量检测', '成品质量检测', '检测设备', '质检岗');
  }

  const sopCount = db.prepare('SELECT COUNT(*) as count FROM sops').get();
  if (sopCount.count === 0) {
    const insertSOP = db.prepare('INSERT INTO sops (product_id, process_id, version, title, status, created_by, effective_date, reviewer_id, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const insertStep = db.prepare('INSERT INTO sop_steps (sop_id, step_order, title, description, image_url, video_url, attention, quality_standard, key_params, is_mandatory) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    
    const now = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0];
    
    const sop1Id = insertSOP.run(1, 1, '1.0', '电机组件A-零件准备作业指导书', 'approved', 3, today, 4, now).lastInsertRowid;
    insertStep.run(sop1Id, 1, '核对物料清单', '对照BOM清单核对所有物料型号和数量', 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400', '', '确认物料无损坏、无锈蚀', '物料型号匹配率100%，数量准确', '物料编号,数量', 1);
    insertStep.run(sop1Id, 2, '清洁工作台', '使用无尘布清洁工作台面，确保无杂物', '', '', '清洁剂避免接触电子元件', '工作台面无可见灰尘和杂物', '', 0);
    insertStep.run(sop1Id, 3, '物料分类摆放', '按照装配顺序将物料分类摆放在指定区域', 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400', '', '轻拿轻放，避免碰撞', '摆放整齐，标识清晰', '摆放区域编号', 1);
    
    const sop2Id = insertSOP.run(1, 2, '1.0', '电机组件A-组件装配作业指导书', 'approved', 3, today, 4, now).lastInsertRowid;
    insertStep.run(sop2Id, 1, '安装定子', '将定子垂直放入机壳，确保完全到位', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 'https://www.w3schools.com/html/mov_bbb.mp4', '定子方向不能装反', '定子与机壳间隙≤0.05mm', '压力值,定位尺寸', 1);
    insertStep.run(sop2Id, 2, '安装转子', '将转子缓慢放入定子中心，注意不要碰伤绕组', '', '', '转子必须保持水平', '转子转动灵活无卡滞', '', 1);
    insertStep.run(sop2Id, 3, '安装端盖', '对齐定位销，对角均匀拧紧螺栓', '', '', '螺栓扭矩要均匀', '螺栓扭矩：8±1 N·m', '扭矩值', 1);
    insertStep.run(sop2Id, 4, '通电测试', '接通电源，测试电机运转情况', '', '', '注意用电安全', '电机运转平稳，无异响', '电流值,转速', 0);
    
    const sop3Id = insertSOP.run(1, 3, '1.0', '电机组件A-质量检测作业指导书', 'approved', 3, today, 4, now).lastInsertRowid;
    insertStep.run(sop3Id, 1, '外观检查', '检查产品外观，确认无损伤、无变形', '', '', '光线充足', '外观无可见缺陷', '', 1);
    insertStep.run(sop3Id, 2, '尺寸测量', '使用卡尺测量关键尺寸', '', '', '卡尺需经校准', '尺寸符合图纸公差要求', '外径,内径,高度', 1);
    insertStep.run(sop3Id, 3, '电气测试', '进行绝缘电阻和耐压测试', '', '', '测试前确认设备接地', '绝缘电阻≥100MΩ，耐压测试通过', '绝缘电阻,耐压值', 1);
  }

  const workOrderCount = db.prepare('SELECT COUNT(*) as count FROM work_orders').get();
  if (workOrderCount.count === 0) {
    const insertOrder = db.prepare('INSERT INTO work_orders (order_no, product_id, quantity, status, current_process_id) VALUES (?, ?, ?, ?, ?)');
    const insertOrderProcess = db.prepare('INSERT INTO work_order_processes (work_order_id, process_id, process_order, status) VALUES (?, ?, ?, ?)');
    
    const order1Id = insertOrder.run('WO20260521001', 1, 100, 'pending', 1).lastInsertRowid;
    insertOrderProcess.run(order1Id, 1, 1, 'pending');
    insertOrderProcess.run(order1Id, 2, 2, 'pending');
    insertOrderProcess.run(order1Id, 3, 3, 'pending');
    
    const order2Id = insertOrder.run('WO20260521002', 1, 50, 'in_progress', 2).lastInsertRowid;
    insertOrderProcess.run(order2Id, 1, 1, 'completed');
    insertOrderProcess.run(order2Id, 2, 2, 'in_progress');
    insertOrderProcess.run(order2Id, 3, 3, 'pending');
    
    const order3Id = insertOrder.run('WO20260521003', 2, 30, 'pending', 1).lastInsertRowid;
    insertOrderProcess.run(order3Id, 1, 1, 'pending');
    insertOrderProcess.run(order3Id, 2, 2, 'pending');
    insertOrderProcess.run(order3Id, 3, 3, 'pending');
  }
}

initDatabase();

export default db;
