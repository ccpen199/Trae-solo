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
    console.log('Data already seeded, skipping');
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
}
