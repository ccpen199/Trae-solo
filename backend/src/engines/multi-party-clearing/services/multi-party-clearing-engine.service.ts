import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SettlementDto, SettlementResult, ClearingParty, ToleranceCheckResult } from '../dto/multi-party-clearing.dto';
import { OrderStatus, SettlementStatus, LogAction, Role } from '../../common/enums';
import { AuditService } from '../../modules/audit/services/audit.service';

interface TaxRule {
  productCategory?: string;
  buyerType?: string;
  taxRate: number;
  isInputTaxDeductible: boolean;
}

@Injectable()
export class MultiPartyClearingEngine {
  private defaultTaxRules: TaxRule[] = [
    { productCategory: '蔬菜', taxRate: 0.09, isInputTaxDeductible: true },
    { productCategory: '水果', taxRate: 0.09, isInputTaxDeductible: true },
    { productCategory: '肉类', taxRate: 0.09, isInputTaxDeductible: true },
    { productCategory: '水产', taxRate: 0.09, isInputTaxDeductible: true },
    { productCategory: '粮油', taxRate: 0.09, isInputTaxDeductible: true },
  ];

  private platformFeeRate = 0.02;

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async checkWeightTolerance(orderId: string): Promise<ToleranceCheckResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    const expectedWeight = order.expectedWeight.toNumber();
    const actualWeight = (order.actualWeight || order.expectedWeight).toNumber();
    const toleranceRate = order.toleranceRate.toNumber();

    const weightDifference = actualWeight - expectedWeight;
    const weightDifferenceRate = Math.abs(weightDifference) / expectedWeight;
    const isWithinTolerance = weightDifferenceRate <= toleranceRate;

    let suggestedAction: 'REFUND' | 'SUPPLEMENT' | 'NONE' = 'NONE';
    let refundAmount: number | undefined;

    if (!isWithinTolerance) {
      if (actualWeight < expectedWeight) {
        const price = (order.actualPrice || order.expectedPrice).toNumber();
        refundAmount = (expectedWeight - actualWeight) * price;
        suggestedAction = 'REFUND';
      } else {
        suggestedAction = 'SUPPLEMENT';
      }
    }

