export interface Material {
  id: string
  name: string
  type: 'required' | 'optional' | 'conditional'
  format: string
  certLinked?: string
  status: 'provided' | 'missing' | 'auto_filled'
}

export interface ProcessStep {
  id: string
  name: string
  description: string
  order: number
  duration: string
}

export interface GuangdongStandardFields {
  itemCode: string
  implementCode: string
  serviceType: '即办件' | '承诺件' | '上报件'
  powerSource: string
  legalBasis: string
  handlingDepartment: string
  undertakingInstitution: string
  consultationPhone: string
  complaintPhone: string
  onlineApplyUrl: string
  windowAddress: string
  handlingMethod: string
  quantityLimit: string
  approvalLevel: string
  resultType: string
}

export interface FormField {
  name: string
  label: string
  type: 'text' | 'select' | 'date' | 'textarea' | 'number'
  required: boolean
  autoFillSource?: string
  placeholder?: string
  options?: { value: string; label: string }[]
  value?: string
}

export interface JointFlowNode {
  id: string
  name: string
  type: 'service' | 'approval' | 'material' | 'end'
  itemId?: string
  dependsOn: string[]
  parallel: boolean
  duration: string
  status: 'pending' | 'running' | 'completed' | 'error'
}

export interface PrecheckResult {
  serviceId: string
  overallStatus: 'pass' | 'warning' | 'fail'
  materials: { materialId: string; status: 'pass' | 'fail' | 'auto_filled' | 'warning'; note: string }[]
  suggestions: string[]
}

export interface ServiceItem {
  id: string
  name: string
  department: string
  category: string
  description: string
  materials: Material[]
  processSteps: ProcessStep[]
  timeLimit: string
  fee: string
  location: string
  onlineRate: number
  guangdongStandard: GuangdongStandardFields
  formFields: FormField[]
  relatedJointService?: string
  workflowStepDurations?: {
    precheck: number
    fill: number
  }
}

export interface JointService {
  id: string
  name: string
  departments: string[]
  description: string
  serviceItems: string[]
  totalTimeLimit: string
  savingsPercent: number
}

export interface ServiceCategory {
  id: string
  name: string
  children: { id: string; name: string }[]
}

export const serviceCategories: ServiceCategory[] = [
  {
    id: 'sc_1',
    name: '户政服务',
    children: [
      { id: 'sc_1_1', name: '户籍登记' },
      { id: 'sc_1_2', name: '居住证办理' },
      { id: 'sc_1_3', name: '身份证明' },
    ],
  },
  {
    id: 'sc_2',
    name: '社会保障',
    children: [
      { id: 'sc_2_1', name: '社保参保' },
      { id: 'sc_2_2', name: '社保转移' },
      { id: 'sc_2_3', name: '医保服务' },
    ],
  },
  {
    id: 'sc_3',
    name: '住房服务',
    children: [
      { id: 'sc_3_1', name: '公积金业务' },
      { id: 'sc_3_2', name: '不动产登记' },
      { id: 'sc_3_3', name: '保障性住房' },
    ],
  },
  {
    id: 'sc_4',
    name: '市场准入',
    children: [
      { id: 'sc_4_1', name: '企业注册' },
      { id: 'sc_4_2', name: '资质许可' },
      { id: 'sc_4_3', name: '变更注销' },
    ],
  },
  {
    id: 'sc_5',
    name: '交通出行',
    children: [
      { id: 'sc_5_1', name: '驾驶证业务' },
      { id: 'sc_5_2', name: '车辆登记' },
      { id: 'sc_5_3', name: '违章处理' },
    ],
  },
]

