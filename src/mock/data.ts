import type {
  User,
  Department,
  ServiceItem,
  Application,
  Certificate,
  SystemStatus,
  Policy,
  PolicyMatch,
  PerformanceData,
  MenuItem,
  StatCardData,
} from '../shared/types';

export const mockUser: User = {
  id: '1',
  name: '张三',
  idCard: '110101199001011234',
  phone: '138****8001',
  userType: 'citizen',
  authLevel: 2,
  avatar: '',
  createdAt: new Date('2024-01-01'),
};

export interface AccountCredential {
  username: string;
  password: string;
  user: User;
  accountStatus: 'active' | 'locked' | 'pending';
  lastLogin?: Date;
  loginFailCount: number;
  deptId?: string;
  roles: string[];
  defaultRole: string;
}

export const userAccounts: AccountCredential[] = [
  {
    username: 'citizen',
    password: '123456',
    user: {
      id: '1',
      name: '张三',
      idCard: '110101199001011234',
      phone: '138****8001',
      userType: 'citizen',
      authLevel: 2,
      avatar: '',
      createdAt: new Date('2024-01-01'),
    },
    accountStatus: 'active',
    loginFailCount: 0,
    lastLogin: new Date('2026-06-15'),
    roles: ['citizen'],
    defaultRole: 'citizen',
  },
  {
    username: 'admin',
    password: 'admin123',
    user: {
      id: '2',
      name: '王系统管理员',
      idCard: '110101198501011234',
      phone: '139****9001',
      userType: 'admin',
      authLevel: 9,
      avatar: '',
      createdAt: new Date('2023-06-01'),
    },
    accountStatus: 'active',
    loginFailCount: 0,
    lastLogin: new Date('2026-06-15'),
    roles: ['admin', 'staff', 'platform', 'ops'],
    defaultRole: 'admin',
  },
  {
    username: 'staff',
    password: 'staff123',
    user: {
      id: '3',
      name: '李办事员',
      idCard: '110101198802022345',
      phone: '139****9002',
      userType: 'staff',
      authLevel: 5,
      avatar: '',
      createdAt: new Date('2023-08-15'),
    },
    accountStatus: 'active',
    loginFailCount: 0,
    lastLogin: new Date('2026-06-14'),
    deptId: '1',
    roles: ['staff', 'ops'],
    defaultRole: 'staff',
  },
  {
    username: 'platform',
    password: 'platform123',
    user: {
      id: '4',
      name: '赵平台运维',
      idCard: '110101198703033456',
      phone: '139****9003',
      userType: 'staff',
      authLevel: 7,
      avatar: '',
      createdAt: new Date('2023-03-20'),
    },
    accountStatus: 'active',
    loginFailCount: 0,
    lastLogin: new Date('2026-06-15'),
    roles: ['platform'],
    defaultRole: 'platform',
  },
  {
    username: 'ops',
    password: 'ops123',
    user: {
      id: '5',
      name: '陈协同部门',
      idCard: '110101198604044567',
      phone: '139****9004',
      userType: 'staff',
      authLevel: 4,
      avatar: '',
      createdAt: new Date('2024-02-10'),
    },
    accountStatus: 'active',
    loginFailCount: 0,
    lastLogin: new Date('2026-06-13'),
    deptId: '5',
    roles: ['ops'],
    defaultRole: 'ops',
  },
  {
    username: 'enterprise',
    password: 'enterprise123',
    user: {
      id: '6',
      name: '北京科技有限公司',
      idCard: '91110105MA01234567',
      phone: '138****8008',
      userType: 'enterprise',
      authLevel: 3,
      avatar: '',
      createdAt: new Date('2024-05-01'),
    },
    accountStatus: 'active',
    loginFailCount: 0,
    lastLogin: new Date('2026-06-12'),
    roles: ['enterprise'],
    defaultRole: 'enterprise',
  },
  {
    username: 'locked_user',
    password: 'locked123',
    user: {
      id: '7',
      name: '锁定测试用户',
      idCard: '110101199001019999',
      phone: '138****9999',
      userType: 'citizen',
      authLevel: 1,
      avatar: '',
      createdAt: new Date('2024-01-01'),
    },
    accountStatus: 'locked',
    loginFailCount: 5,
    roles: ['citizen'],
    defaultRole: 'citizen',
  },
];

