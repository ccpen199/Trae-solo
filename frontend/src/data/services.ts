import type { Matter, ServiceItem, ServiceCategory } from '@/types/matter';

export const mockServiceCategories: ServiceCategory[] = [
  {
    id: 'cat_001',
    categoryCode: 'pension',
    categoryName: '养老保险',
    serviceCount: 12,
    children: [
      {
        id: 'cat_001_01',
        categoryCode: 'pension_cert',
        categoryName: '待遇资格认证',
        serviceCount: 3,
        children: []
      },
      {
        id: 'cat_001_02',
        categoryCode: 'pension_transfer',
        categoryName: '关系转移',
        serviceCount: 4,
        children: []
      }
    ]
  },
  {
    id: 'cat_002',
    categoryCode: 'medical',
    categoryName: '医疗保险',
    serviceCount: 15,
    children: []
  },
  {
    id: 'cat_003',
    categoryCode: 'unemployment',
    categoryName: '失业保险',
    serviceCount: 8,
    children: []
  },
  {
    id: 'cat_004',
    categoryCode: 'work_injury',
    categoryName: '工伤保险',
    serviceCount: 10,
    children: []
  },
  {
    id: 'cat_005',
    categoryCode: 'maternity',
    categoryName: '生育保险',
    serviceCount: 6,
    children: []
  },
  {
    id: 'cat_006',
    categoryCode: 'social_security_card',
    categoryName: '社会保障卡',
    serviceCount: 9,
    children: []
  },
  {
    id: 'cat_007',
    categoryCode: 'professional_qualification',
    categoryName: '职业资格',
    serviceCount: 20,
    children: []
  },
  {
    id: 'cat_008',
    categoryCode: 'title_evaluation',
    categoryName: '职称评审',
    serviceCount: 15,
    children: []
  },
  {
    id: 'cat_009',
    categoryCode: 'labor_rights',
    categoryName: '劳动维权',
    serviceCount: 8,
    children: []
  },
  {
    id: 'cat_010',
    categoryCode: 'cross_province',
    categoryName: '跨省通办',
    serviceCount: 12,
    children: []
  }
];

