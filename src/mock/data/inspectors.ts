// 检测师档案 Mock 数据

import { faker } from '@faker-js/faker';
import type { Inspector, InspectorCertificate } from '@/types';

const CN_NAMES = [
  '张志远', '李婉清', '王建国', '陈思雨', '刘俊杰', '赵雅琴',
  '孙博文', '周晓峰', '吴美玲', '郑浩然', '冯雪梅', '何嘉豪',
];

const REGIONS = ['上海', '北京', '深圳', '上海', '北京', '深圳', '上海', '北京'];

const CATEGORY_NAMES = ['手机', '相机', '名表', '包包', '珠宝'];

const CERT_NAMES = [
  '中国旧货业协会高级鉴定师',
  '奢侈品鉴定师职业资格证',
  '钟表维修高级技师证',
  '国检珠宝培训中心NGTC证书',
  '中检集团奢侈品鉴定认证',
  '中国电子器材总公司检测师证',
  '日本JJA珠宝鉴定师资格',
  'GIA宝石学家文凭',
  'SWATCH集团维修技师认证',
  '劳服中心授权检测师',
];

const CERT_ISSUERS = [
  '中国旧货业协会',
  '中国奢侈品鉴定中心',
  '国家人力资源和社会保障部',
  '国检珠宝培训中心',
  '中国检验认证集团',
  '中国电子技术标准化研究院',
  '日本珠宝协会JJA',
  '美国宝石学院GIA',
  'SWATCH集团培训中心',
  '劳力士服务中心',
];

function genPhone(): string {
  const prefix = ['138', '139', '188', '186', '150', '158', '176', '177'];
  return prefix[faker.number.int({ min: 0, max: prefix.length - 1 })] +
    faker.string.numeric(8);
}

function genCert(seed: number): InspectorCertificate {
  const nameIdx = seed % CERT_NAMES.length;
  const issuerIdx = seed % CERT_ISSUERS.length;
  const issue = faker.date.between({ from: '2016-01-01', to: '2022-12-31' });
  const expire = new Date(issue);
  expire.setFullYear(expire.getFullYear() + faker.number.int({ min: 3, max: 6 }));
  return {
    name: CERT_NAMES[nameIdx],
    no: 'CERT' + faker.string.alphanumeric({ casing: 'upper', length: 12 }),
    issueDate: issue.toISOString().slice(0, 10),
    expireDate: expire.toISOString().slice(0, 10),
    issuer: CERT_ISSUERS[issuerIdx],
  };
}

function genSpecialties(seed: number): string[] {
  const pool = [...CATEGORY_NAMES];
  const count = faker.number.int({ min: 2, max: 3 });
  const result: string[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = (seed + i * 3) % pool.length;
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

const inspectorSeeds = [
  { avatar: '👨‍🔧', region: '上海', exp: 12, deviation: 1.2, orders: 1286, rating: 4.96, passRate: 0.98, certs: 5 },
  { avatar: '👩‍🔬', region: '北京', exp: 9, deviation: 2.1, orders: 847, rating: 4.92, passRate: 0.95, certs: 4 },
  { avatar: '🧔', region: '深圳', exp: 15, deviation: 1.8, orders: 1620, rating: 4.94, passRate: 0.97, certs: 5 },
  { avatar: '👩‍💼', region: '上海', exp: 7, deviation: 3.2, orders: 512, rating: 4.85, passRate: 0.90, certs: 3 },
  { avatar: '👨‍🎓', region: '北京', exp: 5, deviation: 4.2, orders: 286, rating: 4.78, passRate: 0.85, certs: 3 },
  { avatar: '👩‍🎨', region: '深圳', exp: 11, deviation: 2.5, orders: 968, rating: 4.90, passRate: 0.93, certs: 4 },
  { avatar: '🧑‍🔬', region: '上海', exp: 8, deviation: 2.8, orders: 653, rating: 4.87, passRate: 0.91, certs: 4 },
  { avatar: '👴', region: '北京', exp: 20, deviation: 1.5, orders: 2341, rating: 4.97, passRate: 0.99, certs: 5 },
];

export const inspectors: Inspector[] = inspectorSeeds.map((s, i) => ({
  id: `ins_${String(i + 1).padStart(3, '0')}`,
  name: CN_NAMES[i],
  avatar: s.avatar,
  phone: genPhone(),
  region: REGIONS[i],
  experienceYears: s.exp,
  specialties: genSpecialties(i * 7 + 3),
  deviationRate30d: s.deviation,
  totalOrders: s.orders,
  rating: s.rating,
  flyCheckPassRate: s.passRate,
  certificates: Array.from({ length: s.certs }, (_, c) => genCert(i * 100 + c * 17 + 5)),
}));

export function getInspectorById(id: string): Inspector | undefined {
  return inspectors.find((x) => x.id === id);
}

export function getInspectorDeviationTrend(id: string): { date: string; rate: number }[] {
  const result: { date: string; rate: number }[] = [];
  const insp = inspectors.find((x) => x.id === id);
  const base = insp ? insp.deviationRate30d : 2.5;
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const noise = (Math.sin(i * 0.8) + Math.cos(i * 1.3)) * 0.35 + (Math.random() - 0.5) * 0.3;
    result.push({
      date: d.toISOString().slice(0, 10),
      rate: Math.max(0.5, Math.min(5.5, +(base + noise).toFixed(2))),
    });
  }
  return result;
}

export default inspectors;
