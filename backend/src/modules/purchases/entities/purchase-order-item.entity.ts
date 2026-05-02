import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { Material } from '../../materials/entities/material.entity';

@Entity('purchase_order_items')
export class PurchaseOrderItem extends BaseEntity {
  @Column({ name: 'purchase_order_id', type: 'uuid' })
  purchaseOrderId: string;

  @ManyToOne(() => PurchaseOrder, (po) => po.items)
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrder;

  @Column({ name: 'material_id', type: 'uuid', nullable: true })
  materialId: string;

  @ManyToOne(() => Material)
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @Column({ name: 'line_number', type: 'int' })
  lineNumber: number;

  @Column({ name: 'material_code', nullable: true })
  materialCode: string;

  @Column()
  name: string;

  @Column({ name: 'specification', type: 'text', nullable: true })
  specification: string;

  @Column({ name: 'color', nullable: true })
  color: string;

  @Column({ name: 'unit' })
  unit: string;

  @Column({ name: 'quantity_ordered', type: 'decimal', precision: 15, scale: 4, default: 0 })
  quantityOrdered: number;

  @Column({ name: 'quantity_received', type: 'decimal', precision: 15, scale: 4, default: 0 })
  quantityReceived: number;

  @Column({ name: 'quantity_rejected', type: 'decimal', precision: 15, scale: 4, default: 0 })
  quantityRejected: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 4, default: 0 })
  unitPrice: number;

  @Column({ name: 'subtotal', type: 'decimal', precision: 15, scale: 2, default: 0 })
  subtotal: number;

  @Column({ name: 'currency', default: 'CNY' })
  currency: string;

  @Column({ name: 'bom_item_id', type: 'uuid', nullable: true })
  bomItemId: string;

  @Column({ name: 'supplier_item_code', nullable: true })
  supplierItemCode: string;

  @Column({ name: 'expected_delivery_date', type: 'datetime', nullable: true })
  expectedDeliveryDate: Date;

  @Column({ name: 'is_received', default: false })
  isReceived: boolean;

  @Column({ name: 'is_critical', default: false })
  isCritical: boolean;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'custom_attributes', type: 'json', nullable: true })
  customAttributes: { [key: string]: any };
}
