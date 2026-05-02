import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { StyleStatus } from '../../../common/enums/style-status.enum';
import { User } from '../../users/entities/user.entity';
import { Pattern } from '../../patterns/entities/pattern.entity';
import { Bom } from '../../boms/entities/bom.entity';
import { PurchaseOrder } from '../../purchases/entities/purchase-order.entity';
import { ProductionOrder } from '../../production/entities/production-order.entity';
import { StyleHistory } from './style-history.entity';
import { Communication } from '../../communications/entities/communication.entity';

@Entity('styles')
export class Style extends BaseEntity {
  @Column({ name: 'style_number', unique: true })
  styleNumber: string;

  @Column()
  name: string;

  @Column({ name: 'style_category', nullable: true })
  styleCategory: string;

  @Column({ name: 'season', nullable: true })
  season: string;

  @Column({ name: 'year', type: 'int', nullable: true })
  year: number;

  @Column({
    type: 'varchar', length: 50,
    default: StyleStatus.DRAFT,
  })
  status: StyleStatus;

  @Column({ name: 'target_gender', nullable: true })
  targetGender: string;

  @Column({ name: 'age_group', nullable: true })
  ageGroup: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'effect_image_urls', type: 'json', nullable: true })
  effectImageUrls: string[];

  @Column({ name: 'detail_image_urls', type: 'json', nullable: true })
  detailImageUrls: string[];

  @Column({ name: 'size_chart_url', nullable: true })
  sizeChartUrl: string;

  @Column({ name: 'size_specs', type: 'json', nullable: true })
  sizeSpecs: SizeSpec[];

  @Column({ name: 'process_requirements', type: 'text', nullable: true })
  processRequirements: string;

  @Column({ name: 'detail_notes', type: 'text', nullable: true })
  detailNotes: string;

  @Column({ name: 'reference_number', nullable: true })
  referenceNumber: string;

  @Column({ name: 'sample_size', nullable: true })
  sampleSize: string;

  @Column({ name: 'estimated_production_quantity', type: 'int', nullable: true })
  estimatedProductionQuantity: number;

  @Column({ name: 'target_unit_cost', type: 'decimal', precision: 12, scale: 2, nullable: true })
  targetUnitCost: number;

  @Column({ name: 'target_retail_price', type: 'decimal', precision: 12, scale: 2, nullable: true })
  targetRetailPrice: number;

  @Column({ name: 'priority', type: 'int', default: 1 })
  priority: number;

  @Column({ name: 'is_archived', default: false })
  isArchived: boolean;

  @Column({ name: 'is_reusable', default: false })
  isReusable: boolean;

  @Column({ name: 'tags', type: 'json', nullable: true })
  tags: string[];

  @Column({ name: 'designer_id', type: 'uuid', nullable: true })
  designerId: string;

  @ManyToOne(() => User, (user) => user.designedStyles)
  @JoinColumn({ name: 'designer_id' })
  designer: User;

  @OneToMany(() => Pattern, (pattern) => pattern.style)
  patterns: Pattern[];

  @OneToMany(() => Bom, (bom) => bom.style)
  boms: Bom[];

  @OneToMany(() => PurchaseOrder, (po) => po.style)
  purchaseOrders: PurchaseOrder[];

  @OneToMany(() => ProductionOrder, (po) => po.style)
  productionOrders: ProductionOrder[];

  @OneToMany(() => StyleHistory, (history) => history.style)
  histories: StyleHistory[];

  @OneToMany(() => Communication, (comm) => comm.relatedStyle)
  communications: Communication[];
}

interface SizeSpec {
  size: string;
  measurements: { [key: string]: number };
}
