import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { Product } from './Product.js';
import { Region } from './Region.js';
import { PricePolicyStatus } from '../types/common.js';

export enum PricePolicyType {
  RETAIL = 'retail',
  WHOLESALE = 'wholesale',
  PROMOTION = 'promotion',
  SPECIAL = 'special',
}

export enum PriceLockDirection {
  BOTH = 'both',
  FLOOR_ONLY = 'floor_only',
  CEILING_ONLY = 'ceiling_only',
}

@Entity('price_policies')
@Index(['productId', 'regionId', 'status'], { unique: false })
@Index(['startDate', 'endDate'], { unique: false })
export class PricePolicy extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  policyNumber: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: PricePolicyType,
    default: PricePolicyType.RETAIL,
  })
  policyType: PricePolicyType;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  floorPrice: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  ceilingPrice: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  suggestedPrice: number | null;

  @Column({
    type: 'enum',
    enum: PriceLockDirection,
    default: PriceLockDirection.BOTH,
  })
  lockDirection: PriceLockDirection;

  @Column({ type: 'boolean', default: true })
  isStrictlyEnforced: boolean;

  @Column({ type: 'text', nullable: true })
  enforcementRules: string | null;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date | null;

  @Column({
    type: 'enum',
    enum: PricePolicyStatus,
    default: PricePolicyStatus.DRAFT,
  })
  status: PricePolicyStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, (product) => product.pricePolicies)
  product: Product;

  @Column({ type: 'uuid', nullable: true })
  regionId: string | null;

  @ManyToOne(() => Region, (region) => region.pricePolicies, { nullable: true })
  region: Region | null;

  isPriceValid(price: number): { valid: boolean; reason?: string } {
    if (this.status !== PricePolicyStatus.ACTIVE) {
      return { valid: true };
    }

    const now = new Date();
    if (this.startDate > now) {
      return { valid: false, reason: '价格政策尚未生效' };
    }
    if (this.endDate && this.endDate < now) {
      return { valid: false, reason: '价格政策已过期' };
    }

    if (this.lockDirection === PriceLockDirection.BOTH || 
        this.lockDirection === PriceLockDirection.FLOOR_ONLY) {
      if (price < this.floorPrice) {
        return { valid: false, reason: `价格低于区域底价 ${this.floorPrice}` };
      }
    }

    if (this.lockDirection === PriceLockDirection.BOTH || 
        this.lockDirection === PriceLockDirection.CEILING_ONLY) {
      if (price > this.ceilingPrice) {
        return { valid: false, reason: `价格高于区域限价 ${this.ceilingPrice}` };
      }
    }

    return { valid: true };
  }
}