export const roleConfig: Record<string, {
  label: string;
  description: string;
  defaultRoute: string;
  icon: string;
  tips: string[];
}> = {
  citizen: {
    label: '办事群众',
    description: '个人用户办理政务服务事项',
    defaultRoute: '/',
    icon: 'UserCircle',
    tips: ['掌上办事、智能导办、跨域协同', '电子证照管理、办件进度查询'],
  },
  enterprise: {
    label: '企业法人',
    description: '企业办理工商、税务、资质等事项',
    defaultRoute: '/',
    icon: 'Building2',
    tips: ['企业开办一网通办', '资质办理、年报公示'],
  },
  staff: {
    label: '办事人员',
    description: '政务大厅窗口人员、审核人员',
    defaultRoute: '/admin/dashboard',
    icon: 'UserCheck',
    tips: ['办件受理与审核', '服务效能监测'],
  },
  platform: {
    label: '平台运维',
    description: '技术运维、系统管理',
    defaultRoute: '/admin/disaster-recovery',
    icon: 'Server',
    tips: ['系统监控与容灾管理', '运维配置、日志审计'],
  },
  ops: {
    label: '协同部门',
    description: '各委办局业务协同人员',
    defaultRoute: '/admin/dashboard',
    icon: 'Users',
    tips: ['跨部门事项联办', '业务数据共享'],
  },
  admin: {
    label: '超级管理员',
    description: '系统最高权限管理员',
    defaultRoute: '/admin/dashboard',
    icon: 'Shield',
    tips: ['全局权限管理', '政策配置、系统设置'],
  },
};

export type LoginErrorCode =
  | 'ACCOUNT_NOT_FOUND'
  | 'PASSWORD_ERROR'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_PENDING'
  | 'NO_ROLE_PERMISSION'
  | 'AUTH_LINK_ERROR'
  | 'CA_VERIFY_FAILED'
  | 'SYSTEM_ERROR'
  | 'TOO_MANY_ATTEMPTS';

export const loginErrorMessages: Record<LoginErrorCode, { title: string; detail: string; suggestion: string; severity: 'error' | 'warning' | 'info' }> = {
  ACCOUNT_NOT_FOUND: {
    title: '账号不存在',
    detail: '您输入的账号在系统中未找到，请确认账号是否正确',
    suggestion: '请检查账号输入，或联系系统管理员确认账号是否已开通',
    severity: 'error',
  },
  PASSWORD_ERROR: {
    title: '密码错误',
    detail: '您输入的密码与账号不匹配',
    suggestion: '请确认密码是否正确，注意区分大小写；连续错误5次账号将被锁定',
    severity: 'error',
  },
  ACCOUNT_LOCKED: {
    title: '账号已被锁定',
    detail: '该账号因多次密码错误或安全策略已被临时锁定',
    suggestion: '请联系省大数据中心服务热线12345-9申请解锁，或30分钟后自动解锁',
    severity: 'error',
  },
  ACCOUNT_PENDING: {
    title: '账号待审核',
    detail: '您的账号正在审核中，尚未开通系统访问权限',
    suggestion: '请耐心等待管理员审核，一般1-2个工作日内完成',
    severity: 'warning',
  },
  NO_ROLE_PERMISSION: {
    title: '无角色访问权限',
    detail: '您的账号未分配当前入口所需的角色权限',
    suggestion: '请选择正确的登录入口，或联系管理员开通对应角色权限',
    severity: 'error',
  },
  AUTH_LINK_ERROR: {
    title: '统一认证链路异常',
    detail: '省政务云统一身份认证服务暂时无法访问',
    suggestion: '请稍后重试，或拨打技术支持电话010-XXXXXXXX咨询',
    severity: 'warning',
  },
  CA_VERIFY_FAILED: {
    title: 'CA证书验证失败',
    detail: '您的数字证书未能通过验证，可能已过期或被吊销',
    suggestion: '请检查证书是否在有效期内，或联系CA机构确认证书状态',
    severity: 'error',
  },
  SYSTEM_ERROR: {
    title: '系统异常',
    detail: '登录过程中发生未知错误，错误已自动记录',
    suggestion: '请稍后重试，若多次出现请联系技术支持',
    severity: 'error',
  },
  TOO_MANY_ATTEMPTS: {
    title: '登录尝试过于频繁',
    detail: '短时间内登录失败次数过多，为保护账号安全已被限制',
    suggestion: '请等待5分钟后再尝试登录',
    severity: 'warning',
  },
};

