import type { OrderStatus, TempControl, LoadingDifficulty, VehicleType } from '@/types';

export const statusTextMap: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  PUBLISHED: { label: '待匹配', color: 'text-slate-300', bg: 'bg-slate-500/20' },
  MATCHING: { label: '匹配中', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  MATCHED: { label: '待接单', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  ACCEPTED: { label: '已接单', color: 'text-signal-cyan', bg: 'bg-cyan-500/10' },
  PICKING_UP: { label: '取货中', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  IN_TRANSIT: { label: '配送中', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  PARTIAL_DELIVERED: { label: '部分送达', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  DELIVERED: { label: '已送达', color: 'text-signal-green', bg: 'bg-emerald-500/20' },
  FULFILLMENT_CHECKING: { label: '履约校验', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  COMPLETED: { label: '已完成', color: 'text-signal-green', bg: 'bg-emerald-500/20' },
  EXCEPTION: { label: '异常', color: 'text-signal-red', bg: 'bg-red-500/20' },
  CANCELLED: { label: '已取消', color: 'text-slate-400', bg: 'bg-slate-500/20' },
};

export const tempControlMap: Record<TempControl, { label: string; icon: string; color: string }> = {
  NORMAL: { label: '常温', icon: '🌡️', color: 'text-slate-300' },
  REFRIGERATED: { label: '冷藏 -18℃', icon: '❄️', color: 'text-blue-400' },
  FRESH: { label: '保鲜 2-8℃', icon: '🥬', color: 'text-emerald-400' },
  DEEP_FREEZE: { label: '深冷 -30℃', icon: '🧊', color: 'text-cyan-400' },
};

export const difficultyMap: Record<LoadingDifficulty, { label: string; color: string }> = {
  LOW: { label: '低', color: 'text-signal-green' },
  MEDIUM: { label: '中', color: 'text-signal-yellow' },
  HIGH: { label: '高', color: 'text-signal-red' },
};

export const vehicleTypeMap: Record<VehicleType, { label: string; icon: string }> = {
  VAN: { label: '面包车', icon: '🚐' },
  TRUCK_4M: { label: '4.2米厢货', icon: '🚚' },
  TRUCK_6M: { label: '6.8米厢货', icon: '🚛' },
  TRUCK_9M: { label: '9.6米重卡', icon: '🚚' },
  REEFER: { label: '冷藏车', icon: '❄️' },
};

export function formatMoney(value: number): string {
  return `¥${value.toFixed(2)}`;
}

export function formatWeight(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)}吨`;
  return `${kg}kg`;
}

export function formatVolume(v: number): string {
  return `${v}m³`;
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '--';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatTime(iso?: string): string {
  if (!iso) return '--';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function minutesAgo(iso?: string): string {
  if (!iso) return '--';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return '刚刚';
  if (diff < 60) return `${diff}分钟前`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h}小时前`;
  const d = Math.floor(h / 24);
  return `${d}天前`;
}

export function genOrderNo(): string {
  const d = new Date();
  const pad = (n: number, l = 2) => String(n).padStart(l, '0');
  const r = Math.floor(Math.random() * 9000 + 1000);
  return `HY${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${r}`;
}

export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