export const mockHotServices: ServiceItem[] = [
  {
    id: 'svc_001',
    serviceCode: 'PENSION_CERT',
    serviceName: '养老待遇资格认证',
    serviceType: 'pension',
    category: '养老保险',
    description: '通过人脸识别完成养老待遇领取资格认证',
    handlingTime: '即时办结',
    handlingLocation: '线上办理',
    handlingMaterials: ['身份证', '人脸照片'],
    handlingProcess: ['身份核验', '人脸识别', '活体检测', '认证完成'],
    legalBasis: '《社会保险法》',
    noticeItems: ['需本人完成人脸识别', '认证周期为12个月'],
    hotLevel: 5,
    isOnline: true,
    isCrossProvince: true,
    supportedProvinces: ['江苏', '上海', '浙江', '安徽'],
    averageDuration: 2,
    satisfaction: 98.5,
    applyCount: 125680
  },
  {
    id: 'svc_002',
    serviceCode: 'ECARD_APPLY',
    serviceName: '电子社保卡申领',
    serviceType: 'social_security_card',
    category: '社会保障卡',
    description: '在线申领电子社保卡，享受便捷社保服务',
    handlingTime: '即时办结',
    handlingLocation: '线上办理',
    handlingMaterials: ['身份证', '实名手机号'],
    handlingProcess: ['实名认证', '人脸核验', '设置密码', '领取成功'],
    legalBasis: '《社会保障卡管理办法》',
    noticeItems: ['需完成实名认证', '需本人人脸核验'],
    hotLevel: 5,
    isOnline: true,
    isCrossProvince: false,
    averageDuration: 3,
    satisfaction: 99.2,
    applyCount: 256890
  },
  {
    id: 'svc_003',
    serviceCode: 'UNEMPLOYMENT_REG',
    serviceName: '失业登记',
    serviceType: 'unemployment',
    category: '失业保险',
    description: '办理失业登记，申请失业保险待遇',
    handlingTime: '3个工作日',
    handlingLocation: '线上办理',
    handlingMaterials: ['身份证', '离职证明', '户口本'],
    handlingProcess: ['填写信息', '上传材料', '提交审核', '审核通过'],
    legalBasis: '《失业保险条例》',
    noticeItems: ['需提供离职证明', '需在停保后60天内办理'],
    hotLevel: 4,
    isOnline: true,
    isCrossProvince: true,
    supportedProvinces: ['江苏', '上海', '浙江', '安徽'],
    averageDuration: 5,
    satisfaction: 96.8,
    applyCount: 89560
  },
  {
    id: 'svc_004',
    serviceCode: 'TITLE_DECLARE',
    serviceName: '职称申报',
    serviceType: 'title_evaluation',
    category: '职称评审',
    description: '在线申报职称评审，提交业绩材料',
    handlingTime: '30个工作日',
    handlingLocation: '线上办理',
    handlingMaterials: ['身份证', '学历证明', '业绩材料', '继续教育证明'],
    handlingProcess: ['选择级别', '填写信息', '上传材料', '提交评审', '评审公示', '领取证书'],
    legalBasis: '《职称评审管理暂行规定》',
    noticeItems: ['需在规定时间内申报', '材料需真实有效'],
    hotLevel: 4,
    isOnline: true,
    isCrossProvince: false,
    averageDuration: 15,
    satisfaction: 95.5,
    applyCount: 45680
  },
  {
    id: 'svc_005',
    serviceCode: 'SS_TRANSFER',
    serviceName: '社保关系转移',
    serviceType: 'pension',
    category: '养老保险',
    description: '办理养老保险关系跨省转移接续',
    handlingTime: '15个工作日',
    handlingLocation: '线上办理',
    handlingMaterials: ['身份证', '社保卡', '缴费凭证'],
    handlingProcess: ['提出申请', '原参保地审核', '转移基金', '新参保地接续'],
    legalBasis: '《城镇企业职工基本养老保险关系转移接续暂行办法》',
    noticeItems: ['需在新参保地参保后申请', '转移周期约45天'],
    hotLevel: 4,
    isOnline: true,
    isCrossProvince: true,
    supportedProvinces: ['全国'],
    averageDuration: 20,
    satisfaction: 94.2,
    applyCount: 67890
  },
  {
    id: 'svc_006',
    serviceCode: 'LABOR_COMPLAINT',
    serviceName: '劳动维权投诉',
    serviceType: 'labor_rights',
    category: '劳动维权',
    description: '在线投诉劳动权益侵害，维护合法权益',
    handlingTime: '5个工作日',
    handlingLocation: '线上办理',
    handlingMaterials: ['身份证', '劳动合同', '证据材料'],
    handlingProcess: ['填写投诉内容', '上传证据', '提交审核', '受理处理', '反馈结果'],
    legalBasis: '《劳动保障监察条例》',
    noticeItems: ['需提供真实有效的证据', '投诉事项需明确具体'],
    hotLevel: 3,
    isOnline: true,
    isCrossProvince: false,
    averageDuration: 10,
    satisfaction: 93.8,
    applyCount: 23450
  },
  {
    id: 'svc_007',
    serviceCode: 'LICENSE_VERIFY',
    serviceName: '电子证照验真',
    serviceType: 'license',
    category: '社会保障卡',
    description: '验证电子证照的真实性和有效性',
    handlingTime: '即时办结',
    handlingLocation: '线上办理',
    handlingMaterials: ['证照编号', '验证码'],
    handlingProcess: ['输入证照信息', '系统核验', '返回结果'],
    legalBasis: '《电子证照管理暂行办法》',
    noticeItems: ['需准确输入证照编号和验证码'],
    hotLevel: 3,
    isOnline: true,
    isCrossProvince: true,
    supportedProvinces: ['全国'],
    averageDuration: 1,
    satisfaction: 99.8,
    applyCount: 1567890
  },
  {
    id: 'svc_008',
    serviceCode: 'CROSS_PROVINCE_PENSION',
    serviceName: '长三角养老待遇认证',
    serviceType: 'pension',
    category: '跨省通办',
    description: '长三角地区跨省办理养老待遇资格认证',
    handlingTime: '即时办结',
    handlingLocation: '线上办理',
    handlingMaterials: ['身份证', '人脸照片'],
    handlingProcess: ['选择办理地', '身份核验', '人脸识别', '认证完成'],
    legalBasis: '《长三角区域人社领域政务服务跨省通办合作协议》',
    noticeItems: ['支持上海、江苏、浙江、安徽四地互认', '认证结果全国通用'],
    hotLevel: 5,
    isOnline: true,
    isCrossProvince: true,
    supportedProvinces: ['江苏', '上海', '浙江', '安徽'],
    averageDuration: 2,
    satisfaction: 99.0,
    applyCount: 89650
  }
];

export const mockHomeServices: ServiceItem[] = mockHotServices.slice(0, 6);

