export interface ShippingRule {
  id: string;
  name: string;
  type: "standard" | "express" | "ems" | "sf";
  typeName: string;
  description: string;
  basePrice: number;
  freeShippingThreshold: number;
  estimatedDays: [number, number];
  regions: string[];
  icon: string;
}

export interface FreeShippingPromotion {
  active: boolean;
  threshold: number;
  description: string;
}

export const freeShippingPromotion: FreeShippingPromotion = {
  active: true,
  threshold: 99,
  description: "全场满99元包邮",
};

export const shippingRules: ShippingRule[] = [
  {
    id: "ship-001",
    name: "标准快递",
    type: "standard",
    typeName: "标准快递",
    description: "中通/圆通/韵达等快递，配送时效稳定",
    basePrice: 8,
    freeShippingThreshold: 99,
    estimatedDays: [3, 5],
    regions: ["全国大部分地区"],
    icon: "📦",
  },
  {
    id: "ship-002",
    name: "顺丰速运",
    type: "sf",
    typeName: "顺丰速运",
    description: "顺丰快递，速度快，服务好，贵重物品推荐",
    basePrice: 15,
    freeShippingThreshold: 199,
    estimatedDays: [1, 3],
    regions: ["全国大部分地区"],
    icon: "🚀",
  },
  {
    id: "ship-003",
    name: "EMS经济快递",
    type: "ems",
    typeName: "EMS经济快递",
    description: "邮政EMS，覆盖全国，偏远地区可达",
    basePrice: 12,
    freeShippingThreshold: 149,
    estimatedDays: [4, 7],
    regions: ["全国", "偏远地区"],
    icon: "📮",
  },
  {
    id: "ship-004",
    name: "加急特快",
    type: "express",
    typeName: "加急特快",
    description: "加急生产+顺丰空运，最快48小时送达",
    basePrice: 30,
    freeShippingThreshold: 0,
    estimatedDays: [1, 2],
    regions: ["一二线城市"],
    icon: "⚡",
  },
];
