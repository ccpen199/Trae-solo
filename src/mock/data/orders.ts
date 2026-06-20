// 订单 Mock 数据：25个订单覆盖全状态

import { faker } from '@faker-js/faker';
import dayjs from 'dayjs';
import type {
  Order,
  OrderStatus,
  OverallGrade,
  PickupPeriod,
  InspectionReport,
  ReturnRecord,
  ReturnStatus,
} from '@/types';
import { productModels, brands } from './products';
import { inspectors } from './inspectors';

const USERS = ['user_001', 'user_002', 'user_003', 'user_004', 'user_005'];

const STATUSES: OrderStatus[] = [
  'pending_pickup', 'pending_pickup', 'inspecting', 'inspecting', 'inspecting',
  'pending_confirm', 'pending_confirm', 'paid', 'paid', 'paid',
  'completed', 'completed', 'completed', 'completed', 'completed',
  'returning', 'returning', 'returned', 'returned', 'cancelled',
  'cancelled', 'pending_pickup', 'inspecting', 'pending_confirm', 'completed',
];

const GRADES: OverallGrade[] = ['S', 'A+', 'A', 'A+', 'A', 'B+', 'B', 'B+', 'A', 'S', 'A+', 'A', 'B+', 'B', 'C'];

const PERIODS: PickupPeriod[] = ['morning', 'afternoon', 'evening'];

const PROVINCES = [
  { province: '上海市', city: '上海市', districts: ['浦东新区', '徐汇区', '静安区', '长宁区', '黄浦区'] },
  { province: '北京市', city: '北京市', districts: ['朝阳区', '海淀区', '西城区', '东城区', '丰台区'] },
  { province: '广东省', city: '深圳市', districts: ['南山区', '福田区', '罗湖区', '宝安区', '龙岗区'] },
  { province: '广东省', city: '广州市', districts: ['天河区', '越秀区', '海珠区', '番禺区', '白云区'] },
  { province: '浙江省', city: '杭州市', districts: ['西湖区', '拱墅区', '上城区', '滨江区', '余杭区'] },
  { province: '江苏省', city: '南京市', districts: ['鼓楼区', '玄武区', '建邺区', '秦淮区', '雨花台区'] },
];

const CONTACTS = ['张先生', '李女士', '王先生', '陈小姐', '刘先生', '赵女士', '孙先生', '周女士', '吴先生', '郑小姐'];

