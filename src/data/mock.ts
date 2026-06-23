import type {
  GovernmentService, Credential, ServiceProgress, Policy,
  EnterpriseService, TransitInfo, HospitalAppointment, VenueInfo,
  GridEvent, DemographicData, AppealCategory
} from '../types';

export const governmentServices: GovernmentService[] = [
  { id: 's1', name: '新生儿出生五证联办', category: 'personal', bureau: '市卫健委/公安局/人社局', icon: 'Baby', description: '一次提交，同步办理出生医学证明、户口簿、社保卡等五项证件', processingTime: '5个工作日', visitCount: 15632, tags: ['一件事', '热门', '新生儿'], isOneStop: true },
  { id: 's2', name: '社保缴费查询与办理', category: 'personal', bureau: '市人力资源和社会保障局', icon: 'Users', description: '查询个人社保缴费记录，办理社保转移、补缴等业务', processingTime: '即时办理', visitCount: 98421, tags: ['社保', '个人'] },
  { id: 's3', name: '公积金提取申请', category: 'personal', bureau: '市住房公积金管理中心', icon: 'Home', description: '购房、租房、退休等多种情形的公积金提取办理', processingTime: '3个工作日', visitCount: 54312, tags: ['公积金', '住房'] },
  { id: 's4', name: '居民医保参保登记', category: 'personal', bureau: '市医疗保障局', icon: 'Heart', description: '城乡居民基本医疗保险参保登记、信息变更', processingTime: '即时办理', visitCount: 32156, tags: ['医保', '医疗'] },
  { id: 's5', name: '不动产登记查询', category: 'personal', bureau: '市自然资源和规划局', icon: 'Landmark', description: '个人名下不动产登记信息查询、打印证明', processingTime: '即时办理', visitCount: 28934, tags: ['不动产', '房产'] },
  { id: 's6', name: '驾驶证期满换证', category: 'personal', bureau: '市公安局交通警察支队', icon: 'Car', description: '机动车驾驶证有效期满换证、遗失补办', processingTime: '1个工作日', visitCount: 18723, tags: ['交管', '证件'] },
  { id: 's7', name: '义务教育入学报名', category: 'personal', bureau: '市教育局', icon: 'GraduationCap', description: '小学、初中新生入学网上报名与学位分配', processingTime: '7个工作日', visitCount: 45632, tags: ['教育', '入学'] },
  { id: 's8', name: '户籍迁移办理', category: 'personal', bureau: '市公安局', icon: 'FileCheck', description: '市内迁移、市外迁入、迁出等户籍业务办理', processingTime: '3个工作日', visitCount: 12845, tags: ['户籍', '公安'] },
  { id: 'e1', name: '企业开办一窗通', category: 'enterprise', bureau: '市市场监督管理局', icon: 'Building2', description: '企业设立登记、印章刻制、银行开户一站式办理', processingTime: '0.5个工作日', visitCount: 8932, tags: ['一件事', '开办企业'], isOneStop: true },
  { id: 'e2', name: '企业注销简易办理', category: 'enterprise', bureau: '市市场监督管理局', icon: 'FileX', description: '符合条件的企业简易注销登记，公示期20天', processingTime: '20天公示', visitCount: 3421, tags: ['注销', '市场监管'] },
  { id: 'e3', name: '惠企补贴申报', category: 'enterprise', bureau: '市工业和信息化局', icon: 'Gift', description: '稳岗补贴、技改补贴、研发补贴等多项政策申报', processingTime: '10个工作日', visitCount: 12453, tags: ['补贴', '惠企'] },
  { id: 'e4', name: '工程建设项目审批', category: 'enterprise', bureau: '市建设局', icon: 'HardHat', description: '工程建设项目从立项到竣工验收全流程审批', processingTime: '45个工作日', visitCount: 2341, tags: ['建设', '工程'] },
  { id: 'e5', name: '税务申报与缴纳', category: 'enterprise', bureau: '市税务局', icon: 'Receipt', description: '增值税、企业所得税等税种申报缴纳', processingTime: '即时办理', visitCount: 34521, tags: ['税务', '申报'] },
  { id: 'e6', name: '食品经营许可证办理', category: 'enterprise', bureau: '市市场监督管理局', icon: 'Utensils', description: '食品销售、餐饮服务等经营许可新办、变更', processingTime: '7个工作日', visitCount: 5632, tags: ['许可', '食安'] },
  { id: 'l1', name: '公交地铁实时查询', category: 'life', bureau: '市交通运输局', icon: 'Bus', description: '公交地铁实时到站信息、线路换乘方案查询', processingTime: '即时', visitCount: 234561, tags: ['出行', '公共交通'] },
  { id: 'l2', name: '医院预约挂号', category: 'life', bureau: '市卫生健康委员会', icon: 'Stethoscope', description: '全市三级医院预约挂号、候诊提醒、报告查询', processingTime: '即时', visitCount: 123456, tags: ['医疗', '挂号'] },
  { id: 'l3', name: '文体场馆预约', category: 'life', bureau: '市文化和旅游局', icon: 'Ticket', description: '图书馆、博物馆、体育场馆预约使用', processingTime: '即时', visitCount: 67832, tags: ['文化', '体育'] },
  { id: 'l4', name: '市民卡服务', category: 'life', bureau: '市民卡服务中心', icon: 'CreditCard', description: '市民卡充值、挂失、补办、功能开通', processingTime: '即时-3工作日', visitCount: 89231, tags: ['市民卡', '便民'] },
];

