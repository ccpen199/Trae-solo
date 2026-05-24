const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../data/app.sqlite');
const schemaPath = path.join(__dirname, './schema.sql');

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Old database removed');
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);
console.log('Database schema created');

const bcrypt = require('bcryptjs');
const saltRounds = 10;

const hashPassword = (pwd) => bcrypt.hashSync(pwd, saltRounds);

const insertUser = db.prepare(`
  INSERT INTO users (username, password, role, name, phone, email, store_id)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const users = [
  { username: 'admin', password: hashPassword('admin123'), role: 'admin', name: '系统管理员', phone: '13800000000', email: 'admin@pet.com', store_id: null },
  { username: 'store1', password: hashPassword('store123'), role: 'store', name: '爱宠乐园', phone: '13800000001', email: 'store1@pet.com', store_id: null },
  { username: 'staff1', password: hashPassword('staff123'), role: 'staff', name: '李美容师', phone: '13800000002', email: 'staff1@pet.com', store_id: 2 },
  { username: 'staff2', password: hashPassword('staff123'), role: 'staff', name: '王洗护师', phone: '13800000003', email: 'staff2@pet.com', store_id: 2 },
  { username: 'driver1', password: hashPassword('driver123'), role: 'driver', name: '张司机', phone: '13800000004', email: 'driver1@pet.com', store_id: 2 },
  { username: 'cs1', password: hashPassword('cs123'), role: 'customer_service', name: '刘客服', phone: '13800000005', email: 'cs1@pet.com', store_id: null },
  { username: 'owner1', password: hashPassword('owner123'), role: 'owner', name: '陈主人', phone: '13800000006', email: 'owner1@pet.com', store_id: null },
  { username: 'owner2', password: hashPassword('owner123'), role: 'owner', name: '林主人', phone: '13800000007', email: 'owner2@pet.com', store_id: null },
];

for (const user of users) {
  insertUser.run(user.username, user.password, user.role, user.name, user.phone, user.email, user.store_id);
}
console.log('Users inserted');

const insertPet = db.prepare(`
  INSERT INTO pets (owner_id, name, species, breed, gender, weight, size, age, is_aggressive, aggression_notes, health_notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const pets = [
  { owner_id: 7, name: '豆豆', species: 'dog', breed: '金毛', gender: 'male', weight: 25, size: 'large', age: 3, is_aggressive: 0, aggression_notes: '', health_notes: '健康' },
  { owner_id: 7, name: '咪咪', species: 'cat', breed: '英短', gender: 'female', weight: 4, size: 'small', age: 2, is_aggressive: 0, aggression_notes: '', health_notes: '健康' },
  { owner_id: 8, name: '旺财', species: 'dog', breed: '柯基', gender: 'male', weight: 12, size: 'medium', age: 4, is_aggressive: 1, aggression_notes: '对陌生人有戒心，需慢慢接触', health_notes: '髋关节需注意' },
];

for (const pet of pets) {
  insertPet.run(pet.owner_id, pet.name, pet.species, pet.breed, pet.gender, pet.weight, pet.size, pet.age, pet.is_aggressive, pet.aggression_notes, pet.health_notes);
}
console.log('Pets inserted');

const today = new Date();
const formatDate = (d) => d.toISOString().split('T')[0];
const addDays = (d, days) => {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + days);
  return formatDate(nd);
};

const insertVaccine = db.prepare(`
  INSERT INTO vaccines (pet_id, vaccine_name, vaccine_date, expire_date, certificate_no, hospital, status)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const vaccines = [
  { pet_id: 1, vaccine_name: '狂犬疫苗', vaccine_date: addDays(today, -60), expire_date: addDays(today, 300), certificate_no: 'VAC2024001', hospital: '爱宠医院', status: 'valid' },
  { pet_id: 1, vaccine_name: '六联疫苗', vaccine_date: addDays(today, -60), expire_date: addDays(today, 300), certificate_no: 'VAC2024002', hospital: '爱宠医院', status: 'valid' },
  { pet_id: 2, vaccine_name: '狂犬疫苗', vaccine_date: addDays(today, -400), expire_date: addDays(today, -40), certificate_no: 'VAC2024003', hospital: '爱宠医院', status: 'expired' },
  { pet_id: 3, vaccine_name: '狂犬疫苗', vaccine_date: addDays(today, -30), expire_date: addDays(today, 330), certificate_no: 'VAC2024004', hospital: '爱宠医院', status: 'valid' },
];

for (const v of vaccines) {
  insertVaccine.run(v.pet_id, v.vaccine_name, v.vaccine_date, v.expire_date, v.certificate_no, v.hospital, v.status);
}
console.log('Vaccines inserted');

const insertService = db.prepare(`
  INSERT INTO services (store_id, name, category, description, base_price, duration_minutes, pet_species, min_weight, max_weight, allow_aggressive, capacity_per_slot, room_required, is_active)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const services = [
  { store_id: 2, name: '基础洗护', category: 'wash', description: '包括洗澡、吹干、梳理、剪指甲、挤肛门腺', base_price: 88, duration_minutes: 60, pet_species: 'all', min_weight: 0, max_weight: 100, allow_aggressive: 0, capacity_per_slot: 2, room_required: 0, is_active: 1 },
  { store_id: 2, name: '精致洗护', category: 'wash', description: '基础洗护+深层护理+精油SPA', base_price: 168, duration_minutes: 90, pet_species: 'all', min_weight: 0, max_weight: 100, allow_aggressive: 0, capacity_per_slot: 1, room_required: 0, is_active: 1 },
  { store_id: 2, name: '萌系造型', category: 'groom', description: '根据宠物特点设计造型，包含洗澡+剪毛+造型', base_price: 268, duration_minutes: 120, pet_species: 'all', min_weight: 0, max_weight: 50, allow_aggressive: 0, capacity_per_slot: 1, room_required: 0, is_active: 1 },
  { store_id: 2, name: '标准间寄养', category: 'boarding', description: '独立标准房间，含每日三餐、定时遛放', base_price: 98, duration_minutes: 1440, pet_species: 'all', min_weight: 0, max_weight: 100, allow_aggressive: 1, capacity_per_slot: 1, room_required: 1, is_active: 1 },
  { store_id: 2, name: '豪华间寄养', category: 'boarding', description: '豪华大房间，含监控、互动、定制饮食', base_price: 168, duration_minutes: 1440, pet_species: 'all', min_weight: 0, max_weight: 100, allow_aggressive: 1, capacity_per_slot: 1, room_required: 1, is_active: 1 },
  { store_id: 2, name: '接送服务', category: 'transport', description: '上门接送宠物', base_price: 30, duration_minutes: 30, pet_species: 'all', min_weight: 0, max_weight: 100, allow_aggressive: 1, capacity_per_slot: 3, room_required: 0, is_active: 1 },
];

for (const s of services) {
  insertService.run(s.store_id, s.name, s.category, s.description, s.base_price, s.duration_minutes, s.pet_species, s.min_weight, s.max_weight, s.allow_aggressive, s.capacity_per_slot, s.room_required, s.is_active);
}
console.log('Services inserted');

const insertSlot = db.prepare(`
  INSERT INTO service_slots (service_id, date, start_time, end_time, max_capacity, current_booked, status)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (let i = 1; i <= 7; i++) {
  const slotDate = addDays(today, i);
  for (let hour = 9; hour < 18; hour++) {
    for (let sid = 1; sid <= 6; sid++) {
      const service = services[sid - 1];
      const endHour = hour + Math.floor(service.duration_minutes / 60);
      if (endHour <= 18) {
        insertSlot.run(sid, slotDate, `${hour}:00`, `${endHour}:00`, service.capacity_per_slot, 0, 'available');
      }
    }
  }
}
console.log('Service slots inserted');

const insertRoom = db.prepare(`
  INSERT INTO boarding_rooms (store_id, room_no, room_type, size, max_pets, daily_rate, facilities, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const rooms = [
  { store_id: 2, room_no: 'S001', room_type: '标准间', size: '3㎡', max_pets: 1, daily_rate: 98, facilities: '狗窝、水盆、食盆', status: 'available' },
  { store_id: 2, room_no: 'S002', room_type: '标准间', size: '3㎡', max_pets: 1, daily_rate: 98, facilities: '狗窝、水盆、食盆', status: 'available' },
  { store_id: 2, room_no: 'S003', room_type: '标准间', size: '3㎡', max_pets: 2, daily_rate: 98, facilities: '狗窝、水盆、食盆', status: 'available' },
  { store_id: 2, room_no: 'L001', room_type: '豪华间', size: '6㎡', max_pets: 1, daily_rate: 168, facilities: '豪华狗窝、监控摄像头、互动玩具', status: 'available' },
  { store_id: 2, room_no: 'L002', room_type: '豪华间', size: '6㎡', max_pets: 2, daily_rate: 168, facilities: '豪华狗窝、监控摄像头、互动玩具', status: 'available' },
];

for (const r of rooms) {
  insertRoom.run(r.store_id, r.room_no, r.room_type, r.size, r.max_pets, r.daily_rate, r.facilities, r.status);
}
console.log('Boarding rooms inserted');

const insertConsumable = db.prepare(`
  INSERT INTO consumables (store_id, name, category, unit, stock_quantity, unit_cost, supplier)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const consumables = [
  { store_id: 2, name: '宠物香波', category: '洗护', unit: '瓶', stock_quantity: 50, unit_cost: 25, supplier: '宠物用品供应商' },
  { store_id: 2, name: '护毛素', category: '洗护', unit: '瓶', stock_quantity: 40, unit_cost: 30, supplier: '宠物用品供应商' },
  { store_id: 2, name: '消毒水', category: '清洁', unit: '桶', stock_quantity: 20, unit_cost: 45, supplier: '清洁用品公司' },
  { store_id: 2, name: '一次性手套', category: '防护', unit: '盒', stock_quantity: 100, unit_cost: 15, supplier: '医疗用品公司' },
  { store_id: 2, name: '宠物零食', category: '寄养', unit: '袋', stock_quantity: 80, unit_cost: 20, supplier: '宠物食品公司' },
];

for (const c of consumables) {
  insertConsumable.run(c.store_id, c.name, c.category, c.unit, c.stock_quantity, c.unit_cost, c.supplier);
}
console.log('Consumables inserted');

const insertAppointment = db.prepare(`
  INSERT INTO appointments (order_no, owner_id, pet_id, service_id, slot_id, store_id, staff_id, appointment_date, start_time, end_time, pickup_address, delivery_address, need_pickup, need_delivery, special_requirements, status, vaccine_checked, vaccine_valid, size_checked, aggression_checked, capacity_checked)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const orderNo1 = 'AP' + Date.now().toString().slice(-10) + '01';
const orderNo2 = 'AP' + Date.now().toString().slice(-10) + '02';

const appointments = [
  {
    order_no: orderNo1, owner_id: 7, pet_id: 1, service_id: 1, slot_id: 1, store_id: 2, staff_id: 3,
    appointment_date: addDays(today, 1), start_time: '09:00', end_time: '10:00',
    pickup_address: '', delivery_address: '', need_pickup: 0, need_delivery: 0,
    special_requirements: '用低敏香波', status: 'confirmed',
    vaccine_checked: 1, vaccine_valid: 1, size_checked: 1, aggression_checked: 1, capacity_checked: 1
  },
  {
    order_no: orderNo2, owner_id: 8, pet_id: 3, service_id: 4, slot_id: null, store_id: 2, staff_id: null,
    appointment_date: addDays(today, 2), start_time: '10:00', end_time: null,
    pickup_address: '朝阳区XX小区1号楼', delivery_address: '朝阳区XX小区1号楼', need_pickup: 1, need_delivery: 1,
    special_requirements: '每天遛放2次，不吃鸡肉', status: 'pending',
    vaccine_checked: 1, vaccine_valid: 1, size_checked: 1, aggression_checked: 1, capacity_checked: 1
  },
];

for (const a of appointments) {
  insertAppointment.run(a.order_no, a.owner_id, a.pet_id, a.service_id, a.slot_id, a.store_id, a.staff_id, a.appointment_date, a.start_time, a.end_time, a.pickup_address, a.delivery_address, a.need_pickup, a.need_delivery, a.special_requirements, a.status, a.vaccine_checked, a.vaccine_valid, a.size_checked, a.aggression_checked, a.capacity_checked);
}
console.log('Appointments inserted');

const insertFee = db.prepare(`
  INSERT INTO fee_orders (order_no, appointment_id, owner_id, store_id, service_fee, transport_fee, consumable_fee, extra_fee, discount, total_amount, paid_amount, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertFee.run('FEE' + Date.now().toString().slice(-10) + '01', 1, 7, 2, 88, 0, 0, 0, 0, 88, 0, 'unpaid');
console.log('Fee orders inserted');

console.log('Database initialization complete!');
db.close();
