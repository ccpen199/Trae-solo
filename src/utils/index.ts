import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  if (price >= 100000000) {
    return (price / 100000000).toFixed(2) + '亿';
  }
  if (price >= 10000) {
    return (price / 10000).toFixed(0) + '万';
  }
  return price.toLocaleString();
}

export function formatPriceFull(price: number): string {
  return price.toLocaleString('zh-CN');
}

export function formatPricePerSqm(price: number, area: number): string {
  const perSqm = price / area;
  return (perSqm / 10000).toFixed(2) + '万/㎡';
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function getCountdown(targetDateStr: string): { days: number; hours: number; minutes: number; seconds: number; isEnded: boolean } {
  const target = new Date(targetDateStr).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isEnded: false };
}

export function getAuctionStatusLabel(status: string): string {
  const map: Record<string, string> = {
    'notice': '公告期',
    'due-diligence': '尽调期',
    'deposit': '保证金缴纳',
    'bidding': '竞价中',
    'ended': '已结束',
    'sold': '已成交',
  };
  return map[status] || status;
}

export function getAuctionStatusClass(status: string): string {
  const map: Record<string, string> = {
    'notice': 'tag-info',
    'due-diligence': 'tag-info',
    'deposit': 'tag-warning',
    'bidding': 'tag-danger bg-danger-100',
    'ended': 'tag',
    'sold': 'tag-success',
  };
  return map[status] || 'tag';
}

export function getRiskLevelLabel(level: string): string {
  const map: Record<string, string> = {
    'high': '高风险',
    'medium': '中风险',
    'low': '低风险',
  };
  return map[level] || level;
}

export function getRiskLevelClass(level: string): string {
  const map: Record<string, string> = {
    'high': 'text-danger-600 bg-danger-50',
    'medium': 'text-gold-700 bg-gold-50',
    'low': 'text-success-700 bg-success-50',
  };
  return map[level] || '';
}

export function calculateTax(price: number, area: number, isFirstHouse: boolean = true, propertyAge: number = 5): {
  deedTax: number;
  individualTax: number;
  valueAddedTax: number;
  stampTax: number;
  total: number;
  breakdown: { name: string; rate: string; amount: number; description: string }[];
} {
  let deedTaxRate = isFirstHouse ? (area <= 90 ? 0.01 : 0.015) : 0.03;
  let deedTax = price * deedTaxRate;

  let individualTax = propertyAge >= 5 ? 0 : price * 0.01;

  let valueAddedTax = propertyAge >= 2 ? 0 : price * 0.056;

  let stampTax = 5;

  const total = deedTax + individualTax + valueAddedTax + stampTax;

  const breakdown = [
    { name: '契税', rate: `${(deedTaxRate * 100).toFixed(1)}%`, amount: deedTax, description: isFirstHouse ? '首套房，按面积分档税率' : '非首套房，税率3%' },
    { name: '个人所得税', rate: propertyAge >= 5 ? '免征' : '1%', amount: individualTax, description: propertyAge >= 5 ? '满5年且唯一住房免征' : '按成交价1%征收' },
    { name: '增值税及附加', rate: propertyAge >= 2 ? '免征' : '5.6%', amount: valueAddedTax, description: propertyAge >= 2 ? '满2年免征' : '按成交价5.6%征收' },
    { name: '印花税', rate: '5元', amount: stampTax, description: '不动产权证印花税' },
  ];

  return { deedTax, individualTax, valueAddedTax, stampTax, total, breakdown };
}

export function calculateScore(property: any): {
  overall: number;
  dimensions: { name: string; score: number; maxScore: number }[];
} {
  const dimensions = [
    { name: '价格优势', score: 0, maxScore: 25 },
    { name: '地段区位', score: 0, maxScore: 20 },
    { name: '房屋品质', score: 0, maxScore: 20 },
    { name: '风险评估', score: 0, maxScore: 20 },
    { name: '市场热度', score: 0, maxScore: 15 },
  ];

  const discount = (1 - property.startingPrice / property.appraisalPrice) * 100;
  dimensions[0].score = Math.min(25, Math.max(5, discount * 0.5 + 10));

  const districtScores: Record<string, number> = {
    '浦东新区': 18,
    '徐汇区': 20,
    '静安区': 19,
    '长宁区': 18,
    '杨浦区': 14,
    '闵行区': 15,
  };
  dimensions[1].score = districtScores[property.district] || 15;

  const ageScore = property.buildingAge ? Math.max(8, 20 - property.buildingAge * 0.5) : 15;
  const areaScore = property.area > 100 ? 5 : 3;
  dimensions[2].score = Math.min(20, ageScore + areaScore);

  const riskScores: Record<string, number> = { 'low': 20, 'medium': 12, 'high': 5 };
  dimensions[3].score = riskScores[property.riskLevel] || 10;

  const heatScore = property.viewerCount ? Math.min(15, property.viewerCount / 200) : 8;
  dimensions[4].score = Math.round(heatScore);

  const overall = Math.round(dimensions.reduce((sum, d) => sum + d.score, 0));

  return { overall, dimensions };
}
