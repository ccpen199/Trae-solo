import { SettlementStatus, AuditAction, OrderStatus, TourGroupStatus } from '../types/constants';
import prisma from '../lib/prisma';
import { JWTPayload } from '../types';
import { createAuditLog, getChangeSummary } from '../services/audit.service';
import { generateSettlementNo } from '../utils/auth';

interface SettlementCalculation {
  totalRevenue: number;
  totalCost: number;
  commission: number;
  profit: number;
  touristCount: number;
}

interface SettlementCostItem {
  category: string;
  description: string;
  amount: number;
  payee?: string;
  invoiceNo?: string;
  notes?: string;
}

interface SettlementResult {
  id: string;
  settlementNo: string;
  groupId: string;
  tourId: string | null;
  agencyId: string | null;
  totalRevenue: number;
  totalCost: number;
  commission: number;
  profit: number;
  touristCount: number;
  status: SettlementStatus;
  costItems: SettlementCostItem[];
}

export class SettlementEngine {
  private readonly COMMISSION_RATE = 0.1;

  async calculateSettlement(groupId: string): Promise<SettlementCalculation> {
    const group = await prisma.tourGroup.findUnique({
      where: { id: groupId },
      include: {
        tour: true,
        orders: {
          where: {
            status: {
              in: [OrderStatus.PAID, OrderStatus.CONFIRMED],
            },
            isArchived: false,
          },
          include: {
            passengers: true,
          },
        },
      },
    });

    if (!group) {
      throw new Error('团期不存在');
    }

    const totalRevenue = group.orders.reduce((sum, order) => {
      return sum + order.paidAmount.toNumber();
    }, 0);

    const touristCount = group.orders.reduce((sum, order) => {
      return sum + order.passengers.length;
    }, 0);

    const existingSettlement = await prisma.settlement.findUnique({
      where: { groupId },
      include: {
        costItems: true,
      },
    });

    let totalCost = 0;
    if (existingSettlement && existingSettlement.costItems) {
      totalCost = existingSettlement.costItems.reduce((sum, item) => {
        return sum + item.amount.toNumber();
      }, 0);
    } else {
      totalCost = this.estimateCost(group, touristCount);
    }

    const commission = totalRevenue * this.COMMISSION_RATE;
    const profit = totalRevenue - totalCost - commission;

    return {
      totalRevenue,
      totalCost,
      commission,
      profit,
      touristCount,
    };
  }

  private estimateCost(group: any, touristCount: number): number {
    const { tour, price } = group;

    const baseCostPerPerson = price.toNumber() * 0.6;
    const totalCost = baseCostPerPerson * touristCount;

    return totalCost;
  }

  async createSettlement(user: JWTPayload, groupId: string): Promise<SettlementResult> {
    const group = await prisma.tourGroup.findUnique({
      where: { id: groupId },
      include: {
        tour: true,
      },
    });

    if (!group) {
      throw new Error('团期不存在');
    }

    const existingSettlement = await prisma.settlement.findUnique({
      where: { groupId },
    });

    if (existingSettlement) {
      throw new Error('该团期已创建结算单');
    }

    const calculation = await this.calculateSettlement(groupId);
    const settlementNo = generateSettlementNo();

    const settlement = await prisma.$transaction(async (tx) => {
      const newSettlement = await tx.settlement.create({
        data: {
          settlementNo,
          groupId,
          tourId: group.tourId,
          agencyId: group.tour?.agencyId || null,
          totalRevenue: calculation.totalRevenue,
          totalCost: calculation.totalCost,
          commission: calculation.commission,
          profit: calculation.profit,
          touristCount: calculation.touristCount,
          status: SettlementStatus.PENDING,
        },
      });

      const defaultCosts: SettlementCostItem[] = [
        {
          category: '交通',
          description: '往返交通费用',
          amount: calculation.totalCost * 0.3,
          notes: '预估费用，待确认',
        },
        {
          category: '住宿',
          description: '酒店住宿费用',
          amount: calculation.totalCost * 0.25,
          notes: '预估费用，待确认',
        },
        {
          category: '餐饮',
          description: '团队用餐费用',
          amount: calculation.totalCost * 0.15,
          notes: '预估费用，待确认',
        },
        {
          category: '门票',
          description: '景点门票费用',
          amount: calculation.totalCost * 0.1,
          notes: '预估费用，待确认',
        },
        {
          category: '导游',
          description: '导游服务费用',
          amount: calculation.totalCost * 0.1,
          notes: '预估费用，待确认',
        },
        {
          category: '其他',
          description: '其他杂项费用',
          amount: calculation.totalCost * 0.1,
          notes: '预估费用，待确认',
        },
      ];

      for (const cost of defaultCosts) {
        await tx.settlementCost.create({
          data: {
            settlementId: newSettlement.id,
            ...cost,
          },
        });
      }

      return newSettlement;
    });

    await createAuditLog({
      user,
      action: AuditAction.CREATE,
      entityType: 'Settlement',
      entityId: settlement.id,
      entityName: settlement.settlementNo,
      newValue: {
        groupCode: group.code,
        totalRevenue: calculation.totalRevenue,
        totalCost: calculation.totalCost,
        commission: calculation.commission,
        profit: calculation.profit,
        touristCount: calculation.touristCount,
      },
    });

    return {
      id: settlement.id,
      settlementNo: settlement.settlementNo,
      groupId: settlement.groupId,
      tourId: settlement.tourId,
      agencyId: settlement.agencyId,
      totalRevenue: settlement.totalRevenue.toNumber(),
      totalCost: settlement.totalCost.toNumber(),
      commission: settlement.commission.toNumber(),
      profit: settlement.profit.toNumber(),
      touristCount: settlement.touristCount,
      status: settlement.status,
      costItems: [],
    };
  }