export const mockDepartments: Department[] = [
  { id: '1', name: '人力资源和社会保障厅', code: 'RS001', contact: '张主任', phone: '12333' },
  { id: '2', name: '公安厅', code: 'GA001', contact: '李主任', phone: '110' },
  { id: '3', name: '卫生健康委员会', code: 'WJ001', contact: '王主任', phone: '12320' },
  { id: '4', name: '住房和城乡建设厅', code: 'ZJ001', contact: '赵主任', phone: '12319' },
  { id: '5', name: '市场监督管理局', code: 'SC001', contact: '孙主任', phone: '12315' },
  { id: '6', name: '税务局', code: 'SW001', contact: '周主任', phone: '12366' },
  { id: '7', name: '民政局', code: 'MZ001', contact: '吴主任', phone: '12349' },
  { id: '8', name: '自然资源厅', code: 'ZR001', contact: '郑主任', phone: '12336' },
];

export const mockServices: ServiceItem[] = [
  {
    id: '1',
    name: '社保卡申领',
    category: '社会保障',
    departmentId: '1',
    department: '人力资源和社会保障厅',
    description: '首次申领社会保障卡，在线填写信息，邮寄到家',
    handlingTime: '5个工作日',
    hotLevel: 985,
    isOnline: true,
    requiredMaterials: [
      { id: 'm1', name: '居民身份证', type: 'id_card', isElectronic: true, required: true, description: '有效期内的二代身份证' },
      { id: 'm2', name: '近期免冠照片', type: 'other', isElectronic: false, required: true, description: '一寸白底彩色照片' },
    ],
    formFields: [
      { id: 'f1', name: 'name', label: '姓名', type: 'text', required: true, prefillSource: 'id_card' },
      { id: 'f2', name: 'idCard', label: '身份证号', type: 'text', required: true, prefillSource: 'id_card' },
      { id: 'f3', name: 'phone', label: '联系电话', type: 'text', required: true },
      { id: 'f4', name: 'address', label: '邮寄地址', type: 'textarea', required: true },
    ],
  },
  {
    id: '2',
    name: '户口迁移',
    category: '户籍管理',
    departmentId: '2',
    department: '公安厅',
    description: '市内户口迁移办理，包括购房落户、投靠迁移等',
    handlingTime: '3个工作日',
    hotLevel: 876,
    isOnline: true,
    requiredMaterials: [
      { id: 'm3', name: '居民户口簿', type: 'household', isElectronic: true, required: true, description: '本人及户内成员户口簿' },
      { id: 'm4', name: '房屋产权证明', type: 'other', isElectronic: false, required: true, description: '房产证或购房合同' },
    ],
    formFields: [
      { id: 'f5', name: 'name', label: '申请人姓名', type: 'text', required: true, prefillSource: 'id_card' },
      { id: 'f6', name: 'idCard', label: '身份证号', type: 'text', required: true, prefillSource: 'id_card' },
      { id: 'f7', name: 'migrateType', label: '迁移类型', type: 'select', required: true, options: [
        { label: '购房落户', value: 'house' },
        { label: '夫妻投靠', value: 'spouse' },
        { label: '父母投靠', value: 'parents' },
        { label: '子女投靠', value: 'children' },
      ]},
      { id: 'f8', name: 'targetAddress', label: '迁入地址', type: 'textarea', required: true },
    ],
  },
  {
    id: '3',
    name: '出生医学证明办理',
    category: '医疗卫生',
    departmentId: '3',
    department: '卫生健康委员会',
    description: '新生儿出生医学证明签发，支持在线预约和办理',
    handlingTime: '1个工作日',
    hotLevel: 765,
    isOnline: true,
    requiredMaterials: [
      { id: 'm5', name: '父母双方身份证', type: 'id_card', isElectronic: true, required: true, description: '父母双方有效身份证件' },
      { id: 'm6', name: '结婚证', type: 'marriage', isElectronic: true, required: true, description: '父母结婚证' },
    ],
    formFields: [
      { id: 'f9', name: 'babyName', label: '新生儿姓名', type: 'text', required: true },
      { id: 'f10', name: 'babyGender', label: '性别', type: 'select', required: true, options: [
        { label: '男', value: 'male' },
        { label: '女', value: 'female' },
      ]},
      { id: 'f11', name: 'birthDate', label: '出生日期', type: 'date', required: true },
      { id: 'f12', name: 'motherName', label: '母亲姓名', type: 'text', required: true },
      { id: 'f13', name: 'fatherName', label: '父亲姓名', type: 'text', required: true },
    ],
  },
  {
    id: '4',
    name: '不动产登记',
    category: '住房建设',
    departmentId: '4',
    department: '住房和城乡建设厅',
    description: '房屋所有权首次登记，在线提交材料，全程网办',
    handlingTime: '7个工作日',
    hotLevel: 654,
    isOnline: true,
    requiredMaterials: [
      { id: 'm7', name: '申请人身份证', type: 'id_card', isElectronic: true, required: true, description: '申请人有效身份证件' },
      { id: 'm8', name: '购房合同', type: 'other', isElectronic: false, required: true, description: '已备案的商品房买卖合同' },
      { id: 'm9', name: '完税证明', type: 'other', isElectronic: true, required: true, description: '契税完税证明' },
    ],
    formFields: [
      { id: 'f14', name: 'name', label: '申请人姓名', type: 'text', required: true, prefillSource: 'id_card' },
      { id: 'f15', name: 'idCard', label: '身份证号', type: 'text', required: true, prefillSource: 'id_card' },
      { id: 'f16', name: 'propertyAddress', label: '房屋地址', type: 'textarea', required: true },
      { id: 'f17', name: 'propertyArea', label: '建筑面积(㎡)', type: 'number', required: true },
    ],
  },
  {
    id: '5',
    name: '企业开办',
    category: '市场监管',
    departmentId: '5',
    department: '市场监督管理局',
    description: '内资有限责任公司设立登记，一站式办理',
    handlingTime: '1个工作日',
    hotLevel: 932,
    isOnline: true,
    requiredMaterials: [
      { id: 'm10', name: '法定代表人身份证', type: 'id_card', isElectronic: true, required: true, description: '法定代表人有效身份证件' },
      { id: 'm11', name: '公司章程', type: 'other', isElectronic: false, required: true, description: '全体股东签署的公司章程' },
    ],
    formFields: [
      { id: 'f18', name: 'companyName', label: '企业名称', type: 'text', required: true },
      { id: 'f19', name: 'legalPerson', label: '法定代表人', type: 'text', required: true },
      { id: 'f20', name: 'registeredCapital', label: '注册资本(万元)', type: 'number', required: true },
      { id: 'f21', name: 'businessScope', label: '经营范围', type: 'textarea', required: true },
    ],
  },
  {
    id: '6',
    name: '社保缴费查询',
    category: '社会保障',
    departmentId: '1',
    department: '人力资源和社会保障厅',
    description: '个人社会保险缴费记录查询，支持打印缴费证明',
    handlingTime: '实时',
    hotLevel: 999,
    isOnline: true,
    requiredMaterials: [],
    formFields: [],
  },
  {
    id: '7',
    name: '公积金提取',
    category: '住房建设',
    departmentId: '4',
    department: '住房和城乡建设厅',
    description: '购买自住住房提取公积金，在线申请，资金直达账户',
    handlingTime: '3个工作日',
    hotLevel: 888,
    isOnline: true,
    requiredMaterials: [
      { id: 'm12', name: '申请人身份证', type: 'id_card', isElectronic: true, required: true, description: '申请人有效身份证件' },
      { id: 'm13', name: '购房合同', type: 'other', isElectronic: false, required: true, description: '购房合同或房产证' },
    ],
    formFields: [
      { id: 'f22', name: 'name', label: '申请人姓名', type: 'text', required: true, prefillSource: 'id_card' },
      { id: 'f23', name: 'idCard', label: '身份证号', type: 'text', required: true, prefillSource: 'id_card' },
      { id: 'f24', name: 'extractAmount', label: '提取金额', type: 'number', required: true },
      { id: 'f25', name: 'bankAccount', label: '收款银行账号', type: 'text', required: true },
    ],
  },
  {
    id: '8',
    name: '结婚证办理',
    category: '民政服务',
    departmentId: '7',
    department: '民政局',
    description: '内地居民结婚登记，支持在线预约',
    handlingTime: '即时办理',
    hotLevel: 777,
    isOnline: true,
    requiredMaterials: [
      { id: 'm14', name: '双方身份证', type: 'id_card', isElectronic: true, required: true, description: '男女双方有效身份证件' },
      { id: 'm15', name: '双方户口簿', type: 'household', isElectronic: true, required: true, description: '男女双方户口簿' },
    ],
    formFields: [
      { id: 'f26', name: 'manName', label: '男方姓名', type: 'text', required: true },
      { id: 'f27', name: 'womanName', label: '女方姓名', type: 'text', required: true },
      { id: 'f28', name: 'appointmentDate', label: '预约日期', type: 'date', required: true },
      { id: 'f29', name: 'appointmentOffice', label: '预约登记机关', type: 'select', required: true, options: [
        { label: '朝阳区民政局婚姻登记处', value: 'cy' },
        { label: '海淀区民政局婚姻登记处', value: 'hd' },
        { label: '西城区民政局婚姻登记处', value: 'xc' },
      ]},
    ],
  },
];

