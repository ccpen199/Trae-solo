import type { ExceptionRecord, TaskWarning, DailyStats, Evaluation, ArchiveRecord, TaskHeatmapPoint, Geofence, CheckinRecord } from '@/types/task';

const now = Date.now();

export const mockExceptions: ExceptionRecord[] = [
  {
    id: 'ex_001',
    waybillNo: 'SF1234567890124',
    exceptionType: 'damaged',
    severity: 'high',
    status: 'processing',
    description: '外包装箱一角有明显压痕，内部商品疑似破损，已拍照留证。收件人拒收。',
    photos: [
      {
        id: 'photo_001',
        url: 'https://picsum.photos/id/1/300/300',
        uploadTime: now - 3600000,
        location: '北京市海淀区中关村大街1号',
        longitude: 116.3176,
        latitude: 39.9832
      }
    ],
    reporterId: 'courier_001',
    reporterName: '张建国',
    reportTime: now - 3600000,
    reportLocation: '北京市海淀区中关村大街1号',
    reportLongitude: 116.3176,
    reportLatitude: 39.9832,
    handlerId: 'leader_001',
    handlerName: '王经理',
    handleTime: now - 1800000,
    handleResult: '联系发件人确认理赔方案',
    isOvertime: false,
    deadline: now + 7200000,
    operationLogs: [
      {
        id: 'log_001',
        operator: '张建国',
        action: '异常上报',
        remark: '外包装破损，收件人拒收',
        timestamp: now - 3600000
      },
      {
        id: 'log_002',
        operator: '王经理',
        action: '任务分配',
        remark: '已联系客服处理',
        timestamp: now - 1800000
      }
    ]
  },
  {
    id: 'ex_002',
    waybillNo: 'SF1234567890132',
    exceptionType: 'recipient_missing',
    severity: 'low',
    status: 'reported',
    description: '收件人不在家，电话无人接听，已短信通知。',
    photos: [],
    reporterId: 'courier_001',
    reporterName: '张建国',
    reportTime: now - 7200000,
    reportLocation: '北京市朝阳区朝阳北路100号',
    reportLongitude: 116.6123,
    reportLatitude: 39.9256,
    isOvertime: false,
    deadline: now + 14400000,
    operationLogs: [
      {
        id: 'log_003',
        operator: '张建国',
        action: '异常上报',
        remark: '收件人不在，电话未接',
        timestamp: now - 7200000
      }
    ]
  },
  {
    id: 'ex_003',
    waybillNo: 'SF1234567890133',
    exceptionType: 'address_unknown',
    severity: 'low',
    status: 'resolved',
    description: '地址不详细，无法找到具体位置。已电话联系收件人确认地址。',
    photos: [],
    reporterId: 'courier_001',
    reporterName: '张建国',
    reportTime: now - 86400000,
    reportLocation: '北京市朝阳区望京街道',
    handlerId: 'leader_001',
    handlerName: '王经理',
    handleTime: now - 82800000,
    handleResult: '已联系收件人重新派送完成',
    isOvertime: false,
    operationLogs: [
      {
        id: 'log_004',
        operator: '张建国',
        action: '异常上报',
        remark: '地址不详',
        timestamp: now - 86400000
      },
      {
        id: 'log_005',
        operator: '张建国',
        action: '处理完成',
        remark: '重新联系收件人后派送成功',
        timestamp: now - 82800000
      }
    ]
  },
  {
    id: 'ex_004',
    waybillNo: 'SF1234567890134',
    exceptionType: 'rejected',
    severity: 'medium',
    status: 'reported',
    description: '收件人以商品与描述不符为由拒收，已拍照留证。',
    photos: [
      {
        id: 'photo_002',
        url: 'https://picsum.photos/id/2/300/300',
        uploadTime: now - 1800000
      }
    ],
    reporterId: 'courier_001',
    reporterName: '张建国',
    reportTime: now - 1800000,
    reportLocation: '北京市朝阳区光华路9号',
    reportLongitude: 116.4532,
    reportLatitude: 39.9189,
    isOvertime: false,
    deadline: now + 10800000,
    operationLogs: [
      {
        id: 'log_006',
        operator: '张建国',
        action: '异常上报',
        remark: '客户拒收',
        timestamp: now - 1800000
      }
    ]
  }
];

