import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Enterprise } from './Enterprise';

export type LogisticsStatus = 'created' | 'transit' | 'transferring' | 'delivered' | 'abnormal';

export type LogisticsLink = 'production' | 'initiator' | 'transfer' | 'receiver' | 'unmatched';

@Entity('logistics_orders')
export class LogisticsOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  logisticsNo: string;

  @Column({ nullable: true })
  proxyNo: string;

  @Column({ type: 'uuid', nullable: true })
  productionEnterpriseId: string | null;

  @Column({ nullable: true })
  productionEnterpriseCode: string;

  @Column({ nullable: true })
  productionEnterpriseName: string;

  @Column({ type: 'uuid', nullable: true })
  initiatorEnterpriseId: string | null;

  @Column({ nullable: true })
  initiatorEnterpriseCode: string;

  @Column({ nullable: true })
  initiatorEnterpriseName: string;

  @Column({ type: 'uuid', nullable: true })
  transferEnterpriseId: string | null;

  @Column({ nullable: true })
  transferEnterpriseCode: string;

  @Column({ nullable: true })
  transferEnterpriseName: string;

  @Column({ type: 'uuid', nullable: true })
  receiverEnterpriseId: string | null;

  @Column({ nullable: true })
  receiverEnterpriseCode: string;

  @Column({ nullable: true })
  receiverEnterpriseName: string;

  @Column()
  goodsName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  quantity: number | null;

  @Column({ nullable: true })
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  volume: number | null;

  @Column({ type: 'date', nullable: true })
  shipmentDate: Date | null;

  @Column({ type: 'date', nullable: true })
  expectedDeliveryDate: Date | null;

  @Column({ type: 'text', nullable: true })
  shipmentAddress: string;

  @Column({ type: 'text', nullable: true })
  deliveryAddress: string;

  @Column({ type: 'varchar', length: 50, default: 'created' })
  status: LogisticsStatus;

  @Column({ type: 'varchar', length: 50, default: 'unmatched' })
  currentLink: LogisticsLink;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ type: 'boolean', default: false })
  isUnmatched: boolean;

  @Column({ type: 'uuid', nullable: true })
  createdByEnterpriseId: string | null;

  @Column({ nullable: true })
  createdByEnterpriseCode: string;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId: string | null;

  @Column({ nullable: true })
  sourceType: string;

  @Column({ type: 'text', nullable: true })
  unmatchedReason: string;

  @ManyToOne(() => Enterprise, { nullable: true })
  @JoinColumn({ name: 'productionEnterpriseId' })
  productionEnterprise: Enterprise | null;

  @ManyToOne(() => Enterprise, { nullable: true })
  @JoinColumn({ name: 'initiatorEnterpriseId' })
  initiatorEnterprise: Enterprise | null;

  @ManyToOne(() => Enterprise, { nullable: true })
  @JoinColumn({ name: 'transferEnterpriseId' })
  transferEnterprise: Enterprise | null;

  @ManyToOne(() => Enterprise, { nullable: true })
  @JoinColumn({ name: 'receiverEnterpriseId' })
  receiverEnterprise: Enterprise | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
