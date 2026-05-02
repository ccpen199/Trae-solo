import { TourGroupStatus, OrderStatus, AuditAction } from '../types/constants';
import prisma from '../lib/prisma';
import { JWTPayload } from '../types';
import { createAuditLog, getChangeSummary } from '../services/audit.service';

interface CreateGroupParams {
  tourId: string;
  startDate: Date;
  endDate: Date;
  price: number;
  childPrice?: number;
  totalStock: number;
  minGroupSize?: number;
  maxGroupSize?: number;
  departurePoint?: string;
  returnPoint?: string;
  meetingTime?: string;
  notes?: string;
  itinerary?: Array<{
    dayNumber: number;
    title: string;
    description?: string;
    breakfast?: string;
    lunch?: string;
    dinner?: string;
    hotel?: string;
    transport?: string;
    attractions?: string;
    notes?: string;
  }>;
}

interface UpdateStockParams {
  groupId: string;
  quantity: number;
}

export class InventoryEngine {
  async createGroup(user: JWTPayload, params: CreateGroupParams) {
    const {
      tourId,
      startDate,
      endDate,
      price,
      childPrice,
      totalStock,
      minGroupSize,
      maxGroupSize,
      departurePoint,
      returnPoint,
      meetingTime,
      notes,
      itinerary,
    } = params;

    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      throw new Error('线路不存在');
    }

    if (startDate >= endDate) {
      throw new Error('出发日期必须早于结束日期');
    }

    const code = await this.generateGroupCode();

    const group = await prisma.$transaction(async (tx) => {
      const newGroup = await tx.tourGroup.create({
        data: {
          tourId,
          code,
          startDate,
          endDate,
          price,
          childPrice: childPrice || tour.childPrice,
          totalStock,
          soldStock: 0,
          minGroupSize: minGroupSize || tour.minGroupSize,
          maxGroupSize: maxGroupSize || tour.maxGroupSize,
          status: TourGroupStatus.DRAFT,
          salesId: user.userId,
          departurePoint,
          returnPoint,
          meetingTime,
          notes,
        },
      });

      if (itinerary && itinerary.length > 0) {
        await tx.itineraryDay.createMany({
          data: itinerary.map((day) => ({
            groupId: newGroup.id,
            ...day,
          })),
        });
      }

      return newGroup;
    });

    await createAuditLog({
      user,
      action: AuditAction.CREATE,
      entityType: 'TourGroup',
      entityId: group.id,
      entityName: group.code,
      newValue: group,
    });

