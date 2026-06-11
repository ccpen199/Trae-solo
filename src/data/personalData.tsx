// This data module includes JSX icon renderers, so it must be compiled as TSX.
export const userInfo = {
  name: '张三',
  idCard: '500112199005151234',
  location: '重庆市渝北区',
  avatar: '张',
}

export const overviewCards = [
  {
    label: '社保参保状态', value: '正常参保', subValue: '五险齐全 · 连续48个月', icon: '🛡️',
    source: '部级社保核心数据库', sourceCode: 'RS001-CQ-2024-88762',
    syncTime: '2026-06-10 10:30:42', syncStatus: 'success',
    conflict: null, color: 'from-emerald-500 to-green-600', ringColor: 'bg-green-400',
    proof: '电子参保凭证号: BX20260610-001245876', path: '/social-security'
  },
  {
    label: '公积金余额', value: '¥45,680', subValue: '月缴 ¥1,824 · 累计48个月', icon: '🏦',
    source: '重庆市公积金中心系统', sourceCode: 'GJJ-CQ-2024-0059876',
    syncTime: '2026-06-10 10:25:18', syncStatus: 'success',
    conflict: { status: '已自动消解 · 以公积金中心为准', resolved: true },
    color: 'from-blue-500 to-indigo-600', ringColor: 'bg-blue-400',
    proof: '缴存流水号: GJJMX-2026-05-0008876', path: null
  },
  {
    label: '医保个人账户', value: '¥3,250', subValue: '本月消费 ¥580 · 余额充足', icon: '💊',
    source: '重庆市医保结算系统', sourceCode: 'YB-CQ-2024-1566234',
    syncTime: '2026-06-10 10:31:05', syncStatus: 'warning',
    conflict: null, color: 'from-cyan-500 to-teal-600', ringColor: 'bg-cyan-400',
    proof: '社保卡号: CQYB-5001121990****1234', path: '/social-security'
  },
]

export const unemploymentDetail = {
  appNo: 'SYJ-CQ-2026-0600387', submittedAt: '2026-06-08 14:32:18',
  monthlyAmount: 1890, duration: 12, totalAmount: 22680,
  paymentPlan: [
    { period: '第1期', date: '2026-06-20', amount: 1890, status: '待发放' },
    { period: '第2-12期', date: '每月20日', amount: 1890, status: '未到账' },
  ],
  bank: '中国建设银行 · 尾号 ****8821',
  auditNodes: [
    { name: '申请提交', status: 'done', time: '06-08 14:32', operator: '张三（本人）', remark: '在线提交失业金申领申请' },
    { name: 'OCR智能核验', status: 'done', time: '06-08 14:33', operator: 'AI引擎-AID001', remark: '身份证+解除合同证明已识别，与公安/社保库比对一致' },
    { name: '区县初审', status: 'processing', time: '06-09 09:15', operator: '渝北区就业局·王芳', remark: '正在核验缴费年限及失业登记状态' },
    { name: '市级复核', status: 'pending', time: '预计06-11', operator: '市就业局复核科', remark: '' },
    { name: '公示期', status: 'pending', time: '5个工作日', operator: '社会公示', remark: '官网公示无异议后进入发放' },
    { name: '首发放款', status: 'pending', time: '预计06-20', operator: '银行代发', remark: '发放至建行尾号8821' },
  ],
  materials: [
    { name: '身份证正反面', status: '已提交', ocr: true, confidence: 98.5, reusedFrom: '社保参保登记' },
    { name: '解除劳动合同证明书', status: '已提交', ocr: true, confidence: 96.2, reusedFrom: null },
    { name: '失业登记凭证', status: '系统自动获取', ocr: false, confidence: null, reusedFrom: '就业登记系统' },
    { name: '银行卡证明', status: '系统自动获取', ocr: false, confidence: null, reusedFrom: '银行代发系统' },
  ],
  abnormalities: [
    { type: 'info', msg: '缴费年限核对：累计48个月，可领取12个月 ✓' },
    { type: 'info', msg: '失业登记核验：06-07已完成失业登记 ✓' },
    { type: 'warning', msg: '系统提示：公积金近期仍在缴，需确认是否为再就业状态' },
  ],
}

