import { v4 as uuidv4 } from 'uuid';
import type {
  UserIdentity,
  DigitalCertificate,
  CityVitalSigns,
  ComplaintTicket,
  PolicyDocument,
  AtomicService,
  ParkingLot,
  Hospital,
  TrafficViolation,
  School,
} from '../../shared/types';

export const mockUsers: UserIdentity[] = [
  {
    id: 'user-001',
    name: '张三',
    idCard: '450101199001010001',
    phone: '13800138001',
    email: 'zhangsan@example.com',
    realNameVerified: true,
    faceVerified: true,
    role: 'citizen',
  },
  {
    id: 'user-002',
    name: '李四',
    idCard: '450101199002020002',
    phone: '13800138002',
    email: 'lisi@example.com',
    realNameVerified: true,
    faceVerified: true,
    role: 'citizen',
  },
  {
    id: 'admin-001',
    name: '管理员',
    idCard: '450101198001010099',
    phone: '13900139000',
    email: 'admin@example.com',
    realNameVerified: true,
    faceVerified: true,
    role: 'admin',
  },
];

export const mockCertificates: DigitalCertificate[] = [
  {
    id: uuidv4(),
    type: 'id_card',
    number: '450101199001010001',
    name: '张三',
    issueDate: '2010-01-01',
    expiryDate: '2030-01-01',
    status: 'active',
  },
  {
    id: uuidv4(),
    type: 'social_security',
    number: 'A123456789',
    name: '张三',
    issueDate: '2015-01-01',
    status: 'active',
  },
  {
    id: uuidv4(),
    type: 'driving_license',
    number: '450101199001010001',
    name: '张三',
    issueDate: '2012-06-15',
    expiryDate: '2028-06-15',
    status: 'active',
  },
  {
    id: uuidv4(),
    type: 'ebike_plate',
    number: '南宁00001',
    name: '张三',
    issueDate: '2022-03-15',
    expiryDate: '2027-03-15',
    status: 'active',
  },
];

export const mockParkingLots: ParkingLot[] = [
  {
    id: uuidv4(),
    name: '万象城停车场',
    address: '南宁市青秀区民族大道136号',
    lat: 22.8171,
    lng: 108.3669,
    totalSpaces: 2000,
    availableSpaces: 342,
    pricePerHour: 5,
    distance: 0.5,
  },
  {
    id: uuidv4(),
    name: '南宁东站停车场',
    address: '南宁市青秀区凤岭北路北侧',
    lat: 22.8512,
    lng: 108.4002,
    totalSpaces: 3000,
    availableSpaces: 856,
    pricePerHour: 6,
    distance: 2.3,
  },
  {
    id: uuidv4(),
    name: '朝阳广场地下停车场',
    address: '南宁市兴宁区朝阳路38号',
    lat: 22.8245,
    lng: 108.3167,
    totalSpaces: 800,
    availableSpaces: 45,
    pricePerHour: 8,
    distance: 1.2,
  },
  {
    id: uuidv4(),
    name: '广西医科大学第一附属医院停车场',
    address: '南宁市青秀区双拥路6号',
    lat: 22.8200,
    lng: 108.3500,
    totalSpaces: 1200,
    availableSpaces: 89,
    pricePerHour: 4,
    distance: 0.8,
  },
];