export const mockApplications: Application[] = [
  {
    id: 'app1',
    serviceId: '1',
    serviceName: '社保卡申领',
    applicantId: '1',
    status: 'reviewing',
    formData: { name: '张三', idCard: '110101199001011234', phone: '13800138001', address: '北京市朝阳区xxx街道xxx号' },
    materials: [
      { id: 'um1', materialId: 'm1', name: '居民身份证', type: 'electronic', url: '', verified: true },
      { id: 'um2', materialId: 'm2', name: '近期免冠照片', type: 'upload', url: '/photo.jpg', verified: true },
    ],
    currentStep: 2,
    totalSteps: 4,
    createdAt: new Date('2024-06-10'),
    updatedAt: new Date('2024-06-12'),
    estimatedTime: '5个工作日',
  },
  {
    id: 'app2',
    serviceId: '6',
    serviceName: '社保缴费查询',
    applicantId: '1',
    status: 'approved',
    formData: {},
    materials: [],
    currentStep: 1,
    totalSteps: 1,
    createdAt: new Date('2024-06-08'),
    updatedAt: new Date('2024-06-08'),
    estimatedTime: '实时',
  },
  {
    id: 'app3',
    serviceId: '7',
    serviceName: '公积金提取',
    applicantId: '1',
    status: 'supplement',
    formData: { name: '张三', idCard: '110101199001011234' },
    materials: [
      { id: 'um3', materialId: 'm12', name: '申请人身份证', type: 'electronic', url: '', verified: true },
    ],
    currentStep: 1,
    totalSteps: 3,
    createdAt: new Date('2024-06-11'),
    updatedAt: new Date('2024-06-13'),
    estimatedTime: '3个工作日',
  },
];

