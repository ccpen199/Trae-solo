import { BillStatus, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

export interface BillItemData {
  itemType: string;
  description: string;
  quantity: number;
  unitPrice: number;
  operatorId?: string;
  operatorName?: string;
  remark?: string;
}

export interface PaymentData {
  paymentMethod: string;
  amount: number;
  transactionNo?: string;
  operatorId?: string;
  operatorName?: string;
  remark?: string;
}

class BillingEngine {
  async addBillItem(billId: string, item: BillItemData) {
    return prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findUnique({
        where: { id: billId },
        include: { items: true },
      });

      if (!bill) {
        return {
          success: false,
          error: '账单不存在',
        };
      }

      if (bill.status === BillStatus.SETTLED) {
        return {
          success: false,
          error: '账单已结算，无法添加项目',
        };
      }

      const amount = item.quantity * item.unitPrice;

      const billItem = await tx.billItem.create({
        data: {
          billId,
          itemType: item.itemType,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount,
          operatorId: item.operatorId,
          operatorName: item.operatorName,
          remark: item.remark,
        },
      });

      const newTotalAmount = parseFloat(bill.totalAmount.toString()) + amount;
      const newBalance = newTotalAmount - parseFloat(bill.paidAmount.toString());

      await tx.bill.update({
        where: { id: billId },
        data: {
          totalAmount: newTotalAmount,
          balance: newBalance,
          status: newBalance > 0 ? BillStatus.OPEN : BillStatus.PARTIAL_PAID,
        },
      });

      await this.logAudit({
        action: 'ADD_BILL_ITEM',
        module: 'Billing',
        targetType: 'BillItem',
        targetId: billItem.id,
        operatorId: item.operatorId,
        operatorName: item.operatorName,
        newValue: billItem,
      });

      return {
        success: true,
        billItem,
        totalAmount: newTotalAmount,
        balance: newBalance,
      };
    });
  }

  async processPayment(billId: string, payment: PaymentData) {
    return prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findUnique({
        where: { id: billId },
        include: { items: true, payments: true },
      });

      if (!bill) {
        return {
          success: false,
          error: '账单不存在',
        };
      }

      if (bill.status === BillStatus.SETTLED) {
        return {
          success: false,
          error: '账单已结算',
        };
      }

      const currentBalance = parseFloat(bill.balance.toString());

      if (payment.amount > currentBalance) {
        return {
          success: false,
          error: '支付金额不能大于账单余额',
        };
      }

      const paymentRecord = await tx.payment.create({
        data: {
          billId,
          paymentMethod: payment.paymentMethod,
          amount: payment.amount,
          transactionNo: payment.transactionNo,
          operatorId: payment.operatorId,
          operatorName: payment.operatorName,
          remark: payment.remark,
        },
      });

      const newPaidAmount = parseFloat(bill.paidAmount.toString()) + payment.amount;
      const newBalance = currentBalance - payment.amount;

      let newStatus = bill.status;
      if (newBalance === 0) {
        newStatus = BillStatus.SETTLED;
      } else if (newPaidAmount > 0) {
        newStatus = BillStatus.PARTIAL_PAID;
      }

      const updatedBill = await tx.bill.update({
        where: { id: billId },
        data: {
          paidAmount: newPaidAmount,
          balance: newBalance,
          status: newStatus,
          settleTime: newStatus === BillStatus.SETTLED ? new Date() : null,
        },
      });

      await this.logAudit({
        action: 'PROCESS_PAYMENT',
        module: 'Billing',
        targetType: 'Payment',
        targetId: paymentRecord.id,
        operatorId: payment.operatorId,
        operatorName: payment.operatorName,
        newValue: paymentRecord,
      });

      return {
        success: true,
        payment: paymentRecord,
        bill: updatedBill,
      };
    });
  }

  async applyDiscount(billId: string, discountAmount: number, operatorId?: string, operatorName?: string) {
    return prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findUnique({
        where: { id: billId },
      });

      if (!bill) {
        return {
          success: false,
          error: '账单不存在',
        };
      }

      if (bill.status === BillStatus.SETTLED) {
        return {
          success: false,
          error: '账单已结算',
        };
      }

      const currentTotal = parseFloat(bill.totalAmount.toString());
      const currentDiscount = parseFloat(bill.discountAmount.toString());

      if (discountAmount > currentTotal - currentDiscount) {
        return {
          success: false,
          error: '折扣金额不能大于账单金额',
        };
      }

      const newDiscountAmount = currentDiscount + discountAmount;
      const newTotalAfterDiscount = currentTotal - newDiscountAmount;
      const newBalance = newTotalAfterDiscount - parseFloat(bill.paidAmount.toString());

      const updatedBill = await tx.bill.update({
        where: { id: billId },
        data: {
          discountAmount: newDiscountAmount,
          balance: Math.max(0, newBalance),
          status: newBalance === 0 ? BillStatus.SETTLED : bill.status,
        },
      });

      await this.addBillItem(billId, {
        itemType: 'DISCOUNT',
        description: '账单折扣',
        quantity: 1,
        unitPrice: -discountAmount,
        operatorId,
        operatorName,
        remark: `折扣金额: ¥${discountAmount}`,
      });

      return {
        success: true,
        bill: updatedBill,
      };
    });
  }

  async settleBill(billId: string, payments: PaymentData[], operatorId?: string, operatorName?: string) {
    return prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findUnique({
        where: { id: billId },
      });

      if (!bill) {
        return {
          success: false,
          error: '账单不存在',
        };
      }

      if (bill.status === BillStatus.SETTLED) {
        return {
          success: false,
          error: '账单已结算',
        };
      }

      const balance = parseFloat(bill.balance.toString());
      const totalPayment = payments.reduce((sum, p) => sum + p.amount, 0);

      if (totalPayment < balance) {
        return {
          success: false,
          error: `支付金额不足，需要支付 ¥${balance}，当前支付 ¥${totalPayment}`,
        };
      }

      const paymentRecords = [];
      for (const payment of payments) {
        const paymentRecord = await tx.payment.create({
          data: {
            billId,
            paymentMethod: payment.paymentMethod,
            amount: payment.amount,
            transactionNo: payment.transactionNo,
            operatorId,
            operatorName,
            remark: payment.remark,
          },
        });
        paymentRecords.push(paymentRecord);
      }

      const updatedBill = await tx.bill.update({
        where: { id: billId },
        data: {
          paidAmount: parseFloat(bill.paidAmount.toString()) + totalPayment,
          balance: totalPayment - balance,
          status: BillStatus.SETTLED,
          settleTime: new Date(),
        },
      });

      await this.logAudit({
        action: 'SETTLE_BILL',
        module: 'Billing',
        targetType: 'Bill',
        targetId: billId,
        operatorId,
        operatorName,
        newValue: updatedBill,
      });

      return {
        success: true,
        bill: updatedBill,
        payments: paymentRecords,
      };
    });
  }

  async getBillSummary(billId: string) {
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
        payments: {
          orderBy: { createdAt: 'asc' },
        },
        reservation: true,
        checkIn: {
          include: {
            room: true,
            guest: true,
          },
        },
      },
    });

    if (!bill) {
      return null;
    }

    const itemsByType = bill.items.reduce((acc, item) => {
      if (!acc[item.itemType]) {
        acc[item.itemType] = {
          type: item.itemType,
          items: [],
          total: 0,
        };
      }
      acc[item.itemType].items.push(item);
      acc[item.itemType].total += parseFloat(item.amount.toString());
      return acc;
    }, {} as Record<string, any>);

    return {
      ...bill,
      itemsByType: Object.values(itemsByType),
    };
  }

  private async logAudit(data: {
    action: string;
    module: string;
    targetType?: string;
    targetId?: string;
    operatorId?: string;
    operatorName?: string;
    oldValue?: any;
    newValue?: any;
  }) {
    await prisma.auditLog.create({
      data: {
        ...data,
        oldValue: data.oldValue ? JSON.parse(JSON.stringify(data.oldValue)) : undefined,
        newValue: data.newValue ? JSON.parse(JSON.stringify(data.newValue)) : undefined,
      },
    });
  }

  async generateCheckInBill(checkInId: string, roomRate: number, operatorId?: string, operatorName?: string) {
    const checkIn = await prisma.checkIn.findUnique({
      where: { id: checkInId },
      include: { reservation: true },
    });

    if (!checkIn) {
      return {
        success: false,
        error: '入住记录不存在',
      };
    }

    const existingBill = await prisma.bill.findFirst({
      where: { checkInId },
    });

    if (existingBill) {
      return {
        success: true,
        bill: existingBill,
      };
    }

    const bill = await prisma.bill.create({
      data: {
        billNo: await this.generateBillNo(),
        checkInId: checkIn.id,
        reservationId: checkIn.reservationId,
        guestId: checkIn.guestId,
        totalAmount: 0,
        paidAmount: parseFloat(checkIn.depositAmount.toString()),
        discountAmount: 0,
        balance: 0,
      },
    });

    if (checkIn.depositAmount > 0) {
      await prisma.payment.create({
        data: {
          billId: bill.id,
          paymentMethod: 'DEPOSIT',
          amount: checkIn.depositAmount,
          operatorId,
          operatorName,
          remark: '入住押金',
        },
      });
    }

    return {
      success: true,
      bill,
    };
  }

  private async generateBillNo(): Promise<string> {
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');

    const count = await prisma.bill.count({
      where: {
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lt: new Date(today.setHours(23, 59, 59, 999)),
        },
      },
    });

    return `BL${dateStr}${(count + 1).toString().padStart(6, '0')}`;
  }
}

export const billingEngine = new BillingEngine();
