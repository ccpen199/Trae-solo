import type { ServiceApplication, Certificate, FeedbackTag } from '../types';

export const mockApplications: ServiceApplication[] = [
  {
    id: 'APP2026061500123',
    serviceId: 'gjj-tq',
    serviceName: '住房公积金购房提取',
    applyTime: '2026-06-15 14:32:18',
    status: 'approved',
    statusText: '已审核通过',
    currentStep: 4,
    totalSteps: 5,
    steps: [
      { step: 1, name: '提交申请', status: 'completed', time: '2026-06-15 14:32' },
      { step: 2, name: '材料审核', status: 'completed', time: '2026-06-15 16:08' },
      { step: 3, name: '资格核验', status: 'completed', time: '2026-06-16 09:15' },
      { step: 4, name: '领导审批', status: 'completed', time: '2026-06-17 10:22' },
      { step: 5, name: '资金拨付', status: 'processing' }
    ],
    estimatedDate: '2026-06-20',
    dept: '郑州住房公积金管理中心',
    staff: '李审核员',
    feedback: { rating: 0, done: false }
  },
  {
    id: 'APP2026061000456',
    serviceId: 'yibao-bx',
    serviceName: '基本医疗保险手工报销',
    applyTime: '2026-06-10 09:15:33',
    status: 'reviewing',
    statusText: '审核中',
    currentStep: 2,
    totalSteps: 4,
    steps: [
      { step: 1, name: '提交申请', status: 'completed', time: '2026-06-10 09:15' },
      { step: 2, name: '医疗费用审核', status: 'processing' },
      { step: 3, name: '财务核算', status: 'pending' },
      { step: 4, name: '报销款拨付', status: 'pending' }
    ],
    estimatedDate: '2026-06-30',
    dept: '郑州市医疗保障局',
    feedback: { rating: 0, done: false }
  },
  {
    id: 'APP2026060500789',
    serviceId: 'youer-yuan-baoming',
    serviceName: '幼儿园入园报名',
    applyTime: '2026-06-05 08:45:12',
    status: 'completed',
    statusText: '已完成',
    currentStep: 6,
    totalSteps: 6,
    steps: [
      { step: 1, name: '信息填报', status: 'completed', time: '2026-06-05 08:45' },
      { step: 2, name: '材料上传', status: 'completed', time: '2026-06-05 09:20' },
      { step: 3, name: '幼儿园初审', status: 'completed', time: '2026-06-07 15:30' },
      { step: 4, name: '教育局复核', status: 'completed', time: '2026-06-10 10:45' },
      { step: 5, name: '录取通知', status: 'completed', time: '2026-06-12 14:00' },
      { step: 6, name: '办理入园手续', status: 'completed', time: '2026-06-14 09:00' }
    ],
    estimatedDate: '2026-06-15',
    dept: '郑州市金水区教育局',
    feedback: { rating: 5, done: true }
  },
  {
    id: 'APP2026052000321',
    serviceId: 'fangchan-guohu',
    serviceName: '存量房买卖合同备案及转移登记',
    applyTime: '2026-05-20 10:22:47',
    status: 'completed',
    statusText: '已完成',
    currentStep: 5,
    totalSteps: 5,
    steps: [
      { step: 1, name: '网签备案', status: 'completed', time: '2026-05-20 10:22' },
      { step: 2, name: '税费核算与缴纳', status: 'completed', time: '2026-05-20 14:18' },
      { step: 3, name: '不动产登记受理', status: 'completed', time: '2026-05-21 09:05' },
      { step: 4, name: '审核登簿', status: 'completed', time: '2026-05-22 16:30' },
      { step: 5, name: '核发不动产权证', status: 'completed', time: '2026-05-23 11:00' }
    ],
    estimatedDate: '2026-05-25',
    dept: '郑州市自然资源和规划局',
    feedback: { rating: 4, done: true }
  },
  {
    id: 'APP2026051500654',
    serviceId: 'qiye-kb',
    serviceName: '企业开办一窗通',
    applyTime: '2026-05-15 14:50:33',
    status: 'completed',
    statusText: '已完成',
    currentStep: 7,
    totalSteps: 7,
    steps: [
      { step: 1, name: '名称自主申报', status: 'completed', time: '2026-05-15 14:50' },
      { step: 2, name: '工商设立登记', status: 'completed', time: '2026-05-15 15:10' },
      { step: 3, name: '公章刻制备案', status: 'completed', time: '2026-05-15 15:25' },
      { step: 4, name: '发票申领', status: 'completed', time: '2026-05-15 15:35' },
      { step: 5, name: '社保单位登记', status: 'completed', time: '2026-05-15 15:40' },
      { step: 6, name: '公积金单位登记', status: 'completed', time: '2026-05-15 15:42' },
      { step: 7, name: '预约银行开户', status: 'completed', time: '2026-05-15 16:00' }
    ],
    estimatedDate: '2026-05-15',
    dept: '郑州市市场监督管理局',
    feedback: { rating: 5, done: true }
  },
  {
    id: 'APP2026060100234',
    serviceId: 'jiazhao-bz',
    serviceName: '机动车驾驶证期满换证',
    applyTime: '2026-06-01 11:30:00',
    status: 'completed',
    statusText: '已完成',
    currentStep: 4,
    totalSteps: 4,
    steps: [
      { step: 1, name: '提交申请', status: 'completed', time: '2026-06-01 11:30' },
      { step: 2, name: '身体条件核查', status: 'completed', time: '2026-06-01 13:45' },
      { step: 3, name: '制证', status: 'completed', time: '2026-06-01 15:20' },
      { step: 4, name: '邮寄送达', status: 'completed', time: '2026-06-02 10:00' }
    ],
    estimatedDate: '2026-06-03',
    dept: '郑州市公安局交通警察支队',
    feedback: { rating: 5, done: true }
  }
];