export const mockCertificates: Certificate[] = [
  {
    id: 'cert1',
    userId: '1',
    type: 'id_card',
    certificateNumber: '110101199001011234',
    name: '居民身份证',
    issueDate: new Date('2018-03-15'),
    expiryDate: new Date('2038-03-15'),
    issuer: '北京市公安局朝阳分局',
    imageUrl: '',
    isValid: true,
  },
  {
    id: 'cert2',
    userId: '1',
    type: 'social_security',
    certificateNumber: '110101199001011234',
    name: '社会保障卡',
    issueDate: new Date('2020-06-01'),
    expiryDate: new Date('2030-06-01'),
    issuer: '北京市人力资源和社会保障局',
    imageUrl: '',
    isValid: true,
  },
  {
    id: 'cert3',
    userId: '1',
    type: 'household',
    certificateNumber: '110105001234567',
    name: '居民户口簿',
    issueDate: new Date('2015-01-01'),
    expiryDate: new Date('9999-12-31'),
    issuer: '北京市公安局朝阳分局',
    imageUrl: '',
    isValid: true,
  },
  {
    id: 'cert4',
    userId: '1',
    type: 'marriage',
    certificateNumber: 'J1101052021001234',
    name: '结婚证',
    issueDate: new Date('2021-05-20'),
    expiryDate: new Date('9999-12-31'),
    issuer: '北京市朝阳区民政局',
    imageUrl: '',
    isValid: true,
  },
  {
    id: 'cert5',
    userId: '1',
    type: 'birth',
    certificateNumber: '1101052022000123',
    name: '出生医学证明',
    issueDate: new Date('2022-08-15'),
    expiryDate: new Date('9999-12-31'),
    issuer: '北京市朝阳区妇幼保健院',
    imageUrl: '',
    isValid: true,
  },
  {
    id: 'cert6',
    userId: '1',
    type: 'business_license',
    certificateNumber: '91110105MA01234567',
    name: '营业执照',
    issueDate: new Date('2023-01-10'),
    expiryDate: new Date('2033-01-09'),
    issuer: '北京市朝阳区市场监督管理局',
    imageUrl: '',
    isValid: true,
  },
];

