const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, './data/app.sqlite');
const db = new sqlite3.Database(dbPath);

const feeStandards = JSON.stringify([
  { name: '登记费', type: '行政事业性收费', amount: '100', unit: '元/件', basis: '《国家发展改革委、财政部关于发布〈行政事业性收费项目目录〉的通知》' },
  { name: '工本费', type: '工本费', amount: '10', unit: '元/本', basis: '《财政部关于印发〈行政事业单位资金往来结算票据使用管理暂行办法〉的通知》' }
]);

const faqs = JSON.stringify([
  { question: '办理需要多长时间？', answer: '法定时限为5个工作日，承诺时限为3个工作日。', sort: 1 },
  { question: '可以委托他人办理吗？', answer: '可以，需提供委托书和双方身份证明。', sort: 2 },
  { question: '周末可以办理吗？', answer: '政务服务大厅周末不办公，建议工作日前来办理。', sort: 3 }
]);

const materials = JSON.stringify([
  { name: '身份证明', requirement: '原件及复印件', format: '纸质', quantity: 1, is_required: 1, description: '居民身份证或其他有效身份证明' },
  { name: '申请表', requirement: '填写完整并签字', format: '纸质/电子', quantity: 1, is_required: 1, description: '可在网上下载或现场领取' },
  { name: '相关证明材料', requirement: '原件', format: '纸质', quantity: 1, is_required: 0, description: '根据具体事项要求提供' }
]);

const processSteps = JSON.stringify([
  { step_no: 1, step_name: '申请', step_content: '申请人通过网上或现场提交申请材料', handling_time: '0.5个工作日', handling_department: '政务服务中心综合窗口' },
  { step_no: 2, step_name: '受理', step_content: '窗口工作人员对申请材料进行初审', handling_time: '0.5个工作日', handling_department: '政务服务中心综合窗口' },
  { step_no: 3, step_name: '审查', step_content: '业务科室对申请材料进行实质性审查', handling_time: '1个工作日', handling_department: '相关业务科室' },
  { step_no: 4, step_name: '决定', step_content: '分管领导作出审批决定', handling_time: '0.5个工作日', handling_department: '分管领导' },
  { step_no: 5, step_name: '办结', step_content: '制作批件或证照，通知申请人领取', handling_time: '0.5个工作日', handling_department: '政务服务中心综合窗口' }
]);

const applicationMaterials = JSON.stringify([
  { id: 1, name: '身份证明.pdf', size: 1024000, type: 'application/pdf', upload_time: '2024-01-15 10:30:00', status: '已审核' },
  { id: 2, name: '申请表.docx', size: 256000, type: 'application/docx', upload_time: '2024-01-15 10:35:00', status: '已审核' },
  { id: 3, name: '证明材料.jpg', size: 2048000, type: 'image/jpeg', upload_time: '2024-01-15 10:40:00', status: '已审核' }
]);

const signature = JSON.stringify({
  signer_name: '张三',
  signer_id_card: '510101199001010001',
  sign_time: '2024-01-15 14:20:00',
  sign_ip: '127.0.0.1',
  sign_image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gMVFTApvBl66QAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAgklEQVRoQ+3YwQ2AIBBFURwciUI7gCOoRFuwA3agFpRvL8fGRyLx7P4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADw5wPZ3xPZ2wAAAAAAAAAAAAAAAPj3AwAAAAAAAAAAAAAAAAAAAL57A53dE9nbAAAAAAAAAAAAAAD+PQMAAAAAAAAAAAAAAACvx3B2tW8B7r0H8sQAAAAASUVORK5CYII=',
  certificate_number: '2024011500123',
  is_valid: 1
});

const payment = JSON.stringify({
  amount: 110.00,
  currency: 'CNY',
  pay_method: '微信支付',
  pay_time: '2024-01-15 14:30:00',
  transaction_id: 'WX20240115143000123456',
  order_no: 'ZX202401150001',
  status: '支付成功',
  receipt_url: '/uploads/receipts/ZX202401150001.pdf'
});

const evaluation = JSON.stringify({
  rating: 5,
  content: '办理速度很快，工作人员态度很好，非常满意！',
  evaluator_name: '张三',
  evaluator_phone: '13800000001',
  create_time: '2024-01-18 09:00:00',
  is_anonymous: 0
});