    return {
      orderId,
      expectedWeight,
      actualWeight,
      weightDifference,
      weightDifferenceRate,
      toleranceRate,
      isWithinTolerance,
      suggestedAction,
      refundAmount,
    };
  }

  async getTaxRate(productCategory: string, buyerType?: string): Promise<number> {
    const rule = this.defaultTaxRules.find(r => 
      r.productCategory === productCategory
    );

    return rule?.taxRate || 0.09;
  }

  async calculateClearing(
    orderId: string
  ): Promise<{
    totalAmount: number;
    taxAmount: number;
    netAmount: number;
    clearingParties: ClearingParty[];
  }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        subOrders: {
          include: {
            farmer: true,
          },
        },
        buyer: true,
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    const totalAmount = (order.actualAmount || order.expectedAmount).toNumber();
    const taxRate = await this.getTaxRate(order.productCategory);
    const taxAmount = totalAmount * taxRate;
    const netAmount = totalAmount - taxAmount;

    const clearingParties: ClearingParty[] = [];

    const platformFee = totalAmount * this.platformFeeRate;
    clearingParties.push({
      partyType: 'PLATFORM',
      amount: platformFee,
    });

    for (const subOrder of order.subOrders) {
      const subOrderAmount = (subOrder.actualAmount || subOrder.expectedAmount).toNumber();
      const farmerShare = subOrderAmount * (1 - this.platformFeeRate);
      
      clearingParties.push({
        partyType: 'FARMER',
        partyId: subOrder.farmerId,
        partyName: subOrder.farmer.realName,
        amount: farmerShare,
      });
    }

    if (taxAmount > 0) {
      clearingParties.push({
        partyType: 'TAX',
        amount: taxAmount,
        taxAmount,
        taxRate,
      });
    }

    return {
      totalAmount,
      taxAmount,
      netAmount,
      clearingParties,
    };
  }

  async executeSettlement(
    dto: SettlementDto,
    operatorId: string,
    operatorName: string,
    operatorRole: string
  ): Promise<SettlementResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        subOrders: {
          include: {
            farmer: true,
          },
        },
        buyer: true,
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.QUALITY_CHECKED) {
      throw new BadRequestException('订单状态不允许结算');
    }

    const settlementNo = await this.generateSettlementNo();
    const clearing = await this.calculateClearing(dto.orderId);

    return this.prisma.$transaction(async (prisma) => {
      const settlement = await prisma.settlement.create({
        data: {
          settlementNo,
          orderId: dto.orderId,
          type: 'FINAL_SETTLEMENT',
          status: SettlementStatus.COMPLETED,
          totalAmount: clearing.totalAmount,
          taxAmount: clearing.taxAmount,
          netAmount: clearing.netAmount,
          taxRate: clearing.clearingParties.find(p => p.partyType === 'TAX')?.taxRate || 0,
          payerId: order.buyerId,
          remark: dto.remark,
          settledAt: new Date(),
        },
      });

      const buyerAccount = await prisma.virtualAccount.findUnique({
        where: { userId: order.buyerId },
      });

      if (buyerAccount) {
        const prepaidAmount = order.prepaidAmount.toNumber();
        const totalPayable = clearing.totalAmount;
        const difference = totalPayable - prepaidAmount;

        if (difference > 0) {
          if (buyerAccount.balance.toNumber() < difference) {
            throw new BadRequestException('账户余额不足');
          }

          await prisma.virtualAccount.update({
            where: { id: buyerAccount.id },
            data: {
              balance: { decrement: difference },
              frozenAmount: { decrement: prepaidAmount },
            },
          });
        } else if (difference < 0) {
          await prisma.virtualAccount.update({
            where: { id: buyerAccount.id },
            data: {
              balance: { increment: Math.abs(difference) },
              frozenAmount: { decrement: prepaidAmount },
            },
          });
        } else {
          await prisma.virtualAccount.update({
            where: { id: buyerAccount.id },
            data: {
              frozenAmount: { decrement: prepaidAmount },
            },
          });
        }

        await prisma.accountTransaction.create({
          data: {
            accountId: buyerAccount.id,
            amount: -totalPayable,
            type: 'SETTLEMENT_PAYMENT',
            status: 'COMPLETED',
            referenceId: settlement.id,
            description: `订单 ${order.orderNo} 结算付款`,
          },
        });
      }

      for (const party of clearing.clearingParties) {
        if (party.partyType === 'FARMER' && party.partyId) {
          const farmerAccount = await prisma.virtualAccount.findUnique({
            where: { userId: party.partyId },
          });

          if (farmerAccount) {
            await prisma.virtualAccount.update({
              where: { id: farmerAccount.id },
              data: {
                balance: { increment: party.amount },
              },
            });

            await prisma.accountTransaction.create({
              data: {
                accountId: farmerAccount.id,
                amount: party.amount,
                type: 'SETTLEMENT_INCOME',
                status: 'COMPLETED',
                referenceId: settlement.id,
                description: `订单 ${order.orderNo} 结算收入`,
              },
            });
          }
        }
      }

      await prisma.order.update({
        where: { id: dto.orderId },
        data: {
          status: OrderStatus.SETTLED,
          settlementAmount: clearing.totalAmount,
          actualDeliveryDate: new Date(),
        },
      });

      await prisma.subOrder.updateMany({
        where: { mainOrderId: dto.orderId },
        data: { status: OrderStatus.SETTLED },
      });

      await this.auditService.createLog({
        entityType: 'Order',
        entityId: dto.orderId,
        action: LogAction.TRANSFER,
        operatorId,
        operatorName,
        operatorRole: operatorRole as any,
        oldValue: {
          status: order.status,
          prepaidAmount: order.prepaidAmount.toNumber(),
        },
        newValue: {
          status: OrderStatus.SETTLED,
          totalAmount: clearing.totalAmount,
          taxAmount: clearing.taxAmount,
          netAmount: clearing.netAmount,
        },
        changeSummary: `订单结算完成。总金额: ${clearing.totalAmount}, 税费: ${clearing.taxAmount}, 净额: ${clearing.netAmount}`,
        remark: dto.remark,
      });

      return {
        settlementNo,
        orderId: dto.orderId,
        totalAmount: clearing.totalAmount,
        taxAmount: clearing.taxAmount,
        netAmount: clearing.netAmount,
        clearingParties: clearing.clearingParties,
        status: SettlementStatus.COMPLETED,
        settledAt: new Date(),
      };
    });
  }

  private async generateSettlementNo(): Promise<string> {
    const date = new Date();
    const dateStr = date.getFullYear().toString() + 
                    (date.getMonth() + 1).toString().padStart(2, '0') +
                    date.getDate().toString().padStart(2, '0');
    
    const count = await this.prisma.settlement.count({
      where: {
        createdAt: {
          gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        },
      },
    });

    return `STL${dateStr}${(count + 1).toString().padStart(6, '0')}`;
  }

  async processOverdueOrder(orderId: string): Promise<{
    transferNo: string;
    orderId: string;
    storageId: string;
    status: string;
  }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('订单状态不适用逾期处理');
    }

    const storageUsers = await this.prisma.user.findMany({
      where: { role: Role.STORAGE, isActive: true },
      take: 1,
    });

    if (storageUsers.length === 0) {
      throw new BadRequestException('没有可用的收储机构');
    }

    const storageId = storageUsers[0].id;
    const transferNo = await this.generateTransferNo();

    return this.prisma.$transaction(async (prisma) => {
      const storageTransfer = await prisma.storageTransfer.create({
        data: {
          transferNo,
          orderId,
          storageId,
          status: 'PENDING',
          transferReason: 'OVERDUE_SETTLEMENT',
          transferredWeight: order.actualWeight || order.expectedWeight,
        },
      });

      await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.STORAGE_TRANSFERRED },
      });

      await this.auditService.createLog({
        entityType: 'Order',
        entityId: orderId,
        action: LogAction.TRANSFER,
        operatorId: 'system',
        operatorName: '系统',
        operatorRole: Role.OPERATOR,
        oldValue: { status: order.status },
        newValue: { status: OrderStatus.STORAGE_TRANSFERRED },
        changeSummary: `订单逾期未结算，货权转移至收储机构。转移单号: ${transferNo}`,
      });

      return {
        transferNo,
        orderId,
        storageId,
        status: 'PENDING',
      };
    });
  }

  private async generateTransferNo(): Promise<string> {
    const date = new Date();
    const dateStr = date.getFullYear().toString() + 
                    (date.getMonth() + 1).toString().padStart(2, '0') +
                    date.getDate().toString().padStart(2, '0');
    
    const count = await this.prisma.storageTransfer.count({
      where: {
        createdAt: {
          gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        },
      },
    });

    return `TRF${dateStr}${(count + 1).toString().padStart(6, '0')}`;
  }
}