export const mockSystemStatus: SystemStatus[] = [
  { id: 'sys1', name: '人社业务系统', departmentId: '1', department: '人力资源和社会保障厅', status: 'normal', responseTime: 45, lastChecked: new Date(), isFailover: false },
  { id: 'sys2', name: '公安户籍系统', departmentId: '2', department: '公安厅', status: 'normal', responseTime: 38, lastChecked: new Date(), isFailover: false },
  { id: 'sys3', name: '卫健业务系统', departmentId: '3', department: '卫生健康委员会', status: 'warning', responseTime: 120, lastChecked: new Date(), isFailover: false },
  { id: 'sys4', name: '住建业务系统', departmentId: '4', department: '住房和城乡建设厅', status: 'normal', responseTime: 52, lastChecked: new Date(), isFailover: false },
  { id: 'sys5', name: '市监业务系统', departmentId: '5', department: '市场监督管理局', status: 'normal', responseTime: 41, lastChecked: new Date(), isFailover: false },
  { id: 'sys6', name: '税务业务系统', departmentId: '6', department: '税务局', status: 'error', responseTime: 0, lastChecked: new Date(), isFailover: true },
];

export const mockPolicies: Policy[] = [
  {
    id: 'policy1',
    title: '高校毕业生就业补贴',
    category: '就业创业',
    content: '对符合条件的高校毕业生给予一次性就业补贴，补贴标准为每人5000元。',
    eligibilityCriteria: { age: { $lte: 35 }, education: ['本科', '硕士', '博士'], employment_status: 'employed' },
    effectiveDate: new Date('2024-01-01'),
    expiryDate: new Date('2025-12-31'),
  },
  {
    id: 'policy2',
    title: '小微企业税收优惠',
    category: '企业扶持',
    content: '对小型微利企业减免企业所得税，年应纳税所得额不超过300万元的部分，减按25%计入应纳税所得额。',
    eligibilityCriteria: { enterprise_type: 'small_micro', annual_profit: { $lte: 3000000 } },
    effectiveDate: new Date('2024-01-01'),
    expiryDate: new Date('2025-12-31'),
  },
  {
    id: 'policy3',
    title: '独生子女父母奖励',
    category: '计划生育',
    content: '对独生子女父母发放奖励金，每人每月不低于80元。',
    eligibilityCriteria: { has_only_child: true, age: { $gte: 60 } },
    effectiveDate: new Date('2024-01-01'),
    expiryDate: new Date('9999-12-31'),
  },
];

