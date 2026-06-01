const db = require("../db");
const { success, error } = require("../utils/response");

const checkin = (req, res) => {
  const { order_id, latitude, longitude } = req.body;
  const nurse = db.prepare("SELECT id FROM nurses WHERE user_id = ?").get(req.user.id);

  if (!nurse) {
    return res.status(403).json(error("只有护士可以签到"));
  }

  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(order_id);
  if (!order) {
    return res.status(404).json(error("订单不存在"));
  }

  if (order.nurse_id !== nurse.id) {
    return res.status(403).json(error("这不是分配给您的订单"));
  }

  const existing = db.prepare("SELECT * FROM nursing_records WHERE order_id = ?").get(order_id);

  if (existing) {
    db.prepare(`
      UPDATE nursing_records SET checkin_time = CURRENT_TIMESTAMP,
      checkin_latitude = ?, checkin_longitude = ?
      WHERE order_id = ?
    `).run(latitude || null, longitude || null, order_id);
  } else {
    db.prepare(`
      INSERT INTO nursing_records (order_id, checkin_time, checkin_latitude, checkin_longitude)
      VALUES (?, CURRENT_TIMESTAMP, ?, ?)
    `).run(order_id, latitude || null, longitude || null);
  }

  db.prepare("UPDATE orders SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(order_id);

  res.json(success({ checkin_time: new Date().toISOString() }, "签到成功"));
};

const checkout = (req, res) => {
  const { order_id, latitude, longitude } = req.body;
  const nurse = db.prepare("SELECT id FROM nurses WHERE user_id = ?").get(req.user.id);

  if (!nurse) {
    return res.status(403).json(error("只有护士可以签退"));
  }

  const record = db.prepare("SELECT * FROM nursing_records WHERE order_id = ?").get(order_id);
  if (!record) {
    return res.status(400).json(error("请先签到"));
  }

  db.prepare(`
    UPDATE nursing_records SET checkout_time = CURRENT_TIMESTAMP,
    checkout_latitude = ?, checkout_longitude = ?
    WHERE order_id = ?
  `).run(latitude || null, longitude || null, order_id);

  db.prepare("UPDATE orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(order_id);
  db.prepare("UPDATE nurses SET status = 'available', total_orders = total_orders + 1 WHERE id = ?").run(nurse.id);

  res.json(success({ checkout_time: new Date().toISOString() }, "签退成功"));
};

const submitRecord = (req, res) => {
  const {
    order_id, temperature, pulse, breathing, blood_pressure,
    spo2, blood_sugar, vital_signs, operation_process,
    materials_used, abnormal_situation, family_signature, photos, nurse_remark
  } = req.body;

  const nurse = db.prepare("SELECT id FROM nurses WHERE user_id = ?").get(req.user.id);
  if (!nurse) {
    return res.status(403).json(error("只有护士可以提交护理记录"));
  }

  const existing = db.prepare("SELECT * FROM nursing_records WHERE order_id = ?").get(order_id);

  if (existing) {
    db.prepare(`
      UPDATE nursing_records SET
        temperature = ?, pulse = ?, breathing = ?, blood_pressure = ?,
        spo2 = ?, blood_sugar = ?, vital_signs = ?, operation_process = ?,
        materials_used = ?, abnormal_situation = ?, family_signature = ?,
        photos = ?, nurse_remark = ?
      WHERE order_id = ?
    `).run(
      temperature || null, pulse || null, breathing || null, blood_pressure || null,
      spo2 || null, blood_sugar || null, vital_signs || null, operation_process || null,
      materials_used || null, abnormal_situation || null, family_signature || null,
      photos || null, nurse_remark || null, order_id
    );
  } else {
    db.prepare(`
      INSERT INTO nursing_records (
        order_id, temperature, pulse, breathing, blood_pressure,
        spo2, blood_sugar, vital_signs, operation_process,
        materials_used, abnormal_situation, family_signature, photos, nurse_remark
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order_id, temperature || null, pulse || null, breathing || null, blood_pressure || null,
      spo2 || null, blood_sugar || null, vital_signs || null, operation_process || null,
      materials_used || null, abnormal_situation || null, family_signature || null,
      photos || null, nurse_remark || null
    );
  }

  res.json(success(null, "护理记录提交成功"));
};

const getRecord = (req, res) => {
  const { order_id } = req.params;
  const record = db.prepare("SELECT * FROM nursing_records WHERE order_id = ?").get(order_id);

  if (!record) {
    return res.status(404).json(error("护理记录不存在"));
  }

  res.json(success(record, "查询成功"));
};

const getNurses = (req, res) => {
  const nurses = db.prepare(`
    SELECT n.*, u.name, u.phone, u.status as user_status
    FROM nurses n JOIN users u ON n.user_id = u.id
    ORDER BY n.rating DESC
  `).all();
  res.json(success(nurses));
};

const createNurse = (req, res) => {
  const { name, phone, id_card, license_no, qualifications, skills, service_area } = req.body;
  
  if (!name || !id_card || !license_no) {
    return res.status(400).json(error("缺少必要参数"));
  }

  const userResult = db.prepare(`
    INSERT INTO users (username, password, name, role, phone)
    VALUES (?, ?, ?, 'nurse', ?)
  `).run(phone || id_card, require("bcryptjs").hashSync("nurse123", 10), name, phone);

  db.prepare(`
    INSERT INTO nurses (user_id, id_card, license_no, qualifications, skills, service_area)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userResult.lastInsertRowid, id_card, license_no, qualifications || null, skills || null, service_area || null);

  res.json(success({ id: userResult.lastInsertRowid }, "护士创建成功"));
};

module.exports = { checkin, checkout, submitRecord, getRecord, getNurses, createNurse };
