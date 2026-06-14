module.exports = function initData(db) {
  const now = new Date().toISOString();
  const dataSource = '国家企业信用信息公示系统';
  const sourceUrl = 'http://www.gsxt.gov.cn';

  const tx = db.transaction(() => {

  const insertEnterprise = db.prepare(`
    INSERT INTO enterprises (name, unified_social_credit, legal_representative,
    registered_capital, establishment_date, business_scope, address, status,
    data_source, data_updated_at, source_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const enterprises = [
    ['中建一局集团建设发展有限公司', '91110000100003962T', '张三', '100000万人民币', '1950-01-01',
     '建筑工程施工总承包、专业承包；建筑技术开发、技术咨询', '北京市朝阳区望花路西里1号楼', '正常',
     dataSource, now, sourceUrl, now, now],
    ['上海建工集团股份有限公司', '91310000132207158Q', '李四', '80000万人民币', '1998-05-05',
     '建筑工程、市政公用工程、机电安装工程施工总承包', '上海市虹口区东大名路666号', '正常',
     dataSource, now, sourceUrl, now, now],
    ['万科企业股份有限公司', '91440300192181490G', '王五', '50000万人民币', '1984-05-30',
     '房地产开发、经营、咨询；建筑工程设计、施工', '广东省深圳市盐田区大梅沙环梅路33号', '正常',
     dataSource, now, sourceUrl, now, now],
    ['华夏幸福基业股份有限公司', '91130000601260005A', '赵六', '30000万人民币', '1993-05-28',
     '园区建设、房地产开发、建筑工程施工', '河北省廊坊市大厂回族自治县', '经营异常',
     dataSource, now, sourceUrl, now, now],
    ['北京城建集团有限责任公司', '91110000101101824E', '孙七', '60000万人民币', '1993-11-08',
     '建筑工程施工总承包、市政公用工程施工总承包', '北京市海淀区北太平庄路18号', '正常',
     dataSource, now, sourceUrl, now, now],
    ['广州建筑集团有限公司', '91440101190438400R', '周八', '70000万人民币', '1980-09-01',
     '房屋建筑工程施工总承包、市政公用工程施工总承包', '广东省广州市越秀区广卫路4号', '正常',
     dataSource, now, sourceUrl, now, now],
    ['四川华西集团有限公司', '91510000201800012K', '吴九', '45000万人民币', '1997-08-01',
     '建筑工程施工总承包、机电安装工程施工总承包', '四川省成都市金牛区解放路二段95号', '正常',
     dataSource, now, sourceUrl, now, now],
    ['中天建设集团有限公司', '91330100143000183P', '郑十', '55000万人民币', '1996-11-20',
     '建筑工程施工总承包、市政公用工程施工总承包', '浙江省杭州市西湖区文一西路59号', '正常',
     dataSource, now, sourceUrl, now, now],
    ['南通二建集团有限公司', '9132060013830005X1', '冯十一', '42000万人民币', '1998-03-12',
     '建筑工程施工总承包、机电安装工程施工总承包', '江苏省南通市海门区海门镇人民中路328号', '正常',
     dataSource, now, sourceUrl, now, now],
    ['陕西建工集团有限公司', '91610000220500027D', '陈十二', '65000万人民币', '1990-06-15',
     '建筑工程施工总承包、市政公用工程施工总承包', '陕西省西安市新城区北大街199号', '正常',
     dataSource, now, sourceUrl, now, now]
  ];

  enterprises.forEach(e => insertEnterprise.run(...e));

  const insertJudicial = db.prepare(`
    INSERT INTO judicial_records (enterprise_id, case_type, case_reason, court, case_number,
    filing_date, judgment_date, judgment_result, amount, data_source, data_updated_at, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const judicialData = [
    [4, '民事案件', '建设工程施工合同纠纷', '北京市高级人民法院', '(2023)京民初123号',
     '2023-01-15', '2023-06-20', '被告支付原告工程款5800万元', 58000000,
     '中国裁判文书网', now, 'https://wenshu.court.gov.cn'],
    [1, '民事案件', '买卖合同纠纷', '上海市浦东新区人民法院', '(2023)沪0115民初456号',
     '2023-03-10', '2023-08-15', '被告支付原告货款320万元', 3200000,
     '中国裁判文书网', now, 'https://wenshu.court.gov.cn'],
    [2, '行政案件', '行政处罚', '深圳市中级人民法院', '(2023)粤03行终789号',
     '2023-05-20', '2023-09-10', '维持行政处罚决定', 1500000,
     '中国裁判文书网', now, 'https://wenshu.court.gov.cn'],
    [4, '失信被执行人', '有履行能力而拒不履行生效法律文书确定义务',
     '最高人民法院执行局', '(2022)最高法执1234号',
     '2022-11-01', null, '纳入失信被执行人名单', null,
     '中国执行信息公开网', now, 'http://zxgk.court.gov.cn'],
    [3, '民事案件', '劳务合同纠纷', '广州市中级人民法院', '(2023)粤01民初234号',
     '2023-02-28', '2023-07-25', '被告支付原告劳务费860万元', 8600000,
     '中国裁判文书网', now, 'https://wenshu.court.gov.cn']
  ];

  judicialData.forEach(j => insertJudicial.run(...j));

  const insertBidding = db.prepare(`
    INSERT INTO bidding_records (enterprise_id, project_name, bidding_amount, bidding_date,
    winning_status, tenderee, region, data_source, data_updated_at, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const biddingData = [
    [1, '北京市朝阳区CBD核心区项目', 2500000000, '2023-08-15', '中标', '北京某房地产开发有限公司',
     '北京市', '全国公共资源交易平台', now, 'http://www.ggzy.gov.cn'],
    [2, '上海市浦东新区地铁18号线工程', 1800000000, '2023-07-20', '中标', '上海申通地铁集团有限公司',
     '上海市', '全国公共资源交易平台', now, 'http://www.ggzy.gov.cn'],
    [1, '深圳市南山区科技园项目', 1200000000, '2023-09-10', '中标', '深圳某科技有限公司',
     '广东省深圳市', '全国公共资源交易平台', now, 'http://www.ggzy.gov.cn'],
    [5, '河北省雄安新区启动区基础设施项目', 3200000000, '2023-06-25', '中标', '中国雄安集团有限公司',
     '河北省雄安新区', '全国公共资源交易平台', now, 'http://www.ggzy.gov.cn'],
    [6, '广州市白云区白云新城项目', 950000000, '2023-08-05', '未中标', '广州某城市发展有限公司',
     '广东省广州市', '全国公共资源交易平台', now, 'http://www.ggzy.gov.cn'],
    [7, '成都市天府新区中央商务区项目', 1600000000, '2023-07-15', '中标', '成都天府新区投资集团有限公司',
     '四川省成都市', '全国公共资源交易平台', now, 'http://www.ggzy.gov.cn'],
    [8, '杭州市亚运会场馆建设项目', 2100000000, '2023-05-30', '中标', '杭州亚运会组委会',
     '浙江省杭州市', '全国公共资源交易平台', now, 'http://www.ggzy.gov.cn'],
    [1, '北京市通州区城市副中心项目', 2800000000, '2023-09-01', '中标', '北京城市副中心投资建设集团有限公司',
     '北京市通州区', '全国公共资源交易平台', now, 'http://www.ggzy.gov.cn'],
    [9, '南通市海门区城市更新项目', 780000000, '2023-08-20', '中标', '南通市海门区城市建设投资集团有限公司',
     '江苏省南通市', '全国公共资源交易平台', now, 'http://www.ggzy.gov.cn'],
    [10, '西安市高新区软件新城项目', 1450000000, '2023-07-10', '中标', '西安高新技术产业开发区管理委员会',
     '陕西省西安市', '全国公共资源交易平台', now, 'http://www.ggzy.gov.cn']
  ];

  biddingData.forEach(b => insertBidding.run(...b));

  const insertQualification = db.prepare(`
    INSERT INTO qualifications (enterprise_id, qualification_type, qualification_level,
    certificate_number, issuing_authority, issue_date, expiry_date, status,
    data_source, data_updated_at, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const qualificationData = [
    [1, '建筑工程施工总承包', '特级', 'D111000001', '中华人民共和国住房和城乡建设部',
     '2020-01-01', '2025-12-31', '有效', '住房和城乡建设部', now, 'http://www.mohurd.gov.cn'],
    [2, '建筑工程施工总承包', '特级', 'D131000002', '中华人民共和国住房和城乡建设部',
     '2020-03-15', '2025-12-31', '有效', '住房和城乡建设部', now, 'http://www.mohurd.gov.cn'],
    [5, '市政公用工程施工总承包', '特级', 'D111000003', '中华人民共和国住房和城乡建设部',
     '2020-05-20', '2025-12-31', '有效', '住房和城乡建设部', now, 'http://www.mohurd.gov.cn'],
    [6, '建筑工程施工总承包', '特级', 'D144000004', '中华人民共和国住房和城乡建设部',
     '2020-06-10', '2025-12-31', '有效', '住房和城乡建设部', now, 'http://www.mohurd.gov.cn'],
    [7, '建筑工程施工总承包', '特级', 'D151000005', '中华人民共和国住房和城乡建设部',
     '2020-08-01', '2025-12-31', '有效', '住房和城乡建设部', now, 'http://www.mohurd.gov.cn'],
    [8, '建筑工程施工总承包', '特级', 'D133000006', '中华人民共和国住房和城乡建设部',
     '2020-09-15', '2025-12-31', '有效', '住房和城乡建设部', now, 'http://www.mohurd.gov.cn'],
    [1, '市政公用工程施工总承包', '一级', 'D211000007', '北京市住房和城乡建设委员会',
     '2021-01-01', '2026-12-31', '有效', '住房和城乡建设部', now, 'http://www.mohurd.gov.cn'],
    [2, '市政公用工程施工总承包', '一级', 'D231000008', '上海市住房和城乡建设管理委员会',
     '2021-03-15', '2026-12-31', '有效', '住房和城乡建设部', now, 'http://www.mohurd.gov.cn'],
    [9, '建筑工程施工总承包', '一级', 'D132000009', '中华人民共和国住房和城乡建设部',
     '2021-05-01', '2026-12-31', '有效', '住房和城乡建设部', now, 'http://www.mohurd.gov.cn'],
    [10, '建筑工程施工总承包', '一级', 'D161000010', '中华人民共和国住房和城乡建设部',
     '2021-06-20', '2026-12-31', '有效', '住房和城乡建设部', now, 'http://www.mohurd.gov.cn']
  ];

  qualificationData.forEach(q => insertQualification.run(...q));

  const insertPersonnel = db.prepare(`
    INSERT INTO personnel (enterprise_id, name, position, id_card, qualification_certificates,
    registration_number, data_source, data_updated_at, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const personnelData = [
    [1, '张工程师', '一级注册建造师', '110101198001011234', '建筑工程一级建造师、高级工程师',
     '建字第001号', '全国建筑市场监管公共服务平台', now, 'http://jzsc.mohurd.gov.cn'],
    [1, '李工程师', '一级注册建造师', '110102198202022345', '市政公用工程一级建造师',
     '建字第002号', '全国建筑市场监管公共服务平台', now, 'http://jzsc.mohurd.gov.cn'],
    [2, '王工程师', '一级注册建造师', '310101197803033456', '建筑工程一级建造师、结构工程师',
     '建字第003号', '全国建筑市场监管公共服务平台', now, 'http://jzsc.mohurd.gov.cn'],
    [2, '赵工程师', '总工程师', '310102198504044567', '高级工程师、注册监理工程师',
     '建字第004号', '全国建筑市场监管公共服务平台', now, 'http://jzsc.mohurd.gov.cn'],
    [5, '孙工程师', '一级注册建造师', '110105198005055678', '建筑工程一级建造师',
     '建字第005号', '全国建筑市场监管公共服务平台', now, 'http://jzsc.mohurd.gov.cn'],
    [6, '周工程师', '一级注册建造师', '440101198106066789', '市政公用工程一级建造师',
     '建字第006号', '全国建筑市场监管公共服务平台', now, 'http://jzsc.mohurd.gov.cn'],
    [7, '吴工程师', '一级注册建造师', '510101198207077890', '建筑工程一级建造师、机电工程一级建造师',
     '建字第007号', '全国建筑市场监管公共服务平台', now, 'http://jzsc.mohurd.gov.cn'],
    [8, '郑工程师', '注册造价工程师', '330101198308088901', '注册造价工程师、高级经济师',
     '建字第008号', '全国建筑市场监管公共服务平台', now, 'http://jzsc.mohurd.gov.cn'],
    [9, '冯工程师', '一级注册建造师', '320601198409099012', '建筑工程一级建造师',
     '建字第009号', '全国建筑市场监管公共服务平台', now, 'http://jzsc.mohurd.gov.cn'],
    [10, '陈工程师', '一级注册建造师', '610101198510100123', '建筑工程一级建造师、注册安全工程师',
     '建字第010号', '全国建筑市场监管公共服务平台', now, 'http://jzsc.mohurd.gov.cn']
  ];

  personnelData.forEach(p => insertPersonnel.run(...p));

  const insertCredit = db.prepare(`
    INSERT INTO credit_records (enterprise_id, credit_type, credit_level, description,
    effective_date, expiry_date, display_deadline, status, repair_status,
    data_source, data_updated_at, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const creditData = [
    [4, '失信被执行人', '严重失信', '有履行能力而拒不履行生效法律文书确定义务',
     '2022-11-01', '2025-11-01', '2025-11-01', '有效', '未修复',
     '信用中国', now, 'https://www.creditchina.gov.cn'],
    [1, '行政处罚', '一般失信', '未按规定报送年度报告',
     '2023-01-10', '2024-01-10', '2026-01-10', '已失效', '已修复',
     '国家企业信用信息公示系统', now, 'http://www.gsxt.gov.cn'],
    [2, '良好信用', 'AAA级', '连续三年被评为重合同守信用企业',
     '2023-03-15', '2026-03-15', '2026-03-15', '有效', '未修复',
     '信用中国', now, 'https://www.creditchina.gov.cn'],
    [3, '良好信用', 'AA级', '纳税信用A级纳税人',
     '2023-04-20', '2024-04-20', '2025-04-20', '有效', '未修复',
     '国家税务总局', now, 'http://www.chinatax.gov.cn'],
    [5, '良好信用', 'AAA级', '被评为全国优秀施工企业',
     '2023-05-01', '2026-05-01', '2026-05-01', '有效', '未修复',
     '中国建筑业协会', now, 'http://www.zgjzy.org.cn'],
    [6, '行政处罚', '一般失信', '施工现场存在安全隐患被责令整改',
     '2023-06-10', '2024-06-10', '2026-06-10', '有效', '修复中',
     '住房和城乡建设部', now, 'http://www.mohurd.gov.cn']
  ];

  creditData.forEach(c => insertCredit.run(...c));

  const insertAbnormal = db.prepare(`
    INSERT INTO business_abnormalities (enterprise_id, abnormal_type, abnormal_reason,
    decision_authority, decision_date, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const abnormalData = [
    [4, '经营异常名录', '未按规定公示年度报告', '北京市市场监督管理局', '2023-07-10', '未移除'],
    [4, '经营异常名录', '未按规定公示即时信息', '北京市市场监督管理局', '2023-08-15', '未移除'],
    [1, '经营异常名录', '公示信息隐瞒真实情况、弄虚作假', '深圳市市场监督管理局', '2023-02-20', '已移除']
  ];

  abnormalData.forEach(a => insertAbnormal.run(...a));

  const insertRigging = db.prepare(`
    INSERT INTO bid_rigging_suspects (enterprise_id, project_name, bidding_date,
    suspicion_reason, risk_level, related_enterprises, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const riggingData = [
    [4, '河北省某高速公路项目', '2023-04-10',
     '与另外两家投标企业报价差异率不足1%，存在围标嫌疑', '高风险',
     '河北甲公司,河北乙公司', '待核实'],
    [6, '广州市某市政工程项目', '2023-07-20',
     '多家投标企业的投标文件编制机器码相同，存在串标嫌疑', '中风险',
     '广州丙公司,广州丁公司', '核实中']
  ];

  riggingData.forEach(r => insertRigging.run(...r));

  const insertBlacklist = db.prepare(`
    INSERT INTO subcontractor_blacklist (enterprise_id, reason, inclusion_date,
    risk_level, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  const blacklistData = [
    [4, '拖欠农民工工资，造成恶劣社会影响', '2023-09-01', '高风险', '黑名单中']
  ];

  blacklistData.forEach(b => insertBlacklist.run(...b));

  const insertRules = db.prepare(`
    INSERT INTO risk_rules (user_id, rule_name, rule_condition, rule_action,
    rule_level, is_enabled)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const rulesData = [
    [1, '近半年诉讼超3起自动降级', '{"type":"judicial","count":3,"period":180}',
     '{"action":"downgrade","level":"red"}', 'high', 1],
    [1, '失信被执行人自动拉黑', '{"type":"credit","typeValue":"失信被执行人"}',
     '{"action":"blacklist","level":"black"}', 'high', 1],
    [1, '围标串标自动预警', '{"type":"bidRigging","riskLevel":"高风险"}',
     '{"action":"warn","level":"orange"}', 'high', 1],
    [1, '资质过期自动提醒', '{"type":"qualification","expiryDays":30}',
     '{"action":"remind","level":"yellow"}', 'medium', 1],
    [1, '经营异常标记', '{"type":"abnormal","status":"未移除"}',
     '{"action":"mark","level":"red"}', 'high', 1]
  ];

  rulesData.forEach(r => insertRules.run(...r));

  const insertUser = db.prepare(`
    INSERT INTO users (username, password, role, company)
    VALUES (?, ?, ?, ?)
  `);

  insertUser.run('admin', 'admin123', 'admin', '系统管理员');
  insertUser.run('user1', 'user123', 'user', '某建筑施工企业');

  const insertHealthScore = db.prepare(`
    INSERT INTO health_scores (enterprise_id, total_score, business_score, judicial_score,
    bidding_score, qualification_score, personnel_score, credit_score, risk_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const healthScores = [
    [1, 85, 20, 20, 15, 15, 10, 5, '中风险'],
    [2, 92, 25, 23, 15, 15, 10, 4, '低风险'],
    [3, 88, 25, 22, 14, 15, 8, 4, '低风险'],
    [4, 35, 10, 5, 8, 6, 5, 1, '高风险'],
    [5, 95, 25, 25, 15, 15, 10, 5, '低风险'],
    [6, 78, 25, 20, 14, 10, 6, 3, '中风险'],
    [7, 90, 25, 24, 15, 15, 10, 1, '低风险'],
    [8, 93, 25, 25, 15, 15, 8, 5, '低风险'],
    [9, 91, 25, 25, 14, 15, 10, 2, '低风险'],
    [10, 89, 25, 23, 15, 15, 10, 1, '低风险']
  ];

  healthScores.forEach(h => insertHealthScore.run(...h));

  const insertRepair = db.prepare(`
    INSERT INTO credit_repair_applications (credit_record_id, enterprise_id, applicant,
    description, proof_file, status, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const repairData = [
    [6, 6, '广州建筑集团有限公司', '已完成安全隐患整改，申请信用修复',
     '/uploads/proof_1.pdf', 'pending', now],
    [2, 1, '中建一局集团建设发展有限公司', '已补报年度报告，申请移除经营异常',
     '/uploads/proof_2.pdf', 'approved', now]
  ];

  repairData.forEach(r => insertRepair.run(...r));

  console.log('Database initialized with sample data.');
  });

  try {
    tx();
    console.log('Transaction committed successfully.');
  } catch (e) {
    console.error('Transaction failed:', e.message);
    throw e;
  }
};