export const credentials: Credential[] = [
  { id: 'c1', name: '居民身份证', type: 'id_card', number: '3502**********1234', issuer: '厦门市公安局', issueDate: '2020-03-15', expiryDate: '2040-03-14', status: 'valid' },
  { id: 'c2', name: '社会保障卡', type: 'social_security', number: '350201*****6789', issuer: '厦门市人力资源和社会保障局', issueDate: '2015-08-01', expiryDate: '长期', status: 'valid' },
  { id: 'c3', name: '机动车驾驶证', type: 'driver_license', number: '3502**********5678', issuer: '厦门市公安局交通警察支队', issueDate: '2018-06-20', expiryDate: '2024-06-19', status: 'expiring' },
  { id: 'c4', name: '不动产权证书', type: 'household', number: '闽(2021)厦门市不动产权第0012345号', issuer: '厦门市自然资源和规划局', issueDate: '2021-11-30', expiryDate: '长期', status: 'valid' },
  { id: 'c5', name: '基本医疗保险参保证明', type: 'social_security', number: 'YB2024010012345', issuer: '厦门市医疗保障局', issueDate: '2024-01-01', expiryDate: '2024-12-31', status: 'valid' },
  { id: 'c6', name: '婚姻登记证', type: 'marriage', number: 'J350201-2020-001234', issuer: '思明区民政局', issueDate: '2020-05-20', expiryDate: '长期', status: 'valid' },
];

