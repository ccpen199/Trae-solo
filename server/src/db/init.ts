import { initDatabase, getDb } from './index';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const hash = () => 'SHA256:' + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
const pad = (n: number, len = 2) => String(n).padStart(len, '0');

const genDate = (offsetDays: number, offsetH?: number, offsetM?: number) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  if (offsetH) d.setHours(d.getHours() + offsetH);
  if (offsetM) d.setMinutes(d.getMinutes() + offsetM);
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

type SeedOptions = {
  force?: boolean;
};

const getTableCount = (db: ReturnType<typeof getDb>, table: string) =>
  (db.prepare(`SELECT COUNT(*) AS cnt FROM ${table}`).get() as any).cnt as number;

export const seedDatabase = ({ force = false }: SeedOptions = {}) => {
  initDatabase();
  const db = getDb();

  const existing = {
    users: getTableCount(db, 'users'),
    templates: getTableCount(db, 'form_templates'),
    applies: getTableCount(db, 'apply_records'),
    approvals: getTableCount(db, 'approval_nodes')
  };

  if (!force && existing.users > 0 && existing.templates > 0 && existing.applies > 0 && existing.approvals > 0) {
    console.log('[Seed] Existing demo data detected, skip seeding.');
    return false;
  }

  if (!force) {
    console.log('[Seed] Demo data missing, rebuilding sample dataset.');
  }

  // ========== 清空所有表，重建数据 ==========
  const tables = ['archives', 'sign_logs', 'approval_nodes', 'sign_documents', 'todos', 'operation_logs',
    'electronic_licenses', 'notices', 'apply_records', 'form_templates', 'ca_certificates', 'users'];
  tables.forEach(t => db.exec(`DELETE FROM ${t}`));
  console.log('[Init] All tables truncated.');

  // ========== 1. 用户 ==========
  const pwd = bcrypt.hashSync('123456', 10);
  const insertUser = db.prepare(`INSERT INTO users (
    id,name,id_card_no,phone,user_type,enterprise_name,unified_social_credit_code,
    auth_level,is_verified,role,password_hash,created_at,updated_at
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))`);
  const U = {
    zhangsan: uuidv4(), lisi: uuidv4(), wangwu: uuidv4(), zhaoliu: uuidv4(), sunqi: uuidv4(), zhouba: uuidv4(),
    reviewer1: uuidv4(), reviewer2: uuidv4(), reviewer3: uuidv4(), reviewer4: uuidv4(), admin: uuidv4(),
  };
  const users = [
    [U.zhangsan, '张三', '3201**********1234', '138****5678', 'individual', null, null, 'L3', 1, 'user', pwd],
    [U.lisi, '李四', '3201**********5678', '139****8765', 'enterprise', '盛景科技发展有限公司', '91320100MA1AB2CD34', 'L3', 1, 'user', pwd],
    [U.wangwu, '王五', '3201**********9012', '136****2345', 'individual', null, null, 'L2', 1, 'user', pwd],
    [U.zhaoliu, '赵六', '3201**********3456', '135****6789', 'enterprise', '绿源餐饮管理有限公司', '91320100MA2EF3GH45', 'L3', 1, 'user', pwd],
    [U.sunqi, '孙七', '3201**********7890', '134****0123', 'individual', null, null, 'L1', 0, 'user', pwd],
    [U.zhouba, '周八', '3201**********2345', '133****4567', 'enterprise', '华瑞商贸股份有限公司', '91320100MA3IJ4KL56', 'L3', 1, 'user', pwd],
    [U.reviewer1, '王审核', '3201**********9991', '137****1111', 'individual', null, null, 'L3', 1, 'reviewer', pwd],
    [U.reviewer2, '赵复审', '3201**********9992', '137****2222', 'individual', null, null, 'L3', 1, 'reviewer', pwd],
    [U.reviewer3, '孙受理', '3201**********9993', '137****3333', 'individual', null, null, 'L3', 1, 'reviewer', pwd],
    [U.reviewer4, '李核准', '3201**********9994', '137****4444', 'individual', null, null, 'L3', 1, 'reviewer', pwd],
    [U.admin, '管理员', '3201**********0000', '137****0000', 'individual', null, null, 'L3', 1, 'admin', pwd],
  ];
  users.forEach(u => insertUser.run(...u));
  console.log(`[Seed] ${users.length} users created.`);

  // ========== 2. CA证书 ==========
  const insertCert = db.prepare(`INSERT INTO ca_certificates (id,user_id,cert_sn,cert_type,issuer,subject,valid_from,valid_to,status,public_key) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  Object.entries({ [U.zhangsan]: 'SN2024010100001', [U.lisi]: 'SN2024010100002', [U.zhaoliu]: 'SN2024010100003', [U.zhouba]: 'SN2024010100004' }).forEach(([uid, sn]) => {
    const u = users.find(x => x[0] === uid)!;
    insertCert.run(uuidv4(), uid, sn, 'SM2', '省级电子认证服务中心（SM2-RSA双根）', `CN=${u[1]},O=${u[5] || '个人用户'},C=CN`, '2024-01-01 00:00:00', '2026-12-31 23:59:59', 'active', `MFkwEwYHKoZIzj0CAQYIKoEcz1UBgi0DQgAE${uuidv4().replace(/-/g, '')}`);
  });
  console.log('[Seed] 4 CA certificates created.');

  // ========== 3. 登记事项模板 ==========
  const insertTpl = db.prepare(`INSERT INTO form_templates VALUES (?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))`);
  const tpls: any[] = [
    ['T01', 'DJ-IND-001', '个体工商户设立登记', '市场主体登记', '个体工商户设立注册登记服务，含名称申报+设立合并办理', 3,
      ['居民身份证', '经营场所证明（房产证/租赁协议）', '经营范围确认书', '申请人照片'],
      [
        { key: 'name', label: '字号名称', type: 'input', required: true, description: '由行政区划+字号+行业+组织形式构成' },
        { key: 'businessScope', label: '经营范围', type: 'textarea', required: true },
        { key: 'address', label: '经营地址', type: 'input', required: true },
        { key: 'businessType', label: '经营类型', type: 'select', required: true, options: [{ label: '批发零售', value: 'retail' }, { label: '餐饮服务', value: 'catering' }, { label: '居民服务', value: 'service' }] }
      ],
      [{ name: '材料受理', role: '受理员', level: 1 }, { name: '初审', role: '初审员', level: 2 }, { name: '复审', role: '复审员', level: 3 }, { name: '核准', role: '核准员', level: 4 }, { name: '证照发放', role: '发证员', level: 5 }],
      1, U.admin],
    ['T02', 'DJ-ENT-001', '有限责任公司设立登记', '市场主体登记', '有限公司设立注册，含名称核准+设立登记', 5,
      ['公司章程（全体股东签字）', '股东身份证明', '董事监事经理任职文件', '法定代表人信息', '住所证明'],
      [
        { key: 'companyName', label: '公司名称', type: 'input', required: true },
        { key: 'registeredCapital', label: '注册资本（万元）', type: 'number', required: true },
        { key: 'businessScope', label: '经营范围', type: 'textarea', required: true },
        { key: 'legalRep', label: '法定代表人', type: 'input', required: true },
      ],
      [{ name: '名称核准', role: '核准员', level: 1 }, { name: '受理', role: '受理员', level: 2 }, { name: '初审', role: '初审员', level: 3 }, { name: '复审', role: '复审员', level: 4 }, { name: '发证', role: '发证员', level: 5 }],
      1, U.admin],
    ['T03', 'XK-FOOD-001', '食品经营许可证核发', '行政许可', '食品销售/餐饮服务/单位食堂经营许可', 10,
      ['营业执照', '经营场所布局图（标注卫生设施）', '食品安全管理制度', '从业人员健康证明'],
      [
        { key: 'businessType', label: '经营类别', type: 'select', required: true, options: [{ label: '食品销售', value: 'sales' }, { label: '餐饮服务', value: 'catering' }, { label: '单位食堂', value: 'canteen' }] },
        { key: 'area', label: '经营面积(㎡)', type: 'number', required: true },
      ],
      [{ name: '材料受理', role: '受理员', level: 1 }, { name: '现场核查', role: '核查员', level: 2 }, { name: '复审', role: '复审员', level: 3 }, { name: '许可决定', role: '核准员', level: 4 }],
      0, U.admin],
    ['T04', 'BG-IND-001', '个体工商户变更登记', '变更登记', '名称/地址/经营范围/经营者变更', 3,
      ['变更申请书（经营者签字）', '营业执照正副本', '对应变更事项证明材料'],
      [
        { key: 'changeType', label: '变更类型（可多选）', type: 'checkbox', required: true, options: [{ label: '名称变更', value: 'name' }, { label: '地址变更', value: 'address' }, { label: '经营范围变更', value: 'scope' }, { label: '经营者变更', value: 'owner' }] }
      ],
      [{ name: '受理', role: '受理员', level: 1 }, { name: '初审', role: '初审员', level: 2 }, { name: '复审', role: '复审员', level: 3 }, { name: '发证', role: '发证员', level: 4 }],
      0, U.admin],
    ['T05', 'ZX-IND-001', '个体工商户注销登记', '注销登记', '个体工商户终止经营', 3,
      ['注销申请书', '营业执照正副本', '清税证明（税务出具）', '公章缴销凭证'],
      [{ key: 'cancelReason', label: '注销原因', type: 'select', required: true, options: [{ label: '自愿终止经营', value: 'voluntary' }, { label: '被吊销营业执照', value: 'revoked' }, { label: '经营者决定解散', value: 'dissolve' }] }],
      [{ name: '材料受理', role: '受理员', level: 1 }, { name: '注销审核', role: '审核员', level: 2 }, { name: '注销登记', role: '登记员', level: 3 }],
      0, U.admin],
    ['T06', 'NJ-001', '企业年度报告公示', '年度报告', '每年1月1日-6月30日企业年报', 1,
      ['企业基本信息', '股东及出资信息', '资产负债/利润表', '对外投资/担保/股权转让'],
      [{ key: 'reportYear', label: '报告年度', type: 'select', required: true, options: [{ label: '2024年度', value: '2024' }, { label: '2023年度', value: '2023' }, { label: '2022年度(补报)', value: '2022' }] }],
      [{ name: '填报提交', role: '系统', level: 1 }, { name: '公示登记', role: '公示系统', level: 2 }],
      0, U.admin],
    ['T07', 'DJ-IND-002', '个体工商户名称申报', '市场主体登记', '个体工商户名称自主申报', 1,
      ['申请人身份证明', '名称备选清单'],
      [{ key: 'proposedName1', label: '首选名称', type: 'input', required: true }],
      [{ name: '名称比对', role: '系统', level: 1 }, { name: '核准', role: '核准员', level: 2 }],
      0, U.admin],
    ['T08', 'XK-MED-001', '药品经营许可证核发', '行政许可', '药品零售经营许可（GSP合规）', 15,
      ['营业执照', '拟办企业法定代表人学历职称', '执业药师注册证', '经营场所/仓库布局图'],
      [{ key: 'drugType', label: '经营范围', type: 'select', required: true, options: [{ label: '处方药/甲类非处方药', value: 'rx' }, { label: '乙类非处方药', value: 'otc-b' }, { label: '全部', value: 'all' }] }],
      [{ name: '材料受理', role: '受理员', level: 1 }, { name: 'GSP现场检查', role: '核查员', level: 2 }, { name: '复审', role: '复审员', level: 3 }, { name: '核准发证', role: '核准员', level: 4 }],
      0, U.admin],
  ];
  tpls.forEach(t => insertTpl.run(
    t[0], t[1], t[2], t[3], t[4], t[5],
    JSON.stringify(t[6]),
    JSON.stringify(t[7]),
    JSON.stringify(t[8]),
    t[9], t[10]
  ));
  console.log(`[Seed] ${tpls.length} form templates created.`);

  // ========== 4. 模拟申请记录（完整业务闭环）==========
  const applicantIds = [U.zhangsan, U.lisi, U.wangwu, U.zhaoliu, U.sunqi, U.zhouba];
  const applicantInfo: Record<string, any> = {};
  users.forEach(u => { applicantInfo[u[0] as string] = { name: u[1], enterprise: u[5], phone: u[3] }; });
  const reviewers = [U.reviewer1, U.reviewer2, U.reviewer3, U.reviewer4, U.admin];
  const reviewerNames: Record<string, string> = {};
  users.forEach(u => { reviewerNames[u[0] as string] = u[1] as string; });

  const applyCaseDefs = [
    // 【案例1】张三：个体设立 → 已通过+已归档
    { uid: U.zhangsan, tplIdx: 0, age: 10, status: 'approved', curStep: 5, totalSteps: 5, reject: null, signStatus: 'completed' },
    // 【案例2】李四：公司设立 → 审核中（复审）
    { uid: U.lisi, tplIdx: 1, age: 4, status: 'reviewing', curStep: 3, totalSteps: 5, reject: null, signStatus: 'completed' },
    // 【案例3】王五：食品许可 → 材料受理环节待签署
    { uid: U.wangwu, tplIdx: 2, age: 1, status: 'submitted', curStep: 1, totalSteps: 4, reject: null, signStatus: 'pending' },
    // 【案例4】赵六：变更登记 → 已驳回（结构化驳回）
    { uid: U.zhaoliu, tplIdx: 3, age: 6, status: 'rejected', curStep: 2, totalSteps: 4, reject: { category: '材料不全', reasons: [{ field: '营业执照', message: '营业执照副本扫描件不清晰，疑似有涂改', suggestion: '请重新扫描原件或到登记窗口核验' }, { field: '变更申请书', message: '申请书经营者签字位置错误（应在第3页而非第2页）', suggestion: '重新打印申请书并在指定位置签字' }, { field: '产权证明', message: '经营场所产权证未附共有人同意书', suggestion: '如房屋为共有，请补充共有人签字的同意经营文书' }], remark: '共3项问题需要修正，建议先到窗口咨询后再提交，材料齐全后1个工作日内即可出证。', operator: '王审核' }, signStatus: 'completed' },
    // 【案例5】孙七：年度报告 → 刚提交，待签名
    { uid: U.sunqi, tplIdx: 5, age: 0, status: 'draft', curStep: 1, totalSteps: 2, reject: null, signStatus: 'pending' },
    // 【案例6】周八：公司设立 → 已通过
    { uid: U.zhouba, tplIdx: 1, age: 15, status: 'completed', curStep: 5, totalSteps: 5, reject: null, signStatus: 'completed' },
    // 【案例7】张三：食品许可 → 审核中（现场核查）
    { uid: U.zhangsan, tplIdx: 2, age: 7, status: 'reviewing', curStep: 2, totalSteps: 4, reject: null, signStatus: 'completed' },
    // 【案例8】王五：注销登记 → 审核中
    { uid: U.wangwu, tplIdx: 4, age: 2, status: 'reviewing', curStep: 1, totalSteps: 3, reject: null, signStatus: 'signing' },
    // 【案例9】周八：药品经营许可 → 驳回（现场核查不通过）
    { uid: U.zhouba, tplIdx: 7, age: 20, status: 'rejected', curStep: 2, totalSteps: 4, reject: { category: '现场核查不通过', reasons: [{ field: '执业药师驻店', message: '现场检查当日执业药师不在岗，且无法提供考勤记录', suggestion: '确保持续在岗，完善考勤制度并拍照留证' }, { field: '冷藏设施', message: '冷链药品专用冷藏设备未通过温湿度校准', suggestion: '联系计量部门校准并取得校准证书' }, { field: '药品追溯体系', message: '药品电子追溯系统未完成与省级平台对接', suggestion: '先完成系统对接测试并出具对接报告' }], remark: '依据《药品经营质量管理规范》第128条、第149条，本次不予许可。完成整改后可重新申请。', operator: '赵复审' }, signStatus: 'completed' },
    // 【案例10】李四：年度报告 → 已公示
    { uid: U.lisi, tplIdx: 5, age: 8, status: 'approved', curStep: 2, totalSteps: 2, reject: null, signStatus: 'completed' },
    // 【案例11】赵六：注销登记 → 已归档
    { uid: U.zhaoliu, tplIdx: 4, age: 18, status: 'completed', curStep: 3, totalSteps: 3, reject: null, signStatus: 'completed' },
    // 【案例12】孙七：名称申报 → 待受理
    { uid: U.sunqi, tplIdx: 6, age: 0, status: 'submitted', curStep: 1, totalSteps: 2, reject: null, signStatus: 'pending' },
    // 【案例13-18】批量历史申请（用于统计图表）
    { uid: U.zhangsan, tplIdx: 0, age: 30, status: 'approved', curStep: 5, totalSteps: 5, reject: null, signStatus: 'completed' },
    { uid: U.lisi, tplIdx: 0, age: 25, status: 'approved', curStep: 5, totalSteps: 5, reject: null, signStatus: 'completed' },
    { uid: U.wangwu, tplIdx: 0, age: 22, status: 'rejected', curStep: 2, totalSteps: 5, reject: { category: '名称重名', reasons: [{ field: '字号名称', message: '申报字号与已登记的"阳光小吃店"近似，构成混淆', suggestion: '建议替换字号或添加地域/行业限定词' }], remark: '名称核准未通过，请修改后重新申报。', operator: '孙受理' }, signStatus: 'completed' },
    { uid: U.zhaoliu, tplIdx: 0, age: 19, status: 'approved', curStep: 5, totalSteps: 5, reject: null, signStatus: 'completed' },
    { uid: U.zhouba, tplIdx: 2, age: 12, status: 'approved', curStep: 4, totalSteps: 4, reject: null, signStatus: 'completed' },
    { uid: U.sunqi, tplIdx: 0, age: 9, status: 'reviewing', curStep: 2, totalSteps: 5, reject: null, signStatus: 'completed' },
  ];

  const insertApply = db.prepare(`INSERT INTO apply_records (
    id,item_id,item_name,item_code,applicant_id,applicant_name,enterprise_name,
    form_data,materials,status,current_step,total_steps,reject_reason,created_at,updated_at
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const insertNode = db.prepare(`INSERT INTO approval_nodes (id,apply_id,node_name,node_role,node_level,assignee_id,assignee_name,status,comment,operated_at,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now'))`);
  const insertSignDoc = db.prepare(`INSERT INTO sign_documents (id,apply_id,apply_name,title,document_type,pages,sign_positions,require_signer_count,status,deadline,signer_name,signed_at,tsa_hash,tsa_serial,signature_data,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))`);
  const insertSignLog = db.prepare(`INSERT INTO sign_logs (id,document_id,user_id,user_name,action,action_timestamp,device_info,ip,location,biometric_type,biometric_verified,biometric_score,tsa_timestamp,tsa_hash,tsa_serial,signature_data,signature_type) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const insertTodo = db.prepare(`INSERT INTO todos (id,user_id,type,title,description,related_id,priority,is_read,deadline,created_at) VALUES (?,?,?,?,?,?,?,?,?,datetime('now'))`);
  const insertOpLog = db.prepare(`INSERT INTO operation_logs (id,user_id,module,action,target_id,detail,ip,user_agent,created_at) VALUES (?,?,?,?,?,?,?,?,datetime('now'))`);
  const insertArchive = db.prepare(`INSERT INTO archives
    (id, apply_id, archive_no, archive_name, archive_type, file_size, items_count, items_json, evidence_hash, sync_status, oss_key, file_path, archived_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);

  const statusMap: any = {
    pending: 0, processing: 1, approved: 2, rejected: 3,
  };

  applyCaseDefs.forEach((c, caseIdx) => {
    const applyId = 'APP' + (202405000 + caseIdx + 1);
    const tpl = tpls[c.tplIdx];
    const process = tpl[8] as any[];
    const applicant = applicantInfo[c.uid];
    const applyCreatedAt = genDate(c.age);
    const applyUpdatedAt = c.status === 'submitted' || c.status === 'draft' ? applyCreatedAt : genDate(c.age - c.curStep, c.curStep * 2);

    // 插入 apply_records
    const formDataMap: any = {
      0: { name: `${applicant.name}${['小吃店','便利店','服装店','水果店','日杂店'][rand(0, 4)]}`, businessType: ['retail', 'catering', 'service'][rand(0, 2)], address: `XX市XX区XX街道${rand(1, 999)}号`, businessScope: '餐饮服务；预包装食品（不含冷藏冷冻）销售；日用品零售' },
      1: { companyName: applicant.enterprise || `${applicant.name}科技有限公司`, registeredCapital: rand(50, 2000), businessScope: '软件开发；信息技术咨询；计算机软硬件及辅助设备零售', legalRep: applicant.name },
      2: { businessType: ['sales', 'catering', 'canteen'][rand(0, 2)], area: rand(30, 300) },
      3: { changeType: ['name', 'address', 'scope'].slice(0, rand(1, 3)).join(',') },
      4: { cancelReason: ['voluntary', 'revoked', 'dissolve'][rand(0, 2)] },
      5: { reportYear: ['2024', '2023', '2022'][rand(0, 2)] },
      6: { proposedName1: `${applicant.name}${['商行','百货','商店','工作室'][rand(0, 3)]}` },
      7: { drugType: ['rx', 'otc-b', 'all'][rand(0, 2)] },
    };
    insertApply.run(applyId, tpl[0], tpl[2], tpl[1], c.uid, applicant.name, applicant.enterprise || null,
      JSON.stringify(formDataMap[c.tplIdx] || {}),
      JSON.stringify(tpl[6]),
      c.status, c.curStep, c.totalSteps,
      c.reject ? JSON.stringify(c.reject) : null,
      applyCreatedAt, applyUpdatedAt);

    // 插入 approval_nodes
    process.forEach((p, idx) => {
      let nodeStatus = 'pending';
      let assigneeId: any = null;
      let assigneeName: any = null;
      let comment: any = null;
      let operatedAt: any = null;

      const step = idx + 1;
      if (step < c.curStep) {
        // 已完成的节点
        if (c.status === 'rejected' && step === c.curStep) {
          // 驳回发生的节点
          nodeStatus = 'rejected';
          assigneeId = reviewers[rand(0, reviewers.length - 1)];
          assigneeName = reviewerNames[assigneeId as string];
          comment = c.reject?.reasons?.[0]?.message || '材料不符合要求，予以驳回';
          operatedAt = genDate(c.age - c.curStep, c.curStep * 2, rand(0, 30));
        } else {
          nodeStatus = 'approved';
          assigneeId = reviewers[idx % reviewers.length];
          assigneeName = reviewerNames[assigneeId as string];
          comment = ['材料齐全，符合法定形式', '内容真实有效，拟同意', '符合《市场主体登记管理条例》规定，同意', '核准通过', '证照已出具并寄送'][idx % 5];
          operatedAt = genDate(c.age - step, step * 2, rand(0, 30));
        }
      } else if (step === c.curStep && c.status !== 'draft') {
        nodeStatus = c.status === 'rejected' ? 'rejected' : 'processing';
        assigneeId = reviewers[(step - 1) % reviewers.length];
        assigneeName = reviewerNames[assigneeId as string];
        if (c.status === 'rejected') {
          comment = c.reject?.reasons?.[0]?.message || '审核不通过';
          operatedAt = applyUpdatedAt;
        }
      } else if (step === c.curStep && c.status === 'draft') {
        nodeStatus = 'pending';
      }
      insertNode.run(uuidv4(), applyId, p.name, p.role, p.level,
        assigneeId, assigneeName, nodeStatus, comment, operatedAt);

      // 已完成的节点生成操作日志
      if (nodeStatus !== 'pending') {
        insertOpLog.run(uuidv4(), assigneeId || U.admin, 'approval',
          nodeStatus === 'approved' ? 'approve' : nodeStatus === 'rejected' ? 'reject' : 'assign',
          applyId, JSON.stringify({ node: p.name, level: p.level, comment }),
          `10.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)}`,
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      }
    });

    // 插入签署文件
    const docId = 'SD' + (202405000 + caseIdx + 1);
    const positions = [{ page: 1, x: 120, y: 720, width: 160, height: 80, signerRole: '申请人' }];
    if (c.totalSteps >= 3) positions.push({ page: 1, x: 380, y: 720, width: 160, height: 80, signerRole: '法定代表人' });
    const isSigned = c.signStatus === 'completed' || c.signStatus === 'signed';
    insertSignDoc.run(docId, applyId, tpl[2], `${tpl[2]}申请书（电子签章版）`, 'application',
      rand(1, 4), JSON.stringify(positions.map((p, i) => ({
        ...p,
        signedAt: isSigned || (c.signStatus !== 'pending' && i === 0)
          ? genDate(c.age - c.curStep + 1, -1, rand(0, 30))
          : undefined,
        signerName: isSigned || (c.signStatus !== 'pending' && i === 0) ? applicant.name : undefined,
      }))),
      positions.length, c.signStatus,
      c.signStatus === 'pending' ? genDate(-1) : null,
      isSigned ? applicant.name : null,
      isSigned ? genDate(c.age - c.curStep + 1, 0) : null,
      isSigned ? hash() : null,
      isSigned ? `TSA2024${pad(rand(1, 365), 3)}${pad(rand(1, 99999), 5)}` : null,
      isSigned ? `MEUCIQC${uuidv4().replace(/-/g, '')}Ag${uuidv4().replace(/-/g, '')}=` : null);

    // 插入签署日志（每完成一个签名位置插入 4 条 log: 预览→法律声明→生物核验→签名）
    if (c.signStatus !== 'pending') {
      const numSigned = c.signStatus === 'completed' ? positions.length : 1;
      for (let s = 0; s < numSigned; s++) {
        const baseTime = c.age - c.curStep + 1;
        const logEntries = [
          { action: 'document_preview', name: `文档预览（签名位置 ${s + 1}）` },
          { action: 'legal_statement_read', name: '法律效力声明 - 滚动阅读确认（电子签名法第13/14条）' },
          { action: 'biometric_verify', name: `${['人脸识别', '指纹核验'][rand(0, 1)]}通过` },
          { action: 'sign', name: `SM2国密电子签名完成（位置${s + 1}）` },
        ];
        logEntries.forEach((entry, li) => {
          const biometric = entry.action === 'biometric_verify' ? true : entry.action === 'sign';
          const bioType = li === 2 ? 'face' : (entry.action === 'sign' ? 'face' : null);
          const tsaTs = entry.action === 'sign' ? genDate(baseTime, s * 2, li * 5 + rand(0, 30)) : null;
          insertSignLog.run(
            uuidv4(), docId, c.uid, applicant.name,
            entry.action,
            genDate(baseTime, s * 2, li * 5),
            JSON.stringify({
              device: `iPhone 15 Pro / iOS 17.4.1 / App v${rand(1, 3)}.${rand(0, 9)}.${rand(0, 9)}`,
              platform: 'H5小程序WeChat'
            }),
            `183.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)}`,
            JSON.stringify({ province: '江苏省', city: '南京市', district: '鼓楼区' }),
            bioType, biometric ? 1 : 0,
            biometric ? (94 + Math.random() * 6) : null,
            tsaTs,
            entry.action === 'sign' ? hash() : null,
            entry.action === 'sign' ? `TSA2024${pad(rand(1, 365), 3)}${pad(rand(1, 99999), 5)}` : null,
            entry.action === 'sign' ? `MEUCIQC${uuidv4().replace(/-/g, '')}Ag${uuidv4().replace(/-/g, '')}=` : null,
            'SM2'
          );
        });
      }
    }

    // 插入 申请人 的待办事项
    if (c.status === 'submitted' || c.status === 'reviewing') {
      insertTodo.run(uuidv4(), c.uid, 'review', `审核中：${tpl[2]}`, `第 ${c.curStep}/${c.totalSteps} 环节 · ${process[c.curStep - 1]?.name}`, applyId, 'medium', 0, genDate(-c.age + 5));
    }
    if (c.signStatus === 'pending') {
      insertTodo.run(uuidv4(), c.uid, 'sign', `待签署：${tpl[2]}`, `请在 24 小时内完成电子签名，否则申请将自动撤回`, docId, 'high', 0, genDate(-c.age + 1));
    }
    if (c.status === 'rejected') {
      insertTodo.run(uuidv4(), c.uid, 'reject', `申请被驳回：${tpl[2]}（${c.reject?.category}）`, `共 ${c.reject?.reasons?.length || 0} 项问题，请查看详情并修正后重新提交`, applyId, 'high', 0, null);
    }
    if (c.status === 'approved' || c.status === 'completed') {
      insertTodo.run(uuidv4(), c.uid, 'complete', `审批通过：${tpl[2]}`, `证照已签发，请在进度追踪页面下载电子证照或申请邮寄`, applyId, 'medium', 1, null);
    }

    // 插入 审核人员 待办（当前环节正在处理的节点）
    if (c.status === 'reviewing') {
      const currNode = process[c.curStep - 1];
      const rid = reviewers[(c.curStep - 1) % reviewers.length];
      insertTodo.run(uuidv4(), rid, 'review', `待审核（L${c.curStep} ${currNode.name}）：${tpl[2]} - ${applicant.name}`,
        `承诺时限内完成审核，预计剩余 ${tpl[5] - c.curStep + 1} 个工作日`,
        applyId, 'high', 0, genDate(-c.age + (tpl[5] - c.curStep)));
    }

    // 插入档案（审批通过/完成的申请）
    if (c.status === 'approved' || c.status === 'completed') {
      const itemsJson = [
        { name: `${tpl[2]}_申请表_${applyId}.pdf`, type: '申请表', size: rand(80, 300), hash: hash() },
        { name: `${tpl[2]}_签署日志_${applyId}.json`, type: '签署日志', size: rand(12, 80), hash: hash() },
        { name: `时间戳验证报告_RFC3161_${applyId}.pdf`, type: 'TSA报告', size: rand(50, 150), hash: hash() },
        { name: `CA证书链_SM2_${applyId}.pem`, type: 'CA证书链', size: rand(6, 20), hash: hash() },
        { name: `审批流程记录_L1-L${c.totalSteps}_${applyId}.pdf`, type: '审批记录', size: rand(100, 400), hash: hash() },
        { name: `原始材料归档包_${applyId}.zip`, type: '原始材料', size: rand(500, 2000), hash: hash() },
      ];
      const fileSize = rand(2, 8) * 1024 * 1024;
      const archivedAt = genDate(c.age - c.totalSteps, 2);
      const archiveNo = `DA-${new Date(archivedAt).getFullYear()}${pad(rand(1, 12))}${pad(rand(1, 99999))}`;
      const archiveType = ['永久', '长期30年', '长期10年', '5年'][rand(0, 3)];
      const ossKey = `province-mkt-archives/2024/${pad(5 - c.curStep, 2)}/${applyId}.zip`;
      insertArchive.run(
        uuidv4(), applyId, archiveNo, `证据包_${tpl[2]}_${applyId}.zip`, archiveType,
        fileSize, itemsJson.length, JSON.stringify(itemsJson), hash(),
        'synced', ossKey, `/data/archives/${applyId}.zip`, archivedAt);
    }
  });
  console.log(`[Seed] ${applyCaseDefs.length} apply cases with full closure created.`);

  // ========== 5. 额外：给审核员再塞几个全局待办 ==========
  const extraTodos = [
    { type: 'notification', title: '系统通知：今日待处理事项汇总', description: '今日共新增 12 笔申请，3 笔即将到期（<24h）', priority: 'medium' },
    { type: 'policy', title: '政策提醒：新版市场主体登记系统升级', description: '5月20日零点至四点系统升级，将启用新版签名验签模块', priority: 'important' },
    { type: 'license', title: '证照到期提醒：123份营业执照本月到期', description: '请通知相关市场主体及时办理换证或延续', priority: 'normal' },
  ];
  [U.reviewer1, U.reviewer2, U.reviewer3, U.reviewer4, U.admin].forEach(uid => {
    extraTodos.forEach(t => insertTodo.run(uuidv4(), uid, t.type, t.title, t.description, null, t.priority, 0, null));
  });

  // ========== 6. 更多通知 ==========
  const insertNotice = db.prepare(`INSERT INTO notices VALUES (?,?,?,?,?,?,datetime('now'))`);
  const notices = [
    { title: '📢 2024年度市场主体年报公示最后通知', content: '根据《市场主体登记管理条例实施细则》，凡 2023 年 12 月 31 日前设立登记的市场主体，请于 2024 年 6 月 30 日前登录国家企业信用信息公示系统报送年度报告。逾期未报将被标记为经营异常并公示，并依据《市场主体登记管理条例实施细则》第七十条处以 1 万元以下罚款。', type: 'notification', level: 'urgent', publisher: '省市场监督管理局登记注册处' },
    { title: '🔒 关于启用新版国密电子签名服务模块的公告', content: '根据《密码法》第二十七条及国密局相关要求，本平台将于 2024 年 5 月 20 日启用新版 SM2/SM3/SM4 国密签名服务模块。升级后：1）原 RSA 证书用户需在升级后 30 日内更换为国密双根证书；2）移动端生物特征匹配阈值由 90 分调整为 95 分；3）签署时间戳由国家授时中心 TSA 服务直接签发（RFC3161）。升级维护窗口：2024 年 5 月 20 日 02:00 - 04:00。', type: 'system', level: 'important', publisher: '省政务服务中心密码管理处' },
    { title: '⚖️ 《电子签名法》最新司法解释政策解读', content: '2024年4月25日最高人民法院发布《关于审理涉电子商务纠纷案件适用法律若干问题的解释》，其中第四条明确："符合《电子签名法》第十三条规定的可靠电子签名，与手写签名或者盖章具有同等法律效力。人民法院应当依法认定其证据效力。" 第十一条进一步规定："当事人提交的电子签名时间戳服务机构签发的时间戳证据，经查证属实的，人民法院可以作为认定电子数据签署时间的依据。"', type: 'policy', level: 'normal', publisher: '省市场监管局法规处' },
    { title: '☁️ 政务云电子档案归集通知', content: '根据《电子档案管理办法》及政务云安全规范，所有不见面审批业务的电子档案须在审批完成后 2 小时内自动归集至省级政务云归档存储，并生成不可篡改的档案哈希值。截至 2024 年 5 月 15 日，本平台已累计归集档案 286,742 份，抽查校验合格率 99.998%。', type: 'notification', level: 'normal', publisher: '省大数据局政务云处' },
    { title: '👤 关于开展审批人员账号安全自查的通知', content: '为保障政务数据安全，各单位请于 5 月 25 日前完成账号安全自查：1）检查弱口令、默认口令；2）检查未注销的离岗人员账号；3）启用双因子认证（UKey + 生物特征）；4）梳理近 6 个月异常登录（异地/频繁失败）记录。自查表请发送至 mkt_sec@province-gov.gov.cn。', type: 'system', level: 'important', publisher: '省市场监管局网络安全办公室' },
    { title: '💊 《药品经营许可证》电子化证照全面启用', content: '根据《关于加快推进电子证照扩大应用领域和全国互通互认的意见》，自 2024 年 5 月 15 日起，全省范围内全面启用《药品经营许可证》电子证照，电子证照与纸质证照具有同等法律效力。经营主体可通过本平台"电子证照"栏目下载、亮证。', type: 'policy', level: 'normal', publisher: '省药品监督管理局' },
  ];
  notices.forEach(n => insertNotice.run(uuidv4(), n.title, n.content, n.type, n.level, n.publisher));
  console.log(`[Seed] ${notices.length} notices created.`);

  // ========== 7. 电子证照（更多数据） ==========
  const insertLicense = db.prepare(`INSERT INTO electronic_licenses (id,user_id,license_type,license_no,holder_name,issuer,issue_date,valid_from,valid_to,status,image_url,can_be_shared,synced_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))`);
  const licenses = [
    [U.zhangsan, '居民身份证', '3201**********1234', '张三', '南京市公安局', '2018-06-01', '2018-06-01', '2038-06-01', 'valid', null, 1],
    [U.zhangsan, '个体工商户营业执照', '923201********1234', '张记阳光小吃店', '南京市鼓楼区市场监督管理局', '2023-03-15', '2023-03-15', '长期', 'valid', null, 1],
    [U.zhangsan, '食品经营许可证', 'JY13201********5678', '张记阳光小吃店', '南京市鼓楼区市场监督管理局', '2023-05-08', '2023-05-08', '2028-05-07', 'valid', null, 1],
    [U.lisi, '居民身份证', '3201**********5678', '李四', '南京市公安局', '2016-12-10', '2016-12-10', '2036-12-10', 'valid', null, 1],
    [U.lisi, '营业执照', '91320100MA1AB2CD34', '盛景科技发展有限公司', '南京市市场监督管理局', '2024-01-20', '2024-01-20', '长期', 'valid', null, 1],
    [U.lisi, '电子营业执照', '91320100MA1AB2CD34', '盛景科技发展有限公司', '国家市场监管总局电子营业系统', '2024-01-20', '2024-01-20', '长期', 'valid', null, 1],
    [U.zhaoliu, '居民身份证', '3201**********3456', '赵六', '南京市公安局', '2017-09-25', '2017-09-25', '2037-09-25', 'valid', null, 1],
    [U.zhaoliu, '营业执照', '91320100MA2EF3GH45', '绿源餐饮管理有限公司', '南京市秦淮区市场监督管理局', '2022-08-08', '2022-08-08', '长期', 'valid', null, 1],
    [U.zhaoliu, '食品经营许可证', 'JY23201********4321', '绿源餐饮管理有限公司', '南京市秦淮区市场监督管理局', '2022-10-12', '2022-10-12', '2027-10-11', 'valid', null, 1],
    [U.zhouba, '营业执照', '91320100MA3IJ4KL56', '华瑞商贸股份有限公司', '南京市市场监督管理局', '2024-02-18', '2024-02-18', '长期', 'valid', null, 1],
  ];
  licenses.forEach(l => insertLicense.run(uuidv4(), ...l));
  console.log(`[Seed] ${licenses.length} electronic licenses created.`);

  // ========== 8. 额外操作日志（审计） ==========
  const extraOpLogs = [
    { uid: U.admin, module: 'system', action: 'login', detail: JSON.stringify({ method: 'password+ukey', location: '南京市玄武区省局机房' }) },
    { uid: U.reviewer1, module: 'approval', action: 'login', detail: JSON.stringify({ method: 'biometric-face', score: 97.8, device: '政务网终端' }) },
    { uid: U.reviewer2, module: 'approval', action: 'assign', detail: JSON.stringify({ target: 'APP202405002', fromNode: '初审', toUser: '王审核' }) },
    { uid: U.admin, module: 'template', action: 'update', detail: JSON.stringify({ code: 'DJ-IND-001', change: '新增字段"经营场所面积"' }) },
    { uid: U.zhangsan, module: 'apply', action: 'create', detail: JSON.stringify({ template: 'DJ-IND-001', from: '移动端小程序' }) },
    { uid: U.lisi, module: 'sign', action: 'sign', detail: JSON.stringify({ doc: 'SD202405002', algorithm: 'SM2', tsa: 'ok', hash: hash() }) },
    { uid: U.zhaoliu, module: 'apply', action: 'resubmit', detail: JSON.stringify({ apply: 'APP202405004', rejected: true, fixedReasons: 3 }) },
    { uid: U.admin, module: 'archive', action: 'verify', detail: JSON.stringify({ apply: 'APP202405006', sha256: hash(), integrity: 'pass' }) },
  ];
  extraOpLogs.forEach(l => insertOpLog.run(uuidv4(), l.uid, l.module, l.action, l.detail,
    `10.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)}`, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124'));
  console.log(`[Seed] ${extraOpLogs.length} additional audit logs created.`);

  // ========== 最终统计 ==========
  const stat = (t: string) => (db.prepare(`SELECT COUNT(*) AS cnt FROM ${t}`).get() as any).cnt;
  console.log('\n================== 数据载入总览 ==================');
  console.log(`  👤 用户             : ${stat('users')}`);
  console.log(`  🔐 CA证书           : ${stat('ca_certificates')}`);
  console.log(`  📋 登记事项模板     : ${stat('form_templates')}`);
  console.log(`  📝 申请记录         : ${stat('apply_records')}`);
  console.log(`  ✅ 审批节点         : ${stat('approval_nodes')}`);
  console.log(`  📄 签署文件         : ${stat('sign_documents')}`);
  console.log(`  🖊️  签署日志         : ${stat('sign_logs')}`);
  console.log(`  📋 待办事项         : ${stat('todos')}`);
  console.log(`  🔔 通知公告         : ${stat('notices')}`);
  console.log(`  🏅 电子证照         : ${stat('electronic_licenses')}`);
  console.log(`  📦 归档档案         : ${stat('archives')}`);
  console.log(`  🧾 操作审计日志     : ${stat('operation_logs')}`);
  console.log('=================================================');
  console.log('\n✅ 数据初始化完成！');
  console.log('📱 移动端（申请人）登录： 138****5678 / 123456（张三）');
  console.log('🖥️  后台（审核员）登录 ： 137****1111 / 123456（王审核·初审）');
  console.log('🧑‍💻 后台（复审）登录   ： 137****2222 / 123456（赵复审·复审）');
  console.log('⚙️  后台（管理员）登录 ： 137****0000 / 123456（管理员·全部权限）');
  return true;
};

if (require.main === module) {
  seedDatabase({ force: true });
}