export const titleDetail = {
  appNo: 'ZC-CQ-2026-0601245', title: '中级工程师（计算机与电子信息）',
  submittedAt: '2026-05-12 10:28:45', evaluationCommittee: '重庆市工程系列职称评审委员会',
  auditNodes: [
    { name: '材料提交', status: 'done', time: '05-12 10:28', operator: '张三（本人）', remark: '提交申报材料6份' },
    { name: '用人单位审核', status: 'done', time: '05-13 16:05', operator: '重庆智联科技·李主任', remark: '业绩属实，同意推荐' },
    { name: '主管部门复核', status: 'rejected', time: '05-20 11:30', operator: '市经信委·陈老师', remark: '退件原因：①缺验收报告②缺论文检索证明③业绩描述需明确贡献角色' },
    { name: '材料补充', status: 'todo', time: '截止 06-17', operator: '待本人补充', remark: '一次告知需补正3项内容' },
    { name: '评委会评审', status: 'pending', time: '-', operator: '评审委员会', remark: '预计7月评审' },
    { name: '公示发证', status: 'pending', time: '-', operator: '公示', remark: '' },
  ],
  materials: [
    { name: '身份证', status: '已复用', ocr: true, confidence: 99.1, reusedFrom: '失业金申领', flagged: false },
    { name: '学历学位证书', status: '已核验', ocr: true, confidence: 97.8, reusedFrom: '人才认定系统', flagged: false },
    { name: '工作经历证明', status: '已提交', ocr: false, confidence: null, reusedFrom: null, flagged: false },
    { name: '业绩成果材料', status: '需补充', ocr: false, confidence: null, reusedFrom: null, flagged: true },
    { name: '论文著作检索证明', status: '需补充', ocr: false, confidence: null, reusedFrom: null, flagged: true },
    { name: '继续教育证明', status: '系统自动获取', ocr: false, confidence: null, reusedFrom: '人社培训系统', flagged: false },
  ],
  rejection: { time: '2026-05-20 11:30:45', handler: '市经信委职称办·陈XX', reason: '1. 业绩项目"智慧园区综合管理平台"缺少最终验收报告扫描件；2. 论文《基于微服务架构的业务中台设计》缺少万方数据库检索页截图；3. 业绩描述需进一步明确具体工作量与贡献角色。', deadline: '2026-06-17 18:00', remainingDays: 7 },
}

export const contractDetail = {
  currentContract: {
    id: 'HT-CQ-2024-00598823', company: '重庆智联数字科技有限公司',
    type: '固定期限 · 3年', period: '2024-01-15 至 2027-01-14',
    position: '高级软件开发工程师', salary: '¥18,000/月',
    signedAt: '2024-01-15 15:42', archiveNo: 'LDHT-CQ-2024-588723',
    caCert: 'CFCA电子签章·编号 ESEAL202401150008976',
    pdfHash: 'SHA256: 8a7f3e9b...4d2c',
    blockchain: '重庆市区块链政务平台 · 上链高度 #2,458,992',
  },
  signFlow: [
    { role: '用人单位（甲方）', name: '重庆智联数字科技·法人代表 刘总', time: '01-15 11:20', ca: '法人签章已验证' },
    { role: '平台见证方', name: '重庆市人社电子合同平台', time: '01-15 11:25', ca: '平台时间戳' },
    { role: '劳动者（乙方）', name: '张三', time: '01-15 15:42', ca: '人脸+短信双重认证' },
    { role: '区块链存证', name: '重庆市区块链政务平台', time: '01-15 15:43', ca: '全节点存证' },
  ],
  previousCount: 2,
}

export const inspectionDetail = {
  caseNo: 'LDJC-CQ-2026-0500087', filedAt: '2026-05-18 09:45',
  type: '欠薪投诉', target: '重庆XX建设工程有限公司',
  description: '投诉2026年3月-4月项目工资共计¥28,600未按时发放，涉及加班时长累计86小时未计加班费。',
  investigator: '重庆市劳动保障监察总队·周警官/吴警官', contact: '023-12333-8023',
  timeline: [
    { step: '投诉提交', time: '05-18 09:45', desc: '在线提交投诉材料5份，含工资条截图、考勤记录等' },
    { step: '受理登记', time: '05-19 10:20', desc: '审核通过，符合《劳动保障监察条例》受理范围' },
    { step: '立案调查', time: '05-22 14:30', desc: '发出《调查询问通知书》LDJC-CQ-WX-2026-0508' },
    { step: '企业举证', time: '05-28 16:00', desc: '企业提交工资表及考勤数据，正在比对核验' },
    { step: '调查取证中', time: '进行中', desc: '预计06-15前完成，如有必要将上门实地核查' },
  ],
  attachments: 5,
}