export const mockHospitals: Hospital[] = [
  {
    id: 'h001',
    name: '广西医科大学第一附属医院',
    level: '三级甲等',
    address: '南宁市青秀区双拥路6号',
    departments: [
      {
        id: 'd001',
        name: '内科',
        waitTime: 45,
        doctors: [
          { id: 'doc001', name: '王医生', title: '主任医师', available: true },
          { id: 'doc002', name: '李医生', title: '副主任医师', available: true },
        ],
      },
      {
        id: 'd002',
        name: '外科',
        waitTime: 60,
        doctors: [
          { id: 'doc003', name: '张医生', title: '主任医师', available: false },
          { id: 'doc004', name: '刘医生', title: '副主任医师', available: true },
        ],
      },
      {
        id: 'd003',
        name: '儿科',
        waitTime: 90,
        doctors: [
          { id: 'doc005', name: '陈医生', title: '主任医师', available: true },
        ],
      },
      {
        id: 'd004',
        name: '妇产科',
        waitTime: 30,
        doctors: [
          { id: 'doc006', name: '赵医生', title: '主任医师', available: true },
        ],
      },
    ],
  },
  {
    id: 'h002',
    name: '广西壮族自治区人民医院',
    level: '三级甲等',
    address: '南宁市青秀区桃源路6号',
    departments: [
      {
        id: 'd005',
        name: '心血管内科',
        waitTime: 75,
        doctors: [
          { id: 'doc007', name: '黄医生', title: '主任医师', available: true },
        ],
      },
      {
        id: 'd006',
        name: '神经内科',
        waitTime: 55,
        doctors: [
          { id: 'doc008', name: '周医生', title: '副主任医师', available: true },
        ],
      },
    ],
  },
  {
    id: 'h003',
    name: '南宁市第一人民医院',
    level: '三级甲等',
    address: '南宁市青秀区七星路89号',
    departments: [
      {
        id: 'd007',
        name: '呼吸内科',
        waitTime: 40,
        doctors: [
          { id: 'doc009', name: '吴医生', title: '主任医师', available: true },
        ],
      },
      {
        id: 'd008',
        name: '骨科',
        waitTime: 50,
        doctors: [
          { id: 'doc010', name: '郑医生', title: '副主任医师', available: true },
        ],
      },
    ],
  },
];

export const mockViolations: TrafficViolation[] = [
  {
    id: uuidv4(),
    plateNumber: '桂A12345',
    violationType: '闯红灯',
    location: '民族大道-滨湖路口',
    time: '2024-01-15 08:30:00',
    fine: 200,
    points: 6,
    status: 'unpaid',
  },
  {
    id: uuidv4(),
    plateNumber: '桂A12345',
    violationType: '违停',
    location: '青秀路',
    time: '2024-01-20 14:25:00',
    fine: 150,
    points: 0,
    status: 'unpaid',
  },
  {
    id: uuidv4(),
    plateNumber: '桂A12345',
    violationType: '超速10%以下',
    location: '环城高速',
    time: '2024-02-01 16:00:00',
    fine: 0,
    points: 0,
    status: 'paid',
  },
];

export const mockSchools: School[] = [
  { id: 's001', name: '南宁市滨湖路小学', type: 'primary', address: '南宁市青秀区滨湖路66号', district: '青秀区' },
  { id: 's002', name: '南宁市天桃实验学校', type: 'primary', address: '南宁市青秀区教育路2号', district: '青秀区' },
  { id: 's003', name: '南宁市民主路小学', type: 'primary', address: '南宁市青秀区民主路19号', district: '青秀区' },
  { id: 's004', name: '南宁市秀田小学', type: 'primary', address: '南宁市西乡塘区友爱北路30号', district: '西乡塘区' },
  { id: 's005', name: '南宁市第三中学', type: 'high', address: '南宁市青秀区铜鼓岭路12号', district: '青秀区' },
];