const rectification = JSON.stringify({
  alert_id: 1,
  alert_type: '差评预警',
  alert_level: 'high',
  reason: '用户评价1星，对办理结果不满意',
  measure: '已联系用户进行沟通，了解具体诉求，将在3个工作日内重新办理',
  responsible_person: '李四',
  deadline: '2024-01-20',
  status: '已整改',
  review_time: '2024-01-19',
  reviewer: '王五',
  review_result: '整改到位，用户表示满意'
});

const timeline = JSON.stringify([
  { id: 1, type: 'primary', title: '提交申请', description: '张三于2024年01月15日提交申请', time: '2024-01-15 10:00:00', status: 'completed' },
  { id: 2, type: 'primary', title: '材料上传', description: '已上传3份材料', time: '2024-01-15 10:40:00', status: 'completed', materials: applicationMaterials },
  { id: 3, type: 'primary', title: '电子签名', description: '申请人完成电子签名确认', time: '2024-01-15 14:20:00', status: 'completed', signature: signature },
  { id: 4, type: 'primary', title: '在线支付', description: '已完成费用支付', time: '2024-01-15 14:30:00', status: 'completed', payment: payment },
  { id: 5, type: 'primary', title: '受理', description: '窗口工作人员已受理', time: '2024-01-15 15:00:00', status: 'completed', handler: '李窗口' },
  { id: 6, type: 'primary', title: '审批', description: '业务科室审批通过', time: '2024-01-16 10:00:00', status: 'completed', handler: '王科长' },
  { id: 7, type: 'primary', title: '办结', description: '已完成办理，制作批件', time: '2024-01-17 09:00:00', status: 'completed', handler: '张主任' },
  { id: 8, type: 'success', title: '评价', description: '用户完成服务评价', time: '2024-01-18 09:00:00', status: 'completed', evaluation: evaluation, rectification: rectification }
]);

