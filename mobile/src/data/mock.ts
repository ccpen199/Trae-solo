import dayjs from 'dayjs';
import type {
  TodoItem,
  RegistrationItem,
  ApplyRecord,
  SignDocument,
  Notice,
  ElectronicLicense,
  CACertificate,
  User
} from '@/types';

export const mockUser: User = {
  id: 'U20240001',
  name: '张三',
  idCardNo: '3201**********1234',
  phone: '138****5678',
  userType: 'individual',
  isVerified: true,
  authLevel: 'L3',
  authToken: 'mock_token_xxxxxx',
  avatarUrl: ''
};

export const mockEnterpriseUser: User = {
  id: 'U20240002',
  name: '李四',
  idCardNo: '3201**********5678',
  phone: '139****8765',
  userType: 'enterprise',
  enterpriseName: 'XX科技有限公司',
  unifiedSocialCreditCode: '913201********AB12',
  isVerified: true,
  authLevel: 'L3',
  authToken: 'mock_token_yyyyyy',
  avatarUrl: ''
};

export const mockCertificate: CACertificate = {
  id: 'CERT001',
  userId: 'U20240001',
  certSn: 'SN2024010100001',
  certType: 'SM2',
  issuer: '省级电子认证服务中心',
  subject: 'CN=张三,O=个人,C=CN',
  validFrom: '2024-01-01 00:00:00',
  validTo: '2026-01-01 23:59:59',
  status: 'active',
  publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...'
};

export const mockTodos: TodoItem[] = [
  {
    id: 'T001',
    type: 'sign',
    title: '待签署：个体工商户设立登记申请书',
    description: '请于24小时内完成电子签名',
    relatedId: 'SD20240001',
    priority: 'high',
    createdAt: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    isRead: false,
    deadline: dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm:ss')
  },
  {
    id: 'T002',
    type: 'reject',
    title: '申请被驳回：食品经营许可证变更',
    description: '请查看驳回原因并重新提交',
    relatedId: 'APP20240002',
    priority: 'high',
    createdAt: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    isRead: false
  },
  {
    id: 'T003',
    type: 'complete',
    title: '审批完成：营业执照领取通知',
    description: '您的营业执照已生成，可下载电子版',
    relatedId: 'APP20240003',
    priority: 'medium',
    createdAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    isRead: true
  },
  {
    id: 'T004',
    type: 'reviewing',
    title: '审核中：公司变更登记',
    description: '当前环节：二审，预计还需1-2个工作日',
    relatedId: 'APP20240004',
    priority: 'low',
    createdAt: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
    isRead: true
  },
  {
    id: 'T005',
    type: 'remind',
    title: '证书即将到期提醒',
    description: '您的CA证书还有30天到期，请及时续期',
    relatedId: 'CERT001',
    priority: 'medium',
    createdAt: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
    isRead: true
  }
];

export const mockRegistrationItems: RegistrationItem[] = [
  {
    id: 'RI001',
    code: 'DJ-IND-001',
    name: '个体工商户设立登记',
    category: '市场主体登记',
    description: '个体工商户的设立、注册登记服务',
    estimatedDays: 3,
    requiredMaterials: ['身份证', '经营场所证明', '经营范围确认书'],
    formFields: [
      { key: 'name', label: '字号名称', type: 'input', required: true, placeholder: '请输入字号名称' },
      { key: 'businessScope', label: '经营范围', type: 'textarea', required: true, placeholder: '请输入经营范围' },
      { key: 'address', label: '经营地址', type: 'input', required: true, placeholder: '请输入详细经营地址' },
      { key: 'idCard', label: '身份证', type: 'license', required: true },
      { key: 'businessType', label: '经营类型', type: 'select', required: true, options: [
        { label: '批发零售', value: 'retail' },
        { label: '餐饮服务', value: 'catering' },
        { label: '居民服务', value: 'service' }
      ]}
    ],
    isHot: true
  },
  {
    id: 'RI002',
    code: 'DJ-ENT-001',
    name: '有限责任公司设立登记',
    category: '市场主体登记',
    description: '有限责任公司的设立注册登记',
    estimatedDays: 5,
    requiredMaterials: ['公司章程', '股东身份证明', '住所证明', '法定代表人信息'],
    formFields: [
      { key: 'companyName', label: '公司名称', type: 'input', required: true },
      { key: 'registeredCapital', label: '注册资本', type: 'input', required: true },
      { key: 'businessScope', label: '经营范围', type: 'textarea', required: true }
    ],
    isHot: true
  },
  {
    id: 'RI003',
    code: 'XK-FOOD-001',
    name: '食品经营许可证核发',
    category: '行政许可',
    description: '食品销售、餐饮服务等经营许可',
    estimatedDays: 10,
    requiredMaterials: ['营业执照', '经营场所布局图', '食品安全管理制度'],
    formFields: [
      { key: 'businessType', label: '经营类别', type: 'select', required: true, options: [
        { label: '食品销售', value: 'sales' },
        { label: '餐饮服务', value: 'catering' },
        { label: '单位食堂', value: 'canteen' }
      ]},
      { key: 'address', label: '经营地址', type: 'input', required: true }
    ],
    isHot: false
  },
  {
    id: 'RI004',
    code: 'BG-IND-001',
    name: '个体工商户变更登记',
    category: '变更登记',
    description: '个体工商户名称、地址、经营范围等变更',
    estimatedDays: 3,
    requiredMaterials: ['变更申请书', '营业执照正副本', '相关证明材料'],
    formFields: [
      { key: 'changeType', label: '变更类型', type: 'checkbox', required: true, options: [
        { label: '名称变更', value: 'name' },
        { label: '地址变更', value: 'address' },
        { label: '经营范围变更', value: 'scope' }
      ]}
    ],
    isHot: false
  },
  {
    id: 'RI005',
    code: 'ZX-IND-001',
    name: '个体工商户注销登记',
    category: '注销登记',
    description: '个体工商户终止经营的注销登记',
    estimatedDays: 3,
    requiredMaterials: ['注销申请书', '营业执照正副本', '清税证明'],
    formFields: [
      { key: 'cancelReason', label: '注销原因', type: 'select', required: true, options: [
        { label: '自愿终止经营', value: 'voluntary' },
        { label: '依法被吊销', value: 'revoked' },
        { label: '其他原因', value: 'other' }
      ]}
    ],
    isHot: false
  },
  {
    id: 'RI006',
    code: 'NJ-001',
    name: '企业年度报告公示',
    category: '年度报告',
    description: '企业年度报告填报与公示',
    estimatedDays: 1,
    requiredMaterials: ['企业基本信息', '经营情况数据', '股东及出资信息'],
    formFields: [
      { key: 'reportYear', label: '报告年度', type: 'select', required: true, options: [
        { label: '2024年度', value: '2024' },
        { label: '2023年度', value: '2023' }
      ]}
    ],
    isHot: false
  }
];

