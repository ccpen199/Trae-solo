import { AppDataSource } from '../data-source.js';
import { PricePolicy, PriceLockDirection, PricePolicyType } from '../entities/PricePolicy.js';
import { Region } from '../entities/Region.js';
import { Product } from '../entities/Product.js';
import { PricePolicyStatus } from '../types/common.js';
import { In, MoreThanOrEqual, LessThanOrEqual, IsNull, Between } from 'typeorm';

export interface PriceValidationResult {
  valid: boolean;
  reason?: string;
  applicablePolicy?: {
    id: string;
    policyNumber: string;
    name: string;
    floorPrice: number;
    ceilingPrice: number;
    regionName?: string;
  };
}

export interface PricePolicySyncResult {
  success: boolean;
  totalSynced: number;
  errors: string[];
}

export class PriceControlEngine {
  private pricePolicyRepository = AppDataSource.getRepository(PricePolicy);
  private regionRepository = AppDataSource.getRepository(Region);
  private productRepository = AppDataSource.getRepository(Product);

  async validatePrice(
    productId: string,
    regionId: string | null,
    price: number,
    policyType: PricePolicyType = PricePolicyType.RETAIL
  ): Promise<PriceValidationResult> {
    const applicablePolicy = await this.findApplicablePolicy(productId, regionId, policyType);

    if (!applicablePolicy) {
      return { valid: true };
    }

    const validation = applicablePolicy.isPriceValid(price);

    return {
      valid: validation.valid,
      reason: validation.reason,
      applicablePolicy: {
        id: applicablePolicy.id,
        policyNumber: applicablePolicy.policyNumber,
        name: applicablePolicy.name,
        floorPrice: applicablePolicy.floorPrice,
        ceilingPrice: applicablePolicy.ceilingPrice,
        regionName: applicablePolicy.region?.name,
      },
    };
  }

  async findApplicablePolicy(
    productId: string,
    regionId: string | null,
    policyType: PricePolicyType = PricePolicyType.RETAIL
  ): Promise<PricePolicy | null> {
    const now = new Date();

    const regionHierarchy = regionId 
      ? await this.getRegionHierarchy(regionId)
      : [];

    const regionIdsToCheck = regionHierarchy.length > 0 
      ? [regionId, ...regionHierarchy.map(r => r.id), null]
      : [null];

    for (const rId of regionIdsToCheck) {
      const policy = await this.pricePolicyRepository.findOne({
        where: {
          productId,
          regionId: rId,
          policyType,
          status: PricePolicyStatus.ACTIVE,
          startDate: LessThanOrEqual(now),
        },
        relations: ['region'],
        order: {
          startDate: 'DESC',
        },
      });

      if (policy) {
        if (policy.endDate && policy.endDate < now) {
          continue;
        }
        return policy;
      }
    }

    return null;
  }

  async getRegionHierarchy(regionId: string): Promise<Region[]> {
    const regions: Region[] = [];
    let currentRegionId = regionId;

    while (currentRegionId) {
      const region = await this.regionRepository.findOne({
        where: { id: currentRegionId },
        select: ['id', 'parentId', 'level', 'name'],
      });

      if (!region || !region.parentId) {
        break;
      }

      const parentRegion = await this.regionRepository.findOne({
        where: { id: region.parentId },
        select: ['id', 'parentId', 'level', 'name'],
      });

      if (parentRegion) {
        regions.push(parentRegion);
        currentRegionId = parentRegion.id;
      } else {
        break;
      }
    }

    return regions;
  }

  async syncPricePolicyToDistributionNodes(
    productId: string,
    policyId: string
  ): Promise<PricePolicySyncResult> {
    const errors: string[] = [];
    let syncedCount = 0;

    const policy = await this.pricePolicyRepository.findOne({
      where: { id: policyId },
      relations: ['product', 'region'],
    });

    if (!policy) {
      return {
        success: false,
        totalSynced: 0,
        errors: ['价格政策不存在'],
      };
    }

    if (policy.regionId) {
      const regionHierarchy = await this.getRegionHierarchy(policy.regionId);
      const allRegionIds = [policy.regionId, ...regionHierarchy.map(r => r.id)];

      for (const rId of allRegionIds) {
        try {
          const existingPolicy = await this.pricePolicyRepository.findOne({
            where: {
              productId,
              regionId: rId,
              policyType: policy.policyType,
              status: In([PricePolicyStatus.ACTIVE, PricePolicyStatus.DRAFT]),
            },
          });

          if (existingPolicy) {
            existingPolicy.floorPrice = policy.floorPrice;
            existingPolicy.ceilingPrice = policy.ceilingPrice;
            existingPolicy.suggestedPrice = policy.suggestedPrice;
            existingPolicy.lockDirection = policy.lockDirection;
            existingPolicy.isStrictlyEnforced = policy.isStrictlyEnforced;
            existingPolicy.status = PricePolicyStatus.ACTIVE;
            await this.pricePolicyRepository.save(existingPolicy);
          } else {
            const newPolicy = this.pricePolicyRepository.create({
              policyNumber: `${policy.policyNumber}-SYNC-${Date.now()}`,
              name: `${policy.name} (同步)`,
              policyType: policy.policyType,
              floorPrice: policy.floorPrice,
              ceilingPrice: policy.ceilingPrice,
              suggestedPrice: policy.suggestedPrice,
              lockDirection: policy.lockDirection,
              isStrictlyEnforced: policy.isStrictlyEnforced,
              startDate: policy.startDate,
              endDate: policy.endDate,
              status: PricePolicyStatus.ACTIVE,
              productId,
              regionId: rId,
            });
            await this.pricePolicyRepository.save(newPolicy);
          }
          syncedCount++;
        } catch (error) {
          errors.push(`同步区域 ${rId} 失败: ${(error as Error).message}`);
        }
      }
    } else {
      return {
        success: false,
        totalSynced: 0,
        errors: ['全局价格政策需要手动同步到各区域'],
      };
    }

    return {
      success: errors.length === 0,
      totalSynced: syncedCount,
      errors,
    };
  }

  async checkCrossRegionPriceViolation(
    productId: string,
    fromRegionId: string,
    toRegionId: string,
    proposedPrice: number
  ): Promise<{ hasViolation: boolean; details?: string }> {
    const fromPolicy = await this.findApplicablePolicy(productId, fromRegionId);
    const toPolicy = await this.findApplicablePolicy(productId, toRegionId);

    if (!fromPolicy || !toPolicy) {
      return { hasViolation: false };
    }

    if (fromPolicy.isStrictlyEnforced || toPolicy.isStrictlyEnforced) {
      const fromValidation = fromPolicy.isPriceValid(proposedPrice);
      if (!fromValidation.valid) {
        return {
          hasViolation: true,
          details: `来源区域价格违规: ${fromValidation.reason}`,
        };
      }

      const toValidation = toPolicy.isPriceValid(proposedPrice);
      if (!toValidation.valid) {
        return {
          hasViolation: true,
          details: `目标区域价格违规: ${toValidation.reason}`,
        };
      }

      if (toPolicy.floorPrice > fromPolicy.ceilingPrice) {
        if (proposedPrice < toPolicy.floorPrice) {
          return {
            hasViolation: true,
            details: `跨区域低价倾销风险: 目标区域底价 ${toPolicy.floorPrice}, 提议价格 ${proposedPrice}`,
          };
        }
      }
    }

    return { hasViolation: false };
  }

  generatePolicyNumber(prefix: string = 'PP'): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${dateStr}-${random}`;
  }
}

export const priceControlEngine = new PriceControlEngine();