  async updateSettlementCosts(
    user: JWTPayload,
    settlementId: string,
    costItems: SettlementCostItem[]
  ): Promise<SettlementResult> {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        costItems: true,
      },
    });

    if (!settlement) {
      throw new Error('结算单不存在');
    }

    if (settlement.status === SettlementStatus.COMPLETED) {
      throw new Error('结算单已完成，无法修改');
    }

    const oldValue = {
      totalCost: settlement.totalCost.toNumber(),
      costItems: settlement.costItems.map((item) => ({
        category: item.category,
        amount: item.amount.toNumber(),
      })),
    };

    const totalCost = costItems.reduce((sum, item) => sum + item.amount, 0);
    const commission = settlement.totalRevenue.toNumber() * this.COMMISSION_RATE;
    const profit = settlement.totalRevenue.toNumber() - totalCost - commission;

    const updatedSettlement = await prisma.$transaction(async (tx) => {
      await tx.settlementCost.deleteMany({
        where: { settlementId },
      });

      for (const cost of costItems) {
        await tx.settlementCost.create({
          data: {
            settlementId,
            ...cost,
          },
        });
      }

      return tx.settlement.update({
        where: { id: settlementId },
        data: {
          totalCost,
          commission,
          profit,
        },
        include: {
          costItems: true,
        },
      });
    });

    await createAuditLog({
      user,
      action: AuditAction.UPDATE,
      entityType: 'Settlement',
      entityId: settlementId,
      entityName: settlement.settlementNo,
      oldValue,
      newValue: {
        totalCost,
        profit,
        costItems: costItems.map((item) => ({
          category: item.category,
          amount: item.amount,
        })),
      },
      changes: getChangeSummary(oldValue, { totalCost, costItems }),
    });

    return {
      id: updatedSettlement.id,
      settlementNo: updatedSettlement.settlementNo,
      groupId: updatedSettlement.groupId,
      tourId: updatedSettlement.tourId,
      agencyId: updatedSettlement.agencyId,
      totalRevenue: updatedSettlement.totalRevenue.toNumber(),
      totalCost: updatedSettlement.totalCost.toNumber(),
      commission: updatedSettlement.commission.toNumber(),
      profit: updatedSettlement.profit.toNumber(),
      touristCount: updatedSettlement.touristCount,
      status: updatedSettlement.status,
      costItems: updatedSettlement.costItems.map((item) => ({
        category: item.category,
        description: item.description,
        amount: item.amount.toNumber(),
        payee: item.payee || undefined,
        invoiceNo: item.invoiceNo || undefined,
        notes: item.notes || undefined,
      })),
    };
  }

  async completeSettlement(user: JWTPayload, settlementId: string): Promise<SettlementResult> {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        group: true,
        costItems: true,
      },
    });

    if (!settlement) {
      throw new Error('结算单不存在');
    }

    if (settlement.status === SettlementStatus.COMPLETED) {
      throw new Error('结算单已完成');
    }

    if (settlement.group && settlement.group.status !== TourGroupStatus.COMPLETED) {
      throw new Error('团期尚未完成，无法结算');
    }

    const oldValue = { status: settlement.status };

    const updatedSettlement = await prisma.settlement.update({
      where: { id: settlementId },
      data: {
        status: SettlementStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        costItems: true,
      },
    });

    await createAuditLog({
      user,
      action: AuditAction.SETTLEMENT,
      entityType: 'Settlement',
      entityId: settlementId,
      entityName: settlement.settlementNo,
      oldValue,
      newValue: { status: SettlementStatus.COMPLETED, completedAt: new Date() },
      changes: getChangeSummary(oldValue, { status: SettlementStatus.COMPLETED }),
    });

    return {
      id: updatedSettlement.id,
      settlementNo: updatedSettlement.settlementNo,
      groupId: updatedSettlement.groupId,
      tourId: updatedSettlement.tourId,
      agencyId: updatedSettlement.agencyId,
      totalRevenue: updatedSettlement.totalRevenue.toNumber(),
      totalCost: updatedSettlement.totalCost.toNumber(),
      commission: updatedSettlement.commission.toNumber(),
      profit: updatedSettlement.profit.toNumber(),
      touristCount: updatedSettlement.touristCount,
      status: updatedSettlement.status,
      costItems: updatedSettlement.costItems.map((item) => ({
        category: item.category,
        description: item.description,
        amount: item.amount.toNumber(),
        payee: item.payee || undefined,
        invoiceNo: item.invoiceNo || undefined,
        notes: item.notes || undefined,
      })),
    };
  }

  async getSettlementReport(settlementId: string): Promise<string> {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        group: {
          include: {
            tour: true,
          },
        },
        costItems: true,
      },
    });

    if (!settlement) {
      throw new Error('结算单不存在');
    }

    const { group, costItems } = settlement;

    const costItemsSummary = costItems.map((item, index) =>
      `${index + 1}. ${item.category} - ${item.description}: ${item.amount.toString()} 元`
    ).join('\n');

    return `
结算单

================================================================================

结算单编号：${settlement.settlementNo}
团期编号：${group?.code || 'N/A'}
线路名称：${group?.tour?.name || 'N/A'}
行程日期：${group ? `${group.startDate.toLocaleDateString()} 至 ${group.endDate.toLocaleDateString()}` : 'N/A'}
结算状态：${settlement.status === 'COMPLETED' ? '已完成' : '进行中'}
创建日期：${settlement.createdAt.toLocaleDateString()}
${settlement.completedAt ? `完成日期：${settlement.completedAt.toLocaleDateString()}` : ''}

================================================================================

一、收入明细
--------------------------------------------------------------------------------
总营收：${settlement.totalRevenue.toString()} 元
游客人数：${settlement.touristCount} 人

================================================================================

二、成本明细
--------------------------------------------------------------------------------
${costItemsSummary || '暂无成本记录'}

总成本：${settlement.totalCost.toString()} 元

================================================================================

三、费用与利润
--------------------------------------------------------------------------------
佣金 (10%)：${settlement.commission.toString()} 元
净利润：${settlement.profit.toString()} 元

================================================================================

四、结算说明
--------------------------------------------------------------------------------
1. 本结算单基于实际订单收入计算
2. 成本明细以实际发生费用为准
3. 佣金按总营收的10%计算
4. 净利润 = 总营收 - 总成本 - 佣金

================================================================================

旅行社财务部门
${new Date().toLocaleDateString()}
    `.trim();
  }

  async getBusinessStatistics(startDate?: Date, endDate?: Date) {
    const where: any = { isArchived: false };

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const tours = await prisma.tour.findMany({
      where: { ...where, status: 'PUBLISHED' },
      include: {
        groups: {
          include: {
            orders: {
              where: {
                status: { in: ['PAID', 'CONFIRMED'] },
                isArchived: false,
              },
            },
          },
        },
      },
    });

    let totalRevenue = 0;
    let totalOrders = 0;
    let totalTourists = 0;
    let totalGroups = 0;
    let confirmedGroups = 0;

    tours.forEach((tour) => {
      tour.groups.forEach((group) => {
        totalGroups++;

        const groupRevenue = group.orders.reduce((sum, order) => {
          return sum + order.paidAmount.toNumber();
        }, 0);

        totalRevenue += groupRevenue;
        totalOrders += group.orders.length;

        const groupTourists = group.orders.reduce((sum, order) => {
          return sum + order.adultCount + order.childCount;
        }, 0);
        totalTourists += groupTourists;

        if (groupTourists >= group.minGroupSize) {
          confirmedGroups++;
        }
      });
    });

    const confirmationRate = totalGroups > 0 ? (confirmedGroups / totalGroups) * 100 : 0;

    const topTours = tours
      .map((tour) => {
        const tourRevenue = tour.groups.reduce((sum, group) => {
          return sum + group.orders.reduce((s, order) => s + order.paidAmount.toNumber(), 0);
        }, 0);

        const tourOrders = tour.groups.reduce((sum, group) => sum + group.orders.length, 0);

        return {
          tourId: tour.id,
          tourCode: tour.code,
          tourName: tour.name,
          revenue: tourRevenue,
          orders: tourOrders,
          groups: tour.groups.length,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      totalRevenue,
      totalOrders,
      totalTourists,
      totalGroups,
      confirmedGroups,
      confirmationRate: confirmationRate.toFixed(2) + '%',
      topTours,
      period: startDate && endDate
        ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
        : '全部',
    };
  }
}

export const settlementEngine = new SettlementEngine();
