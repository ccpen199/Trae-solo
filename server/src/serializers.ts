import { Request } from 'express';

export function toClientDeviceType(type: string): string {
  const map: Record<string, string> = {
    washer: 'washing_machine',
    water_dispenser: 'water_purifier',
    shower: 'shower',
  };
  return map[type] || type;
}

export function toDbDeviceType(type: unknown): string | undefined {
  if (!type || typeof type !== 'string' || type === 'all') return undefined;
  const map: Record<string, string> = {
    washing_machine: 'washer',
    water_purifier: 'water_dispenser',
    shower: 'shower',
    washer: 'washer',
    water_dispenser: 'water_dispenser',
  };
  return map[type] || type;
}

export function toClientDeviceStatus(status: string): string {
  const map: Record<string, string> = {
    running: 'in_use',
    fault: 'maintenance',
  };
  return map[status] || status;
}

export function toDbDeviceStatus(status: unknown): string | undefined {
  if (!status || typeof status !== 'string' || status === 'all') return undefined;
  const map: Record<string, string> = {
    in_use: 'running',
    maintenance: 'fault',
  };
  return map[status] || status;
}

export function toClientOrderStatus(status: string): string {
  const map: Record<string, string> = {
    active: 'in_progress',
  };
  return map[status] || status;
}

export function toDbOrderStatus(status: unknown): string | undefined {
  if (!status || typeof status !== 'string' || status === 'all') return undefined;
  const map: Record<string, string> = {
    in_progress: 'active',
    paid: 'pending',
  };
  return map[status] || status;
}

export function toClientWorkOrderStatus(status: string): string {
  const map: Record<string, string> = {
    pending: 'open',
    assigned: 'open',
    processing: 'in_progress',
  };
  return map[status] || status;
}

export function toDbWorkOrderStatus(status: unknown): string | undefined {
  if (!status || typeof status !== 'string' || status === 'all') return undefined;
  const map: Record<string, string> = {
    open: 'pending',
    in_progress: 'processing',
  };
  return map[status] || status;
}

export function parsePage(req: Request): { page: number; pageSize: number } {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(req.query.pageSize) || 50));
  return { page, pageSize };
}

export function pageResult<T>(items: T[], page = 1, pageSize = items.length || 50, total = items.length) {
  return { items, total, page, pageSize };
}

export function serializeDevice(device: any) {
  const status = toClientDeviceStatus(device.status);
  return {
    ...device,
    type: toClientDeviceType(device.type),
    status,
    isOnline: Boolean(device.isOnline),
    qrCode: `device://${device.id}`,
    currentUser: status === 'in_use' ? '使用中用户' : undefined,
    estimatedEndTime: status === 'in_use' ? new Date(Date.now() + 20 * 60 * 1000).toISOString() : undefined,
    createdAt: device.createdAt || device.lastHeartbeat || new Date().toISOString(),
  };
}

export function serializeDeviceStatus(device: any) {
  const status = toClientDeviceStatus(device.status);
  return {
    deviceId: device.id,
    status,
    remainingMinutes: status === 'in_use' ? 20 : undefined,
    currentUser: status === 'in_use' ? '使用中用户' : undefined,
    lastHeartbeat: device.lastHeartbeat || new Date().toISOString(),
  };
}

export function serializeArea(area: any) {
  return {
    id: area.id,
    name: area.name,
    address: area.address || area.name,
    deviceCount: Number(area.deviceCount || 0),
    managerId: area.propertyManagerId || area.managerId || undefined,
    propertyManagerId: area.propertyManagerId || undefined,
    managerName: area.managerName,
    createdAt: area.createdAt || new Date().toISOString(),
  };
}

export function serializePackage(pkg: any) {
  return {
    id: pkg.id,
    name: pkg.name,
    description: pkg.description,
    price: Number(pkg.price || 0),
    durationMinutes: Number(pkg.durationMinutes ?? pkg.totalMinutes ?? 30),
    totalMinutes: Number(pkg.totalMinutes ?? pkg.durationMinutes ?? 30),
    type: toClientDeviceType(pkg.type || pkg.deviceType),
    deviceType: pkg.deviceType || toDbDeviceType(pkg.type),
    isActive: pkg.isActive == null ? true : Boolean(pkg.isActive),
    createdAt: pkg.createdAt || new Date().toISOString(),
  };
}

export function serializeOrder(order: any) {
  const createdAt = order.createdAt || order.startTime || order.endTime || new Date().toISOString();
  return {
    ...order,
    status: toClientOrderStatus(order.status),
    type: toClientDeviceType(order.type),
    packageId: order.packageId || order.type || 'standard',
    paymentMethod: order.paymentMethod || order.payMethod || 'balance',
    paidAt: order.status !== 'pending' ? createdAt : undefined,
    startedAt: order.startTime || undefined,
    finishedAt: order.endTime || undefined,
    createdAt,
  };
}

export function serializeReservation(reservation: any) {
  return {
    ...reservation,
    createdAt: reservation.createdAt || reservation.startTime || new Date().toISOString(),
  };
}

export function serializeWorkOrder(workOrder: any) {
  const status = toClientWorkOrderStatus(workOrder.status);
  const title = workOrder.title || workOrder.deviceName || '设备报修工单';
  return {
    ...workOrder,
    title,
    status,
    assigneeId: workOrder.handlerId || undefined,
    updatedAt: workOrder.resolvedAt || workOrder.createdAt || new Date().toISOString(),
  };
}

export function serializeCoupon(coupon: any) {
  return {
    ...coupon,
    discount: Number(coupon.discount ?? coupon.value ?? 0),
    isUsed: Boolean(coupon.isUsed),
  };
}