export const todoItems = [
  {
    key: 'unemployment-review', title: '失业金申领 · 区县初审中',
    status: '初审中', statusColor: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    severity: 'normal', appNo: 'SYJ-CQ-2026-0600387', reviewer: '渝北区就业局·王芳',
    startedAt: '2026-06-08 14:32', nextStep: '市级复核', eta: '预计06-11完成',
    rejection: null,
    flow: [
      { time: '06-08 14:32', actor: '张三', action: '提交申请', detail: '提交材料4份，含身份证、解除劳动合同证明' },
      { time: '06-08 14:33', actor: 'AI引擎AID001', action: 'OCR自动核验', detail: '身份证98.5%、解除合同证明96.2%，与公安/社保库比对一致' },
      { time: '06-09 09:15', actor: '王芳（初审人）', action: '接件受理', detail: '分配工单JY-CQ-2026-0600125，开始核验缴费年限' },
      { time: '06-09 16:40', actor: '系统', action: '多源数据比对', detail: '部级社保库48个月✓ 公积金中心✓ 就业登记系统✓' },
    ],
  },
  {
    key: 'title-rejection', title: '职称申报 · 退件待补充材料',
    status: '退件待补充', statusColor: 'bg-red-50 text-red-700 border-red-200',
    severity: 'urgent', appNo: 'ZC-CQ-2026-0601245', reviewer: '市经信委·陈老师',
    startedAt: '2026-05-12 10:28', nextStep: '重新提交后再次复核', eta: '截止06-17 · 剩7天',
    rejection: { reason: '业绩成果材料不完整：①缺验收报告②缺论文检索页③业绩描述需明确贡献角色', suggestion: '建议参考申报模板重新撰写业绩贡献说明，并补充甲方盖章的项目验收结项证明。', proofNo: 'ZC-BZ-2026-0328（材料补正通知书）' },
    flow: [
      { time: '05-12 10:28', actor: '张三', action: '提交申报', detail: '申报中级工程师（计算机），提交材料6份' },
      { time: '05-13 16:05', actor: '李主任（单位）', action: '单位审核通过', detail: '工作业绩基本属实，盖章推荐上报' },
      { time: '05-20 11:30', actor: '陈老师（主管部门）', action: '退件审核意见', detail: '出具《补正通知书》ZC-BZ-2026-0328，一次告知需补正3项' },
      { time: '05-20 11:35', actor: '系统', action: '短信+站内信推送', detail: '退件通知已发送至138****8821，推送ID: MSG202605201135001' },
    ],
  },
  {
    key: 'insurance-transfer', title: '社保关系转移 · 办理中',
    status: '转入接收中', statusColor: 'bg-blue-50 text-blue-700 border-blue-200',
    severity: 'normal', appNo: 'SBBY-CQ-2026-0400876', reviewer: '市社保中心转移接续科·赵老师',
    startedAt: '2026-04-18 15:20', nextStep: '基金划转 · 个人账户转入', eta: '预计06-15完成',
    rejection: null,
    flow: [
      { time: '04-18 15:20', actor: '张三', action: '申请提交', detail: '申请成都社保转入重庆，原单位：成都XX软件有限公司' },
      { time: '04-22 10:05', actor: '成都社保局', action: '转出信息表', detail: '《参保缴费凭证》编号CD-SB-2026-045218' },
      { time: '05-08 14:30', actor: '重庆社保局', action: '同意接收', detail: '发出《转移接续联系函》至成都' },
      { time: '05-28 09:00', actor: '银行', action: '基金划转', detail: '转移基金 ¥86,234.56 从成都专户汇出' },
      { time: '06-09 16:20', actor: '重庆社保局', action: '基金到账', detail: '基金已到账，正在进行个人账户匹配入账' },
    ],
  },
  {
    key: 'arbitration-confirm', title: '劳动仲裁 · 庭前调解待确认',
    status: '待确认', statusColor: 'bg-orange-50 text-orange-700 border-orange-200',
    severity: 'urgent', appNo: 'LDZC-CQ-2026-0500156', reviewer: '渝北区仲裁院·孙仲裁员',
    startedAt: '2026-05-06 09:00', nextStep: '调解排期/开庭排期', eta: '请于06-12前确认 · 剩2天',
    rejection: null,
    flow: [
      { time: '05-06 09:00', actor: '张三', action: '仲裁申请提交', detail: '主张解除劳动合同经济补偿及拖欠工资' },
      { time: '05-08 15:20', actor: '仲裁院', action: '立案受理', detail: '案号：渝北劳人仲案字〔2026〕第328号' },
      { time: '06-01 10:00', actor: '调解员', action: '先行调解提议', detail: '根据《调解仲裁法》建议庭前调解' },
      { time: '06-05 14:25', actor: '系统', action: '调解排期通知', detail: '06-14 14:00在线调解，请于06-12前确认' },
    ],
  },
  {
    key: 'talent-approval', title: '人才认定 · D类人才已认定',
    status: '已办结', statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    severity: 'normal', appNo: 'RC-CQ-2025-0008876', reviewer: '市人才服务中心·周老师',
    startedAt: '2025-11-15 09:30', nextStep: '享受人才待遇', eta: '有效期至2028-11',
    rejection: null,
    flow: [
      { time: '11-15 09:30', actor: '张三', action: '提交认定申请', detail: '申报重庆市D类青年人才' },
      { time: '11-20 14:00', actor: '单位', action: '审核推荐', detail: '同意推荐' },
      { time: '12-05 10:00', actor: '区人社局', action: '初审通过', detail: '材料齐全，符合D类人才条件' },
      { time: '12-15 16:30', actor: '市人才中心', action: '复核通过', detail: 'D类（市级青年领军人才）' },
      { time: '12-20 09:00', actor: '系统', action: '电子证照生成', detail: '《重庆英才服务卡》电子证号 RC2025122000876' },
    ],
  },
]

