import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { ProductBatch } from './ProductBatch.js';
import { Dispute } from './Dispute.js';
import { TraceabilityEventType } from '../types/common.js';

@Entity('traceability_records')
@Index(['batchId', 'eventTimestamp'], { unique: false })
@Index(['disputeId'], { unique: false })
export class TraceabilityRecord extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  recordNumber: string;

  @Column({
    type: 'enum',
    enum: TraceabilityEventType,
  })
  eventType: TraceabilityEventType;

  @Column({ type: 'timestamp' })
  eventTimestamp: Date;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  quantity: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  temperature: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  humidity: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  operatorName: string | null;

  @Column({ type: 'uuid', nullable: true })
  operatorId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  evidence: Array<{
    type: 'image' | 'document' | 'certificate' | 'signature';
    title: string;
    url: string;
    timestamp: Date;
    notes: string | null;
  }> | null;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'boolean', default: false })
  isDisputeEvidence: boolean;

  @Column({ type: 'uuid', nullable: true })
  batchId: string | null;

  @ManyToOne(() => ProductBatch, (batch) => batch.traceabilityRecords, { nullable: true })
  batch: ProductBatch | null;

  @Column({ type: 'uuid', nullable: true })
  disputeId: string | null;

  @ManyToOne(() => Dispute, (dispute) => dispute.traceabilityRecords, { nullable: true })
  dispute: Dispute | null;
}