export const mockTickets: ComplaintTicket[] = [
  {
    id: uuidv4(),
    ticketNo: '202406150001',
    title: '民族大道井盖破损',
    content: '民族大道与滨湖路交叉口往东50米，非机动车道上有一井盖破损，存在安全隐患，请尽快处理。',
    category: 'urban_management',
    subCategory: '市政设施',
    department: '南宁市城市管理局',
    status: 'processing',
    priority: 'high',
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    ticketNo: '202406150002',
    title: 'BRT公交晚点严重',
    content: '近一周来，BRT1号线从南宁东站开往火车站方向，早高峰期间经常晚点15分钟以上，影响市民上班出行。',
    category: 'transportation',
    subCategory: '公共交通',
    department: '南宁市交通运输局',
    status: 'assigned',
    priority: 'medium',
    deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    ticketNo: '202406150003',
    title: '小区周边噪音扰民',
    content: '西乡塘区某小区周边夜市摊点夜间噪音过大，经常营业到凌晨2点以后，严重影响居民休息。',
    category: 'urban_management',
    subCategory: '噪音污染',
    department: '南宁市城市管理局',
    status: 'resolved',
    priority: 'medium',
    deadline: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    resolution: '已安排执法人员夜间巡查，对违规摊主进行了批评教育和处罚，目前情况已有改善。',
    satisfactionScore: 5,
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockPolicies: PolicyDocument[] = [
  {
    id: uuidv4(),
    title: '南宁市关于加强电动车管理的通知',
    category: 'urban_management',
    publishDate: '2024-01-15',
    content: `为进一步规范我市电动车管理，维护道路交通秩序，保障道路交通安全和畅通，根据《中华人民共和国道路交通安全法》等法律法规，结合我市实际，现就加强电动车管理有关事项通知如下：

一、严格电动车登记管理
自2024年3月1日起，新购置的电动车必须符合国家标准并取得CCC认证，方可办理注册登记。已注册登记的电动车应当按照规定定期进行安全技术检验。

二、规范电动车通行秩序
电动车应当在非机动车道内行驶，最高时速不得超过25公里/小时。禁止电动车在机动车道内行驶，禁止闯红灯、逆行、超速等违法行为。

三、加强电动车停放管理
电动车应当在规定的停车区域内有序停放，禁止在人行道、机动车道、消防通道等区域停放。对违规停放的电动车，将依法予以拖移。

四、严厉打击电动车非法营运
禁止利用电动车从事非法营运活动，对非法营运的电动车，将依法予以查处。

五、强化电动车交通安全宣传
各级各部门要加强电动车交通安全宣传教育，提高电动车驾驶人的交通安全意识和法治意识。`,
    structuredContent: [
      {
        id: 'sec1',
        title: '一、严格电动车登记管理',
        level: 1,
        content: '自2024年3月1日起，新购置的电动车必须符合国家标准并取得CCC认证，方可办理注册登记。',
        keyPoints: ['2024年3月1日起实施', '必须符合国家标准', '需取得CCC认证'],
      },
      {
        id: 'sec2',
        title: '二、规范电动车通行秩序',
        level: 1,
        content: '电动车应当在非机动车道内行驶，最高时速不得超过25公里/小时。',
        keyPoints: ['在非机动车道行驶', '最高时速25km/h', '禁止闯红灯、逆行'],
      },
      {
        id: 'sec3',
        title: '三、加强电动车停放管理',
        level: 1,
        content: '电动车应当在规定的停车区域内有序停放，禁止在人行道、机动车道、消防通道等区域停放。',
        keyPoints: ['在规定区域停放', '禁止占用消防通道', '违规停放将被拖移'],
      },
    ],
    aiInterpretation: '本政策主要针对南宁市电动车管理中存在的突出问题，从登记、通行、停放、营运四个方面进行规范。政策实施后，将有效减少电动车交通事故，提升城市交通秩序管理水平。市民需要注意的是，3月1日起新购电动车必须符合新国标才能上牌，建议购车前确认车辆是否符合标准。此外，违规停放电动车可能会被拖移，请务必遵守停放规定。',
    tags: ['电动车', '交通管理', '新规'],
  },
  {
    id: uuidv4(),
    title: '南宁市小学入学报名指导意见',
    category: 'education',
    publishDate: '2024-03-01',
    content: `根据《中华人民共和国义务教育法》和自治区教育厅有关文件精神，结合我市实际，现就做好2024年我市小学入学报名工作提出如下指导意见：

一、报名条件
（一）具有本市户籍的适龄儿童；
（二）父母双方或一方在本市居住的非本市户籍适龄儿童。

二、报名时间
2024年6月1日-6月15日，通过"爱南宁"APP或南宁市教育局官网进行网上报名。

三、报名材料
（一）本市户籍适龄儿童：户口本、父母身份证、房产证或购房合同；
（二）非本市户籍适龄儿童：户口本、父母身份证、居住证、社保缴费证明。

四、录取原则
（一）按学区划分免试就近入学；
（二）优先安排本市户籍适龄儿童；
（三）非本市户籍适龄儿童按积分高低排序。

五、时间安排
6月1日-15日：网上报名
6月20日-30日：材料审核
7月5日：公布录取结果`,
    structuredContent: [
      {
        id: 'sec1',
        title: '一、报名条件',
        level: 1,
        content: '具有本市户籍或父母一方在本市居住的适龄儿童均可报名。',
        keyPoints: ['本市户籍', '父母一方居住证明', '适龄儿童'],
      },
      {
        id: 'sec2',
        title: '二、报名时间',
        level: 1,
        content: '2024年6月1日-6月15日网上报名。',
        keyPoints: ['6月1日开始', '6月15日截止', '网上报名'],
      },
      {
        id: 'sec3',
        title: '三、报名材料',
        level: 1,
        content: '本市户籍和非本市户籍需准备不同的报名材料。',
        keyPoints: ['户口本', '身份证', '房产证/居住证', '社保证明'],
      },
    ],
    aiInterpretation: '本指导意见明确了2024年南宁市小学入学报名的具体要求。家长需要注意以下几点：1. 提前准备好相关材料，特别是房产证和社保缴费证明；2. 在规定时间内完成网上报名，逾期将不再受理；3. 非本市户籍家长需关注积分入学政策，提前积累社保和居住证年限。建议家长在报名前仔细阅读学区划分方案，确保按正确的学区报名。',
    tags: ['入学', '教育', '小学'],
  },
  {
    id: uuidv4(),
    title: '南宁市医疗保障惠民政策',
    category: 'medical',
    publishDate: '2024-02-20',
    content: `为进一步完善我市医疗保障体系，提高医疗保障水平，减轻群众医疗负担，经市人民政府同意，现就调整我市医疗保障有关政策通知如下：

一、提高门诊统筹报销比例
在职职工门诊统筹报销比例由原来的50%提高到60%，退休人员由60%提高到70%。年度最高支付限额由2000元提高到3000元。

二、扩大门诊特殊慢性病病种范围
在原有21种门诊特殊慢性病的基础上，新增阿尔茨海默病、肺动脉高压等10种慢性病，纳入门诊特殊慢性病管理。

三、降低大病保险起付线
大病保险起付线由原来的15000元降低到12000元，报销比例提高5个百分点。

四、完善异地就医直接结算
扩大异地就医直接结算定点医疗机构范围，实现普通门诊费用跨省直接结算全覆盖。

五、本通知自2024年4月1日起执行。`,
    structuredContent: [
      {
        id: 'sec1',
        title: '一、提高门诊统筹报销比例',
        level: 1,
        content: '在职职工报销比例提高到60%，退休人员提高到70%。',
        keyPoints: ['在职+10%', '退休+10%', '限额提高到3000元'],
      },
      {
        id: 'sec2',
        title: '二、扩大门诊特殊慢性病病种范围',
        level: 1,
        content: '新增阿尔茨海默病、肺动脉高压等10种慢性病。',
        keyPoints: ['新增10种慢性病', '共计31种', '减轻患者负担'],
      },
      {
        id: 'sec3',
        title: '三、降低大病保险起付线',
        level: 1,
        content: '起付线由15000元降低到12000元。',
        keyPoints: ['起付线降低3000元', '报销比例+5%', '4月1日执行'],
      },
    ],
    aiInterpretation: '本政策是南宁市2024年重要的民生保障举措，将显著减轻市民的医疗负担。主要亮点包括：1. 门诊报销比例全面提高，每年最多可多报销1000元；2. 新增10种慢性病纳入医保，惠及更多慢性病患者；3. 大病保险起付线降低，让更多重病患者能享受到大病保险待遇。政策从4月1日开始执行，建议市民关注自己的医保账户变化。',
    tags: ['医保', '惠民', '医疗'],
  },
];

export const mockAtomicServices: AtomicService[] = [
  {
    id: uuidv4(),
    serviceCode: 'brt_generate_qr',
    name: 'BRT乘车码生成',
    description: '生成BRT乘车动态二维码',
    category: 'transportation',
    endpoint: '/api/internal/brt/qrcode',
    method: 'POST',
    requestSchema: { userId: 'string' },
    responseSchema: { qrCode: 'string', expiresAt: 'timestamp' },
    isActive: true,
    createdAt: '2024-01-01',
  },
  {
    id: uuidv4(),
    serviceCode: 'hospital_query_departments',
    name: '查询医院科室',
    description: '获取指定医院的科室列表',
    category: 'medical',
    endpoint: '/api/internal/hospital/departments',
    method: 'GET',
    requestSchema: { hospitalId: 'string' },
    responseSchema: { departments: 'array' },
    isActive: true,
    createdAt: '2024-01-01',
  },
  {
    id: uuidv4(),
    serviceCode: 'school_query_district',
    name: '学区查询',
    description: '根据地址查询对应学区',
    category: 'education',
    endpoint: '/api/internal/school/district',
    method: 'GET',
    requestSchema: { address: 'string' },
    responseSchema: { schoolId: 'string', schoolName: 'string' },
    isActive: true,
    createdAt: '2024-01-01',
  },
  {
    id: uuidv4(),
    serviceCode: 'ticket_auto_classify',
    name: '工单自动分类',
    description: 'NLP自动分类工单',
    category: 'urban_management',
    endpoint: '/api/internal/nlp/classify',
    method: 'POST',
    requestSchema: { content: 'string' },
    responseSchema: { category: 'string', confidence: 'number' },
    isActive: true,
    createdAt: '2024-01-01',
  },
  {
    id: uuidv4(),
    serviceCode: 'policy_ai_interpret',
    name: '政策AI解读',
    description: '对政策文件进行AI解读',
    category: 'government',
    endpoint: '/api/internal/ai/interpret',
    method: 'POST',
    requestSchema: { policyId: 'string' },
    responseSchema: { interpretation: 'string', keyPoints: 'array' },
    isActive: true,
    createdAt: '2024-01-01',
  },
  {
    id: uuidv4(),
    serviceCode: 'parking_query_nearby',
    name: '查询附近停车场',
    description: '获取指定位置附近的停车场信息',
    category: 'transportation',
    endpoint: '/api/internal/parking/nearby',
    method: 'GET',
    requestSchema: { lat: 'number', lng: 'number', radius: 'number' },
    responseSchema: { parkingLots: 'array' },
    isActive: true,
    createdAt: '2024-01-01',
  },
  {
    id: uuidv4(),
    serviceCode: 'identity_verify_face',
    name: '人脸认证',
    description: '进行人脸识别认证',
    category: 'identity',
    endpoint: '/api/internal/identity/face-verify',
    method: 'POST',
    requestSchema: { faceImage: 'string', userId: 'string' },
    responseSchema: { verified: 'boolean', confidence: 'number' },
    isActive: true,
    createdAt: '2024-01-01',
  },
];

export function generateVitalSigns(): CityVitalSigns {
  return {
    timestamp: new Date().toISOString(),
    transportation: {
      busOnTimeRate: 85 + Math.random() * 10,
      trafficFlow: 50000 + Math.floor(Math.random() * 20000),
      parkingOccupancy: 60 + Math.random() * 30,
    },
    medical: {
      hospitalWaitTimes: {
        '内科': 30 + Math.floor(Math.random() * 60),
        '外科': 40 + Math.floor(Math.random() * 50),
        '儿科': 60 + Math.floor(Math.random() * 60),
        '急诊科': 20 + Math.floor(Math.random() * 40),
      },
      emergencyLoad: 50 + Math.random() * 40,
    },
    utilities: {
      waterUsage: 1200000 + Math.random() * 300000,
      electricityUsage: 3500000 + Math.random() * 800000,
      gasUsage: 800000 + Math.random() * 200000,
    },
    education: {
      schoolEnrollment: 85000 + Math.floor(Math.random() * 5000),
    },
    urbanManagement: {
      openTickets: 120 + Math.floor(Math.random() * 80),
      resolutionRate: 75 + Math.random() * 20,
    },
  };
}

export const mockUser = mockUsers[0];
