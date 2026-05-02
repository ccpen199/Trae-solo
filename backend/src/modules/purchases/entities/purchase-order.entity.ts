import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PurchaseOrderStatus } from '../../../common/enums/purchase-status.enum';
import { User } from '../../users/entities/user.entity';
import { Style } from '../../styles/entities/style.entity';
import { Bom } from '../../boms/entities/bom.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';
import { MaterialReceipt } from '../../materials/entities/material-receipt.entity';

@Entity('purchase_orders')
export class PurchaseOrder extends BaseEntity {
  @Column({ name: 'po_number', unique: true })
  poNumber: string;

  @Column({ name: 'style_id', type: 'uuid', nullable: true })
  styleId: string;

  @ManyToOne(() => Style, (style) => style.purchaseOrders)
  @JoinColumn({ name: 'style_id' })
  style: Style;

  @Column({ name: 'bom_id', type: 'uuid', nullable: true })
  bomId: string;

  @ManyToOne(() => Bom, (bom) => bom.purchaseOrders)
  @JoinColumn({ name: 'bom_id' })
  bom: Bom;

  @Column({ name: 'purchaser_id', type: 'uuid', nullable: true })
  purchaserId: string;

  @ManyToOne(() => User, (user) => user.purchaseOrders)
  @JoinColumn({ name: 'purchaser_id' })
  purchaser: User;

  @Column({
    type: 'varchar', length: 50,
    default: PurchaseOrderStatus.DRAFT,
  })
  status: PurchaseOrderStatus;

  @Column({ name: 'supplier_id', type: 'uuid', nullable: true })
  supplierId: string;

  @Column({ name: 'supplier_name' })
  supplierName: string;

  @Column({ name: 'supplier_contact', nullable: true })
  supplierContact: string;

  @Column({ name: 'supplier_phone', nullable: true })
  supplierPhone: string;

  @Column({ name: 'supplier_email', nullable: true })
  supplierEmail: string;

  @Column({ name: 'order_date', type: 'datetime', nullable: true })
  orderDate: Date;

  @Column({ name: 'expected_delivery_date', type: 'datetime', nullable: true })
  expectedDeliveryDate: Date;

  @Column({ name: 'actual_delivery_date', type: 'datetime', nullable: true })
  actualDeliveryDate: Date;

  @Column({ name: 'payment_terms', nullable: true })
  paymentTerms: string;

  @Column({ name: 'shipping_method', nullable: true })
  shippingMethod: string;

  @Column({ name: 'shipping_address', type: 'text', nullable: true })
  shippingAddress: string;

  @Column({ name: 'billing_address', type: 'text', nullable: true })
  billingAddress: string;

  @Column({ name: 'currency', default: 'CNY' })
  currency: string;

  @Column({ name: 'subtotal', type: 'decimal', precision: 15, scale: 2, default: 0 })
  subtotal: number;

  @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @Column({ name: 'tax_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ name: 'shipping_cost', type: 'decimal', precision: 15, scale: 2, default: 0 })
  shippingCost: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ name: 'amount_paid', type: 'decimal', precision: 15, scale: 2, default: 0 })
  amountPaid: number;

  @Column({ name: 'is_urgent', default: false })
  isUrgent: boolean;

  @Column({ name: 'priority', type: 'int', default: 1 })
  priority: number;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ name: 'approved_at', type: 'datetime', nullable: true })
  approvedAt: Date;

  @Column({ name: 'sent_to_supplier_at', type: 'datetime', nullable: true })
  sentToSupplierAt: Date;

  @Column({ name: 'supplier_confirmed_at', type: 'datetime', nullable: true })
  supplierConfirmedAt: Date;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'internal_notes', type: 'text', nullable: true })
  internalNotes: string;

  @Column({ name: 'tags', type: 'json', nullable: true })
  tags: string[];

  @Column({ name: 'custom_attributes', type: 'json', nullable: true })
  customAttributes: { [key: string]: any };

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchaseOrder, { cascade: true })
  items: PurchaseOrderItem[];

  @OneToMany(() => MaterialReceipt, (receipt) => receipt.purchaseOrder)
  receipts: MaterialReceipt[];
}
