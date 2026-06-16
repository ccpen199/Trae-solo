import { v4 as uuidv4 } from 'uuid';
import type {
  UserIdentity,
  DigitalCertificate,
  CityVitalSigns,
  ComplaintTicket,
  PolicyDocument,
  PolicyPushRecord,
  AtomicService,
  ParkingLot,
  Hospital,
  Doctor,
  AppointmentRecord,
  TrafficViolation,
  School,
  SchoolDistrictResult,
  BRTTravelRecord,
  TicketLog,
  EnrollmentApplication,
  DispatchRule,
  DepartmentStats,
  DepartmentReceipt,
  DataAuditInfo,
  TransportationDashboardData,
  BusOnTimeTrendItem,
  BusRouteRankingItem,
  TrafficHeatmapItem,
  BRTPassengerStats,
  MedicalDashboardData,
  HospitalWaitHeatmapItem,
  HospitalEmergencyLoadItem,
  AppointmentStatsItem,
  UtilitiesDashboardData,
  UtilitiesDetailItem,
  UtilitiesComparison,
  GovernmentDashboardData,
  TicketCategoryItem,
  ClassificationAccuracyTrendItem,
  DepartmentEfficiencyItem,
  TicketStatusItem,
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
    role: 'clerk',
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
    id: 'cert-id-card-001',
    type: 'id_card',
    number: '450101199001010001',
    name: '张三',
    issueDate: '2010-01-01',
    expiryDate: '2030-01-01',
    status: 'active',
    metadata: {
      性别: '男',
      民族: '汉族',
      出生日期: '1990-01-01',
      住址: '南宁市青秀区滨湖路66号',
      签发机关: '南宁市公安局青秀分局',
      公民身份号码: '450101199001010001',
    },
  },
  {
    id: 'cert-social-001',
    type: 'social_security',
    number: 'A123456789',
    name: '张三',
    issueDate: '2015-01-01',
    status: 'active',
    metadata: {
      社保卡号: 'A123456789',
      医保卡号: 'YB987654321',
      参保状态: '正常参保',
      缴费基数: '5000元',
      所属单位: '南宁市某某有限公司',
      个人账户余额: '2580.50元',
    },
  },
  {
    id: 'cert-driving-001',
    type: 'driving_license',
    number: '450101199001010001',
    name: '张三',
    issueDate: '2012-06-15',
    expiryDate: '2028-06-15',
    status: 'active',
    metadata: {
      准驾车型: 'C1',
      初次领证日期: '2012-06-15',
      有效期开始: '2022-06-15',
      有效期截止: '2028-06-15',
      发证机关: '南宁市公安局交通警察支队',
      累积记分: '3分',
      状态: '正常',
    },
  },
  {
    id: 'cert-vehicle-001',
    type: 'vehicle_license',
    number: '桂A12345',
    name: '张三',
    issueDate: '2020-03-20',
    expiryDate: '2026-03-20',
    status: 'active',
    metadata: {
      号牌号码: '桂A12345',
      车辆类型: '小型轿车',
      品牌型号: '大众汽车牌SVW71612GH',
      车辆识别代号: 'LFV2A2151D3012345',
      发动机号码: '123456',
      注册日期: '2020-03-20',
      发证日期: '2020-03-20',
      使用性质: '非营运',
      检验有效期至: '2026-03-31',
    },
  },
  {
    id: 'cert-ebike-001',
    type: 'ebike_plate',
    number: '南宁00001',
    name: '张三',
    issueDate: '2022-03-15',
    expiryDate: '2027-03-15',
    status: 'active',
    metadata: {
      号牌号码: '南宁00001',
      车辆类型: '电动自行车',
      品牌型号: '爱玛 TDT123Z',
      整车编码: '123456789012345',
      电机编号: 'MOTOR123456',
      颜色: '白色',
      注册日期: '2022-03-15',
      有效期至: '2027-03-15',
    },
  },
];