export const serviceProgress: ServiceProgress[] = [
  {
    id: 'p1',
    serviceName: '新生儿出生五证联办',
    applicationNo: 'WS20240615001234',
    status: 'reviewing',
    submittedAt: '2024-06-15 09:30',
    estimatedDate: '2024-06-20',
    currentStep: 2,
    totalSteps: 5,
    steps: [
      { name: '提交申请', status: 'completed', time: '2024-06-15 09:30' },
      { name: '卫健委审核出生材料', status: 'current', time: '2024-06-15 14:20' },
      { name: '公安局办理户口登记', status: 'pending' },
      { name: '人社局制作社保卡', status: 'pending' },
      { name: '所有证件寄出', status: 'pending' },
    ],
    bureau: '市卫健委',
  },
  {
    id: 'p2',
    serviceName: '公积金提取申请（购房）',
    applicationNo: 'GJJ20240610005678',
    status: 'approved',
    submittedAt: '2024-06-10 15:42',
    estimatedDate: '2024-06-13',
    currentStep: 4,
    totalSteps: 4,
    steps: [
      { name: '在线填写申请', status: 'completed', time: '2024-06-10 15:42' },
      { name: '自动核验购房信息', status: 'completed', time: '2024-06-10 15:45' },
      { name: '中心审批', status: 'completed', time: '2024-06-11 10:15' },
      { name: '款项划转', status: 'completed', time: '2024-06-12 09:00' },
    ],
    bureau: '市住房公积金管理中心',
  },
  {
    id: 'p3',
    serviceName: '义务教育入学报名',
    applicationNo: 'JY20240520009876',
    status: 'completed',
    submittedAt: '2024-05-20 10:08',
    estimatedDate: '2024-06-30',
    currentStep: 5,
    totalSteps: 5,
    steps: [
      { name: '网上报名', status: 'completed', time: '2024-05-20 10:08' },
      { name: '材料核验', status: 'completed', time: '2024-05-28 16:00' },
      { name: '学区派位', status: 'completed', time: '2024-06-15 09:00' },
      { name: '学校确认', status: 'completed', time: '2024-06-20 14:30' },
      { name: '录取完成', status: 'completed', time: '2024-06-25 10:00' },
    ],
    bureau: '市教育局',
  },
  {
    id: 'p4',
    serviceName: '驾驶证期满换证',
    applicationNo: 'JT20240618003456',
    status: 'submitted',
    submittedAt: '2024-06-18 11:20',
    estimatedDate: '2024-06-19',
    currentStep: 1,
    totalSteps: 3,
    steps: [
      { name: '提交申请与体检报告', status: 'current', time: '2024-06-18 11:20' },
      { name: '车管所制证', status: 'pending' },
      { name: '证件送达', status: 'pending' },
    ],
    bureau: '市公安局交警支队',
  },
];

export const policies: Policy[] = [
  { id: 'po1', title: '关于发放2024年度稳岗返还补贴的通知', category: '就业创业', issuer: '市人力资源和社会保障局', publishDate: '2024-06-10', matchingScore: 98, summary: '对符合条件的参保企业按上年度实际缴纳失业保险费的60%予以稳岗返还，中小微企业比例提高至90%。', tags: ['稳岗', '企业', '补贴'] },
  { id: 'po2', title: '厦门市进一步支持高校毕业生来厦就业若干措施', category: '就业创业', issuer: '市人民政府办公厅', publishDate: '2024-05-28', matchingScore: 95, summary: '对新引进的应届博士、硕士、本科毕业生分别给予8万元、5万元、3万元生活补贴。', tags: ['人才', '毕业生', '补贴'] },
  { id: 'po3', title: '厦门市2024年住房公积金缴存基数调整通知', category: '住房保障', issuer: '市住房公积金管理中心', publishDate: '2024-06-01', matchingScore: 92, summary: '2024年度住房公积金缴存基数上限调整为32,160元，下限为2,242元。', tags: ['公积金', '缴存'] },
  { id: 'po4', title: '关于做好2024年度城乡居民基本医疗保险参保缴费工作的通知', category: '社会保障', issuer: '市医疗保障局', publishDate: '2024-05-15', matchingScore: 90, summary: '2024年城乡居民医保个人缴费标准为每人每年430元，财政补助标准为每人每年780元。', tags: ['医保', '缴费'] },
  { id: 'po5', title: '厦门市2024年积分入学工作方案', category: '教育服务', issuer: '市教育局', publishDate: '2024-04-20', matchingScore: 88, summary: '明确随迁子女申请入读本区小学一年级或初中一年级的条件、程序及积分计算办法。', tags: ['教育', '入学', '积分'] },
  { id: 'po6', title: '关于印发厦门市中小企业纾困专项资金管理办法的通知', category: '惠企政策', issuer: '市工业和信息化局', publishDate: '2024-06-05', matchingScore: 85, summary: '设立20亿元纾困专项资金，对符合条件的中小微企业给予贷款贴息和担保支持。', tags: ['纾困', '中小微', '融资'] },
];