export const serviceItems: ServiceItem[] = [
  {
    id: 'svc_1',
    name: '户籍迁移登记',
    department: '深圳市公安局',
    category: 'sc_1_1',
    description: '深圳市户籍市内迁移登记，包括跨区迁移和区内迁移',
    materials: [
      { id: 'mat_1_1', name: '居民身份证', type: 'required', format: '原件', certLinked: 'cert_1', status: 'auto_filled' },
      { id: 'mat_1_2', name: '户口簿', type: 'required', format: '原件', status: 'provided' },
      { id: 'mat_1_3', name: '房产证明', type: 'conditional', format: '原件/复印件', certLinked: 'cert_19', status: 'auto_filled' },
      { id: 'mat_1_4', name: '结婚证', type: 'conditional', format: '原件', certLinked: 'cert_6', status: 'auto_filled' },
    ],
    processSteps: [
      { id: 'step_1_1', name: '在线申请', description: '通过广东政务服务网提交申请材料', order: 1, duration: '10分钟' },
      { id: 'step_1_2', name: '材料审核', description: '公安机关审核提交的申请材料', order: 2, duration: '1个工作日' },
      { id: 'step_1_3', name: '审批办理', description: '审批通过后办理户籍迁移手续', order: 3, duration: '3个工作日' },
      { id: 'step_1_4', name: '结果送达', description: '新户口簿邮寄或现场领取', order: 4, duration: '1个工作日' },
    ],
    timeLimit: '5个工作日',
    fee: '免费',
    location: '各区公安分局户政大厅',
    onlineRate: 92,
    guangdongStandard: {
      itemCode: '00723001000',
      implementCode: '11440300007542785T4440709003000',
      serviceType: '承诺件',
      powerSource: '法定本级行使',
      legalBasis: '《中华人民共和国户口登记条例》第十条',
      handlingDepartment: '深圳市公安局',
      undertakingInstitution: '深圳市公安局户政管理支队',
      consultationPhone: '0755-84465000',
      complaintPhone: '0755-84465000',
      onlineApplyUrl: 'https://msjwt.gdzwfw.gov.cn/zwfw/portal/service/detail.html?serviceCode=11440300007542785T4440709003000',
      windowAddress: '深圳市各区公安分局户政大厅',
      handlingMethod: '窗口办理、网上办理',
      quantityLimit: '无数量限制',
      approvalLevel: '县级',
      resultType: '证件',
    },
    formFields: [
      { name: 'applicantName', label: '申请人姓名', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入申请人姓名' },
      { name: 'idCard', label: '身份证号码', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入身份证号码' },
      { name: 'householdType', label: '户口类型', type: 'select', required: true, options: [{ value: 'agriculture', label: '农业户口' }, { value: 'non_agriculture', label: '非农业户口' }] },
      { name: 'moveInAddress', label: '迁入地址', type: 'text', required: true, placeholder: '请输入迁入详细地址' },
      { name: 'moveReason', label: '迁移原因', type: 'select', required: true, options: [{ value: 'work', label: '工作调动' }, { value: 'study', label: '升学' }, { value: 'family', label: '投靠亲属' }, { value: 'purchase', label: '购房入户' }] },
      { name: 'contactPhone', label: '联系电话', type: 'text', required: true, placeholder: '请输入联系电话' },
      { name: 'remark', label: '备注', type: 'textarea', required: false, placeholder: '请输入备注信息' },
    ],
    relatedJointService: 'js_4',
    workflowStepDurations: { precheck: 2000, fill: 2000 },
  },
  {
    id: 'svc_2',
    name: '居住证申领',
    department: '深圳市公安局',
    category: 'sc_1_2',
    description: '非深圳户籍人员申领深圳市居住证',
    materials: [
      { id: 'mat_2_1', name: '居民身份证', type: 'required', format: '原件', certLinked: 'cert_1', status: 'auto_filled' },
      { id: 'mat_2_2', name: '居住登记证明', type: 'required', format: '原件', certLinked: 'cert_5', status: 'auto_filled' },
      { id: 'mat_2_3', name: '社保缴纳证明', type: 'required', format: '原件', certLinked: 'cert_8', status: 'auto_filled' },
      { id: 'mat_2_4', name: '近期照片', type: 'required', format: '电子版', status: 'provided' },
    ],
    processSteps: [
      { id: 'step_2_1', name: '在线填报', description: '填写居住证申领表', order: 1, duration: '5分钟' },
      { id: 'step_2_2', name: '材料核验', description: '系统自动核验身份证和社保信息', order: 2, duration: '即时' },
      { id: 'step_2_3', name: '审批制证', description: '审批通过并制作居住证', order: 3, duration: '7个工作日' },
      { id: 'step_2_4', name: '证件领取', description: '邮寄或网点领取居住证', order: 4, duration: '2个工作日' },
    ],
    timeLimit: '10个工作日',
    fee: '免费',
    location: '各区公安分局户政大厅/i深圳APP',
    onlineRate: 95,
    guangdongStandard: {
      itemCode: '00723002000',
      implementCode: '11440300007542785T4440709006000',
      serviceType: '承诺件',
      powerSource: '法定本级行使',
      legalBasis: '《居住证暂行条例》第二条、第八条',
      handlingDepartment: '深圳市公安局',
      undertakingInstitution: '深圳市公安局户政管理支队',
      consultationPhone: '0755-84465000',
      complaintPhone: '0755-84465000',
      onlineApplyUrl: 'https://msjwt.gdzwfw.gov.cn/zwfw/portal/service/detail.html?serviceCode=11440300007542785T4440709006000',
      windowAddress: '深圳市各区公安分局户政大厅',
      handlingMethod: '窗口办理、网上办理',
      quantityLimit: '无数量限制',
      approvalLevel: '县级',
      resultType: '证件',
    },
    formFields: [
      { name: 'applicantName', label: '申请人姓名', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入申请人姓名' },
      { name: 'idCard', label: '身份证号码', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入身份证号码' },
      { name: 'residenceAddress', label: '居住地址', type: 'text', required: true, placeholder: '请输入居住详细地址' },
      { name: 'residenceType', label: '居住类型', type: 'select', required: true, options: [{ value: 'rent', label: '租赁住房' }, { value: 'own', label: '自有住房' }, { value: 'unit', label: '单位宿舍' }] },
      { name: 'workUnit', label: '工作单位', type: 'text', required: true, placeholder: '请输入工作单位名称' },
      { name: 'contactPhone', label: '联系电话', type: 'text', required: true, placeholder: '请输入联系电话' },
      { name: 'photoUrl', label: '电子照片', type: 'text', required: false, placeholder: '请上传电子照片' },
    ],
  },
  {
    id: 'svc_3',
    name: '身份证补换领',
    department: '深圳市公安局',
    category: 'sc_1_3',
    description: '居民身份证遗失、损坏或到期补换领',
    materials: [
      { id: 'mat_3_1', name: '户口簿', type: 'required', format: '原件', status: 'provided' },
      { id: 'mat_3_2', name: '旧身份证', type: 'conditional', format: '原件', status: 'missing' },
      { id: 'mat_3_3', name: '照片回执', type: 'required', format: '纸质', status: 'provided' },
    ],
    processSteps: [
      { id: 'step_3_1', name: '预约取号', description: '在线预约办理时间和地点', order: 1, duration: '2分钟' },
      { id: 'step_3_2', name: '现场采集', description: '现场采集指纹和照片信息', order: 2, duration: '15分钟' },
      { id: 'step_3_3', name: '审批制证', description: '审核通过并制作新身份证', order: 3, duration: '30个工作日' },
      { id: 'step_3_4', name: '证件领取', description: '邮寄或现场领取新证', order: 4, duration: '3个工作日' },
    ],
    timeLimit: '35个工作日',
    fee: '20元/40元',
    location: '各区公安分局户政大厅',
    onlineRate: 60,
    guangdongStandard: {
      itemCode: '00723003000',
      implementCode: '11440300007542785T4440709002000',
      serviceType: '承诺件',
      powerSource: '法定本级行使',
      legalBasis: '《中华人民共和国居民身份证法》第十一条、第十二条',
      handlingDepartment: '深圳市公安局',
      undertakingInstitution: '深圳市公安局户政管理支队',
      consultationPhone: '0755-84465000',
      complaintPhone: '0755-84465000',
      onlineApplyUrl: 'https://msjwt.gdzwfw.gov.cn/zwfw/portal/service/detail.html?serviceCode=11440300007542785T4440709002000',
      windowAddress: '深圳市各区公安分局户政大厅',
      handlingMethod: '窗口办理',
      quantityLimit: '无数量限制',
      approvalLevel: '县级',
      resultType: '证件',
    },
    formFields: [
      { name: 'applicantName', label: '申请人姓名', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入申请人姓名' },
      { name: 'idCard', label: '身份证号码', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入身份证号码' },
      { name: 'applyType', label: '申请类型', type: 'select', required: true, options: [{ value: 'lost', label: '遗失补领' }, { value: 'damage', label: '损坏换领' }, { value: 'expire', label: '到期换领' }] },
      { name: 'oldIdCard', label: '旧身份证号', type: 'text', required: false, placeholder: '请输入旧身份证号码' },
      { name: 'householdAddress', label: '户籍地址', type: 'text', required: true, placeholder: '请输入户籍地址' },
      { name: 'contactPhone', label: '联系电话', type: 'text', required: true, placeholder: '请输入联系电话' },
      { name: 'receiptNumber', label: '照片回执编号', type: 'text', required: true, placeholder: '请输入照片回执编号' },
    ],
  },
  {
    id: 'svc_4',
    name: '社保关系转移接续',
    department: '深圳市社会保险基金管理局',
    category: 'sc_2_2',
    description: '跨统筹地区社保关系转移接续办理',
    materials: [
      { id: 'mat_4_1', name: '居民身份证', type: 'required', format: '原件', certLinked: 'cert_1', status: 'auto_filled' },
      { id: 'mat_4_2', name: '社保参保凭证', type: 'required', format: '原件', certLinked: 'cert_8', status: 'auto_filled' },
      { id: 'mat_4_3', name: '转出地社保凭证', type: 'required', format: '原件', status: 'provided' },
    ],
    processSteps: [
      { id: 'step_4_1', name: '提交申请', description: '在线提交转移接续申请', order: 1, duration: '10分钟' },
      { id: 'step_4_2', name: '信息核验', description: '系统核验参保信息和身份信息', order: 2, duration: '3个工作日' },
      { id: 'step_4_3', name: '联系函发送', description: '向转出地发送联系函', order: 3, duration: '5个工作日' },
      { id: 'step_4_4', name: '转移完成', description: '确认资金到账并完成转移', order: 4, duration: '30个工作日' },
    ],
    timeLimit: '45个工作日',
    fee: '免费',
    location: '深圳市社保局各分局/线上办理',
    onlineRate: 88,
    guangdongStandard: {
      itemCode: '00724001000',
      implementCode: '11440300691166817W4442411800000',
      serviceType: '承诺件',
      powerSource: '法定本级行使',
      legalBasis: '《城镇企业职工基本养老保险关系转移接续暂行办法》第三条',
      handlingDepartment: '深圳市社会保险基金管理局',
      undertakingInstitution: '深圳市社会保险基金管理局各分局',
      consultationPhone: '12333',
      complaintPhone: '12345',
      onlineApplyUrl: 'https://msjwt.gdzwfw.gov.cn/zwfw/portal/service/detail.html?serviceCode=11440300691166817W4442411800000',
      windowAddress: '深圳市各社保分局办事大厅',
      handlingMethod: '窗口办理、网上办理',
      quantityLimit: '无数量限制',
      approvalLevel: '市级',
      resultType: '其他',
    },
    formFields: [
      { name: 'applicantName', label: '申请人姓名', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入申请人姓名' },
      { name: 'idCard', label: '身份证号码', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入身份证号码' },
      { name: 'transferType', label: '转移类型', type: 'select', required: true, options: [{ value: 'pension', label: '养老保险' }, { value: 'medical', label: '医疗保险' }, { value: 'unemployment', label: '失业保险' }] },
      { name: 'transferOutPlace', label: '转出地', type: 'text', required: true, placeholder: '请输入转出地城市' },
      { name: 'transferInPlace', label: '转入地', type: 'text', required: true, value: '深圳市', placeholder: '请输入转入地城市' },
      { name: 'contactPhone', label: '联系电话', type: 'text', required: true, placeholder: '请输入联系电话' },
      { name: 'originalSocialCard', label: '原参保地社保卡号', type: 'text', required: false, placeholder: '请输入原参保地社保卡号' },
    ],
  },
  {
    id: 'svc_5',
    name: '医保异地就医备案',
    department: '深圳市医疗保障局',
    category: 'sc_2_3',
    description: '深圳市参保人员异地就医备案登记',
    materials: [
      { id: 'mat_5_1', name: '居民身份证', type: 'required', format: '原件', certLinked: 'cert_1', status: 'auto_filled' },
      { id: 'mat_5_2', name: '医保凭证', type: 'required', format: '原件', certLinked: 'cert_9', status: 'auto_filled' },
      { id: 'mat_5_3', name: '居住证明', type: 'conditional', format: '原件', status: 'provided' },
    ],
    processSteps: [
      { id: 'step_5_1', name: '在线备案', description: '通过医保平台提交备案申请', order: 1, duration: '5分钟' },
      { id: 'step_5_2', name: '信息审核', description: '医保部门审核备案信息', order: 2, duration: '2个工作日' },
      { id: 'step_5_3', name: '备案成功', description: '备案通过后可异地就医直接结算', order: 3, duration: '即时' },
    ],
    timeLimit: '3个工作日',
    fee: '免费',
    location: '深圳市医保局/线上办理',
    onlineRate: 97,
    guangdongStandard: {
      itemCode: '00724002000',
      implementCode: '11440300MB2C9238794442015001000',
      serviceType: '即办件',
      powerSource: '法定本级行使',
      legalBasis: '《国家基本医疗保险、工伤保险和生育保险药品目录》',
      handlingDepartment: '深圳市医疗保障局',
      undertakingInstitution: '深圳市医疗保障事业管理中心',
      consultationPhone: '12393',
      complaintPhone: '12345',
      onlineApplyUrl: 'https://msjwt.gdzwfw.gov.cn/zwfw/portal/service/detail.html?serviceCode=11440300MB2C9238794442015001000',
      windowAddress: '深圳市各医保经办机构',
      handlingMethod: '窗口办理、网上办理',
      quantityLimit: '无数量限制',
      approvalLevel: '市级',
      resultType: '其他',
    },
    formFields: [
      { name: 'applicantName', label: '申请人姓名', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入申请人姓名' },
      { name: 'idCard', label: '身份证号码', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入身份证号码' },
      { name: 'recordType', label: '备案类型', type: 'select', required: true, options: [{ value: 'long_term', label: '长期异地居住' }, { value: 'temporary', label: '临时外出就医' }, { value: 'work', label: '异地工作' }] },
      { name: 'recordCity', label: '备案城市', type: 'text', required: true, placeholder: '请输入备案城市' },
      { name: 'startDate', label: '备案开始日期', type: 'date', required: true, placeholder: '请选择开始日期' },
      { name: 'endDate', label: '备案结束日期', type: 'date', required: false, placeholder: '请选择结束日期' },
      { name: 'contactPhone', label: '联系电话', type: 'text', required: true, placeholder: '请输入联系电话' },
    ],
  },
  {
    id: 'svc_6',
    name: '住房公积金提取',
    department: '深圳市住房公积金管理中心',
    category: 'sc_3_1',
    description: '住房公积金购房、租房、还贷等提取业务',
    materials: [
      { id: 'mat_6_1', name: '居民身份证', type: 'required', format: '原件', certLinked: 'cert_1', status: 'auto_filled' },
      { id: 'mat_6_2', name: '公积金缴存证明', type: 'required', format: '原件', certLinked: 'cert_10', status: 'auto_filled' },
      { id: 'mat_6_3', name: '购房合同', type: 'conditional', format: '原件', status: 'provided' },
      { id: 'mat_6_4', name: '贷款合同', type: 'conditional', format: '原件', status: 'missing' },
    ],
    processSteps: [
      { id: 'step_6_1', name: '在线申请', description: '选择提取原因并提交申请', order: 1, duration: '5分钟' },
      { id: 'step_6_2', name: '自动核验', description: '系统自动核验公积金和身份信息', order: 2, duration: '即时' },
      { id: 'step_6_3', name: '审批划款', description: '审批通过后划入个人银行账户', order: 3, duration: '3个工作日' },
    ],
    timeLimit: '3个工作日',
    fee: '免费',
    location: '深圳市公积金中心/线上办理',
    onlineRate: 98,
    guangdongStandard: {
      itemCode: '00725001000',
      implementCode: '12440300G34780704T4440714001000',
      serviceType: '即办件',
      powerSource: '法定本级行使',
      legalBasis: '《住房公积金管理条例》第二十四条',
      handlingDepartment: '深圳市住房公积金管理中心',
      undertakingInstitution: '深圳市住房公积金管理中心各管理部',
      consultationPhone: '0755-12329',
      complaintPhone: '0755-12345',
      onlineApplyUrl: 'https://msjwt.gdzwfw.gov.cn/zwfw/portal/service/detail.html?serviceCode=12440300G34780704T4440714001000',
      windowAddress: '深圳市各公积金管理部办事大厅',
      handlingMethod: '窗口办理、网上办理',
      quantityLimit: '无数量限制',
      approvalLevel: '市级',
      resultType: '其他',
    },
    formFields: [
      { name: 'applicantName', label: '申请人姓名', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入申请人姓名' },
      { name: 'idCard', label: '身份证号码', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入身份证号码' },
      { name: 'extractType', label: '提取类型', type: 'select', required: true, options: [{ value: 'buy_house', label: '购房提取' }, { value: 'rent', label: '租房提取' }, { value: 'loan', label: '还贷提取' }, { value: 'retire', label: '退休提取' }] },
      { name: 'extractAmount', label: '提取金额', type: 'number', required: true, placeholder: '请输入提取金额' },
      { name: 'bankCard', label: '收款银行卡号', type: 'text', required: true, placeholder: '请输入银行卡号' },
      { name: 'bankName', label: '开户银行', type: 'select', required: true, options: [{ value: 'icbc', label: '工商银行' }, { value: 'ccb', label: '建设银行' }, { value: 'abc', label: '农业银行' }, { value: 'boc', label: '中国银行' }] },
      { name: 'contactPhone', label: '联系电话', type: 'text', required: true, placeholder: '请输入联系电话' },
    ],
  },
  {
    id: 'svc_7',
    name: '不动产转移登记',
    department: '深圳市规划和自然资源局',
    category: 'sc_3_2',
    description: '房屋买卖、赠与、继承等不动产转移登记',
    materials: [
      { id: 'mat_7_1', name: '居民身份证', type: 'required', format: '原件', certLinked: 'cert_1', status: 'auto_filled' },
      { id: 'mat_7_2', name: '不动产权证书', type: 'required', format: '原件', certLinked: 'cert_19', status: 'auto_filled' },
      { id: 'mat_7_3', name: '买卖合同', type: 'required', format: '原件', status: 'provided' },
      { id: 'mat_7_4', name: '结婚证', type: 'conditional', format: '原件', certLinked: 'cert_6', status: 'auto_filled' },
      { id: 'mat_7_5', name: '税费缴纳凭证', type: 'required', format: '原件', status: 'provided' },
    ],
    processSteps: [
      { id: 'step_7_1', name: '在线申请', description: '通过不动产登记平台提交申请', order: 1, duration: '15分钟' },
      { id: 'step_7_2', name: '材料核验', description: '登记机构核验申请材料', order: 2, duration: '1个工作日' },
      { id: 'step_7_3', name: '缴纳税费', description: '在线缴纳契税等相关税费', order: 3, duration: '即时' },
      { id: 'step_7_4', name: '登簿发证', description: '完成登记并颁发新产权证', order: 4, duration: '3个工作日' },
    ],
    timeLimit: '5个工作日',
    fee: '登记费80元/件',
    location: '深圳市不动产登记中心',
    onlineRate: 85,
    guangdongStandard: {
      itemCode: '00725002000',
      implementCode: '11440300MB2C9238794440714002000',
      serviceType: '承诺件',
      powerSource: '法定本级行使',
      legalBasis: '《不动产登记暂行条例》第三条、第十四条',
      handlingDepartment: '深圳市规划和自然资源局',
      undertakingInstitution: '深圳市不动产登记中心',
      consultationPhone: '0755-96508888',
      complaintPhone: '0755-12345',
      onlineApplyUrl: 'https://msjwt.gdzwfw.gov.cn/zwfw/portal/service/detail.html?serviceCode=11440300MB2C9238794440714002000',
      windowAddress: '深圳市不动产登记中心各登记所',
      handlingMethod: '窗口办理、网上办理',
      quantityLimit: '无数量限制',
      approvalLevel: '市级',
      resultType: '证件',
    },
    formFields: [
      { name: 'applicantName', label: '申请人姓名', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入申请人姓名' },
      { name: 'idCard', label: '身份证号码', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入身份证号码' },
      { name: 'propertyAddress', label: '房产地址', type: 'text', required: true, placeholder: '请输入房产详细地址' },
      { name: 'propertyRightNumber', label: '不动产权证号', type: 'text', required: true, autoFillSource: 'cert_19', placeholder: '请输入不动产权证号' },
      { name: 'transferType', label: '转移类型', type: 'select', required: true, options: [{ value: 'sale', label: '买卖' }, { value: 'gift', label: '赠与' }, { value: 'inherit', label: '继承' }] },
      { name: 'transactionPrice', label: '成交价格', type: 'number', required: false, placeholder: '请输入成交价格' },
      { name: 'contactPhone', label: '联系电话', type: 'text', required: true, placeholder: '请输入联系电话' },
    ],
    relatedJointService: 'js_3',
    workflowStepDurations: { precheck: 2500, fill: 2500 },
  },
  {
    id: 'svc_8',
    name: '保障性住房申请',
    department: '深圳市住房和建设局',
    category: 'sc_3_3',
    description: '深圳市公共租赁住房和安居型商品房申请',
    materials: [
      { id: 'mat_8_1', name: '居民身份证', type: 'required', format: '原件', certLinked: 'cert_1', status: 'auto_filled' },
      { id: 'mat_8_2', name: '社保参保凭证', type: 'required', format: '原件', certLinked: 'cert_8', status: 'auto_filled' },
      { id: 'mat_8_3', name: '婚姻证明', type: 'required', format: '原件', certLinked: 'cert_6', status: 'auto_filled' },
      { id: 'mat_8_4', name: '住房情况证明', type: 'required', format: '原件', status: 'provided' },
      { id: 'mat_8_5', name: '收入证明', type: 'required', format: '原件', status: 'provided' },
    ],
    processSteps: [
      { id: 'step_8_1', name: '在线申请', description: '提交保障性住房轮候申请', order: 1, duration: '20分钟' },
      { id: 'step_8_2', name: '资格审核', description: '多部门联合审核申请资格', order: 2, duration: '30个工作日' },
      { id: 'step_8_3', name: '公示轮候', description: '公示审核通过名单并进入轮候', order: 3, duration: '5个工作日' },
      { id: 'step_8_4', name: '选房签约', description: '按轮候顺序选房并签订合同', order: 4, duration: '1个工作日' },
    ],
    timeLimit: '40个工作日',
    fee: '免费',
    location: '深圳市住房保障署',
    onlineRate: 90,
    guangdongStandard: {
      itemCode: '00725003000',
      implementCode: '11440300691166817W4440717001000',
      serviceType: '承诺件',
      powerSource: '法定本级行使',
      legalBasis: '《公共租赁住房管理办法》第七条、第八条',
      handlingDepartment: '深圳市住房和建设局',
      undertakingInstitution: '深圳市住房保障署',
      consultationPhone: '0755-88631666',
      complaintPhone: '0755-12345',
      onlineApplyUrl: 'https://msjwt.gdzwfw.gov.cn/zwfw/portal/service/detail.html?serviceCode=11440300691166817W4440717001000',
      windowAddress: '深圳市住房保障署办事大厅',
      handlingMethod: '窗口办理、网上办理',
      quantityLimit: '无数量限制',
      approvalLevel: '市级',
      resultType: '其他',
    },
    formFields: [
      { name: 'applicantName', label: '申请人姓名', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入申请人姓名' },
      { name: 'idCard', label: '身份证号码', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入身份证号码' },
      { name: 'houseType', label: '保障房类型', type: 'select', required: true, options: [{ value: 'public_rent', label: '公共租赁住房' }, { value: 'comfortable', label: '安居型商品房' }] },
      { name: 'familySize', label: '家庭人口数', type: 'number', required: true, placeholder: '请输入家庭人口数' },
      { name: 'annualIncome', label: '家庭年收入', type: 'number', required: true, placeholder: '请输入家庭年收入' },
      { name: 'maritalStatus', label: '婚姻状况', type: 'select', required: true, options: [{ value: 'single', label: '未婚' }, { value: 'married', label: '已婚' }, { value: 'divorced', label: '离异' }] },
      { name: 'contactPhone', label: '联系电话', type: 'text', required: true, placeholder: '请输入联系电话' },
    ],
  },
  {
    id: 'svc_9',
    name: '企业设立登记',
    department: '深圳市市场监督管理局',
    category: 'sc_4_1',
    description: '内资企业、外资企业设立登记注册',
    materials: [
      { id: 'mat_9_1', name: '法定代表人身份证', type: 'required', format: '原件', certLinked: 'cert_1', status: 'auto_filled' },
      { id: 'mat_9_2', name: '公司章程', type: 'required', format: '原件', status: 'provided' },
      { id: 'mat_9_3', name: '股东身份证明', type: 'required', format: '原件', status: 'provided' },
      { id: 'mat_9_4', name: '注册地址证明', type: 'required', format: '原件', status: 'provided' },
    ],
    processSteps: [
      { id: 'step_9_1', name: '名称预核准', description: '在线提交企业名称预先核准', order: 1, duration: '1个工作日' },
      { id: 'step_9_2', name: '提交材料', description: '在线提交设立登记材料', order: 2, duration: '10分钟' },
      { id: 'step_9_3', name: '审核批准', description: '市场监管部门审核并批准', order: 3, duration: '2个工作日' },
      { id: 'step_9_4', name: '领取执照', description: '领取电子和纸质营业执照', order: 4, duration: '即时' },
    ],
    timeLimit: '3个工作日',
    fee: '免费',
    location: '深圳市行政服务大厅/线上办理',
    onlineRate: 96,
    guangdongStandard: {
      itemCode: '00726001000',
      implementCode: '11440300MB2C9238794440100100000',
      serviceType: '即办件',
      powerSource: '法定本级行使',
      legalBasis: '《中华人民共和国公司法》第六条、第七条',
      handlingDepartment: '深圳市市场监督管理局',
      undertakingInstitution: '深圳市市场监督管理局各分局',
      consultationPhone: '0755-12315',
      complaintPhone: '0755-12345',
      onlineApplyUrl: 'https://msjwt.gdzwfw.gov.cn/zwfw/portal/service/detail.html?serviceCode=11440300MB2C9238794440100100000',
      windowAddress: '深圳市各行政服务大厅市场监管窗口',
      handlingMethod: '窗口办理、网上办理',
      quantityLimit: '无数量限制',
      approvalLevel: '市级',
      resultType: '执照',
    },
    formFields: [
      { name: 'companyName', label: '企业名称', type: 'text', required: true, placeholder: '请输入企业名称' },
      { name: 'legalPerson', label: '法定代表人', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入法定代表人姓名' },
      { name: 'registeredCapital', label: '注册资本', type: 'number', required: true, placeholder: '请输入注册资本（万元）' },
      { name: 'companyType', label: '企业类型', type: 'select', required: true, options: [{ value: 'limited', label: '有限责任公司' }, { value: 'joint_stock', label: '股份有限公司' }, { value: 'sole', label: '个人独资企业' }] },
      { name: 'businessScope', label: '经营范围', type: 'textarea', required: true, placeholder: '请输入经营范围' },
      { name: 'registerAddress', label: '注册地址', type: 'text', required: true, placeholder: '请输入注册地址' },
      { name: 'contactPhone', label: '联系电话', type: 'text', required: true, placeholder: '请输入联系电话' },
    ],
    relatedJointService: 'js_1',
    workflowStepDurations: { precheck: 3000, fill: 2500 },
  },
  {
    id: 'svc_10',
    name: '医疗器械经营许可',
    department: '深圳市市场监督管理局',
    category: 'sc_4_2',
    description: '第二类、第三类医疗器械经营许可申请',
    materials: [
      { id: 'mat_10_1', name: '企业营业执照', type: 'required', format: '原件', certLinked: 'cert_13', status: 'auto_filled' },
      { id: 'mat_10_2', name: '法定代表人身份证', type: 'required', format: '原件', certLinked: 'cert_1', status: 'auto_filled' },
      { id: 'mat_10_3', name: '经营场所证明', type: 'required', format: '原件', status: 'provided' },
      { id: 'mat_10_4', name: '质量管理制度文件', type: 'required', format: '原件', status: 'provided' },
    ],
    processSteps: [
      { id: 'step_10_1', name: '在线申报', description: '提交医疗器械经营许可申请', order: 1, duration: '15分钟' },
      { id: 'step_10_2', name: '材料审查', description: '审查申请材料的完整性和合规性', order: 2, duration: '5个工作日' },
      { id: 'step_10_3', name: '现场核查', description: '对经营场所和仓储条件进行现场核查', order: 3, duration: '15个工作日' },
      { id: 'step_10_4', name: '审批发证', description: '审批通过并颁发许可证', order: 4, duration: '5个工作日' },
    ],
    timeLimit: '30个工作日',
    fee: '免费',
    location: '深圳市市场监管局行政服务大厅',
    onlineRate: 75,
    guangdongStandard: {
      itemCode: '00726002000',
      implementCode: '11440300MB2C9238794440100100100',
      serviceType: '承诺件',
      powerSource: '法定本级行使',
      legalBasis: '《医疗器械监督管理条例》第三十一条',
      handlingDepartment: '深圳市市场监督管理局',
      undertakingInstitution: '深圳市市场监督管理局许可审查中心',
      consultationPhone: '0755-12315',
      complaintPhone: '0755-12345',
      onlineApplyUrl: 'https://msjwt.gdzwfw.gov.cn/zwfw/portal/service/detail.html?serviceCode=11440300MB2C9238794440100100100',
      windowAddress: '深圳市市场监督管理局行政服务大厅',
      handlingMethod: '窗口办理、网上办理',
      quantityLimit: '无数量限制',
      approvalLevel: '市级',
      resultType: '许可证',
    },
    formFields: [
      { name: 'companyName', label: '企业名称', type: 'text', required: true, autoFillSource: 'cert_13', placeholder: '请输入企业名称' },
      { name: 'unifiedCreditCode', label: '统一社会信用代码', type: 'text', required: true, autoFillSource: 'cert_13', placeholder: '请输入统一社会信用代码' },
      { name: 'legalPerson', label: '法定代表人', type: 'text', required: true, placeholder: '请输入法定代表人姓名' },
      { name: 'deviceType', label: '医疗器械类别', type: 'select', required: true, options: [{ value: 'class2', label: '第二类医疗器械' }, { value: 'class3', label: '第三类医疗器械' }] },
      { name: 'businessScope', label: '经营范围', type: 'textarea', required: true, placeholder: '请输入经营范围' },
      { name: 'businessAddress', label: '经营地址', type: 'text', required: true, placeholder: '请输入经营地址' },
      { name: 'contactPhone', label: '联系电话', type: 'text', required: true, placeholder: '请输入联系电话' },
    ],
  },
  {
    id: 'svc_11',
    name: '企业注销登记',
    department: '深圳市市场监督管理局',
    category: 'sc_4_3',
    description: '企业简易注销和一般注销登记',
    materials: [
      { id: 'mat_11_1', name: '企业营业执照', type: 'required', format: '原件', certLinked: 'cert_13', status: 'auto_filled' },
      { id: 'mat_11_2', name: '注销决议', type: 'required', format: '原件', status: 'provided' },
      { id: 'mat_11_3', name: '清算报告', type: 'conditional', format: '原件', status: 'provided' },
      { id: 'mat_11_4', name: '税务清缴证明', type: 'required', format: '原件', status: 'provided' },
    ],
    processSteps: [
      { id: 'step_11_1', name: '公告期', description: '发布注销公告（简易注销20天/一般注销45天）', order: 1, duration: '20-45天' },
      { id: 'step_11_2', name: '提交申请', description: '公告期满后提交注销申请', order: 2, duration: '5分钟' },
      { id: 'step_11_3', name: '审核注销', description: '审核通过后完成注销', order: 3, duration: '3个工作日' },
    ],
    timeLimit: '25-50个工作日',
    fee: '免费',
    location: '深圳市行政服务大厅/线上办理',
    onlineRate: 88,
    guangdongStandard: {
      itemCode: '00726003000',
      implementCode: '11440300MB2C9238794440100100200',
      serviceType: '承诺件',
      powerSource: '法定本级行使',
      legalBasis: '《中华人民共和国公司法》第一百八十八条',
      handlingDepartment: '深圳市市场监督管理局',
      undertakingInstitution: '深圳市市场监督管理局各分局',
      consultationPhone: '0755-12315',
      complaintPhone: '0755-12345',
      onlineApplyUrl: 'https://msjwt.gdzwfw.gov.cn/zwfw/portal/service/detail.html?serviceCode=11440300MB2C9238794440100100200',
      windowAddress: '深圳市各行政服务大厅市场监管窗口',
      handlingMethod: '窗口办理、网上办理',
      quantityLimit: '无数量限制',
      approvalLevel: '市级',
      resultType: '其他',
    },
    formFields: [
      { name: 'companyName', label: '企业名称', type: 'text', required: true, autoFillSource: 'cert_13', placeholder: '请输入企业名称' },
      { name: 'unifiedCreditCode', label: '统一社会信用代码', type: 'text', required: true, autoFillSource: 'cert_13', placeholder: '请输入统一社会信用代码' },
      { name: 'legalPerson', label: '法定代表人', type: 'text', required: true, placeholder: '请输入法定代表人姓名' },
      { name: 'cancelType', label: '注销类型', type: 'select', required: true, options: [{ value: 'simple', label: '简易注销' }, { value: 'general', label: '一般注销' }] },
      { name: 'cancelReason', label: '注销原因', type: 'select', required: true, options: [{ value: 'dissolution', label: '解散' }, { value: 'bankruptcy', label: '破产' }, { value: 'revoke', label: '吊销' }] },
      { name: 'announcementDate', label: '公告日期', type: 'date', required: true, placeholder: '请选择公告日期' },
      { name: 'contactPhone', label: '联系电话', type: 'text', required: true, placeholder: '请输入联系电话' },
    ],
  },
  {
    id: 'svc_12',
    name: '驾驶证期满换证',
    department: '深圳市公安局交通警察支队',
    category: 'sc_5_1',
    description: '机动车驾驶证有效期满换领新证',
    materials: [
      { id: 'mat_12_1', name: '居民身份证', type: 'required', format: '原件', certLinked: 'cert_1', status: 'auto_filled' },
      { id: 'mat_12_2', name: '机动车驾驶证', type: 'required', format: '原件', certLinked: 'cert_11', status: 'auto_filled' },
      { id: 'mat_12_3', name: '体检证明', type: 'required', format: '原件', status: 'provided' },
      { id: 'mat_12_4', name: '照片回执', type: 'required', format: '纸质', status: 'provided' },
    ],
    processSteps: [
      { id: 'step_12_1', name: '体检', description: '在指定医疗机构进行驾驶人体检', order: 1, duration: '30分钟' },
      { id: 'step_12_2', name: '在线申请', description: '通过交管平台提交换证申请', order: 2, duration: '5分钟' },
      { id: 'step_12_3', name: '审核制证', description: '审核通过并制作新驾驶证', order: 3, duration: '1个工作日' },
      { id: 'step_12_4', name: '证件送达', description: '邮寄新驾驶证', order: 4, duration: '2个工作日' },
    ],
    timeLimit: '3个工作日',
    fee: '10元',
    location: '深圳市车管所/线上办理',
    onlineRate: 94,
    guangdongStandard: {
      itemCode: '00727001000',
      implementCode: '11440300007542785T4440709004000',
      serviceType: '即办件',
      powerSource: '法定本级行使',
      legalBasis: '《机动车驾驶证申领和使用规定》第五十七条',
      handlingDepartment: '深圳市公安局交通警察支队',
      undertakingInstitution: '深圳市公安局交通警察支队车辆管理所',
      consultationPhone: '0755-83333333',
      complaintPhone: '0755-12345',
      onlineApplyUrl: 'https://msjwt.gdzwfw.gov.cn/zwfw/portal/service/detail.html?serviceCode=11440300007542785T4440709004000',
      windowAddress: '深圳市车管所及各分所',
      handlingMethod: '窗口办理、网上办理',
      quantityLimit: '无数量限制',
      approvalLevel: '市级',
      resultType: '证件',
    },
    formFields: [
      { name: 'applicantName', label: '申请人姓名', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入申请人姓名' },
      { name: 'idCard', label: '身份证号码', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入身份证号码' },
      { name: 'driverLicenseNumber', label: '驾驶证号', type: 'text', required: true, autoFillSource: 'cert_11', placeholder: '请输入驾驶证号' },
      { name: 'licenseType', label: '准驾车型', type: 'select', required: true, options: [{ value: 'c1', label: 'C1 小型汽车' }, { value: 'c2', label: 'C2 小型自动挡汽车' }, { value: 'b1', label: 'B1 中型客车' }, { value: 'a1', label: 'A1 大型客车' }] },
      { name: 'medicalCertificate', label: '体检证明编号', type: 'text', required: true, placeholder: '请输入体检证明编号' },
      { name: 'receiptNumber', label: '照片回执编号', type: 'text', required: true, placeholder: '请输入照片回执编号' },
      { name: 'contactPhone', label: '联系电话', type: 'text', required: true, placeholder: '请输入联系电话' },
    ],
  },
  {
    id: 'svc_13',
    name: '机动车注册登记',
    department: '深圳市公安局交通警察支队',
    category: 'sc_5_2',
    description: '新购机动车注册上牌登记',
    materials: [
      { id: 'mat_13_1', name: '居民身份证', type: 'required', format: '原件', certLinked: 'cert_1', status: 'auto_filled' },
      { id: 'mat_13_2', name: '购车发票', type: 'required', format: '原件', status: 'provided' },
      { id: 'mat_13_3', name: '车辆合格证', type: 'required', format: '原件', status: 'provided' },
      { id: 'mat_13_4', name: '交强险保单', type: 'required', format: '原件', status: 'provided' },
      { id: 'mat_13_5', name: '购置税完税证明', type: 'required', format: '原件', status: 'provided' },
    ],
    processSteps: [
      { id: 'step_13_1', name: '在线预约', description: '预约车辆查验时间', order: 1, duration: '2分钟' },
      { id: 'step_13_2', name: '车辆查验', description: '现场查验车辆信息', order: 2, duration: '30分钟' },
      { id: 'step_13_3', name: '选号缴费', description: '在线选号并缴纳相关费用', order: 3, duration: '20分钟' },
      { id: 'step_13_4', name: '领取牌证', description: '领取行驶证、登记证书和号牌', order: 4, duration: '1个工作日' },
    ],
    timeLimit: '2个工作日',
    fee: '125元',
    location: '深圳市车管所及各分所',
    onlineRate: 70,
    guangdongStandard: {
      itemCode: '00727002000',
      implementCode: '11440300007542785T4440709005000',
      serviceType: '承诺件',
      powerSource: '法定本级行使',
      legalBasis: '《机动车登记规定》第五条、第七条',
      handlingDepartment: '深圳市公安局交通警察支队',
      undertakingInstitution: '深圳市公安局交通警察支队车辆管理所',
      consultationPhone: '0755-83333333',
      complaintPhone: '0755-12345',
      onlineApplyUrl: 'https://msjwt.gdzwfw.gov.cn/zwfw/portal/service/detail.html?serviceCode=11440300007542785T4440709005000',
      windowAddress: '深圳市车管所及各分所',
      handlingMethod: '窗口办理、网上预约',
      quantityLimit: '无数量限制',
      approvalLevel: '市级',
      resultType: '证件',
    },
    formFields: [
      { name: 'applicantName', label: '申请人姓名', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入申请人姓名' },
      { name: 'idCard', label: '身份证号码', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入身份证号码' },
      { name: 'vehicleType', label: '车辆类型', type: 'select', required: true, options: [{ value: 'car', label: '小型汽车' }, { value: 'suv', label: '小型SUV' }, { value: 'truck', label: '货车' }, { value: 'motorcycle', label: '摩托车' }] },
      { name: 'vehicleIdentificationCode', label: '车辆识别代号', type: 'text', required: true, placeholder: '请输入车辆识别代号（VIN）' },
      { name: 'invoiceNumber', label: '购车发票号', type: 'text', required: true, placeholder: '请输入购车发票号' },
      { name: 'insuranceNumber', label: '交强险保单号', type: 'text', required: true, placeholder: '请输入交强险保单号' },
      { name: 'contactPhone', label: '联系电话', type: 'text', required: true, placeholder: '请输入联系电话' },
    ],
  },
  {
    id: 'svc_14',
    name: '交通违法处理',
    department: '深圳市公安局交通警察支队',
    category: 'sc_5_3',
    description: '机动车交通违法行为在线处理和缴款',
    materials: [
      { id: 'mat_14_1', name: '居民身份证', type: 'required', format: '原件', certLinked: 'cert_1', status: 'auto_filled' },
      { id: 'mat_14_2', name: '机动车驾驶证', type: 'required', format: '原件', certLinked: 'cert_11', status: 'auto_filled' },
      { id: 'mat_14_3', name: '机动车行驶证', type: 'required', format: '原件', certLinked: 'cert_12', status: 'auto_filled' },
    ],
    processSteps: [
      { id: 'step_14_1', name: '查看违法', description: '在线查看违法记录详情', order: 1, duration: '2分钟' },
      { id: 'step_14_2', name: '确认处理', description: '确认违法行为并选择处理方式', order: 2, duration: '5分钟' },
      { id: 'step_14_3', name: '在线缴款', description: '在线缴纳罚款', order: 3, duration: '即时' },
    ],
    timeLimit: '即时',
    fee: '按违法类型',
    location: '线上办理/交警大队窗口',
    onlineRate: 99,
    guangdongStandard: {
      itemCode: '00727003000',
      implementCode: '11440300007542785T4440709007000',
      serviceType: '即办件',
      powerSource: '法定本级行使',
      legalBasis: '《中华人民共和国道路交通安全法》第八十二条',
      handlingDepartment: '深圳市公安局交通警察支队',
      undertakingInstitution: '深圳市公安局交通警察支队各大队',
      consultationPhone: '0755-83333333',
      complaintPhone: '0755-12345',
      onlineApplyUrl: 'https://msjwt.gdzwfw.gov.cn/zwfw/portal/service/detail.html?serviceCode=11440300007542785T4440709007000',
      windowAddress: '深圳市各交警大队',
      handlingMethod: '窗口办理、网上办理',
      quantityLimit: '无数量限制',
      approvalLevel: '市级',
      resultType: '其他',
    },
    formFields: [
      { name: 'applicantName', label: '当事人姓名', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入当事人姓名' },
      { name: 'idCard', label: '身份证号码', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入身份证号码' },
      { name: 'plateNumber', label: '车牌号', type: 'text', required: true, placeholder: '请输入车牌号' },
      { name: 'vehicleType', label: '车辆类型', type: 'select', required: true, options: [{ value: 'car', label: '小型汽车' }, { value: 'truck', label: '货车' }, { value: 'motorcycle', label: '摩托车' }] },
      { name: 'violationCode', label: '违法编号', type: 'text', required: false, placeholder: '请输入违法编号' },
      { name: 'violationLocation', label: '违法地点', type: 'text', required: false, placeholder: '请输入违法地点' },
      { name: 'contactPhone', label: '联系电话', type: 'text', required: true, placeholder: '请输入联系电话' },
    ],
  },
  {
    id: 'svc_15',
    name: '人才引进落户',
    department: '深圳市人力资源和社会保障局',
    category: 'sc_1_1',
    description: '高层次人才和紧缺人才引进落户深圳',
    materials: [
      { id: 'mat_15_1', name: '居民身份证', type: 'required', format: '原件', certLinked: 'cert_1', status: 'auto_filled' },
      { id: 'mat_15_2', name: '学历学位证书', type: 'required', format: '原件', status: 'provided' },
      { id: 'mat_15_3', name: '社保证明', type: 'required', format: '原件', certLinked: 'cert_8', status: 'auto_filled' },
      { id: 'mat_15_4', name: '劳动合同', type: 'required', format: '原件', status: 'provided' },
      { id: 'mat_15_5', name: '人才认定证明', type: 'conditional', format: '原件', status: 'provided' },
    ],
    processSteps: [
      { id: 'step_15_1', name: '在线申报', description: '通过人才引进系统提交申请', order: 1, duration: '15分钟' },
      { id: 'step_15_2', name: '人才核验', description: '核验人才资格和学历信息', order: 2, duration: '5个工作日' },
      { id: 'step_15_3', name: '审批通过', description: '人社部门审批通过', order: 3, duration: '10个工作日' },
      { id: 'step_15_4', name: '入户办理', description: '到公安部门办理入户手续', order: 4, duration: '1个工作日' },
    ],
    timeLimit: '20个工作日',
    fee: '免费',
    location: '深圳市人社局/线上办理',
    onlineRate: 91,
    guangdongStandard: {
      itemCode: '007280010000',
      implementCode: '11440300691166817W4440709001000',
      serviceType: '承诺件',
      powerSource: '法定本级行使',
      legalBasis: '《深圳市人才引进实施办法》第三条、第四条',
      handlingDepartment: '深圳市人力资源和社会保障局',
      undertakingInstitution: '深圳市人力资源和社会保障局人才服务局',
      consultationPhone: '12333',
      complaintPhone: '0755-12345',
      onlineApplyUrl: 'https://msjwt.gdzwfw.gov.cn/zwfw/portal/service/detail.html?serviceCode=11440300691166817W4440709001000',
      windowAddress: '深圳市各行政区人才服务中心',
      handlingMethod: '窗口办理、网上办理',
      quantityLimit: '无数量限制',
      approvalLevel: '市级',
      resultType: '其他',
    },
    formFields: [
      { name: 'applicantName', label: '申请人姓名', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入申请人姓名' },
      { name: 'idCard', label: '身份证号码', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入身份证号码' },
      { name: 'talentType', label: '人才类型', type: 'select', required: true, options: [{ value: 'high_level', label: '高层次人才' }, { value: 'shortage', label: '紧缺人才' }, { value: 'overseas', label: '海外留学人才' }] },
      { name: 'education', label: '学历', type: 'select', required: true, options: [{ value: 'bachelor', label: '本科' }, { value: 'master', label: '硕士' }, { value: 'doctor', label: '博士' }] },
      { name: 'workUnit', label: '工作单位', type: 'text', required: true, placeholder: '请输入工作单位名称' },
      { name: 'socialSecurityYears', label: '社保缴纳年限', type: 'number', required: true, placeholder: '请输入社保缴纳年限' },
      { name: 'contactPhone', label: '联系电话', type: 'text', required: true, placeholder: '请输入联系电话' },
    ],
    relatedJointService: 'js_4',
    workflowStepDurations: { precheck: 2500, fill: 2000 },
  },
  {
    id: 'svc_16',
    name: '公积金贷款申请',
    department: '深圳市住房公积金管理中心',
    category: 'sc_3_1',
    description: '住房公积金个人住房贷款申请',
    materials: [
      { id: 'mat_16_1', name: '居民身份证', type: 'required', format: '原件', certLinked: 'cert_1', status: 'auto_filled' },
      { id: 'mat_16_2', name: '结婚证', type: 'conditional', format: '原件', certLinked: 'cert_6', status: 'auto_filled' },
      { id: 'mat_16_3', name: '购房合同', type: 'required', format: '原件', status: 'provided' },
      { id: 'mat_16_4', name: '公积金缴存证明', type: 'required', format: '原件', certLinked: 'cert_10', status: 'auto_filled' },
      { id: 'mat_16_5', name: '首付款证明', type: 'required', format: '原件', status: 'provided' },
    ],
    processSteps: [
      { id: 'step_16_1', name: '贷款申请', description: '在线提交公积金贷款申请', order: 1, duration: '20分钟' },
      { id: 'step_16_2', name: '资料审核', description: '公积金中心审核贷款资料', order: 2, duration: '5个工作日' },
      { id: 'step_16_3', name: '面签合同', description: '到公积金中心面签贷款合同', order: 3, duration: '1个工作日' },
      { id: 'step_16_4', name: '抵押登记', description: '办理房产抵押登记', order: 4, duration: '5个工作日' },
      { id: 'step_16_5', name: '放款', description: '完成抵押后发放贷款', order: 5, duration: '3个工作日' },
    ],
    timeLimit: '15个工作日',
    fee: '免费',
    location: '深圳市公积金中心',
    onlineRate: 82,
    guangdongStandard: {
      itemCode: '00725004000',
      implementCode: '12440300G34780704T4440714002000',
      serviceType: '承诺件',
      powerSource: '法定本级行使',
      legalBasis: '《住房公积金管理条例》第二十六条',
      handlingDepartment: '深圳市住房公积金管理中心',
      undertakingInstitution: '深圳市住房公积金管理中心贷款管理部',
      consultationPhone: '0755-12329',
      complaintPhone: '0755-12345',
      onlineApplyUrl: 'https://msjwt.gdzwfw.gov.cn/zwfw/portal/service/detail.html?serviceCode=12440300G34780704T4440714002000',
      windowAddress: '深圳市各公积金管理部办事大厅',
      handlingMethod: '窗口办理、网上办理',
      quantityLimit: '无数量限制',
      approvalLevel: '市级',
      resultType: '其他',
    },
    formFields: [
      { name: 'applicantName', label: '申请人姓名', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入申请人姓名' },
      { name: 'idCard', label: '身份证号码', type: 'text', required: true, autoFillSource: 'cert_1', placeholder: '请输入身份证号码' },
      { name: 'loanType', label: '贷款类型', type: 'select', required: true, options: [{ value: 'house_purchase', label: '购房贷款' }, { value: 'house_build', label: '建房贷款' }, { value: 'renovation', label: '装修贷款' }] },
      { name: 'loanAmount', label: '贷款金额', type: 'number', required: true, placeholder: '请输入贷款金额（万元）' },
      { name: 'loanTerm', label: '贷款期限', type: 'select', required: true, options: [{ value: '10', label: '10年' }, { value: '20', label: '20年' }, { value: '30', label: '30年' }] },
      { name: 'propertyAddress', label: '房产地址', type: 'text', required: true, placeholder: '请输入房产地址' },
      { name: 'contactPhone', label: '联系电话', type: 'text', required: true, placeholder: '请输入联系电话' },
    ],
    relatedJointService: 'js_3',
    workflowStepDurations: { precheck: 2000, fill: 2500 },
  },
]

export const jointFlows = [
  {
    id: 'jf_1',
    name: '企业开办一窗通联合流程',
    nodes: [
      { id: 'n1', name: '提交申请', type: 'service', itemId: 'svc_9', dependsOn: [], parallel: false, duration: '10分钟', status: 'completed' },
      { id: 'n2', name: '名称核准', type: 'approval', dependsOn: ['n1'], parallel: false, duration: '1个工作日', status: 'completed' },
      { id: 'n3', name: '营业执照办理', type: 'service', itemId: 'svc_9', dependsOn: ['n2'], parallel: false, duration: '2个工作日', status: 'completed' },
      { id: 'n4', name: '公章刻制', type: 'service', dependsOn: ['n3'], parallel: true, duration: '1个工作日', status: 'running' },
      { id: 'n5', name: '发票申领', type: 'service', dependsOn: ['n3'], parallel: true, duration: '1个工作日', status: 'pending' },
      { id: 'n6', name: '社保登记', type: 'service', dependsOn: ['n3'], parallel: true, duration: '1个工作日', status: 'pending' },
      { id: 'n7', name: '流程结束', type: 'end', dependsOn: ['n4', 'n5', 'n6'], parallel: false, duration: '即时', status: 'pending' },
    ],
    totalTime: '4个工作日',
    parallelTime: '1个工作日',
  },
  {
    id: 'jf_2',
    name: '不动产交易一件事联合流程',
    nodes: [
      { id: 'n1', name: '提交申请', type: 'service', dependsOn: [], parallel: false, duration: '15分钟', status: 'completed' },
      { id: 'n2', name: '材料核验', type: 'approval', dependsOn: ['n1'], parallel: false, duration: '1个工作日', status: 'completed' },
      { id: 'n3', name: '不动产转移登记', type: 'service', itemId: 'svc_7', dependsOn: ['n2'], parallel: false, duration: '3个工作日', status: 'running' },
      { id: 'n4', name: '税费缴纳', type: 'service', dependsOn: ['n2'], parallel: true, duration: '即时', status: 'completed' },
      { id: 'n5', name: '公积金贷款审批', type: 'service', itemId: 'svc_16', dependsOn: ['n2'], parallel: true, duration: '5个工作日', status: 'running' },
      { id: 'n6', name: '抵押登记', type: 'service', dependsOn: ['n3', 'n5'], parallel: false, duration: '3个工作日', status: 'pending' },
      { id: 'n7', name: '放款', type: 'service', dependsOn: ['n6'], parallel: false, duration: '3个工作日', status: 'pending' },
      { id: 'n8', name: '流程结束', type: 'end', dependsOn: ['n7'], parallel: false, duration: '即时', status: 'pending' },
    ],
    totalTime: '10个工作日',
    parallelTime: '5个工作日',
  },
  {
    id: 'jf_3',
    name: '人才引进一件事联合流程',
    nodes: [
      { id: 'n1', name: '提交申请', type: 'service', itemId: 'svc_15', dependsOn: [], parallel: false, duration: '15分钟', status: 'completed' },
      { id: 'n2', name: '人才资格审核', type: 'approval', dependsOn: ['n1'], parallel: false, duration: '5个工作日', status: 'completed' },
      { id: 'n3', name: '人社审批', type: 'service', dependsOn: ['n2'], parallel: false, duration: '10个工作日', status: 'running' },
      { id: 'n4', name: '社保转移接续', type: 'service', itemId: 'svc_4', dependsOn: ['n2'], parallel: true, duration: '15个工作日', status: 'pending' },
      { id: 'n5', name: '公积金开户', type: 'service', dependsOn: ['n2'], parallel: true, duration: '3个工作日', status: 'pending' },
      { id: 'n6', name: '医保转移', type: 'service', dependsOn: ['n2'], parallel: true, duration: '10个工作日', status: 'pending' },
      { id: 'n7', name: '公安入户办理', type: 'service', dependsOn: ['n3'], parallel: false, duration: '1个工作日', status: 'pending' },
      { id: 'n8', name: '流程结束', type: 'end', dependsOn: ['n4', 'n5', 'n6', 'n7'], parallel: false, duration: '即时', status: 'pending' },
    ],
    totalTime: '15个工作日',
    parallelTime: '10个工作日',
  },
]

export const precheckResults: PrecheckResult[] = [
  {
    serviceId: 'svc_1',
    overallStatus: 'pass',
    materials: [
      { materialId: 'mat_1_1', status: 'auto_filled', note: '居民身份证信息已通过电子证照库自动获取' },
      { materialId: 'mat_1_2', status: 'pass', note: '户口簿已上传，信息完整' },
      { materialId: 'mat_1_3', status: 'auto_filled', note: '房产证明已通过不动产登记系统自动获取' },
      { materialId: 'mat_1_4', status: 'auto_filled', note: '结婚证已通过民政系统自动获取' },
    ],
    suggestions: ['您的申请材料齐全，可直接提交办理', '建议选择邮寄送达，无需现场领取'],
  },
  {
    serviceId: 'svc_9',
    overallStatus: 'warning',
    materials: [
      { materialId: 'mat_9_1', status: 'auto_filled', note: '法定代表人身份证信息已自动获取' },
      { materialId: 'mat_9_2', status: 'pass', note: '公司章程已上传，格式正确' },
      { materialId: 'mat_9_3', status: 'warning', note: '股东身份证明文件不完整，请补充所有股东身份证明' },
      { materialId: 'mat_9_4', status: 'fail', note: '注册地址证明文件缺失，请上传房屋租赁合同或房产证明' },
    ],
    suggestions: ['请补充股东身份证明材料', '请上传注册地址证明文件', '建议检查公司章程签字是否完整'],
  },
  {
    serviceId: 'svc_7',
    overallStatus: 'pass',
    materials: [
      { materialId: 'mat_7_1', status: 'auto_filled', note: '居民身份证信息已自动获取' },
      { materialId: 'mat_7_2', status: 'auto_filled', note: '不动产权证书信息已自动获取' },
      { materialId: 'mat_7_3', status: 'pass', note: '买卖合同已上传，内容完整' },
      { materialId: 'mat_7_4', status: 'auto_filled', note: '结婚证已通过民政系统自动获取' },
      { materialId: 'mat_7_5', status: 'pass', note: '税费缴纳凭证已上传' },
    ],
    suggestions: ['所有材料已齐备，可在线办理', '预计3个工作日内完成登记'],
  },
]

export const jointServices: JointService[] = [
  {
    id: 'js_1',
    name: '企业开办一窗通',
    departments: ['深圳市市场监督管理局', '深圳市公安局', '深圳市税务局', '深圳市人力资源和社会保障局'],
    description: '企业设立登记、公章刻制、发票申领、社保登记等一站式办理',
    serviceItems: ['svc_9'],
    totalTimeLimit: '1个工作日',
    savingsPercent: 75,
  },
  {
    id: 'js_2',
    name: '新生儿出生一件事',
    departments: ['深圳市卫生健康委员会', '深圳市公安局', '深圳市社会保险基金管理局', '深圳市医疗保障局'],
    description: '出生医学证明申领、户籍登记、社保卡申领、医保参保一站式办理',
    serviceItems: [],
    totalTimeLimit: '3个工作日',
    savingsPercent: 80,
  },
  {
    id: 'js_3',
    name: '不动产交易一件事',
    departments: ['深圳市规划和自然资源局', '深圳市税务局', '深圳市住房公积金管理中心'],
    description: '不动产转移登记、税费缴纳、公积金贷款提取联合办理',
    serviceItems: ['svc_7', 'svc_16'],
    totalTimeLimit: '5个工作日',
    savingsPercent: 65,
  },
  {
    id: 'js_4',
    name: '人才引进一件事',
    departments: ['深圳市人力资源和社会保障局', '深圳市公安局', '深圳市医疗保障局', '深圳市住房公积金管理中心'],
    description: '人才认定、入户办理、社保转移、公积金开户联合办理',
    serviceItems: ['svc_15'],
    totalTimeLimit: '15个工作日',
    savingsPercent: 70,
  },
  {
    id: 'js_5',
    name: '退休一件事',
    departments: ['深圳市人力资源和社会保障局', '深圳市社会保险基金管理局', '深圳市医疗保障局', '深圳市住房公积金管理中心'],
    description: '退休审批、养老金申领、医保退休待遇、公积金提取一站式办理',
    serviceItems: [],
    totalTimeLimit: '10个工作日',
    savingsPercent: 72,
  },
]
