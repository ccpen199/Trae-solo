import { initDatabase, getDb } from './index';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const init = () => {
  initDatabase();
  const db = getDb();

  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as any;
  if (userCount.cnt > 0) {
    console.log('[Init] Data already exists, skipping seed.');
    return;
  }

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, id_card_no, phone, user_type, enterprise_name, unified_social_credit_code,
      auth_level, is_verified, role, password_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const pwd = bcrypt.hashSync('123456', 10);
  const u1 = uuidv4();
  const u2 = uuidv4();
  const u3 = uuidv4();
  const u4 = uuidv4();
  const u5 = uuidv4();

  insertUser.run(u1, '张三', '3201**********1234', '138****5678', 'individual', null, null, 'L3', 1, 'user', pwd);
  insertUser.run(u2, '李四', '3201**********5678', '139****8765', 'enterprise', 'XX科技有限公司', '913201********AB12', 'L3', 1, 'user', pwd);
  insertUser.run(u3, '王审核', '3201**********9012', '137****1111', 'individual', null, null, 'L3', 1, 'reviewer', pwd);
  insertUser.run(u4, '赵复审', '3201**********3456', '137****2222', 'individual', null, null, 'L3', 1, 'reviewer', pwd);
  insertUser.run(u5, '管理员', '3201**********0000', '137****0000', 'individual', null, null, 'L3', 1, 'admin', pwd);

  console.log('[Seed] 5 users created.');

  const insertCert = db.prepare(`
    INSERT INTO ca_certificates (id, user_id, cert_sn, cert_type, issuer, subject, valid_from, valid_to, status, public_key)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertCert.run(
    uuidv4(), u1, 'SN2024010100001', 'SM2', '省级电子认证服务中心', 'CN=张三,O=个人,C=CN',
    '2024-01-01 00:00:00', '2026-12-31 23:59:59', 'active',
    'MFkwEwYHKoZIzj0CAQYIKoEcz1UBgi0DQgAE...'
  );
  insertCert.run(
    uuidv4(), u2, 'SN2024010100002', 'SM2', '省级电子认证服务中心', 'CN=李四,O=XX科技有限公司,C=CN',
    '2024-01-01 00:00:00', '2026-12-31 23:59:59', 'active',
    'MFkwEwYHKoZIzj0CAQYIKoEcz1UBgi0DQgAE...'
  );

  console.log('[Seed] 2 CA certificates created.');

  const insertTpl = db.prepare(`
    INSERT INTO form_templates (id, code, name, category, description, estimated_days,
      required_materials, form_fields, approval_process, is_hot, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tpls = [
    ['RI001', 'DJ-IND-001', '个体工商户设立登记', '市场主体登记', '个体工商户设立注册登记服务', 3,
      JSON.stringify(['身份证', '经营场所证明', '经营范围确认书']),
      JSON.stringify([
        { key: 'name', label: '字号名称', type: 'input', required: true },
        { key: 'businessScope', label: '经营范围', type: 'textarea', required: true },
        { key: 'address', label: '经营地址', type: 'input', required: true },
        { key: 'businessType', label: '经营类型', type: 'select', required: true, options: [
          { label: '批发零售', value: 'retail' }, { label: '餐饮服务', value: 'catering' }, { label: '居民服务', value: 'service' }
        ]}
      ]),
      JSON.stringify([
        { name: '材料受理', role: '受理员', level: 1 },
        { name: '初审', role: '初审员', level: 2 },
        { name: '复审', role: '复审员', level: 3 },
        { name: '核准', role: '核准员', level: 4 },
        { name: '证照发放', role: '发证员', level: 5 }
      ]), 1, u5],
    ['RI002', 'DJ-ENT-001', '有限责任公司设立登记', '市场主体登记', '有限公司设立注册', 5,
      JSON.stringify(['公司章程', '股东身份证明', '住所证明']),
      JSON.stringify([
        { key: 'companyName', label: '公司名称', type: 'input', required: true },
        { key: 'registeredCapital', label: '注册资本', type: 'input', required: true },
        { key: 'businessScope', label: '经营范围', type: 'textarea', required: true }
      ]),
      JSON.stringify([
        { name: '名称核准', role: '核准员', level: 1 },
        { name: '受理', role: '受理员', level: 2 },
        { name: '初审', role: '初审员', level: 3 },
        { name: '复审', role: '复审员', level: 4 },
        { name: '发证', role: '发证员', level: 5 }
      ]), 1, u5],
    ['RI003', 'XK-FOOD-001', '食品经营许可证核发', '行政许可', '食品销售餐饮服务许可', 10,
      JSON.stringify(['营业执照', '场所布局图', '安全管理制度']),
      JSON.stringify([
        { key: 'businessType', label: '经营类别', type: 'select', required: true, options: [
          { label: '食品销售', value: 'sales' }, { label: '餐饮服务', value: 'catering' }, { label: '单位食堂', value: 'canteen' }
        ]},
        { key: 'address', label: '经营地址', type: 'input', required: true }
      ]),
      JSON.stringify([
        { name: '材料受理', role: '受理员', level: 1 },
        { name: '现场核查', role: '核查员', level: 2 },
        { name: '复审', role: '复审员', level: 3 }
      ]), 0, u5],
    ['RI004', 'BG-IND-001', '个体工商户变更登记', '变更登记', '名称地址经营范围变更', 3,
      JSON.stringify(['变更申请书', '营业执照', '证明材料']),
      JSON.stringify([
        { key: 'changeType', label: '变更类型', type: 'checkbox', required: true, options: [
          { label: '名称变更', value: 'name' }, { label: '地址变更', value: 'address' }, { label: '经营范围变更', value: 'scope' }
        ]}
      ]),
      JSON.stringify([
        { name: '受理', role: '受理员', level: 1 },
        { name: '初审', role: '初审员', level: 2 },
        { name: '二审', role: '复审员', level: 3 },
        { name: '发证', role: '发证员', level: 4 }
      ]), 0, u5],
    ['RI005', 'ZX-IND-001', '个体工商户注销登记', '注销登记', '终止经营注销', 3,
      JSON.stringify(['注销申请书', '营业执照', '清税证明']),
      JSON.stringify([
        { key: 'cancelReason', label: '注销原因', type: 'select', required: true, options: [
          { label: '自愿终止', value: 'voluntary' }, { label: '被吊销', value: 'revoked' }, { label: '其他', value: 'other' }
        ]}
      ]),
      JSON.stringify([
        { name: '受理', role: '受理员', level: 1 },
        { name: '审核', role: '审核员', level: 2 },
        { name: '注销登记', role: '登记员', level: 3 }
      ]), 0, u5],
    ['RI006', 'NJ-001', '企业年度报告公示', '年度报告', '年报填报公示', 1,
      JSON.stringify(['基本信息', '经营数据', '股东信息']),
      JSON.stringify([
        { key: 'reportYear', label: '报告年度', type: 'select', required: true, options: [
          { label: '2024年度', value: '2024' }, { label: '2023年度', value: '2023' }
        ]}
      ]),
      JSON.stringify([
        { name: '提交', role: '系统', level: 1 },
        { name: '公示', role: '公示系统', level: 2 }
      ]), 0, u5]
  ];

  tpls.forEach(t => insertTpl.run(...t));
  console.log('[Seed] 6 form templates created.');

  const insertNotice = db.prepare(`
    INSERT INTO notices (id, title, content, type, level, publisher) VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertNotice.run(uuidv4(), '2024年度市场主体年报公示通知', '请于6月30日前完成年报填报。', 'notification', 'urgent', '省市场监督管理局');
  insertNotice.run(uuidv4(), '电子签名系统升级维护公告', '本周六2:00-4:00升级维护。', 'system', 'important', '省政务服务中心');
  insertNotice.run(uuidv4(), '《个体工商户条例》政策解读', '政策解读如下。', 'policy', 'normal', '省市场监督管理局法规处');
  console.log('[Seed] 3 notices created.');

  const insertLicense = db.prepare(`
    INSERT INTO electronic_licenses (id, user_id, license_type, license_no, holder_name, issuer, issue_date,
      valid_from, valid_to, status, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  insertLicense.run(uuidv4(), u1, '居民身份证', '3201**********1234', '张三', 'XX市公安局', '2018-06-01', '2018-06-01', '2038-06-01', 'valid');
  insertLicense.run(uuidv4(), u1, '个体工商户营业执照', '923201********1234', 'XX小吃店', 'XX区市场监管局', '2024-01-15', '2024-01-15', '长期', 'valid');
  console.log('[Seed] 2 electronic licenses created.');

  console.log('\n✅ 初始化完成。测试账号：138****5678 / 123456（张三），管理员：admin@123456');
};

init();
