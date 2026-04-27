import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BomItem } from '../../boms/entities/bom-item.entity';
import { MaterialInventory } from './material-inventory.entity';
import { MaterialReceipt } from './material-receipt.entity';

@Entity('materials')
export class Material extends BaseEntity {
  @Column({ name: 'material_code', unique: true })
  materialCode: string;

  @Column()
  name: string;

  @Column({ name: 'category' })
  category: string;

  @Column({ name: 'sub_category', nullable: true })
  subCategory: string;

  @Column({ name: 'type', nullable: true })
  type: string;

  @Column({ name: 'specification', type: 'text', nullable: true })
  specification: string;

  @Column({ name: 'composition', nullable: true })
  composition: string;

  @Column({ name: 'weight', type: 'decimal', precision: 10, scale: 4, nullable: true })
  weight: number;

  @Column({ name: 'weight_unit', default: 'g/m2' })
  weightUnit: string;

  @Column({ name: 'width', type: 'decimal', precision: 10, scale: 2, nullable: true })
  width: number;

  @Column({ name: 'width_unit', default: 'cm' })
  widthUnit: string;

  @Column({ name: 'color', nullable: true })
  color: string;

  @Column({ name: 'color_code', nullable: true })
  colorCode: string;

  @Column({ name: 'pattern', nullable: true })
  pattern: string;

  @Column({ name: 'finish', nullable: true })
  finish: string;

  @Column({ name: 'unit' })
  unit: string;

  @Column({ name: 'min_order_quantity', type: 'decimal', precision: 12, scale: 2, default: 0 })
  minOrderQuantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 4, default: 0 })
  unitPrice: number;

  @Column({ name: 'currency', default: 'CNY' })
  currency: string;

  @Column({ name: 'supplier_id', type: 'uuid', nullable: true })
  supplierId: string;

  @Column({ name: 'supplier_name', nullable: true })
  supplierName: string;

  @Column({ name: 'supplier_item_code', nullable: true })
  supplierItemCode: string;

  @Column({ name: 'lead_time_days', type: 'int', nullable: true })
  leadTimeDays: number;

  @Column({ name: 'safety_stock', type: 'decimal', precision: 12, scale: 2, default: 0 })
  safetyStock: number;

  @Column({ name: 'reorder_point', type: 'decimal', precision: 12, scale: 2, default: 0 })
  reorderPoint: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_obsolete', default: false })
  isObsolete: boolean;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'care_instructions', type: 'text', nullable: true })
  careInstructions: string;

  @Column({ name: 'quality_standards', type: 'text', nullable: true })
  qualityStandards: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ name: 'attachment_urls', type: 'jsonb', nullable: true })
  attachmentUrls: string[];

  @Column({ name: 'tags', type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ name: 'custom_attributes', type: 'jsonb', nullable: true })
  customAttributes: { [key: string]: any };

  @OneToMany(() => BomItem, (item) => item.material)
  bomItems: BomItem[];

  @OneToMany(() => MaterialInventory, (inventory) => inventory.material)
  inventories: MaterialInventory[];

  @OneToMany(() => MaterialReceipt, (receipt) => receipt.material)
  receipts: MaterialReceipt[];
}
