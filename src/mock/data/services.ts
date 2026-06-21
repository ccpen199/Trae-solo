import type { Department, ServiceItem } from '@/types'

export const mockDepartments: Department[] = [
  {
    id: 'd_001',
    name: '抚州市人力资源和社会保障局',
    shortName: '市人社局',
    category: 'social_security',
    icon: 'Shield',
    color: '#1E5AA8',
    description: '负责全市人力资源和社会保障行政管理工作',
    serviceCount: 48,
    address: '抚州市临川区文昌大道1290号',
    phone: '0794-8222391',
    workHours: '周一至周五 09:00-17:00'
  },
  {
    id: 'd_002',
    name: '抚州市医疗保障局',
    shortName: '市医保局',
    category: 'medical_insurance',
    icon: 'Heart',
    color: '#2ECC71',
    description: '负责全市医疗保险、生育保险等医疗保障工作',
    serviceCount: 36,
    address: '抚州市临川区赣东大道1177号',
    phone: '0794-8289960',
    workHours: '周一至周五 09:00-17:00'
  },
  {
    id: 'd_003',
    name: '抚州市教育体育局',
    shortName: '市教体局',
    category: 'education',
    icon: 'GraduationCap',
    color: '#9B59B6',
    description: '负责全市教育和体育行政管理工作',
    serviceCount: 52,
    address: '抚州市临川区赣东大道1336号',
    phone: '0794-8263401',
    workHours: '周一至周五 09:00-17:00'
  },
  {
    id: 'd_004',
    name: '抚州市住房公积金管理中心',
    shortName: '市公积金中心',
    category: 'housing_fund',
    icon: 'Home',
    color: '#F39C12',
    description: '负责全市住房公积金的管理和运作',
    serviceCount: 28,
    address: '抚州市临川区玉茗大道223号',
    phone: '0794-8287868',
    workHours: '周一至周五 09:00-17:00'
  },
  {
    id: 'd_005',
    name: '抚州市交通运输局',
    shortName: '市交通局',
    category: 'traffic',
    icon: 'Car',
    color: '#3498DB',
    description: '负责全市交通运输行业管理工作',
    serviceCount: 32,
    address: '抚州市临川区临川大道45号',
    phone: '0794-8223265',
    workHours: '周一至周五 09:00-17:00'
  },
  {
    id: 'd_006',
    name: '抚州市文化广电新闻出版旅游局',
    shortName: '市文广新旅局',
    category: 'culture_tourism',
    icon: 'MapPin',
    color: '#E74C3C',
    description: '负责全市文化、广播电视、新闻出版和旅游工作',
    serviceCount: 40,
    address: '抚州市临川区临川大道中段',
    phone: '0794-8287689',
    workHours: '周一至周五 09:00-17:00'
  },
  {
    id: 'd_007',
    name: '抚州市民政局',
    shortName: '市民政局',
    category: 'civil_affairs',
    icon: 'Users',
    color: '#1ABC9C',
    description: '负责全市民政行政管理工作',
    serviceCount: 38,
    address: '抚州市临川区迎宾大道59号',
    phone: '0794-8222398',
    workHours: '周一至周五 09:00-17:00'
  },
  {
    id: 'd_008',
    name: '国家税务总局抚州市税务局',
    shortName: '市税务局',
    category: 'taxation',
    icon: 'Receipt',
    color: '#E67E22',
    description: '负责全市税收征收管理工作',
    serviceCount: 45,
    address: '抚州市临川区玉茗大道303号',
    phone: '0794-8222690',
    workHours: '周一至周五 09:00-17:00'
  },
  {
    id: 'd_009',
    name: '抚州市市场监督管理局',
    shortName: '市市监局',
    category: 'industry_commerce',
    icon: 'Building2',
    color: '#34495E',
    description: '负责全市市场监督管理和知识产权工作',
    serviceCount: 56,
    address: '抚州市临川区迎宾大道109号',
    phone: '0794-8223533',
    workHours: '周一至周五 09:00-17:00'
  },
  {
    id: 'd_010',
    name: '抚州市公安局',
    shortName: '市公安局',
    category: 'public_security',
    icon: 'ShieldCheck',
    color: '#2C3E50',
    description: '负责全市公安行政管理和执法工作',
    serviceCount: 42,
    address: '抚州市临川区钟岭大道88号',
    phone: '0794-8222110',
    workHours: '周一至周五 09:00-17:00'
  },
  {
    id: 'd_011',
    name: '抚州市司法局',
    shortName: '市司法局',
    category: 'justice',
    icon: 'Scale',
    color: '#8E44AD',
    description: '负责全市司法行政管理工作',
    serviceCount: 25,
    address: '抚州市临川区赣东大道延伸段',
    phone: '0794-8222376',
    workHours: '周一至周五 09:00-17:00'
  },
  {
    id: 'd_012',
    name: '抚州市卫生健康委员会',
    shortName: '市卫健委',
    category: 'health',
    icon: 'Stethoscope',
    color: '#E91E63',
    description: '负责全市卫生健康行政管理工作',
    serviceCount: 34,
    address: '抚州市临川区临川大道229号',
    phone: '0794-8222347',
    workHours: '周一至周五 09:00-17:00'
  }
]