    return group;
  }

  async publishGroup(user: JWTPayload, groupId: string) {
    const group = await prisma.tourGroup.findUnique({
      where: { id: groupId },
      include: { tour: true },
    });

    if (!group) {
      throw new Error('团期不存在');
    }

    if (group.status !== TourGroupStatus.DRAFT) {
      throw new Error('只有草稿状态的团期可以发布');
    }

    const itineraryCount = await prisma.itineraryDay.count({
      where: { groupId },
    });

    if (itineraryCount < group.tour.days) {
      throw new Error(`行程天数不完整，需要 ${group.tour.days} 天行程`);
    }

    const oldValue = { ...group };

    const updatedGroup = await prisma.tourGroup.update({
      where: { id: groupId },
      data: { status: TourGroupStatus.PUBLISHED },
    });

    await createAuditLog({
      user,
      action: AuditAction.STATUS_CHANGE,
      entityType: 'TourGroup',
      entityId: groupId,
      entityName: group.code,
      oldValue,
      newValue: updatedGroup,
      changes: getChangeSummary(oldValue, updatedGroup),
    });

    return updatedGroup;
  }

  async checkStock(groupId: string, quantity: number): Promise<{ available: boolean; message?: string }> {
    const group = await prisma.tourGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return { available: false, message: '团期不存在' };
    }

    if (group.status !== TourGroupStatus.PUBLISHED) {
      return { available: false, message: '团期未发布' };
    }

    const availableStock = group.totalStock - group.soldStock;

    if (quantity > availableStock) {
      return { available: false, message: `库存不足，剩余 ${availableStock} 个名额` };
    }

    return { available: true };
  }

  async lockStock(user: JWTPayload, groupId: string, quantity: number): Promise<boolean> {
    const result = await this.checkStock(groupId, quantity);

    if (!result.available) {
      throw new Error(result.message);
    }

    const group = await prisma.tourGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new Error('团期不存在');
    }

    const newSoldStock = group.soldStock + quantity;
    const newStatus = newSoldStock >= group.totalStock
      ? TourGroupStatus.FULL
      : group.status;

    const oldValue = { ...group };

    const updatedGroup = await prisma.tourGroup.update({
      where: { id: groupId },
      data: {
        soldStock: newSoldStock,
        status: newStatus,
      },
    });

    await createAuditLog({
      user,
      action: AuditAction.UPDATE,
      entityType: 'TourGroup',
      entityId: groupId,
      entityName: group.code,
      oldValue,
      newValue: updatedGroup,
      changes: getChangeSummary(oldValue, updatedGroup),
    });

    return true;
  }

  async releaseStock(user: JWTPayload, groupId: string, quantity: number): Promise<boolean> {
    const group = await prisma.tourGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new Error('团期不存在');
    }

    const newSoldStock = Math.max(0, group.soldStock - quantity);
    const newStatus = group.status === TourGroupStatus.FULL && newSoldStock < group.totalStock
      ? TourGroupStatus.PUBLISHED
      : group.status;

    const oldValue = { ...group };

    const updatedGroup = await prisma.tourGroup.update({
      where: { id: groupId },
      data: {
        soldStock: newSoldStock,
        status: newStatus,
      },
    });

    await createAuditLog({
      user,
      action: AuditAction.UPDATE,
      entityType: 'TourGroup',
      entityId: groupId,
      entityName: group.code,
      oldValue,
      newValue: updatedGroup,
      changes: getChangeSummary(oldValue, updatedGroup),
    });

    return true;
  }

  async checkGroupConfirmation(groupId: string): Promise<{ confirmed: boolean; message?: string }> {
    const group = await prisma.tourGroup.findUnique({
      where: { id: groupId },
      include: {
        orders: {
          where: {
            status: { in: [OrderStatus.PAID, OrderStatus.CONFIRMED] },
          },
        },
      },
    });

    if (!group) {
      return { confirmed: false, message: '团期不存在' };
    }

    const confirmedPassengers = group.orders.reduce((sum, order) => {
      return sum + order.adultCount + order.childCount;
    }, 0);

    if (confirmedPassengers >= group.minGroupSize) {
      return { confirmed: true };
    }

    return {
      confirmed: false,
      message: `未达到成团条件，当前 ${confirmedPassengers} 人，最低 ${group.minGroupSize} 人`,
    };
  }

  private async generateGroupCode(): Promise<string> {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const code = `GRP${timestamp}${random}`;

    const existing = await prisma.tourGroup.findUnique({
      where: { code },
    });

    if (existing) {
      return this.generateGroupCode();
    }

    return code;
  }

  async getGroupInventoryStats(groupId: string) {
    const group = await prisma.tourGroup.findUnique({
      where: { id: groupId },
      include: {
        orders: {
          where: {
            status: { not: OrderStatus.CANCELLED },
          },
          select: {
            id: true,
            status: true,
            adultCount: true,
            childCount: true,
          },
        },
      },
    });

    if (!group) {
      throw new Error('团期不存在');
    }

    const totalBooked = group.orders.reduce((sum, order) => {
      if ([OrderStatus.PAID, OrderStatus.CONFIRMED, OrderStatus.PENDING_PAYMENT].includes(order.status)) {
        return sum + order.adultCount + order.childCount;
      }
      return sum;
    }, 0);

    const paidOrders = group.orders.filter((o) => o.status === OrderStatus.PAID || o.status === OrderStatus.CONFIRMED);
    const paidPassengers = paidOrders.reduce((sum, order) => sum + order.adultCount + order.childCount, 0);

    const confirmationStatus = await this.checkGroupConfirmation(groupId);

    return {
      groupId: group.id,
      groupCode: group.code,
      status: group.status,
      totalStock: group.totalStock,
      soldStock: group.soldStock,
      availableStock: group.totalStock - group.soldStock,
      totalBooked,
      paidPassengers,
      minGroupSize: group.minGroupSize,
      maxGroupSize: group.maxGroupSize,
      isConfirmed: confirmationStatus.confirmed,
      confirmationMessage: confirmationStatus.message,
    };
  }
}

export const inventoryEngine = new InventoryEngine();
