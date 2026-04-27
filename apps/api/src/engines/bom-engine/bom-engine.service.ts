import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface BomMaterialItem {
  materialId: string;
  quantity: number;
  unit: string;
  lossRate?: number;
}

export interface BomValidationResult {
  valid: boolean;
  missing: MissingMaterial[];
  excess: ExcessMaterial[];
  required: RequiredMaterial[];
}

export interface MissingMaterial {
  materialId: string;
  materialName: string;
  requiredQty: number;
  unit: string;
}

export interface ExcessMaterial {
  materialId: string;
  materialName: string;
  requestedQty: number;
  maxAllowedQty: number;
  unit: string;
}

export interface RequiredMaterial {
  materialId: string;
  materialName: string;
  quantity: number;
  withLoss: number;
  unit: string;
}

@Injectable()
export class BomEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async getRequiredMaterials(
    productId: string,
    plannedQty: number,
  ): Promise<RequiredMaterial[]> {
    const bom = await this.prisma.bom.findUnique({
      where: { productId },
      include: {
        materials: {
          include: { material: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!bom) {
      throw new BadRequestException(`产品 ${productId} 未配置BOM配方`);
    }

    return bom.materials.map((item) => {
      const baseQty = item.quantity.toNumber();
      const lossRate = item.lossRate.toNumber();
      const totalQty = baseQty * plannedQty;
      const withLoss = totalQty * (1 + lossRate);

      return {
        materialId: item.materialId,
        materialName: item.material.name,
        quantity: totalQty,
        withLoss,
        unit: item.unit,
      };
    });
  }

  async validateRequisition(
    productId: string,
    plannedQty: number,
    requestedItems: {
      materialId: string;
      quantity: number;
    }[],
  ): Promise<BomValidationResult> {
    const required = await this.getRequiredMaterials(productId, plannedQty);
    const requiredMap = new Map(required.map((r) => [r.materialId, r]));
    const requestedMap = new Map(requestedItems.map((r) => [r.materialId, r.quantity]));

    const missing: MissingMaterial[] = [];
    const excess: ExcessMaterial[] = [];

    for (const [materialId, req] of requiredMap) {
      const requested = requestedMap.get(materialId);
      if (requested === undefined || requested === 0) {
        missing.push({
          materialId,
          materialName: req.materialName,
          requiredQty: req.withLoss,
          unit: req.unit,
        });
      } else if (requested > req.withLoss) {
        excess.push({
          materialId,
          materialName: req.materialName,
          requestedQty: requested,
          maxAllowedQty: req.withLoss,
          unit: req.unit,
        });
      }
    }

    const notInBom = requestedItems.filter((item) => !requiredMap.has(item.materialId));
    const nonBomExcess = notInBom.map((item) => ({
      materialId: item.materialId,
      materialName: item.materialId,
      requestedQty: item.quantity,
      maxAllowedQty: 0,
      unit: '',
    }));

    excess.push(...nonBomExcess);

    return {
      valid: missing.length === 0 && excess.length === 0,
      missing,
      excess,
      required,
    };
  }

  async calculateWithLoss(
    baseQty: number,
    lossRate: number,
  ): Promise<number> {
    return baseQty * (1 + lossRate);
  }
}