export const recentActivities = [
  { title: '医保门诊报销', date: '06-08', result: '已办结·已到账', amount: '¥1,280.00',
    voucher: 'YBBX-CQ-2026-0608156', handler: '渝北区医保中心结算科',
    finishedAt: '2026-06-08 16:35:22', proof: '电子支付凭证号: CQYBZF-2026-060887654',
    steps: ['提交发票', 'OCR识别', '目录匹配', '结算审核', '财务拨付'], status: 'success' },
  { title: '公积金租房提取', date: '06-01', result: '已办结·已到账', amount: '¥3,000.00',
    voucher: 'GJJTQ-CQ-2026-0601034', handler: '重庆市公积金中心',
    finishedAt: '2026-06-01 11:12:08', proof: '年度额度¥18,000，提取后剩余¥15,000',
    steps: ['人脸识别', '租赁备案核验', '无房查询', '额度计算', '资金拨付'], status: 'success' },
  { title: '失业登记办理', date: '05-28', result: '已办结', amount: null,
    voucher: 'SYDJ-CQ-2026-0528776', handler: '渝北区就业和人才服务局',
    finishedAt: '2026-05-28 15:45:30', proof: '《就业创业证》电子证号: 500112-2026-005876',
    steps: ['失业原因登记', '劳动关系解除核验', '失业登记审核', '电子证照生成'], status: 'success' },
  { title: '养老参保证明开具', date: '05-15', result: '已办结', amount: null,
    voucher: 'SBZM-CQ-2026-0515223', handler: '市社保中心',
    finishedAt: '2026-05-15 09:22:45', proof: '验证码: CQRSB-2026-M7K8N5V3 · 30天内可验真',
    steps: ['参保查询', 'PDF生成', 'CA签章', '下载推送'], status: 'success' },
]

