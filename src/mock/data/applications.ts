import type { Application, ApplicationTimeline, ApplicationFormField, ApplicationMaterial } from '@/types'

const baseTimeline = (submitTime: string, status: string): ApplicationTimeline[] => {
  const timelines: ApplicationTimeline[] = [
    {
      id: 'tl_001',
      status: 'submitted',
      title: '提交申请',
      description: '您已成功提交申请，等待受理',
      operator: '张三',
      operatorRole: '申请人',
      time: submitTime
    }
  ]
  if (status !== 'submitted' && status !== 'draft') {
    timelines.push({
      id: 'tl_002',
      status: 'accepted',
      title: '受理申请',
      description: '工作人员已受理您的申请，正在审核中',
      operator: '李经办',
      operatorRole: '受理专员',
      time: submitTime
    })
  }
  if (status === 'reviewing' || status === 'approved' || status === 'completed' || status === 'supplement' || status === 'rejected') {
    timelines.push({
      id: 'tl_003',
      status: 'reviewing',
      title: '材料审核',
      description: '正在对您提交的材料进行审核',
      operator: '王审核',
      operatorRole: '审核员',
      time: submitTime
    })
  }
  if (status === 'supplement') {
    timelines.push({
      id: 'tl_004',
      status: 'supplement',
      title: '需要补件',
      description: '您提交的材料不完整，请补充相关材料',
      operator: '王审核',
      operatorRole: '审核员',
      time: submitTime
    })
  }
  if (status === 'approved' || status === 'completed') {
    timelines.push({
      id: 'tl_005',
      status: 'approved',
      title: '审核通过',
      description: '您的申请已审核通过，正在制作结果文件',
      operator: '赵主管',
      operatorRole: '部门主管',
      time: submitTime
    })
  }
  if (status === 'rejected') {
    timelines.push({
      id: 'tl_006',
      status: 'rejected',
      title: '申请驳回',
      description: '您的申请未通过审核，请查看驳回原因',
      operator: '赵主管',
      operatorRole: '部门主管',
      time: submitTime
    })
  }
  if (status === 'completed') {
    timelines.push({
      id: 'tl_007',
      status: 'completed',
      title: '办理完成',
      description: '您的申请已办结，请查收结果文件',
      operator: '系统',
      operatorRole: '系统',
      time: submitTime
    })
  }
  return timelines
}

const formFields1: ApplicationFormField[] = [
  { key: 'name', label: '姓名', value: '张三', type: 'text' },
  { key: 'idCard', label: '身份证号', value: '362501199001011234', type: 'text' },
  { key: 'phone', label: '联系电话', value: '13800138001', type: 'text' },
  { key: 'address', label: '户籍地址', value: '江西省抚州市临川区青云峰路1号', type: 'textarea' },
  { key: 'registerType', label: '参保类型', value: '城乡居民养老保险', type: 'select' }
]

const materials1: ApplicationMaterial[] = [
  { id: 'am_001', name: '身份证原件', required: true, url: '/files/idcard_front.jpg', status: 'approved' },
  { id: 'am_002', name: '户口簿', required: true, url: '/files/household.jpg', status: 'approved' },
  { id: 'am_003', name: '近期免冠照片', required: false, url: '/files/photo.jpg', status: 'approved' }
]