export const mockWarnings: TaskWarning[] = [
  {
    id: 'warn_001',
    type: 'overtime',
    title: '派件即将超时',
    description: '运单 SF1234567890124 距离最晚派送时间还有30分钟',
    waybillNo: 'SF1234567890124',
    deadline: now + 1800000,
    severity: 'danger',
    createTime: now - 600000,
    isRead: false
  },
  {
    id: 'warn_002',
    type: 'overtime',
    title: '揽件任务超时预警',
    description: '运单 SF1234567890128 需在1小时内完成揽收',
    waybillNo: 'SF1234567890128',
    deadline: now + 3600000,
    severity: 'warning',
    createTime: now - 300000,
    isRead: false
  },
  {
    id: 'warn_003',
    type: 'exception',
    title: '新异常待处理',
    description: '收到1条新的异常件上报，需要及时处理',
    severity: 'warning',
    createTime: now - 900000,
    isRead: true
  },
  {
    id: 'warn_004',
    type: 'high_priority',
    title: 'VIP客户催件',
    description: '客户吴先生来电催促运单 SF1234567890126 尽快派送',
    waybillNo: 'SF1234567890126',
    severity: 'warning',
    createTime: now - 1200000,
    isRead: true
  }
];

export const mockDailyStats: DailyStats = {
  date: new Date().toISOString().split('T')[0],
  totalPickup: 12,
  completedPickup: 8,
  totalDelivery: 35,
  completedDelivery: 22,
  exceptionCount: 4,
  resolvedException: 1,
  overtimeCount: 0,
  workingHours: 8.5,
  distance: 45.2
};

export const mockHeatmapPoints: TaskHeatmapPoint[] = [
  { id: 'h1', longitude: 116.4863, latitude: 39.9274, weight: 15, type: 'delivery', count: 15 },
  { id: 'h2', longitude: 116.4678, latitude: 39.9087, weight: 12, type: 'delivery', count: 12 },
  { id: 'h3', longitude: 116.4612, latitude: 39.9067, weight: 8, type: 'delivery', count: 8 },
  { id: 'h4', longitude: 116.4532, latitude: 39.9189, weight: 10, type: 'pickup', count: 10 },
  { id: 'h5', longitude: 116.3176, latitude: 39.9832, weight: 6, type: 'pickup', count: 6 },
  { id: 'h6', longitude: 116.6123, latitude: 39.9256, weight: 3, type: 'exception', count: 3 },
  { id: 'h7', longitude: 116.6345, latitude: 39.9345, weight: 5, type: 'delivery', count: 5 },
  { id: 'h8', longitude: 116.4567, latitude: 39.9123, weight: 7, type: 'pickup', count: 7 }
];

export const mockGeofences: Geofence[] = [
  {
    id: 'fence_001',
    name: '朝阳路营业点',
    type: 'station',
    centerLongitude: 116.4863,
    centerLatitude: 39.9274,
    radius: 200,
    address: '北京市朝阳区朝阳路88号',
    isActive: true
  },
  {
    id: 'fence_002',
    name: 'CBD配送区',
    type: 'delivery_area',
    centerLongitude: 116.4650,
    centerLatitude: 39.9100,
    radius: 1000,
    address: '北京市朝阳区CBD商圈',
    isActive: true
  },
  {
    id: 'fence_003',
    name: '中关村揽收区',
    type: 'pickup_area',
    centerLongitude: 116.3176,
    centerLatitude: 39.9832,
    radius: 800,
    address: '北京市海淀区中关村',
    isActive: true
  }
];

export const mockCheckinRecords: CheckinRecord[] = [
  {
    id: 'ci_001',
    courierId: 'courier_001',
    type: 'check_in',
    location: '北京市朝阳区朝阳路88号',
    longitude: 116.4863,
    latitude: 39.9274,
    fenceId: 'fence_001',
    fenceName: '朝阳路营业点',
    isInsideFence: true,
    accuracy: 5,
    timestamp: now - 3600000 * 8,
    deviceInfo: 'iPhone 14 Pro iOS 17.0'
  },
  {
    id: 'ci_002',
    courierId: 'courier_001',
    type: 'fence_in',
    location: '北京市朝阳区CBD商圈',
    longitude: 116.4650,
    latitude: 39.9100,
    fenceId: 'fence_002',
    fenceName: 'CBD配送区',
    isInsideFence: true,
    accuracy: 8,
    timestamp: now - 3600000 * 6
  },
  {
    id: 'ci_003',
    courierId: 'courier_001',
    type: 'fence_out',
    location: '北京市朝阳区CBD商圈',
    longitude: 116.4650,
    latitude: 39.9100,
    fenceId: 'fence_002',
    fenceName: 'CBD配送区',
    isInsideFence: false,
    accuracy: 10,
    timestamp: now - 3600000 * 3
  }
];

