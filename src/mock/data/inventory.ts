// 库存与周转 Mock 数据

import { faker } from '@faker-js/faker';
import type { InventoryOverview, ChannelProfit, SlowMovingItem, AgeDistribution } from '@/types';
import { productModels, brands } from './products';

export const inventoryOverview: InventoryOverview = {
  totalSKU: 328,
  totalUnits: 1265,
  totalValue: 38_560_000,
  turnoverDays: 38,
  last30dInflow: 312,
  last30dOutflow: 287,
};

export const channelProfits: ChannelProfit[] = [
  { channel: 'C端零售', units: 142, revenue: 6_280_000, cost: 5_360_000, profit: 920_000, margin: 14.6 } as any,
  { channel: 'B端同行', units: 86, revenue: 3_120_000, cost: 2_870_000, profit: 250_000, margin: 8.0 } as any,
  { channel: '寄售平台', units: 38, revenue: 1_580_000, cost: 1_320_000, profit: 260_000, margin: 16.5 } as any,
  { channel: '直播带货', units: 45, revenue: 1_820_000, cost: 1_480_000, profit: 340_000, margin: 18.7 } as any,
  { channel: '海外渠道', units: 16, revenue: 1_040_000, cost: 860_000, profit: 180_000, margin: 17.3 } as any,
];

export const slowMovingItems: SlowMovingItem[] = [];

for (let i = 0; i < 20; i++) {
  const m = productModels[(i * 5 + 12) % productModels.length];
  const b = brands.find((x) => x.id === m.brandId)!;
  const ageDays = 60 + i * 9 + faker.number.int({ min: 5, max: 60 });
  const cost = Math.round(m.basePrice * (0.92 + (i % 15) / 100));
  const actions = ['降价促销', '打包批发', '直播清仓', '同行调拨', '公益捐赠'];
  slowMovingItems.push({
    sku: `SKU${100000 + i * 37}`,
    productName: `${b.name} ${m.name}`,
    ageDays,
    cost,
    suggestedPrice: Math.round(cost * (ageDays > 120 ? 0.70 : ageDays > 90 ? 0.78 : 0.85)),
    suggestedAction: actions[i % actions.length],
  } as any);
}

export const ageDistributions: AgeDistribution[] = [
  { range: '0-30天', units: 486, value: 14_850_000 } as any,
  { range: '31-60天', units: 342, value: 10_420_000 } as any,
  { range: '61-90天', units: 218, value: 6_380_000 } as any,
  { range: '91-180天', units: 158, value: 4_820_000 } as any,
  { range: '180天以上', units: 61, value: 2_090_000 } as any,
];

export default {
  inventoryOverview,
  channelProfits,
  slowMovingItems,
  ageDistributions,
};