export const mockApplications: Application[] = [
  {
    id: 'a_001',
    applyNo: 'SL2024011500001',
    serviceId: 's_001',
    serviceName: '养老保险参保登记',
    departmentId: 'd_001',
    departmentName: '抚州市人力资源和社会保障局',
    userId: 'u_001',
    userName: '张三',
    idCard: '362501199001011234',
    phone: '13800138001',
    status: 'completed',
    currentStep: 6,
    totalSteps: 6,
    formData: formFields1,
    materials: materials1,
    timeline: baseTimeline('2024-01-10 09:30:00', 'completed'),
    resultUrl: '/results/cert_001.pdf',
    resultNotice: '您的养老保险参保登记已办理完成，参保凭证可在"我的证照"中查看。',
    submitTime: '2024-01-10 09:30:00',
    acceptTime: '2024-01-10 10:00:00',
    completeTime: '2024-01-10 15:20:00',
    deadline: '2024-01-11 23:59:59',
    isOverdue: false,
    rating: 5,
    comment: '办理速度很快，服务态度很好！'
  },
  {
    id: 'a_002',
    applyNo: 'SL2024011400002',
    serviceId: 's_002',
    serviceName: '社保卡办理',
    departmentId: 'd_001',
    departmentName: '抚州市人力资源和社会保障局',
    userId: 'u_001',
    userName: '张三',
    idCard: '362501199001011234',
    phone: '13800138001',
    status: 'reviewing',
    currentStep: 3,
    totalSteps: 5,
    formData: [
      { key: 'name', label: '姓名', value: '张三', type: 'text' },
      { key: 'idCard', label: '身份证号', value: '362501199001011234', type: 'text' },
      { key: 'phone', label: '联系电话', value: '13800138001', type: 'text' },
      { key: 'applyType', label: '申请类型', value: '首次申领', type: 'select' },
      { key: 'deliveryMethod', label: '领取方式', value: '邮寄', type: 'select' },
      { key: 'deliveryAddress', label: '邮寄地址', value: '江西省抚州市临川区青云峰路1号', type: 'textarea' }
    ],
    materials: [
      { id: 'am_004', name: '身份证原件', required: true, url: '/files/idcard_002.jpg', status: 'approved' },
      { id: 'am_005', name: '电子照片', required: true, url: '/files/photo_002.jpg', status: 'approved' }
    ],
    timeline: baseTimeline('2024-01-14 14:20:00', 'reviewing'),
    submitTime: '2024-01-14 14:20:00',
    acceptTime: '2024-01-14 15:00:00',
    deadline: '2024-01-23 23:59:59',
    isOverdue: false
  },
  {
    id: 'a_003',
    applyNo: 'SL2024011300003',
    serviceId: 's_006',
    serviceName: '公积金提取',
    departmentId: 'd_004',
    departmentName: '抚州市住房公积金管理中心',
    userId: 'u_001',
    userName: '张三',
    idCard: '362501199001011234',
    phone: '13800138001',
    status: 'supplement',
    currentStep: 3,
    totalSteps: 6,
    formData: [
      { key: 'name', label: '姓名', value: '张三', type: 'text' },
      { key: 'idCard', label: '身份证号', value: '362501199001011234', type: 'text' },
      { key: 'phone', label: '联系电话', value: '13800138001', type: 'text' },
      { key: 'extractType', label: '提取类型', value: '租房提取', type: 'select' },
      { key: 'extractAmount', label: '提取金额', value: 12000, type: 'number' },
      { key: 'bankCard', label: '收款银行卡号', value: '6222021234567890123', type: 'text' }
    ],
    materials: [
      { id: 'am_006', name: '身份证', required: true, url: '/files/idcard_003.jpg', status: 'approved' },
      { id: 'am_007', name: '银行卡', required: true, url: '/files/bankcard.jpg', status: 'approved' },
      { id: 'am_008', name: '租房合同', required: false, status: 'pending' }
    ],
    timeline: baseTimeline('2024-01-13 10:15:00', 'supplement'),
    supplementNotice: '您申请的是租房提取，请补充上传租房合同原件扫描件。',
    submitTime: '2024-01-13 10:15:00',
    acceptTime: '2024-01-13 11:00:00',
    deadline: '2024-01-16 23:59:59',
    isOverdue: false
  },
  {
    id: 'a_004',
    applyNo: 'SL2024011200004',
    serviceId: 's_003',
    serviceName: '医保参保登记',
    departmentId: 'd_002',
    departmentName: '抚州市医疗保障局',
    userId: 'u_002',
    userName: '李四',
    idCard: '362501199205152345',
    phone: '13800138002',
    status: 'approved',
    currentStep: 5,
    totalSteps: 5,
    formData: [
      { key: 'name', label: '姓名', value: '李四', type: 'text' },
      { key: 'idCard', label: '身份证号', value: '362501199205152345', type: 'text' },
      { key: 'phone', label: '联系电话', value: '13800138002', type: 'text' },
      { key: 'insuranceType', label: '参保类型', value: '城乡居民医疗保险', type: 'select' }
    ],
    materials: [
      { id: 'am_009', name: '身份证', required: true, url: '/files/idcard_004.jpg', status: 'approved' },
      { id: 'am_010', name: '户口簿', required: true, url: '/files/household_004.jpg', status: 'approved' }
    ],
    timeline: baseTimeline('2024-01-12 16:30:00', 'approved'),
    submitTime: '2024-01-12 16:30:00',
    acceptTime: '2024-01-12 17:00:00',
    deadline: '2024-01-13 23:59:59',
    isOverdue: false
  },
  {
    id: 'a_005',
    applyNo: 'SL2024011100005',
    serviceId: 's_008',
    serviceName: '机动车驾驶证期满换证',
    departmentId: 'd_005',
    departmentName: '抚州市交通运输局',
    userId: 'u_001',
    userName: '张三',
    idCard: '362501199001011234',
    phone: '13800138001',
    status: 'rejected',
    currentStep: 4,
    totalSteps: 4,
    formData: [
      { key: 'name', label: '姓名', value: '张三', type: 'text' },
      { key: 'idCard', label: '身份证号', value: '362501199001011234', type: 'text' },
      { key: 'phone', label: '联系电话', value: '13800138001', type: 'text' },
      { key: 'driverLicenseNo', label: '原驾驶证号', value: '362501199001011234', type: 'text' }
    ],
    materials: [
      { id: 'am_011', name: '身份证', required: true, url: '/files/idcard_005.jpg', status: 'approved' },
      { id: 'am_012', name: '原驾驶证', required: true, url: '/files/license.jpg', status: 'rejected' },
      { id: 'am_013', name: '身体条件证明', required: true, status: 'pending' }
    ],
    timeline: baseTimeline('2024-01-11 09:00:00', 'rejected'),
    rejectReason: '身体条件证明已过期，请重新到县级以上医院体检并上传有效的身体条件证明。',
    submitTime: '2024-01-11 09:00:00',
    acceptTime: '2024-01-11 09:30:00',
    deadline: '2024-01-12 23:59:59',
    isOverdue: false
  },
  {
    id: 'a_006',
    applyNo: 'SL2024011500006',
    serviceId: 's_011',
    serviceName: '身份证补办',
    departmentId: 'd_010',
    departmentName: '抚州市公安局',
    userId: 'u_002',
    userName: '李四',
    idCard: '362501199205152345',
    phone: '13800138002',
    status: 'submitted',
    currentStep: 1,
    totalSteps: 4,
    formData: [
      { key: 'name', label: '姓名', value: '李四', type: 'text' },
      { key: 'idCard', label: '身份证号', value: '362501199205152345', type: 'text' },
      { key: 'phone', label: '联系电话', value: '13800138002', type: 'text' },
      { key: 'applyReason', label: '补办原因', value: '身份证遗失', type: 'select' },
      { key: 'deliveryMethod', label: '领取方式', value: '到派出所领取', type: 'select' }
    ],
    materials: [
      { id: 'am_014', name: '户口簿', required: true, url: '/files/household_006.jpg', status: 'uploaded' }
    ],
    timeline: baseTimeline('2024-01-15 10:45:00', 'submitted'),
    submitTime: '2024-01-15 10:45:00',
    deadline: '2024-02-05 23:59:59',
    isOverdue: false
  },
  {
    id: 'a_007',
    applyNo: 'SL2024010900007',
    serviceId: 's_010',
    serviceName: '个体工商户注册登记',
    departmentId: 'd_009',
    departmentName: '抚州市市场监督管理局',
    userId: 'u_003',
    userName: '王五',
    idCard: '362501198808203456',
    phone: '13800138003',
    status: 'completed',
    currentStep: 5,
    totalSteps: 5,
    formData: [
      { key: 'name', label: '经营者姓名', value: '王五', type: 'text' },
      { key: 'idCard', label: '身份证号', value: '362501198808203456', type: 'text' },
      { key: 'phone', label: '联系电话', value: '13800138003', type: 'text' },
      { key: 'shopName', label: '店铺名称', value: '临川区美味小吃店', type: 'text' },
      { key: 'businessScope', label: '经营范围', value: '餐饮服务；食品销售', type: 'textarea' },
      { key: 'businessAddress', label: '经营地址', value: '江西省抚州市临川区玉茗大道50号', type: 'textarea' }
    ],
    materials: [
      { id: 'am_015', name: '身份证', required: true, url: '/files/idcard_007.jpg', status: 'approved' },
      { id: 'am_016', name: '经营场所证明', required: true, url: '/files/lease_contract.pdf', status: 'approved' },
      { id: 'am_017', name: '个体工商户登记申请书', required: true, url: '/files/registration_form_007.pdf', status: 'approved' }
    ],
    timeline: baseTimeline('2024-01-09 08:30:00', 'completed'),
    resultUrl: '/results/business_license_007.pdf',
    resultNotice: '您的个体工商户营业执照已核发，请查收电子营业执照。',
    submitTime: '2024-01-09 08:30:00',
    acceptTime: '2024-01-09 09:00:00',
    completeTime: '2024-01-11 14:00:00',
    deadline: '2024-01-12 23:59:59',
    isOverdue: false,
    rating: 4,
    comment: '整体不错，就是审核稍微慢了一点。'
  },
  {
    id: 'a_008',
    applyNo: 'SL2024011000008',
    serviceId: 's_004',
    serviceName: '医保异地就医备案',
    departmentId: 'd_002',
    departmentName: '抚州市医疗保障局',
    userId: 'u_006',
    userName: '周八',
    idCard: '362501199510086789',
    phone: '13800138006',
    status: 'completed',
    currentStep: 3,
    totalSteps: 3,
    formData: [
      { key: 'name', label: '姓名', value: '周八', type: 'text' },
      { key: 'idCard', label: '身份证号', value: '362501199510086789', type: 'text' },
      { key: 'phone', label: '联系电话', value: '13800138006', type: 'text' },
      { key: 'recordType', label: '备案类型', value: '长期异地居住', type: 'select' },
      { key: '就医地', label: '就医地', value: '上海市', type: 'select' },
      { key: 'startDate', label: '备案开始日期', value: '2024-01-10', type: 'date' },
      { key: 'endDate', label: '备案结束日期', value: '2024-12-31', type: 'date' }
    ],
    materials: [
      { id: 'am_018', name: '身份证', required: true, url: '/files/idcard_008.jpg', status: 'approved' },
      { id: 'am_019', name: '居住证明', required: false, url: '/files/residence_proof.jpg', status: 'approved' }
    ],
    timeline: baseTimeline('2024-01-10 11:20:00', 'completed'),
    resultNotice: '您的异地就医备案已成功，备案有效期至2024年12月31日。',
    submitTime: '2024-01-10 11:20:00',
    acceptTime: '2024-01-10 11:20:00',
    completeTime: '2024-01-10 11:21:00',
    deadline: '2024-01-10 23:59:59',
    isOverdue: false,
    rating: 5,
    comment: '即时办结，非常方便！'
  }
]
