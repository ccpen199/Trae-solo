import { db } from './database';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const citiesData = [
  { name: '北京', province: '北京市', longitude: 116.4074, latitude: 39.9042 },
  { name: '上海', province: '上海市', longitude: 121.4737, latitude: 31.2304 },
  { name: '广州', province: '广东省', longitude: 113.2644, latitude: 23.1291 },
  { name: '深圳', province: '广东省', longitude: 114.0579, latitude: 22.5431 },
  { name: '杭州', province: '浙江省', longitude: 120.1551, latitude: 30.2741 },
  { name: '南京', province: '江苏省', longitude: 118.7969, latitude: 32.0603 },
  { name: '成都', province: '四川省', longitude: 104.0668, latitude: 30.5728 },
  { name: '武汉', province: '湖北省', longitude: 114.3055, latitude: 30.5931 },
  { name: '西安', province: '陕西省', longitude: 108.9398, latitude: 34.3416 },
  { name: '重庆', province: '重庆市', longitude: 106.5516, latitude: 29.5630 },
  { name: '天津', province: '天津市', longitude: 117.1902, latitude: 39.1256 },
  { name: '苏州', province: '江苏省', longitude: 120.5853, latitude: 31.2990 },
  { name: '郑州', province: '河南省', longitude: 113.6254, latitude: 34.7466 },
  { name: '长沙', province: '湖南省', longitude: 112.9388, latitude: 28.2282 },
  { name: '青岛', province: '山东省', longitude: 120.3826, latitude: 36.0671 },
];