export const enterpriseServices: EnterpriseService[] = [
  {
    id: 'es1',
    name: '开办内资有限公司',
    type: 'establish',
    description: '适用于由2-50名股东出资设立的有限责任公司，含名称自主申报、设立登记、印章刻制备案、银行预约开户、员工参保登记、公积金开户登记、税务信息确认等环节。',
    duration: '0.5个工作日',
    steps: [
      { title: '企业名称自主申报', desc: '拟定企业名称，通过名称自主申报系统查重确认', required: true, bureau: '市市场监督管理局' },
      { title: '提交设立登记材料', desc: '填写公司章程、股东会决议、任职文件等并上传', required: true, bureau: '市市场监督管理局' },
      { title: '电子签名确认', desc: '全体股东、法定代表人通过厦门商事登记电子签名确认', required: true },
      { title: '领取营业执照', desc: '通过EMS邮寄送达或至窗口领取纸质执照', required: true },
      { title: '刻制印章及备案', desc: '公安备案公章、财务章、法人章等', required: true, bureau: '市公安局' },
      { title: '银行预约开户', desc: '选择开户银行并完成企业账户预约', required: false },
      { title: '员工社保登记', desc: '为职工办理社保增员登记', required: false, bureau: '市人社局' },
      { title: '税务信息确认', desc: '完成税种核定、发票申请等涉税事项', required: true, bureau: '市税务局' },
    ],
    requiredMaterials: [
      '全体股东身份证明文件',
      '公司法定代表人任职文件及身份证明',
      '公司章程（全体股东签署）',
      '公司住所使用证明',
      '股东会决议/股东决定',
    ],
  },
  {
    id: 'es2',
    name: '企业简易注销登记',
    type: 'cancel',
    description: '未发生债权债务或已将债权债务清偿完结的市场主体，可申请简易注销，公示期20天。',
    duration: '20天公示 + 1天核准',
    steps: [
      { title: '简易注销公示', desc: '通过国家企业信用信息公示系统发布简易注销公告，公示期20天', required: true },
      { title: '办理税务注销', desc: '向税务部门申请税务清税申报，获取《清税证明》', required: true, bureau: '市税务局' },
      { title: '银行账户销户', desc: '注销企业银行结算账户', required: false },
      { title: '提交注销申请', desc: '公示期满无异议后提交注销登记申请', required: true, bureau: '市市场监督管理局' },
      { title: '缴销印章与证件', desc: '将营业执照正副本、印章等缴回', required: true },
    ],
    requiredMaterials: [
      '《企业注销登记申请书》',
      '《全体投资人承诺书》',
      '营业执照正副本',
      '公章、财务章等印章',
      '税务部门清税证明',
    ],
  },
  {
    id: 'es3',
    name: '企业技术改造补贴申报',
    type: 'subsidy',
    description: '对符合条件的工业企业技术改造项目，按设备投资额的一定比例给予补贴支持。',
    duration: '10个工作日',
    steps: [
      { title: '项目备案', desc: '通过厦门投资项目在线审批监管平台完成技改项目备案', required: true, bureau: '市工信局' },
      { title: '在线填报申请', desc: '填写补贴申报表，上传项目相关材料', required: true },
      { title: '部门初审', desc: '工信部门对申报材料进行初审', required: true, bureau: '市工信局' },
      { title: '第三方评审', desc: '委托第三方机构对项目投资、合规性进行核查', required: true },
      { title: '联合审核', desc: '工信局会同财政局联合审核并确定拟补贴名单', required: true },
      { title: '社会公示', desc: '拟补贴名单在官方网站公示5个工作日', required: true },
      { title: '资金拨付', desc: '公示无异议后下达资金计划并拨付补贴款项', required: true, bureau: '市财政局' },
    ],
    requiredMaterials: [
      '企业营业执照',
      '技改项目备案证',
      '设备采购合同及发票',
      '项目投资凭证',
      '企业信用报告',
      '申报年度财务审计报告',
    ],
  },
];

