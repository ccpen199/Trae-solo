import { prisma } from '../utils/prisma';
import {
  OrderType, OrderStatus, PaymentStatus,
  CourierTaskStatus, AlertType, AlertLevel,
} from '@platform/shared';
import type { Order } from '@prisma/client';
import { config } from '../config';
import { encrypt } from '../utils/encryption';
import { v4 as uuidv4 } from 'uuid';
import { maskName, maskPhone } from '@platform/shared';

let orderSeq = 1;
export function generateOrderNo(prefix: string, type: OrderType): string {
  const typeMap: Record<OrderType, string> = {
    [OrderType.HK_MACAO_VISA]: 'HKM',
    [OrderType.TAIWAN_VISA]: 'TWN',
    [OrderType.ID_CARD_REPLACEMENT]: 'IDC',
    [OrderType.VIOLATION_PAYMENT]: 'VIO',
    [OrderType.VEHICLE_INSPECTION]: 'INS',
  };
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seqStr = (orderSeq++).toString().padStart(6, '0');
  return `${prefix || 'GD'}${typeMap[type]}${dateStr}${seqStr}`;
}

export function getSlaDeadline(type: OrderType, city?: string): Date {
  const base = new Date();
  const hours = config.sla.visaProcessHours;
  if ([OrderType.HK_MACAO_VISA, OrderType.TAIWAN_VISA].includes(type)) {
    base.setHours(base.getHours() + hours);
  } else if (type === OrderType.ID_CARD_REPLACEMENT) {
    base.setDate(base.getDate() + 7);
  } else if (type === OrderType.VEHICLE_INSPECTION) {
    base.setDate(base.getDate() + 3);
  } else {
    base.setHours(base.getHours() + 24);
  }
  return base;
}

export async function createOrder(input: {
  applicantId: string;
  applicantCity: string;
  orderType: OrderType;
  pickupAddress: string;
  pickupContactName: string;
  pickupContactPhone: string;
  pickupLat?: number;
  pickupLon?: number;
  pickupAppointmentFrom?: Date;
  pickupAppointmentTo?: Date;
  deliveryAddress: string;
  deliveryContactName: string;
  deliveryContactPhone: string;
  serviceFee: number;
  governmentFee: number;
  courierFee: number;
}, traceId: string): Promise<Order> {
  const orderNo = generateOrderNo('GD', input.orderType);
  const totalAmount = input.serviceFee + input.governmentFee + input.courierFee;
  const slaDeadline = getSlaDeadline(input.orderType, input.applicantCity);

  const order = await prisma.order.create({
    data: {
      orderNo,
      orderType: input.orderType,
      status: OrderStatus.CREATED,
      applicantId: input.applicantId,
      applicantCity: input.applicantCity,
      serviceFee: input.serviceFee,
      governmentFee: input.governmentFee,
      courierFee: input.courierFee,
      totalAmount,
      paymentStatus: PaymentStatus.UNPAID,
      pickupAddressEncrypted: encrypt(input.pickupAddress),
      pickupAddressMasked: maskAddress(input.pickupAddress),
      pickupContactNameEncrypted: encrypt(input.pickupContactName),
      pickupContactPhoneEncrypted: encrypt(input.pickupContactPhone),
      pickupLat: input.pickupLat,
      pickupLon: input.pickupLon,
      pickupAppointmentFrom: input.pickupAppointmentFrom,
      pickupAppointmentTo: input.pickupAppointmentTo,
      deliveryAddressEncrypted: encrypt(input.deliveryAddress),
      deliveryAddressMasked: maskAddress(input.deliveryAddress),
      deliveryContactNameEncrypted: encrypt(input.deliveryContactName),
      deliveryContactPhoneEncrypted: encrypt(input.deliveryContactPhone),
      slaDeadline,
      statusLogs: {
        create: {
          toStatus: OrderStatus.CREATED,
          remark: '订单创建',
          extraData: { traceId },
        },
      },
    },
  });

  return order;
}

function maskAddress(addr: string): string {
  if (!addr || addr.length < 6) return addr;
  return addr.slice(0, 6) + '****' + addr.slice(-2);
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  operatorId?: string,
  remark?: string,
  extraData?: any,
): Promise<Order> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('订单不存在');

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: newStatus,
      statusLogs: {
        create: {
          fromStatus: order.status,
          toStatus: newStatus,
          operatorId,
          remark,
          extraData,
        },
      },
    },
  });
  return updated;
}

export async function assignCourier(orderId: string, city: string): Promise<{ taskId: string; courierId: string } | null> {
  const onDutyCouriers = await prisma.courierProfile.findMany({
    where: {
      serviceCity: city,
      isOnDuty: true,
      user: { isActive: true },
    },
    orderBy: { todayTaskCount: 'asc' },
    take: 5,
  });
  if (onDutyCouriers.length === 0) return null;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;

  const selected = onDutyCouriers[0];
  const taskId = uuidv4();
  const taskNo = `TASK${Date.now()}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  await prisma.$transaction([
    prisma.courierTask.create({
      data: {
        id: taskId,
        taskNo,
        orderId,
        courierId: selected.id,
        taskType: 'PICKUP',
        status: CourierTaskStatus.PENDING,
        pickupLat: order.pickupLat,
        pickupLon: order.pickupLon,
        distanceToPickupKm: order.pickupLat && selected.currentLat
          ? calculateDistance(selected.currentLat, selected.currentLon || 0, order.pickupLat, order.pickupLon || 0)
          : undefined,
      },
    }),
    prisma.courierProfile.update({
      where: { id: selected.id },
      data: { todayTaskCount: { increment: 1 } },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.COURIER_ASSIGNED },
    }),
  ]);

  return { taskId, courierId: selected.id };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
}

export async function createAlert(
  type: AlertType,
  level: AlertLevel,
  city: string,
  title: string,
  content: string,
  opts: { orderId?: string; userId?: string; metadata?: any } = {},
) {
  const alertNo = `ALERT${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  return prisma.alert.create({
    data: {
      alertNo,
      type,
      level,
      city,
      title,
      content,
      orderId: opts.orderId,
      userId: opts.userId,
      metadata: opts.metadata,
    },
  });
}

export function buildContactMasked(nameEncrypted?: string | null, phoneEncrypted?: string | null) {
  let name = '';
  let phone = '';
  try {
    if (nameEncrypted) name = maskName(require('../utils/encryption').decrypt(nameEncrypted));
    if (phoneEncrypted) phone = maskPhone(require('../utils/encryption').decrypt(phoneEncrypted));
  } catch {}
  return { name, phone };
}
