import { cn } from '@/lib/utils';
import {
  DEVICE_STATUS_MAP, P2P_STATUS_MAP, ALERT_LEVEL_MAP,
  ALERT_STATUS_MAP, ROLE_MAP, ORG_TYPE_MAP, STORAGE_TYPE_MAP,
  FIRMWARE_STATUS_MAP
} from '@/types';
import type { DeviceStatus, AlertLevel, AlertStatus, UserRole, OrgType, StorageType, FirmwareTaskStatus } from '@/types';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function DeviceStatusBadge({ status, className }: StatusBadgeProps) {
  const s = status as DeviceStatus;
  const colorMap = {
    online: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    offline: 'bg-red-500/15 text-red-400 border-red-500/30',
    maintenance: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  } as const;
  return (
    <span className={cn("vms-badge border", colorMap[s] || colorMap.offline, className)}>
      <span className={cn("vms-status-dot mr-1.5", s === 'online' ? 'bg-emerald-400' : s === 'maintenance' ? 'bg-amber-400' : 'bg-red-400')}></span>
      {DEVICE_STATUS_MAP[s] || status}
    </span>
  );
}

export function P2PStatusBadge({ status, className }: StatusBadgeProps) {
  const s = status as 'connected' | 'disconnected' | 'relay' | 'negotiating';
  const colorMap = {
    connected: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    disconnected: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    relay: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    negotiating: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  } as const;
  return (
    <span className={cn("vms-badge border", colorMap[s] || colorMap.disconnected, className)}>
      <span className={cn("vms-status-dot mr-1.5", {
        'bg-emerald-400': s === 'connected',
        'bg-gray-400': s === 'disconnected',
        'bg-amber-400': s === 'relay',
        'bg-blue-400': s === 'negotiating',
      })}></span>
      {P2P_STATUS_MAP[s] || status}
    </span>
  );
}

export function AlertLevelBadge({ status, className }: StatusBadgeProps) {
  const s = status as AlertLevel;
  const colorMap = {
    critical: 'bg-red-500/15 text-red-400 border-red-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    info: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  } as const;
  return (
    <span className={cn("vms-badge border", colorMap[s] || colorMap.info, className)}>
      {ALERT_LEVEL_MAP[s] || status}
    </span>
  );
}

export function AlertStatusBadge({ status, className }: StatusBadgeProps) {
  const s = status as AlertStatus;
  const colorMap = {
    pending: 'bg-red-500/15 text-red-400 border-red-500/30',
    acknowledged: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    ignored: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    escalated: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  } as const;
  return (
    <span className={cn("vms-badge border", colorMap[s] || colorMap.pending, className)}>
      {ALERT_STATUS_MAP[s] || status}
    </span>
  );
}

export function RoleBadge({ status, className }: StatusBadgeProps) {
  const s = status as UserRole;
  const colorMap = {
    admin: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    viewer: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    guest: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  } as const;
  return (
    <span className={cn("vms-badge border", colorMap[s] || colorMap.guest, className)}>
      {ROLE_MAP[s] || status}
    </span>
  );
}

export function OrgTypeBadge({ status, className }: StatusBadgeProps) {
  const s = status as OrgType;
  const colorMap = {
    enterprise: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    store: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    warehouse: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  } as const;
  return (
    <span className={cn("vms-badge border", colorMap[s] || colorMap.store, className)}>
      {ORG_TYPE_MAP[s] || status}
    </span>
  );
}

export function StorageTypeBadge({ status, className }: StatusBadgeProps) {
  const s = status as StorageType;
  const colorMap = {
    cloud: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    edge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  } as const;
  return (
    <span className={cn("vms-badge border", colorMap[s] || colorMap.cloud, className)}>
      {STORAGE_TYPE_MAP[s] || status}
    </span>
  );
}

export function FirmwareStatusBadge({ status, className }: StatusBadgeProps) {
  const s = status as FirmwareTaskStatus;
  const colorMap = {
    pending: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    running: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    failed: 'bg-red-500/15 text-red-400 border-red-500/30',
    cancelled: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  } as const;
  return (
    <span className={cn("vms-badge border", colorMap[s] || colorMap.pending, className)}>
      {FIRMWARE_STATUS_MAP[s] || status}
    </span>
  );
}

export function ProtocolBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn("vms-badge border bg-vms-surface-2 border-vms-border text-vms-text font-mono text-xs", className)}>
      {status}
    </span>
  );
}

export function AiTagBadge({ tag, className }: { tag: string; className?: string }) {
  const map: Record<string, string> = {
    person: '人形',
    vehicle: '车辆',
    license_plate: '车牌',
  };
  const colors: Record<string, string> = {
    person: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
    vehicle: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    license_plate: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  };
  return (
    <span className={cn("vms-badge border", colors[tag] || 'bg-vms-surface-2 border-vms-border', className)}>
      {map[tag] || tag}
    </span>
  );
}