export const mockParkingLots: ParkingLot[] = [
  {
    id: 'park-001',
    name: '万象城停车场',
    address: '南宁市青秀区民族大道136号',
    lat: 22.8171,
    lng: 108.3669,
    totalSpaces: 2000,
    availableSpaces: 342,
    pricePerHour: 5,
    distance: 0.5,
    phone: '0771-1234567',
    openHours: '全天24小时',
    parkingType: '地下停车场',
    facilities: ['充电桩', '洗车服务', '无障碍车位', '母婴车位'],
    rating: 4.8,
    reviews: 2568,
  },
  {
    id: 'park-002',
    name: '南宁东站停车场',
    address: '南宁市青秀区凤岭北路北侧',
    lat: 22.8512,
    lng: 108.4002,
    totalSpaces: 3000,
    availableSpaces: 856,
    pricePerHour: 6,
    distance: 2.3,
    phone: '0771-2345678',
    openHours: '全天24小时',
    parkingType: '室内+室外',
    facilities: ['充电桩', '24小时安保', '行李寄存', '便利店'],
    rating: 4.5,
    reviews: 1892,
  },
  {
    id: 'park-003',
    name: '朝阳广场地下停车场',
    address: '南宁市兴宁区朝阳路38号',
    lat: 22.8245,
    lng: 108.3167,
    totalSpaces: 800,
    availableSpaces: 45,
    pricePerHour: 8,
    distance: 1.2,
    phone: '0771-3456789',
    openHours: '06:00 - 24:00',
    parkingType: '地下停车场',
    facilities: ['充电桩', '洗车服务', '智能寻车'],
    rating: 4.2,
    reviews: 956,
  },
  {
    id: 'park-004',
    name: '广西医科大学第一附属医院停车场',
    address: '南宁市青秀区双拥路6号',
    lat: 22.8200,
    lng: 108.3500,
    totalSpaces: 1200,
    availableSpaces: 89,
    pricePerHour: 4,
    distance: 0.8,
    phone: '0771-4567890',
    openHours: '全天24小时',
    parkingType: '室内停车场',
    facilities: ['无障碍车位', '母婴车位', '电梯直达', '便利店'],
    rating: 4.0,
    reviews: 3241,
  },
  {
    id: 'park-005',
    name: '青秀山风景区停车场',
    address: '南宁市青秀区青秀山风景区东门',
    lat: 22.8050,
    lng: 108.3850,
    totalSpaces: 1500,
    availableSpaces: 620,
    pricePerHour: 3,
    distance: 3.5,
    phone: '0771-5678901',
    openHours: '07:00 - 22:00',
    parkingType: '室外停车场',
    facilities: ['充电桩', '遮阳棚', '厕所', '便利店'],
    rating: 4.6,
    reviews: 1456,
  },
  {
    id: 'park-006',
    name: '江南万达广场停车场',
    address: '南宁市江南区亭洪路48号',
    lat: 22.7950,
    lng: 108.3100,
    totalSpaces: 2500,
    availableSpaces: 980,
    pricePerHour: 4,
    distance: 4.2,
    phone: '0771-6789012',
    openHours: '全天24小时',
    parkingType: '地下停车场',
    facilities: ['充电桩', '洗车服务', '智能寻车', '母婴车位'],
    rating: 4.7,
    reviews: 2103,
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
    id: 'violation-001',
    plateNumber: '桂A12345',
    violationType: '闯红灯',
    location: '民族大道-滨湖路口',
    time: '2024-01-15 08:30:00',
    fine: 200,
    points: 6,
    status: 'unpaid',
    description: '驾驶机动车违反道路交通信号灯通行',
    cameraLocation: '滨湖路口东向西方向电子警察',
  },
  {
    id: 'violation-002',
    plateNumber: '桂A12345',
    violationType: '违停',
    location: '青秀路',
    time: '2024-01-20 14:25:00',
    fine: 150,
    points: 0,
    status: 'unpaid',
    description: '在设有禁停标志、标线的路段，在机动车道与非机动车道、人行道之间设有隔离设施的路段以及人行横道、施工地段停车',
    cameraLocation: '青秀路中段违停抓拍球机',
  },
  {
    id: 'violation-003',
    plateNumber: '桂A12345',
    violationType: '超速10%以下',
    location: '环城高速',
    time: '2024-02-01 16:00:00',
    fine: 0,
    points: 0,
    status: 'paid',
    description: '驾驶中型以上载客载货汽车、危险物品运输车辆以外的机动车超过规定时速10%以下的',
    cameraLocation: '环城高速K25+500处测速点',
  },
  {
    id: 'violation-004',
    plateNumber: '桂A12345',
    violationType: '不按导向车道行驶',
    location: '朝阳路-人民路口',
    time: '2024-02-10 09:15:00',
    fine: 100,
    points: 2,
    status: 'unpaid',
    description: '通过有灯控路口时，不按所需行进方向驶入导向车道',
    cameraLocation: '人民路口南向北方向电子警察',
  },
  {
    id: 'violation-005',
    plateNumber: '桂A12345',
    violationType: '未系安全带',
    location: '民族大道-古城路口',
    time: '2024-02-15 11:30:00',
    fine: 50,
    points: 1,
    status: 'paid',
    description: '驾驶人未按规定使用安全带',
    cameraLocation: '古城路口西向东方向电子警察',
  },
];