export const mockEvaluations: Evaluation[] = [
  {
    id: 'eval_001',
    waybillNo: 'SF1234567890126',
    rating: 5,
    content: '快递员非常专业，配送速度快，包装完好，服务态度很好。',
    tags: ['速度快', '服务好', '包装完好'],
    negativeKeywords: [],
    hasNegative: false,
    reviewerName: '吴先生',
    reviewerPhone: '13800008888',
    createTime: now - 86400000,
    isHandled: false
  },
  {
    id: 'eval_002',
    waybillNo: 'SF1234567890135',
    rating: 2,
    content: '配送太慢了，迟到了整整两个小时，而且不打电话直接扔驿站，态度也很差。',
    tags: ['速度慢', '不送货上门', '态度差'],
    negativeKeywords: ['太慢', '迟到', '扔驿站', '态度差'],
    hasNegative: true,
    reviewerName: '刘女士',
    reviewerPhone: '13800009999',
    createTime: now - 172800000,
    isHandled: false
  },
  {
    id: 'eval_003',
    waybillNo: 'SF1234567890136',
    rating: 1,
    content: '外包装破损严重，里面的商品都坏了，拒收！投诉！',
    tags: ['包装破损', '拒收'],
    negativeKeywords: ['破损', '坏了', '拒收', '投诉'],
    hasNegative: true,
    reviewerName: '陈先生',
    reviewerPhone: '13800001111',
    createTime: now - 259200000,
    isHandled: true,
    handlerRemark: '已联系客户致歉并安排退换货，已对快递员进行培训',
    handleTime: now - 200000000
  },
  {
    id: 'eval_004',
    waybillNo: 'SF1234567890137',
    rating: 4,
    content: '整体还不错，就是打电话的时候有点不耐烦。',
    tags: ['基本满意'],
    negativeKeywords: ['不耐烦'],
    hasNegative: true,
    reviewerName: '赵女士',
    reviewerPhone: '13800002222',
    createTime: now - 345600000,
    isHandled: true,
    handlerRemark: '已提醒快递员注意服务态度',
    handleTime: now - 300000000
  },
  {
    id: 'eval_005',
    waybillNo: 'SF1234567890138',
    rating: 5,
    content: '非常好，按时送达，快递员很有礼貌，五星好评！',
    tags: ['准时', '服务好', '五星好评'],
    negativeKeywords: [],
    hasNegative: false,
    reviewerName: '孙先生',
    reviewerPhone: '13800003333',
    createTime: now - 432000000,
    isHandled: false
  }
];

export const mockArchives: ArchiveRecord[] = [
  {
    id: 'arc_001',
    waybillNo: 'SF1234567890001',
    archiveType: 'normal',
    archiveTime: now - 86400000 * 180,
    archivist: '系统自动',
    evidenceHash: '0xa1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef',
    blockchainTxId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    storageUrl: 'oss://express-archive/2025/01/SF1234567890001.zip',
    retentionYears: 5,
    isVerified: true,
    verifyTime: now - 86400000 * 179
  },
  {
    id: 'arc_002',
    waybillNo: 'SF1234567890002',
    archiveType: 'exception',
    archiveTime: now - 86400000 * 120,
    archivist: '王经理',
    evidenceHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    storageUrl: 'oss://express-archive/2025/03/SF1234567890002.zip',
    retentionYears: 10,
    isVerified: true,
    verifyTime: now - 86400000 * 119
  },
  {
    id: 'arc_003',
    waybillNo: 'SF1234567890003',
    archiveType: 'legal',
    archiveTime: now - 86400000 * 90,
    archivist: '法务部-李律师',
    evidenceHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    blockchainTxId: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    storageUrl: 'oss://express-archive/2025/04/SF1234567890003.zip',
    retentionYears: 20,
    isVerified: true,
    verifyTime: now - 86400000 * 89
  }
];