const departmentMap: Record<string, Department> = {}
mockDepartments.forEach(d => {
  departmentMap[d.id] = d
})

export const mockServices: ServiceItem[] = [
  {
    id: 's_001',
    departmentId: 'd_001',
    departmentName: '抚州市人力资源和社会保障局',
    name: '养老保险参保登记',
    shortName: '养老参保登记',
    category: 'social_security',
    status: 'active',
    level: 'municipal',
    icon: 'Shield',
    description: '城乡居民基本养老保险参保登记服务',
    workDays: '1个工作日',
    chargeStandard: '免费',
    hotLevel: 5,
    viewCount: 15680,
    applyCount: 3420,
    satisfaction: 98.5,
    materials: [
      { id: 'm1', name: '身份证原件', required: true, format: '原件', description: '本人有效居民身份证' },
      { id: 'm2', name: '户口簿', required: true, format: '原件+复印件', description: '本人户口簿首页及本人页' },
      { id: 'm3', name: '近期免冠照片', required: false, format: 'JPG/PNG', description: '一寸白底彩色照片', templateUrl: '/templates/photo_template.jpg' }
    ],
    steps: [
      { step: 1, title: '提交申请', description: '线上提交或窗口提交申请材料', duration: '10分钟' },
      { step: 2, title: '受理审核', description: '经办人员审核申请材料', duration: '0.5个工作日' },
      { step: 3, title: '登记确认', description: '完成参保登记并生成参保凭证', duration: '0.5个工作日' }
    ],
    conditions: [
      '年满16周岁（不含在校学生）',
      '非国家机关和事业单位工作人员',
      '未参加职工基本养老保险',
      '具有抚州市户籍或在抚州市居住'
    ],
    notices: [
      '请确保提交的材料真实有效',
      '参保登记成功后，需按年缴纳养老保险费',
      '可通过本平台在线缴费'
    ],
    onlineApply: true,
    appointment: true,
    handleMethod: 'both',
    promiseDays: 1,
    isInstant: false,
    serviceType: 'personal',
    createTime: '2023-01-01 00:00:00',
    updateTime: '2024-01-10 10:00:00'
  },
  {
    id: 's_002',
    departmentId: 'd_001',
    departmentName: '抚州市人力资源和社会保障局',
    name: '社保卡办理',
    shortName: '办社保卡',
    category: 'social_security',
    status: 'active',
    level: 'municipal',
    icon: 'CreditCard',
    description: '社会保障卡首次申领、补办、换发服务',
    workDays: '7个工作日',
    chargeStandard: '首次免费，补办20元/张',
    hotLevel: 5,
    viewCount: 28950,
    applyCount: 8760,
    satisfaction: 97.8,
    materials: [
      { id: 'm1', name: '身份证原件', required: true, format: '原件', description: '本人有效居民身份证' },
      { id: 'm2', name: '电子照片', required: true, format: 'JPG/PNG', description: '一寸白底彩色电子照片（358×441像素）' }
    ],
    steps: [
      { step: 1, title: '提交申请', description: '填写个人信息并上传照片', duration: '10分钟' },
      { step: 2, title: '信息审核', description: '审核提交的信息和照片', duration: '3个工作日' },
      { step: 3, title: '卡片制作', description: '制卡工厂制作社保卡', duration: '3个工作日' },
      { step: 4, title: '领取激活', description: '到指定网点领取并激活社保卡', duration: '1个工作日' }
    ],
    conditions: [
      '已参加抚州市社会保险',
      '无有效社保卡或社保卡遗失/损坏'
    ],
    notices: [
      '照片需符合二代身份证照片标准',
      '社保卡激活需本人携带身份证到银行网点办理',
      '补办社保卡需缴纳工本费'
    ],
    onlineApply: true,
    appointment: true,
    handleMethod: 'both',
    promiseDays: 7,
    isInstant: false,
    serviceType: 'personal',
    createTime: '2023-01-01 00:00:00',
    updateTime: '2024-01-10 10:00:00'
  },
  {
    id: 's_003',
    departmentId: 'd_002',
    departmentName: '抚州市医疗保障局',
    name: '医保参保登记',
    shortName: '医保参保',
    category: 'medical_insurance',
    status: 'active',
    level: 'municipal',
    icon: 'Heart',
    description: '城乡居民基本医疗保险参保登记',
    workDays: '1个工作日',
    chargeStandard: '免费',
    hotLevel: 5,
    viewCount: 32100,
    applyCount: 12500,
    satisfaction: 99.1,
    materials: [
      { id: 'm1', name: '身份证', required: true, format: '原件', description: '本人有效居民身份证' },
      { id: 'm2', name: '户口簿', required: true, format: '原件', description: '户口簿原件' }
    ],
    steps: [
      { step: 1, title: '提交申请', description: '提交参保登记申请及材料', duration: '10分钟' },
      { step: 2, title: '审核登记', description: '审核信息并完成参保登记', duration: '1个工作日' }
    ],
    conditions: [
      '未参加职工基本医疗保险',
      '具有抚州市户籍或居住证'
    ],
    notices: [
      '每年集中参保缴费期为9月1日至12月31日',
      '新生儿可在出生后6个月内参保'
    ],
    onlineApply: true,
    appointment: false,
    handleMethod: 'both',
    promiseDays: 1,
    isInstant: false,
    serviceType: 'personal',
    createTime: '2023-01-01 00:00:00',
    updateTime: '2024-01-10 10:00:00'
  },
  {
    id: 's_004',
    departmentId: 'd_002',
    departmentName: '抚州市医疗保障局',
    name: '医保异地就医备案',
    shortName: '异地备案',
    category: 'medical_insurance',
    status: 'active',
    level: 'municipal',
    icon: 'Map',
    description: '跨省异地就医直接结算备案服务',
    workDays: '即时办结',
    chargeStandard: '免费',
    hotLevel: 4,
    viewCount: 18900,
    applyCount: 6200,
    satisfaction: 98.2,
    materials: [
      { id: 'm1', name: '身份证', required: true, format: '原件', description: '本人有效居民身份证' },
      { id: 'm2', name: '居住证明', required: false, format: '原件/电子版', description: '异地居住相关证明材料' }
    ],
    steps: [
      { step: 1, title: '提交备案', description: '选择备案类型和就医地', duration: '5分钟' },
      { step: 2, title: '系统审核', description: '医保系统自动审核备案信息', duration: '即时' }
    ],
    conditions: [
      '已参加抚州市基本医疗保险',
      '需在异地就医并直接结算'
    ],
    notices: [
      '备案成功后可在异地定点医院直接结算',
      '备案有效期根据类型不同有所区别'
    ],
    onlineApply: true,
    appointment: false,
    handleMethod: 'online',
    promiseDays: 0,
    isInstant: true,
    serviceType: 'personal',
    createTime: '2023-01-01 00:00:00',
    updateTime: '2024-01-10 10:00:00'
  },
  {
    id: 's_005',
    departmentId: 'd_003',
    departmentName: '抚州市教育体育局',
    name: '义务教育入学报名',
    shortName: '入学报名',
    category: 'education',
    status: 'active',
    level: 'municipal',
    icon: 'GraduationCap',
    description: '小学一年级、初中一年级新生入学报名',
    workDays: '10个工作日',
    chargeStandard: '免费',
    hotLevel: 5,
    viewCount: 45600,
    applyCount: 15800,
    satisfaction: 96.5,
    materials: [
      { id: 'm1', name: '户口簿', required: true, format: '原件+扫描件', description: '含父母及子女信息' },
      { id: 'm2', name: '房产证明', required: true, format: '原件+扫描件', description: '房产证或购房合同' },
      { id: 'm3', name: '儿童预防接种证', required: true, format: '扫描件', description: '小学入学需提供' },
      { id: 'm4', name: '小学毕业证', required: false, format: '扫描件', description: '初中入学需提供' }
    ],
    steps: [
      { step: 1, title: '信息填报', description: '填写学生及家长信息', duration: '20分钟' },
      { step: 2, title: '材料上传', description: '上传报名所需材料', duration: '15分钟' },
      { step: 3, title: '学校审核', description: '对口学校审核报名材料', duration: '5个工作日' },
      { step: 4, title: '教体局复核', description: '教育主管部门复核确认', duration: '3个工作日' },
      { step: 5, title: '录取通知', description: '发放录取通知书', duration: '2个工作日' }
    ],
    conditions: [
      '年满6周岁（小学入学）',
      '符合学区划分条件',
      '身体健康，具备学习能力'
    ],
    notices: [
      '请在规定时间内完成报名',
      '学区划分以当年公布为准',
      '材料不实将取消录取资格'
    ],
    onlineApply: true,
    appointment: false,
    handleMethod: 'online',
    promiseDays: 10,
    isInstant: false,
    serviceType: 'personal',
    createTime: '2023-01-01 00:00:00',
    updateTime: '2024-01-10 10:00:00'
  },
  {
    id: 's_006',
    departmentId: 'd_004',
    departmentName: '抚州市住房公积金管理中心',
    name: '公积金提取',
    shortName: '公积金提取',
    category: 'housing_fund',
    status: 'active',
    level: 'municipal',
    icon: 'Wallet',
    description: '住房公积金购买、建造、租房等提取业务',
    workDays: '3个工作日',
    chargeStandard: '免费',
    hotLevel: 5,
    viewCount: 52300,
    applyCount: 18900,
    satisfaction: 97.2,
    materials: [
      { id: 'm1', name: '身份证', required: true, format: '原件', description: '本人有效居民身份证' },
      { id: 'm2', name: '银行卡', required: true, format: '原件', description: '本人一类银行储蓄卡' },
      { id: 'm3', name: '购房合同', required: false, format: '原件+复印件', description: '购房提取需提供' },
      { id: 'm4', name: '租房合同', required: false, format: '原件+复印件', description: '租房提取需提供' }
    ],
    steps: [
      { step: 1, title: '选择提取类型', description: '根据实际情况选择提取原因', duration: '5分钟' },
      { step: 2, title: '填写信息', description: '填写提取申请信息', duration: '10分钟' },
      { step: 3, title: '材料上传', description: '上传相关证明材料', duration: '10分钟' },
      { step: 4, title: '中心审核', description: '公积金中心审核申请', duration: '2个工作日' },
      { step: 5, title: '资金到账', description: '提取资金划转至银行卡', duration: '1个工作日' }
    ],
    conditions: [
      '已连续足额缴存住房公积金6个月以上',
      '符合提取情形（购房、建房、租房、退休等）'
    ],
    notices: [
      '不同提取类型所需材料不同',
      '提取资金一般在审核通过后1-3个工作日到账',
      '每年可提取一次'
    ],
    onlineApply: true,
    appointment: false,
    handleMethod: 'both',
    promiseDays: 3,
    isInstant: false,
    serviceType: 'personal',
    createTime: '2023-01-01 00:00:00',
    updateTime: '2024-01-10 10:00:00'
  },
  {
    id: 's_007',
    departmentId: 'd_004',
    departmentName: '抚州市住房公积金管理中心',
    name: '公积金贷款申请',
    shortName: '公积金贷款',
    category: 'housing_fund',
    status: 'active',
    level: 'municipal',
    icon: 'Banknote',
    description: '个人住房公积金贷款申请办理',
    workDays: '15个工作日',
    chargeStandard: '免费',
    hotLevel: 4,
    viewCount: 28600,
    applyCount: 4500,
    satisfaction: 95.8,
    materials: [
      { id: 'm1', name: '身份证', required: true, format: '原件', description: '夫妻双方身份证' },
      { id: 'm2', name: '户口簿', required: true, format: '原件', description: '夫妻双方户口簿' },
      { id: 'm3', name: '结婚证', required: true, format: '原件', description: '已婚需提供' },
      { id: 'm4', name: '购房合同', required: true, format: '原件', description: '备案后的购房合同' },
      { id: 'm5', name: '首付款发票', required: true, format: '原件', description: '购房首付款发票' },
      { id: 'm6', name: '收入证明', required: true, format: '原件', description: '单位出具的收入证明' }
    ],
    steps: [
      { step: 1, title: '贷款咨询', description: '了解贷款政策及额度', duration: '30分钟' },
      { step: 2, title: '提交申请', description: '提交贷款申请及材料', duration: '1个工作日' },
      { step: 3, title: '贷款审批', description: '公积金中心审批贷款', duration: '7个工作日' },
      { step: 4, title: '签订合同', description: '签订借款合同及担保合同', duration: '1个工作日' },
      { step: 5, title: '办理抵押', description: '办理不动产抵押登记', duration: '5个工作日' },
      { step: 6, title: '贷款发放', description: '银行发放贷款资金', duration: '1个工作日' }
    ],
    conditions: [
      '连续足额缴存公积金6个月以上',
      '具有稳定的经济收入和偿还贷款能力',
      '已支付规定比例的购房首付款',
      '信用状况良好'
    ],
    notices: [
      '贷款额度根据缴存情况、房价等综合确定',
      '贷款期限最长不超过30年',
      '可选择等额本息或等额本金还款方式'
    ],
    onlineApply: true,
    appointment: true,
    handleMethod: 'both',
    promiseDays: 15,
    isInstant: false,
    serviceType: 'personal',
    createTime: '2023-01-01 00:00:00',
    updateTime: '2024-01-10 10:00:00'
  },
  {
    id: 's_008',
    departmentId: 'd_005',
    departmentName: '抚州市交通运输局',
    name: '机动车驾驶证期满换证',
    shortName: '驾照换证',
    category: 'traffic',
    status: 'active',
    level: 'municipal',
    icon: 'Car',
    description: '机动车驾驶证有效期满换证业务',
    workDays: '1个工作日',
    chargeStandard: '工本费10元',
    hotLevel: 4,
    viewCount: 21300,
    applyCount: 7800,
    satisfaction: 98.0,
    materials: [
      { id: 'm1', name: '身份证', required: true, format: '原件', description: '本人有效居民身份证' },
      { id: 'm2', name: '原驾驶证', required: true, format: '原件', description: '原机动车驾驶证' },
      { id: 'm3', name: '身体条件证明', required: true, format: '原件', description: '县级以上医院出具' }
    ],
    steps: [
      { step: 1, title: '预约办理', description: '线上预约办理时间', duration: '5分钟' },
      { step: 2, title: '提交材料', description: '到车管所提交材料', duration: '30分钟' },
      { step: 3, title: '领取新证', description: '领取新驾驶证', duration: '即时' }
    ],
    conditions: [
      '驾驶证在有效期满前90日内',
      '驾驶证记分未达到12分',
      '身体条件符合驾驶许可条件'
    ],
    notices: [
      '可委托他人代办，但需提供委托书',
      '新驾驶证有效期为6年、10年或长期'
    ],
    onlineApply: true,
    appointment: true,
    handleMethod: 'both',
    promiseDays: 1,
    isInstant: false,
    serviceType: 'personal',
    createTime: '2023-01-01 00:00:00',
    updateTime: '2024-01-10 10:00:00'
  },
  {
    id: 's_009',
    departmentId: 'd_007',
    departmentName: '抚州市民政局',
    name: '结婚登记预约',
    shortName: '结婚登记',
    category: 'civil_affairs',
    status: 'active',
    level: 'municipal',
    icon: 'Heart',
    description: '内地居民结婚登记预约服务',
    workDays: '预约日办理',
    chargeStandard: '免费',
    hotLevel: 4,
    viewCount: 16800,
    applyCount: 5200,
    satisfaction: 99.5,
    materials: [
      { id: 'm1', name: '身份证', required: true, format: '原件', description: '双方有效居民身份证' },
      { id: 'm2', name: '户口簿', required: true, format: '原件', description: '双方户口簿' },
      { id: 'm3', name: '合影照片', required: true, format: '纸质', description: '3张大2寸双方近期半身免冠合影' }
    ],
    steps: [
      { step: 1, title: '网上预约', description: '选择登记机关和预约时间', duration: '10分钟' },
      { step: 2, title: '现场办理', description: '双方携带材料到现场办理', duration: '1小时' }
    ],
    conditions: [
      '男方年满22周岁，女方年满20周岁',
      '双方均无配偶',
      '双方没有直系血亲和三代以内旁系血亲关系',
      '双方自愿结婚'
    ],
    notices: [
      '必须双方亲自到场办理',
      '请提前准备好所需材料',
      '热门日期建议提前预约'
    ],
    onlineApply: true,
    appointment: true,
    handleMethod: 'both',
    promiseDays: 0,
    isInstant: false,
    serviceType: 'personal',
    createTime: '2023-01-01 00:00:00',
    updateTime: '2024-01-10 10:00:00'
  },
  {
    id: 's_010',
    departmentId: 'd_009',
    departmentName: '抚州市市场监督管理局',
    name: '个体工商户注册登记',
    shortName: '个体户注册',
    category: 'industry_commerce',
    status: 'active',
    level: 'municipal',
    icon: 'Store',
    description: '个体工商户设立登记服务',
    workDays: '3个工作日',
    chargeStandard: '免费',
    hotLevel: 4,
    viewCount: 19200,
    applyCount: 6800,
    satisfaction: 97.5,
    materials: [
      { id: 'm1', name: '身份证', required: true, format: '原件', description: '经营者身份证' },
      { id: 'm2', name: '经营场所证明', required: true, format: '原件', description: '房产证或租赁合同' },
      { id: 'm3', name: '个体工商户登记申请书', required: true, format: '电子版', description: '系统在线填写', templateUrl: '/templates/registration_form.pdf' }
    ],
    steps: [
      { step: 1, title: '名称申报', description: '在线申报个体工商户名称', duration: '10分钟' },
      { step: 2, title: '填写信息', description: '填写登记信息', duration: '20分钟' },
      { step: 3, title: '材料上传', description: '上传相关材料', duration: '10分钟' },
      { step: 4, title: '审核发证', description: '审核通过后发放营业执照', duration: '3个工作日' }
    ],
    conditions: [
      '有经营能力的公民',
      '有固定的经营场所'
    ],
    notices: [
      '经营范围涉及前置许可的需先取得许可证',
      '可选择全程电子化办理'
    ],
    onlineApply: true,
    appointment: false,
    handleMethod: 'both',
    promiseDays: 3,
    isInstant: false,
    serviceType: 'enterprise',
    createTime: '2023-01-01 00:00:00',
    updateTime: '2024-01-10 10:00:00'
  },
  {
    id: 's_011',
    departmentId: 'd_010',
    departmentName: '抚州市公安局',
    name: '身份证补办',
    shortName: '补办身份证',
    category: 'public_security',
    status: 'active',
    level: 'municipal',
    icon: 'IdCard',
    description: '居民身份证丢失、损坏补领',
    workDays: '20个工作日',
    chargeStandard: '40元/证',
    hotLevel: 5,
    viewCount: 25600,
    applyCount: 9200,
    satisfaction: 98.8,
    materials: [
      { id: 'm1', name: '户口簿', required: true, format: '原件', description: '本人户口簿' },
      { id: 'm2', name: '身份证领取凭证', required: false, format: '原件', description: '过期身份证可提供' }
    ],
    steps: [
      { step: 1, title: '网上预约', description: '预约办理时间和派出所', duration: '5分钟' },
      { step: 2, title: '现场办理', description: '到派出所采集指纹和照片', duration: '30分钟' },
      { step: 3, title: '领取证件', description: '到派出所或邮寄领取新身份证', duration: '20个工作日' }
    ],
    conditions: [
      '抚州市户籍居民',
      '身份证丢失或损坏'
    ],
    notices: [
      '需本人到场采集指纹',
      '可同时办理临时身份证（1个工作日可取）',
      '可选择邮政速递送达'
    ],
    onlineApply: true,
    appointment: true,
    handleMethod: 'both',
    promiseDays: 20,
    isInstant: false,
    serviceType: 'personal',
    createTime: '2023-01-01 00:00:00',
    updateTime: '2024-01-10 10:00:00'
  },
  {
    id: 's_012',
    departmentId: 'd_006',
    departmentName: '抚州市文化广电新闻出版旅游局',
    name: '图书馆读者证办理',
    shortName: '读者证办理',
    category: 'culture_tourism',
    status: 'active',
    level: 'municipal',
    icon: 'BookOpen',
    description: '抚州市图书馆读者借阅证办理',
    workDays: '即时办结',
    chargeStandard: '押金100元（退证退还）',
    hotLevel: 3,
    viewCount: 8900,
    applyCount: 3200,
    satisfaction: 99.0,
    materials: [
      { id: 'm1', name: '身份证', required: true, format: '原件', description: '本人有效居民身份证' }
    ],
    steps: [
      { step: 1, title: '现场办理', description: '凭身份证到图书馆服务台办理', duration: '10分钟' }
    ],
    conditions: [
      '持有效身份证件的中国公民',
      '愿意遵守图书馆借阅规则'
    ],
    notices: [
      '每证可借阅图书10册，借期30天',
      '可续借一次，续期30天',
      '退证时凭身份证和押金条退还押金'
    ],
    onlineApply: false,
    appointment: false,
    handleMethod: 'offline',
    promiseDays: 0,
    isInstant: true,
    serviceType: 'convenience',
    createTime: '2023-01-01 00:00:00',
    updateTime: '2024-01-10 10:00:00'
  }
]
