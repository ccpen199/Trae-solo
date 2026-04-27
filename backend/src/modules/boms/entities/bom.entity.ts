import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BomStatus } from '../../../common/enums/bom-status.enum';
import { Style } from '../../styles/entities/style.entity';
import { Pattern } from '../../patterns/entities/pattern.entity';
import { BomItem } from './bom-item.entity';
import { PurchaseOrder } from '../../purchases/entities/purchase-order.entity';

@Entity('boms')
export class Bom extends BaseEntity {
  @Column({ name: 'bom_number', unique: true })
  bomNumber: string;

  @Column({ name: 'style_id', type: 'uuid' })
  styleId: string;

  @ManyToOne(() => Style, (style) => style.boms)
  @JoinColumn({ name: 'style_id' })
  style: Style;

  @Column({ name: 'pattern_id', type: 'uuid', nullable: true })
  patternId: string;

  @ManyToOne(() => Pattern, (pattern) => pattern.boms)
  @JoinColumn({ name: 'pattern_id' })
  pattern: Pattern;

  @Column({
    type: 'enum',
    enum: BomStatus,
    default: BomStatus.DRAFT,
  })
  status: BomStatus;

  @Column({ name: 'version', type: 'int', default: 1 })
  version: number;

  @Column({ name: 'is_latest', default: true })
  isLatest: boolean;

  @Column({ name: 'parent_bom_id', type: 'uuid', nullable: true })
  parentBomId: string;

  @Column({ name: 'sizes', type: 'jsonb', nullable: true })
  sizes: string[];

  @Column({ name: 'production_quantity', type: 'int', default: 0 })
  productionQuantity: number;

  @Column({ name: 'bom_type', default: 'production' })
  bomType: string;

  @Column({ name: 'generated_by', type: 'uuid', nullable: true })
  generatedBy: string;

  @Column({ name: 'generated_at', type: 'timestamp', nullable: true })
  generatedAt: Date;

  @Column({ name: 'confirmed_by', type: 'uuid', nullable: true })
  confirmedBy: string;

  @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @Column({ name: 'total_fabric_cost', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalFabricCost: number;

  @Column({ name: 'total_accessory_cost', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalAccessoryCost: number;

  @Column({ name: 'total_labor_cost', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalLaborCost: number;

  @Column({ name: 'total_cost', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalCost: number;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 15, scale: 2, default: 0 })
  unitCost: number;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'special_instructions', type: 'text', nullable: true })
  specialInstructions: string;

  @Column({ name: 'tags', type: 'jsonb', nullable: true })
  tags: string[];

  @OneToMany(() => BomItem, (item) => item.bom, { cascade: true })
  items: BomItem[];

  @OneToMany(() => PurchaseOrder, (po) => po.bom)
  purchaseOrders: PurchaseOrder[];
}