export const transitInfos: TransitInfo[] = [
  { id: 't1', line: '地铁1号线', station: '镇海路站', direction: '往岩内方向', nextArrival: 2, nextNextArrival: 8, status: 'normal' },
  { id: 't2', line: '地铁2号线', station: '湖滨东路站', direction: '往天竺山方向', nextArrival: 4, nextNextArrival: 10, status: 'normal' },
  { id: 't3', line: '地铁3号线', station: '厦门火车站', direction: '往蔡厝方向', nextArrival: 1, nextNextArrival: 6, status: 'normal' },
  { id: 't4', line: '公交1路', station: '中山路站', direction: '往火车站南广场', nextArrival: 3, nextNextArrival: 12, status: 'normal' },
  { id: 't5', line: '公交29路', station: '软件园站', direction: '往第一码头', nextArrival: 6, nextNextArrival: 15, status: 'delay' },
  { id: 't6', line: 'BRT快1路', station: '思北站', direction: '往前场枢纽站', nextArrival: 1, nextNextArrival: 4, status: 'normal' },
];

export const hospitalAppointments: HospitalAppointment[] = [
  {
    id: 'h1',
    hospital: '厦门大学附属第一医院',
    level: '三甲',
    department: '内分泌糖尿病科',
    doctor: '张主任',
    title: '主任医师',
    date: '2024-06-19',
    timeSlots: [
      { time: '08:00-08:30', available: 0, total: 5 },
      { time: '08:30-09:00', available: 1, total: 5 },
      { time: '09:00-09:30', available: 2, total: 5 },
      { time: '09:30-10:00', available: 3, total: 5 },
      { time: '10:00-10:30', available: 1, total: 5 },
      { time: '14:30-15:00', available: 4, total: 5 },
    ],
    fee: 50,
  },
  {
    id: 'h2',
    hospital: '中山医院',
    level: '三甲',
    department: '心血管内科',
    doctor: '李教授',
    title: '副主任医师',
    date: '2024-06-19',
    timeSlots: [
      { time: '08:00-08:30', available: 2, total: 5 },
      { time: '08:30-09:00', available: 3, total: 5 },
      { time: '09:00-09:30', available: 0, total: 5 },
      { time: '14:30-15:00', available: 5, total: 5 },
      { time: '15:00-15:30', available: 2, total: 5 },
    ],
    fee: 40,
  },
  {
    id: 'h3',
    hospital: '厦门市中医院',
    level: '三甲',
    department: '针灸康复科',
    doctor: '陈医师',
    title: '主治医师',
    date: '2024-06-20',
    timeSlots: [
      { time: '08:00-09:00', available: 5, total: 8 },
      { time: '09:00-10:00', available: 3, total: 8 },
      { time: '10:00-11:00', available: 6, total: 8 },
      { time: '15:00-16:00', available: 7, total: 8 },
    ],
    fee: 30,
  },
];

export const venueInfos: VenueInfo[] = [
  { id: 'v1', name: '厦门市图书馆（文化艺术中心馆）', type: 'library', address: '思明区体育路95号', capacity: 2500, currentUsage: 1876, todayOpening: '09:00-21:00' },
  { id: 'v2', name: '厦门市体育中心综合馆', type: 'gym', address: '思明区湖滨东路408号', capacity: 800, currentUsage: 320, todayOpening: '06:00-22:00' },
  { id: 'v3', name: '厦门市博物馆', type: 'museum', address: '思明区体育路文化艺术中心', capacity: 1000, currentUsage: 456, todayOpening: '09:00-17:00' },
  { id: 'v4', name: '海沧体育中心游泳馆', type: 'stadium', address: '海沧区兴港路2012号', capacity: 300, currentUsage: 245, todayOpening: '06:30-21:30' },
  { id: 'v5', name: '思明区厦港街道综合文化站', type: 'community', address: '思明区大学路160号', capacity: 200, currentUsage: 58, todayOpening: '08:30-20:00' },
  { id: 'v6', name: '厦门市少年儿童图书馆', type: 'library', address: '思明区后埭溪路140号', capacity: 600, currentUsage: 412, todayOpening: '09:00-19:00' },
];

