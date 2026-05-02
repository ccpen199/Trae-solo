import { ReservationStatus, RoomStatus, BillStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { roomStatusEngine } from './roomStatusEngine';
import { billingEngine } from './billingEngine';

export interface CheckInData {
  reservationId?: string;
  roomId: string;
  guest: {
    name: string;
    idCardNumber?: string;
    phone?: string;
    email?: string;
  };
  checkInTime?: Date;
  expectedCheckOutTime: Date;
  adultCount: number;
  childCount: number;
  depositAmount: number;
  idCardVerified?: boolean;
  operatorId?: string;
  operatorName?: string;
}

export interface CheckOutData {
  checkInId: string;
  payments: Array<{
    paymentMethod: string;
    amount: number;
    transactionNo?: string;
    remark?: string;
  }>;
  operatorId?: string;
  operatorName?: string;
}

class CheckInEngine {
  async processCheckIn(data: CheckInData) {
    return prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({
        where: { id: data.roomId },
      });

      if (!room) {
        return {
          success: false,
          error: '房间不存在',
        };
      }

      if (room.status !== RoomStatus.VACANT && room.status !== RoomStatus.RESERVED) {
        return {
          success: false,
          error: '房间状态不允许入住',
        };
      }

      let guest = await tx.guest.findFirst({
        where: {
          OR: [
            { idCardNumber: data.guest.idCardNumber },
            { phone: data.guest.phone },
          ],
        },
      });

      if (!guest) {
        guest = await tx.guest.create({
          data: {
            name: data.guest.name,
            idCardNumber: data.guest.idCardNumber,
            phone: data.guest.phone,
            email: data.guest.email,
          },
        });
      } else {
        guest = await tx.guest.update({
          where: { id: guest.id },
          data: {
            name: data.guest.name,
            phone: data.guest.phone,
            email: data.guest.email,
          },
        });
      }

      if (data.reservationId) {
        const reservation = await tx.reservation.findUnique({
          where: { id: data.reservationId },
          include: { room: true },
        });

        if (!reservation) {
          return {
            success: false,
            error: '预订记录不存在',
          };
        }

        if (reservation.status !== ReservationStatus.CONFIRMED) {
          return {
            success: false,
            error: '预订状态不允许入住',
          };
        }

        if (reservation.roomId && reservation.roomId !== data.roomId) {
          return {
            success: false,
            error: '房间与预订房间不一致',
          };
        }

        await tx.reservation.update({
          where: { id: data.reservationId },
          data: {
            status: ReservationStatus.CHECKED_IN,
            roomId: data.roomId,
          },
        });
      }

      const checkInNo = await this.generateCheckInNo();

      const checkIn = await tx.checkIn.create({
        data: {
          checkInNo,
          reservationId: data.reservationId,
          roomId: data.roomId,
          guestId: guest.id,
          checkInTime: data.checkInTime || new Date(),
          expectedCheckOutTime: data.expectedCheckOutTime,
          adultCount: data.adultCount,
          childCount: data.childCount,
          depositAmount: data.depositAmount,
          idCardVerified: data.idCardVerified || false,
        },
        include: {
          room: true,
          guest: true,
          reservation: true,
        },
      });

      const statusResult = await roomStatusEngine.changeStatus({
        roomId: data.roomId,
        newStatus: RoomStatus.OCCUPIED,
        operatorId: data.operatorId,
        operatorName: data.operatorName,
        reason: '客人入住',
        referenceType: 'CheckIn',
        referenceId: checkIn.id,
      });

      if (!statusResult.success) {
        throw new Error(statusResult.error);
      }

      const billResult = await billingEngine.generateCheckInBill(
        checkIn.id,
        parseFloat(room.basePrice.toString()),
        data.operatorId,
        data.operatorName
      );

      if (!billResult.success) {
        throw new Error(billResult.error);
      }

      await this.logAudit({
        action: 'CHECK_IN',
        module: 'CheckIn',
        targetType: 'CheckIn',
        targetId: checkIn.id,
        operatorId: data.operatorId,
        operatorName: data.operatorName,
        newValue: checkIn,
      });

      return {
        success: true,
        checkIn,
        bill: billResult.bill,
      };
    });
  }

  async processCheckOut(data: CheckOutData) {
    return prisma.$transaction(async (tx) => {
      const checkIn = await tx.checkIn.findUnique({
        where: { id: data.checkInId },
        include: {
          room: true,
          guest: true,
          reservation: true,
        },
      });

      if (!checkIn) {
        return {
          success: false,
          error: '入住记录不存在',
        };
      }

      if (checkIn.actualCheckOutTime) {
        return {
          success: false,
          error: '该入住记录已退房',
        };
      }

      const bill = await tx.bill.findFirst({
        where: { checkInId: data.checkInId },
        include: { items: true, payments: true },
      });

      if (!bill) {
        return {
          success: false,
          error: '账单不存在',
        };
      }

      const room = await tx.room.findUnique({
        where: { id: checkIn.roomId },
      });

      if (!room) {
        return {
          success: false,
          error: '房间不存在',
        };
      }

      const checkInDate = new Date(checkIn.checkInTime);
      const checkOutDate = new Date();
      const nights = Math.max(1, Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      ));

      const roomRate = parseFloat(room.basePrice.toString());
      const accommodationAmount = roomRate * nights;

      const accommodationResult = await billingEngine.addBillItem(bill.id, {
        itemType: 'ACCOMMODATION',
        description: '房费',
        quantity: nights,
        unitPrice: roomRate,
        operatorId: data.operatorId,
        operatorName: data.operatorName,
        remark: `${nights}晚房费`,
      });

      if (!accommodationResult.success) {
        throw new Error(accommodationResult.error);
      }

      const currentBill = await tx.bill.findUnique({
        where: { id: bill.id },
      });

      if (!currentBill) {
        throw new Error('账单不存在');
      }

      const balance = parseFloat(currentBill.balance.toString());

      if (balance > 0) {
        if (!data.payments || data.payments.length === 0) {
          return {
            success: false,
            error: `账单余额 ¥${balance}，请完成支付后再退房`,
          };
        }

        const totalPayment = data.payments.reduce((sum, p) => sum + p.amount, 0);
        if (totalPayment < balance) {
          return {
            success: false,
            error: `支付金额不足，需要支付 ¥${balance}，当前支付 ¥${totalPayment}`,
          };
        }

        for (const payment of data.payments) {
          const paymentResult = await billingEngine.processPayment(bill.id, {
            ...payment,
            operatorId: data.operatorId,
            operatorName: data.operatorName,
          });

          if (!paymentResult.success) {
            throw new Error(paymentResult.error);
          }
        }
      }

      const updatedCheckIn = await tx.checkIn.update({
        where: { id: data.checkInId },
        data: {
          actualCheckOutTime: new Date(),
        },
      });

      if (checkIn.reservationId) {
        await tx.reservation.update({
          where: { id: checkIn.reservationId },
          data: {
            status: ReservationStatus.CHECKED_OUT,
          },
        });
      }

      const statusResult = await roomStatusEngine.changeStatus({
        roomId: checkIn.roomId,
        newStatus: RoomStatus.DIRTY,
        operatorId: data.operatorId,
        operatorName: data.operatorName,
        reason: '客人退房，等待清洁',
        referenceType: 'CheckIn',
        referenceId: checkIn.id,
      });

      if (!statusResult.success) {
        throw new Error(statusResult.error);
      }

      const taskNo = await this.generateTaskNo();
      await tx.cleanTask.create({
        data: {
          taskNo,
          roomId: checkIn.roomId,
          taskType: 'CHECK_OUT_CLEAN',
          priority: 2,
          remark: '退房清洁',
        },
      });

      await this.logAudit({
        action: 'CHECK_OUT',
        module: 'CheckIn',
        targetType: 'CheckIn',
        targetId: checkIn.id,
        operatorId: data.operatorId,
        operatorName: data.operatorName,
        newValue: updatedCheckIn,
      });

      const finalBill = await billingEngine.getBillSummary(bill.id);

      return {
        success: true,
        checkIn: updatedCheckIn,
        bill: finalBill,
      };
    });
  }

  private async generateCheckInNo(): Promise<string> {
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');

    const count = await prisma.checkIn.count({
      where: {
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lt: new Date(today.setHours(23, 59, 59, 999)),
        },
      },
    });

    return `CI${dateStr}${(count + 1).toString().padStart(6, '0')}`;
  }

  private async generateTaskNo(): Promise<string> {
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');

    const count = await prisma.cleanTask.count({
      where: {
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lt: new Date(today.setHours(23, 59, 59, 999)),
        },
      },
    });

    return `CT${dateStr}${(count + 1).toString().padStart(6, '0')}`;
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
}

export const checkInEngine = new CheckInEngine();