export const aiSection = {
  lastQa: {
    q: '重庆失业金申领条件是什么？可以领多久？每月多少钱？',
    a: '根据《重庆市失业保险条例》及渝人社发〔2025〕18号文件，申领条件：①按规定参加失业保险，所在单位和本人已履行缴费义务满1年；②非因本人意愿中断就业；③已办理失业登记，并有求职要求。领取期限：累计缴费满1年不足5年最长12个月；满5年不足10年最长18个月；10年以上最长24个月。您累计缴费48个月，可领取12个月。2026年标准：二类地区¥1,890/月。您参保地属渝北区，月标准¥1,890，预计发放2026.6-2027.5，总计¥22,680元。',
    time: '今天 09:58',
    related: ['重庆市失业保险条例', '渝人社发〔2025〕18号', '社会保险法第五章'],
  },
  lastOcr: {
    fileName: '解除劳动合同证明书-重庆智联科技.pdf', time: '3.2秒', pages: 2,
    fields: [
      { key: '劳动者姓名', value: '张三', conf: 99.4 },
      { key: '身份证号码', value: '500112199005151234', conf: 99.8 },
      { key: '用人单位', value: '重庆智联数字科技有限公司', conf: 98.7 },
      { key: '合同期限', value: '2024-01-15至2026-05-31', conf: 97.6 },
      { key: '解除原因', value: '协商一致解除（用人单位提出）', conf: 95.3 },
      { key: '解除日期', value: '2026-05-31', conf: 98.9 },
      { key: '经济补偿金', value: '¥45,000（2.5个月×¥18,000）', conf: 92.1 },
      { key: '单位公章', value: '✓ 已检测红色公章，与工商备案一致', conf: 96.8 },
    ],
    reusedIn: ['失业金申领', '失业登记办理', '劳动仲裁立案'],
  },
  materialReuse: {
    total: 18, thisMonth: 5, savedTime: '约2小时15分钟',
    top: [
      { name: '身份证正反面', count: 8, services: '社保、失业金、职称、人才认定等' },
      { name: '学历学位证书', count: 5, services: '职称申报、人才认定、培训报名' },
      { name: '银行卡（建行尾号8821）', count: 4, services: '失业金、医保、公积金提取' },
    ],
  },
}

export const efficiency = {
  timeouts: [
    { appNo: 'SBBY-CQ-2026-0300223', title: '社保转移-成都转入', days: '超时3天', dept: '成都社保局转移科', tip: '已自动发送跨省催办函' },
    { appNo: 'GJJTQ-CQ-2026-0500112', title: '公积金购房提取', days: '超时2天', dept: '沙坪坝不动产登记中心', tip: '接口延时，已转人工查询' },
  ],
  rejectionStats: {
    monthTotal: 142,
    topReasons: [
      { reason: '材料不完整/缺失扫描件', count: 49, pct: 34.5 },
      { reason: '填写信息与系统不一致', count: 35, pct: 24.6 },
      { reason: '不符合政策条件', count: 28, pct: 19.7 },
      { reason: 'OCR识别错误未人工复核', count: 17, pct: 12.0 },
      { reason: '接口数据异常', count: 13, pct: 9.2 },
    ],
  },
}

export const services = [
  { key: 'insurance', title: '参保状态查询', desc: '实时查询个人社保五险缴费状态及基数', gradient: 'gradient-blue', iconType: 'insurance', path: '/social-security', badge: null, amount: null, urgent: false },
  { key: 'unemployment', title: '失业金申领', desc: '申领中 · 受理号 SYJ-CQ-2026-0600387', gradient: 'gradient-green', iconType: 'unemployment', path: '/employment', badge: '审核中', amount: '¥1,890/月', urgent: false },
  { key: 'title', title: '职称申报', desc: '中级工程师 · 退件补充 · 剩7天', gradient: 'gradient-purple', iconType: 'title', path: '/talent', badge: '退件待补充', amount: null, urgent: true },
  { key: 'contract', title: '劳动合同电子签署', desc: '当前在职合同 1 份 · 区块链存证', gradient: 'gradient-orange', iconType: 'contract', path: '/labor', badge: '履行中', amount: null, urgent: false },
  { key: 'inspection', title: '劳动监察投诉', desc: '欠薪投诉 · 案件号 LDJC-CQ-2026-0500087', gradient: 'gradient-red', iconType: 'inspection', path: '/labor', badge: '处理中', amount: null, urgent: false },
  { key: 'payment', title: '社保缴费明细', desc: '近6个月缴费记录可查 · 可打印证明', gradient: 'gradient-cyan', iconType: 'payment', path: '/social-security', badge: null, amount: null, urgent: false },
]

export const renderIcon = (type: string) => {
  const c = { width: 28, height: 28, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (type) {
    case 'insurance': return <svg {...c}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
    case 'unemployment': return <svg {...c}><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 14h4"/><path d="M6 17h2"/></svg>
    case 'title': return <svg {...c}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
    case 'contract': return <svg {...c}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13l-5 5-2-2"/></svg>
    case 'inspection': return <svg {...c}><path d="M12 2l9 4v6c0 5-4 9-9 10-5-1-9-5-9-10V6z"/><path d="M9 12l2 2 4-4"/></svg>
    case 'payment': return <svg {...c}><path d="M4 2v20l6-4 6 4V2z"/><path d="M8 8h4"/><path d="M8 12h4"/></svg>
    default: return null
  }
}
