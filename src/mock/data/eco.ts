// 环保碳减排 Mock 数据

import dayjs from 'dayjs';
import type { EcoMetrics, EcoCertificate } from '@/types';
import { orders, returnRecords } from './orders';
import { categories, brands, productModels } from './products';

export const CARBON_COEFFICIENTS: Record<string, number> = {
  手机: 85,
  相机: 150,
  手表: 120,
  包包: 95,
  珠宝: 65,
  笔记本: 220,
};

export const WATER_COEFFICIENTS: Record<string, number> = {
  手机: 12000,
  相机: 8500,
  手表: 3200,
  包包: 5600,
  珠宝: 1800,
  笔记本: 18500,
};

export const MATERIAL_COEFFICIENTS: Record<string, number> = {
  手机: 62,
  相机: 240,
  手表: 85,
  包包: 38,
  珠宝: 12,
  笔记本: 110,
};

export function lookupCategoryName(modelId: string): string {
  const m = productModels.find((x) => x.id === modelId);
  if (!m) return '手机';
  const b = brands.find((x) => x.id === m.brandId);
  if (!b) return '手机';
  const c = categories.find((x) => x.id === b.categoryId);
  return c ? c.name : '手机';
}

export function calcCarbon(category: string, units = 1): number {
  return Math.round((CARBON_COEFFICIENTS[category] || 80) * units);
}

export function calcWater(category: string, units = 1): number {
  return Math.round((WATER_COEFFICIENTS[category] || 5000) * units);
}

export function calcMaterial(category: string, units = 1): number {
  return Math.round((MATERIAL_COEFFICIENTS[category] || 50) * units);
}

const MONTHS = 8;
export const ecoMetrics: EcoMetrics = (() => {
  const trend: EcoMetrics['trend'] = [];
  let totalUnits = 0;
  let totalCarbon = 0;
  let totalWater = 0;
  let totalMaterial = 0;
  for (let i = MONTHS - 1; i >= 0; i--) {
    const d = dayjs().subtract(i, 'month');
    const units = 180 + Math.round(Math.sin(i * 0.9) * 60 + i * 8 + (i % 3) * 25);
    const cats = ['手机', '相机', '手表', '包包', '珠宝'];
    let carbon = 0;
    for (let k = 0; k < units; k++) {
      const c = cats[(i * 7 + k * 3) % cats.length];
      carbon += calcCarbon(c, 1);
    }
    carbon = Math.round(carbon * 0.18);
    trend.push({
      month: d.format('YYYY-MM'),
      units,
      carbonKg: carbon,
    });
    totalUnits += units;
    totalCarbon += carbon;
    totalWater += Math.round(carbon * 92);
    totalMaterial += Math.round(carbon * 0.62);
  }
  const last = trend[trend.length - 1];
  return {
    totalRecycledUnits: totalUnits,
    totalCarbonSavedKg: totalCarbon,
    totalWaterSavedL: totalWater,
    totalMaterialSavedKg: totalMaterial,
    thisMonthUnits: last.units,
    thisMonthCarbonKg: last.carbonKg,
    trend,
  };
})();

export const ecoCertificates: EcoCertificate[] = [];
const candidateOrders = orders.filter(
  (o) => o.status === 'completed' || o.status === 'paid',
);
candidateOrders.forEach((o, i) => {
  if (i >= 8) return;
  const cat = lookupCategoryName(o.modelId);
  const m = productModels.find((x) => x.id === o.modelId)!;
  const b = brands.find((x) => x.id === m.brandId)!;
  const c = calcCarbon(cat, 1);
  const w = calcWater(cat, 1);
  const mt = calcMaterial(cat, 1);
  ecoCertificates.push({
    id: `ec_${String(i + 1).padStart(4, '0')}`,
    orderId: o.id,
    userId: o.userId,
    category: cat,
    productName: `${b.name} ${m.name}`,
    carbonSavedKg: c,
    waterSavedL: w,
    materialSavedKg: mt,
    issuedAt: dayjs(o.paidAt || o.createdAt).add(1, 'day').toISOString(),
    certNo: `ECO${dayjs(o.createdAt).format('YYYYMMDD')}${String(10000 + i * 137).slice(0, 6)}`,
    qrCode: `https://eco.example.com/cert/${o.id}?t=${Date.now()}`,
  });
});

export function getCertificatesByUser(userId: string): EcoCertificate[] {
  return ecoCertificates.filter((c) => c.userId === userId);
}

export default {
  CARBON_COEFFICIENTS,
  ecoMetrics,
  ecoCertificates,
  calcCarbon,
  getCertificatesByUser,
};
