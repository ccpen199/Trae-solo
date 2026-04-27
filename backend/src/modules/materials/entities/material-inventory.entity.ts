import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Material } from './material.entity';

@Entity('material_inventories')
export class MaterialInventory extends BaseEntity {
  @Column({ name: 'material_id', type: 'uuid' })
  materialId: string;

  @ManyToOne(() => Material, (material) => material.inventories)
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @Column({ name: 'warehouse_code', nullable: true })
  warehouseCode: string;

  @Column({ name: 'warehouse_name', nullable: true })
  warehouseName: string;

  @Column({ name: 'location', nullable: true })
  location: string;

  @Column({ name: 'lot_number', nullable: true })
  lotNumber: string;

  @Column({ name: 'batch_number', nullable: true })
  batchNumber: string;

  @Column({ name: 'quantity_on_hand', type: 'decimal', precision: 15, scale: 4, default: 0 })
  quantityOnHand: number;

  @Column({ name: 'quantity_reserved', type: 'decimal', precision: 15, scale: 4, default: 0 })
  quantityReserved: number;

  @Column({ name: 'quantity_allocated', type: 'decimal', precision: 15, scale: 4, default: 0 })
  quantityAllocated: number;

  @Column({ name: 'quantity_in_transit', type: 'decimal', precision: 15, scale: 4, default: 0 })
  quantityInTransit: number;

  @Column({ name: 'quantity_available', type: 'decimal', precision: 15, scale: 4, default: 0 })
  quantityAvailable: number;

  @Column({ name: 'unit' })
  unit: string;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 12, scale: 4, default: 0 })
  unitCost: number;

  @Column({ name: 'total_value', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalValue: number;

  @Column({ name: 'currency', default: 'CNY' })
  currency: string;

  @Column({ name: 'expiry_date', type: 'timestamp', nullable: true })
  expiryDate: Date;

  @Column({ name: 'received_date', type: 'timestamp', nullable: true })
  receivedDate: Date;

  @Column({ name: 'status', default: 'active' })
  status: string;

  @Column({ name: 'is_quality_checked', default: false })
  isQualityChecked: boolean;

  @Column({ name: 'quality_status', nullable: true })
  qualityStatus: string;

  @Column({ name: 'quality_check_date', type: 'timestamp', nullable: true })
  qualityCheckDate: Date;

  @Column({ name: 'quality_check_by', type: 'uuid', nullable: true })
  qualityCheckBy: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'custom_attributes', type: 'jsonb', nullable: true })
  customAttributes: { [key: string]: any };
}
