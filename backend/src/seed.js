const db = require('./database');

const experts = [
  { name: '张三', phone: '13800138001', email: 'zhangsan@example.com', professional_field: '计算机科学', title: '教授', company: '清华大学', region: '北京', qualification_valid_until: '2027-12-31' },
  { name: '李四', phone: '13800138002', email: 'lisi@example.com', professional_field: '计算机科学', title: '副教授', company: '北京大学', region: '北京', qualification_valid_until: '2026-06-30' },
  { name: '王五', phone: '13800138003', email: 'wangwu@example.com', professional_field: '电子工程', title: '教授', company: '上海交通大学', region: '上海', qualification_valid_until: '2028-12-31' },
  { name: '赵六', phone: '13800138004', email: 'zhaoliu@example.com', professional_field: '计算机科学', title: '研究员', company: '中科院计算所', region: '北京', qualification_valid_until: '2025-01-01' },
  { name: '钱七', phone: '13800138005', email: 'qianqi@example.com', professional_field: '软件工程', title: '教授', company: '浙江大学', region: '浙江', qualification_valid_until: '2027-12-31' },
  { name: '孙八', phone: '13800138006', email: 'sunba@example.com', professional_field: '计算机科学', title: '教授', company: '复旦大学', region: '上海', qualification_valid_until: '2027-12-31' },
  { name: '周九', phone: '13800138007', email: 'zhoujiu@example.com', professional_field: '人工智能', title: '副教授', company: '南京大学', region: '江苏', qualification_valid_until: '2026-12-31' },
  { name: '吴十', phone: '13800138008', email: 'wushi@example.com', professional_field: '计算机科学', title: '教授', company: '华中科技大学', region: '湖北', qualification_valid_until: '2027-06-30', is_blacklisted: 1 },
];

const insertExpert = db.prepare(`
  INSERT INTO experts (name, phone, email, professional_field, title, company, region, qualification_valid_until, is_blacklisted)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertHistory = db.prepare(`
  INSERT INTO expert_review_history (expert_id, project_name, review_date, role)
  VALUES (?, ?, ?, ?)
`);

console.log('开始插入种子数据...');

experts.forEach((expert, index) => {
  const result = insertExpert.run(
    expert.name,
    expert.phone,
    expert.email,
    expert.professional_field,
    expert.title,
    expert.company,
    expert.region,
    expert.qualification_valid_until,
    expert.is_blacklisted || 0
  );

  if (index < 3) {
    insertHistory.run(result.lastInsertRowid, '2024年度重点项目评审', '2024-03-15', '主审专家');
    insertHistory.run(result.lastInsertRowid, '2023年度科技奖评审', '2023-09-20', '评审专家');
  }
});

console.log('种子数据插入完成！');
console.log(`共插入 ${experts.length} 位专家`);
