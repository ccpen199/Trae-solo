const { db } = require('./database');

function initTestData() {
  const customerCount = db.prepare('SELECT COUNT(*) as cnt FROM customers').get().cnt;
  if (customerCount > 0) {
    console.log('已有数据，跳过初始化');
    return;
  }

  const insertCustomer = db.prepare(`
    INSERT INTO customers (customer_no, name, id_card, phone, email, credit_problem_type, involved_institutions, overdue_reason, total_fee, contact_person, contact_phone, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMaterial = db.prepare(`
    INSERT INTO materials (customer_id, material_type, material_name, status, submitted_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertProgress = db.prepare(`
    INSERT INTO progress (customer_id, status, remark, created_at)
    VALUES (?, ?, ?, ?)
  `);

  const customers = [
    {
      customer_no: 'CR260500001',
      name: '张三',
      id_card: '110101199001011234',
      phone: '13800138001',
      email: 'zhangsan@example.com',
      credit_problem_type: 'overdue',
      involved_institutions: '招商银行、交通银行',
      overdue_reason: '由于疫情期间失业导致信用卡逾期，现已重新就业有还款能力，希望修复征信记录',
      total_fee: 5000,
      contact_person: '张三',
      contact_phone: '13800138001',
      status: 'active'
    },
    {
      customer_no: 'CR260500002',
      name: '李四',
      id_card: '310101198505055678',
      phone: '13900139002',
      email: 'lisi@example.com',
      credit_problem_type: 'misinformation',
      involved_institutions: '中国银行',
      overdue_reason: '征信报告中有错误记录，本人从未在该机构办理过贷款业务',
      total_fee: 3000,
      contact_person: '李四',
      contact_phone: '13900139002',
      status: 'active'
    },
    {
      customer_no: 'CR260500003',
      name: '王五',
      id_card: '440101199208089012',
      phone: '13700137003',
      email: 'wangwu@example.com',
      credit_problem_type: 'unauthorized',
      involved_institutions: '工商银行',
      overdue_reason: '身份信息被冒用办理贷款，产生不良记录，已报警处理',
      total_fee: 8000,
      contact_person: '王五',
      contact_phone: '13700137003',
      status: 'active'
    },
    {
      customer_no: 'CR260500004',
      name: '赵六',
      id_card: '330101198812123456',
      phone: '13600136004',
      email: 'zhaoliu@example.com',
      credit_problem_type: 'overdue',
      involved_institutions: '建设银行',
      overdue_reason: '创业失败导致房贷逾期，现在已恢复还款能力',
      total_fee: 10000,
      contact_person: '赵六',
      contact_phone: '13600136004',
      status: 'closed'
    }
  ];

  const now = new Date().toISOString();
  const customerIds = [];

  customers.forEach((cust, index) => {
    const result = insertCustomer.run(
      cust.customer_no, cust.name, cust.id_card, cust.phone, cust.email,
      cust.credit_problem_type, cust.involved_institutions, cust.overdue_reason,
      cust.total_fee, cust.contact_person, cust.contact_phone, cust.status, now
    );
    customerIds.push(result.lastInsertRowid);
  });

  const materialTypes = {
    overdue: ['身份证明', '结清证明', '异议说明', '沟通记录'],
    misinformation: ['身份证明', '征信异议申请书', '证据材料', '沟通记录'],
    unauthorized: ['身份证明', '报警回执', '非本人操作证明', '异议说明'],
    other: ['身份证明', '情况说明', '相关证明材料']
  };

  customerIds.forEach((custId, index) => {
    const types = materialTypes[customers[index].credit_problem_type] || materialTypes.other;
    types.forEach((type, i) => {
      const status = i < 2 ? 'submitted' : 'pending';
      insertMaterial.run(custId, type, type, status, now);
    });
  });

  customerIds.forEach((custId, index) => {
    const progressRemarks = {
      '已签约': '客户档案已创建，服务正式启动',
      '材料审核中': '开始审核客户提交的材料',
      '材料审核通过': '材料审核完成，准备提交异议申请',
      '已提交异议': '已向相关机构提交异议申请',
      '机构受理中': '机构已受理，正在处理中',
      '补件中': '要求补充材料，待客户提交',
      '机构驳回': '异议申请被驳回，需重新处理',
      '已更正': '征信记录已成功更正',
      '已结案': '服务完成，客户满意'
    };
    
    const progresses = ['已签约', '材料审核中'];
    if (index === 0) progresses.push('材料审核通过');
    if (index === 3) progresses.push('材料审核通过', '已提交异议', '机构受理中', '已更正', '已结案');
    
    progresses.forEach((status, i) => {
      const progressTime = new Date(Date.now() + i * 3600000).toISOString();
      insertProgress.run(custId, status, progressRemarks[status] || '', progressTime);
    });
  });

  if (customerIds.length > 3) {
    db.prepare(`
      INSERT INTO results (customer_id, service_conclusion, refund_status, final_balance, closed_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(customerIds[3], '成功删除逾期记录，征信已恢复正常', 'no_refund', 10000, now);
  }

  db.prepare(`
    INSERT INTO todo_items (customer_id, type, title, description, due_date, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    customerIds[1], 'followup', '银行电话跟进', '已提交异议申请3天，需要电话跟进确认进展',
    new Date(Date.now() + 86400000).toISOString(), 'pending', now
  );

  console.log('测试数据初始化完成！');
  console.log('添加了4个客户、相关材料和进度记录');
}

initTestData();
