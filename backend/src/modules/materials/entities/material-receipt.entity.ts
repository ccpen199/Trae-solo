import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PurchaseOrder } from '../../purchases/entities/purchase-order.entity';
import { Material } from './material.entity';

@Entity('material_receipts')
export class MaterialReceipt extends BaseEntity {
  @Column({ name: 'receipt_number', unique: true })
  receiptNumber: string;

  @Column({ name: 'purchase_order_id', type: 'uuid', nullable: true })
  purchaseOrderId: string;

  @ManyToOne(() => PurchaseOrder, (po) => po.receipts)
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrder;

  @Column({ name: 'po_item_id', type: 'uuid', nullable: true })
  poItemId: string;

  @Column({ name: 'material_id', type: 'uuid' })
  materialId: string;

  @ManyToOne(() => Material, (material) => material.receipts)
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @Column({ name: 'material_code', nullable: true })
  materialCode: string;

  @Column()
  materialName: string;

  @Column({ name: 'specification', type: 'text', nullable: true })
  specification: string;

  @Column({ name: 'lot_number', nullable: true })
  lotNumber: string;

  @Column({ name: 'batch_number', nullable: true })
  batchNumber: string;

  @Column({ name: 'unit' })
  unit: string;

  @Column({ name: 'quantity_shipped', type: 'decimal', precision: 15, scale: 4, default: 0 })
  quantityShipped: number;

  @Column({ name: 'quantity_received', type: 'decimal', precision: 15, scale: 4, default: 0 })
  quantityReceived: number;

  @Column({ name: 'quantity_accepted', type: 'decimal', precision: 15, scale: 4, default: 0 })
  quantityAccepted: number;

  @Column({ name: 'quantity_rejected', type: 'decimal', precision: 15, scale: 4, default: 0 })
  quantityRejected: number;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 4, default: 0 })
  unitPrice: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ name: 'currency', default: 'CNY' })
  currency: string;

  @Column({ name: 'supplier_id', type: 'uuid', nullable: true })
  supplierId: string;

  @Column({ name: 'supplier_name', nullable: true })
  supplierName: string;

  @Column({ name: 'warehouse_code', nullable: true })
  warehouseCode: string;

  @Column({ name: 'warehouse_name', nullable: true })
  warehouseName: string;

  @Column({ name: 'location', nullable: true })
  location: string;

  @Column({ name: 'received_at', type: 'timestamp', nullable: true })
  receivedAt: Date;

  @Column({ name: 'received_by', type: 'uuid', nullable: true })
  receivedBy: string;

  @Column({ name: 'inspected_at', type: 'timestamp', nullable: true })
  inspectedAt: Date;

  @Column({ name: 'inspected_by', type: 'uuid', nullable: true })
  inspectedBy: string;

  @Column({ name: 'status', default: 'pending' })
  status: string;

  @Column({ name: 'is_quality_checked', default: false })
  isQualityChecked: boolean;

  @Column({ name: 'quality_status', nullable: true })
  qualityStatus: string;

  @Column({ name: 'quality_report_url', nullable: true })
  qualityReportUrl: string;

  @Column({ name: 'expiry_date', type: 'timestamp', nullable: true })
  expiryDate: Date;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'custom_attributes', type: 'jsonb', nullable: true })
  customAttributes: { [key: string]: any };
}