export const mockPolicyMatches: PolicyMatch[] = [
  {
    id: 'pm1',
    userId: '1',
    policyId: 'policy1',
    policy: mockPolicies[0],
    matchScore: 95.5,
    matchedCriteria: { age: 34, education: '本科', employment_status: 'employed' },
    matchedAt: new Date(),
  },
];

const generatePerformanceData = (): PerformanceData[] => {
  const data: PerformanceData[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const total = Math.floor(Math.random() * 500) + 800;
    const completed = Math.floor(total * (0.85 + Math.random() * 0.1));
    data.push({
      date: date.toISOString().split('T')[0],
      totalApplications: total,
      completedCount: completed,
      completionRate: Math.round((completed / total) * 1000) / 10,
      averageHandlingTime: Math.floor(Math.random() * 40) + 20,
      rejectionCount: Math.floor(Math.random() * 30) + 5,
      rejectionReasons: [
        { reason: '材料不全', count: Math.floor(Math.random() * 10) + 3 },
        { reason: '信息有误', count: Math.floor(Math.random() * 8) + 2 },
        { reason: '不符合条件', count: Math.floor(Math.random() * 5) + 1 },
        { reason: '其他', count: Math.floor(Math.random() * 3) },
      ],
    });
  }
  return data;
};

export const mockPerformanceData = generatePerformanceData();

export const mockStatCards: StatCardData[] = [
  { title: '今日办件量', value: '12,847', change: 12.5, trend: 'up', icon: 'FileText', gradient: 'blue' },
  { title: '事项办结率', value: '96.8%', change: 2.3, trend: 'up', icon: 'CheckCircle', gradient: 'green' },
  { title: '平均办理耗时', value: '2.3天', change: -15.2, trend: 'down', icon: 'Clock', gradient: 'orange' },
  { title: '群众满意度', value: '98.5%', change: 0.8, trend: 'up', icon: 'Smile', gradient: 'purple' },
];

export const menuItems: MenuItem[] = [
  { key: 'home', label: '首页', icon: 'LayoutDashboard', path: '/' },
  { key: 'services', label: '掌上办事', icon: 'HandPlatter', path: '/services' },
  { key: 'guide', label: '智能导办', icon: 'Bot', path: '/guide' },
  { key: 'collaboration', label: '跨域协同', icon: 'Users', path: '/collaboration' },
  { key: 'certificates', label: '电子证照', icon: 'CreditCard', path: '/certificates' },
  { key: 'applications', label: '我的办件', icon: 'ClipboardList', path: '/my-applications' },
  {
    key: 'admin',
    label: '后台管理',
    icon: 'Settings',
    roles: ['staff', 'admin'],
    children: [
      { key: 'performance', label: '效能监测', icon: 'BarChart3', path: '/admin/dashboard' },
      { key: 'policy', label: '政策引擎', icon: 'Lightbulb', path: '/admin/policy' },
      { key: 'disaster-recovery', label: '容灾中心', icon: 'ShieldAlert', path: '/admin/disaster-recovery' },
    ],
  },
];

export const serviceCategories = [
  { key: 'all', label: '全部事项', icon: 'Grid3X3' },
  { key: '社会保障', label: '社会保障', icon: 'HeartHandshake' },
  { key: '户籍管理', label: '户籍管理', icon: 'UserCircle' },
  { key: '医疗卫生', label: '医疗卫生', icon: 'Stethoscope' },
  { key: '住房建设', label: '住房建设', icon: 'Building2' },
  { key: '市场监管', label: '市场监管', icon: 'Store' },
  { key: '民政服务', label: '民政服务', icon: 'Heart' },
  { key: '税务服务', label: '税务服务', icon: 'Receipt' },
];

export const quickQuestions = [
  '我要办理社保卡',
  '户口迁移需要什么材料',
  '新生儿出生证明怎么办理',
  '公积金提取条件',
  '企业开办流程',
  '结婚证预约',
];