export const mockApplyRecords: ApplyRecord[] = [
  {
    id: 'APP20240001',
    itemId: 'RI001',
    itemName: '个体工商户设立登记',
    itemCode: 'DJ-IND-001',
    applicantId: 'U20240001',
    applicantName: '张三',
    formData: { name: 'XX小吃店', businessType: 'catering', address: 'XX路123号' },
    materials: [
      { name: '身份证正反面', url: '#', fromLicense: true },
      { name: '经营场所证明', url: '#', fromLicense: false }
    ],
    status: 'reviewing',
    currentStep: 2,
    totalSteps: 5,
    createdAt: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    approvalNodes: [
      { id: 'N1', name: '材料受理', role: '受理员', status: 'approved', level: 1, operatedAt: dayjs().subtract(2, 'day').add(2, 'hour').format('YYYY-MM-DD HH:mm:ss'), comment: '材料齐全，符合受理条件' },
      { id: 'N2', name: '初审', role: '初审员', assignee: '王审核', status: 'processing', level: 2 },
      { id: 'N3', name: '复审', role: '复审员', status: 'pending', level: 3 },
      { id: 'N4', name: '核准', role: '核准员', status: 'pending', level: 4 },
      { id: 'N5', name: '证照发放', role: '发证员', status: 'pending', level: 5 }
    ]
  },
  {
    id: 'APP20240002',
    itemId: 'RI003',
    itemName: '食品经营许可证核发',
    itemCode: 'XK-FOOD-001',
    applicantId: 'U20240001',
    applicantName: '张三',
    formData: { businessType: 'catering', address: 'XX路456号' },
    materials: [{ name: '营业执照', url: '#', fromLicense: true }],
    status: 'rejected',
    currentStep: 2,
    totalSteps: 5,
    createdAt: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    rejectReason: {
      category: '材料不符合',
      reasons: [
        { field: '经营场所布局图', message: '未标注食品处理区位置', suggestion: '请在布局图中标注厨房、仓储等区域' },
        { field: '食品安全管理制度', message: '制度内容不完整', suggestion: '请补充从业人员健康管理制度' }
      ],
      remark: '请按要求补充材料后重新提交',
      operator: '赵审核',
      rejectedAt: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss')
    },
    approvalNodes: [
      { id: 'N1', name: '材料受理', role: '受理员', status: 'approved', level: 1 },
      { id: 'N2', name: '现场核查', role: '核查员', status: 'rejected', level: 2 },
      { id: 'N3', name: '复审', role: '复审员', status: 'pending', level: 3 }
    ]
  },
  {
    id: 'APP20240003',
    itemId: 'RI002',
    itemName: '有限责任公司设立登记',
    itemCode: 'DJ-ENT-001',
    applicantId: 'U20240002',
    applicantName: '李四',
    enterpriseName: 'XX科技有限公司',
    formData: { companyName: 'XX科技有限公司', registeredCapital: '100万元' },
    materials: [{ name: '公司章程', url: '#', fromLicense: false }],
    status: 'approved',
    currentStep: 5,
    totalSteps: 5,
    createdAt: dayjs().subtract(7, 'day').format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    approvalNodes: [
      { id: 'N1', name: '名称核准', role: '核准员', status: 'approved', level: 1 },
      { id: 'N2', name: '材料受理', role: '受理员', status: 'approved', level: 2 },
      { id: 'N3', name: '初审', role: '初审员', status: 'approved', level: 3 },
      { id: 'N4', name: '复审', role: '复审员', status: 'approved', level: 4 },
      { id: 'N5', name: '证照发放', role: '发证员', status: 'approved', level: 5 }
    ]
  },
  {
    id: 'APP20240004',
    itemId: 'RI004',
    itemName: '个体工商户变更登记',
    itemCode: 'BG-IND-001',
    applicantId: 'U20240001',
    applicantName: '张三',
    formData: { changeType: ['address', 'scope'] },
    materials: [{ name: '营业执照正副本', url: '#', fromLicense: true }],
    status: 'reviewing',
    currentStep: 3,
    totalSteps: 4,
    createdAt: dayjs().subtract(4, 'day').format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    approvalNodes: [
      { id: 'N1', name: '受理', role: '受理员', status: 'approved', level: 1 },
      { id: 'N2', name: '初审', role: '初审员', status: 'approved', level: 2 },
      { id: 'N3', name: '二审', role: '复审员', assignee: '钱审核', status: 'processing', level: 3 },
      { id: 'N4', name: '发证', role: '发证员', status: 'pending', level: 4 }
    ]
  }
];