function genPhone(): string {
  return '1' + faker.string.numeric({ length: 10 });
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function genOrderNo(idx: number): string {
  const date = dayjs().subtract(idx, 'day').format('YYYYMMDD');
  return `HX${date}${String(1000 + idx).padStart(6, '0')}`;
}

function genImage(seed: number): string {
  const emojis = ['📱', '📷', '⌚', '👜', '💎', '📲', '🎥', '⏱️', '🎒', '💍'];
  return emojis[seed % emojis.length];
}

function genInspectionReport(
  orderId: string,
  inspectorId: string,
  seed: number,
  basePrice: number,
): InspectionReport {
  const itemCats = [
    { cat: '外观', items: ['边框磨损', '屏幕划痕', '背板划痕', '磕碰凹痕'] },
    { cat: '功能', items: ['开关机', '触控灵敏度', '按键', '扬声器', '麦克风', '摄像头'] },
    { cat: '内部', items: ['电池健康', '主板状态', '维修痕迹', '进水检测'] },
  ];
  const items: InspectionReport['items'] = [];
  itemCats.forEach(({ cat, items: sub }) => {
    sub.forEach((it, i) => {
      const r = Math.random() + seed * 0.01 + i * 0.05;
      let result: 'pass' | 'warning' | 'fail' = 'pass';
      if (r > 0.92) result = 'fail';
      else if (r > 0.75) result = 'warning';
      items.push({
        category: cat,
        item: it,
        result,
        note: result === 'warning' ? '轻微异常，不影响使用' : result === 'fail' ? '需进一步评估' : undefined,
      });
    });
  });
  const finalGrade = pick(GRADES, seed + 3);
  const gradeMultiplier = { S: 0.98, 'A+': 0.93, A: 0.88, 'B+': 0.80, B: 0.72, C: 0.60 }[finalGrade];
  const inspectedAt = dayjs().subtract(seed, 'day').subtract(2, 'hour').toISOString();
  return {
    id: `rpt_${orderId}`,
    orderId,
    inspectorName: inspectors.find(x => x.id === inspectorId)?.name || '未知检测师',
    inspectorId,
    inspectedAt,
    items,
    finalGrade,
    finalPrice: Math.round(basePrice * gradeMultiplier),
    photos: Array.from({ length: 6 }, (_, i) => `photo_${orderId}_${i + 1}.jpg`),
    signature: `sig_${inspectorId}_${Date.now() - seed * 3600}`,
  } as any;
}

export const orders: Order[] = [];

for (let i = 0; i < 25; i++) {
  const model = productModels[i % productModels.length];
  const brand = brands.find((b) => b.id === model.brandId)!;
  const status = STATUSES[i];
  const addr = pick(PROVINCES, i + 5);
  const grade = pick(GRADES, i + 1);
  const quoteFluct = 0.85 + ((i * 17) % 30) / 100;
  const quotePrice = Math.round(model.basePrice * quoteFluct);
  const needInspector = ['inspecting', 'pending_confirm', 'paid', 'completed', 'returning', 'returned'].includes(status);
  const inspectorId = needInspector ? inspectors[i % inspectors.length].id : undefined;
  const needReport = ['pending_confirm', 'paid', 'completed', 'returning', 'returned'].includes(status);
  const inspectionReport = needReport && inspectorId
    ? genInspectionReport(`ord_${i + 1}`, inspectorId, i + 11, model.basePrice)
    : undefined;
  const finalPrice = inspectionReport ? inspectionReport.finalPrice : undefined;
  const signed = ['paid', 'completed', 'returning', 'returned'].includes(status) || (status === 'pending_confirm' && i % 2 === 0);
  const createdAt = dayjs().subtract(i * 1.3 + 0.2, 'day').toISOString();
  const paidAt = ['paid', 'completed', 'returning', 'returned'].includes(status)
    ? dayjs(createdAt).add(i % 4 + 1, 'day').toISOString()
    : undefined;

  orders.push({
    id: `ord_${String(i + 1).padStart(5, '0')}`,
    orderNo: genOrderNo(i),
    userId: pick(USERS, i + 2),
    modelId: model.id,
    status,
    productInfo: {
      brand: brand.name,
      model: model.name,
      image: genImage(i),
      grade,
    },
    quotePrice,
    finalPrice,
    pickupAddress: {
      province: addr.province,
      city: addr.city,
      district: pick(addr.districts, i + 3),
      detail: `${faker.location.streetAddress(false)} ${faker.number.int({ min: 1, max: 30 })}层${faker.number.int({ min: 101, max: 2500 })}室`,
      contact: pick(CONTACTS, i + 7),
      phone: genPhone(),
    },
    pickupWindow: {
      date: dayjs(createdAt).add(((i + 1) % 4), 'day').format('YYYY-MM-DD'),
      period: pick(PERIODS, i + 1),
    },
    inspectorId,
    inspectionReport,
    signedAgreement: signed,
    createdAt,
    paidAt,
  });
}

export function getOrdersByUser(userId: string, status?: string): Order[] {
  return orders.filter((o) => o.userId === userId && (!status || o.status === status));
}

export function getOrderById(id: string): Order | undefined {
  return orders.find((o) => o.id === id || o.orderNo === id);
}

export const returnRecords: ReturnRecord[] = [];

const returnOrderIdxs = orders
  .map((o, i) => ({ o, i }))
  .filter(({ o }) => o.status === 'returning' || o.status === 'returned');

returnOrderIdxs.forEach(({ o, i }) => {
  const requestedAt = dayjs(o.paidAt || o.createdAt).add(3 + (i % 12), 'day');
  const statuses: ReturnStatus[] = ['requested', 'reviewing', 'approved', 'shipped', 'inspecting', 'refunded'];
  const targetLen = o.status === 'returned' ? 6 : 2 + (i % 3);
  const timeline: ReturnRecord['timeline'] = [];
  for (let t = 0; t < targetLen; t++) {
    timeline.push({
      time: requestedAt.add(t * 0.6, 'day').toISOString(),
      status: statuses[t],
      note: t === 0 ? '用户提交退货申请' : t === 1 ? '客服审核中' : t === 2 ? '审核通过，请寄回商品' : t === 3 ? '商品已发出，等待签收' : t === 4 ? '检测中，预计24小时内完成' : '退款已完成',
    });
  }
  const refundAmount = o.finalPrice || o.quotePrice;
  returnRecords.push({
    id: `ret_${String(i + 1).padStart(5, '0')}`,
    orderId: o.id,
    status: statuses[targetLen - 1],
    reason: pick(
      ['检测结果与预期不符，成色评估偏差', '收到后发现功能异常', '对比后价格不满意', '家人不同意出售', '临时改变主意'],
      i + 4,
    ),
    timeline,
    estimatedRefundDate: requestedAt.add(7, 'day').format('YYYY-MM-DD'),
    refundAmount,
    logistics: targetLen >= 3
      ? {
          company: pick(['顺丰速运', '京东物流', '德邦快递'], i),
          trackingNo: 'SF' + faker.string.numeric(12),
          updatedAt: requestedAt.add(2, 'day').toISOString(),
        }
      : undefined,
  });
});

export function getReturnsByUser(userId: string): ReturnRecord[] {
  const userOrderIds = new Set(orders.filter((o) => o.userId === userId).map((o) => o.id));
  return returnRecords.filter((r) => userOrderIds.has(r.orderId));
}

export default orders;
