import type { RecommendService, UserBehaviorAnalysis } from '@/types/recommend';

export const mockRecommendServices: RecommendService[] = [
  {
    id: 'rec_001',
    serviceCode: 'TITLE_DECLARE_SENIOR',
    serviceName: '高级职称申报',
    serviceType: 'title_evaluation',
    category: '职称评审',
    description: '根据您已获得的中级工程师职称，推荐您申报高级工程师职称评审。',
    reason: '您已获得中级职称满3年，符合高级职称申报条件',
    reasonType: 'user_profile',
    confidence: 0.92,
    matchTags: ['中级职称', '工程师', '工作满5年'],
    userMatchScore: 95,
    hotLevel: 4,
    satisfaction: 96.5,
    applyCount: 12580,
    averageDuration: 30,
    isOnline: true,
    isCrossProvince: false
  },
  {
    id: 'rec_002',
    serviceCode: 'PENSION_CERT_RENEW',
    serviceName: '养老待遇证续期',
    serviceType: 'pension',
    category: '养老保险',
    description: '您的养老待遇证即将到期，推荐您提前办理续期手续。',
    reason: '您的养老待遇证将于2026年12月到期',
    reasonType: 'user_profile',
    confidence: 0.98,
    matchTags: ['养老待遇证', '即将到期'],
    userMatchScore: 100,
    hotLevel: 5,
    satisfaction: 99.0,
    applyCount: 45680,
    averageDuration: 3,
    isOnline: true,
    isCrossProvince: true,
    supportedProvinces: ['江苏', '上海', '浙江', '安徽']
  },
  {
    id: 'rec_003',
    serviceCode: 'PROFESSIONAL_QUALIFICATION_RENEW',
    serviceName: '职业资格证换证',
    serviceType: 'professional_qualification',
    category: '职业资格',
    description: '您的软件工程师职业资格证书即将到期，推荐您办理换证。',
    reason: '您的职业资格证将于2026年11月到期',
    reasonType: 'user_profile',
    confidence: 0.97,
    matchTags: ['职业资格证', '即将到期'],
    userMatchScore: 100,
    hotLevel: 4,
    satisfaction: 97.5,
    applyCount: 28960,
    averageDuration: 10,
    isOnline: true,
    isCrossProvince: true,
    supportedProvinces: ['全国']
  },
  {
    id: 'rec_004',
    serviceCode: 'SS_TRANSFER',
    serviceName: '社保关系转移',
    serviceType: 'pension',
    category: '养老保险',
    description: '根据您的工作变动记录，推荐您办理社保关系转移接续。',
    reason: '基于您的工作地变更历史推荐',
    reasonType: 'behavior',
    confidence: 0.85,
    matchTags: ['工作变动', '跨地区就业'],
    userMatchScore: 82,
    hotLevel: 4,
    satisfaction: 94.2,
    applyCount: 67890,
    averageDuration: 20,
    isOnline: true,
    isCrossProvince: true,
    supportedProvinces: ['全国']
  },
  {
    id: 'rec_005',
    serviceCode: 'CROSS_PROVINCE_PENSION',
    serviceName: '长三角养老待遇认证',
    serviceType: 'pension',
    category: '跨省通办',
    description: '您经常往返长三角地区，推荐使用跨省通办服务。',
    reason: '基于您的位置信息和出行记录推荐',
    reasonType: 'location',
    confidence: 0.88,
    matchTags: ['长三角地区', '异地居住'],
    userMatchScore: 85,
    hotLevel: 5,
    satisfaction: 99.0,
    applyCount: 89650,
    averageDuration: 2,
    isOnline: true,
    isCrossProvince: true,
    supportedProvinces: ['江苏', '上海', '浙江', '安徽']
  },
  {
    id: 'rec_006',
    serviceCode: 'MEDICAL_REIMBURSEMENT',
    serviceName: '医保费用报销',
    serviceType: 'medical',
    category: '医疗保险',
    description: '根据您近期的医疗消费记录，推荐您办理医保费用报销。',
    reason: '您近期有未报销的医疗费用',
    reasonType: 'behavior',
    confidence: 0.90,
    matchTags: ['医疗消费', '未报销'],
    userMatchScore: 88,
    hotLevel: 4,
    satisfaction: 95.0,
    applyCount: 78960,
    averageDuration: 8,
    isOnline: true,
    isCrossProvince: true,
    supportedProvinces: ['长三角']
  }
];

export const mockUserBehaviorAnalysis: UserBehaviorAnalysis = {
  userId: 'user_001',
  analysisTime: '2026-06-08 07:00:00',
  recentBehaviors: [
    {
      type: 'browse',
      count: 15,
      lastTime: '2026-06-08 09:00:00',
      categories: ['养老保险', '职称评审', '社会保障卡']
    },
    {
      type: 'apply',
      count: 3,
      lastTime: '2026-06-08 09:30:00',
      categories: ['养老保险', '失业保险', '职称评审']
    },
    {
      type: 'search',
      count: 8,
      lastTime: '2026-06-07 14:00:00',
      categories: ['职称申报', '养老金调整', '社保转移']
    }
  ],
  interestedCategories: ['职称评审', '养老保险', '社会保障卡'],
  uninterestedCategories: ['生育保险', '工伤保险'],
  serviceNeeds: [
    {
      serviceType: '高级职称申报',
      urgency: 'high',
      reason: '中级职称满3年，符合申报条件',
      suggestedTime: '2026年7月'
    },
    {
      serviceType: '养老待遇证续期',
      urgency: 'high',
      reason: '证件将于6个月内到期',
      suggestedTime: '2026年9月'
    },
    {
      serviceType: '职业资格证换证',
      urgency: 'medium',
      reason: '证件将于5个月内到期',
      suggestedTime: '2026年10月'
    }
  ],
  licenseStatus: {
    expiringSoon: ['license_002', 'license_004'],
    needRenewal: ['license_002', 'license_004']
  },
  insuranceStatus: {
    normal: ['养老保险', '医疗保险', '失业保险', '工伤保险', '生育保险'],
    needAttention: []
  },
  recommendedTags: ['中青年技术人员', '高学历', '稳定就业', '有晋升需求']
};