export const mockBRTTravelRecords: BRTTravelRecord[] = [
  {
    id: 'brt-record-001',
    routeName: 'BRT1号线',
    startStation: '南宁东站',
    endStation: '朝阳广场站',
    startTime: '2024-06-15 08:00:00',
    endTime: '2024-06-15 08:35:00',
    fare: 2.0,
    status: 'completed',
    paymentMethod: '电子钱包',
  },
  {
    id: 'brt-record-002',
    routeName: 'BRT1号线',
    startStation: '朝阳广场站',
    endStation: '民族影城站',
    startTime: '2024-06-14 18:30:00',
    endTime: '2024-06-14 18:50:00',
    fare: 2.0,
    status: 'completed',
    paymentMethod: '电子钱包',
  },
  {
    id: 'brt-record-003',
    routeName: 'BRT2号线',
    startStation: '五象湖站',
    endStation: '玉洞站',
    startTime: '2024-06-13 09:15:00',
    endTime: '2024-06-13 09:40:00',
    fare: 2.0,
    status: 'completed',
    paymentMethod: '电子钱包',
  },
  {
    id: 'brt-record-004',
    routeName: 'BRT1号线',
    startStation: '万象城站',
    endStation: '滨湖路站',
    startTime: '2024-06-12 07:45:00',
    endTime: '2024-06-12 08:00:00',
    fare: 2.0,
    status: 'completed',
    paymentMethod: '电子钱包',
  },
  {
    id: 'brt-record-005',
    routeName: 'BRT1号线',
    startStation: '火车站',
    endStation: '南宁东站',
    startTime: '2024-06-10 14:00:00',
    endTime: '2024-06-10 14:40:00',
    fare: 2.0,
    status: 'refunded',
    paymentMethod: '电子钱包',
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

export const mockAppointments: AppointmentRecord[] = [
  {
    id: 'appt-001',
    hospitalId: 'h001',
    hospitalName: '广西医科大学第一附属医院',
    departmentId: 'd001',
    departmentName: '内科',
    doctorId: 'doc001',
    doctorName: '王医生',
    doctorTitle: '主任医师',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '09:00',
    status: 'pending',
    appointmentNo: 'YY202406170001',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'appt-002',
    hospitalId: 'h002',
    hospitalName: '广西壮族自治区人民医院',
    departmentId: 'd005',
    departmentName: '心血管内科',
    doctorId: 'doc007',
    doctorName: '黄医生',
    doctorTitle: '主任医师',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '10:30',
    status: 'completed',
    appointmentNo: 'YY202406120002',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'appt-003',
    hospitalId: 'h001',
    hospitalName: '广西医科大学第一附属医院',
    departmentId: 'd003',
    departmentName: '儿科',
    doctorId: 'doc005',
    doctorName: '陈医生',
    doctorTitle: '主任医师',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '14:00',
    status: 'cancelled',
    appointmentNo: 'YY202406080003',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockTicketLogs: Record<string, TicketLog[]> = {
  '202406150001': [
    {
      id: 'log-001',
      ticketId: '202406150001',
      action: 'submit',
      description: '市民提交诉求',
      operator: '张三',
      department: '市民',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-002',
      ticketId: '202406150001',
      action: 'classify',
      description: 'AI智能分类为市政设施类',
      operator: '系统',
      department: 'AI分类系统',
      timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-003',
      ticketId: '202406150001',
      action: 'assign',
      description: '分派至南宁市城市管理局市政科',
      operator: '李科长',
      department: '南宁市城市管理局',
      timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-004',
      ticketId: '202406150001',
      action: 'process',
      description: '已安排维修人员前往现场处理',
      operator: '王师傅',
      department: '市政设施维护队',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
  ],
};

export const mockPolicyPushRecords: PolicyPushRecord[] = [
  {
    id: 'push-001',
    policyId: 'policy-001',
    policyTitle: '南宁市关于加强电动车管理的通知',
    category: 'urban_management',
    pushTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    pushType: 'system',
    read: false,
  },
  {
    id: 'push-002',
    policyId: 'policy-002',
    policyTitle: '南宁市小学入学报名指导意见',
    category: 'education',
    pushTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    pushType: 'subscription',
    read: true,
  },
  {
    id: 'push-003',
    policyId: 'policy-003',
    policyTitle: '南宁市医疗保障惠民政策',
    category: 'medical',
    pushTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    pushType: 'recommendation',
    read: true,
  },
];

export function getSchoolByAddress(address: string): SchoolDistrictResult | null {
  if (!address || address.length < 2) return null;
  
  const districts = ['青秀区', '西乡塘区', '兴宁区', '江南区', '良庆区', '邕宁区'];
  let matchedDistrict = '青秀区';
  
  for (const district of districts) {
    if (address.includes(district)) {
      matchedDistrict = district;
      break;
    }
  }
  
  const districtSchools = mockSchools.filter(s => s.district === matchedDistrict && s.type === 'primary');
  if (districtSchools.length === 0) {
    return {
      schoolId: 's001',
      schoolName: '南宁市滨湖路小学',
      schoolType: 'primary',
      distance: 0.8,
      address: '南宁市青秀区滨湖路66号',
      district: '青秀区',
      enrollmentQuota: 450,
    };
  }
  
  const school = districtSchools[0];
  return {
    schoolId: school.id,
    schoolName: school.name,
    schoolType: school.type,
    distance: Math.round((0.5 + Math.random() * 2) * 10) / 10,
    address: school.address,
    district: school.district,
    enrollmentQuota: 400 + Math.floor(Math.random() * 200),
  };
}

export const mockEnrollmentGuidelines = {
  title: '2024年南宁市小学入学报名指南',
  content: '凡年满6周岁（2018年8月31日前出生），具有本市户籍或父母一方持有本市居住证的适龄儿童，均可申请报名。',
  timeline: [
    { date: '6月1日-15日', event: '网上报名' },
    { date: '6月20日-30日', event: '材料审核' },
    { date: '7月5日', event: '公布录取结果' },
    { date: '7月10日-15日', event: '新生注册' },
    { date: '9月1日', event: '正式开学' },
  ],
  requiredDocuments: [
    '户口本（父母及子女）',
    '父母身份证',
    '房产证或购房合同',
    '儿童预防接种证',
    '出生医学证明',
    '非本市户籍需提供居住证',
    '非本市户籍需提供社保证明',
  ],
};

export const mockEnrollments: EnrollmentApplication[] = [
  {
    id: 'enroll-001',
    childName: '张小明',
    childIdCard: '450101201801010011',
    schoolId: 's001',
    status: 'approved',
    reviewComment: '经审核，材料齐全，符合入学条件，同意录取。',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'enroll-002',
    childName: '李小红',
    childIdCard: '450101201803050022',
    schoolId: 's002',
    status: 'reviewing',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'enroll-003',
    childName: '王小强',
    childIdCard: '450101201805120033',
    schoolId: 's003',
    status: 'rejected',
    reviewComment: '材料不完整，请补充社保证明后重新提交。',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockUser = mockUsers.find((user) => user.role === 'admin') || mockUsers[0];

const generateAuditInfo = (source: string, hasError: boolean = false): DataAuditInfo => {
  const now = new Date();
  const collected = new Date(now.getTime() - Math.random() * 30 * 60 * 1000);
  const verified = new Date(collected.getTime() + Math.random() * 5 * 60 * 1000);
  const status: 'normal' | 'warning' | 'error' = hasError 
    ? (Math.random() > 0.8 ? 'error' : 'warning')
    : 'normal';
  return {
    dataSource: source,
    collectedAt: collected.toISOString(),
    verifiedAt: verified.toISOString(),
    verifyStatus: status,
    abnormalMark: status !== 'normal' ? '数据偏离正常范围' : undefined,
    confidence: 0.85 + Math.random() * 0.15,
  };
};

export function generateTransportationData(): TransportationDashboardData {
  const busOnTimeTrend: BusOnTimeTrendItem[] = [];
  for (let i = 0; i < 24; i++) {
    const hasError = i === 8 || i === 18;
    busOnTimeTrend.push({
      hour: i,
      onTimeRate: 75 + Math.random() * 20,
      audit: generateAuditInfo('南宁市公交集团GPS系统', hasError),
    });
  }

  const routes = ['1路', '6路', '8路', '11路', '25路', '33路', '45路', '60路', '87路', 'B01路'];
  const busRouteRanking: BusRouteRankingItem[] = routes.map((name, idx) => ({
    routeName: name,
    onTimeRate: 70 + Math.random() * 25,
    totalTrips: 120 + Math.floor(Math.random() * 80),
    delayedTrips: 5 + Math.floor(Math.random() * 25),
    audit: generateAuditInfo('南宁市公交集团调度系统', idx === 3),
  })).sort((a, b) => b.onTimeRate - a.onTimeRate);

  const areas = ['民族大道', '朝阳商圈', '东盟商务区', '凤岭北', '江南区', '西乡塘', '五象新区', '青秀山'];
  const trafficHeatmap: TrafficHeatmapItem[] = areas.map((area, idx) => ({
    area,
    flow: 5000 + Math.floor(Math.random() * 15000),
    congestionLevel: 1 + Math.random() * 4,
    audit: generateAuditInfo('南宁市智能交通指挥中心', idx === 1),
  }));

  const brtLines = ['BRT1号线', 'BRT2号线', 'BRT3号线'];
  const brtPassengerStats: BRTPassengerStats[] = brtLines.map((line, idx) => ({
    lineName: line,
    passengerCount: 80000 + Math.floor(Math.random() * 40000),
    peakHour: ['07:30-08:30', '08:00-09:00', '07:45-08:45'][idx],
    averageLoadFactor: 0.65 + Math.random() * 0.25,
    audit: generateAuditInfo('南宁BRT运营管理系统'),
  }));

  return {
    busOnTimeTrend,
    busRouteRanking,
    trafficHeatmap,
    brtPassengerStats,
  };
}

export function generateMedicalData(): MedicalDashboardData {
  const departments = ['内科', '外科', '儿科', '急诊科', '妇产科', '骨科', '眼科', '口腔科'];
  const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
  const waitHeatmap: HospitalWaitHeatmapItem[] = [];
  departments.forEach((dept, di) => {
    timeSlots.forEach((slot, ti) => {
      const hasError = di === 2 && ti === 2;
      waitHeatmap.push({
        department: dept,
        timeSlot: slot,
        waitTime: 10 + Math.floor(Math.random() * 120),
        audit: generateAuditInfo('南宁市医疗健康信息平台', hasError),
      });
    });
  });

  const hospitals = ['广西医科大一附院', '自治区人民医院', '南宁市第一人民医院', '广西中医药大学一附院', '南宁市第二人民医院'];
  const emergencyLoad: HospitalEmergencyLoadItem[] = hospitals.map((name, idx) => ({
    hospitalName: name,
    loadRate: 50 + Math.random() * 45,
    waitingPatients: 15 + Math.floor(Math.random() * 50),
    availableBeds: 5 + Math.floor(Math.random() * 20),
    audit: generateAuditInfo('南宁市急救医疗中心', idx === 0),
  }));

  const appointmentStats: AppointmentStatsItem[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const hasError = i === 3;
    appointmentStats.push({
      date: date.toISOString().split('T')[0],
      totalAppointments: 2000 + Math.floor(Math.random() * 3000),
      completedAppointments: 1800 + Math.floor(Math.random() * 2800),
      cancelledAppointments: 100 + Math.floor(Math.random() * 300),
      audit: generateAuditInfo('南宁市预约挂号平台', hasError),
    });
  }

  return {
    waitHeatmap,
    emergencyLoad,
    appointmentStats,
  };
}

export function generateUtilitiesData(): UtilitiesDashboardData {
  const generateUsageDetail = (base: number, variance: number): UtilitiesDetailItem[] => {
    const items: UtilitiesDetailItem[] = [];
    for (let i = 0; i < 24; i++) {
      const hasError = i === 12;
      items.push({
        hour: i,
        usage: base + Math.random() * variance,
        audit: generateAuditInfo('南宁市公用事业监管平台', hasError),
      });
    }
    return items;
  };

  const waterUsage = generateUsageDetail(50000, 30000);
  const electricityUsage = generateUsageDetail(150000, 80000);
  const gasUsage = generateUsageDetail(35000, 20000);

  const generateComparison = (base: number): UtilitiesComparison => {
    const today = base * 24;
    const yesterday = today * (0.95 + Math.random() * 0.1);
    const lastMonth = today * (0.9 + Math.random() * 0.15);
    return {
      todayTotal: today,
      yesterdayTotal: yesterday,
      lastMonthTotal: lastMonth,
      comparedYesterday: ((today - yesterday) / yesterday) * 100,
      comparedLastMonth: ((today - lastMonth) / lastMonth) * 100,
      audit: generateAuditInfo('南宁市公用事业监管平台'),
    };
  };

  return {
    waterUsage,
    electricityUsage,
    gasUsage,
    waterComparison: generateComparison(65000),
    electricityComparison: generateComparison(180000),
    gasComparison: generateComparison(42000),
  };
}

export function generateGovernmentData(): GovernmentDashboardData {
  const categories = [
    { name: '交通出行', color: '#3B82F6' },
    { name: '医疗卫生', color: '#10B981' },
    { name: '教育服务', color: '#F59E0B' },
    { name: '政务服务', color: '#8B5CF6' },
    { name: '城市管理', color: '#F97316' },
  ];
  const totalTickets = 2500;
  const ticketCategoryDistribution: TicketCategoryItem[] = categories.map((cat, idx) => {
    const count = Math.floor(300 + Math.random() * 700);
    return {
      category: cat.name,
      count,
      percentage: (count / totalTickets) * 100,
      audit: generateAuditInfo('南宁市12345政务服务便民热线', idx === 2),
    };
  });

  const classificationAccuracyTrend: ClassificationAccuracyTrendItem[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    classificationAccuracyTrend.push({
      date: date.toISOString().split('T')[0],
      accuracy: 0.88 + Math.random() * 0.1,
      totalTickets: 300 + Math.floor(Math.random() * 200),
      audit: generateAuditInfo('南宁市政务AI智能分类系统'),
    });
  }

  const departments = [
    '南宁市交通运输局',
    '南宁市卫生健康委员会',
    '南宁市教育局',
    '南宁市行政审批局',
    '南宁市城市管理局',
    '南宁市公安局',
    '南宁市生态环境局',
  ];
  const departmentEfficiency: DepartmentEfficiencyItem[] = departments.map((dept, idx) => ({
    department: dept,
    avgProcessingTime: 12 + Math.random() * 36,
    completedTickets: 80 + Math.floor(Math.random() * 120),
    pendingTickets: 10 + Math.floor(Math.random() * 40),
    audit: generateAuditInfo('南宁市政务服务绩效考评系统', idx === 4),
  }));

  const statuses = ['待处理', '已分派', '处理中', '已解决', '已结案'];
  const ticketStatusDistribution: TicketStatusItem[] = statuses.map((status, idx) => {
    const count = [150, 280, 420, 1200, 450][idx];
    return {
      status,
      count,
      percentage: (count / 2500) * 100,
      audit: generateAuditInfo('南宁市12345政务服务便民热线'),
    };
  });

  return {
    ticketCategoryDistribution,
    classificationAccuracyTrend,
    departmentEfficiency,
    ticketStatusDistribution,
  };
}

export const mockDispatchRules: DispatchRule[] = [
  {
    id: uuidv4(),
    name: '违章关键词分派',
    type: 'keyword',
    condition: { type: 'keyword', value: '违章', operator: 'contains' },
    department: '南宁市交通运输局',
    priority: 'medium',
    isEnabled: true,
    description: '工单内容包含「违章」关键词时自动分派至交通运输局',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    name: '医疗健康类别分派',
    type: 'category',
    condition: { type: 'category', value: 'medical' },
    department: '南宁市卫生健康委员会',
    priority: 'medium',
    isEnabled: true,
    description: '工单类别为「医疗健康」时自动分派至卫生健康委员会',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    name: '紧急工单抄送应急管理局',
    type: 'priority',
    condition: { type: 'priority', value: 'urgent' },
    department: '对应责任部门',
    ccDepartments: ['南宁市应急管理局'],
    priority: 'urgent',
    isEnabled: true,
    description: '紧急程度为「紧急」的工单，除分派至对应部门外，同时抄送应急管理局',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    name: '夜间工单延时处理',
    type: 'time',
    condition: { type: 'time', value: '22:00-08:00', operator: 'between' },
    department: '南宁市12345热线中心',
    priority: 'low',
    isEnabled: false,
    description: '夜间22:00至次日08:00提交的工单，优先级降低，次日工作时间处理',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    name: '教育服务类别分派',
    type: 'category',
    condition: { type: 'category', value: 'education' },
    department: '南宁市教育局',
    priority: 'medium',
    isEnabled: true,
    description: '工单类别为「教育服务」时自动分派至教育局',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockDepartmentStats: DepartmentStats[] = [
  {
    departmentId: 'dept-001',
    departmentName: '南宁市交通运输局',
    pending: 23,
    processing: 45,
    resolved: 156,
    overdue: 3,
    total: 227,
    avgProcessTime: 18.5,
    resolutionRate: 92.5,
    satisfactionRate: 95.2,
  },
  {
    departmentId: 'dept-002',
    departmentName: '南宁市卫生健康委员会',
    pending: 18,
    processing: 32,
    resolved: 128,
    overdue: 2,
    total: 180,
    avgProcessTime: 15.2,
    resolutionRate: 94.2,
    satisfactionRate: 97.8,
  },
  {
    departmentId: 'dept-003',
    departmentName: '南宁市教育局',
    pending: 12,
    processing: 28,
    resolved: 95,
    overdue: 1,
    total: 136,
    avgProcessTime: 22.3,
    resolutionRate: 90.8,
    satisfactionRate: 93.5,
  },
  {
    departmentId: 'dept-004',
    departmentName: '南宁市行政审批局',
    pending: 35,
    processing: 52,
    resolved: 189,
    overdue: 5,
    total: 281,
    avgProcessTime: 24.8,
    resolutionRate: 88.6,
    satisfactionRate: 91.2,
  },
  {
    departmentId: 'dept-005',
    departmentName: '南宁市城市管理局',
    pending: 42,
    processing: 68,
    resolved: 245,
    overdue: 8,
    total: 363,
    avgProcessTime: 28.6,
    resolutionRate: 85.3,
    satisfactionRate: 89.7,
  },
];

export const mockDepartmentReceipts: DepartmentReceipt[] = [
  {
    id: uuidv4(),
    ticketNo: '202406150001',
    ticketTitle: '民族大道井盖破损',
    department: '南宁市城市管理局',
    receiver: '王建国',
    receivedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    estimatedFinishAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    status: 'processing',
    note: '已安排市政维修队前往现场',
  },
  {
    id: uuidv4(),
    ticketNo: '202406150002',
    ticketTitle: 'BRT公交晚点严重',
    department: '南宁市交通运输局',
    receiver: '李明华',
    receivedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    estimatedFinishAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'assigned',
    note: '已转至公交公司调度科处理',
  },
  {
    id: uuidv4(),
    ticketNo: '202406150003',
    ticketTitle: '小区周边噪音扰民',
    department: '南宁市城市管理局',
    receiver: '张伟强',
    receivedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    estimatedFinishAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    status: 'resolved',
    note: '已完成夜间巡查整治',
  },
  {
    id: uuidv4(),
    ticketNo: '202406150004',
    ticketTitle: '医院排队时间过长',
    department: '南宁市卫生健康委员会',
    receiver: '陈美玲',
    receivedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    estimatedFinishAt: new Date(Date.now() + 16 * 60 * 60 * 1000).toISOString(),
    status: 'processing',
    note: '正在协调医院优化就诊流程',
  },
  {
    id: uuidv4(),
    ticketNo: '202406150005',
    ticketTitle: '入学报名咨询',
    department: '南宁市教育局',
    receiver: '刘老师',
    receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    estimatedFinishAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    status: 'assigned',
    note: '已转至基础教育科',
  },
];