export function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) {
    console.log('Data already seeded, checking demo workflow data');
    ensureDemoWorkflowData();
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const hashPwd = (pwd: string) => bcrypt.hashSync(pwd, salt);

  const users = [
    { id: uuidv4(), username: 'admin', real_name: '系统管理员', phone: '13800000000', email: 'admin@test.com', role: 'admin', password: 'admin123' },
    { id: uuidv4(), username: 'platform', real_name: '平台运营', phone: '13800000010', email: 'platform@test.com', role: 'store_manager', password: 'platform123' },
    { id: uuidv4(), username: 'ops', real_name: '运维管理', phone: '13800000020', email: 'ops@test.com', role: 'store_manager', password: 'ops123' },
    { id: uuidv4(), username: 'owner1', real_name: '张三', phone: '13800000001', email: 'owner1@test.com', role: 'owner', password: '123456' },
    { id: uuidv4(), username: 'owner2', real_name: '李四', phone: '13800000002', email: 'owner2@test.com', role: 'owner', password: '123456' },
    { id: uuidv4(), username: 'designer1', real_name: '王设计', phone: '13800000011', email: 'designer1@test.com', role: 'designer', city: '北京', password: '123456' },
    { id: uuidv4(), username: 'designer2', real_name: '李设计', phone: '13800000012', email: 'designer2@test.com', role: 'designer', city: '上海', password: '123456' },
    { id: uuidv4(), username: 'supervisor1', real_name: '赵监理', phone: '13800000021', email: 'supervisor1@test.com', role: 'supervisor', city: '北京', password: '123456' },
    { id: uuidv4(), username: 'supervisor2', real_name: '钱监理', phone: '13800000022', email: 'supervisor2@test.com', role: 'supervisor', city: '上海', password: '123456' },
    { id: uuidv4(), username: 'supplier1', real_name: '孙供应商', phone: '13800000031', email: 'supplier1@test.com', role: 'supplier', password: '123456' },
    { id: uuidv4(), username: 'supplier2', real_name: '周供应商', phone: '13800000032', email: 'supplier2@test.com', role: 'supplier', password: '123456' },
    { id: uuidv4(), username: 'manager1', real_name: '吴经理', phone: '13800000041', email: 'manager1@test.com', role: 'store_manager', city: '北京', password: '123456' },
    { id: uuidv4(), username: 'manager2', real_name: '郑经理', phone: '13800000042', email: 'manager2@test.com', role: 'store_manager', city: '上海', password: '123456' },
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, real_name, phone, email, role, city, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `);

  users.forEach(u => {
    insertUser.run(u.id, u.username, hashPwd(u.password), u.real_name, u.phone, u.email, u.role, u.city || null);
  });

  const store1Id = uuidv4();
  const store2Id = uuidv4();
  const insertStore = db.prepare(`
    INSERT INTO stores (id, name, city, address, longitude, latitude, service_radius, manager_id, contact_phone, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `);
  insertStore.run(store1Id, '北京朝阳旗舰店', '北京', '北京市朝阳区建国路88号', 116.4551, 39.9043, 50, users[9].id, '400-800-0001');
  insertStore.run(store2Id, '上海浦东体验店', '上海', '上海市浦东新区陆家嘴环路1000号', 121.5049, 31.2397, 50, users[10].id, '400-800-0002');

  db.prepare('UPDATE users SET store_id = ? WHERE id = ?').run(store1Id, users[3].id);
  db.prepare('UPDATE users SET store_id = ? WHERE id = ?').run(store1Id, users[5].id);
  db.prepare('UPDATE users SET store_id = ? WHERE id = ?').run(store2Id, users[4].id);
  db.prepare('UPDATE users SET store_id = ? WHERE id = ?').run(store2Id, users[6].id);

  const insertCity = db.prepare(`
    INSERT INTO cities (id, name, province, longitude, latitude, store_count)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  citiesData.forEach((city, idx) => {
    insertCity.run(uuidv4(), city.name, city.province, city.longitude, city.latitude, idx < 2 ? 1 : 0);
  });

  const showroomStyles = ['现代简约', '北欧风格', '中式古典', '欧式奢华', '工业风', '日式禅意'];
  const insertShowroom = db.prepare(`
    INSERT INTO showroom_models (id, name, style, model_url, thumbnail_url, description, store_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  showroomStyles.forEach((style, idx) => {
    insertShowroom.run(
      uuidv4(),
      `${style}三居室`,
      style,
      `/models/showroom_${idx + 1}.glb`,
      `/images/showroom_${idx + 1}.jpg`,
      `${style}风格样板间，完美展示空间布局与材质搭配`,
      idx % 2 === 0 ? store1Id : store2Id
    );
  });

  console.log('Seed data inserted successfully');
  ensureDemoWorkflowData();
}

function ensureDemoWorkflowData() {
  const owner = db.prepare("SELECT * FROM users WHERE username = 'owner1' OR role = 'owner' ORDER BY username LIMIT 1").get() as any;
  const designer = db.prepare("SELECT * FROM users WHERE username = 'designer1' OR role = 'designer' ORDER BY username LIMIT 1").get() as any;
  const supervisor = db.prepare("SELECT * FROM users WHERE username = 'supervisor1' OR role = 'supervisor' ORDER BY username LIMIT 1").get() as any;
  const supplier = db.prepare("SELECT * FROM users WHERE username = 'supplier1' OR role = 'supplier' ORDER BY username LIMIT 1").get() as any;
  const store = db.prepare('SELECT * FROM stores ORDER BY created_at LIMIT 1').get() as any;

  if (!owner || !designer || !store) {
    console.log('Demo workflow data skipped: missing base users or store');
    return;
  }

  let demand = db.prepare('SELECT * FROM decoration_demands ORDER BY created_at LIMIT 1').get() as any;
  if (!demand) {
    const demandId = uuidv4();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO decoration_demands (
        id, owner_id, city, district, address, house_type, area, budget_min, budget_max,
        decoration_style, requirement_desc, contact_name, contact_phone, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'matched', ?, ?)
    `).run(
      demandId,
      owner.id,
      '北京',
      '朝阳区',
      '阳光花园1203室',
      '三室两厅',
      118,
      180000,
      260000,
      '现代简约',
      '需要儿童房、开放式厨房和充足收纳空间',
      owner.real_name,
      owner.phone,
      now,
      now
    );
    demand = db.prepare('SELECT * FROM decoration_demands WHERE id = ?').get(demandId);
  }

  const solutionCount = db.prepare('SELECT COUNT(*) as count FROM ai_solutions WHERE demand_id = ?').get(demand.id) as { count: number };
  if (solutionCount.count === 0) {
    db.prepare(`
      INSERT INTO ai_solutions (
        id, demand_id, style_plan, layout_plan, material_plan, estimated_budget, estimated_period, renderings
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      demand.id,
      '现代简约风格，浅色墙面搭配原木柜体，客餐厨保持开阔通透。',
      '三室两厅动线优化，主卧套房、儿童房和多功能书房分区明确。',
      '木地板、环保乳胶漆、定制柜、石英石台面和品牌五金。',
      220000,
      90,
      JSON.stringify(['/images/render_demo_1.jpg', '/images/render_demo_2.jpg'])
    );
  }

  const matchCount = db.prepare('SELECT COUNT(*) as count FROM designer_matches WHERE demand_id = ?').get(demand.id) as { count: number };
  if (matchCount.count === 0) {
    db.prepare(`
      INSERT INTO designer_matches (id, demand_id, designer_id, store_id, match_score, status, created_at)
      VALUES (?, ?, ?, ?, 92, 'accepted', ?)
    `).run(uuidv4(), demand.id, designer.id, designer.store_id || store.id, new Date().toISOString());
  }

  let contract = db.prepare('SELECT * FROM decoration_contracts ORDER BY created_at LIMIT 1').get() as any;
  if (!contract) {
    const contractId = uuidv4();
    const now = new Date().toISOString();
    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + 90);
    db.prepare(`
      INSERT INTO decoration_contracts (
        id, demand_id, owner_id, designer_id, store_id, contract_no, total_amount, escrow_amount,
        start_date, end_date, warranty_years, terms, status, owner_signed_at, store_signed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 10, ?, 'signed', ?, ?, ?)
    `).run(
      contractId,
      demand.id,
      demand.owner_id || owner.id,
      designer.id,
      designer.store_id || store.id,
      'DEC-DEMO-89241',
      220000,
      44000,
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0],
      '示例合同：含三方节点确认、资金托管和十年质保条款。',
      now,
      now,
      now
    );
    db.prepare("UPDATE decoration_demands SET status = 'in_progress', updated_at = ? WHERE id = ?").run(now, demand.id);
    contract = db.prepare('SELECT * FROM decoration_contracts WHERE id = ?').get(contractId);
  }

  const milestoneCount = db.prepare('SELECT COUNT(*) as count FROM project_milestones WHERE contract_id = ?').get(contract.id) as { count: number };
  if (milestoneCount.count === 0) {
    const milestones = [
      { type: '水电隐蔽验收', days: 15, amount: 66000, status: 'confirmed', paymentStatus: 'paid' },
      { type: '泥木完工', days: 45, amount: 77000, status: 'ready', paymentStatus: 'processing' },
      { type: '竣工', days: 90, amount: 33000, status: 'pending', paymentStatus: 'pending' },
    ];
    const startDate = new Date(contract.start_date || new Date());
    for (const item of milestones) {
      const planned = new Date(startDate);
      planned.setDate(startDate.getDate() + item.days);
      db.prepare(`
        INSERT INTO project_milestones (
          id, contract_id, milestone_type, planned_date, status, owner_confirmed,
          designer_confirmed, supervisor_confirmed, payment_amount, payment_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(),
        contract.id,
        item.type,
        planned.toISOString().split('T')[0],
        item.status,
        item.status === 'confirmed' ? 1 : 0,
        item.status === 'confirmed' ? 1 : 0,
        item.status === 'confirmed' ? 1 : 0,
        item.amount,
        item.paymentStatus,
        new Date().toISOString()
      );
    }
  }

  const bomCount = db.prepare('SELECT COUNT(*) as count FROM material_bom WHERE contract_id = ?').get(contract.id) as { count: number };
  if (bomCount.count === 0) {
    const materials = [
      ['地砖', '800x800mm 抛光砖', 95, '㎡', 150],
      ['木地板', '15mm 多层实木', 72, '㎡', 280],
      ['墙面涂料', '净味乳胶漆', 260, '㎡', 85],
    ];
    for (const [name, spec, qty, unit, price] of materials as any[]) {
      db.prepare(`
        INSERT INTO material_bom (
          id, contract_id, material_name, specification, quantity, unit, unit_price, total_price, supplier_id, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ordered', ?)
      `).run(uuidv4(), contract.id, name, spec, qty, unit, price, qty * price, supplier?.id || null, new Date().toISOString());
    }
  }

  const supervisionCount = db.prepare('SELECT COUNT(*) as count FROM ai_supervision_records WHERE contract_id = ?').get(contract.id) as { count: number };
  if (supervisionCount.count === 0) {
    db.prepare(`
      INSERT INTO ai_supervision_records (
        id, contract_id, camera_id, detection_time, risk_type, risk_level, description, status, handled_by, created_at
      ) VALUES (?, ?, 'CAM-01', ?, '未戴安全帽', 'medium', 'AI识别到工人未佩戴安全帽，已通知现场监理。', 'processing', ?, ?)
    `).run(uuidv4(), contract.id, new Date().toISOString(), supervisor?.id || null, new Date().toISOString());
  }

  const workOrderCount = db.prepare('SELECT COUNT(*) as count FROM work_orders WHERE contract_id = ?').get(contract.id) as { count: number };
  if (workOrderCount.count === 0) {
    db.prepare(`
      INSERT INTO work_orders (
        id, contract_id, type, title, description, submitter_id, handler_id, status, created_at
      ) VALUES (?, ?, 'maintenance', '厨房水路复检', '业主反馈厨房水路需要复检，安排监理跟进。', ?, ?, 'processing', ?)
    `).run(uuidv4(), contract.id, demand.owner_id || owner.id, supervisor?.id || null, new Date().toISOString());
  }

  const npsCount = db.prepare('SELECT COUNT(*) as count FROM nps_records WHERE contract_id = ?').get(contract.id) as { count: number };
  if (npsCount.count === 0) {
    db.prepare(`
      INSERT INTO nps_records (id, contract_id, owner_id, score, feedback, created_at)
      VALUES (?, ?, ?, 9, '施工响应及时，节点说明清晰。', ?)
    `).run(uuidv4(), contract.id, demand.owner_id || owner.id, new Date().toISOString());
  }
}