export const mockSignDocuments: SignDocument[] = [
  {
    id: 'SD20240001',
    applyId: 'APP20240001',
    applyName: '个体工商户设立登记',
    title: '个体工商户设立登记申请书',
    documentType: 'application',
    content: '申请书内容预览...（此处为正式法律文书内容）',
    pages: 3,
    signPositions: [
      { page: 1, x: 100, y: 700, width: 180, height: 80, signerRole: '申请人' },
      { page: 3, x: 450, y: 600, width: 150, height: 150, signerRole: '登记机关' }
    ],
    requireSignerCount: 1,
    status: 'pending',
    createdAt: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    deadline: dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm:ss')
  },
  {
    id: 'SD20240002',
    applyId: 'APP20240002',
    applyName: '食品经营许可证核发',
    title: '食品经营安全承诺书',
    documentType: 'declaration',
    content: '承诺书内容预览...',
    pages: 2,
    signPositions: [
      { page: 2, x: 80, y: 680, width: 200, height: 80, signerRole: '承诺人' }
    ],
    requireSignerCount: 1,
    status: 'signing',
    createdAt: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss')
  },
  {
    id: 'SD20240003',
    applyId: 'APP20240003',
    applyName: '有限责任公司设立登记',
    title: '公司章程',
    documentType: 'agreement',
    content: '公司章程内容...',
    pages: 15,
    signPositions: [
      { page: 1, x: 400, y: 650, width: 160, height: 80, signerRole: '股东A' },
      { page: 1, x: 560, y: 650, width: 160, height: 80, signerRole: '股东B' },
      { page: 15, x: 480, y: 500, width: 180, height: 180, signerRole: '公司盖章处' }
    ],
    requireSignerCount: 2,
    status: 'completed',
    createdAt: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss')
  }
];

export const mockNotices: Notice[] = [
  {
    id: 'N001',
    title: '关于2024年度市场主体年报公示的通知',
    content: '各市场主体请于2024年6月30日前完成年度报告填报与公示工作...',
    type: 'notification',
    level: 'urgent',
    publishedAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    publisher: '省市场监督管理局'
  },
  {
    id: 'N002',
    title: '电子签名系统升级维护公告',
    content: '系统将于本周六凌晨2:00-4:00进行升级维护，届时电子签名功能将暂停使用...',
    type: 'system',
    level: 'important',
    publishedAt: dayjs().subtract(3, 'day').format('YYYY-MM-DD'),
    publisher: '省政务服务中心'
  },
  {
    id: 'N003',
    title: '《个体工商户条例》修订政策解读',
    content: '为贯彻落实《促进个体工商户发展条例》，现将相关政策解读如下...',
    type: 'policy',
    level: 'normal',
    publishedAt: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    publisher: '省市场监督管理局法规处'
  }
];

export const mockLicenses: ElectronicLicense[] = [
  {
    id: 'LIC001',
    licenseType: '居民身份证',
    licenseNo: '3201**********1234',
    holderName: '张三',
    issuer: 'XX市公安局',
    issueDate: '2018-06-01',
    validFrom: '2018-06-01',
    validTo: '2038-06-01',
    status: 'valid',
    canBeShared: true
  },
  {
    id: 'LIC002',
    licenseType: '营业执照',
    licenseNo: '923201********1234',
    holderName: 'XX小吃店',
    issuer: 'XX区市场监督管理局',
    issueDate: '2024-01-15',
    validFrom: '2024-01-15',
    validTo: '长期',
    status: 'valid',
    canBeShared: true
  }
];
