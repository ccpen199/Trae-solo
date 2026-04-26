import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PriceAdjustmentDto, PriceAdjustmentResult, QualityGradePrice } from '../dto/price-adjustment.dto';
import { OrderStatus, QualityLevel, LogAction } from '../../common/enums';
import { AuditService } from '../../modules/audit/services/audit.service';

interface PriceAdjustmentRule {
  productCategory?: string;
  basePrice: number;
  premiumMultiplier: number;
  gradeAMultiplier: number;
  gradeBMultiplier: number;
  gradeCMultiplier: number;
  rejectedMultiplier: number;
}

@Injectable()
export class PriceAdjustmentEngine {
  private defaultRules: PriceAdjustmentRule = {
    basePrice: 0,
    premiumMultiplier: 1.3,
    gradeAMultiplier: 1.0,
    gradeBMultiplier: 0.8,
    gradeCMultiplier: 0.6,
    rejectedMultiplier: 0,
  };

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async calculatePriceAdjustment(
    subOrderId: string,
    gradePrices: QualityGradePrice[]
  ): Promise<PriceAdjustmentResult> {
    const subOrder = await this.prisma.subOrder.findUnique({
      where: { id: subOrderId },
      include: { mainOrder: true },
    });

    if (!subOrder) {
      throw new NotFoundException('子订单不存在');
    }

    const rules = await this.getAdjustmentRules(subOrder.mainOrder.productCategory);
    const basePrice = subOrder.expectedPrice;

    const totalWeight = gradePrices.reduce((sum, gp) => sum + gp.weight, 0);

    const adjustmentDetails = gradePrices.map(gp => {
      let price = gp.price;
      if (!price) {
        price = this.calculateGradePrice(basePrice, gp.level, rules);
      }
      return {
        level: gp.level,
        weight: gp.weight,
        price,
        amount: gp.weight * price,
      };
    });

    const adjustedAmount = adjustmentDetails.reduce((sum, ad) => sum + ad.amount, 0);
    const adjustedPrice = totalWeight > 0 ? adjustedAmount / totalWeight : 0;

    const originalAmount = subOrder.expectedAmount;
    const originalPrice = subOrder.expectedPrice;

    return {
      subOrderId,
      originalPrice,
      originalAmount,
      adjustedPrice,
      adjustedAmount,
      priceDifference: adjustedPrice - originalPrice,
      amountDifference: adjustedAmount - originalAmount,
      adjustmentDetails,
    };
  }

  private calculateGradePrice(
    basePrice: number,
    level: QualityLevel,
    rules: PriceAdjustmentRule
  ): number {
    switch (level) {
      case QualityLevel.PREMIUM:
        return basePrice * rules.premiumMultiplier;
      case QualityLevel.GRADE_A:
        return basePrice * rules.gradeAMultiplier;
      case QualityLevel.GRADE_B:
        return basePrice * rules.gradeBMultiplier;
      case QualityLevel.GRADE_C:
        return basePrice * rules.gradeCMultiplier;
      case QualityLevel.REJECTED:
        return basePrice * rules.rejectedMultiplier;
      default:
        return basePrice;
    }
  }

