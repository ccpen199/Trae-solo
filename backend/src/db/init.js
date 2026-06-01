const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const db = require("./index");

const addDays = (days, hour = 9) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const initDatabase = () => {
  const schemaPath = path.join(__dirname, "schema.sql");
  db.exec(fs.readFileSync(schemaPath, "utf8"));

  const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, name, role, phone)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertUser.run("admin", bcrypt.hashSync("admin123", 10), "护理中心管理员", "admin", "13800000001");
    insertUser.run("dispatcher", bcrypt.hashSync("dispatch123", 10), "调度员小王", "dispatcher", "13800000002");
    insertUser.run("nurse1", bcrypt.hashSync("nurse123", 10), "王敏护士", "nurse", "13800000003");
    insertUser.run("nurse2", bcrypt.hashSync("nurse123", 10), "刘芳护士", "nurse", "13800000004");
    insertUser.run("family1", bcrypt.hashSync("family123", 10), "张先生", "patient_family", "13900000001");
  }

  const nurseCount = db.prepare("SELECT COUNT(*) AS count FROM nurses").get().count;
  if (nurseCount === 0) {
    const insertNurse = db.prepare(`
      INSERT INTO nurses (user_id, id_card, license_no, hospital, department, years_of_experience, qualifications, skills, service_area, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertNurse.run(3, "110101199001011234", "2020110001", "北京协和医院", "内科", 8, "护士执业证,急救证", "基础护理,压疮护理,鼻饲护理", "朝阳区", 39.9042, 116.4074);
    insertNurse.run(4, "110101199002022345", "2020110002", "北京医院", "外科", 5, "护士执业证,康复护理培训", "基础护理,伤口护理,康复训练", "海淀区", 39.9142, 116.4174);
  }

  const serviceCount = db.prepare("SELECT COUNT(*) AS count FROM services").get().count;
  if (serviceCount === 0) {
    const insertService = db.prepare(`
      INSERT INTO services (name, code, description, indications, contraindications, supplies, category, risk_level, duration, price, requires_approval, required_qualifications)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertService.run("基础生命体征测量", "SV001", "测量体温、血压、脉搏、呼吸、血糖等生命体征", "老年人、慢性病患者日常监测", "无特殊禁忌", "体温计,血压计,血糖仪", "nursing_care", "low", 30, 98, 0, "护士执业证");
    insertService.run("压疮护理", "SV002", "压疮评估、伤口清洁、敷料更换、健康指导", "长期卧床患者压疮预防和治疗", "严重感染、出血倾向", "压疮敷料,生理盐水,碘伏,换药包", "wound_care", "medium", 45, 198, 0, "护士执业证,伤口护理培训");
    insertService.run("鼻饲护理", "SV003", "鼻饲管留置、营养液输注、口腔护理", "不能经口进食患者", "严重食道静脉曲张、消化道梗阻", "鼻饲管,注射器,石蜡油,听诊器", "nursing_care", "medium", 40, 158, 1, "护士执业证,鼻饲操作培训");
    insertService.run("导尿护理", "SV004", "导尿管留置、膀胱冲洗、尿道口护理", "尿潴留、尿失禁患者", "尿道急性炎症", "导尿包,碘伏,石蜡油", "nursing_care", "medium", 40, 168, 1, "护士执业证,导尿操作培训");
    insertService.run("伤口换药", "SV005", "伤口评估、清洁消毒、敷料更换", "术后伤口、感染伤口", "严重出血倾向", "换药包,碘伏,生理盐水,敷料", "wound_care", "medium", 35, 128, 0, "护士执业证");
    insertService.run("静脉输液", "SV006", "医嘱核对、静脉穿刺、输液观察、不良反应处理", "需静脉给药患者", "严重药物过敏史", "输液器,碘伏,止血带,注射器", "medication", "high", 60, 188, 1, "护士执业证,静脉穿刺培训");
  }

  const inventoryCount = db.prepare("SELECT COUNT(*) AS count FROM inventory").get().count;
  if (inventoryCount === 0) {
    const insertInv = db.prepare(`
      INSERT INTO inventory (name, sku, specification, unit, price, stock, category)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertInv.run("一次性口罩", "INV001", "医用外科", "个", 1.50, 500, "防护用品");
    insertInv.run("一次性手套", "INV002", "M号", "副", 2.00, 300, "防护用品");
    insertInv.run("碘伏", "INV003", "100ml", "瓶", 8.00, 100, "消毒用品");
    insertInv.run("生理盐水", "INV004", "500ml", "瓶", 12.00, 50, "消毒用品");
    insertInv.run("压疮敷料", "INV005", "10x10cm", "片", 35.00, 80, "敷料");
    insertInv.run("一次性注射器", "INV006", "5ml", "支", 1.20, 200, "耗材");
    insertInv.run("鼻饲管", "INV007", "16号", "根", 25.00, 30, "耗材");
    insertInv.run("导尿包", "INV008", "双腔", "套", 45.00, 40, "耗材");
    insertInv.run("输液器", "INV009", "一次性", "套", 5.00, 100, "耗材");
    insertInv.run("换药包", "INV010", "一次性", "套", 15.00, 60, "耗材");
  }

  const orderCount = db.prepare("SELECT COUNT(*) AS count FROM orders").get().count;
  if (orderCount === 0) {
    const insertOrder = db.prepare(`
      INSERT INTO orders (order_no, user_id, service_id, patient_name, patient_phone, patient_address, patient_age, patient_gender, patient_condition, medical_order, scheduled_time, contact_name, contact_phone, price, status, need_approval, risk_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertOrder.run("NS20260529001", 5, 2, "周桂兰", "13910000001", "朝阳区望京西园一区8号楼", 82, "female", "糖尿病史，需记录血糖", "定期换药，注意血糖控制", addDays(0, 14), "张先生", "13900000001", 198, "dispatched", 0, "medium");
    insertOrder.run("NS20260529002", 5, 1, "陈建国", "13910000002", "海淀区中关村南路18号", 76, "male", "术后恢复期", "每日测量生命体征", addDays(1, 9), "陈女士", "13900000002", 98, "pending_approval", 1, "medium");
    insertOrder.run("NS20260529003", 5, 6, "李秀英", "13910000003", "东城区安定门外大街42号", 88, "female", "肺部感染需输液治疗", "静脉输液，每日一次，连续3天", addDays(0, 10), "李先生", "13900000003", 188, "pending", 1, "high");
    insertOrder.run("NS20260529004", 5, 3, "王淑珍", "13910000004", "西城区金融街15号", 72, "female", "吞咽困难", "鼻饲营养液，每日两次", addDays(2, 10), "王先生", "13900000004", 158, "completed", 1, "medium");
  }

  const dispatchCount = db.prepare("SELECT COUNT(*) AS count FROM dispatch_tasks").get().count;
  if (dispatchCount === 0) {
    const insertDispatch = db.prepare(`
      INSERT INTO dispatch_tasks (order_id, nurse_id, status, route, eta_minutes, notes, assigned_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertDispatch.run(1, 1, "assigned", "护理站 -> 望京西园", 28, "已通知护士携带无菌包", addDays(0, 8));
    insertDispatch.run(2, null, "waiting", null, null, "待匹配护士", null);
    insertDispatch.run(3, null, "waiting", null, null, "高风险订单需审核后派单", null);
    insertDispatch.run(4, 2, "completed", "护理站 -> 金融街", 35, "服务已完成", addDays(-1, 8));
  }

  const recordCount = db.prepare("SELECT COUNT(*) AS count FROM nursing_records").get().count;
  if (recordCount === 0) {
    const insertRecord = db.prepare(`
      INSERT INTO nursing_records (order_id, checkin_time, checkin_latitude, checkin_longitude, checkout_time, checkout_latitude, checkout_longitude, temperature, pulse, breathing, blood_pressure, spo2, blood_sugar, operation_process, materials_used, abnormal_situation, family_signature)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertRecord.run(4, addDays(-1, 10), 39.9142, 116.4174, addDays(-1, 11), 39.9142, 116.4174, 36.5, 78, 18, "120/80", 98, 6.5, "鼻饲管留置顺利，患者耐受良好，无不良反应", "鼻饲管x1,石蜡油x1,注射器x2", "无", "王先生");
  }
};

module.exports = initDatabase;
