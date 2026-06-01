require('dotenv').config({ path: '../.env' });
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.sqlite');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

const insertPlatform = db.prepare(`
  INSERT OR IGNORE INTO platforms (name, license_no, contact_person, contact_phone, address, status)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertDriver = db.prepare(`
  INSERT OR IGNORE INTO drivers (name, id_card, phone, driver_license_no, driver_license_type,
    driver_license_issue_date, driver_license_expiry_date, taxi_qualification_no,
    taxi_qualification_issue_date, taxi_qualification_expiry_date, platform_id, audit_status,
    audit_remark, audit_time)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertVehicle = db.prepare(`
  INSERT OR IGNORE INTO vehicles (plate_no, vehicle_type, color, brand, model, register_date,
    vehicle_license_no, vehicle_license_expiry_date, operation_license_no, operation_license_expiry_date,
    insurance_expiry_date, annual_inspection_expiry_date, platform_id, owner_name, owner_phone,
    audit_status, audit_remark, audit_time)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertOrder = db.prepare(`
  INSERT OR IGNORE INTO orders (platform_order_no, platform_id, driver_id, vehicle_id,
    passenger_name, passenger_phone, pickup_address, pickup_lat, pickup_lng, pickup_time,
    dropoff_address, dropoff_lat, dropoff_lng, dropoff_time, distance, duration, base_fare,
    toll_fee, parking_fee, tip_amount, total_amount, payment_method, trajectory_points,
    mileage, status, anomaly_tags, is_checked)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertRule = db.prepare(`
  INSERT OR IGNORE INTO compliance_rules (rule_code, rule_name, rule_type, description,
    violation_level, fine_amount_min, fine_amount_max, points_deducted, is_active)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertComplaint = db.prepare(`
  INSERT OR IGNORE INTO complaints (complaint_no, order_id, driver_id, vehicle_id, platform_id,
    complainant_name, complainant_phone, complaint_type, complaint_content, complaint_time,
    evidence_urls, status, handler, handle_result, handle_time)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertWorkOrder = db.prepare(`
  INSERT OR IGNORE INTO work_orders (work_order_no, source, source_id, work_order_type, title,
    description, driver_id, vehicle_id, platform_id, order_id, complaint_id, violation_rule_id,
    priority, status, assign_to, assign_time, verify_result, verify_evidence, verify_time)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertCase = db.prepare(`
  INSERT OR IGNORE INTO enforcement_cases (case_no, case_type, title, driver_id, vehicle_id,
    platform_id, work_order_id, complaint_id, violation_details, evidence_urls, law_enforcement_officer,
    law_enforcement_time, initial_decision, initial_fine_amount, initial_points_deducted, decision_time,
    is_appealed, appeal_content, appeal_time, review_result, review_time, final_decision,
    final_fine_amount, final_points_deducted, rectification_requirements, rectification_result,
    rectification_evidence, rectification_time, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertPenalty = db.prepare(`
  INSERT OR IGNORE INTO penalties (penalty_no, case_id, driver_id, vehicle_id, platform_id,
    penalty_type, penalty_amount, points_deducted, penalty_desc, penalty_time, paid_amount,
    paid_time, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const now = new Date().toISOString();
const today = now.split('T')[0];

const tx = db.transaction(() => {
  insertPlatform.run('滴滴出行', 'CP2023001', '张经理', '13800138001', '北京市朝阳区望京SOHO', 'active');
  insertPlatform.run('高德打车', 'CP2023002', '李总监', '13800138002', '北京市海淀区中关村大街1号', 'active');
  insertPlatform.run('T3出行', 'CP2023003', '王主管', '13800138003', '上海市浦东新区陆家嘴金融中心', 'active');
  insertPlatform.run('美团打车', 'CP2023004', '赵经理', '13800138004', '北京市朝阳区望京美团总部', 'active');
  insertPlatform.run('首汽约车', 'CP2023005', '孙总', '13800138005', '北京市西城区首汽大厦', 'suspended');

  insertDriver.run(
    '张三', '110101199001011234', '13900139001',
    'DL11010119900101001', 'C1',
    '2010-01-01', '2030-01-01',
    'TXQ202300001', '2023-01-15', '2028-01-14',
    1, 'approved', '资质齐全，审核通过', '2023-02-01'
  );

  insertDriver.run(
    '李四', '110101199202025678', '13900139002',
    'DL11010119920202002', 'C1',
    '2012-03-15', '2032-03-14',
    'TXQ202300002', '2023-03-20', '2028-03-19',
    1, 'approved', '资质齐全，审核通过', '2023-04-10'
  );

  insertDriver.run(
    '王五', '110101198805059012', '13900139003',
    'DL11010119880505003', 'B2',
    '2008-06-01', '2028-05-31',
    'TXQ202300003', '2023-05-10', '2028-05-09',
    2, 'approved', '资质齐全，审核通过', '2023-06-01'
  );

  insertDriver.run(
    '赵六', '110101199508083456', '13900139004',
    'DL11010119950808004', 'C1',
    '2015-09-20', '2025-09-19',
    '', '', '',
    3, 'pending', '未提交从业资格证', null
  );

  insertDriver.run(
    '钱七', '110101198503037890', '13900139005',
    'DL11010119850303005', 'C1',
    '2007-11-10', '2020-11-09',
    'TXQ202000005', '2020-12-01', '2020-11-30',
    1, 'rejected', '驾驶证和从业资格证均已过期', '2024-01-15'
  );

  insertVehicle.run(
    '京A12345', '轿车', '黑色', '大众', '帕萨特', '2020-06-15',
    'VL202000001', '2026-06-14',
    'OP202000001', '2026-06-14',
    '2025-12-31', '2025-06-30',
    1, '张三', '13900139001',
    'approved', '证件齐全有效', '2023-02-01'
  );

  insertVehicle.run(
    '京B67890', '轿车', '白色', '丰田', '凯美瑞', '2021-03-20',
    'VL202100001', '2027-03-19',
    'OP202100001', '2027-03-19',
    '2025-09-30', '2025-03-19',
    1, '李四', '13900139002',
    'approved', '证件齐全有效', '2023-04-10'
  );

  insertVehicle.run(
    '京C11111', 'SUV', '银色', '比亚迪', '汉EV', '2022-09-01',
    'VL202200001', '2028-08-31',
    'OP202200001', '2028-08-31',
    '2025-11-30', '2024-09-01',
    2, '王五', '13900139003',
    'approved', '证件齐全有效', '2023-06-01'
  );

  insertVehicle.run(
    '京D22222', '轿车', '红色', '特斯拉', 'Model 3', '2023-01-15',
    'VL202300001', '2029-01-14',
    '', '',
    '2024-06-30', '2024-01-15',
    3, '赵六', '13900139004',
    'pending', '未办理营运证', null
  );

  insertVehicle.run(
    '京E33333', '轿车', '蓝色', '日产', '轩逸', '2019-04-10',
    'VL201900001', '2020-04-09',
    'OP201900001', '2020-04-09',
    '2020-04-09', '2020-04-09',
    1, '钱七', '13900139005',
    'rejected', '所有证件均已过期', '2024-01-15'
  );

  const baseTime = new Date('2024-01-15T08:00:00');
  for (let i = 1; i <= 20; i++) {
    const orderTime = new Date(baseTime.getTime() + i * 3600000 * 2);
    const dropoffTime = new Date(orderTime.getTime() + 30 * 60000 + Math.random() * 30 * 60000);
    const distance = 5 + Math.random() * 20;
    const duration = Math.floor((dropoffTime - orderTime) / 60000);
    const totalAmount = Math.round((13 + distance * 2.5 + duration * 0.5) * 100) / 100;

    const driverId = i % 5 === 0 ? null : (i % 3) + 1;
    const vehicleId = i % 5 === 0 ? null : (i % 3) + 1;
    const anomalyTags = i % 4 === 0 ? '计价异常' : (i % 7 === 0 ? '绕路嫌疑' : '');
    const isChecked = i % 3 === 0 ? 1 : 0;

    const trajectory = JSON.stringify([
      { lat: 39.9 + i * 0.01, lng: 116.3 + i * 0.01, time: orderTime.toISOString() },
      { lat: 39.92 + i * 0.01, lng: 116.35 + i * 0.01, time: new Date(orderTime.getTime() + duration * 30000).toISOString() },
      { lat: 39.95 + i * 0.01, lng: 116.4 + i * 0.01, time: dropoffTime.toISOString() }
    ]);

    insertOrder.run(
      `ORD${String(i).padStart(8, '0')}`,
      (i % 4) + 1,
      driverId,
      vehicleId,
      `乘客${i}`,
      `13800${String(10000 + i).padStart(5, '0')}`,
      `北京市朝阳区起点${i}号`,
      39.9 + i * 0.01,
      116.3 + i * 0.01,
      orderTime.toISOString(),
      `北京市海淀区终点${i}号`,
      39.95 + i * 0.01,
      116.4 + i * 0.01,
      dropoffTime.toISOString(),
      Math.round(distance * 1000) / 1000,
      duration,
      13,
      i % 3 === 0 ? 10 : 0,
      i % 5 === 0 ? 5 : 0,
      i % 2 === 0 ? 3 : 0,
      totalAmount,
      i % 2 === 0 ? '微信支付' : '支付宝',
      trajectory,
      Math.round(distance * 1.1 * 1000) / 1000,
      'completed',
      anomalyTags,
      isChecked
    );
  }

  insertRule.run('RULE001', '无证运营', 'qualification',
    '未取得从业资格证从事网约车经营活动', 'serious', 5000, 20000, 12, 1);
  insertRule.run('RULE002', '跨区接单', 'operation',
    '超出许可经营区域从事经营活动', 'normal', 1000, 5000, 6, 1);
  insertRule.run('RULE003', '计价异常', 'pricing',
    '计价器作弊或违规加价', 'normal', 2000, 10000, 6, 1);
  insertRule.run('RULE004', '绕路投诉', 'service',
    '故意绕行增加行驶里程', 'minor', 500, 2000, 3, 1);
  insertRule.run('RULE005', '安全事件', 'safety',
    '发生交通安全事故或服务安全事件', 'serious', 10000, 50000, 12, 1);
  insertRule.run('RULE006', '证照过期', 'qualification',
    '营运证件过期未更新', 'normal', 1000, 3000, 3, 1);

  insertComplaint.run(
    'COMP202401001', 4, 1, 1, 1,
    '乘客A', '13800138101', '绕路投诉',
    '司机故意绕路，原本10公里的路走了18公里，多收费50元',
    '2024-01-15T10:30:00',
    '["https://example.com/evidence1.jpg"]',
    'processing', '执法员李', null, null
  );

  insertComplaint.run(
    'COMP202401002', 8, 2, 2, 1,
    '乘客B', '13800138102', '计价异常',
    '行程结束后发现费用比预估高出30%，怀疑计价异常',
    '2024-01-16T14:20:00',
    '["https://example.com/evidence2.jpg"]',
    'resolved', '执法员王',
    '经核查确实存在计价异常，已责令退还多收费用并罚款',
    '2024-01-17T09:00:00'
  );

  insertComplaint.run(
    'COMP202401003', null, 5, 5, 1,
    '乘客C', '13800138103', '无证运营',
    '司机无法出示营运证和从业资格证，怀疑是黑车',
    '2024-01-18T16:45:00',
    '["https://example.com/evidence3.jpg"]',
    'pending', null, null, null
  );

  insertWorkOrder.run(
    'WO202401001', 'complaint', 1, 'service_check',
    '绕路投诉核查', '乘客投诉司机故意绕路，需要核查行驶轨迹和收费情况',
    1, 1, 1, 4, 1, 4,
    'high', 'processing', '执法员李', '2024-01-15T11:00:00',
    null, null, null
  );

  insertWorkOrder.run(
    'WO202401002', 'order_check', 4, 'pricing_check',
    '订单计价异常抽查', '系统检测到订单金额异常偏高，需要人工复核',
    2, 2, 1, 8, null, 3,
    'normal', 'completed', '执法员王', '2024-01-16T09:00:00',
    '核查确认计价异常，司机承认修改计价器',
    '["https://example.com/check_result.pdf"]',
    '2024-01-17T15:00:00'
  );

  insertWorkOrder.run(
    'WO202401003', 'system_detect', null, 'qualification_check',
    '无证运营自动核查', '系统检测到司机钱七的所有证件均已过期，仍在接单',
    5, 5, 1, null, null, 1,
    'urgent', 'pending', null, null, null, null, null
  );

  insertWorkOrder.run(
    'WO202401004', 'complaint', 3, 'qualification_check',
    '无证运营投诉核查', '乘客投诉司机无法出示营运证件',
    5, 5, 1, null, 3, 1,
    'urgent', 'pending', '执法员张', '2024-01-18T17:00:00',
    null, null, null
  );

  insertCase.run(
    'CASE202401001', 'service_violation', '故意绕路服务违规案',
    1, 1, 1, 1, 1,
    '经核查，司机张三在2024年1月15日的订单中，故意绕行增加行驶里程约8公里，多收费用约50元。',
    '["https://example.com/trajectory_report.pdf", "https://example.com/recording.mp3"]',
    '执法员李', '2024-01-16T10:00:00',
    '罚款1000元，扣3分，责令退还多收费用',
    1000, 3, '2024-01-17T09:00:00',
    0, null, null, null, null,
    null, 1000, 3,
    '1. 退还乘客多收费用50元；2. 参加服务规范培训；3. 提交书面检讨',
    '已完成整改，参加培训并提交检讨',
    '["https://example.com/refund_proof.jpg", "https://example.com/training_cert.jpg"]',
    '2024-01-20T16:00:00',
    'closed'
  );

  insertCase.run(
    'CASE202401002', 'pricing_violation', '计价器违规作弊案',
    2, 2, 1, 2, 2,
    '经核查，司机李四通过安装非法软件修改计价器数据，累计多收乘客费用约3000元。',
    '["https://example.com/forensic_report.pdf", "https://example.com/device_photo.jpg"]',
    '执法员王', '2024-01-17T14:00:00',
    '罚款5000元，扣6分，暂扣营运证3个月',
    5000, 6, '2024-01-18T10:00:00',
    1, '认为罚款金额过高，要求从轻处理', '2024-01-19T09:00:00',
    '经复核，违法事实清楚，证据确凿，维持原处罚决定',
    '2024-01-20T15:00:00',
    '罚款5000元，扣6分，暂扣营运证3个月',
    5000, 6,
    '1. 全额退还多收费用；2. 拆除非法设备；3. 参加法制培训',
    '已缴纳罚款，正在整改中',
    '["https://example.com/payment_receipt.jpg"]',
    null,
    'processing'
  );

  insertCase.run(
    'CASE202401003', 'unlicensed_operation', '涉嫌无证经营案',
    5, 5, 1, 3, 3,
    '司机钱七的驾驶证、从业资格证、车辆营运证均已过期超过3年，仍在从事网约车经营活动。',
    '["https://example.com/id_check.jpg", "https://example.com/order_records.pdf"]',
    '执法员张', '2024-01-19T09:00:00',
    null, null, null, null,
    0, null, null, null, null,
    null, null, null,
    null, null, null, null,
    'pending'
  );

  insertPenalty.run(
    'PEN202401001', 1, 1, 1, 1,
    'fine', 1000, 3, '绕路违规罚款',
    '2024-01-17T09:00:00', 1000, '2024-01-18T10:30:00', 'paid'
  );

  insertPenalty.run(
    'PEN202401002', 2, 2, 2, 1,
    'fine', 5000, 6, '计价作弊罚款',
    '2024-01-18T10:00:00', 5000, '2024-01-22T14:00:00', 'paid'
  );

  insertPenalty.run(
    'PEN202401003', 2, 2, 2, 1,
    'suspend_license', 0, 0, '暂扣营运证3个月',
    '2024-01-18T10:00:00', 0, null, 'active'
  );
});

tx();

console.log('种子数据插入完成');
db.close();
