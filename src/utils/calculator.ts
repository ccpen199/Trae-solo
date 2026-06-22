import dayjs from 'dayjs';
import html2canvas from 'html2canvas';
import type { Meter, Tier, MeterType, FeeItem } from '@/types';
import { uid } from '@/types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date, pattern = 'YYYY-MM-DD'): string {
  return dayjs(date).format(pattern);
}

export function formatDateTime(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

export function maskIdNo(idNo: string): string {
  if (!idNo || idNo.length < 8) return idNo;
  return idNo.slice(0, 4) + '********' + idNo.slice(-4);
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

export function relativeTime(date: string | Date): string {
  const now = dayjs();
  const target = dayjs(date);
  const diff = target.diff(now, 'day');
  if (diff === 0) return '今天';
  if (diff === 1) return '明天';
  if (diff === -1) return '昨天';
  if (diff > 0 && diff < 7) return `${diff}天后`;
  if (diff < 0 && diff > -7) return `${-diff}天前`;
  return formatDate(date);
}

export interface ReadingInput {
  meterId: string;
  reading: number;
  readDate: string;
}

export interface CalculatedUtilityResult {
  feeItems: FeeItem[];
  total: number;
  warnings: string[];
}

function calculateTieredUsage(usage: number, tiers: Tier[]): { amount: number; detail: string } {
  let remaining = usage;
  let totalAmount = 0;
  const parts: string[] = [];
  for (const tier of tiers) {
    if (remaining <= 0) break;
    const tierRange = tier.to ? tier.to - tier.from : Infinity;
    const usedInTier = Math.min(remaining, tierRange);
    if (usedInTier > 0) {
      const cost = usedInTier * tier.price;
      totalAmount += cost;
      const rangeStr = tier.to ? `${tier.from}-${tier.to}` : `${tier.from}+`;
      parts.push(`${usedInTier}×${tier.price}(${rangeStr})`);
    }
    remaining -= usedInTier;
  }
  return { amount: round2(totalAmount), detail: parts.join(' + ') };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateUtilityFee(
  meter: Meter,
  previousReading: number,
  currentReading: number,
  readDate: string
): { fee: FeeItem | null; warning: string | null } {
  const usage = currentReading - previousReading;
  const warnings: string[] = [];

  if (currentReading < previousReading) {
    return {
      fee: null,
      warning: `表号 ${meter.meterNo} 当前读数(${currentReading})小于上次读数(${previousReading})，请核对`,
    };
  }

  if (usage > 0 && usage / Math.max(previousReading, 1) > 2) {
    warnings.push(`表号 ${meter.meterNo} 本期用量(${usage})异常偏高，建议复核`);
  }

  if (usage === 0) {
    return { fee: null, warning: warnings[0] ?? null };
  }

  let amount: number;
  let calc = `${currentReading} - ${previousReading} = ${usage}`;

  if (meter.tieredPricing && meter.tieredPricing.length > 0) {
    const result = calculateTieredUsage(usage, meter.tieredPricing);
    amount = result.amount;
    calc += ` → ${result.detail}`;
  } else {
    amount = round2(usage * meter.unitPrice);
    calc += ` × ${meter.unitPrice}`;
  }
  calc += ` = ${amount}`;

  const typeMap: Record<MeterType, FeeItem['type']> = {
    water: 'water',
    electricity: 'electricity',
    gas: 'gas',
  };

  const unitMap: Record<MeterType, string> = {
    water: '吨',
    electricity: '度',
    gas: 'm³',
  };

  const nameMap: Record<MeterType, string> = {
    water: '水费',
    electricity: '电费',
    gas: '燃气费',
  };

  return {
    fee: {
      id: uid('fee_'),
      type: typeMap[meter.type],
      name: `${nameMap[meter.type]}(${readDate})`,
      amount,
      calculation: calc,
      meterId: meter.id,
      readingStart: previousReading,
      readingEnd: currentReading,
      usage,
    },
    warning: warnings[0] ?? null,
  };
}

export function batchCalculateUtilities(
  meters: Meter[],
  readings: ReadingInput[]
): CalculatedUtilityResult {
  const result: CalculatedUtilityResult = {
    feeItems: [],
    total: 0,
    warnings: [],
  };

  for (const reading of readings) {
    const meter = meters.find((m) => m.id === reading.meterId);
    if (!meter) continue;
    const { fee, warning } = calculateUtilityFee(
      meter,
      meter.lastReading,
      reading.reading,
      reading.readDate
    );
    if (warning) result.warnings.push(warning);
    if (fee) {
      result.feeItems.push(fee);
      result.total = round2(result.total + fee.amount);
    }
  }
  return result;
}

export async function exportDOMAsImage(
  element: HTMLElement,
  filename = `export_${Date.now()}.png`,
  scale = 2
): Promise<boolean> {
  try {
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch (e) {
    console.error('导出海报失败:', e);
    return false;
  }
}
