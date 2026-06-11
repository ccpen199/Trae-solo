import type { Waybill, PickupTask, DeliveryTask } from '@/types/waybill';

const now = Date.now();

export const mockWaybills: Waybill[] = [
  {
    id: 'wb_001',
    waybillNo: 'SF1234567890123',
    type: 'standard',
    status: 'pending_pickup',
    sender: {
      name: '刘先生',
      phone: '13900001111',
      address: '北京市朝阳区建国路88号',
      province: '北京市',
      city: '北京市',
      district: '朝阳区',
      detailAddress: '建国路88号SOHO现代城A座1201'
    },
    receiver: {
      name: '陈女士',
      phone: '13800002222',
      address: '上海市浦东新区陆家嘴环路1000号',
      province: '上海市',
      city: '上海市',
      district: '浦东新区',
      detailAddress: '陆家嘴环路1000号恒生银行大厦28层',
      longitude: 121.5049,
      latitude: 31.2397
    },
    weight: 2.5,
    length: 30,
    width: 20,
    height: 15,
    goodsDescription: '电子产品配件',
    goodsValue: 2000,
    freight: 18,
    paymentMethod: 'sender_pay',
    expectedPickupTime: now + 3600000,
    courierId: 'courier_001',
    courierName: '张建国',
    operationLogs: [],
    createTime: now - 7200000,
    updateTime: now - 7200000
  },
  {
    id: 'wb_002',
    waybillNo: 'SF1234567890124',
    type: 'fragile',
    status: 'delivering',
    sender: {
      name: '王小姐',
      phone: '13900003333',
      address: '广东省深圳市南山区科技园',
      province: '广东省',
      city: '深圳市',
      district: '南山区',
      detailAddress: '科技园南区高新南一道8号'
    },
    receiver: {
      name: '赵先生',
      phone: '13800004444',
      address: '北京市海淀区中关村大街1号',
      province: '北京市',
      city: '北京市',
      district: '海淀区',
      detailAddress: '中关村大街1号海龙大厦15层',
      longitude: 116.3176,
      latitude: 39.9832
    },
    weight: 5.2,
    goodsDescription: '陶瓷工艺品',
    goodsValue: 5000,
    freight: 45,
    paymentMethod: 'sender_pay',
    actualPickupTime: now - 86400000,
    expectedDeliveryTime: now + 7200000,
    courierId: 'courier_001',
    courierName: '张建国',
    operationLogs: [],
    createTime: now - 90000000,
    updateTime: now - 3600000
  },
  {
    id: 'wb_003',
    waybillNo: 'SF1234567890125',
    type: 'perishable',
    status: 'pending_delivery',
    sender: {
      name: '农场直供',
      phone: '13900005555',
      address: '河北省廊坊市固安县',
      province: '河北省',
      city: '廊坊市',
      district: '固安县',
      detailAddress: '现代农业产业园B区'
    },
    receiver: {
      name: '孙女士',
      phone: '13800006666',
      address: '北京市朝阳区朝阳北路100号',
      province: '北京市',
      city: '北京市',
      district: '朝阳区',
      detailAddress: '朝阳北路100号龙湖长楹天街西区',
      longitude: 116.6123,
      latitude: 39.9256
    },
    weight: 8.0,
    goodsDescription: '进口水果礼盒',
    goodsValue: 880,
    freight: 35,
    paymentMethod: 'monthly',
    actualPickupTime: now - 43200000,
    expectedDeliveryTime: now + 14400000,
    courierId: 'courier_001',
    courierName: '张建国',
    operationLogs: [],
    createTime: now - 50000000,
    updateTime: now - 43200000
  },
  {
    id: 'wb_004',
    waybillNo: 'SF1234567890126',
    type: 'valuable',
    status: 'delivered',
    sender: {
      name: '周大福珠宝',
      phone: '13900007777',
      address: '广东省深圳市罗湖区',
      province: '广东省',
      city: '深圳市',
      district: '罗湖区',
      detailAddress: '田贝四路万山珠宝园'
    },
    receiver: {
      name: '吴先生',
      phone: '13800008888',
      address: '北京市朝阳区光华路9号',
      province: '北京市',
      city: '北京市',
      district: '朝阳区',
      detailAddress: '光华路9号世贸天阶大厦',
      longitude: 116.4532,
      latitude: 39.9189
    },
    weight: 0.5,
    goodsDescription: '黄金首饰',
    goodsValue: 28800,
    freight: 88,
    paymentMethod: 'sender_pay',
    actualPickupTime: now - 172800000,
    actualDeliveryTime: now - 86400000,
    courierId: 'courier_001',
    courierName: '张建国',
    syncedToCainiao: true,
    cainiaoSyncTime: now - 80000000,
    operationLogs: [],
    createTime: now - 200000000,
    updateTime: now - 86400000,
    electronicSignature: {
      signerName: '吴先生',
      signerIdCard: '110101198501011234',
      timestamp: now - 86400000,
      location: '北京市朝阳区光华路9号'
    }
  },
  {
    id: 'wb_005',
    waybillNo: 'SF1234567890127',
    type: 'express',
    status: 'station_received',
    sender: {
      name: '天猫超市',
      phone: '13900009999',
      address: '天津市武清区电商园',
      province: '天津市',
      city: '天津市',
      district: '武清区',
      detailAddress: '电子商务产业园A12库'
    },
    receiver: {
      name: '郑女士',
      phone: '13800000000',
      address: '北京市朝阳区常营中路1号',
      province: '北京市',
      city: '北京市',
      district: '朝阳区',
      detailAddress: '常营中路1号富力阳光美园',
      longitude: 116.6345,
      latitude: 39.9345
    },
    weight: 12.5,
    goodsDescription: '日用百货',
    goodsValue: 560,
    freight: 25,
    paymentMethod: 'sender_pay',
    actualPickupTime: now - 86400000,
    stationId: 'station_001',
    stationName: '朝阳路营业点',
    courierId: 'courier_001',
    courierName: '张建国',
    operationLogs: [],
    createTime: now - 100000000,
    updateTime: now - 14400000
  }
];