export const gridEvents: GridEvent[] = [
  { id: 'ge1', title: '湖滨南路路面井盖破损', type: 'infrastructure', level: 'high', location: '思明区湖滨南路与豆仔尾路交叉口', reporter: '网格员-王小明', reportTime: '2024-06-19 08:15', status: 'processing', handler: '市政园林局-李工', progress: 60 },
  { id: 'ge2', title: '小区楼道杂物堆积', type: 'environmental', level: 'low', location: '思明区莲前街道瑞景新村12号楼3单元', reporter: '居民-陈女士', reportTime: '2024-06-19 07:42', status: 'resolved', handler: '莲前街道办-张网格员', progress: 100 },
  { id: 'ge3', title: '路口交通信号灯故障', type: 'traffic', level: 'urgent', location: '湖里区枋湖路与枋湖东路交叉口', reporter: '群众举报', reportTime: '2024-06-19 09:30', status: 'processing', handler: '交警支队设施科', progress: 30 },
  { id: 'ge4', title: '邻里装修噪音扰民', type: 'civil', level: 'medium', location: '集美区杏林街道园博二里', reporter: '居民-林先生', reportTime: '2024-06-19 08:00', status: 'pending', handler: '待分派', progress: 0 },
  { id: 'ge5', title: '消防通道被车辆占用', type: 'safety', level: 'high', location: '海沧区嵩屿街道未来海岸5号门', reporter: '网格员-刘芳', reportTime: '2024-06-19 06:55', status: 'processing', handler: '消防大队-陈参谋', progress: 75 },
  { id: 'ge6', title: '公园绿化植被枯死', type: 'environmental', level: 'low', location: '翔安区新店街道祥福儿童公园', reporter: '市民巡访团', reportTime: '2024-06-18 16:20', status: 'closed', handler: '翔安区市政园林局', progress: 100 },
];

export const demographicData: DemographicData[] = [
  { ageGroup: '0-17岁', male: 18420, female: 16850 },
  { ageGroup: '18-35岁', male: 52340, female: 48670 },
  { ageGroup: '36-59岁', male: 68920, female: 65430 },
  { ageGroup: '60-79岁', male: 23450, female: 25120 },
  { ageGroup: '80岁以上', male: 5680, female: 7890 },
];

export const appealCategories: AppealCategory[] = [
  { category: '环境卫生', count: 245 },
  { category: '交通出行', count: 198 },
  { category: '民生保障', count: 176 },
  { category: '城市管理', count: 154 },
  { category: '教育服务', count: 132 },
  { category: '医疗健康', count: 118 },
  { category: '物业服务', count: 105 },
  { category: '其他诉求', count: 89 },
];

export const monthlyAppealTrend = [
  { month: '1月', count: 980, resolved: 920 },
  { month: '2月', count: 850, resolved: 810 },
  { month: '3月', count: 1120, resolved: 1050 },
  { month: '4月', count: 1080, resolved: 1020 },
  { month: '5月', count: 1180, resolved: 1110 },
  { month: '6月', count: 1217, resolved: 1052 },
];

export const serviceBureauStats = [
  { bureau: '市人社局', services: 186, visits: 128450 },
  { bureau: '市医保局', services: 142, visits: 98320 },
  { bureau: '市公积金中心', services: 68, visits: 87650 },
  { bureau: '市公安局', services: 215, visits: 76540 },
  { bureau: '市税务局', services: 95, visits: 65430 },
  { bureau: '市教育局', services: 78, visits: 54320 },
  { bureau: '市卫健委', services: 124, visits: 48900 },
  { bureau: '市资源规划局', services: 88, visits: 42180 },
];
