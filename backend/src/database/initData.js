const bcrypt = require('bcryptjs');

module.exports = function(db) {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const hash = bcrypt.hashSync('123456', 10);
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, real_name, phone, user_type)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertUser.run('admin', hash, '系统管理员', '13800138000', 'admin');
    insertUser.run('citizen1', hash, '张三', '13800138001', 'citizen');
    insertUser.run('enterprise1', hash, '李四', '13800138002', 'enterprise');
  }

  const enterpriseCount = db.prepare('SELECT COUNT(*) as count FROM enterprises').get().count;
  if (enterpriseCount === 0) {
    const insertEnterprise = db.prepare(`
      INSERT INTO enterprises (name, unified_credit_code, legal_person, industry, scale, tax_amount, address, contact_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertEnterprise.run(
      '浙江省数字科技有限公司',
      '91330000MA12345678',
      '李四',
      'information',
      'medium',
      5000000,
      '杭州市西湖区文三路100号',
      '0571-12345678'
    );
    insertEnterprise.run(
      '杭州智能制造有限公司',
      '91330100MA87654321',
      '王五',
      'manufacturing',
      'large',
      20000000,
      '杭州市滨江区江南大道200号',
      '0571-87654321'
    );
    insertEnterprise.run(
      '宁波小微企业服务有限公司',
      '91330200MA11223344',
      '赵六',
      'service',
      'small',
      500000,
      '宁波市鄞州区百丈路300号',
      '0574-11223344'
    );
  }

  const orgCount = db.prepare('SELECT COUNT(*) as count FROM enterprise_org').get().count;
  if (orgCount === 0) {
    const insertOrg = db.prepare(`
      INSERT INTO enterprise_org (enterprise_id, parent_id, name, type, manager, phone, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertOrg.run(1, 0, '总公司', 'headquarters', '李四', '0571-12345678', 1);
    insertOrg.run(1, 1, '技术部', 'department', '张经理', '0571-12345679', 1);
    insertOrg.run(1, 1, '财务部', 'department', '王经理', '0571-12345680', 2);
    insertOrg.run(1, 1, '市场部', 'department', '李经理', '0571-12345681', 3);
    insertOrg.run(1, 2, '前端组', 'team', '陈组长', '0571-12345682', 1);
    insertOrg.run(1, 2, '后端组', 'team', '刘组长', '0571-12345683', 2);
  }

  const policyCount = db.prepare('SELECT COUNT(*) as count FROM policies').get().count;
  if (policyCount === 0) {
    const insertPolicy = db.prepare(`
      INSERT INTO policies (title, summary, content, department, publish_date, valid_from, valid_to, industry_tags, scale_tags, tax_min, tax_max, benefit_amount, benefit_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertPolicy.run(
      '高新技术企业税收优惠政策',
      '对高新技术企业减按15%的税率征收企业所得税',
      '为扶持高新技术企业发展，经认定的高新技术企业，可减按15%的税率征收企业所得税。同时，研发费用可享受175%加计扣除。',
      '浙江省税务局',
      '2024-01-01',
      '2024-01-01',
      '2026-12-31',
      'information,technology',
      'medium,large',
      1000000,
      null,
      500000,
      'tax_reduction'
    );
    insertPolicy.run(
      '小微企业纾困专项补贴',
      '针对小微企业的一次性纾困补贴，最高10万元',
      '为帮助小微企业应对经营困难，对符合条件的小微企业给予一次性纾困补贴。补贴标准根据企业规模和纳税情况确定，最高可达10万元。',
      '浙江省经信厅',
      '2024-02-01',
      '2024-02-01',
      '2024-12-31',
      'manufacturing,service,retail',
      'small,micro',
      0,
      1000000,
      100000,
      'subsidy'
    );
    insertPolicy.run(
      '数字化转型专项资助',
      '支持企业数字化转型，按项目投入的30%给予资助',
      '鼓励企业开展数字化转型，对符合条件的数字化改造项目，按实际投入的30%给予资助，单个项目最高资助500万元。',
      '浙江省经信厅',
      '2024-01-15',
      '2024-01-15',
      '2025-12-31',
      'manufacturing,service',
      'medium,large',
      500000,
      null,
      5000000,
      'subsidy'
    );
    insertPolicy.run(
      '稳岗返还补贴政策',
      '对不裁员或少裁员的企业返还失业保险费',
      '对符合条件的参保企业，返还其上年度实际缴纳失业保险费的50%。中小微企业返还比例最高可提至60%。',
      '浙江省人社厅',
      '2024-01-01',
      '2024-01-01',
      '2024-12-31',
      'all',
      'small,medium,large,micro',
      0,
      null,
      null,
      'refund'
    );
    insertPolicy.run(
      '研发费用加计扣除政策',
      '企业研发费用可按175%在税前加计扣除',
      '企业开展研发活动中实际发生的研发费用，未形成无形资产计入当期损益的，在按规定据实扣除的基础上，再按照实际发生额的75%在税前加计扣除。',
      '浙江省税务局',
      '2024-01-01',
      '2024-01-01',
      '2025-12-31',
      'all',
      'small,medium,large,micro',
      0,
      null,
      null,
      'tax_reduction'
    );
  }

  const serviceCount = db.prepare('SELECT COUNT(*) as count FROM service_items').get().count;
  if (serviceCount === 0) {
    const insertService = db.prepare(`
      INSERT INTO service_items (item_code, name, department, category, description, required_materials, handling_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertService.run(
      'GS001',
      '企业营业执照办理',
      '市场监管局',
      '企业登记',
      '内资企业设立登记、变更登记、注销登记等业务',
      '身份证、公司章程、住所证明',
      '3个工作日'
    );
    insertService.run(
      'GS002',
      '公章刻制备案',
      '公安厅',
      '印章管理',
      '企业公章、财务章、法人章等刻制及备案',
      '营业执照、法人身份证',
      '1个工作日'
    );
    insertService.run(
      'SW001',
      '税务登记办理',
      '税务局',
      '税务服务',
      '企业税务登记、变更、注销等业务',
      '营业执照、法人身份证',
      '即时办理'
    );
    insertService.run(
      'SB001',
      '社保开户登记',
      '人社厅',
      '社会保障',
      '企业社会保险登记、人员增减等业务',
      '营业执照、法人身份证、银行开户许可证',
      '3个工作日'
    );
    insertService.run(
      'GG001',
      '住房公积金开户',
      '住房公积金管理中心',
      '住房公积金',
      '企业住房公积金账户开立及缴存',
      '营业执照、法人身份证',
      '3个工作日'
    );
    insertService.run(
      'ZJ001',
      '不动产权证办理',
      '自然资源厅',
      '不动产登记',
      '国有建设用地使用权及房屋所有权登记',
      '身份证、购房合同、完税证明',
      '5个工作日'
    );
  }

  const branchCount = db.prepare('SELECT COUNT(*) as count FROM service_branches').get().count;
  if (branchCount === 0) {
    const insertBranch = db.prepare(`
      INSERT INTO service_branches (name, address, district, phone, work_hours, gis_latitude, gis_longitude, total_windows)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertBranch.run(
      '杭州市民中心服务大厅',
      '杭州市上城区新业路311号',
      '上城区',
      '0571-87008700',
      '周一至周五 9:00-17:00',
      30.2683,
      120.1675,
      20
    );
    insertBranch.run(
      '西湖区行政服务中心',
      '杭州市西湖区文一西路858号',
      '西湖区',
      '0571-88156300',
      '周一至周五 9:00-17:00',
      30.2891,
      120.0748,
      15
    );
    insertBranch.run(
      '滨江区行政服务中心',
      '杭州市滨江区江南大道100号',
      '滨江区',
      '0571-87702300',
      '周一至周五 9:00-17:00',
      30.2096,
      120.2165,
      12
    );
    insertBranch.run(
      '宁波市行政服务中心',
      '宁波市鄞州区宁穿路1901号',
      '鄞州区',
      '0574-87187501',
      '周一至周五 9:00-17:00',
      29.8672,
      121.5506,
      18
    );
  }

  const bindingCount = db.prepare('SELECT COUNT(*) as count FROM enterprise_bindings').get().count;
  if (bindingCount === 0) {
    const insertBinding = db.prepare(`
      INSERT INTO enterprise_bindings (user_id, enterprise_id, role, status, verified_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertBinding.run(3, 1, 'admin', 'verified', '2024-01-01 10:00:00');
  }
};