export const mockCertificates: Certificate[] = [
  {
    id: 'c1',
    name: '居民身份证',
    type: 'identity',
    code: '410102198503154321',
    issuer: '郑州市公安局',
    issueDate: '2021-05-10',
    expireDate: '2041-05-10',
    status: 'valid',
    cachedOffline: true
  },
  {
    id: 'c2',
    name: '社会保障卡',
    type: 'social',
    code: 'A41010219850315001',
    issuer: '郑州市人力资源和社会保障局',
    issueDate: '2020-03-15',
    expireDate: '2030-03-15',
    status: 'valid',
    cachedOffline: true
  },
  {
    id: 'c3',
    name: '住房公积金缴存证明',
    type: 'housing',
    code: 'GJJ-ZM-2026-001234',
    issuer: '郑州住房公积金管理中心',
    issueDate: '2026-06-01',
    expireDate: '2026-09-01',
    status: 'valid',
    cachedOffline: true
  },
  {
    id: 'c4',
    name: '社会保险参保证明',
    type: 'social',
    code: 'SB-CZ-2026-056789',
    issuer: '郑州市社会保险中心',
    issueDate: '2026-06-05',
    expireDate: '2026-07-05',
    status: 'valid',
    cachedOffline: true
  },
  {
    id: 'c5',
    name: '机动车驾驶证',
    type: 'traffic',
    code: '4101021985******',
    issuer: '郑州市公安局交通警察支队',
    issueDate: '2026-06-01',
    expireDate: '2036-06-01',
    status: 'valid',
    cachedOffline: false
  },
  {
    id: 'c6',
    name: '不动产权证书',
    type: 'property',
    code: '豫(2026)郑州市不动产权第0012345号',
    issuer: '郑州市自然资源和规划局',
    issueDate: '2026-05-23',
    expireDate: '2086-05-23',
    status: 'valid',
    cachedOffline: false
  },
  {
    id: 'c7',
    name: '基本医疗保险参保凭证',
    type: 'medical',
    code: 'YB-PZ-2026-098765',
    issuer: '郑州市医疗保障局',
    issueDate: '2026-05-20',
    expireDate: '2026-12-31',
    status: 'valid',
    cachedOffline: true
  },
  {
    id: 'c8',
    name: '个人所得税纳税记录',
    type: 'tax',
    code: 'SDS-NJ-2026-112233',
    issuer: '国家税务总局郑州市税务局',
    issueDate: '2026-03-01',
    expireDate: '2026-12-31',
    status: 'valid',
    cachedOffline: false
  }
];

export const mockFeedbackTags: FeedbackTag[] = [
  { id: 'pt1', name: '办事效率高', type: 'positive' },
  { id: 'pt2', name: '服务态度好', type: 'positive' },
  { id: 'pt3', name: '流程简单清晰', type: 'positive' },
  { id: 'pt4', name: '材料清单明确', type: 'positive' },
  { id: 'pt5', name: '一次办好', type: 'positive' },
  { id: 'pt6', name: '线上办理方便', type: 'positive' },
  { id: 'pt7', name: '指引详细易懂', type: 'positive' },
  { id: 'pt8', name: '响应及时', type: 'positive' },
  { id: 'nt1', name: '办事效率低', type: 'negative' },
  { id: 'nt2', name: '服务态度差', type: 'negative' },
  { id: 'nt3', name: '流程过于复杂', type: 'negative' },
  { id: 'nt4', name: '材料要求过多', type: 'negative' },
  { id: 'nt5', name: '多次跑趟', type: 'negative' },
  { id: 'nt6', name: '系统不稳定', type: 'negative' },
  { id: 'nt7', name: '指引不清晰', type: 'negative' },
  { id: 'nt8', name: '电话联系不上', type: 'negative' },
  { id: 'nt9', name: '审核时间过长', type: 'negative' },
  { id: 'nt10', name: '收费不合理', type: 'negative' }
];

export const mockDashboard = {
  todayOnline: 1876543,
  todayServices: 48756,
  satisfaction: 96.8,
  pendingApplications: 3
};
