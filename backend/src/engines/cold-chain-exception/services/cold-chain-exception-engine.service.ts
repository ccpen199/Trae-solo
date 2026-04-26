import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ColdChainRecordDto, ColdChainExceptionDto, ExceptionCompensationResult } from '../dto/cold-chain-exception.dto';
import { ColdChainStatus, OrderStatus, LogAction } from '../../common/enums';
import { AuditService } from '../../modules/audit/services/audit.service';

interface ColdChainThreshold {
  minTemperature: number;
  maxTemperature: number;
  warningDuration: number;
  exceptionDuration: number;
  compensationRate: number;
}

@Injectable()
export class ColdChainExceptionEngine {
  private defaultThreshold: ColdChainThreshold = {
    minTemperature: 0,
    maxTemperature: 8,
    warningDuration: 30,
    exceptionDuration: 60,
    compensationRate: 0.1,
  };

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async recordColdChainData(dto: ColdChainRecordDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    const status = this.determineStatus(dto.temperature);

    const record = await this.prisma.coldChainRecord.create({
      data: {
        orderId: dto.orderId,
        deviceId: dto.deviceId,
        temperature: dto.temperature,
        humidity: dto.humidity,
        status,
        locationLat: dto.locationLat,
        locationLng: dto.locationLng,
        locationName: dto.locationName,
      },
    });

    if (status === ColdChainStatus.EXCEPTION) {
      await this.checkAndCreateException(dto.orderId, record);
    }

    return record;
  }

  private determineStatus(temperature: number): ColdChainStatus {
    const threshold = this.defaultThreshold;
    
    if (temperature < threshold.minTemperature || temperature > threshold.maxTemperature) {
      return ColdChainStatus.EXCEPTION;
    }
    
    const warningRange = (threshold.maxTemperature - threshold.minTemperature) * 0.1;
    if (temperature < threshold.minTemperature + warningRange || 
        temperature > threshold.maxTemperature - warningRange) {
      return ColdChainStatus.WARNING;
    }

    return ColdChainStatus.NORMAL;
  }

  private async checkAndCreateException(orderId: string, record: any) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const recentExceptionRecords = await this.prisma.coldChainRecord.findMany({
      where: {
        orderId,
        status: ColdChainStatus.EXCEPTION,
        recordTime: {
          gte: fiveMinutesAgo,
        },
      },
      orderBy: { recordTime: 'asc' },
    });