  private async getAdjustmentRules(productCategory?: string): Promise<PriceAdjustmentRule> {
    if (!productCategory) {
      return this.defaultRules;
    }

    const rule = await this.prisma.priceAdjustmentRule.findFirst({
      where: {
        productCategory,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!rule) {
      return this.defaultRules;
    }

    return {
      productCategory: rule.productCategory || undefined,
      basePrice: (rule.baseCondition as any).basePrice || 0,
      premiumMultiplier: (rule.priceFactors as any).premiumMultiplier || this.defaultRules.premiumMultiplier,
      gradeAMultiplier: (rule.priceFactors as any).gradeAMultiplier || this.defaultRules.gradeAMultiplier,
      gradeBMultiplier: (rule.priceFactors as any).gradeBMultiplier || this.defaultRules.gradeBMultiplier,
      gradeCMultiplier: (rule.priceFactors as any).gradeCMultiplier || this.defaultRules.gradeCMultiplier,
      rejectedMultiplier: (rule.priceFactors as any).rejectedMultiplier || this.defaultRules.rejectedMultiplier,
    };
  }

  async executePriceAdjustment(
    dto: PriceAdjustmentDto,
    operatorId: string,
    operatorName: string,
    operatorRole: string
  ) {
    const result = await this.calculatePriceAdjustment(dto.subOrderId, dto.gradePrices);

    const subOrder = await this.prisma.subOrder.findUnique({
      where: { id: dto.subOrderId },
    });

    if (!subOrder) {
      throw new NotFoundException('子订单不存在');
    }

    const totalWeight = dto.gradePrices.reduce((sum, gp) => sum + gp.weight, 0);
    const premiumWeight = dto.gradePrices.find(gp => gp.level === QualityLevel.PREMIUM)?.weight || 0;
    const gradeAWeight = dto.gradePrices.find(gp => gp.level === QualityLevel.GRADE_A)?.weight || 0;
    const gradeBWeight = dto.gradePrices.find(gp => gp.level === QualityLevel.GRADE_B)?.weight || 0;
    const gradeCWeight = dto.gradePrices.find(gp => gp.level === QualityLevel.GRADE_C)?.weight || 0;
    const rejectedWeight = dto.gradePrices.find(gp => gp.level === QualityLevel.REJECTED)?.weight || 0;

    return this.prisma.$transaction(async (prisma) => {
      await prisma.qualityCheck.create({
        data: {
          subOrderId: dto.subOrderId,
          inspectorId: operatorId,
          totalWeight,
          premiumWeight,
          gradeAWeight,
          gradeBWeight,
          gradeCWeight,
          rejectedWeight,
          premiumPrice: result.adjustmentDetails.find(d => d.level === QualityLevel.PREMIUM)?.price,
          gradeAPrice: result.adjustmentDetails.find(d => d.level === QualityLevel.GRADE_A)?.price,
          gradeBPrice: result.adjustmentDetails.find(d => d.level === QualityLevel.GRADE_B)?.price,
          gradeCPrice: result.adjustmentDetails.find(d => d.level === QualityLevel.GRADE_C)?.price,
          rejectedPrice: result.adjustmentDetails.find(d => d.level === QualityLevel.REJECTED)?.price,
          qualityReport: dto.remark,
        },
      });

      const updatedSubOrder = await prisma.subOrder.update({
        where: { id: dto.subOrderId },
        data: {
          status: OrderStatus.QUALITY_CHECKED,
          actualWeight: totalWeight,
          actualPrice: result.adjustedPrice,
          actualAmount: result.adjustedAmount,
          qualityGrade: this.determineMainQualityLevel(dto.gradePrices),
        },
      });

      const allSubOrders = await prisma.subOrder.findMany({
        where: { mainOrderId: subOrder.mainOrderId },
      });

      const allQualityChecked = allSubOrders.every(so => 
        so.status === OrderStatus.QUALITY_CHECKED || 
        so.status === OrderStatus.IN_TRANSPORT
      );

      if (allQualityChecked) {
        const totalActualWeight = allSubOrders.reduce((sum, so) => 
          sum + (so.actualWeight || 0), 0
        );
        const totalActualAmount = allSubOrders.reduce((sum, so) => 
          sum + (so.actualAmount || 0), 0
        );

        await prisma.order.update({
          where: { id: subOrder.mainOrderId },
          data: {
            status: OrderStatus.QUALITY_CHECKED,
            actualWeight: totalActualWeight,
            actualAmount: totalActualAmount,
            actualPrice: totalActualWeight > 0 ? totalActualAmount / totalActualWeight : 0,
          },
        });
      }

      await this.auditService.createLog({
        entityType: 'SubOrder',
        entityId: dto.subOrderId,
        action: LogAction.UPDATE,
        operatorId,
        operatorName,
        operatorRole: operatorRole as any,
        oldValue: {
          expectedPrice: subOrder.expectedPrice,
          expectedAmount: subOrder.expectedAmount,
        },
        newValue: {
          actualPrice: result.adjustedPrice,
          actualAmount: result.adjustedAmount,
        },
        changeSummary: `质检完成，二次调价。原价格: ${subOrder.expectedPrice}, 调整后价格: ${result.adjustedPrice}, 差价: ${result.priceDifference}`,
        remark: dto.remark,
      });

      return {
        result,
        updatedSubOrder,
      };
    });
  }

  private determineMainQualityLevel(gradePrices: QualityGradePrice[]): QualityLevel {
    const sorted = [...gradePrices].sort((a, b) => b.weight - a.weight);
    return sorted[0]?.level || QualityLevel.GRADE_A;
  }
}
