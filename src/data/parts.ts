import type { PartItem, LaborRate } from '@/types';

export const parts: PartItem[] = [
  { id: 'p001', name: '空调压缩机 1.5匹', price: 850, unit: '台', category: 'aircon' },
  { id: 'p002', name: '空调电容 35μF', price: 65, unit: '个', category: 'aircon' },
  { id: 'p003', name: '空调遥控器', price: 45, unit: '个', category: 'aircon' },
  { id: 'p004', name: '制冷剂 R32', price: 120, unit: 'kg', category: 'aircon' },
  { id: 'p005', name: '空调安装支架', price: 80, unit: '副', category: 'aircon' },
  { id: 'p006', name: '空调铜管 1米', price: 90, unit: '米', category: 'aircon' },
  { id: 'p007', name: '五孔插座 86型', price: 25, unit: '个', category: 'electric' },
  { id: 'p008', name: '单控开关 86型', price: 18, unit: '个', category: 'electric' },
  { id: 'p009', name: '空开断路器 2P 32A', price: 55, unit: '个', category: 'electric' },
  { id: 'p010', name: '漏电保护器 2P 40A', price: 85, unit: '个', category: 'electric' },
  { id: 'p011', name: 'BV铜线 2.5平方 1米', price: 8, unit: '米', category: 'electric' },
  { id: 'p012', name: 'BV铜线 4平方 1米', price: 12, unit: '米', category: 'electric' },
  { id: 'p013', name: 'LED灯泡 E27 12W', price: 15, unit: '只', category: 'electric' },
  { id: 'p014', name: 'PPR水管 20mm 1米', price: 12, unit: '米', category: 'plumbing' },
  { id: 'p015', name: '水龙头 冷热铜质', price: 180, unit: '个', category: 'plumbing' },
  { id: 'p016', name: '淋浴混水阀', price: 260, unit: '个', category: 'plumbing' },
  { id: 'p017', name: '马桶进水阀', price: 45, unit: '个', category: 'plumbing' },
  { id: 'p018', name: '马桶排水阀', price: 35, unit: '个', category: 'plumbing' },
  { id: 'p019', name: '下水道疏通剂', price: 25, unit: '瓶', category: 'plumbing' },
  { id: 'p020', name: '电热管 2000W', price: 75, unit: '根', category: 'water_heater' },
  { id: 'p021', name: '温控器', price: 55, unit: '个', category: 'water_heater' },
  { id: 'p022', name: '镁棒', price: 40, unit: '根', category: 'water_heater' },
  { id: 'p023', name: '门锁芯 C级', price: 180, unit: '个', category: 'door_lock' },
  { id: 'p024', name: '智能门锁 基础款', price: 1200, unit: '台', category: 'door_lock' },
  { id: 'p025', name: 'PVC穿线管 1米', price: 3, unit: '米', category: 'renovation' },
  { id: 'p026', name: '暗盒 86型', price: 2, unit: '个', category: 'renovation' },
  { id: 'p027', name: '生料带', price: 5, unit: '卷', category: 'plumbing' },
  { id: 'p028', name: '密封胶 中性玻璃胶', price: 18, unit: '支', category: 'renovation' },
];

export const laborRates: LaborRate[] = [
  {
    city: '上海',
    baseRate: 80,
    tierRates: [
      { tier: '基础工时', multiplier: 1.0 },
      { tier: '复杂工时', multiplier: 1.5 },
      { tier: '紧急工时', multiplier: 2.0 },
      { tier: '夜间工时', multiplier: 2.5 },
    ],
  },
  {
    city: '北京',
    baseRate: 85,
    tierRates: [
      { tier: '基础工时', multiplier: 1.0 },
      { tier: '复杂工时', multiplier: 1.5 },
      { tier: '紧急工时', multiplier: 2.0 },
      { tier: '夜间工时', multiplier: 2.5 },
    ],
  },
  {
    city: '广州',
    baseRate: 70,
    tierRates: [
      { tier: '基础工时', multiplier: 1.0 },
      { tier: '复杂工时', multiplier: 1.5 },
      { tier: '紧急工时', multiplier: 2.0 },
      { tier: '夜间工时', multiplier: 2.5 },
    ],
  },
  {
    city: '深圳',
    baseRate: 75,
    tierRates: [
      { tier: '基础工时', multiplier: 1.0 },
      { tier: '复杂工时', multiplier: 1.5 },
      { tier: '紧急工时', multiplier: 2.0 },
      { tier: '夜间工时', multiplier: 2.5 },
    ],
  },
  {
    city: '杭州',
    baseRate: 65,
    tierRates: [
      { tier: '基础工时', multiplier: 1.0 },
      { tier: '复杂工时', multiplier: 1.5 },
      { tier: '紧急工时', multiplier: 2.0 },
      { tier: '夜间工时', multiplier: 2.5 },
    ],
  },
];

export function getPartsByCategory(category: string): PartItem[] {
  return parts.filter(p => p.category === category);
}

export function getLaborRateByCity(city: string): LaborRate | undefined {
  return laborRates.find(r => r.city === city);
}