    if (recentExceptionRecords.length >= 3) {
      const firstRecord = recentExceptionRecords[0];
      const durationMinutes = Math.floor(
        (record.recordTime.getTime() - firstRecord.recordTime.getTime()) / (1000 * 60)
      );

      const existingException = await this.prisma.coldChainException.findFirst({
        where: {
          orderId,
          isCompensated: false,
        },
      });

      if (!existingException) {
        const deviation = Math.abs(record.temperature - 
          (this.defaultThreshold.minTemperature + this.defaultThreshold.maxTemperature) / 2);

        await this.prisma.coldChainException.create({
          data: {
            orderId,
            recordId: record.id,
            exceptionType: 'TEMPERATURE_EXCEEDED',
            severity: durationMinutes > 60 ? 'HIGH' : 'MEDIUM',
            durationMinutes,
            temperatureDeviation: deviation,
            compensationAmount: 0,
            isCompensated: false,
          },
        });

        await this.prisma.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.EXCEPTION_HANDLING },
        });
      }
    }
  }

  async calculateCompensation(exceptionId: string): Promise<ExceptionCompensationResult> {
    const exception = await this.prisma.coldChainException.findUnique({
      where: { id: exceptionId },
      include: { order: true },
    });

    if (!exception) {
      throw new NotFoundException('冷链异常记录不存在');
    }

    if (exception.isCompensated) {
      throw new BadRequestException('该异常已补偿');
    }

    const orderAmount = exception.order.actualAmount || exception.order.expectedAmount;
    
    let compensationRate = this.defaultThreshold.compensationRate;
    
    if (exception.severity === 'HIGH') {
      compensationRate = 0.2;
    } else if (exception.severity === 'LOW') {
      compensationRate = 0.05;
    }

    const durationFactor = Math.min((exception.durationMinutes || 0) / 60, 1);
    const deviationFactor = Math.min((exception.temperatureDeviation || 0) / 10, 1);
    
    const finalRate = compensationRate * (0.5 + durationFactor * 0.3 + deviationFactor * 0.2);
    const compensationAmount = orderAmount * finalRate;

    return {
      exceptionId,
      orderId: exception.orderId,
      originalAmount: orderAmount,
      compensationAmount,
      compensatedAmount: orderAmount - compensationAmount,
      compensationReason: this.generateCompensationReason(exception),
    };
  }

  private generateCompensationReason(exception: any): string {
    const reasons: string[] = [];
    
    if (exception.exceptionType === 'TEMPERATURE_EXCEEDED') {
      reasons.push(`温度异常`);
    }
    
    if (exception.durationMinutes) {
      reasons.push(`持续${exception.durationMinutes}分钟`);
    }
    
    if (exception.temperatureDeviation) {
      reasons.push(`偏差${exception.temperatureDeviation.toFixed(1)}℃`);
    }
    
    return reasons.join('，');
  }

  async executeCompensation(
    dto: ColdChainExceptionDto,
    operatorId: string,
    operatorName: string,
    operatorRole: string
  ) {
    const exception = await this.prisma.coldChainException.findUnique({
      where: { id: dto.exceptionId },
      include: { order: true },
    });

    if (!exception) {
      throw new NotFoundException('冷链异常记录不存在');
    }

    if (exception.isCompensated) {
      throw new BadRequestException('该异常已补偿');
    }

    let compensationAmount = dto.compensationAmount;
    if (!compensationAmount) {
      const result = await this.calculateCompensation(dto.exceptionId);
      compensationAmount = result.compensationAmount;
    }

    return this.prisma.$transaction(async (prisma) => {
      await prisma.coldChainException.update({
        where: { id: dto.exceptionId },
        data: {
          compensationAmount,
          isCompensated: true,
          remark: dto.remark,
          handledAt: new Date(),
        },
      });

      const order = exception.order;
      const newActualAmount = (order.actualAmount || order.expectedAmount) - compensationAmount;
      const newActualPrice = order.actualWeight 
        ? newActualAmount / order.actualWeight 
        : order.actualPrice;

      const updatedOrder = await prisma.order.update({
        where: { id: exception.orderId },
        data: {
          status: OrderStatus.DELIVERED,
          actualAmount: newActualAmount,
          actualPrice: newActualPrice,
        },
      });

      const buyerAccount = await prisma.virtualAccount.findUnique({
        where: { userId: order.buyerId },
      });

      if (buyerAccount && compensationAmount > 0) {
        await prisma.virtualAccount.update({
          where: { id: buyerAccount.id },
          data: {
            balance: { increment: compensationAmount },
          },
        });

        await prisma.accountTransaction.create({
          data: {
            accountId: buyerAccount.id,
            amount: compensationAmount,
            type: 'COLD_CHAIN_COMPENSATION',
            status: 'COMPLETED',
            referenceId: dto.exceptionId,
            description: `订单 ${order.orderNo} 冷链异常补偿`,
          },
        });
      }

      await this.auditService.createLog({
        entityType: 'ColdChainException',
        entityId: dto.exceptionId,
        action: LogAction.EXCEPTION,
        operatorId,
        operatorName,
        operatorRole: operatorRole as any,
        oldValue: {
          originalAmount: order.actualAmount || order.expectedAmount,
        },
        newValue: {
          compensationAmount,
          newAmount: newActualAmount,
        },
        changeSummary: `冷链异常补偿。补偿金额: ${compensationAmount}, 原金额: ${order.actualAmount || order.expectedAmount}, 新金额: ${newActualAmount}`,
        remark: dto.remark,
      });

      return {
        exceptionId: dto.exceptionId,
        orderId: exception.orderId,
        compensationAmount,
        updatedOrder,
        compensatedAt: new Date(),
      };
    });
  }

  async getOrderColdChainStatus(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    const latestRecord = await this.prisma.coldChainRecord.findFirst({
      where: { orderId },
      orderBy: { recordTime: 'desc' },
    });

    const exceptions = await this.prisma.coldChainException.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      orderId,
      currentStatus: latestRecord?.status || ColdChainStatus.NORMAL,
      latestRecord,
      exceptions,
      exceptionCount: exceptions.length,
      uncompensatedCount: exceptions.filter(e => !e.isCompensated).length,
    };
  }
}