// 更新 service_items 表，添加结构化数据
db.serialize(() => {
  // 1. 更新事项的结构化数据
  const updateItemStmt = db.prepare(`
    UPDATE service_items SET
      fee_standards = ?,
      faqs = ?,
      materials_json = ?,
      process_steps_json = ?
    WHERE id = ?
  `);

  for (let i = 1; i <= 4; i++) {
    updateItemStmt.run(feeStandards, faqs, materials, processSteps, i);
  }
  updateItemStmt.finalize();
  console.log('✓ 更新了4条事项的结构化数据');

  // 2. 添加办件数据
  const insertAppStmt = db.prepare(`
    INSERT INTO applications (
      application_no, service_item_id, service_item_name, applicant_name,
      applicant_id_card, applicant_phone, applicant_email, region_code, region_level,
      status, current_step, materials, signature, payment, evaluation, rectification,
      timeline, submit_time, accept_time, finish_time, time_limit_days, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const appData = [
    ['ZX202401001', 1, '企业设立登记', '张三', '510101199001010001', '13800000001', 'zhangsan@example.com', '510000', 'province', 'completed', 8, applicationMaterials, signature, payment, evaluation, rectification, timeline, '2024-01-15 10:00:00', '2024-01-15 15:00:00', '2024-01-17 09:00:00', 5, '2024-01-15 10:00:00'],
    ['ZX202401002', 2, '结婚登记', '李四', '510102199002020002', '13800000002', 'lisi@example.com', '510100', 'city', 'processing', 3, applicationMaterials, null, null, null, null, JSON.stringify(timeline.slice(0, 4)), '2024-01-16 09:00:00', null, null, 3, '2024-01-16 09:00:00'],
    ['ZX202401003', 3, '社会保障卡申领', '王五', '510103199003030003', '13800000003', 'wangwu@example.com', '510104', 'county', 'pending', 1, null, null, null, null, null, JSON.stringify(timeline.slice(0, 1)), '2024-01-17 14:00:00', null, null, 10, '2024-01-17 14:00:00'],
    ['ZX202401004', 1, '企业设立登记', '赵六', '510701199004040004', '13800000004', 'zhaoliu@example.com', '510700', 'city', 'completed', 7, applicationMaterials, signature, payment, JSON.stringify({...JSON.parse(evaluation), rating: 1, content: '办理太慢了，等了好几天'}), rectification, timeline, '2024-01-10 09:00:00', '2024-01-10 10:00:00', '2024-01-16 17:00:00', 5, '2024-01-10 09:00:00'],
    ['ZX202401005', 4, '不动产登记', '孙七', '510601199005050005', '13800000005', 'sunqi@example.com', '510600', 'city', 'processing', 5, applicationMaterials, signature, payment, null, null, JSON.stringify(timeline.slice(0, 6)), '2024-01-18 09:00:00', '2024-01-18 11:00:00', null, 7, '2024-01-18 09:00:00']
  ];

  appData.forEach(data => {
    insertAppStmt.run(data);
  });
  insertAppStmt.finalize();
  console.log('✓ 插入了5条办件数据');

  // 3. 添加预警数据
  const insertAlertStmt = db.prepare(`
    INSERT INTO alerts (
      alert_type, alert_level, title, description, application_id,
      status, handled_by, handled_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const alertData = [
    ['overdue', 'high', '办件超期预警', '办件ZX202401004已超期1天', 4, 'pending', null, null, '2024-01-17 09:00:00'],
    ['bad_review', 'high', '差评预警', '用户对办件ZX202401004给出1星评价', 4, 'processing', 2, '2024-01-18 10:00:00', '2024-01-18 09:00:00'],
    ['material_missing', 'medium', '材料缺失提醒', '办件ZX202401002缺少关键材料', 2, 'pending', null, null, '2024-01-16 14:00:00'],
    ['process_exception', 'medium', '流程异常', '办件ZX202401003在审批环节停留超过24小时', 3, 'resolved', 2, '2024-01-17 16:00:00', '2024-01-17 15:00:00'],
    ['overdue', 'high', '办件超期预警', '办件ZX202401003即将超期', 3, 'pending', null, null, '2024-01-18 09:00:00']
  ];

  alertData.forEach(data => {
    insertAlertStmt.run(data);
  });
  insertAlertStmt.finalize();
  console.log('✓ 插入了5条预警数据');

  // 4. 添加审计日志
  const insertAuditStmt = db.prepare(`
    INSERT INTO audit_logs (
      user_id, username, real_name, role_code, role_name, department_id,
      department_name, region_code, region_name, module, action, ip_address,
      status, description, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const auditData = [
    [1, 'admin', '系统管理员', 'super_admin', '超级管理员', 1, '四川省政务服务中心', '510000', '四川省', '事项管理', '发布', '127.0.0.1', 'success', '发布事项"企业设立登记"', '2024-01-15 09:00:00'],
    [2, 'province_admin', '省级管理员', 'province_admin', '省级管理员', 1, '四川省政务服务中心', '510000', '四川省', '办件管理', '受理', '127.0.0.1', 'success', '受理办件ZX202401001', '2024-01-15 15:00:00'],
    [3, 'city_admin', '成都管理员', 'city_admin', '市级管理员', 2, '成都市政务服务中心', '510100', '成都市', '办件管理', '审批', '192.168.1.101', 'success', '审批通过办件ZX202401002', '2024-01-16 10:00:00'],
    [1, 'admin', '系统管理员', 'super_admin', '超级管理员', 1, '四川省政务服务中心', '510000', '四川省', '用户管理', '登录', '127.0.0.1', 'success', '系统管理员登录', '2024-01-18 08:30:00'],
    [4, 'approver', '审批员', 'approver', '审批人员', 1, '四川省政务服务中心', '510000', '四川省', '办件管理', '办结', '127.0.0.1', 'success', '办结办件ZX202401001', '2024-01-17 09:00:00'],
    [8, 'agent01', '客服坐席', 'agent', '客服坐席', 1, '四川省政务服务中心', '510000', '四川省', '问答管理', '回复', '127.0.0.1', 'success', '回复用户咨询', '2024-01-18 09:30:00'],
    [1, 'admin', '系统管理员', 'super_admin', '超级管理员', 1, '四川省政务服务中心', '510000', '四川省', '系统设置', '修改', '127.0.0.1', 'success', '更新系统配置参数', '2024-01-18 10:00:00']
  ];

  auditData.forEach(data => {
    insertAuditStmt.run(data);
  });
  insertAuditStmt.finalize();
  console.log('✓ 插入了7条审计日志');

  console.log('');
  console.log('✓ 模拟数据更新完成');
});

db.close();