export const mockAllServices: ServiceItem[] = [
  ...mockHotServices,
  {
    id: 'svc_009',
    serviceCode: 'MEDICAL_REIMBURSEMENT',
    serviceName: '医保费用报销',
    serviceType: 'medical',
    category: '医疗保险',
    description: '申请医疗保险费用报销',
    handlingTime: '10个工作日',
    handlingLocation: '线上办理',
    handlingMaterials: ['身份证', '医疗费用发票', '病历', '费用清单'],
    handlingProcess: ['填写信息', '上传材料', '提交审核', '审核拨付'],
    legalBasis: '《社会保险法》',
    noticeItems: ['需在费用发生后12个月内申请', '发票需为原件'],
    hotLevel: 4,
    isOnline: true,
    isCrossProvince: true,
    supportedProvinces: ['长三角'],
    averageDuration: 8,
    satisfaction: 95.0,
    applyCount: 78960
  },
  {
    id: 'svc_010',
    serviceCode: 'UNEMPLOYMENT_BENEFIT',
    serviceName: '失业保险金申领',
    serviceType: 'unemployment',
    category: '失业保险',
    description: '申领失业保险金待遇',
    handlingTime: '5个工作日',
    handlingLocation: '线上办理',
    handlingMaterials: ['身份证', '社保卡', '失业登记证明'],
    handlingProcess: ['失业登记', '提交申请', '审核通过', '按月发放'],
    legalBasis: '《失业保险条例》',
    noticeItems: ['需累计缴费满1年以上', '需在停保后60天内办理'],
    hotLevel: 4,
    isOnline: true,
    isCrossProvince: true,
    supportedProvinces: ['全国'],
    averageDuration: 3,
    satisfaction: 96.5,
    applyCount: 56780
  }
];

