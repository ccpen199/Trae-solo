import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Bom } from './bom.entity';
import { Material } from '../../materials/entities/material.entity';

@Entity('bom_items')
export class BomItem extends BaseEntity {
  @Column({ name: 'bom_id', type: 'uuid' })
  bomId: string;

  @ManyToOne(() => Bom, (bom) => bom.items)
  @JoinColumn({ name: 'bom_id' })
  bom: Bom;

  @Column({ name: 'material_id', type: 'uuid', nullable: true })
  materialId: string;

  @ManyToOne(() => Material)
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @Column({ name: 'line_number', type: 'int' })
  lineNumber: number;

  @Column({ name: 'item_type' })
  itemType: string;

  @Column({ name: 'category' })
  category: string;

  @Column({ name: 'material_code', nullable: true })
  materialCode: string;

  @Column()
  name: string;

  @Column({ name: 'specification', type: 'text', nullable: true })
  specification: string;

  @Column({ name: 'color', nullable: true })
  color: string;

  @Column({ name: 'size', nullable: true })
  size: string;

  @Column({ name: 'unit' })
  unit: string;

  @Column({ name: 'quantity_per_unit', type: 'decimal', precision: 12, scale: 4, default: 0 })
  quantityPerUnit: number;

  @Column({ name: 'waste_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  wasteRate: number;

  @Column({ name: 'total_quantity', type: 'decimal', precision: 15, scale: 4, default: 0 })
  totalQuantity: number;

  @Column({ name: 'total_quantity_with_waste', type: 'decimal', precision: 15, scale: 4, default: 0 })
  totalQuantityWithWaste: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 4, default: 0 })
  unitPrice: number;

  @Column({ name: 'total_cost', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalCost: number;

  @Column({ name: 'currency', default: 'CNY' })
  currency: string;

  @Column({ name: 'placement', nullable: true })
  placement: string;

  @Column({ name: 'sizes_applicable', type: 'jsonb', nullable: true })
  sizesApplicable: string[];

  @Column({ name: 'alternative_materials', type: 'jsonb', nullable: true })
  alternativeMaterials: AlternativeMaterial[];

  @Column({ name: 'supplier_id', type: 'uuid', nullable: true })
  supplierId: string;

  @Column({ name: 'supplier_name', nullable: true })
  supplierName: string;

  @Column({ name: 'lead_time_days', type: 'int', nullable: true })
  leadTimeDays: number;

  @Column({ name: 'is_critical', default: false })
  isCritical: boolean;

  @Column({ name: 'is_optional', default: false })
  isOptional: boolean;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'reference_image_url', nullable: true })
  referenceImageUrl: string;

  @Column({ name: 'tags', type: 'jsonb', nullable: true })
  tags: string[];
}

interface AlternativeMaterial {
  materialId: string;
  materialCode: string;
  name: string;
  priority: number;
  notes?: string;
}
