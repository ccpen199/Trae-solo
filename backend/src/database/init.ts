import db from '../config/database';
import bcrypt from 'bcryptjs';

export const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      user_type TEXT NOT NULL CHECK(user_type IN ('natural', 'legal', 'admin')),
      real_name TEXT,
      id_card TEXT,
      phone TEXT,
      email TEXT,
      police_verified INTEGER DEFAULT 0,
      police_verify_time DATETIME,
      police_verify_result TEXT,
      business_license_hash TEXT,
      business_name TEXT,
      credit_code TEXT,
      portrait TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      national_code TEXT UNIQUE,
      local_code TEXT UNIQUE,
      name TEXT NOT NULL,
      department TEXT,
      category TEXT,
      granularity TEXT,
      condition_tree TEXT,
      material_rules TEXT,
      ocr_rules TEXT,
      processing_time INTEGER,
      charging_standard TEXT,
      description TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER,
      name TEXT NOT NULL,
      format_requirements TEXT,
      required INTEGER DEFAULT 1,
      template_url TEXT,
      ocr_enabled INTEGER DEFAULT 0,
      ocr_fields TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES service_items(id)
    );

    CREATE TABLE IF NOT EXISTS electronic_certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      cert_type TEXT NOT NULL,
      cert_number TEXT,
      cert_name TEXT,
      issuer TEXT,
      issuer_signature TEXT,
      issue_date DATETIME,
      expire_date DATETIME,
      status INTEGER DEFAULT 1,
      share_chain TEXT,
      verify_count INTEGER DEFAULT 0,
      last_verify_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_no TEXT UNIQUE,
      user_id INTEGER,
      item_id INTEGER,
      item_name TEXT,
      status TEXT DEFAULT 'pending',
      current_node TEXT,
      parallel_nodes TEXT,
      supplement_deadline DATETIME,
      reminder_sent INTEGER DEFAULT 0,
      submit_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      accept_time DATETIME,
      complete_time DATETIME,
      processing_days INTEGER,
      rating INTEGER,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (item_id) REFERENCES service_items(id)
    );

    CREATE TABLE IF NOT EXISTS application_nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER,
      node_name TEXT NOT NULL,
      node_type TEXT,
      department TEXT,
      handler TEXT,
      status TEXT DEFAULT 'pending',
      receive_time DATETIME,
      process_time DATETIME,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id)
    );

    CREATE TABLE IF NOT EXISTS application_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER,
      material_name TEXT,
      file_url TEXT,
      file_hash TEXT,
      ocr_result TEXT,
      review_status TEXT,
      review_comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id)
    );

    CREATE TABLE IF NOT EXISTS electronic_seals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      seal_name TEXT NOT NULL,
      seal_type TEXT,
      seal_data TEXT,
      certificate TEXT,
      private_key TEXT,
      gb_standard TEXT DEFAULT 'GB/T 33481-2016',
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS seal_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seal_id INTEGER,
      document_name TEXT,
      document_hash TEXT,
      signature TEXT,
      sign_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seal_id) REFERENCES electronic_seals(id)
    );

    CREATE TABLE IF NOT EXISTS service_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      target_industry TEXT,
      item_ids TEXT,
      benefits TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_service_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      package_id INTEGER,
      activated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expire_at DATETIME,
      status INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (package_id) REFERENCES service_packages(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      module TEXT,
      detail TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
    CREATE INDEX IF NOT EXISTS idx_certificates_user ON electronic_certificates(user_id);
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  
  if (userCount.count === 0) {
    const stmt = db.prepare(`
      INSERT INTO users (username, password, user_type, real_name, id_card, phone, police_verified, police_verify_time, police_verify_result, business_name, credit_code, business_license_hash, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run('admin', bcrypt.hashSync('admin123', 10), 'admin', '系统管理员', '', '', 1, '2026-01-15 09:00:00', '核验通过', '', '', '', 1);
    stmt.run('zhangsan', bcrypt.hashSync('123456', 10), 'natural', '张三', '210102199001011234', '13800000001', 1, '2026-02-20 14:30:00', '核验通过', '', '', '', 1);
    stmt.run('company1', bcrypt.hashSync('123456', 10), 'legal', '辽宁创新科技有限公司', '', '13800000002', 1, '2026-03-01 10:00:00', '核验通过', '辽宁创新科技有限公司', '91210100MA0ABCDE1X', 'a1b2c3d4e5f6hash', 1);
    console.log('默认账户已创建: admin/admin123, zhangsan/123456, company1/123456');
  }

  const itemCount = db.prepare('SELECT COUNT(*) as count FROM service_items').get() as any;
  if (itemCount.count === 0) {
    const itemStmt = db.prepare(`
      INSERT INTO service_items (national_code, local_code, name, department, category, granularity, condition_tree, material_rules, ocr_rules, processing_time, charging_standard, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const idCardPattern = '^[1-9][0-9]{5}(18|19|20)[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[0-9]{3}[0-9Xx]$';
    const creditCodePattern = '^[0-9A-HJ-NP-RT-UW-Y]{2}[0-9]{6}[0-9A-HJ-NP-RT-UW-Y]{10}$';
    const namePattern = '^[\\u4e00-\\u9fa5]{2,10}$';
    const propertyPattern = '^[\\u8fBD][0-9]{4}[0-9]{8}[0-9]{5}$';

    const condBiz = JSON.stringify({root:{type:'and',label:'办理条件',children:[{type:'condition',label:'申请人具有完全民事行为能力'},{type:'condition',label:'有符合规定的名称和住所'},{type:'condition',label:'有符合规定的注册资本'},{type:'or',label:'住所证明(满足其一)',children:[{type:'condition',label:'自有房产证'},{type:'condition',label:'租赁合同+房东房产证'},{type:'condition',label:'园区入驻协议'}]}]}});
    const condId = JSON.stringify({root:{type:'and',label:'办理条件',children:[{type:'condition',label:'申请人年满16周岁(首次申领)'},{type:'or',label:'办理情形(满足其一)',children:[{type:'condition',label:'首次申领居民身份证'},{type:'condition',label:'证件有效期满换证'},{type:'condition',label:'证件损坏换证'},{type:'condition',label:'证件丢失补领'}]}]}});
    const condSb = JSON.stringify({root:{type:'and',label:'办理条件',children:[{type:'or',label:'申请人类型',children:[{type:'condition',label:'用人单位(企业/机关/事业单位)'},{type:'condition',label:'灵活就业人员'},{type:'condition',label:'城乡居民'}]},{type:'condition',label:'未在其他统筹地区参保'}]}});
    const condBd = JSON.stringify({root:{type:'and',label:'办理条件',children:[{type:'condition',label:'申请人为权利人或者其代理人'},{type:'condition',label:'申请登记的不动产在本登记辖区内'},{type:'or',label:'权属来源材料(满足其一)',children:[{type:'condition',label:'国有建设用地使用权出让合同'},{type:'condition',label:'房屋买卖合同'},{type:'condition',label:'继承公证书'},{type:'condition',label:'法院判决书'}]}]}});
    const condSw = JSON.stringify({root:{type:'and',label:'办理条件',children:[{type:'condition',label:'已办理税务登记的纳税人'},{type:'or',label:'变更情形',children:[{type:'condition',label:'纳税人名称变更'},{type:'condition',label:'生产经营地址变更'},{type:'condition',label:'经营范围变更'},{type:'condition',label:'法定代表人变更'}]}]}});

    itemStmt.run('11100010001','LN-QY-0001','企业营业执照办理','市场监督管理局','企业开办','最小颗粒度-新设/变更/注销分别拆项',condBiz,JSON.stringify({rules:[{name:'公司章程',required:true,format:'PDF',maxSize:'10MB'},{name:'股东身份证明',required:true,format:'PDF/JPG',maxSize:'5MB'},{name:'住所证明',required:true,format:'PDF/JPG',maxSize:'10MB'}]}),JSON.stringify({enabled:true,fields:['身份证号','姓名','有效期','统一社会信用代码'],rules:[{field:'身份证号',pattern:idCardPattern,message:'身份证号格式不正确'},{field:'统一社会信用代码',pattern:creditCodePattern,message:'统一社会信用代码格式不正确'}]}),3,'免费','企业营业执照新设、变更、注销登记。根据《公司法》和《市场主体登记管理条例》规定，由市场监督管理部门负责实施。支持线上提交、并联审批。',1);
    itemStmt.run('11100020001','LN-HJ-0001','居民身份证办理','公安厅','户籍证件','最小颗粒度-首次申领/换领/补领分别拆项',condId,JSON.stringify({rules:[{name:'户口簿',required:true,format:'PDF/JPG',maxSize:'10MB'},{name:'旧身份证(换领)',required:false,format:'PDF/JPG',maxSize:'5MB'},{name:'居住证(异地办理)',required:false,format:'PDF/JPG',maxSize:'5MB'}]}),JSON.stringify({enabled:true,fields:['姓名','身份证号','住址','有效期'],rules:[{field:'身份证号',pattern:idCardPattern,message:'身份证号格式不正确'},{field:'姓名',pattern:namePattern,message:'姓名应为2-10个汉字'}]}),15,'首次申领免费/换领20元/补领40元','居民身份证首次申领、换领、补领。支持省内异地办理，跨省异地办理需持有居住证。公安机关核验通过后制证。',1);
    itemStmt.run('11100030001','LN-SB-0001','社会保险登记','人力资源和社会保障厅','社会保障','最小颗粒度-单位参保/个人参保/变更分别拆项',condSb,JSON.stringify({rules:[{name:'营业执照副本',required:true,format:'PDF/JPG',maxSize:'10MB'},{name:'法人身份证',required:true,format:'PDF/JPG',maxSize:'5MB'},{name:'参保人员名册',required:true,format:'PDF/XLSX',maxSize:'10MB'}]}),JSON.stringify({enabled:true,fields:['统一社会信用代码','法人姓名','参保人数'],rules:[{field:'统一社会信用代码',pattern:creditCodePattern,message:'统一社会信用代码格式不正确'}]}),5,'免费','用人单位和灵活就业人员社会保险登记。包含养老、医疗、失业、工伤、生育五险登记。支持多部门协同核验。',1);
    itemStmt.run('11100040001','LN-BD-0001','不动产权证办理','自然资源厅','不动产','最小颗粒度-首次登记/转移登记/变更登记分别拆项',condBd,JSON.stringify({rules:[{name:'不动产权属来源证明',required:true,format:'PDF/JPG',maxSize:'20MB'},{name:'宗地图和房屋平面图',required:true,format:'PDF/JPG',maxSize:'20MB'},{name:'申请人身份证明',required:true,format:'PDF/JPG',maxSize:'5MB'},{name:'契税完税凭证',required:true,format:'PDF/JPG',maxSize:'5MB'}]}),JSON.stringify({enabled:true,fields:['产权人姓名','身份证号','不动产权证号','坐落地址'],rules:[{field:'不动产权证号',pattern:propertyPattern,message:'不动产权证号格式不正确'}]}),7,'住宅80元/非住宅550元','不动产权首次登记、转移登记、变更登记。涉及税务、住建多部门并联审批。支持电子证照即时签发。',1);
    itemStmt.run('11100050001','LN-SW-0001','税务登记变更','税务局','税务服务','最小颗粒度-名称变更/地址变更/经营范围变更分别拆项',condSw,JSON.stringify({rules:[{name:'变更后的营业执照',required:true,format:'PDF/JPG',maxSize:'10MB'},{name:'税务登记证',required:true,format:'PDF/JPG',maxSize:'5MB'},{name:'变更决议文件',required:true,format:'PDF/JPG',maxSize:'10MB'}]}),JSON.stringify({enabled:true,fields:['统一社会信用代码','变更事项','变更后内容'],rules:[{field:'统一社会信用代码',pattern:creditCodePattern,message:'统一社会信用代码格式不正确'}]}),2,'免费','已登记纳税人税务登记信息变更。与市场监管部门数据共享，变更信息自动同步。支持一网通办。',1);
    console.log('示例服务事项已创建（含条件判定树、材料规则、OCR规则）');
  }

  const matCount = db.prepare('SELECT COUNT(*) as count FROM materials').get() as any;
  if (matCount.count === 0) {
    const matStmt = db.prepare(`
      INSERT INTO materials (item_id, name, format_requirements, required, ocr_enabled, ocr_fields)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    matStmt.run(1, '公司章程', 'PDF格式，A4页面，加盖公章', 1, 1, JSON.stringify(['公司名称', '注册地址', '法定代表人', '注册资本']));
    matStmt.run(1, '股东身份证明', 'PDF或JPG格式，身份证正反面', 1, 1, JSON.stringify(['姓名', '身份证号', '有效期']));
    matStmt.run(1, '住所证明', 'PDF或JPG格式，房产证或租赁合同', 1, 1, JSON.stringify(['产权人', '地址', '面积']));
    matStmt.run(1, '法定代表人任职文件', 'PDF格式，股东会决议或董事会决议', 1, 0, 'NULL');
    matStmt.run(1, '电子营业执照(法人用户)', '系统自动调用电子证照库，无需上传', 0, 0, 'NULL');

    matStmt.run(2, '户口簿', 'PDF或JPG格式，首页及本人页', 1, 1, JSON.stringify(['姓名', '身份证号', '户籍地址']));
    matStmt.run(2, '旧居民身份证(换领)', 'PDF或JPG格式，原身份证正反面', 0, 1, JSON.stringify(['姓名', '身份证号', '有效期']));
    matStmt.run(2, '居住证(异地办理)', 'PDF或JPG格式，有效期内', 0, 1, JSON.stringify(['姓名', '居住证号', '有效期']));

    matStmt.run(3, '营业执照副本', 'PDF或JPG格式，加盖公章', 1, 1, JSON.stringify(['统一社会信用代码', '企业名称', '法定代表人']));
    matStmt.run(3, '法人身份证', 'PDF或JPG格式，正反面', 1, 1, JSON.stringify(['姓名', '身份证号']));
    matStmt.run(3, '参保人员名册', 'PDF或Excel格式，含姓名、身份证号、参保类型', 1, 0, 'NULL');

    matStmt.run(4, '不动产权属来源证明', 'PDF或JPG格式，买卖合同/出让合同/公证书', 1, 1, JSON.stringify(['出卖方', '买受方', '标的地址', '成交金额']));
    matStmt.run(4, '宗地图和房屋平面图', 'PDF或JPG格式，测绘机构出具', 1, 0, 'NULL');
    matStmt.run(4, '申请人身份证明', 'PDF或JPG格式，身份证正反面', 1, 1, JSON.stringify(['姓名', '身份证号']));
    matStmt.run(4, '契税完税凭证', 'PDF或JPG格式，税务部门出具', 1, 1, JSON.stringify(['纳税人', '税额', '凭证号']));

    matStmt.run(5, '变更后的营业执照', 'PDF或JPG格式，加盖公章', 1, 1, JSON.stringify(['统一社会信用代码', '企业名称', '变更事项']));
    matStmt.run(5, '税务登记证', 'PDF或JPG格式，原件扫描', 1, 1, JSON.stringify(['纳税人识别号', '企业名称']));
    matStmt.run(5, '变更决议文件', 'PDF格式，股东会决议/董事会决议', 1, 0, 'NULL');
    console.log('事项材料已创建（含OCR识别字段）');
  }

  const certCount = db.prepare('SELECT COUNT(*) as count FROM electronic_certificates').get() as any;
  if (certCount.count === 0) {
    const certStmt = db.prepare(`
      INSERT INTO electronic_certificates (user_id, cert_type, cert_number, cert_name, issuer, issuer_signature, issue_date, expire_date, status, share_chain, verify_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    certStmt.run(2, '身份证', '210102199001011234', '居民身份证', '沈阳市公安局', 'RSA-SHA256-SIG-001', '2024-06-15', '2044-06-15', 1, JSON.stringify([{dept: '公安局', auth: 'read', time: '2026-01-15'}, {dept: '社保局', auth: 'read', time: '2026-02-20'}]), 5);
    certStmt.run(2, '社保卡', 'SB2101021990010112', '社会保障卡', '辽宁省人力资源和社会保障厅', 'RSA-SHA256-SIG-002', '2025-03-10', '2035-03-10', 1, JSON.stringify([{dept: '人社厅', auth: 'read', time: '2026-01-20'}, {dept: '医保局', auth: 'read', time: '2026-03-15'}]), 3);
    certStmt.run(2, '居住证', 'JZZ-210102-2026-001', '辽宁省居住证', '沈阳市公安局', 'RSA-SHA256-SIG-003', '2026-01-01', '2027-01-01', 1, '[]', 1);
    certStmt.run(3, '电子营业执照', '91210100MA0ABCDE1X', '营业执照', '辽宁省市场监督管理局', 'RSA-SHA256-SIG-004', '2025-08-20', '长期', 1, JSON.stringify([{dept: '市场监管局', auth: 'read', time: '2026-03-01'}, {dept: '税务局', auth: 'read', time: '2026-03-01'}, {dept: '社保局', auth: 'read', time: '2026-03-05'}]), 8);
    certStmt.run(3, '税务登记证', 'SW-91210100MA0ABCDE1X', '税务登记证', '辽宁省税务局', 'RSA-SHA256-SIG-005', '2025-08-20', '长期', 1, JSON.stringify([{dept: '税务局', auth: 'read', time: '2026-03-01'}]), 2);
    certStmt.run(3, '组织机构代码证', 'ORG-91210100MA0ABCDE1X', '组织机构代码证', '辽宁省市场监管局', 'RSA-SHA256-SIG-006', '2025-08-20', '长期', 1, '[]', 1);
    console.log('电子证照已创建（含签名和共享授权链）');
  }

  const appCount = db.prepare('SELECT COUNT(*) as count FROM applications').get() as any;
  if (appCount.count === 0) {
    const appStmt = db.prepare(`
      INSERT INTO applications (application_no, user_id, item_id, item_name, status, current_node, parallel_nodes, supplement_deadline, reminder_sent, submit_time, accept_time, complete_time, processing_days)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    appStmt.run('LST20260501001', 2, 2, '居民身份证办理', 'completed', '办结', 'NULL', 'NULL', 0, '2026-04-01 09:15:00', '2026-04-01 10:30:00', '2026-04-10 16:00:00', 7);
    appStmt.run('LST20260502001', 2, 3, '社会保险登记', 'processing', '部门审批', JSON.stringify([{node: '社保审核', dept: '人社厅'}, {node: '税务核验', dept: '税务局'}]), 'NULL', 0, '2026-05-02 14:20:00', '2026-05-03 09:00:00', 'NULL', 'NULL');
    appStmt.run('LST20260503001', 2, 4, '不动产权证办理', 'pending', '材料预审', 'NULL', '2026-05-20 23:59:59', 0, '2026-05-15 10:00:00', 'NULL', 'NULL', 'NULL');
    appStmt.run('LST20260504001', 3, 1, '企业营业执照办理', 'completed', '办结', 'NULL', 'NULL', 0, '2026-03-01 11:00:00', '2026-03-01 14:00:00', '2026-03-03 16:30:00', 2);
    appStmt.run('LST20260505001', 3, 5, '税务登记变更', 'processing', '部门审批', 'NULL', 'NULL', 1, '2026-05-10 09:30:00', '2026-05-10 11:00:00', 'NULL', 'NULL');
    appStmt.run('LST20260506001', 3, 1, '企业营业执照办理(变更)', 'pending', '材料预审', JSON.stringify([{node: '市场监督审核', dept: '市场监管局'}, {node: '税务同步', dept: '税务局'}]), '2026-05-30 23:59:59', 1, '2026-05-18 15:45:00', 'NULL', 'NULL', 'NULL');

    console.log('办件记录已创建（含审批节点、补正时限、催办状态）');
  }

  const nodeCount = db.prepare('SELECT COUNT(*) as count FROM application_nodes').get() as any;
  if (nodeCount.count === 0) {
    const nodeStmt = db.prepare(`
      INSERT INTO application_nodes (application_id, node_name, node_type, department, handler, status, receive_time, process_time, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    nodeStmt.run(1, '提交申请', 'start', '系统', '张三', 'completed', '2026-04-01 09:15:00', '2026-04-01 09:15:00', '在线提交');
    nodeStmt.run(1, '材料预审', 'review', '公安局', '李警官', 'completed', '2026-04-01 09:16:00', '2026-04-01 10:30:00', '材料齐全，预审通过');
    nodeStmt.run(1, '部门审批', 'approve', '公安厅', '王主任', 'completed', '2026-04-01 10:31:00', '2026-04-08 14:00:00', '审批通过');
    nodeStmt.run(1, '证件制作', 'process', '公安局', '制证中心', 'completed', '2026-04-08 14:01:00', '2026-04-10 15:00:00', '制证完成');
    nodeStmt.run(1, '办结', 'end', '系统', '系统', 'completed', '2026-04-10 15:01:00', '2026-04-10 16:00:00', '办结归档');

    nodeStmt.run(2, '提交申请', 'start', '系统', '张三', 'completed', '2026-05-02 14:20:00', '2026-05-02 14:20:00', '在线提交');
    nodeStmt.run(2, '材料预审', 'review', '人社厅', '赵科员', 'completed', '2026-05-02 14:21:00', '2026-05-03 09:00:00', '材料齐全');
    nodeStmt.run(2, '社保审核(并联)', 'parallel', '人社厅', '刘科长', 'processing', '2026-05-03 09:01:00', 'NULL', '审核中');
    nodeStmt.run(2, '税务核验(并联)', 'parallel', '税务局', '陈专员', 'processing', '2026-05-03 09:01:00', 'NULL', '核验中');
    nodeStmt.run(2, '部门审批', 'approve', '人社厅', '周处长', 'pending', 'NULL', 'NULL', 'NULL');

    nodeStmt.run(3, '提交申请', 'start', '系统', '张三', 'completed', '2026-05-15 10:00:00', '2026-05-15 10:00:00', '在线提交');
    nodeStmt.run(3, '材料预审', 'review', '自然资源厅', '孙科员', 'pending', '2026-05-15 10:01:00', 'NULL', '待预审（补正时限: 5月20日）');

    nodeStmt.run(4, '提交申请', 'start', '系统', '辽宁创新科技', 'completed', '2026-03-01 11:00:00', '2026-03-01 11:00:00', '法人在线提交');
    nodeStmt.run(4, '材料预审', 'review', '市场监管局', '吴科员', 'completed', '2026-03-01 11:01:00', '2026-03-01 14:00:00', '材料齐全，电子营业执照已自动调用');
    nodeStmt.run(4, '部门审批', 'approve', '市场监管局', '郑科长', 'completed', '2026-03-01 14:01:00', '2026-03-02 16:00:00', '审批通过');
    nodeStmt.run(4, '证照签发', 'sign', '市场监管局', '电子证照系统', 'completed', '2026-03-02 16:01:00', '2026-03-03 16:00:00', '电子营业执照已签发');
    nodeStmt.run(4, '办结', 'end', '系统', '系统', 'completed', '2026-03-03 16:01:00', '2026-03-03 16:30:00', '办结归档');

    nodeStmt.run(5, '提交申请', 'start', '系统', '辽宁创新科技', 'completed', '2026-05-10 09:30:00', '2026-05-10 09:30:00', '法人在线提交');
    nodeStmt.run(5, '材料预审', 'review', '税务局', '钱科员', 'completed', '2026-05-10 09:31:00', '2026-05-10 11:00:00', '材料齐全');
    nodeStmt.run(5, '部门审批', 'approve', '税务局', '冯科长', 'processing', '2026-05-10 11:01:00', 'NULL', '审批中');

    nodeStmt.run(6, '提交申请', 'start', '系统', '辽宁创新科技', 'completed', '2026-05-18 15:45:00', '2026-05-18 15:45:00', '法人在线提交');
    nodeStmt.run(6, '材料预审', 'review', '市场监管局', '吴科员', 'pending', '2026-05-18 15:46:00', 'NULL', '待预审（补正时限: 5月30日）');

    console.log('审批节点已创建（含并联审批、补正时限）');
  }

  const appMatCount = db.prepare('SELECT COUNT(*) as count FROM application_materials').get() as any;
  if (appMatCount.count === 0) {
    const appMatStmt = db.prepare(`
      INSERT INTO application_materials (application_id, material_name, file_url, file_hash, ocr_result, review_status, review_comment)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    appMatStmt.run(1, '户口簿', '/uploads/zhangsan_hukou.pdf', 'sha256-abc123', JSON.stringify({姓名: '张三', 身份证号: '210102199001011234', 户籍地址: '沈阳市和平区'}), 'passed', 'OCR识别通过');
    appMatStmt.run(2, '营业执照副本', '/uploads/zhangsan_biz.pdf', 'sha256-def456', JSON.stringify({统一社会信用代码: '91210100MA0ABCDE1X', 企业名称: '辽宁创新科技有限公司'}), 'passed', 'OCR识别通过');
    appMatStmt.run(2, '法人身份证', '/uploads/zhangsan_id.pdf', 'sha256-ghi789', JSON.stringify({姓名: '张三', 身份证号: '210102199001011234'}), 'passed', 'OCR识别通过');
    appMatStmt.run(3, '不动产权属来源证明', '/uploads/zhangsan_house.pdf', 'sha256-jkl012', JSON.stringify({出卖方: '沈阳某某房产', 买受方: '张三', 标的地址: '沈阳市沈河区'}), 'pending', '待审核');
    appMatStmt.run(3, '宗地图和房屋平面图', '/uploads/zhangsan_map.pdf', 'sha256-mno345', 'NULL', 'pending', '待审核');
    appMatStmt.run(4, '公司章程', '/uploads/company1章程.pdf', 'sha256-pqr678', JSON.stringify({公司名称: '辽宁创新科技有限公司', 注册地址: '沈阳市浑南区'}), 'passed', 'OCR识别通过');
    appMatStmt.run(4, '股东身份证明', '/uploads/company1_gd.pdf', 'sha256-stu901', JSON.stringify({姓名: '李四', 身份证号: '210102198805052345'}), 'passed', 'OCR识别通过');
    appMatStmt.run(4, '电子营业执照(自动调用)', '/api/certificates/4', 'auto-retrieved', JSON.stringify({统一社会信用代码: '91210100MA0ABCDE1X'}), 'passed', '电子证照库自动调用');
    console.log('办件材料已创建（含OCR识别结果）');
  }

  const sealCount = db.prepare('SELECT COUNT(*) as count FROM electronic_seals').get() as any;
  if (sealCount.count === 0) {
    const sealStmt = db.prepare(`
      INSERT INTO electronic_seals (user_id, seal_name, seal_type, seal_data, certificate, private_key, gb_standard, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    sealStmt.run(3, '辽宁创新科技有限公司-公章', '单位公章', 'SEAL-DATA-COMPANY1-001', 'CERT-RSA2048-COMPANY1-001', 'PK-RSA2048-COMPANY1-001', 'GB/T 33481-2016', 1);
    sealStmt.run(3, '辽宁创新科技有限公司-财务专用章', '财务专用章', 'SEAL-DATA-COMPANY1-002', 'CERT-RSA2048-COMPANY1-002', 'PK-RSA2048-COMPANY1-002', 'GB/T 33481-2016', 1);
    console.log('电子印章已创建（符合GB/T 33481-2016标准）');
  }

  const pkgCount = db.prepare('SELECT COUNT(*) as count FROM service_packages').get() as any;
  if (pkgCount.count === 0) {
    const pkgStmt = db.prepare(`
      INSERT INTO service_packages (name, description, target_industry, item_ids, benefits, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    pkgStmt.run('企业开办服务包', '一站式企业开办全流程服务，涵盖营业执照、社保登记、税务登记并联审批', '全行业', '[1,3,5]', '并联审批,优先处理,专人对接,材料共享', 1);
    pkgStmt.run('不动产登记服务包', '不动产登记全流程服务，与税务、住建部门协同办理', '房地产/建筑业', '[4]', '一窗受理,并联审批,电子证照即时签发', 1);
    pkgStmt.run('人才服务包', '为高层次人才提供落户、社保、住房一站式服务', '高层次人才', '[2,3]', '绿色通道,优先办理,上门服务', 1);
    console.log('企业服务包已创建');
  }
};

export default initDatabase;