export const mockMatters: Matter[] = [
  {
    id: 'matter_001',
    matterCode: 'PENSION_CERT_202606001',
    matterName: '养老待遇资格认证',
    matterType: 'pension_certification',
    applicantName: '张三',
    applicantIdCard: '320101199001011234',
    applicantPhone: '13800138000',
    applyTime: '2026-06-08 09:30:00',
    status: 'completed',
    currentNode: '认证完成',
    estimatedFinishTime: '2026-06-08',
    actualFinishTime: '2026-06-08 09:32:15',
    acceptOrganization: '江苏省人力资源和社会保障厅',
    handleOrganization: '江苏省社会保险基金管理中心',
    handler: '系统自动核验',
    handlerPhone: '025-12333',
    materials: [
      {
        id: 'mat_001_01',
        name: '身份证照片',
        type: 'required',
        format: 'image',
        fileUrl: '',
        uploadTime: '2026-06-08 09:30:00',
        verified: true,
        verifyTime: '2026-06-08 09:30:30',
        verifyResult: 'pass'
      }
    ],
    approvalNodes: [
      {
        id: 'node_001_01',
        nodeName: '身份核验',
        nodeOrder: 1,
        status: 'completed',
        handler: '系统自动核验',
        handleTime: '2026-06-08 09:30:30',
        handleResult: 'pass',
        startTime: '2026-06-08 09:30:00',
        endTime: '2026-06-08 09:30:30',
        estimatedDuration: 1
      },
      {
        id: 'node_001_02',
        nodeName: '认证完成',
        nodeOrder: 2,
        status: 'completed',
        handler: '系统自动完成',
        handleTime: '2026-06-08 09:32:15',
        handleResult: 'pass',
        startTime: '2026-06-08 09:30:30',
        endTime: '2026-06-08 09:32:15',
        estimatedDuration: 1
      }
    ],
    traceRecords: [
      {
        id: 'trace_001_01',
        operation: '提交申请',
        operator: '张三',
        operatorRole: '申请人',
        operationTime: '2026-06-08 09:30:00',
        operationDetail: '提交养老待遇资格认证申请',
        previousStatus: 'draft',
        currentStatus: 'submitted'
      },
      {
        id: 'trace_001_02',
        operation: '认证完成',
        operator: '系统',
        operatorRole: '系统',
        operationTime: '2026-06-08 09:32:15',
        operationDetail: '养老待遇资格认证完成',
        previousStatus: 'approved',
        currentStatus: 'completed'
      }
    ],
    feePaid: true,
    isUrgent: false,
    isCrossProvince: true,
    crossProvinceInfo: {
      sourceProvince: '江苏',
      sourceCity: '南京',
      targetProvince: '上海',
      targetCity: '上海',
      transferStatus: 'transferred',
      transferTime: '2026-06-08 09:31:00',
      receiveTime: '2026-06-08 09:31:30',
      collaborationNodes: [
        {
          id: 'collab_001',
          province: '上海',
          city: '上海',
          organization: '上海市人社局',
          status: 'completed',
          handler: '协同窗口',
          handleTime: '2026-06-08 09:31:30'
        }
      ]
    }
  },
  {
    id: 'matter_002',
    matterCode: 'TITLE_DECLARE_202605001',
    matterName: '中级工程师职称申报',
    matterType: 'title_declaration',
    applicantName: '张三',
    applicantIdCard: '320101199001011234',
    applicantPhone: '13800138000',
    applyTime: '2026-05-15 14:20:00',
    status: 'reviewing',
    currentNode: '专家评审',
    estimatedFinishTime: '2026-06-20',
    acceptOrganization: '江苏省人力资源和社会保障厅',
    handleOrganization: '江苏省职称评价中心',
    handler: '王评审',
    handlerPhone: '025-12333',
    materials: [
      {
        id: 'mat_002_01',
        name: '身份证',
        type: 'required',
        format: 'image',
        fileUrl: '',
        uploadTime: '2026-05-15 14:20:00',
        verified: true,
        verifyTime: '2026-05-16 09:00:00',
        verifyResult: 'pass'
      },
      {
        id: 'mat_002_02',
        name: '业绩材料',
        type: 'required',
        format: 'pdf',
        fileUrl: '',
        uploadTime: '2026-05-15 14:30:00',
        verified: true,
        verifyTime: '2026-05-16 09:10:00',
        verifyResult: 'pass'
      }
    ],
    approvalNodes: [
      {
        id: 'node_002_01',
        nodeName: '材料初审',
        nodeOrder: 1,
        status: 'completed',
        handler: '张初审',
        handleTime: '2026-05-16 09:30:00',
        handleResult: 'pass',
        startTime: '2026-05-15 14:35:00',
        endTime: '2026-05-16 09:30:00',
        estimatedDuration: 1
      },
      {
        id: 'node_002_02',
        nodeName: '专家评审',
        nodeOrder: 2,
        status: 'processing',
        handler: '王评审',
        startTime: '2026-05-21 09:00:00',
        estimatedDuration: 15
      }
    ],
    traceRecords: [
      {
        id: 'trace_002_01',
        operation: '提交申请',
        operator: '张三',
        operatorRole: '申请人',
        operationTime: '2026-05-15 14:35:00',
        operationDetail: '提交中级工程师职称申报申请',
        previousStatus: 'draft',
        currentStatus: 'submitted'
      },
      {
        id: 'trace_002_02',
        operation: '进入专家评审',
        operator: '王评审',
        operatorRole: '评审员',
        operationTime: '2026-05-21 09:00:00',
        operationDetail: '材料进入专家评审环节',
        previousStatus: 'accepted',
        currentStatus: 'reviewing'
      }
    ],
    fee: 120,
    feePaid: true,
    paymentTime: '2026-05-15 14:40:00',
    isUrgent: false,
    isCrossProvince: false
  },
  {
    id: 'matter_003',
    matterCode: 'ECARD_APPLY_202606002',
    matterName: '电子社保卡申领',
    matterType: 'ecard_apply',
    applicantName: '张三',
    applicantIdCard: '320101199001011234',
    applicantPhone: '13800138000',
    applyTime: '2026-06-09 10:10:00',
    status: 'submitted',
    currentNode: '实名认证',
    estimatedFinishTime: '2026-06-09',
    acceptOrganization: '江苏省人力资源和社会保障厅',
    handleOrganization: '电子社保卡服务中心',
    materials: [],
    approvalNodes: [
      {
        id: 'node_003_01',
        nodeName: '实名认证',
        nodeOrder: 1,
        status: 'processing',
        startTime: '2026-06-09 10:10:00',
        estimatedDuration: 1
      }
    ],
    traceRecords: [
      {
        id: 'trace_003_01',
        operation: '提交申请',
        operator: '张三',
        operatorRole: '申请人',
        operationTime: '2026-06-09 10:10:00',
        operationDetail: '提交电子社保卡申领申请',
        previousStatus: 'draft',
        currentStatus: 'submitted'
      }
    ],
    feePaid: false,
    isUrgent: false,
    isCrossProvince: false
  }
];

export const mockMatterStats = {
  total: mockMatters.length,
  processing: mockMatters.filter(item => ['submitted', 'accepted', 'reviewing'].includes(item.status)).length,
  completed: mockMatters.filter(item => item.status === 'completed').length,
  rejected: mockMatters.filter(item => ['rejected', 'cancelled'].includes(item.status)).length,
  urgent: mockMatters.filter(item => item.isUrgent).length,
  crossProvince: mockMatters.filter(item => item.isCrossProvince).length
};