export const mockPickupTasks: PickupTask[] = [
  {
    id: 'pt_001',
    waybillNo: 'SF1234567890123',
    waybill: mockWaybills[0],
    sender: mockWaybills[0].sender,
    goodsDescription: '电子产品配件',
    expectedPickupTime: now + 3600000,
    latestPickupTime: now + 7200000,
    status: 'pending',
    priority: 'normal',
    assignTime: now - 7200000
  },
  {
    id: 'pt_002',
    waybillNo: 'SF1234567890128',
    sender: {
      name: '黄先生',
      phone: '13900001234',
      address: '北京市朝阳区酒仙桥路14号',
      province: '北京市',
      city: '北京市',
      district: '朝阳区',
      detailAddress: '酒仙桥路14号兆维工业园'
    },
    goodsDescription: '重要文件',
    expectedPickupTime: now + 1800000,
    latestPickupTime: now + 3600000,
    status: 'accepted',
    priority: 'urgent',
    assignTime: now - 3600000,
    acceptTime: now - 3000000
  },
  {
    id: 'pt_003',
    waybillNo: 'SF1234567890129',
    sender: {
      name: '林女士',
      phone: '13900005678',
      address: '北京市朝阳区望京SOHO',
      province: '北京市',
      city: '北京市',
      district: '朝阳区',
      detailAddress: '望京SOHO T1座25层'
    },
    goodsDescription: '服装',
    expectedPickupTime: now + 5400000,
    latestPickupTime: now + 10800000,
    status: 'pending',
    priority: 'normal',
    assignTime: now - 1800000
  }
];

export const mockDeliveryTasks: DeliveryTask[] = [
  {
    id: 'dt_001',
    waybillNo: 'SF1234567890124',
    waybill: mockWaybills[1],
    receiver: mockWaybills[1].receiver,
    goodsDescription: '陶瓷工艺品',
    expectedDeliveryTime: now + 7200000,
    latestDeliveryTime: now + 14400000,
    status: 'delivering',
    deliveryAttempts: 1,
    assignTime: now - 3600000,
    startTime: now - 1800000
  },
  {
    id: 'dt_002',
    waybillNo: 'SF1234567890125',
    waybill: mockWaybills[2],
    receiver: mockWaybills[2].receiver,
    goodsDescription: '进口水果礼盒',
    expectedDeliveryTime: now + 14400000,
    latestDeliveryTime: now + 21600000,
    status: 'pending',
    deliveryAttempts: 0,
    assignTime: now - 7200000
  },
  {
    id: 'dt_003',
    waybillNo: 'SF1234567890130',
    receiver: {
      name: '冯先生',
      phone: '13800001212',
      address: '北京市朝阳区东三环中路55号',
      province: '北京市',
      city: '北京市',
      district: '朝阳区',
      detailAddress: '东三环中路55号富力广场B座',
      longitude: 116.4612,
      latitude: 39.9067
    },
    goodsDescription: '书籍',
    expectedDeliveryTime: now + 10800000,
    latestDeliveryTime: now + 18000000,
    status: 'pending',
    deliveryAttempts: 0,
    assignTime: now - 5400000
  },
  {
    id: 'dt_004',
    waybillNo: 'SF1234567890131',
    receiver: {
      name: '陈先生',
      phone: '13800003434',
      address: '北京市朝阳区建国门外大街1号',
      province: '北京市',
      city: '北京市',
      district: '朝阳区',
      detailAddress: '建国门外大街1号国贸中心',
      longitude: 116.4678,
      latitude: 39.9087
    },
    goodsDescription: '办公用品',
    expectedDeliveryTime: now + 7200000,
    latestDeliveryTime: now + 10800000,
    status: 'delivering',
    deliveryAttempts: 0,
    assignTime: now - 3600000,
    startTime: now - 1200000
  }
];

export const getMockWaybillByNo = (waybillNo: string): Waybill | undefined => {
  return mockWaybills.find(w => w.waybillNo === waybillNo);
};
